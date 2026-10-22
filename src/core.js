// core.js contains low-level core functionality and configurations, as well as the global "status"
// It has no app dependencies

"use strict";

// System dependencies
var fs = require('fs');
var path = require("path");
var ip = require('ip');
var os = require('os');
const {
  app: electronApp,
} = require('electron');


// Global variables
const rootDir = path.join(__dirname, '..');

// Config
const config = {};
config.webPorts = [3000, 3020, 3200, 3220];
config.webPortIdx = 0;
config.nextWebPort = function() {
  config.webPort = config.webPorts[config.webPortIdx]
  config.webPortIdx++
  if (config.webPortIdx == config.webPorts.length) {
    throw new Error(`No ports were available to start the http server.\r\rWe tried ports ${config.webPorts.join(",")}.`);
  }
  return config.webPort;
}
config.webPort = process.env.WEB_PORT || config.nextWebPort();
config.posDecimals = process.env.DRO_DECIMALS || 3;
config.singleCommandMode = true; // set to false to send as many commands as will fit in the RX buffer
config.maxRecentFiles = 10;

// Persistent config
// Individual settings are stored and restores wholesale.
// If you add a new sub-field to the initial settings, it will be destroyed on load
const persistentConfig = {
  trayIcon: true,
  autoStart: true,
  defaultPaths: {},
  recentFiles: [],
  persistDisplayMode: false,
  grblWaitResponse: 1, // timeout for a response from Ctrl+X
  grblWaitReboot: 2, // timeout for bootloader to reboot after DTR toggle. this may have to be a large number for FluidNC, which takes a long time to start up
  spindleDelay: 0,
  enableUpdates: true,
  forceDevMode: false,
};

const configFilePath = path.join(electronApp.getPath('userData'), "config.json");

function findLocalIpAddress() {
  const virtKeywords = ['virtual', 'vbox', 'virtualbox', 'vmware', 'wsl', 'docker', 'vpn', 'vethernet'];
  const virtPrefixes = ['veth', 'br-', 'bridge', 'utun', 'vnet', 'lo'];

  const interfaces = os.networkInterfaces();
  for (const adapter in interfaces) {
    const name = adapter.toLowerCase();
    if (!virtKeywords.some(x => name.includes(x)) && !virtPrefixes.some(x => name.startsWith(x))) {
      const adapters = interfaces[adapter];
      for (var i = 0; i < adapters.length; i++) {
        const adapter = adapters[i];
        if (adapter.family == "IPv4" && !adapter.internal) {
          return adapter.address;
        }
      }
    }
  }

  return ip.address();
}

function getRepoName() {
  let repo = require('../package').repository;
  if (repo.startsWith('https://github.com/')) {
    repo = repo.substring(19);
  }
  return repo;
}

// Main status
const status = {
  driver: {
    version: require('../package').version,
    ipaddress: findLocalIpAddress(),
    webport: config.webPort,
    platform: process.platform,
    operatingsystem: false,
    powersettings: {
      usbselectiveAC: null,
      usbselectiveDC: null
    },
  },
  machine: {
    name: '',
    has4thAxis: false,
    inputs: [],
    overrides: {
      feedOverride: 100,
      spindleOverride: 100,
      realFeed: 0,
      realSpindle: 0
    },
    //
    tool: {
      nexttool: {
        number: 0,
        line: ""
      }
    },
    modals: {
      //motionmode: "G0", // G0, G1, G2, G3, G38.2, G38.3, G38.4, G38.5, G80
      coordinatesys: "G54", // G54, G55, G56, G57, G58, G59
      plane: "G17", // G17, G18, G19
      distancemode: "G90", // G90, G91
      arcdistmode: "G91.1", // G91.1
      feedratemode: "G94", // G93, G94
      unitsmode: "G21", // G20, G21
      radiuscomp: "G40", // G40
      tlomode: "G49", // G43.1, G49
      // programmode: "M0", // M0, M1, M2, M30
      spindlestate: "M5", // M3, M4, M5
      coolantstate: "M9", // M7, M8, M9
      homedRecently: false
      // tool: "0",
    },
    probe: {
      x: 0.00,
      y: 0.00,
      z: 0.00,
      state: -1
    },
    position: {
      work: {
        x: 0,
        y: 0,
        z: 0,
        a: 0,
        e: 0
      },
      offset: {
        x: 0,
        y: 0,
        z: 0,
        a: 0,
        e: 0
      }

    },
    firmware: {
      type: "",
      platform: "",
      version: "",
      date: "",
      buffer: [],
      features: [],
      blockBufferSize: 0,
      rxBufferSize: 0,
    },
  },
  comms: {
    connectionStatus: 0, //0 = not connected, 1 = opening, 2 = connected, 3 = playing, 4 = paused, 5 = alarm, 6 = firmware upgrade
    runStatus: "Pending",
    queue: 0,
    blocked: false,
    paused: false,
    interfaces: {
      type: "",
      ports: "",
      networkDevices: [],
      activePort: "" // or activeIP in the case of wifi/telnet?
    },
    alarm: ""
  },
  interface: {
    diskdrive: false,
    firmware: {
      availVersion: "",
      installedVersion: "",
    },
    connected: false,
  },
  misc: { // information to pass to the frontend
    jobStatus: 0, // 0 - no job, 1 - running, 2 - jog job running (can't be paused)
    trayIcon: true,
    autoStart: true,
    enableUpdates: true,
    lastFilePath: "",
    spindleDelay: 0,
    laserMode: false,
    repoName: getRepoName(),
  },
};

// debug_log implementation
// To see console.log output run with `DEBUGCONTROL=true electron .` or set environment variable for DEBUGCONTROL=true
// debug_log debug overhead
var DEBUG = false;
if (process.env.DEBUGCONTROL) {
  DEBUG = true;
  console.log("Console Debugging Enabled")
}
function debug_log() {
  if (DEBUG) {
    console.log.apply(this, arguments);
  }
} // end Debug Logger

debug_log("Starting Groove Control v" + status.driver.version)

process.on('uncaughtException', function(err) {
  if (DEBUG) {
    debug_log(err)
  } else {
    console.log(err);
  }
})

process.on('exit', () => debug_log('exit'))

function savePersistentConfig() {
  try {
    var text = JSON.stringify(persistentConfig, null, 2);
    fs.writeFileSync(configFilePath, text, 'utf8');
  } catch (err) {
    debug_log(err);
  }
}

function loadPersistentConfig() {
  try {
    var text = fs.readFileSync(configFilePath, 'utf8');
    var stored = JSON.parse(text);
    for (var prop in stored) {
      if (prop in persistentConfig && typeof(stored[prop]) == typeof(persistentConfig[prop])) {
        persistentConfig[prop] = stored[prop];
      }
    }
  } catch (err) {
    debug_log(err);
  }

  persistentConfig.grblWaitTime1 = Math.max(persistentConfig.grblWaitTime1, 0.1);
  persistentConfig.grblWaitTime2 = Math.max(persistentConfig.grblWaitTime2, 0.1);

  if (persistentConfig.spindleDelay != 3 && persistentConfig.spindleDelay != 5 && persistentConfig.spindleDelay != 8) {
    persistentConfig.spindleDelay = 0;
  }
  status.misc.spindleDelay = persistentConfig.spindleDelay;
}

function initCore() {
  loadPersistentConfig();
}

module.exports = {
  rootDir,
  debug_log,
  config,
  persistentConfig,
  status,
  savePersistentConfig,
  initCore,
};
