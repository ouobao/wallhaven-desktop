const fs = require('node:fs')
const path = require('node:path')
const fsp = require('node:fs/promises')

/* ============ 本地收藏存储 ============
 * 收藏原先放在渲染进程的 localStorage 里：清缓存、换用户、重装就丢，
 * 也没法备份。改为存放在 userData/favorites.json，并保留一次性迁移：
 * 首次启动时把旧 localStorage 数据搬过来。
 */
function createFavoritesStore(userDataDir) {
  const filePath = path.join(userDataDir, 'favorites.json')
  let items = []
  let loaded = false
  let saveTimer = null

  function readFile() {
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : []
      return list.filter((item) => item && typeof item === 'object' && item.id)
    } catch (_) {
      return null
    }
  }

  function load() {
    if (loaded) return items
    const stored = readFile()
    // 文件不存在时返回 null 语义给外部判断是否需要迁移
    items = stored || []
    loaded = true
    return items
  }

  function exists() {
    try {
      return fs.statSync(filePath).isFile()
    } catch (_) {
      return false
    }
  }

  function snapshot() {
    load()
    return items
  }

  function replace(nextItems) {
    const list = Array.isArray(nextItems) ? nextItems : []
    const seen = new Set()
    items = list.filter((item) => {
      if (!item || typeof item !== 'object' || !item.id) return false
      const key = String(item.id)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    loaded = true
    scheduleSave()
    return items
  }

  function upsert(item) {
    load()
    if (!item || !item.id) return items
    const next = items.filter((entry) => entry.id !== item.id)
    next.push(item)
    return replace(next)
  }

  function remove(id) {
    load()
    return replace(items.filter((entry) => entry.id !== id))
  }

  function toggle(item) {
    load()
    if (items.some((entry) => entry.id === item?.id)) return { added: false, items: remove(item.id) }
    return { added: true, items: upsert(item) }
  }

  function scheduleSave() {
    if (saveTimer) return
    saveTimer = setTimeout(() => {
      saveTimer = null
      flush()
    }, 250)
  }

  function flush() {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      const temp = `${filePath}.tmp`
      fs.writeFileSync(temp, JSON.stringify(items, null, 2), 'utf8')
      fs.renameSync(temp, filePath)
    } catch (_) {}
  }

  async function exportTo(targetPath) {
    load()
    await fsp.mkdir(path.dirname(targetPath), { recursive: true })
    await fsp.writeFile(targetPath, JSON.stringify(items, null, 2), 'utf8')
    return items.length
  }

  async function importFrom(sourcePath) {
    const raw = JSON.parse(await fsp.readFile(sourcePath, 'utf8'))
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : []
    return replace(list)
  }

  return { filePath, exists, load, snapshot, replace, upsert, remove, toggle, flush, exportTo, importFrom }
}

/* ============ 窗口位置记忆 ============ */
function createWindowStateStore(userDataDir) {
  const filePath = path.join(userDataDir, 'window-state.json')
  let state = null

  function load() {
    if (state) return state
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      state = raw && typeof raw === 'object' ? raw : {}
    } catch (_) {
      state = {}
    }
    return state
  }

  function save(patch) {
    const next = { ...load(), ...patch }
    state = next
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, JSON.stringify(next, null, 2), 'utf8')
    } catch (_) {}
    return next
  }

  return { load, save }
}

module.exports = { createFavoritesStore, createWindowStateStore }
