const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const os = require('node:os')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')

const execFileAsync = promisify(execFile)
const API_BASE = 'https://wallhaven.cc/api/v1'
const STORE_FILE = 'settings.json'
let mainWindow
let store = {
  apiKey: '',
  username: '',
  downloadPath: path.join(app.getPath('pictures'), 'Wallhaven'),
  theme: 'dark'
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

function publicConfig() {
  return {
    apiKeySet: Boolean(store.apiKey),
    username: store.username,
    downloadPath: store.downloadPath,
    theme: store.theme
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
  const response = await fetch(url, { headers })
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

async function downloadImage({ id, imageUrl, extension, setAsWallpaper = false }) {
  const url = assertWallhavenUrl(imageUrl)
  const folder = store.downloadPath || path.join(app.getPath('pictures'), 'Wallhaven')
  await fsp.mkdir(folder, { recursive: true })
  const safeId = sanitizePathPart(id)
  const ext = sanitizePathPart(extension || 'jpg').replace('.', '')
  const filePath = path.join(folder, `wallhaven-${safeId}.${ext}`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`图片下载失败（${response.status}）`)
  await fsp.writeFile(filePath, Buffer.from(await response.arrayBuffer()))
  if (setAsWallpaper) await setWallpaper(filePath)
  return { filePath, folder, setAsWallpaper }
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0a111d',
    title: 'Wallhaven Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

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

function registerIpc() {
  ipcMain.handle('config:get', () => publicConfig())
  ipcMain.handle('config:save', async (_, patch = {}) => {
    if (Object.prototype.hasOwnProperty.call(patch, 'apiKey')) store.apiKey = String(patch.apiKey || '').trim()
    if (Object.prototype.hasOwnProperty.call(patch, 'username')) store.username = String(patch.username || '').trim()
    if (Object.prototype.hasOwnProperty.call(patch, 'downloadPath') && patch.downloadPath) store.downloadPath = patch.downloadPath
    if (Object.prototype.hasOwnProperty.call(patch, 'theme')) store.theme = patch.theme
    await writeStore()
    return publicConfig()
  })
  ipcMain.handle('api:request', async (_, { endpoint, query }) => requestApi(endpoint, query))
  ipcMain.handle('download:choose-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory', 'createDirectory'] })
    if (result.canceled || !result.filePaths[0]) return null
    store.downloadPath = result.filePaths[0]
    await writeStore()
    return store.downloadPath
  })
  ipcMain.handle('download:wallpaper', async (_, payload) => downloadImage(payload))
  ipcMain.handle('download:set-wallpaper', async (_, payload) => downloadImage({ ...payload, setAsWallpaper: true }))
  ipcMain.handle('download:open-folder', async () => {
    await fsp.mkdir(store.downloadPath, { recursive: true })
    return shell.openPath(store.downloadPath)
  })
  ipcMain.handle('system:set-wallpaper', async (_, filePath) => setWallpaper(filePath))
  ipcMain.handle('app:open-external', async (_, url) => {
    const parsed = new URL(url)
    if (['wallhaven.cc', 'www.wallhaven.cc', 'whvn.cc'].includes(parsed.hostname)) await shell.openExternal(parsed.toString())
  })
}

app.whenReady().then(() => {
  readStore()
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
