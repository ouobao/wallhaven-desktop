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
    wallpaper: (payload) => ipcRenderer.invoke('download:wallpaper', payload),
    setWallpaper: (payload) => ipcRenderer.invoke('download:set-wallpaper', payload),
    openFolder: () => ipcRenderer.invoke('download:open-folder')
  },
  system: {
    setWallpaper: (filePath) => ipcRenderer.invoke('system:set-wallpaper', filePath)
  },
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url)
})
