const { app, ipcMain, shell } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')

/* ============ 应用更新 ============
 * 使用 electron-updater + electron-builder 的 NSIS 产物：
 * 1. 打包版读取 resources/app-update.yml（由 electron-builder 根据 build.publish 生成）
 * 2. 点击“检查更新”向 GitHub Releases 请求 latest.yml
 * 3. 有新版本时用户手动下载，下载完成后可立即重启安装
 * 开发模式下默认不检查；设置 WH_DEV_UPDATE=1 并放置 dev-app-update.yml 可联调
 */

const CHECK_INTERVAL = 6 * 60 * 60 * 1000
const LOG_MAX_BYTES = 256 * 1024
const DEV_UPDATE = process.env.WH_DEV_UPDATE === '1'
const FEED_OVERRIDE = String(process.env.WH_UPDATE_FEED || '').trim()

function createUpdater({ getWindow, beforeInstall } = {}) {
  // 延迟加载：electron-updater 在模块初始化时就会读取 app 信息，
  // 必须等 Electron 环境就绪后再拿到实例。
  let autoUpdater = null
  let cancellationToken = null
  let checking = false
  let checkTimer = null

  const state = {
    status: 'idle', // idle | checking | available | downloading | downloaded | current | error | unsupported
    currentVersion: app.getVersion(),
    newVersion: '',
    releaseNotes: '',
    releaseDate: '',
    percent: 0,
    transferred: 0,
    total: 0,
    bytesPerSecond: 0,
    error: '',
    checkedAt: 0,
    supported: app.isPackaged || DEV_UPDATE,
    releasePage: ''
  }

  function snapshot() {
    return { ...state }
  }

  function broadcast() {
    const win = getWindow?.()
    if (win && !win.isDestroyed()) win.webContents.send('update:state', snapshot())
  }

  function setState(patch) {
    Object.assign(state, patch)
    broadcast()
    return snapshot()
  }

  /* ---------- 日志：出问题时让用户能直接发 updater.log ---------- */
  function log(...args) {
    try {
      const file = path.join(app.getPath('userData'), 'updater.log')
      if (fs.existsSync(file) && fs.statSync(file).size > LOG_MAX_BYTES) fs.rmSync(file, { force: true })
      const line = `[${new Date().toISOString()}] ${args.map((item) => (item instanceof Error ? item.stack || item.message : String(item))).join(' ')}\n`
      fs.appendFileSync(file, line, 'utf8')
    } catch (_) {}
  }

  const logger = {
    info: (message) => log('INFO', message),
    warn: (message) => log('WARN', message),
    error: (message) => log('ERROR', message),
    debug: () => {}
  }

  function friendlyError(error) {
    const raw = String(error?.message || error || '')
    log('updater error:', error)
    if (/No published versions|ERR_UPDATER_NO_PUBLISHED_VERSIONS/i.test(raw)) return 'GitHub 上还没有可用的正式版本'
    if (/latest\.yml|Cannot find channel|404/i.test(raw)) return '更新源缺少 latest.yml，请检查 Release 是否已完整上传'
    if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|net::ERR|timeout/i.test(raw)) return '网络连接失败，请检查网络后重试'
    if (/sha512|checksum|integrity/i.test(raw)) return '安装包校验失败，请重新下载'
    if (/ERR_UPDATER_INVALID_RELEASE_FEED|Cannot parse releases feed/i.test(raw)) return '更新源返回的内容无法解析，请稍后重试'
    return raw || '检查更新失败'
  }

  function cleanNotes(notes) {
    if (!notes) return ''
    const text = Array.isArray(notes)
      ? notes.map((item) => item?.note || '').join('\n')
      : String(notes)
    return text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|li|h\d)>/gi, '\n')
      .replace(/<li>/gi, '· ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, 1200)
  }

  function ensureUpdater() {
    if (autoUpdater) return autoUpdater
    const instance = require('electron-updater').autoUpdater
    instance.autoDownload = false
    instance.autoInstallOnAppQuit = true
    instance.allowPrerelease = false
    instance.logger = logger
    if (!app.isPackaged) instance.forceDevUpdateConfig = true
    if (FEED_OVERRIDE) instance.setFeedURL({ provider: 'generic', url: FEED_OVERRIDE })

    instance.on('checking-for-update', () => setState({ status: 'checking', error: '' }))
    instance.on('update-available', (info) => {
      log('update available', info?.version)
      setState({
        status: 'available',
        newVersion: String(info?.version || ''),
        releaseNotes: cleanNotes(info?.releaseNotes),
        releaseDate: String(info?.releaseDate || ''),
        percent: 0,
        error: ''
      })
    })
    instance.on('update-not-available', (info) => {
      log('update not available, latest:', info?.version)
      setState({
        status: 'current',
        newVersion: String(info?.version || state.currentVersion),
        releaseNotes: '',
        percent: 0,
        error: ''
      })
    })
    instance.on('download-progress', (progress) => {
      setState({
        status: 'downloading',
        percent: Math.max(0, Math.min(100, Number(progress?.percent) || 0)),
        transferred: Number(progress?.transferred) || 0,
        total: Number(progress?.total) || 0,
        bytesPerSecond: Number(progress?.bytesPerSecond) || 0
      })
    })
    instance.on('update-downloaded', (info) => {
      log('update downloaded', info?.version)
      setState({
        status: 'downloaded',
        newVersion: String(info?.version || state.newVersion),
        percent: 100,
        error: ''
      })
    })
    instance.on('error', (error) => {
      setState({ status: 'error', error: friendlyError(error) })
    })

    autoUpdater = instance
    return autoUpdater
  }

  async function check() {
    if (!state.supported) {
      return setState({
        status: 'unsupported',
        error: '开发模式不检查更新，请使用打包后的安装版',
        checkedAt: Date.now()
      })
    }
    // 已下载完成时保留“重启安装”按钮，不重复检查
    if (state.status === 'downloaded') return snapshot()
    // 下载过程中不打断，避免把进度条状态覆盖成“检查中”
    if (state.status === 'downloading') return snapshot()
    if (checking) return snapshot()

    checking = true
    setState({ status: 'checking', error: '', percent: 0, transferred: 0, total: 0, bytesPerSecond: 0 })
    try {
      const updater = ensureUpdater()
      const result = await updater.checkForUpdates()
      if (!result) setState({ status: 'unsupported', error: '当前环境不支持自动更新' })
    } catch (error) {
      setState({ status: 'error', error: friendlyError(error) })
    } finally {
      checking = false
      state.checkedAt = Date.now()
      broadcast()
    }
    return snapshot()
  }

  async function download() {
    if (state.status === 'downloading') return snapshot()
    if (!state.supported) return setState({ status: 'unsupported', error: '开发模式不支持下载更新' })
    if (state.status !== 'available' && state.status !== 'error') return snapshot()

    const updater = ensureUpdater()
    // pnpm 的依赖隔离会让 builder-util-runtime 无法从项目根解析，
    // 这里按 electron-updater 自己的依赖树来加载，保证取消下载可用。
    let Token
    try {
      const updaterRequire = createRequire(require.resolve('electron-updater'))
      Token = updaterRequire('builder-util-runtime').CancellationToken
    } catch (error) {
      log('cancel token unavailable:', error)
    }
    cancellationToken = Token ? new Token() : null

    setState({ status: 'downloading', percent: 0, transferred: 0, total: 0, bytesPerSecond: 0, error: '' })
    try {
      await updater.downloadUpdate(cancellationToken || undefined)
      if (state.status === 'downloading') setState({ status: 'downloaded', percent: 100 })
    } catch (error) {
      if (cancellationToken?.cancelled || /cancell?ed/i.test(String(error?.message || ''))) {
        setState({ status: 'available', percent: 0, transferred: 0, total: 0, bytesPerSecond: 0, error: '' })
      } else {
        setState({ status: 'error', percent: 0, error: friendlyError(error) })
      }
    } finally {
      cancellationToken = null
    }
    return snapshot()
  }

  function cancel() {
    const hasToken = Boolean(cancellationToken)
    try { cancellationToken?.cancel() } catch (_) {}
    // 有取消令牌时立刻回到“可下载”，避免按钮点了没反应
    if (hasToken) setState({ status: 'available', percent: 0, transferred: 0, total: 0, bytesPerSecond: 0, error: '' })
    return snapshot()
  }

  function install() {
    if (state.status !== 'downloaded') throw new Error('更新尚未下载完成')
    log('quit and install')
    try { beforeInstall?.() } catch (_) {}
    // quitAndInstall 会先关闭窗口；必须先让主进程的 close 拦截放行，否则会被“关闭到托盘”挡住
    setImmediate(() => {
      try {
        // 静默安装并自动重启：点一次按钮就能直接到新版本，不再弹安装向导
        autoUpdater.quitAndInstall(true, true)
      } catch (error) {
        setState({ status: 'error', error: friendlyError(error) })
      }
    })
    return true
  }

  async function resolveReleasePage() {
    if (state.releasePage) return state.releasePage
    let owner = ''
    let repo = ''
    try {
      const config = await autoUpdater?.configOnDisk?.value
      owner = String(config?.owner || '')
      repo = String(config?.repo || '')
    } catch (_) {}
    if (!owner || !repo) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(app.getAppPath(), 'package.json'), 'utf8'))
        const publish = Array.isArray(pkg?.build?.publish) ? pkg.build.publish : []
        const github = publish.find((item) => item?.provider === 'github')
        owner = String(github?.owner || '')
        repo = String(github?.repo || '')
      } catch (_) {}
    }
    state.releasePage = owner && repo ? `https://github.com/${owner}/${repo}/releases/latest` : ''
    return state.releasePage
  }

  async function openReleasePage() {
    const url = await resolveReleasePage()
    if (!url) return false
    await shell.openExternal(url)
    return true
  }

  function registerIpc() {
    ipcMain.handle('update:get-state', () => snapshot())
    ipcMain.handle('update:check', async () => { await resolveReleasePage(); return check() })
    ipcMain.handle('update:download', () => download())
    ipcMain.handle('update:cancel', () => cancel())
    ipcMain.handle('update:install', () => install())
    ipcMain.handle('update:open-release', () => openReleasePage())
  }

  /* 启动后延迟检查一次，之后每 6 小时检查；仅打包版生效，且不自动下载 */
  function start() {
    if (!state.supported) return
    const run = () => { void resolveReleasePage(); check().catch(() => {}) }
    setTimeout(run, 12 * 1000).unref?.()
    checkTimer = setInterval(run, CHECK_INTERVAL)
    checkTimer.unref?.()
  }

  function stop() {
    if (checkTimer) clearInterval(checkTimer)
    checkTimer = null
  }

  return { registerIpc, start, stop, check, download, install, cancel, getState: snapshot, log }
}

module.exports = { createUpdater }
