const app = require('electron').app
const autoUpdater = require('electron').autoUpdater
const ChildProcess = require('child_process')
const Menu = require('electron').Menu
const path = require('path')
const pjson = require('./package.json')
const electron = require('electron')

var state = 'checking'

exports.initialize = function () {
  if (process.mas) return

  autoUpdater.on('checking-for-update', function () {
    const options = {
      type: 'info',
      title: '提示',
      buttons: ['Ok'],
      message: '检查更新'
    }
    electron.dialog.showMessageBox(electron.BrowserWindow.getFocusedWindow(), options, function () { })
    state = 'checking'
    exports.updateMenu()
  })

  autoUpdater.on('update-available', function () {
    const options = {
      type: 'info',
      title: '提示',
      buttons: ['Ok'],
      message: '有可用更新'
    }
    electron.dialog.showMessageBox(electron.BrowserWindow.getFocusedWindow(), options, function () { })
    state = 'checking'
    exports.updateMenu()
  })

  autoUpdater.on('update-downloaded', function () {
    const options = {
      type: 'info',
      title: '提示',
      buttons: ['Ok'],
      message: '更新下载'
    }
    state = 'installed'
    electron.dialog.showMessageBox(electron.BrowserWindow.getFocusedWindow(), options, function () { })
    exports.updateMenu()
  })

  autoUpdater.on('update-not-available', function () {
    const options = {
      type: 'info',
      title: '提示',
      buttons: ['Ok'],
      message: '没有发现更新'
    }
    electron.dialog.showMessageBox(electron.BrowserWindow.getFocusedWindow(), options, function () { })
    state = 'no-update'
    exports.updateMenu()
  })

  autoUpdater.on('error', function (e) {
    const options = {
      type: 'info',
      title: '错误',
      buttons: ['Ok'],
      message: '更新发生错误：\n' + e
    }
    electron.dialog.showMessageBox(electron.BrowserWindow.getFocusedWindow(), options, function () { })
    state = 'no-update'
    exports.updateMenu()
  })

  autoUpdater.setFeedURL(`http://localhost/update/win64/${pjson.version}/stable`)
  if (process.argv[1] == '--squirrel-firstrun') {
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000)
  } else {
    autoUpdater.checkForUpdates();
  }
}

exports.updateMenu = function () {
  if (process.mas) return

  var menu = Menu.getApplicationMenu()
  if (!menu) return

  menu.items.forEach(function (item) {
    if (item.submenu) {
      item.submenu.items.forEach(function (item) {
        switch (item.key) {
          case 'checkForUpdate':
            item.visible = state === 'no-update'
            break
          case 'checkingForUpdate':
            item.visible = state === 'checking'
            break
          case 'restartToUpdate':
            item.visible = state === 'installed'
            break
        }
      })
    }
  })
}

exports.createShortcut = function (callback) {
  spawnUpdate([
    '--createShortcut',
    path.basename(process.execPath),
    '--shortcut-locations',
    'StartMenu'
  ], callback)
}

exports.removeShortcut = function (callback) {
  spawnUpdate([
    '--removeShortcut',
    path.basename(process.execPath)
  ], callback)
}

function spawnUpdate(args, callback) {
  var updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe')
  var stdout = ''
  var spawned = null

  try {
    spawned = ChildProcess.spawn(updateExe, args)
  } catch (error) {
    if (error && error.stdout == null) error.stdout = stdout
    process.nextTick(function () { callback(error) })
    return
  }

  var error = null

  spawned.stdout.on('data', function (data) { stdout += data })

  spawned.on('error', function (processError) {
    if (!error) error = processError
  })

  spawned.on('close', function (code, signal) {
    if (!error && code !== 0) {
      error = new Error('Command failed: ' + code + ' ' + signal)
    }
    if (error && error.code == null) error.code = code
    if (error && error.stdout == null) error.stdout = stdout
    callback(error)
  })
}
