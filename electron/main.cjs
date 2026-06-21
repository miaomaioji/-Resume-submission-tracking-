const { app, BrowserWindow, protocol, net, shell } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const DIST = path.join(__dirname, '..', 'dist')

// 用自定义 app:// 协议加载,提供稳定 origin(IndexedDB 等存储才可靠;file:// 受限)
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true },
  })
  win.loadURL('app://local/index.html')
  // 外部链接(招聘链接等)用系统浏览器打开,不在应用内导航
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      void shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })
}

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url)
    const rel = !pathname || pathname === '/' ? '/index.html' : pathname
    const file = path.join(DIST, decodeURIComponent(rel))
    return net.fetch(pathToFileURL(file).toString())
  })
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
