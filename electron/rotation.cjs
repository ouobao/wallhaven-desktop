const { app } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const fsp = require('node:fs/promises')

/* ============ 自动换壁纸 ============
 * 来源：
 *  - toplist / random：走 Wallhaven API 拉一张新图，下载到 downloadPath
 *  - favorites：从本地收藏里挑一张已下载的
 *  - downloads：从下载目录里挑一张已有的
 * 只在系统空闲时真正切换，避免打断用户正在看的视频或全屏程序。
 */
const IMAGE_EXT = /\.(jpe?g|png|webp|bmp)$/i
const IDLE_THRESHOLD_SECONDS = 90

function createRotationEngine(options) {
  const {
    getStore,
    saveStore,
    getDownloadFolder,
    requestApi,
    downloadImage,
    setWallpaper,
    setLockScreen,
    getFavorites,
    notifyRenderer,
    log = () => {}
  } = options

  let timer = null
  let running = false
  let lastResult = null

  function intervalMs() {
    const minutes = Number(getStore()?.rotation?.intervalMinutes) || 60
    return Math.max(5, minutes) * 60 * 1000
  }

  function state() {
    const rotation = getStore()?.rotation || {}
    return {
      enabled: Boolean(rotation.enabled),
      intervalMinutes: Number(rotation.intervalMinutes) || 60,
      source: rotation.source || 'toplist',
      setLockScreen: Boolean(rotation.setLockScreen),
      lastRunAt: Number(rotation.lastRunAt) || 0,
      lastWallpaperId: rotation.lastWallpaperId || '',
      running,
      nextRunAt: rotation.enabled && timer ? Date.now() + intervalMs() : 0,
      lastResult
    }
  }

  function schedule(immediate = false) {
    clearTimer()
    if (!getStore()?.rotation?.enabled) return
    timer = setTimeout(() => { void run({ trigger: immediate ? 'manual' : 'timer' }) }, immediate ? 300 : intervalMs())
    if (timer.unref) timer.unref()
  }

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function start() {
    if (getStore()?.rotation?.enabled) schedule(false)
  }

  function stop() {
    clearTimer()
  }

  async function update(patch = {}) {
    const current = getStore().rotation
    const next = {
      ...current,
      enabled: Object.prototype.hasOwnProperty.call(patch, 'enabled') ? Boolean(patch.enabled) : current.enabled,
      source: ['toplist', 'random', 'favorites', 'downloads'].includes(patch.source) ? patch.source : current.source,
      setLockScreen: Object.prototype.hasOwnProperty.call(patch, 'setLockScreen') ? Boolean(patch.setLockScreen) : current.setLockScreen,
      intervalMinutes: Number.isFinite(Number(patch.intervalMinutes))
        ? Math.min(1440, Math.max(5, Math.round(Number(patch.intervalMinutes))))
        : current.intervalMinutes
    }
    getStore().rotation = next
    await saveStore()
    if (next.enabled) schedule(false)
    else clearTimer()
    notifyRenderer?.({ type: 'rotation', rotation: state() })
    return state()
  }

  function listLocalImages() {
    const folder = getDownloadFolder()
    try {
      return fs.readdirSync(folder)
        .filter((name) => IMAGE_EXT.test(name))
        .map((name) => ({ filePath: path.join(folder, name), name }))
    } catch (_) {
      return []
    }
  }

  function pickLocal(source) {
    if (source === 'favorites') {
      const items = getFavorites?.() || []
      const folder = getDownloadFolder()
      const candidates = []
      for (const item of items) {
        const filePath = path.join(folder, `wallhaven-${item.id}.jpg`)
        if (fs.existsSync(filePath)) candidates.push({ filePath, id: item.id, title: item.title })
        else {
          const hit = safeFind(folder, item.id)
          if (hit) candidates.push({ filePath: hit, id: item.id, title: item.title })
        }
      }
      if (!candidates.length) return null
      return candidates[Math.floor(Math.random() * candidates.length)]
    }
    const files = listLocalImages()
    if (!files.length) return null
    const pick = files[Math.floor(Math.random() * files.length)]
    return { filePath: pick.filePath, id: '', title: pick.name }
  }

  function safeFind(folder, id) {
    try {
      const prefix = `wallhaven-${id}.`
      const hit = fs.readdirSync(folder).find((name) => name.toLowerCase().startsWith(prefix.toLowerCase()))
      return hit ? path.join(folder, hit) : null
    } catch (_) {
      return null
    }
  }

  async function remoteCandidate(source) {
    const query = { sorting: source === 'random' ? 'random' : 'toplist', purity: '100', categories: '111' }
    if (source === 'toplist') query.topRange = '1w'
    const payload = await requestApi('/search', query)
    const items = Array.isArray(payload?.data) ? payload.data : []
    if (!items.length) throw new Error('没有拿到可用的壁纸')
    const previous = getStore()?.rotation?.lastWallpaperId
    const pool = items.length > 1 ? items.filter((item) => item.id !== previous) : items
    return pool[Math.floor(Math.random() * pool.length)] || items[0]
  }

  async function run({ trigger = 'manual' } = {}) {
    if (running) return { skipped: true, reason: 'busy', state: state() }
    const rotation = getStore().rotation
    if (trigger === 'timer' && !rotation.enabled) return { skipped: true, reason: 'disabled', state: state() }

    // 定时任务不在用户活跃/全屏时抢占画面
    if (trigger === 'timer') {
      const idle = safeIdleSeconds()
      if (idle < IDLE_THRESHOLD_SECONDS) {
        lastResult = { at: Date.now(), ok: false, skipped: 'active', message: '用户正在使用电脑，已顺延' }
        schedule(false)
        return { skipped: true, reason: 'active', state: state() }
      }
    }

    running = true
    notifyRenderer?.({ type: 'rotation', rotation: state() })
    try {
      let target = null
      if (rotation.source === 'favorites' || rotation.source === 'downloads') {
        const local = pickLocal(rotation.source)
        if (!local) throw new Error(rotation.source === 'favorites' ? '收藏里还没有下载到本地的壁纸' : '下载目录里还没有图片')
        target = local
      } else {
        const wallpaper = await remoteCandidate(rotation.source)
        const folder = getDownloadFolder()
        await fsp.mkdir(folder, { recursive: true })
        const ext = (wallpaper.file_type || 'image/jpeg').split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
        const filePath = path.join(folder, `wallhaven-${wallpaper.id}.${ext}`)
        if (!fs.existsSync(filePath)) await downloadImage(wallpaper.path, filePath)
        target = { filePath, id: wallpaper.id, title: wallpaper.title }
      }

      await setWallpaper(target.filePath)
      if (rotation.setLockScreen) {
        try { await setLockScreen(target.filePath) } catch (error) { log('rotation lockscreen failed:', error?.message) }
      }

      getStore().rotation = { ...getStore().rotation, lastRunAt: Date.now(), lastWallpaperId: target.id || '' }
      await saveStore()
      lastResult = { at: Date.now(), ok: true, title: target.title || '', filePath: target.filePath, message: '已更换桌面壁纸' }
      notifyRenderer?.({ type: 'rotation', rotation: state(), applied: lastResult })
      return { ok: true, target, state: state() }
    } catch (error) {
      lastResult = { at: Date.now(), ok: false, message: error?.message || '自动换壁纸失败' }
      notifyRenderer?.({ type: 'rotation', rotation: state(), error: lastResult.message })
      return { ok: false, error: lastResult.message, state: state() }
    } finally {
      running = false
      schedule(false)
    }
  }

  function safeIdleSeconds() {
    try { return require('electron').powerMonitor.getSystemIdleTime() } catch (_) { return Infinity }
  }

  return { start, stop, update, run, state, schedule }
}

module.exports = { createRotationEngine }
