const { app, BrowserWindow, dialog, ipcMain, shell, net, nativeTheme, protocol } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const os = require('node:os')
const { pathToFileURL } = require('node:url')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')

/* 本地文件预览协议：渲染进程通过 wallhaven-file:///C:/... 读取已下载的图片 */
protocol.registerSchemesAsPrivileged([
  { scheme: 'wallhaven-file', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
])

const execFileAsync = promisify(execFile)
const API_BASE = 'https://wallhaven.cc/api/v1'
const STORE_FILE = 'settings.json'
const THEME_MODES = ['system', 'light', 'dark', 'contrast']
let mainWindow

/* ============ 便携化存储 ============
 * 打包后把 userData（设置、下载记录、Chromium 缓存）放到安装目录下的 data 文件夹，
 * 避免污染 C 盘。若安装目录不可写（例如装进 Program Files），回退到系统默认位置。
 */
let runtimeRoot = null
let dataDir = null

function probeWritable(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true })
    const probe = path.join(dir, '.wh-write-test')
    fs.writeFileSync(probe, 'ok')
    fs.rmSync(probe, { force: true })
    return true
  } catch (_) {
    return false
  }
}

function configureStoragePaths() {
  if (!app.isPackaged) return
  const exeDir = path.dirname(app.getPath('exe'))
  const candidate = path.join(exeDir, 'data')
  if (!probeWritable(candidate)) return
  runtimeRoot = exeDir
  dataDir = candidate
  app.setPath('userData', dataDir)
  try { app.setPath('sessionData', dataDir) } catch (_) {}
  try { app.setPath('crashDumps', path.join(dataDir, 'crash')) } catch (_) {}
  try { fs.mkdirSync(path.join(dataDir, 'crash'), { recursive: true }) } catch (_) {}
}

configureStoragePaths()

function defaultDownloadPath() {
  if (runtimeRoot) return path.join(runtimeRoot, 'downloads')
  return path.join(app.getPath('pictures'), 'Wallhaven')
}

let store = {
  apiKey: '',
  username: '',
  downloadPath: defaultDownloadPath(),
  theme: 'system'
}

function storePath() {
  return path.join(app.getPath('userData'), STORE_FILE)
}

function decodeSecret(value) {
  if (!value) return ''
  try {
    if (require('electron').safeStorage.isEncryptionAvailable()) {
      return require('electron').safeStorage.decryptString(Buffer.from(value, 'base64'))
    }
  } catch (_) {}
  return value
}

function encodeSecret(value) {
  if (!value) return ''
  try {
    if (require('electron').safeStorage.isEncryptionAvailable()) {
      return require('electron').safeStorage.encryptString(value).toString('base64')
    }
  } catch (_) {}
  return value
}

function readStore() {
  try {
    const raw = JSON.parse(fs.readFileSync(storePath(), 'utf8'))
    store = {
      ...store,
      ...raw,
      apiKey: decodeSecret(raw.apiKey)
    }
  } catch (_) {}
}

async function writeStore() {
  await fsp.mkdir(path.dirname(storePath()), { recursive: true })
  await fsp.writeFile(storePath(), JSON.stringify({ ...store, apiKey: encodeSecret(store.apiKey) }, null, 2), 'utf8')
}

function resolveTheme() {
  const mode = THEME_MODES.includes(store.theme) ? store.theme : 'system'
  if (mode === 'system') return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  return mode
}

function publicConfig() {
  return {
    apiKeySet: Boolean(store.apiKey),
    username: store.username,
    downloadPath: store.downloadPath,
    theme: store.theme,
    resolvedTheme: resolveTheme(),
    systemTheme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  }
}

function sanitizePathPart(value) {
  return String(value || '').replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').trim() || 'wallpaper'
}

function assertWallhavenUrl(value) {
  const parsed = new URL(value)
  if (!['wallhaven.cc', 'w.wallhaven.cc', 'th.wallhaven.cc', 'images.unsplash.com'].includes(parsed.hostname)) {
    throw new Error('只允许下载 Wallhaven 图片地址')
  }
  return parsed.toString()
}

async function requestApi(endpoint, query = {}) {
  if (!String(endpoint).startsWith('/')) endpoint = `/${endpoint}`
  if (!endpoint.startsWith('/')) throw new Error('无效的 API 路径')
  const url = new URL(`${API_BASE}${endpoint}`)
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  })
  const headers = { Accept: 'application/json' }
  if (store.apiKey) headers['X-API-Key'] = store.apiKey
  const response = await net.fetch(url.toString(), { headers })
  const text = await response.text()
  let payload
  try {
    payload = text ? JSON.parse(text) : {}
  } catch (_) {
    payload = { error: text }
  }
  if (!response.ok) {
    const message = payload?.error || payload?.message || `请求失败（${response.status}）`
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  return payload
}

const downloadTasks = new Map()
const taskControllers = new Map()
let downloadSeq = 0
const DOWNLOADS_FILE = 'downloads.json'

function downloadsPath() {
  return path.join(app.getPath('userData'), DOWNLOADS_FILE)
}

function readDownloads() {
  try {
    const raw = JSON.parse(fs.readFileSync(downloadsPath(), 'utf8'))
    if (!Array.isArray(raw)) return
    for (const task of raw) {
      if (!task || !task.taskId) continue
      if (task.status === 'downloading' || task.status === 'queued') task.status = 'interrupted'
      task.speed = 0
      downloadTasks.set(task.taskId, task)
    }
  } catch (_) {}
}

let saveDownloadsTimer = null
function scheduleSaveDownloads() {
  if (saveDownloadsTimer) return
  saveDownloadsTimer = setTimeout(() => {
    saveDownloadsTimer = null
    flushDownloads()
  }, 400)
}

function flushDownloads() {
  try {
    const list = [...downloadTasks.values()].sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0)).slice(0, 100)
    fs.writeFileSync(downloadsPath(), JSON.stringify(list, null, 2), 'utf8')
  } catch (_) {}
}

function publicTask(task) {
  return {
    taskId: task.taskId,
    wallpaperId: task.wallpaperId,
    title: task.title || `Wallhaven ${task.wallpaperId}`,
    thumb: task.thumb || '',
    status: task.status,
    receivedBytes: task.receivedBytes || 0,
    totalBytes: task.totalBytes || 0,
    speed: task.speed || 0,
    filePath: task.filePath || '',
    applyTarget: task.applyTarget || 'none',
    wallpaperSet: Boolean(task.wallpaperSet),
    lockScreenSet: Boolean(task.lockScreenSet),
    error: task.error || '',
    startedAt: task.startedAt || 0,
    finishedAt: task.finishedAt || 0
  }
}

function emitTask(task) {
  scheduleSaveDownloads()
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('download:update', publicTask(task))
  }
}

async function runDownload(task) {
  const controller = new AbortController()
  taskControllers.set(task.taskId, controller)
  task.status = 'downloading'
  task.startedAt = Date.now()
  task.finishedAt = 0
  task.receivedBytes = 0
  task.totalBytes = 0
  task.speed = 0
  task.error = ''
  task.wallpaperSet = false
  task.lockScreenSet = false
  emitTask(task)

  let lastEmit = 0
  let lastBytes = 0
  let lastTime = Date.now()
  let stream = null

  try {
    const response = await net.fetch(task.url, { signal: controller.signal })
    if (!response.ok) throw new Error(`图片下载失败（${response.status}）`)
    task.totalBytes = Number(response.headers.get('content-length')) || 0

    stream = fs.createWriteStream(task.filePath)
    const reader = response.body?.getReader?.()
    if (!reader) {
      const buffer = Buffer.from(await response.arrayBuffer())
      await new Promise((resolve, reject) => { stream.on('error', reject); stream.end(buffer, () => resolve()) })
      task.receivedBytes = buffer.byteLength
    } else {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        await new Promise((resolve, reject) => {
          stream.write(Buffer.from(value), (error) => (error ? reject(error) : resolve()))
        })
        task.receivedBytes += value.byteLength
        const now = Date.now()
        if (now - lastTime >= 500) {
          const instant = (task.receivedBytes - lastBytes) / ((now - lastTime) / 1000)
          task.speed = task.speed ? task.speed * 0.4 + instant * 0.6 : instant
          lastBytes = task.receivedBytes
          lastTime = now
        }
        if (now - lastEmit >= 160) {
          lastEmit = now
          emitTask(task)
        }
      }
      await new Promise((resolve, reject) => { stream.on('error', reject); stream.end(() => resolve()) })
    }
    stream = null

    if (controller.signal.aborted) throw Object.assign(new Error('已取消'), { canceled: true })

    task.status = 'completed'
    task.finishedAt = Date.now()
    task.speed = 0
    if (task.totalBytes) task.receivedBytes = task.totalBytes
    emitTask(task)

    const target = task.applyTarget || 'none'
    const applyWallpaper = target === 'wallpaper' || target === 'both'
    const applyLockScreen = target === 'lockscreen' || target === 'both'
    if (applyWallpaper || applyLockScreen) {
      const failures = []
      if (applyWallpaper) {
        try {
          await setWallpaper(task.filePath)
          task.wallpaperSet = true
        } catch (error) {
          failures.push(error?.message || '设置桌面壁纸失败')
        }
      }
      if (applyLockScreen) {
        try {
          await setLockScreen(task.filePath)
          task.lockScreenSet = true
        } catch (error) {
          failures.push(error?.message || '设置锁屏失败')
        }
      }
      if (failures.length) task.error = failures.join('；')
      emitTask(task)
    }
  } catch (error) {
    try { stream?.destroy() } catch (_) {}
    try { await fsp.rm(task.filePath, { force: true }) } catch (_) {}
    if (controller.signal.aborted || error?.canceled || error?.name === 'AbortError') {
      task.status = 'canceled'
      task.error = ''
    } else {
      task.status = 'error'
      task.error = error?.message || '下载失败'
    }
    task.speed = 0
    task.finishedAt = Date.now()
    emitTask(task)
  } finally {
    taskControllers.delete(task.taskId)
  }
}

function downloadTargetPath(id, extension) {
  const folder = store.downloadPath || defaultDownloadPath()
  const safeId = sanitizePathPart(id)
  const ext = sanitizePathPart(extension || 'jpg').replace('.', '')
  return { folder, filePath: path.join(folder, `wallhaven-${safeId}.${ext}`) }
}

/* 在下载目录中查找该壁纸是否已存在（扩展名可能不同） */
function findExistingDownload(id) {
  const folder = store.downloadPath || defaultDownloadPath()
  const prefix = `wallhaven-${sanitizePathPart(id)}.`
  try {
    const hit = fs.readdirSync(folder).find((name) => name.toLowerCase().startsWith(prefix.toLowerCase()))
    if (hit) return path.join(folder, hit)
  } catch (_) {}
  return null
}

const APPLY_TARGETS = ['none', 'wallpaper', 'lockscreen', 'both']

async function startDownloadTask(payload = {}) {
  const { id, imageUrl, extension, title, thumb, applyTarget = 'none', taskId: retryId } = payload
  const target = APPLY_TARGETS.includes(applyTarget) ? applyTarget : 'none'
  const url = assertWallhavenUrl(imageUrl)
  const { folder, filePath } = downloadTargetPath(id, extension)
  await fsp.mkdir(folder, { recursive: true })

  if (!retryId) {
    for (const existing of downloadTasks.values()) {
      if (existing.wallpaperId === id && (existing.status === 'downloading' || existing.status === 'queued')) {
        if (target !== 'none' && existing.applyTarget !== target) {
          existing.applyTarget = target
          emitTask(existing)
        }
        return publicTask(existing)
      }
    }
  }

  let task
  if (retryId && downloadTasks.has(retryId)) {
    task = downloadTasks.get(retryId)
    Object.assign(task, { url, filePath, applyTarget: target, status: 'queued', error: '', receivedBytes: 0, totalBytes: 0, speed: 0, wallpaperSet: false, lockScreenSet: false })
  } else {
    task = {
      taskId: `dl_${Date.now().toString(36)}_${(++downloadSeq).toString(36)}`,
      wallpaperId: id,
      title: title || `Wallhaven ${id}`,
      thumb: thumb || '',
      url,
      filePath,
      applyTarget: target,
      status: 'queued',
      receivedBytes: 0,
      totalBytes: 0,
      speed: 0,
      error: '',
      wallpaperSet: false,
      lockScreenSet: false,
      startedAt: Date.now(),
      finishedAt: 0
    }
    downloadTasks.set(task.taskId, task)
  }
  emitTask(task)
  runDownload(task).catch(() => {})
  return publicTask(task)
}

async function setWallpaper(filePath) {
  if (!fs.existsSync(filePath)) throw new Error('壁纸文件不存在')
  if (process.platform === 'win32') {
    const escaped = filePath.replace(/'/g, "''")
    const script = `Add-Type @'\nusing System;\nusing System.Runtime.InteropServices;\npublic class Wallpaper { [DllImport("user32.dll", SetLastError=true)] public static extern bool SystemParametersInfo(int action, int param, string path, int flags); }\n'@; [Wallpaper]::SystemParametersInfo(20, 0, '${escaped}', 3)`
    await execFileAsync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true })
    return
  }
  if (process.platform === 'darwin') {
    await execFileAsync('osascript', ['-e', `tell application "Finder" to set desktop picture to POSIX file "${filePath.replace(/"/g, '\\"')}"`])
    return
  }
  await execFileAsync('gsettings', ['set', 'org.gnome.desktop.background', 'picture-uri', `file://${filePath}`])
}

/* 设置 Windows 锁屏图片（WinRT API，无需管理员权限） */
const LOCK_SCREEN_PS = `
param([string]$ImagePath)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] | Out-Null
[Windows.System.UserProfile.LockScreen, Windows.System.UserProfile, ContentType=WindowsRuntime] | Out-Null
$methods = [System.WindowsRuntimeSystemExtensions].GetMethods()
$asTaskGeneric = ($methods | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
$asTaskAction = ($methods | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' })[0]
$op = [Windows.Storage.StorageFile]::GetFileFromPathAsync($ImagePath)
$asTask = $asTaskGeneric.MakeGenericMethod([Windows.Storage.StorageFile])
$netTask = $asTask.Invoke($null, @($op))
$netTask.Wait(60000) | Out-Null
$file = $netTask.Result
$action = [Windows.System.UserProfile.LockScreen]::SetImageFileAsync($file)
$netTask2 = $asTaskAction.Invoke($null, @($action))
$netTask2.Wait(60000) | Out-Null
`

let lockScreenScriptPath = null
function lockScreenScript() {
  if (!lockScreenScriptPath) {
    lockScreenScriptPath = path.join(app.getPath('userData'), 'set-lockscreen.ps1')
    fs.mkdirSync(path.dirname(lockScreenScriptPath), { recursive: true })
    fs.writeFileSync(lockScreenScriptPath, LOCK_SCREEN_PS, 'utf8')
  }
  return lockScreenScriptPath
}

async function setLockScreen(filePath) {
  if (!fs.existsSync(filePath)) throw new Error('锁屏文件不存在')
  if (process.platform === 'win32') {
    try {
      await execFileAsync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', lockScreenScript(), '-ImagePath', filePath], { windowsHide: true, timeout: 120000 })
    } catch (error) {
      const message = String(error?.stderr || error?.message || '')
      throw new Error(/拒绝|denied|Access/i.test(message) ? '设置锁屏失败：系统拒绝了请求，请确认图片格式受支持（JPG/PNG）' : '设置锁屏失败，请重试')
    }
    return
  }
  throw new Error('当前系统暂不支持设置锁屏')
}

function appIconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, 'icon.png')
}

function createWindow() {
  const iconPath = appIconPath()
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0a111d',
    title: 'Wallhaven Studio',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    transparent: false,
    hasShadow: true,
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.setHasShadow(true)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (!app.isPackaged) {
    mainWindow.loadURL('http://127.0.0.1:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

function registerWindowControls() {
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.handle('window:close', () => mainWindow?.close())
  ipcMain.handle('window:is-maximized', () => Boolean(mainWindow?.isMaximized()))
  ipcMain.handle('theme:get', () => ({ mode: store.theme, resolved: resolveTheme(), system: nativeTheme.shouldUseDarkColors ? 'dark' : 'light' }))
  ipcMain.handle('theme:set', async (_, mode) => {
    const next = String(mode || '')
    if (!THEME_MODES.includes(next)) throw new Error('不支持的主题模式')
    store.theme = next
    await writeStore()
    return { mode: store.theme, resolved: resolveTheme(), system: nativeTheme.shouldUseDarkColors ? 'dark' : 'light' }
  })
}

function watchSystemTheme() {
  nativeTheme.on('updated', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    mainWindow.webContents.send('theme:system-changed', {
      mode: store.theme,
      resolved: resolveTheme(),
      system: nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    })
  })
}

function registerIpc() {
  ipcMain.handle('config:get', () => publicConfig())
  ipcMain.handle('config:save', async (_, patch = {}) => {
    if (Object.prototype.hasOwnProperty.call(patch, 'apiKey')) store.apiKey = String(patch.apiKey || '').trim()
    if (Object.prototype.hasOwnProperty.call(patch, 'username')) store.username = String(patch.username || '').trim()
    if (Object.prototype.hasOwnProperty.call(patch, 'downloadPath') && patch.downloadPath) store.downloadPath = patch.downloadPath
    if (Object.prototype.hasOwnProperty.call(patch, 'theme')) {
      const nextTheme = String(patch.theme || '')
      if (THEME_MODES.includes(nextTheme)) store.theme = nextTheme
    }
    await writeStore()
    return publicConfig()
  })
  ipcMain.handle('api:request', async (_, { endpoint, query }) => requestApi(endpoint, query))
  ipcMain.handle('download:choose-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      defaultPath: store.downloadPath || defaultDownloadPath(),
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || !result.filePaths[0]) return null
    store.downloadPath = result.filePaths[0]
    await writeStore()
    return store.downloadPath
  })
  ipcMain.handle('download:check', async (_, payload = {}) => {
    const { id, extension } = payload
    if (!id) return { exists: false }
    for (const task of downloadTasks.values()) {
      if (task.wallpaperId === id && (task.status === 'downloading' || task.status === 'queued')) {
        return { exists: false, active: true, task: publicTask(task) }
      }
    }
    const existing = findExistingDownload(id)
    if (existing) {
      return { exists: true, filePath: existing, folder: store.downloadPath || defaultDownloadPath() }
    }
    const { folder, filePath } = downloadTargetPath(id, extension)
    return { exists: false, filePath, folder }
  })
  ipcMain.handle('download:wallpaper', async (_, payload) => startDownloadTask(payload))
  ipcMain.handle('download:set-wallpaper', async (_, payload) => startDownloadTask({ ...payload, applyTarget: 'wallpaper' }))
  ipcMain.handle('download:set-lockscreen', async (_, payload) => startDownloadTask({ ...payload, applyTarget: 'lockscreen' }))
  ipcMain.handle('download:set-both', async (_, payload) => startDownloadTask({ ...payload, applyTarget: 'both' }))
  ipcMain.handle('download:list', () => [...downloadTasks.values()]
    .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
    .map(publicTask))
  ipcMain.handle('download:cancel', (_, taskId) => {
    const controller = taskControllers.get(taskId)
    const task = downloadTasks.get(taskId)
    if (controller) controller.abort()
    else if (task && (task.status === 'queued' || task.status === 'interrupted')) {
      task.status = 'canceled'
      task.finishedAt = Date.now()
      emitTask(task)
    }
    return true
  })
  ipcMain.handle('download:clear-finished', () => {
    for (const [taskId, task] of downloadTasks) {
      if (['completed', 'error', 'canceled', 'interrupted'].includes(task.status)) downloadTasks.delete(taskId)
    }
    scheduleSaveDownloads()
    return true
  })
  ipcMain.handle('download:file-info', async (_, filePath) => {
    if (typeof filePath !== 'string' || !filePath) return { exists: false, size: 0 }
    try {
      const stat = await fsp.stat(filePath)
      return { exists: stat.isFile(), size: stat.isFile() ? stat.size : 0 }
    } catch (_) {
      return { exists: false, size: 0 }
    }
  })
  ipcMain.handle('download:remove', async (_, taskId, options = {}) => {
    const task = downloadTasks.get(taskId)
    const deleteFile = Boolean(options?.deleteFile)
    let fileDeleted = false
    let error = ''
    if (task && deleteFile && typeof task.filePath === 'string' && task.filePath) {
      const base = path.basename(task.filePath)
      const stillUsed = [...downloadTasks.values()].some((other) => other.taskId !== taskId && other.filePath === task.filePath)
      if (!base.toLowerCase().startsWith('wallhaven-')) {
        error = '出于安全考虑，未删除非本应用下载的文件'
      } else if (stillUsed) {
        error = '该文件仍被其他下载记录引用，已保留本地文件'
      } else {
        try {
          await fsp.rm(task.filePath, { force: true })
          fileDeleted = true
        } catch (err) {
          error = err?.message || '删除本地文件失败'
        }
      }
    }
    downloadTasks.delete(taskId)
    scheduleSaveDownloads()
    return { removed: true, fileDeleted, error }
  })
  ipcMain.handle('download:retry', async (_, taskId) => {
    const task = downloadTasks.get(taskId)
    if (!task) throw new Error('任务不存在')
    if (task.status === 'downloading' || task.status === 'queued') return publicTask(task)
    return startDownloadTask({
      id: task.wallpaperId,
      imageUrl: task.url,
      extension: path.extname(task.filePath).replace('.', '') || 'jpg',
      title: task.title,
      thumb: task.thumb,
      applyTarget: task.applyTarget || 'none',
      taskId: task.taskId
    })
  })
  ipcMain.handle('download:open-folder', async () => {
    await fsp.mkdir(store.downloadPath, { recursive: true })
    return shell.openPath(store.downloadPath)
  })
  ipcMain.handle('download:open-file', async (_, filePath) => {
    if (typeof filePath !== 'string' || !filePath) return 'invalid path'
    return shell.openPath(filePath)
  })
  ipcMain.handle('download:show-in-folder', (_, filePath) => {
    if (typeof filePath !== 'string' || !filePath) return false
    shell.showItemInFolder(filePath)
    return true
  })
  ipcMain.handle('system:set-wallpaper', async (_, filePath) => setWallpaper(filePath))
  ipcMain.handle('system:set-lockscreen', async (_, filePath) => setLockScreen(filePath))
  ipcMain.handle('system:apply', async (_, { filePath, target } = {}) => {
    if (!filePath) throw new Error('文件路径无效')
    const result = { wallpaper: false, lockscreen: false }
    const errors = []
    if (target === 'wallpaper' || target === 'both') {
      try { await setWallpaper(filePath); result.wallpaper = true } catch (error) { errors.push(error?.message || '设置桌面壁纸失败') }
    }
    if (target === 'lockscreen' || target === 'both') {
      try { await setLockScreen(filePath); result.lockscreen = true } catch (error) { errors.push(error?.message || '设置锁屏失败') }
    }
    // 同步下载记录中的应用状态（持久化，不向渲染进程重复推送完成事件）
    let touched = false
    for (const task of downloadTasks.values()) {
      if (task.filePath !== filePath) continue
      if (result.wallpaper) task.wallpaperSet = true
      if (result.lockscreen) task.lockScreenSet = true
      touched = true
    }
    if (touched) scheduleSaveDownloads()
    if (errors.length) throw new Error(errors.join('；'))
    return result
  })
  ipcMain.handle('app:open-external', async (_, url) => {
    const parsed = new URL(url)
    if (['wallhaven.cc', 'www.wallhaven.cc', 'whvn.cc'].includes(parsed.hostname)) await shell.openExternal(parsed.toString())
  })
}

app.whenReady().then(() => {
  protocol.handle('wallhaven-file', (request) => {
    try {
      const url = new URL(request.url)
      // wallhaven-file://file/<encodeURIComponent(路径)>
      let filePath = decodeURIComponent(url.pathname.replace(/^\//, ''))
      // 兜底：标准 URL 规范化可能把盘符放进 host
      if (!/^[a-zA-Z]:/.test(filePath) && /^[a-zA-Z]$/.test(url.host)) {
        filePath = `${url.host.toUpperCase()}:${url.pathname}`
      }
      return net.fetch(pathToFileURL(filePath).toString())
    } catch (_) {
      return new Response('not found', { status: 404 })
    }
  })
  readStore()
  readDownloads()
  registerIpc()
  registerWindowControls()
  watchSystemTheme()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
