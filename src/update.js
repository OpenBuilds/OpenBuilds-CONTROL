// update.js initialzies handles the auto update feature

"use strict";

const MAX_CHANGELOG_LINES = 16;

// System dependencies
var fs = require('fs');
var path = require('path');

const {
  shell,
} = require('electron');

const {
  autoUpdater,
  CancellationToken
} = require('electron-updater');


// App dependencies
const {
  debug_log,
  status,
  persistentConfig,
  savePersistentConfig,
} = require('./core.js');

const {
  serverEmit,
  addConnectionHandler,
  addDocReadyHandler,
} = require('./server.js');


// Global variables
var changelogText = "";
var downloadCancelToken = null;
var pendingInfo = null; // null - not ready, false - ready, object - send on next onDocReady

function createAutoUpdater(isPackaged) {
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.autoDownload = false;
  autoUpdater.fullChangelog = true;

  if (!isPackaged) {
    autoUpdater.forceDevUpdateConfig = true;
    let repo = require('../package').repository;
    if (repo.startsWith('https://github.com/')) {
      repo = repo.substring(19).split('/');
      autoUpdater.setFeedURL({provider: "github", owner: repo[0], repo: repo[1]});
    }
  }

  autoUpdater.on('update-available', (info) => {
    if (process.platform == 'win32') {
      info.canInstall = true;
    } else if (process.platform == 'linux') {
      // on Linux updates are supported only for AppImage packages
      info.canInstall = (process.env.APPIMAGE != undefined);
    } else { // Mac
      // The original OpenBuilds disables updates on Mac for some unknown reason. Until I can test it, auto updates will be disabled
    }

    if (pendingInfo == false) {
      serverEmit('update-available', info);
    } else {
      pendingInfo = info;
    }
  });

  autoUpdater.on('error', (ev, err) => {
    const string = err ? 'Error in auto-updater: \n' + err.split('SyntaxError')[0] : 'Error in auto-updater';
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    serverEmit('updatedata', output);
  })

  autoUpdater.on('download-progress', (ev) => {
    serverEmit('download-progress', Math.max(Math.floor(ev.percent), 99));
  })

  autoUpdater.on('update-cancelled', () => {
    downloadCancelToken = null;
    serverEmit('download-progress', -1);
  });

  autoUpdater.on('update-downloaded', () => {
    downloadCancelToken = null;
    serverEmit('download-progress', 100);
    autoUpdater.quitAndInstall();
  });

  autoUpdater.checkForUpdates();
}

function onConnection(socket) {
  socket.on("openUpdatePage", function() {
    shell.openExternal("https://github.com/" + status.misc.repoName + "/releases/latest");
  });

  socket.on("cancelUpdate", function() {
    if (downloadCancelToken) {
      downloadCancelToken.cancel();
      downloadCancelToken = null;
    }
  });

  socket.on("downloadAndInstall", function() {
    downloadCancelToken =  new CancellationToken();
    autoUpdater.downloadUpdate(downloadCancelToken);
  });

  socket.on("enableUpdates", function(enable) {
    persistentConfig.enableUpdates = enable;
    status.misc.enableUpdates = enable;
    savePersistentConfig();
  });
}

function onDocReady(result) {
  if (pendingInfo) {
    serverEmit('update-available', pendingInfo);
  }
  pendingInfo = false;
  result.changelogText = changelogText;
}

function initUpdate(isPackaged) {
  addConnectionHandler(onConnection);
  addDocReadyHandler(onDocReady);
  if (persistentConfig.enableUpdates) {
    createAutoUpdater(isPackaged);
  }
  status.misc.enableUpdates = persistentConfig.enableUpdates;

  try {
    const changelog = path.join(__dirname, "..", "CHANGELOG.txt");
    var text = fs.readFileSync(changelog, 'utf8');
    text = text.split(/\r?\n/, MAX_CHANGELOG_LINES);
    changelogText = text.join('\n');
  } catch (err) {
    debug_log(err);
  }
}

module.exports = {
  initUpdate
};
