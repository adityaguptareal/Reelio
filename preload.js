const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  selectFile: (filters) => ipcRenderer.invoke('dialog:selectFile', { filters }),
  generateVideos: (options) => ipcRenderer.invoke('video:generate', options),
  onLog: (callback) => ipcRenderer.on('video:log', (_, message) => callback(message)),
  onProgress: (callback) => ipcRenderer.on('video:progress', (_, status) => callback(status)),
  onComplete: (callback) => ipcRenderer.on('video:complete', (_, result) => callback(result)),
  onError: (callback) => ipcRenderer.on('video:error', (_, error) => callback(error))
});
