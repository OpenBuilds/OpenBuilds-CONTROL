// update.js initialzies handles the auto update feature

"use strict";

// System dependencies
const {
  shell,
} = require('electron');


// App dependencies
const {
  debug_log,
  status,
} = require('./core.js');

const {
  serverEmit,
  addConnectionHandler,
} = require('./server.js');



// Global variables
var autoUpdater;
var updateIsDownloading = false;


function createAutoUpdater() {
  autoUpdater = require("electron-updater").autoUpdater;
  autoUpdater.autoInstallOnAppQuit = false;
  var availversion = '0.0.0'

  autoUpdater.on('checking-for-update', () => {
    var string = 'Starting update... Please wait';
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    serverEmit('updatedata', output);
  })

  // eslint-disable-next-line no-unused-vars
  autoUpdater.on('update-available', (ev, info) => {
    updateIsDownloading = true;
    var string = "Starting Download: v" + ev.version;
    availversion = ev.version
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    serverEmit('updatedata', output);
    debug_log(JSON.stringify(ev))
  })

  // eslint-disable-next-line no-unused-vars
  autoUpdater.on('update-not-available', (ev, info) => {
    var string = 'Update not available. Installed version: ' + status.driver.version + " / Available version: " + ev.version + ".\n";
    if (status.driver.version === ev.version) {
      string += "You are already running the latest version!"
    }
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    serverEmit('updatedata', output);
    debug_log(JSON.stringify(ev))
  })

  autoUpdater.on('error', (ev, err) => {
    const string = err ? 'Error in auto-updater: \n' + err.split('SyntaxError')[0] : 'Error in auto-updater';
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    serverEmit('updatedata', output);
  })

  // eslint-disable-next-line no-unused-vars
  autoUpdater.on('download-progress', (ev, progressObj) => {
    updateIsDownloading = true;
    var string = 'Download update ... ' + ev.percent.toFixed(1) + '%';
    debug_log(string)
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    serverEmit('updatedata', output);
    serverEmit('updateprogress', ev.percent.toFixed(0));
  })

  // eslint-disable-next-line no-unused-vars
  autoUpdater.on('update-downloaded', (info) => {
    var string = "New update ready";
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    serverEmit('updatedata', output);
    serverEmit('updateready', availversion);
    // repeat every minute
    setTimeout(function() {
      serverEmit('updateready', availversion);
    }, 1000 * 60 * 60 * 8) // 8hrs before alerting again if it was snoozed
    updateIsDownloading = false;
  });
}

function onConnection(socket) {
  socket.on("applyUpdate", function(installNow) {
    if (installNow) {
      autoUpdater.quitAndInstall();
    } else {
      autoUpdater.autoInstallOnAppQuit = true;
    }
  });

  socket.on("openUpdatePage", function() {
    shell.openExternal("https://github.com/" + status.misc.repoName + "/releases/latest");
  })

  socket.on("downloadUpdate", function() {
    if (!updateIsDownloading) {
      if (typeof autoUpdater !== 'undefined') {
        autoUpdater.checkForUpdates();
      } else {
        debug_log("autoUpdater not found")
      }
    }
  })

}

function initUpdate() {
  addConnectionHandler(onConnection);
  createAutoUpdater();

  if (process.platform == 'win32') {
    status.misc.updatesEnabled = true;
  }
  else if (process.platform == 'linux') {
    // on Linux updates are supported only for AppImage packages
    status.misc.updatesEnabled = (process.env.APPIMAGE != undefined);
  } else {
    // The original OpenBuilds disables updates on Mac for some unknown reason. Until I can test this, it will be disabled
  }
}

module.exports = {
  initUpdate
};
