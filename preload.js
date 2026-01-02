// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron');

// Expose IPC methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  pingHost: (host, port = 80) => ipcRenderer.invoke('ping:host', host, port),
  resolveDns: (hostname) => ipcRenderer.invoke('dns:resolve', hostname),
  checkHttpStatus: (url) => ipcRenderer.invoke('http:check', url),
});

console.log('Preload script loaded');
