// systemInfo.js handles the collection and broadcast of the system info

"use strict";

// System dependencies
const path = require("path");
const os = require('os');
const si = require('systeminformation');
const {
  BrowserWindow,
  nativeImage,
} = require('electron');


// App dependencies
const {
  rootDir,
  debug_log,
  status,
} = require('./core.js');

const {
  serverEmit,
  addConnectionHandler,
  addDocReadyHandler,
} = require('./server.js');


// Global variables
var systemInformation;

async function getSystemInfo() {
  // Basic OS and hardware details
  const osType = os.type(); // 'Linux', 'Darwin' (Mac), 'Windows_NT'
  const osPlatform = os.platform(); // 'win32', 'linux', 'darwin', etc.
  const osRelease = os.release(); // OS version
  const arch = os.arch(); // 'x64', 'arm', 'arm64', etc.
  const totalMemory = os.totalmem();
  const networkInterfaces = os.networkInterfaces();
  const cpu = os.cpus();

  // Additional system information using systeminformation
  const [baseboard, graphics, osInfo] = await Promise.all([
    si.baseboard(),
    si.graphics(),
    si.osInfo()
  ]);

  // Prepare systemInformation JSON object
  systemInformation = {
    operatingSystem: {
      type: osType,
      platform: osPlatform,
      release: osRelease,
      arch: arch,
      distro: osInfo.distro || "N/A",
      version: osInfo.release || "N/A",
      codename: osInfo.codename || "N/A",
    },
    hardware: {
      cpu: cpu.map(core => ({
        model: core.model,
        speed: core.speed, // in MHz
        times: core.times
      })),
      motherboard: {
        manufacturer: baseboard.manufacturer,
        model: baseboard.model,
        version: baseboard.version,
        serialNumber: baseboard.serial,
      },
      gpu: graphics.controllers.map(gpu => ({
        model: gpu.model,
        vendor: gpu.vendor,
        vram: gpu.vram, // in MB
        bus: gpu.bus
      })),
      memory: {
        total: (totalMemory / (1024 * 1024 * 1024)).toFixed(2) + " GB",
        free: (os.freemem() / (1024 * 1024 * 1024)).toFixed(2) + " GB",
      },
    },
    network: Object.keys(networkInterfaces).map(iface => ({
      interface: iface,
      addresses: networkInterfaces[iface].map(addr => ({
        address: addr.address,
        family: addr.family,
        internal: addr.internal,
      })),
    })),
  };

  serverEmit("sysinfo", systemInformation);

  // Timer to update free memory every minute
  setInterval(() => {
    systemInformation.hardware.memory.free = (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + " GB";
    serverEmit("sysinfo", systemInformation);
  }, 60000); // 60,000 ms = 1 minute

  // Log the initial systemInformation object
  debug_log(JSON.stringify(systemInformation, null, 2));

  return systemInformation;
}

function showGpuInfo() {
  // GPU
  var gpuInfoWindow = new BrowserWindow({
    // 1366 * 768 == minimum to cater for
    width: 800,
    height: 800,
    fullscreen: false,
    center: true,
    resizable: true,
    maximizable: true,
    title: "Groove Control: Chromium's GPU Report",
    frame: true,
    autoHideMenuBar: true,
    icon: nativeImage.createFromPath(
      path.join(rootDir, "/app/favicon.png")
    ),
    webgl: true,
    experimentalFeatures: true,
    experimentalCanvasFeatures: true,
    offscreen: true,
    backgroundColor: "#fff"
  });
  gpuInfoWindow.loadURL("chrome://gpu");

  gpuInfoWindow.once('ready-to-show', () => {
    gpuInfoWindow.show()
    gpuInfoWindow.setAlwaysOnTop(true);
    gpuInfoWindow.focus();
    gpuInfoWindow.setAlwaysOnTop(false);
  })
}

// Check USB Selective Suspend Settings
function checkPowerSettings() {
  if (process.platform == 'win32') {
    debug_log("Checking Power Settings")
    var powerplan = "";
    const {
      exec
    } = require('child_process');

    // eslint-disable-next-line no-unused-vars
    const cfg = exec('powercfg /GETACTIVESCHEME', function(error, stdout, stderr) {
      if (error) {
        debug_log(error.stack);
        debug_log('Error code: ' + error.code);
        debug_log('Signal received: ' + error.signal);
      }
      powerplan = stdout.split(":")[1].split("()")[0].trim()
    });

    cfg.on('exit', function(code) {
      debug_log('powercfg /GETACTIVESCHEME exited with exit code ' + code);
      if (code == 0) {
        // eslint-disable-next-line no-unused-vars
        const usbsetting = exec('powercfg /q ' + powerplan, function(error, stdout, stderr) {
          if (error) {
            debug_log(error.stack);
            debug_log('Error code: ' + error.code);
            debug_log('Signal received: ' + error.signal);
          }
          var usbselective = (stdout.slice(stdout.search("USB selective suspend setting") - 1)).split("\n")
          usbselective.length = 7;

          if (usbselective[5].indexOf("0x00000000") != -1) {
            debug_log("USB Selective Suspend DISABLED on AC power ")
            status.driver.powersettings.usbselectiveAC = false;
          } else if (usbselective[5].indexOf("0x00000001") != -1) {
            debug_log("USB Selective Suspend ENABLED on AC power ")
            status.driver.powersettings.usbselectiveAC = true;
          }

          if (usbselective[6].indexOf("0x00000000") != -1) {
            debug_log("USB Selective Suspend DISABLED on DC power ")
            status.driver.powersettings.usbselectiveDC = false;
          } else if (usbselective[6].indexOf("0x00000001") != -1) {
            debug_log("USB Selective Suspend ENABLED on DC power ")
            status.driver.powersettings.usbselectiveDC = true;
          }
        });
        usbsetting.on('exit', function(code) {
          debug_log('powercfg /q exited with exit code ' + code);
          setTimeout(function() {
            debug_log(status.driver.powersettings.usbselectiveDC, status.driver.powersettings.usbselectiveAC)
          }, 100);
        })
      }
    });
    //  end USB Selective Suspend
  }
}

function onConnection(socket) {
  socket.on("gpuinfo", showGpuInfo);
}

function onDocReady(result) {
  result.sysInfo = systemInformation;
}

function initSystemInfo() {
  getSystemInfo().catch(err => console.error("Error retrieving system information:", err));
  addConnectionHandler(onConnection);
  addDocReadyHandler(onDocReady);
  checkPowerSettings();
}

module.exports = {
  initSystemInfo
};
