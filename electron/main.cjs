const { app, BrowserWindow, dialog, ipcMain, shell, net, nativeTheme, protocol, Tray, Menu, nativeImage, powerMonitor, screen } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const os = require('node:os')
const { pathToFileURL } = require('node:url')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const wallpaper = require('./wallpaper.cjs')
const { createFavoritesStore, createWindowStateStore } = require('./persist.cjs')
const { createRotationEngine } = require('./rotation.cjs')
const { createUpdater } = require('./updater.cjs')

/* 本地文件预览协议：渲染进程通过 wallhaven-file:///C:/... 读取已下载的图片 */
protocol.registerSchemesAsPrivileged([
  { scheme: 'wallhaven-file', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
])

const execFileAsync = promisify(execFile)
const API_BASE = 'https://wallhaven.cc/api/v1'
const STORE_FILE = 'settings.json'
const THEME_MODES = ['system', 'light', 'dark', 'contrast']
const DOWNLOAD_CONCURRENCY = 3
const MAX_RETRIES = 3
let mainWindow
let tray = null
let isQuitting = false

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
  theme: 'system',
  wallpaperStyle: 'fill',
  closeToTray: true,
  trayHintShown: false,
  rotation: {
    enabled: false,
    intervalMinutes: 60,
    source: 'toplist',
    setLockScreen: false
  }
}

let favorites = null
let windowState = null

function favoritesStore() {
  if (!favorites) favorites = createFavoritesStore(app.getPath('userData'))
  return favorites
}

function windowStateStore() {
  if (!windowState) windowState = createWindowStateStore(app.getPath('userData'))
  return windowState
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
      apiKey: decodeSecret(raw.apiKey),
      wallpaperStyle: wallpaper.normalizeStyle(raw.wallpaperStyle),
      rotation: normalizeRotation(raw.rotation, store.rotation)
    }
  } catch (_) {}
}

function normalizeRotation(input, fallback = {}) {
  const base = fallback && typeof fallback === 'object' ? fallback : {}
  const source = ['toplist', 'random', 'favorites', 'downloads'].includes(input?.source) ? input.source : base.source || 'toplist'
  const rawInterval = Number(input?.intervalMinutes ?? base.intervalMinutes ?? 60)
  const intervalMinutes = Number.isFinite(rawInterval) ? Math.min(1440, Math.max(5, Math.round(rawInterval))) : 60
  return {
    enabled: Boolean(input?.enabled ?? base.enabled ?? false),
    intervalMinutes,
    source,
    setLockScreen: Boolean(input?.setLockScreen ?? base.setLockScreen ?? false),
    lastRunAt: Number(input?.lastRunAt ?? base.lastRunAt ?? 0) || 0,
    lastWallpaperId: String(input?.lastWallpaperId ?? base.lastWallpaperId ?? '')
  }
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
    systemTheme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
    wallpaperStyle: store.wallpaperStyle,
    closeToTray: Boolean(store.closeToTray),
    rotation: { ...store.rotation },
    platform: process.platform,
    version: app.getVersion(),
    downloadConcurrency: DOWNLOAD_CONCURRENCY
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

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])
const API_TIMEOUT_MS = 15000

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function retryDelay(attempt, response) {
  const header = response?.headers?.get?.('retry-after')
  if (header) {
    const seconds = Number(header)
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 15000)
  }
  return Math.min(600 * 2 ** (attempt - 1), 8000)
}

/* net.fetch 没有内置超时，断网时 request 会一直挂着，界面就永远停在“正在同步” */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  try {
    return await net.fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
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

  let lastError = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    let response = null
    try {
      response = await fetchWithTimeout(url.toString(), { headers })
    } catch (error) {
      // 网络层错误（断网、DNS、超时）同样值得重试
      lastError = error
      if (attempt < MAX_RETRIES) {
        await wait(retryDelay(attempt, null))
        continue
      }
      throw new Error(error?.name === 'AbortError' ? '请求超时，请检查网络后重试' : '网络连接失败，请检查网络后重试')
    }

    const text = await response.text()
    let payload
    try {
      payload = text ? JSON.parse(text) : {}
    } catch (_) {
      payload = { error: text }
    }

    if (response.ok) return payload

    const message = payload?.error || payload?.message || `请求失败（${response.status}）`
    const error = new Error(message)
    error.status = response.status
    lastError = error

    if (!RETRYABLE_STATUS.has(response.status) || attempt >= MAX_RETRIES) break
    await wait(retryDelay(attempt, response))
  }

  if (lastError?.status === 429) {
    const quota = new Error('Wallhaven 请求过于频繁（429），请稍后再试')
    quota.status = 429
    throw quota
  }
  throw lastError || new Error('请求失败')
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
          await applyWallpaperFile(task.filePath, store.wallpaperStyle)
          task.wallpaperSet = true
        } catch (error) {
          failures.push(error?.message || '设置桌面壁纸失败')
        }
      }
      if (applyLockScreen) {
        try {
          await wallpaper.setLockScreen(task.filePath)
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

/* 记录最近一次成功应用的壁纸，供“切换显示方式”时立即重绘 */
let lastAppliedWallpaper = null

async function applyWallpaperFile(filePath, style) {
  const result = await wallpaper.setWallpaper(filePath, style ?? store.wallpaperStyle)
  lastAppliedWallpaper = { filePath, at: Date.now() }
  return result
}

async function downloadImageFile(url, filePath) {
  const safeUrl = assertWallhavenUrl(url)
  const response = await fetchWithTimeout(safeUrl, {})
  if (!response.ok) throw new Error(`图片下载失败（${response.status}）`)
  const buffer = Buffer.from(await response.arrayBuffer())
  await fsp.mkdir(path.dirname(filePath), { recursive: true })
  await fsp.writeFile(filePath, buffer)
  return filePath
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
  enqueueDownload(task)
  return publicTask(task)
}

/* ============ 下载并发队列 ============
 * 之前每点一次就立刻发起一条连接，连点 10 张会同时开 10 条流，
 * 既容易被 Wallhaven 限流，也会互相抢带宽。这里限制同时进行 3 条。
 */
const downloadQueue = []
let runningDownloads = 0

function enqueueDownload(task) {
  if (task.status !== 'queued' && task.status !== 'interrupted') {
    task.status = 'queued'
    emitTask(task)
  }
  if (!downloadQueue.includes(task.taskId)) downloadQueue.push(task.taskId)
  pumpDownloadQueue()
}

function pumpDownloadQueue() {
  while (runningDownloads < DOWNLOAD_CONCURRENCY && downloadQueue.length) {
    const taskId = downloadQueue.shift()
    const task = downloadTasks.get(taskId)
    if (!task || task.status !== 'queued') continue
    runningDownloads += 1
    runDownload(task)
      .catch(() => {})
      .finally(() => {
        runningDownloads = Math.max(0, runningDownloads - 1)
        pumpDownloadQueue()
      })
  }
}

function cancelQueuedTask(task) {
  const index = downloadQueue.indexOf(task.taskId)
  if (index !== -1) downloadQueue.splice(index, 1)
  task.status = 'canceled'
  task.finishedAt = Date.now()
  task.speed = 0
  emitTask(task)
}


function appIconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, 'icon.png')
}

function devServerUrl() {
  return process.env.WALLHAVEN_DEV_URL || 'http://127.0.0.1:5173'
}

function createWindow() {
  const iconPath = appIconPath()
  const saved = windowStateStore().load()
  const bounds = sanitizeBounds(saved.bounds)
  mainWindow = new BrowserWindow({
    width: bounds?.width || 1440,
    height: bounds?.height || 920,
    x: bounds?.x,
    y: bounds?.y,
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
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false
    }
  })

  mainWindow.setHasShadow(true)
  if (saved.maximized) mainWindow.maximize()

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 禁止应用内跳转到外部站点（防止被导航劫持到钓鱼页）
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devServer = !app.isPackaged && url.startsWith(devServerUrl())
    if (!devServer && !url.startsWith('file://')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  mainWindow.on('resize', persistWindowBounds)
  mainWindow.on('move', persistWindowBounds)
  mainWindow.on('maximize', persistWindowBounds)
  mainWindow.on('unmaximize', persistWindowBounds)

  mainWindow.on('close', (event) => {
    if (isQuitting) return
    if (!store.closeToTray || !tray) return
    event.preventDefault()
    mainWindow.hide()
    if (!store.trayHintShown) {
      store.trayHintShown = true
      writeStore().catch(() => {})
      notifyWindow('应用已最小化到托盘，右键托盘图标可以退出')
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })

  if (!app.isPackaged) {
    mainWindow.loadURL(devServerUrl())
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

let persistBoundsTimer = null
function persistWindowBounds() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (persistBoundsTimer) clearTimeout(persistBoundsTimer)
  persistBoundsTimer = setTimeout(() => {
    persistBoundsTimer = null
    if (!mainWindow || mainWindow.isDestroyed()) return
    const maximized = mainWindow.isMaximized()
    const bounds = maximized ? windowStateStore().load().bounds : mainWindow.getBounds()
    windowStateStore().save({ bounds, maximized })
  }, 400)
}

/* 校验记忆的窗口位置：显示器拔掉后不能把窗口丢到屏幕外 */
function sanitizeBounds(bounds) {
  if (!bounds || typeof bounds !== 'object') return null
  const width = Number(bounds.width)
  const height = Number(bounds.height)
  const x = Number(bounds.x)
  const y = Number(bounds.y)
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 400 || height < 300) return null
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { width, height }
  const visible = screen.getAllDisplays().some((display) => {
    const area = display.workArea
    return x < area.x + area.width - 80 && x + width > area.x + 80 && y < area.y + area.height - 40 && y + height > area.y + 40
  })
  return visible ? { x, y, width, height } : { width, height }
}

function notifyWindow(message) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('app:notify', { message, type: 'info' })
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow()
    return
  }
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function toggleMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible() && mainWindow.isFocused()) mainWindow.hide()
  else showMainWindow()
}

/* ============ 托盘 ============ */
function trayImage() {
  const iconPath = appIconPath()
  if (!fs.existsSync(iconPath)) return nativeImage.createEmpty()
  const image = nativeImage.createFromPath(iconPath)
  return image.isEmpty() ? nativeImage.createEmpty() : image.resize({ width: 32, height: 32 })
}

function buildTrayMenu() {
  const rotation = store.rotation
  return Menu.buildFromTemplate([
    { label: '打开 Wallhaven Studio', click: showMainWindow },
    { type: 'separator' },
    {
      label: '立即换一张壁纸',
      click: () => { void rotationEngine.run({ trigger: 'manual' }) }
    },
    {
      label: '自动轮换',
      type: 'checkbox',
      checked: Boolean(rotation.enabled),
      click: (item) => { void rotationEngine.update({ enabled: item.checked }) }
    },
    { label: '下载管理', click: () => { showMainWindow(); notifyRendererEvent('app:open-panel', { panel: 'downloads' }) } },
    { label: '打开下载目录', click: () => { void shell.openPath(store.downloadPath || defaultDownloadPath()) } },
    { type: 'separator' },
    {
      label: '关闭时最小化到托盘',
      type: 'checkbox',
      checked: Boolean(store.closeToTray),
      click: async (item) => {
        store.closeToTray = Boolean(item.checked)
        await writeStore()
        notifyRendererEvent('config:changed', publicConfig())
        refreshTrayMenu()
      }
    },
    { type: 'separator' },
    { label: '退出', click: () => { isQuitting = true; app.quit() } }
  ])
}

function refreshTrayMenu() {
  if (!tray) return
  tray.setContextMenu(buildTrayMenu())
  tray.setToolTip(`Wallhaven Studio${store.rotation.enabled ? ` · 自动轮换 ${store.rotation.intervalMinutes} 分钟` : ''}`)
}

function createTray() {
  if (tray) return
  const image = trayImage()
  if (image.isEmpty()) return
  tray = new Tray(image)
  tray.setToolTip('Wallhaven Studio')
  tray.setContextMenu(buildTrayMenu())
  tray.on('click', toggleMainWindow)
  tray.on('double-click', showMainWindow)
}

function notifyRendererEvent(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload)
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
    if (Object.prototype.hasOwnProperty.call(patch, 'wallpaperStyle')) {
      store.wallpaperStyle = wallpaper.normalizeStyle(patch.wallpaperStyle)
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'closeToTray')) {
      store.closeToTray = Boolean(patch.closeToTray)
    }
    await writeStore()
    refreshTrayMenu()
    notifyRendererEvent('config:changed', publicConfig())
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
    else if (task && (task.status === 'queued' || task.status === 'interrupted')) cancelQueuedTask(task)
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
  ipcMain.handle('system:set-wallpaper', async (_, filePath) => applyWallpaperFile(filePath))
  ipcMain.handle('system:set-lockscreen', async (_, filePath) => wallpaper.setLockScreen(filePath))
  ipcMain.handle('system:apply', async (_, { filePath, target } = {}) => {
    if (!filePath) throw new Error('文件路径无效')
    const result = { wallpaper: false, lockscreen: false }
    const errors = []
    if (target === 'wallpaper' || target === 'both') {
      try { await applyWallpaperFile(filePath); result.wallpaper = true } catch (error) { errors.push(error?.message || '设置桌面壁纸失败') }
    }
    if (target === 'lockscreen' || target === 'both') {
      try { await wallpaper.setLockScreen(filePath); result.lockscreen = true } catch (error) { errors.push(error?.message || '设置锁屏失败') }
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
  ipcMain.handle('wallpaper:style', () => ({ current: store.wallpaperStyle, options: wallpaper.WALLPAPER_STYLES }))
  ipcMain.handle('wallpaper:set-style', async (_, style) => {
    const next = wallpaper.normalizeStyle(style)
    store.wallpaperStyle = next
    await writeStore()
    // 立刻把当前桌面重绘一次，用户能马上看到效果；没有记录时静默跳过
    if (lastAppliedWallpaper?.filePath) {
      try { await applyWallpaperFile(lastAppliedWallpaper.filePath, next) } catch (_) {}
    }
    return { current: next, options: wallpaper.WALLPAPER_STYLES }
  })
  ipcMain.handle('favorites:list', () => favoritesStore().snapshot())
  ipcMain.handle('favorites:replace', (_, items) => favoritesStore().replace(items))
  ipcMain.handle('favorites:toggle', (_, item) => favoritesStore().toggle(item))
  ipcMain.handle('favorites:merge', (_, items) => {
    // 首次启动时把旧 localStorage 收藏并入
    const favStore = favoritesStore()
    const existing = favStore.snapshot()
    const merged = [...existing]
    const seen = new Set(existing.map((entry) => entry.id))
    for (const item of Array.isArray(items) ? items : []) {
      if (item?.id && !seen.has(item.id)) { seen.add(item.id); merged.push(item) }
    }
    return { items: favStore.replace(merged), migrated: merged.length - existing.length }
  })
  ipcMain.handle('favorites:exists', () => favoritesStore().exists())
  ipcMain.handle('favorites:export', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '导出本地收藏',
      defaultPath: path.join(app.getPath('documents'), `wallhaven-favorites-${new Date().toISOString().slice(0, 10)}.json`),
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return { canceled: true }
    const count = await favoritesStore().exportTo(result.filePath)
    return { canceled: false, filePath: result.filePath, count }
  })
  ipcMain.handle('favorites:import', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '导入本地收藏',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePaths[0]) return { canceled: true }
    const items = await favoritesStore().importFrom(result.filePaths[0])
    return { canceled: false, filePaths: result.filePaths[0], items }
  })
  ipcMain.handle('rotation:get', () => rotationEngine.state())
  ipcMain.handle('rotation:update', async (_, patch) => rotationEngine.update(patch))
  ipcMain.handle('rotation:run-now', async () => {
    const result = await rotationEngine.run({ trigger: 'manual' })
    if (result?.ok) notifyRendererEvent('app:notify', { message: '已更换桌面壁纸', type: 'info' })
    else if (result?.error) notifyRendererEvent('app:notify', { message: result.error, type: 'warning' })
    return result
  })
  ipcMain.handle('app:open-external', async (_, url) => {
    const parsed = new URL(url)
    if (['wallhaven.cc', 'www.wallhaven.cc', 'whvn.cc'].includes(parsed.hostname)) await shell.openExternal(parsed.toString())
  })
  ipcMain.handle('app:info', () => ({ version: app.getVersion(), platform: process.platform, portable: Boolean(runtimeRoot) }))
  updater.registerIpc()
}

/* ============ 自动轮换引擎 ============ */
const rotationEngine = createRotationEngine({
  getStore: () => store,
  saveStore: writeStore,
  getDownloadFolder: () => store.downloadPath || defaultDownloadPath(),
  requestApi,
  downloadImage: downloadImageFile,
  setWallpaper: (filePath) => applyWallpaperFile(filePath),
  setLockScreen: (filePath) => wallpaper.setLockScreen(filePath),
  getFavorites: () => favoritesStore().snapshot(),
  notifyRenderer: (payload) => {
    if (payload.type === 'rotation') {
      refreshTrayMenu()
      notifyRendererEvent('rotation:state', payload)
    }
  },
  log: (...args) => console.warn('[rotation]', ...args)
})

/* ============ 应用更新 ============ */
const updater = createUpdater({
  getWindow: () => mainWindow,
  beforeInstall: () => { isQuitting = true }
})

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
  createTray()
  rotationEngine.start()
  updater.start()
  powerMonitor.on('resume', () => rotationEngine.schedule(false))
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else showMainWindow()
  })
})

app.on('before-quit', () => {
  isQuitting = true
  rotationEngine.stop()
  updater.stop()
  try { favoritesStore().flush() } catch (_) {}
})

app.on('window-all-closed', () => {
  // 托盘常驻时不随窗口关闭退出
  if (process.platform !== 'darwin' && !tray) app.quit()
})

/* ============ 单实例 ============ */
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showMainWindow()
  })
}
