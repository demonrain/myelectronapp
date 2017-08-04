const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')
const glob = require('glob')
const electron = require('electron')
const autoUpdater = require('./auto-updater')
const ipc = electron.ipcMain
const Menu = electron.Menu
const Tray = electron.Tray
const MenuItem = electron.MenuItem
const AutoUpdater = electron.autoUpdater
let appIcon = null;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function init() {
    var shouldQuit = makeSingleInstance()
    if (shouldQuit) return app.quit()

    loadDemos()

    function createWindow() {
        // Create the browser window.
        var windowOptions = {
            width: 1080,
            minWidth: 680,
            height: 840,
            title: app.getName()
        }
        win = new BrowserWindow(windowOptions)

        // and load the index.html of the app.
        win.loadURL(url.format({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true,
        }))

        // Open the DevTools.
        // win.webContents.openDevTools()

        // Emitted when the window is closed.
        win.on('closed', () => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            win = null
        })

        //tray图标
        const iconName = 'icons/windows-icon.png'
        const iconPath = path.join(__dirname, iconName)
        appIcon = new Tray(iconPath)
        const contextMenu = Menu.buildFromTemplate([{
            label: '退出',
            click: function () {
                app.quit()
            }
        }])
        appIcon.setToolTip('我是tray小图标')
        appIcon.setContextMenu(contextMenu)
    }

    // AutoUpdater.on('checking-for-update', function () {
    //     console.log('正在检查更新...')
    //     this.menuItem.label = '正在检查更新...'
    // })

    // AutoUpdater.on('update-available', function () {
    //     console.log('有可用更新')
    //     this.menuItem.label = '有可用更新'
    // })

    // AutoUpdater.on('update-not-available', function () {
    //     console.log('没有可用更新')
    //     this.menuItem.label = '没有可用更新'
    // })

    // AutoUpdater.on('update-downloaded', function () {
    //     this.menuItem.label = '下载完毕'
    //     menu.append(new MenuItem({ label: '开发者工具', click() { AutoUpdater.quitAndInstall() } }));
    //     console.log('下载完毕')
    // })
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on('ready', () => {
        createWindow()
        autoUpdater.initialize()
    })

    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
        // On macOS it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (appIcon) appIcon.destroy()
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (win === null) {
            createWindow()
        }
    })

    // In this file you can include the rest of your app's specific main process
    // code. You can also put them in separate files and require them here.
}

// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance() {
    if (process.mas) return false

    return app.makeSingleInstance(function () {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })
}

// Require each JS file in the main-process dir
function loadDemos() {
    var files = glob.sync(path.join(__dirname, 'main-process/**/*.js'))
    files.forEach(function (file) {
        require(file)
    })
    autoUpdater.updateMenu()
}

// Handle Squirrel on Windows startup events
switch (process.argv[1]) {
    case '--squirrel-install':
        autoUpdater.createShortcut(function () { app.quit() })
        break
    case '--squirrel-uninstall':
        autoUpdater.removeShortcut(function () { app.quit() })
        break
    case '--squirrel-obsolete':
    case '--squirrel-updated':
        app.quit()
        break
    default:
        init()
}