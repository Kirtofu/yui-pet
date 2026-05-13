// preload.js：安全地暴露 Electron API 给渲染进程
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  quit: () => ipcRenderer.invoke('pet:quit'),
  hide: () => ipcRenderer.invoke('pet:hide'),
  show: () => ipcRenderer.invoke('pet:show'),
  minimize: () => ipcRenderer.invoke('pet:minimize'),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('pet:set-always-on-top', flag),
  setOpacity: (value) => ipcRenderer.invoke('pet:set-opacity', value),
  setShowInTaskbar: (value) => ipcRenderer.invoke('pet:set-show-in-taskbar', value),
  setIgnoreMouse: (ignore) => ipcRenderer.invoke('pet:set-ignore-mouse', ignore),

  // 开机自启动
  setAutoLaunch: (enabled) => ipcRenderer.invoke('pet:set-auto-launch', enabled),
  getAutoLaunch: () => ipcRenderer.invoke('pet:get-auto-launch'),

  // 拖拽
  dragStart: (data) => ipcRenderer.invoke('pet:drag-start', data),
  dragMove: (data) => ipcRenderer.invoke('pet:drag-move', data),
  dragEnd: () => ipcRenderer.invoke('pet:drag-end'),

  // 设置持久化
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (data) => ipcRenderer.invoke('settings:set', data),

  // 屏幕信息
  getWorkArea: () => ipcRenderer.invoke('screen:get-work-area'),
  getCursorPoint: () => ipcRenderer.invoke('screen:get-cursor-point'),
  getPosition: () => ipcRenderer.invoke('pet:get-position'),
  setPosition: (x, y) => ipcRenderer.invoke('pet:set-position', x, y),

  // 动作执行
  executeAction: (action) => ipcRenderer.invoke('action:execute', action),

  // 系统托盘事件
  onTrayOpenSettings: (callback) => ipcRenderer.on('tray:open-settings', callback),
  onTrayOpenPomodoro: (callback) => ipcRenderer.on('tray:open-pomodoro', callback)
})
