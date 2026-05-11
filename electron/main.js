// Electron 主进程：负责创建透明、无边框、置顶的桌宠窗口
const { app, BrowserWindow, ipcMain, screen, Menu, Tray, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development'

// 保存窗口实例，避免被 GC
let petWindow = null
let tray = null
let isQuitting = false

// 用户数据文件：保存位置 / 设置 / 情绪等
const userDataDir = app.getPath('userData')
const settingsPath = path.join(userDataDir, 'pet-settings.json')

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    }
  } catch (e) {
    console.error('[settings] load error', e)
  }
  return {}
}

function saveSettings(data) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('[settings] save error', e)
  }
}

function clampWindowPosition(x, y, width, height) {
  const displays = screen.getAllDisplays()
  const centerX = x + width / 2
  const centerY = y + height / 2

  const containingDisplay = displays.find(({ workArea }) => (
    centerX >= workArea.x &&
    centerX <= workArea.x + workArea.width &&
    centerY >= workArea.y &&
    centerY <= workArea.y + workArea.height
  ))

  const nearestDisplay = containingDisplay || displays.reduce((nearest, display) => {
    const area = display.workArea
    const clampedX = Math.max(area.x, Math.min(centerX, area.x + area.width))
    const clampedY = Math.max(area.y, Math.min(centerY, area.y + area.height))
    const distance = Math.hypot(centerX - clampedX, centerY - clampedY)
    return !nearest || distance < nearest.distance ? { display, distance } : nearest
  }, null).display

  const area = nearestDisplay.workArea
  return {
    x: Math.max(area.x, Math.min(x, area.x + area.width - width)),
    y: Math.max(area.y, Math.min(y, area.y + area.height - height))
  }
}

function showPetWindow() {
  if (!petWindow) return
  if (petWindow.isMinimized()) petWindow.restore()
  petWindow.show()
  petWindow.focus()
}

function createTray() {
  if (tray) return

  const iconPath = path.join(__dirname, 'tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon)
  tray.setToolTip('Desktop Pet')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示桌宠', click: showPetWindow },
    {
      label: '隐藏桌宠',
      click: () => {
        if (petWindow) petWindow.hide()
      }
    },
    { type: 'separator' },
    {
      label: '打开设置',
      click: () => {
        showPetWindow()
        if (petWindow) petWindow.webContents.send('tray:open-settings')
      }
    },
    {
      label: '番茄钟',
      click: () => {
        showPetWindow()
        if (petWindow) petWindow.webContents.send('tray:open-pomodoro')
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ]))

  tray.on('double-click', () => {
    if (!petWindow) return
    if (petWindow.isVisible()) {
      petWindow.hide()
    } else {
      showPetWindow()
    }
  })
}

function createPetWindow() {
  const settings = loadSettings()
  const appSettings = settings.appData && settings.appData.settings ? settings.appData.settings : settings
  const { workArea } = screen.getPrimaryDisplay()

  // 默认窗口尺寸；桌宠可以通过内部缩放调节显示大小
  const winWidth = 360
  const winHeight = 480

  const defaultX = workArea.x + workArea.width - winWidth - 40
  const defaultY = workArea.y + workArea.height - winHeight - 40
  const savedX = typeof settings.x === 'number' ? settings.x : defaultX
  const savedY = typeof settings.y === 'number' ? settings.y : defaultY
  const windowPosition = clampWindowPosition(savedX, savedY, winWidth, winHeight)
  if (windowPosition.x !== savedX || windowPosition.y !== savedY) {
    saveSettings({ ...settings, x: windowPosition.x, y: windowPosition.y })
  }

  petWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: windowPosition.x,
    y: windowPosition.y,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: !appSettings.showInTaskbar,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  petWindow.setAlwaysOnTop(true, 'screen-saver')
  petWindow.setOpacity(Math.max(0.3, Math.min(1, Number(appSettings.opacity) || 1)))
  petWindow.setVisibleOnAllWorkspaces(true)

  if (isDev) {
    petWindow.loadURL('http://localhost:5173')
    // 开发时可按需打开：petWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    petWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  petWindow.once('ready-to-show', () => {
    showPetWindow()
  })

  // 保存位置
  const persistBounds = () => {
    if (!petWindow) return
    const [x, y] = petWindow.getPosition()
    const current = loadSettings()
    saveSettings({ ...current, x, y })
  }
  petWindow.on('move', persistBounds)
  petWindow.on('close', event => {
    persistBounds()
    if (!isQuitting) {
      event.preventDefault()
      petWindow.hide()
    }
  })
}

// 单实例锁
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showPetWindow()
  })
}

app.whenReady().then(() => {
  createTray()
  createPetWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createPetWindow()
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ====================== IPC: 窗口控制 ======================

ipcMain.handle('pet:quit', () => {
  isQuitting = true
  app.quit()
})

ipcMain.handle('pet:hide', () => {
  if (petWindow) petWindow.hide()
})

ipcMain.handle('pet:show', () => {
  showPetWindow()
})

ipcMain.handle('pet:minimize', () => {
  if (petWindow) petWindow.minimize()
})

ipcMain.handle('pet:set-always-on-top', (_evt, flag) => {
  if (petWindow) petWindow.setAlwaysOnTop(Boolean(flag), 'screen-saver')
})

ipcMain.handle('pet:set-opacity', (_evt, value) => {
  if (petWindow) petWindow.setOpacity(Math.max(0.3, Math.min(1, Number(value) || 1)))
})

ipcMain.handle('pet:set-show-in-taskbar', (_evt, value) => {
  if (petWindow) petWindow.setSkipTaskbar(!Boolean(value))
})

ipcMain.handle('pet:set-ignore-mouse', (_evt, ignore) => {
  if (petWindow) petWindow.setIgnoreMouseEvents(Boolean(ignore), { forward: true })
})

// 开机自启动
ipcMain.handle('pet:set-auto-launch', (_evt, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: Boolean(enabled),
    path: process.execPath
  })
  const current = loadSettings()
  saveSettings({ ...current, autoLaunch: Boolean(enabled) })
})

ipcMain.handle('pet:get-auto-launch', () => {
  const info = app.getLoginItemSettings()
  return info.openAtLogin
})

// ====================== IPC: 拖拽 ======================
// 由渲染进程监听鼠标按下/移动，然后让主进程移动窗口，保证跨平台一致。
let dragOffset = null
ipcMain.handle('pet:drag-start', (_evt, { offsetX, offsetY }) => {
  dragOffset = { offsetX, offsetY }
})

ipcMain.handle('pet:drag-move', (_evt, { screenX, screenY }) => {
  if (!petWindow || !dragOffset) return
  const newX = Math.round(screenX - dragOffset.offsetX)
  const newY = Math.round(screenY - dragOffset.offsetY)
  petWindow.setPosition(newX, newY)
})

ipcMain.handle('pet:drag-end', () => {
  dragOffset = null
})

// ====================== IPC: 设置持久化 ======================

ipcMain.handle('settings:get', () => loadSettings())
ipcMain.handle('settings:set', (_evt, data) => {
  const current = loadSettings()
  saveSettings({ ...current, ...data })
  return true
})

// ====================== IPC: 获取屏幕信息 ======================

ipcMain.handle('screen:get-work-area', () => {
  return screen.getPrimaryDisplay().workArea
})

ipcMain.handle('screen:get-cursor-point', () => {
  return screen.getCursorScreenPoint()
})

ipcMain.handle('pet:get-position', () => {
  if (!petWindow) return [0, 0]
  return petWindow.getPosition()
})

ipcMain.handle('pet:set-position', (_evt, x, y) => {
  if (petWindow) petWindow.setPosition(Math.round(x), Math.round(y))
})
