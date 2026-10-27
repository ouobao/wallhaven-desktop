const { contextBridge, ipcRenderer } = require('electron')

function subscribe(channel, callback) {
  const listener = (_event, payload) => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('wallhaven', {
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    save: (patch) => ipcRenderer.invoke('config:save', patch),
    onChanged: (callback) => subscribe('config:changed', callback)
  },
  api: {
    request: (endpoint, query) => ipcRenderer.invoke('api:request', { endpoint, query })
  },
  download: {
    chooseFolder: () => ipcRenderer.invoke('download:choose-folder'),
    check: (payload) => ipcRenderer.invoke('download:check', payload),
    wallpaper: (payload) => ipcRenderer.invoke('download:wallpaper', payload),
    setWallpaper: (payload) => ipcRenderer.invoke('download:set-wallpaper', payload),
    setLockScreen: (payload) => ipcRenderer.invoke('download:set-lockscreen', payload),
    setBoth: (payload) => ipcRenderer.invoke('download:set-both', payload),
    openFolder: () => ipcRenderer.invoke('download:open-folder'),
    openFile: (filePath) => ipcRenderer.invoke('download:open-file', filePath),
    showInFolder: (filePath) => ipcRenderer.invoke('download:show-in-folder', filePath),
    list: () => ipcRenderer.invoke('download:list'),
    cancel: (taskId) => ipcRenderer.invoke('download:cancel', taskId),
    clearFinished: () => ipcRenderer.invoke('download:clear-finished'),
    fileInfo: (filePath) => ipcRenderer.invoke('download:file-info', filePath),
    remove: (taskId, options) => ipcRenderer.invoke('download:remove', taskId, options),
    retry: (taskId) => ipcRenderer.invoke('download:retry', taskId),
    onUpdate: (callback) => subscribe('download:update', callback)
  },
  favorites: {
    list: () => ipcRenderer.invoke('favorites:list'),
    replace: (items) => ipcRenderer.invoke('favorites:replace', items),
    toggle: (item) => ipcRenderer.invoke('favorites:toggle', item),
    merge: (items) => ipcRenderer.invoke('favorites:merge', items),
    exists: () => ipcRenderer.invoke('favorites:exists'),
    export: () => ipcRenderer.invoke('favorites:export'),
    import: () => ipcRenderer.invoke('favorites:import')
  },
  wallpaper: {
    style: () => ipcRenderer.invoke('wallpaper:style'),
    setStyle: (style) => ipcRenderer.invoke('wallpaper:set-style', style)
  },
  rotation: {
    get: () => ipcRenderer.invoke('rotation:get'),
    update: (patch) => ipcRenderer.invoke('rotation:update', patch),
    runNow: () => ipcRenderer.invoke('rotation:run-now'),
    onState: (callback) => subscribe('rotation:state', callback)
  },
  system: {
    setWallpaper: (filePath) => ipcRenderer.invoke('system:set-wallpaper', filePath),
    setLockScreen: (filePath) => ipcRenderer.invoke('system:set-lockscreen', filePath),
    apply: (payload) => ipcRenderer.invoke('system:apply', payload),
    fileUrl: (filePath) => {
      const normalized = String(filePath || '').replace(/\\/g, '/')
      return `wallhaven-file://file/${encodeURIComponent(normalized)}`
    }
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized')
  },
  theme: {
    get: () => ipcRenderer.invoke('theme:get'),
    set: (mode) => ipcRenderer.invoke('theme:set', mode),
    onSystemChange: (callback) => subscribe('theme:system-changed', callback)
  },
  app: {
    info: () => ipcRenderer.invoke('app:info'),
    onNotify: (callback) => subscribe('app:notify', callback),
    onOpenPanel: (callback) => subscribe('app:open-panel', callback)
  },
  update: {
    getState: () => ipcRenderer.invoke('update:get-state'),
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    cancel: () => ipcRenderer.invoke('update:cancel'),
    install: () => ipcRenderer.invoke('update:install'),
    openReleasePage: () => ipcRenderer.invoke('update:open-release'),
    onState: (callback) => subscribe('update:state', callback)
  },
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url)
})
