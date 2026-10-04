const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('wallhaven', {
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    save: (patch) => ipcRenderer.invoke('config:save', patch)
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
    onUpdate: (callback) => {
      const listener = (_event, task) => callback(task)
      ipcRenderer.on('download:update', listener)
      return () => ipcRenderer.removeListener('download:update', listener)
    }
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
    onSystemChange: (callback) => {
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('theme:system-changed', listener)
      return () => ipcRenderer.removeListener('theme:system-changed', listener)
    }
  },
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url)
})
