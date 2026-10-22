// main.js initialzies all modules and creates the main app

"use strict";

// System dependencies
const path = require("path");
const ip = require("ip");
const {
  BrowserWindow,
  Tray,
  nativeImage,
  Menu,
  shell,
  app: electronApp,
} = require('electron');


// App dependencies
const {
  rootDir,
  debug_log,
  status,
  config,
  persistentConfig,
  savePersistentConfig,
  initCore
} = require('./core.js');

const {
  initJogWindowAPI
} = require('./jogWindowAPI.js');

const {
  serverEmit,
  app,
  addConnectionHandler,
  addDocReadyHandler,
  removeDocReadyHandler,
  initServer
} = require('./server.js');

const {
  readGcodeFile,
  allowedFilePaths,
  addRecentFile,
  initFiles
} = require('./files.js');

const {
  initSystemInfo
} = require('./systemInfo.js');

const {
  initGrblPort
} = require('./grblPort.js');

const {
  initGrblSender
} = require('./grblSender.js');

const {
  initGrblUtilities
} = require('./grblUtilities.js');

const {
  initFlash
} = require('./flash.js');

const {
  initUpdate
} = require('./update.js');


// Global variables
const iconPath = path.join(rootDir, 'app/icon.png');

var devMode = false;
var safeMode = false;
var appCreated = false;
var forceShowGui = false;

var appIcon = null,
  jogWindow = null,
  forceQuit;


// eslint-disable-next-line no-unused-vars
function onSecondInstance(event, commandLine, workingDirectory) {
  //Someone tried to run a second instance, we should focus our window.
  // debug_log('SingleInstance')

  debug_log(commandLine);

  for (var i = 0; i < commandLine.length; i++) {
    const arg = commandLine[i];
    var ext = path.extname(arg).toLowerCase();
    if ([".obc", ".gcode", ".gc", ".tap", ".nc", ".cnc"].indexOf(ext) >= 0) {
      allowedFilePaths.add(arg);
      readGcodeFile(arg, true, addRecentFile);
      if (ext == ".obc") {
        return;
      }
    }
  }

  showJogWindow();
}

// Module to create native browser window.
function createApp() {
  appCreated = true;

  var showGui = forceShowGui || process.argv.indexOf("-showGui") > 0;
  status.misc.trayIcon = persistentConfig.trayIcon;
  status.misc.autoStart = persistentConfig.autoStart;

  if (process.platform == 'darwin') {
    debug_log("Creating MacOS Menu");
    status.driver.operatingsystem = 'macos';
    createTrayIcon();
    createMacMenu();
    showGui = true;
  }
  else if (process.platform == 'win32') {
    status.driver.operatingsystem = 'windows';
    if (persistentConfig.trayIcon) {
      createTrayIcon();
      showGui = !persistentConfig.autoStart;
    } else {
      showGui = true;
    }
  }
  else if (process.platform == 'linux') {
    status.driver.operatingsystem = 'linux';
    if (persistentConfig.trayIcon) {
      createTrayIcon();
    }
    showGui = true;
  }

  const pathIndex = electronApp.isPackaged ? 1 : 2;
  if (pathIndex < process.argv.length) {
    var openFilePath = process.argv[pathIndex];
    if (openFilePath !== "" && openFilePath[0] != '-') {
      debug_log("path" + openFilePath);
      allowedFilePaths.add(openFilePath);
      showGui = true;
      readGcodeFile(openFilePath, true, addRecentFile);
    }
  }

  devMode = process.argv.indexOf("-devMode") > 0 || persistentConfig.forceDevMode;
  safeMode = process.argv.indexOf("-safeMode") > 0;
  if (showGui) {
    showJogWindow();
  }
}

function exitApp() {
  if (appIcon) {
    appIcon.destroy();
  }
  electronApp.exit(0);
}

function createMacMenu() {
  var template = [{
    label: "Application",
    submenu: [{
      label: "Quit",
      accelerator: "Command+Q",
      click: exitApp
    }]
  }, {
    label: "Edit",
    submenu: [{
        label: "Cut",
        accelerator: "CmdOrCtrl+X",
        selector: "cut:"
      },
      {
        label: "Copy",
        accelerator: "CmdOrCtrl+C",
        selector: "copy:"
      },
      {
        label: "Paste",
        accelerator: "CmdOrCtrl+V",
        selector: "paste:"
      },
      {
        label: "Select All",
        accelerator: "CmdOrCtrl+A",
        selector: "selectAll:"
      }
    ]
  }, {
    label: "View",
    submenu: [{
        label: "Reload",
        accelerator: "F5",
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            // on reload, start fresh and close any old
            // open secondary windows
            if (focusedWindow.id === 1) {
              BrowserWindow.getAllWindows().forEach(win => {
                if (win.id > 1) win.close();
              });
            }
            focusedWindow.reload();
          }
        }
      },
      {
        label: "Toggle Dev Tools",
        accelerator: "F12",
        click: () => {
          jogWindow.webContents.toggleDevTools();
        }
      }
    ]
  }];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function onShowTraySettings() {
  serverEmit('showSettings', "os");
  removeDocReadyHandler(onShowTraySettings);
}

function createTrayIcon() {
  console.log("Creating Tray Icon");
  if (process.platform !== 'darwin') {
    appIcon = appIcon || new Tray(nativeImage.createFromPath(iconPath));
    const contextMenuTemplate = [{
      label: 'Open User Interface (GUI)',
      click: showJogWindow
    },
    {
      label: 'Quit OpenBuilds CONTROL',
      click: exitApp
    }];
    if (process.platform == 'win32' || process.platform == 'linux') {
      contextMenuTemplate.push({type: 'separator'});
      contextMenuTemplate.push({
        label: process.platform == 'win32' ? 'Configure Tray Icon and Auto Start' : 'Configure Tray Icon',
        click() {
          if (jogWindow) {
            showJogWindow();
            serverEmit('showSettings', "os");
          } else {
            addDocReadyHandler(onShowTraySettings);
            showJogWindow();
          }
        }
      });
    }

    const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
    if (appIcon) {
      appIcon.on('click', showJogWindow);
    }

    if (appIcon) {
      appIcon.on('balloon-click', showJogWindow);
    }

    // Call this again for Linux because we modified the context menu
    if (appIcon) {
      appIcon.setContextMenu(contextMenu)
    }

    if (appIcon) {
      appIcon.displayBalloon({
        icon: nativeImage.createFromPath(iconPath),
        title: "OpenBuilds CONTROL Started",
        content: "OpenBuilds CONTROL has started successfully"
      })
    }
  } else { // darwin
    const dockMenu = Menu.buildFromTemplate([{
      label: 'Quit OpenBuilds CONTROL',
      click() {
        electronApp.exit(0);
      }
    }])
    electronApp.dock.setMenu(dockMenu)
  };
}

function destroyTrayIcon() {
  if (appIcon) {
    if (process.platform == 'linux') {
      // There is a bug with Electron on Linux that fails to properly destroy the tray icon.
      // We keep it around but with an empty menu. It will be gone after the app closes.
      appIcon.setContextMenu(Menu.buildFromTemplate([]));
    } else {
      appIcon.destroy();
      appIcon = null;
    }
  }
}

function setTrayIcon(enabled) {
  if (enabled != persistentConfig.trayIcon) {
    persistentConfig.trayIcon = enabled;
    status.misc.trayIcon = enabled;
    savePersistentConfig();

    if (process.platform == 'win32' || process.platform == 'linux') {
      if (enabled) {
        createTrayIcon();
      }
      else {
        destroyTrayIcon();
      }
    }
  }
}

function setAutoStart(enabled) {
  if (enabled != persistentConfig.autoStart) {
    persistentConfig.autoStart = enabled;
    status.misc.autoStart = enabled;
    savePersistentConfig();

    if (process.platform == 'win32') {
      electronApp.setLoginItemSettings({
        openAtLogin: enabled,
        args: []
      });
    }
  }
}

// Create the browser window.
function createJogWindow() {
  const PERSISTED_STATE_TAG = 'main-window';
  if (process.argv.indexOf("-resetSize") > 0) {
    BrowserWindow.clearPersistedState(PERSISTED_STATE_TAG);
  }

  jogWindow = new BrowserWindow({
    width: 1000,
    minWidth: 1000,
    height: 850,
    minHeight: 850,
    fullscreen: false,
    center: true,
    resizable: true,
    maximizable: true,
    title: "OpenBuilds CONTROL ",
    name: PERSISTED_STATE_TAG,
    frame: false,
    autoHideMenuBar: true,
    icon: nativeImage.createFromPath(
      path.join(rootDir, "/app/favicon.png")
    ),
    webgl: true,
    experimentalFeatures: true,
    experimentalCanvasFeatures: true,
    offscreen: true,
    backgroundColor: "#fff",
    webPreferences: { // in devMode allow everything, otherwise enable security
      nodeIntegration: devMode,
      contextIsolation: !devMode,
    },
    windowStatePersistence: {
      bounds: true,
      displayMode: persistentConfig.persistDisplayMode
    }
  });

  if (!electronApp.isPackaged) {
    jogWindow.setOverlayIcon(nativeImage.createFromPath(iconPath), 'Icon');
  }

  var url = `http://localhost:${config.webPort}/`;
  if (safeMode) {
    url += "?safeMode=true";
  }
  jogWindow.loadURL(url);

  if (process.argv.indexOf("-debug") > 0) {
    jogWindow.webContents.openDevTools();
  }

  jogWindow.on('close', function() {
    if (!forceQuit) {
      jogWindow.hide();
      return false;
    }
  });

  // Emitted when the window is closed.
  jogWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    jogWindow = null;
  });

  jogWindow.once('ready-to-show', showJogWindow);
}

function showJogWindow() {
  if (!appCreated) {
    forceShowGui = true;
    return;
  }
  if (jogWindow === null) {
    createJogWindow();
  }
  jogWindow.show();
  jogWindow.setAlwaysOnTop(true);
  jogWindow.focus();
  jogWindow.setAlwaysOnTop(false);
}

function initElectron() {
  electronApp.setAppUserModelId("openbuilds.control")
  electronApp.commandLine.appendSwitch('ignore-gpu-blacklist')
  electronApp.commandLine.appendSwitch('enable-gpu-rasterization')
  electronApp.commandLine.appendSwitch('enable-zero-copy')
  debug_log("Local User Data: " + electronApp.getPath('userData'))

  const gotTheLock = electronApp.requestSingleInstanceLock()
  if (!gotTheLock) {
    debug_log("Already running! Check the System Tray")
    electronApp.exit(0);
    electronApp.quit();
    return;
  }

  electronApp.on('second-instance', onSecondInstance);

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  electronApp.on('ready', createApp);

  electronApp.on('before-quit', function() {
    forceQuit = true;
  })

  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // We don't take that route, we close it completely
  electronApp.on('will-quit', exitApp);

  // Quit when all windows are closed.
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  electronApp.on('window-all-closed', exitApp);

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  electronApp.on('activate', createApp);

  // Autostart on Login
  if (process.platform == 'win32' && persistentConfig.autoStart) {
    electronApp.setLoginItemSettings({
      openAtLogin: true,
      args: []
    })
  }
}

function onConnection(socket) {
  socket.on("openbuilds", function() {
    shell.openExternal('https://github.com/OpenBuilds/OpenBuilds-CONTROL')
  });

  socket.on("opencam", function() {
    shell.openExternal('https://github.com/OpenBuilds/OpenBuilds-CAM')
  });

  socket.on("opendocs", function() {
    shell.openExternal('https://github.com/OpenBuilds/docs-migrated/wiki')
  });

  socket.on("openforum", function() {
    shell.openExternal('https://github.com/OpenBuilds/docs-migrated/wiki')
  });

  socket.on("minimisetotray", function() {
    if (persistentConfig.trayIcon) {
      jogWindow.hide();
    } else {
      exitApp();
    }
  });

  socket.on("minimize", function() {
    jogWindow.minimize();
  });

  socket.on("maximize", function() {
    if (jogWindow.isFullScreen()) {
      jogWindow.setFullScreen(false);
    }
    if (jogWindow.isMaximized()) {
      jogWindow.unmaximize();
    } else {
      jogWindow.maximize();
    }
  });

  socket.on("fullscreen", function() {
    if (jogWindow.isFullScreen()) {
      jogWindow.setFullScreen(false);
    } else {
      jogWindow.setFullScreen(true);
    }
  });

  socket.on("quit", exitApp);

  socket.on("trayIcon", setTrayIcon);
  socket.on("autoStart", setAutoStart);
}

function main() {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1';

  app.get('/api/version', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    const data = {
      "application": "OMD",
      "version": status.driver.version,
      "ipaddress": ip.address() + ":" + config.webPort
    };
    res.send(JSON.stringify(data), null, 2);
  })

  app.get('/activate', (req, res) => {
    debug_log(req.hostname)
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.send('Host: ' + req.hostname + ' asked to activate OpenBuilds CONTROL v' + status.driver.version);
    showJogWindow()
    setTimeout(function() {
      serverEmit('activate', req.hostname);
    }, 500);
  })

  app.on('certificate-error', function(event, webContents, url, error,
    certificate, callback) {
    event.preventDefault();
    callback(true);
  });

  addConnectionHandler(onConnection);

  // must be first module to load the config file
  initCore();

  initJogWindowAPI(() => jogWindow, showJogWindow);
  initFiles();
  initSystemInfo();
  initGrblPort();
  initGrblSender();
  initGrblUtilities();
  initFlash();

  initUpdate(electronApp.isPackaged);

  // must be the last module to start the server once all handlers are registered
  initServer();

  initElectron();

  // Global Update loop
  setInterval(function() {
    serverEmit("status", status);
  }, 100);
}

main();
