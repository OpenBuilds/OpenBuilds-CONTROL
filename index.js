process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1';

process.on('uncaughtException', function(err) {
  //showErrorDialog(err, attempts = 2) // make two attempts to show an uncaughtException in a dialog
  if (DEBUG) {
    debug_log(err)
  } else {
    console.log(err);
  }
})

function showErrorDialog(err, attempts) {
  console.error('Attempting to show an error dialog.')
  if (!attempts) return;
  try {
    let options = {
      type: 'error',
      buttons: ['OK'],
      title: 'Error',
      message: `An error occured.`,
      detail: `${err.message}\r\r\rIf you feel this shouldn't be happening, please report it at:\r\rhttps://github.com/OpenBuilds/OpenBuilds-CONTROL/issues`,
    };
    let window = BrowserWindow.getFocusedWindow()
    dialog.showMessageBoxSync(window, options)
  } catch (e) {
    console.error(`An error occurred trying show an error, ho-boy. ${e}. We'll try again ${attempts} more time(s).`)
    setTimeout(() => {
      showErrorDialog(err, --attempts)
    }, millisecondDelay = 2000);
  }
}

// To see console.log output run with `DEBUGCONTROL=true electron .` or set environment variable for DEBUGCONTROL=true
// debug_log debug overhead
DEBUG = false;
if (process.env.DEBUGCONTROL) {
  DEBUG = true;
  console.log("Console Debugging Enabled")
}

function debug_log() {
  if (DEBUG) {
    console.log.apply(this, arguments);
  }
} // end Debug Logger

debug_log("Starting OpenBuilds CONTROL v" + require('./package').version)

var config = {};
config.webPorts = [3000, 3020, 3200, 3220]
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
config.posDecimals = process.env.DRO_DECIMALS || 2;
config.grblWaitTime = 0.5;
config.firmwareWaitTime = 4;
config.aggressiveHomeReset = true;

var express = require("express");
var app = express();
var http = require("http").Server(app);
var https = require('https');

//var ioServer = require('socket.io');
const {
  Server: ioServer
} = require('socket.io');

var io = new ioServer();

var fs = require('fs');
var path = require("path");
const join = require('path').join;
const {
  mkdirp
} = require('mkdirp')


//const drivelist = require('drivelist'); // removed in 1.0.350 due to Drivelist stability issues

// FluidNC test
var fluidncConfig = "";
// FluidNC end test

app.use(express.static(path.join(__dirname, "app")));
//app.use(express.limit('200M'));

app.use(function setCommonHeaders(req, res, next) {
  res.set("Access-Control-Allow-Private-Network", "true");
  next();
});

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Private-Network", "true");
  next();
});


// Interface firmware flash
app.post('/uploadCustomFirmware', (req, res) => {
  // 'firmwareBin' is the name of our file input field in the HTML form
  let upload = multer({
    storage: storage
  }).single('firmwareBin');

  upload(req, res, function(err) {
    // req.file contains information of uploaded file
    // req.body contains information of text fields, if there were any

    if (err instanceof multer.MulterError) {
      return res.send(err);
    } else if (err) {
      return res.send(err);
    }

    // Display uploaded image for user validation
    firmwareImagePath = req.file.path;
    res.send(req.file.path);
  });
});
// end Interface Firmware flash


//Note when renewing Convert zerossl cert first `openssl.exe rsa -in domain-key.key -out domain-key.key`
// fix error:    App threw an error during load
//               Error: error:06000066:public key routines:OPENSSL_internal:DECODE_ERROR

var httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'privkey1.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'fullchain1.pem'))
};

const httpsserver = https.createServer(httpsOptions, app).listen(3001, function() {
  debug_log('https: listening on:' + ip.address() + ":3001");
});

const httpserver = http.listen(config.webPort, '0.0.0.0', httpServerSuccess).on('error', httpServerError);

function httpServerSuccess() {
  debug_log('http:  listening on:' + ip.address() + ":" + config.webPort);
  if (jogWindow) {
    jogWindow.loadURL(`http://localhost:${config.webPort}/`);
  }
}

function httpServerError(error) {
  // If unable to start (port in use) - try next port in array from config.nextWebPort()
  console.error(error.message);
  httpserver.listen(config.nextWebPort());
}

io.attach(httpserver);
io.attach(httpsserver);

const grblStrings = require("./grblStrings.js");

// Serial
const {
  SerialPort
} = require('serialport')
const {
  ReadlineParser
} = require('@serialport/parser-readline');

// telnet
const net = require('net');
var ip = require("ip");
const Evilscan = require('evilscan');

var md5 = require('md5');
var _ = require('lodash');
var formidable = require('formidable')
var lastsentuploadprogress = 0;

// Electron app
const electron = require('electron');
const electronApp = electron.app;
const {
  dialog
} = require('electron')
electronApp.commandLine.appendSwitch('ignore-gpu-blacklist')
electronApp.commandLine.appendSwitch('enable-gpu-rasterization')
electronApp.commandLine.appendSwitch('enable-zero-copy')

if (isElectron()) {
  debug_log("Local User Data: " + electronApp.getPath('userData'))
}

const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const nativeImage = require('electron').nativeImage
const Menu = require('electron').Menu
var forceQuit

var appIcon = null,
  jogWindow = null,
  mainWindow = null
var autoUpdater


var updateIsDownloading = false;
if (isElectron()) {
  autoUpdater = require("electron-updater").autoUpdater
  var availversion = '0.0.0'

  autoUpdater.on('checking-for-update', () => {
    var string = 'Starting update... Please wait';
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    io.sockets.emit('updatedata', output);
  })
  autoUpdater.on('update-available', (ev, info) => {
    updateIsDownloading = true;
    var string = "Starting Download: v" + ev.version;
    availversion = ev.version
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    io.sockets.emit('updatedata', output);
    debug_log(JSON.stringify(ev))
  })
  autoUpdater.on('update-not-available', (ev, info) => {
    var string = 'Update not available. Installed version: ' + require('./package').version + " / Available version: " + ev.version + ".\n";
    if (require('./package').version === ev.version) {
      string += "You are already running the latest version!"
    }
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    io.sockets.emit('updatedata', output);
    debug_log(JSON.stringify(ev))
  })
  autoUpdater.on('error', (ev, err) => {
    if (err) {
      var string = 'Error in auto-updater: \n' + err.split('SyntaxError')[0];
    } else {
      var string = 'Error in auto-updater';
    }
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    io.sockets.emit('updatedata', output);
  })
  autoUpdater.on('download-progress', (ev, progressObj) => {
    updateIsDownloading = true;
    var string = 'Download update ... ' + ev.percent.toFixed(1) + '%';
    debug_log(string)
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    io.sockets.emit('updatedata', output);
    io.sockets.emit('updateprogress', ev.percent.toFixed(0));
  })

  autoUpdater.on('update-downloaded', (info) => {
    var string = "New update ready";
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    io.sockets.emit('updatedata', output);
    io.sockets.emit('updateready', availversion);
    // repeat every minute
    setTimeout(function() {
      io.sockets.emit('updateready', availversion);
    }, 1000 * 60 * 60 * 8) // 8hrs before alerting again if it was snoozed
    updateIsDownloading = false;
  });
} else {
  debug_log("Running outside Electron: Disabled AutoUpdater")
}

if (isElectron()) {
  var uploadsDir = electronApp.getPath('userData') + '/upload/';
} else {
  var uploadsDir = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local')
}
var jobStartTime = false;
var jobCompletedMsg = ""; // message sent when job is done
var uploadedgcode = ""; // var to store uploaded gcode
var uploadedworkspace = ""; // var to store uploaded OpenBuildsCAM Workspace

mkdirp(uploadsDir).then(made =>
  debug_log('Created Uploads Temp Directory'))

// Check USB Selective Suspend Settings
function checkPowerSettings() {
  if (process.platform == 'win32') {
    debug_log("Checking Power Settings")
    var powerplan = "",
      usbselectiveAC = false,
      usbselectiveDC = false;
    const {
      exec
    } = require('child_process');

    const cfg = exec('powercfg /GETACTIVESCHEME', function(error, stdout, stderr) {
      if (error) {
        debug_log(error.stack);
        debug_log('Error code: ' + error.code);
        debug_log('Signal received: ' + error.signal);
      }
      // console.log('Child Process STDOUT: ' + stdout);
      // console.log('Child Process STDERR: ' + stderr);
      powerplan = stdout.split(":")[1].split("()")[0].trim()
    });

    cfg.on('exit', function(code) {
      debug_log('powercfg /GETACTIVESCHEME exited with exit code ' + code);
      if (code == 0) {
        const usbsetting = exec('powercfg /q ' + powerplan, function(error, stdout, stderr) {
          if (error) {
            debug_log(error.stack);
            debug_log('Error code: ' + error.code);
            debug_log('Signal received: ' + error.signal);
          }
          // console.log('Child Process STDOUT: ' + stdout);
          // console.log('Child Process STDERR: ' + stderr);
          usbselective = (stdout.slice(stdout.search("USB selective suspend setting") - 1)).split("\n")
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


var oldportslist, oldiplist;
var oldpinslist;
const iconPath = path.join(__dirname, 'app/icon.png');
const iconNoComm = path.join(__dirname, 'app/icon-notconnected.png');
const iconPlay = path.join(__dirname, 'app/icon-play.png');
const iconStop = path.join(__dirname, 'app/icon-stop.png');
const iconPause = path.join(__dirname, 'app/icon-pause.png');
const iconAlarm = path.join(__dirname, 'app/icon-bell.png');

var iosocket;
var lastCommand = false
var gcodeQueue = [];
var queuePointer = 0;
var statusLoop;
var frontEndUpdateLoop

var queueCounter;
var listPortsLoop;

var GRBL_RX_BUFFER_SIZE = 127; // 128 characters
var GRBLHAL_RX_BUFFER_SIZE = 1023; // 128 characters
var sentBuffer = [];

var xPos = 0.00;
var yPos = 0.00;
var zPos = 0.00;
var aPos = 0.00;
var xOffset = 0.00;
var yOffset = 0.00;
var zOffset = 0.00;
var aOffset = 0.00;


var feedOverride = 100,
  spindleOverride = 100;


//regex to identify MD5hash on sdupload later
var re = new RegExp("^[a-f0-9]{32}");

var status = {
  login: false,
  driver: {
    version: require('./package').version,
    ipaddress: ip.address(),
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
      feedOverride: 100, //
      spindleOverride: 100, //
      realFeed: 0, //
      realSpindle: 0 //
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
      // spindle: "0",
      // feedrate: "0"
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
    runStatus: "Pending", // 0 = init, 1 = idle, 2 = alarm, 3 = stop, 4 = run, etc?
    queue: 0,
    blocked: false,
    paused: false,
    controllerBuffer: 0, // Seems like you are tracking available buffer?  Maybe nice to have in frontend?
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
    lastFilePath: "",
      firmware: {
        availVersion: "",
        installedVersion: "",
      },
      connected: false
  }
};


async function findPorts() {
  const ports = await SerialPort.list()
  // console.log(ports)
  oldportslist = ports;
  status.comms.interfaces.ports = ports;
}
findPorts()

async function findChangedPorts() {
  const ports = await SerialPort.list()
  // console.log(ports)
  status.comms.interfaces.ports = ports;
  if (!_.isEqual(ports, oldportslist)) {
    var newPorts = _.differenceWith(ports, oldportslist, _.isEqual)
    if (newPorts.length > 0) {
      debug_log("Plugged " + newPorts[0].path);
    }
    var removedPorts = _.differenceWith(oldportslist, ports, _.isEqual)
    if (removedPorts.length > 0) {
      debug_log("Unplugged " + removedPorts[0].path);
    }
  }
  oldportslist = ports;
  // throw new Error('No ports found')
  findPorts()
}

// async function findDisks() {
//   const drives = await drivelist.list();
//   status.interface.diskdrives = drives;
// } // removed in 1.0.350 due to Drivelist stability issues

var PortCheckinterval = setInterval(function() {
  if (status.comms.connectionStatus == 0) {
    findChangedPorts();
  }
  //findDisks(); // removed in 1.0.350 due to Drivelist stability issues
}, 1000);

// var telnetCheckinterval = setInterval(function() {
//   if (status.comms.connectionStatus == 0) {
//     scanForTelnetDevices();
//   }
// }, 30000);
// scanForTelnetDevices();

checkPowerSettings()

// JSON API
app.get('/api/version', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  data = {
    "application": "OMD",
    "version": require('./package').version,
    "ipaddress": ip.address() + ":" + config.webPort
  }
  res.send(JSON.stringify(data), null, 2);
})

app.get('/activate', (req, res) => {
  debug_log(req.hostname)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.send('Host: ' + req.hostname + ' asked to activate OpenBuilds CONTROL v' + require('./package').version);
  showJogWindow()
  setTimeout(function() {
    io.sockets.emit('activate', req.hostname);
  }, 500);
})

// Upload
app.get('/upload', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.sendFile(__dirname + '/app/upload.html');
})

app.get('/gcode', (req, res) => {
  if (uploadedgcode.indexOf('$') != 0) { // Ignore grblSettings jobs
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.send(uploadedgcode);
  }
})

app.get('/workspace', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.send(uploadedworkspace);
})

// http-post version of runJob


app.post('/runjob', (req, res) => {
  // 'firmwareBin' is the name of our file input field in the HTML form
  let upload = multer({
    storage: storage
  }).single('file');

  upload(req, res, function(err) {
    // req.file contains information of uploaded file
    // req.body contains information of text fields, if there were any
    if (err instanceof multer.MulterError) {
      return res.send(err);
    } else if (err) {
      return res.send(err);
    }
    fs.readFile(req.file.path, 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      var object = {
        isJob: true,
        //completedMsg: "",
        data: data,
      }
      runJob(object)
    });
    res.send(`Running ` + req.file.path);

  });
});


// File Post
app.post('/upload', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  //debug_log(req)
  uploadprogress = 0
  var form = new formidable.IncomingForm();
  form.maxFileSize = 300 * 1024 * 1024;
  form.parse(req, function(err, fields, files) {
    // debug_log(files);
  });

  form.on('fileBegin', function(name, file) {
    debug_log(JSON.stringify(name));
    debug_log(JSON.stringify(file));
    debug_log('Uploading ' + file.filepath);
  });

  form.on('progress', function(bytesReceived, bytesExpected) {
    uploadprogress = parseInt(((bytesReceived * 100) / bytesExpected).toFixed(0));
    if (uploadprogress != lastsentuploadprogress) {
      lastsentuploadprogress = uploadprogress;
    }
    debug_log('Progress ' + uploadprogress + "% / " + bytesReceived + "b");

  });

  form.on('file', function(name, file) {
    debug_log('Uploaded ' + file.filepath);
    showJogWindow()
    readFile(file.filepath)
  });

  form.on('aborted', function() {
    // Emitted when the request was aborted by the user. Right now this can be due to a 'timeout' or 'close' event on the socket. After this event is emitted, an error event will follow. In the future there will be a separate 'timeout' event (needs a change in the node core).
  });

  form.on('end', function() {
    //Emitted when the entire request has been received, and all contained files have finished flushing to disk. This is a great place for you to send your response.
    res.end();

  });

  res.sendFile(__dirname + '/app/upload.html');
});

app.on('certificate-error', function(event, webContents, url, error,
  certificate, callback) {
  event.preventDefault();
  callback(true);
});

io.on("connection", function(socket) {

  debug_log("New IO Connection ");


  iosocket = socket;

  if (status.machine.firmware.type == 'grbl') {

    debug_log("Is Grbl");


    // // handle Grbl RESET external input
    // if (status.machine.inputs.length > 0) {
    //   for (i = 0; i < status.machine.inputs.length; i++) {
    //     switch (status.machine.inputs[i]) {
    //       case 'R':
    //         // debug_log('PIN: SOFTRESET');
    //         safetosend = true;
    //         break;
    //     }
    //   }
    // } else {
    //   setTimeout(function() {
    debug_log("Emit Grbl: 1");
    io.sockets.emit('grbl', status.machine.firmware)
    //   }, 10000);
    // }
    //
    // if (safetosend != undefined && safetosend == true) {
    //   setTimeout(function() {
    //     debug_log("Emit Grbl: 2");
    //     io.sockets.emit('grbl', status.machine.firmware)
    //   }, 10000);
    // }

  }


  // Global Update loop
  clearInterval(frontEndUpdateLoop);
  frontEndUpdateLoop = setInterval(function() {
    io.sockets.emit("status", status);
  }, 100);

  socket.on("scannetwork", function(data) {
    scanForTelnetDevices(data)
  })

  socket.on("openFile", function(data) {
    dialog.showOpenDialog(jogWindow, {
      properties: ['openFile']
    }).then(result => {
      console.log(result.canceled)
      console.log(result.filePaths)
      var openFilePath = result.filePaths[0];
      if (openFilePath !== "") {
        debug_log("path" + openFilePath);
        readFile(openFilePath);
      }

    }).catch(err => {
      console.log(err)
    })
  })

  socket.on("reopenFile", function(data) {
    if (status.interface.lastFilePath !== "") {
      debug_log("path" + status.interface.lastFilePath);
      readFile(status.interface.lastFilePath);
    }
  })

  socket.on("openInterfaceDir", function(data) {
    dialog.showOpenDialog(jogWindow, {
      properties: ['openDirectory'],
      title: "Select the USB Flashdrive you want to use with Interface"
    }).then(result => {
      console.log(result.canceled)
      console.log(result.filePaths)
      io.sockets.emit("interfaceDrive", result.filePaths[0]);
      status.interface.diskdrive = result.filePaths[0]
    }).catch(err => {
      console.log(err)
    })
  })

  socket.on("openbuilds", function(data) {
    const {
      shell
    } = require('electron')
    shell.openExternal('https://www.openbuilds.com')
  });

  socket.on("openbuildspartstore", function(data) {
    const {
      shell
    } = require('electron')
    shell.openExternal('https://www.openbuildspartstore.com')
  });

  socket.on("carveco", function(data) {
    const {
      shell
    } = require('electron')
    shell.openExternal('https://carveco.com/carveco-software-range/?ref=openbuilds')
  });

  socket.on("fabber", function(data) {
    const {
      shell
    } = require('electron')
    shell.openExternal('https://www.getfabber.com/openbuilds?ref=OpenBuilds')
  });

  socket.on("lightburn", function(data) {
    const {
      shell
    } = require('electron')
    shell.openExternal('https://openbuildspartstore.com/lightburn/')
  });

  socket.on("vectric", function(data) {
    const {
      shell
    } = require('electron')
    shell.openExternal('https://openbuildspartstore.com/vectric/')
  });

  socket.on("opencam", function(data) {
    const {
      shell
    } = require('electron')
    shell.openExternal('https://cam.openbuilds.com')
  });

  socket.on("opendocs", function(data) {
    const {
      shell
    } = require('electron')
    shell.openExternal('https://docs.openbuilds.com/')
  });

  socket.on("openforum", function(data) {
    const {
      shell
    } = require('electron')
    shell.openExternal('https://openbuilds.com/threads/openbuilds-control-software.13121/')
  });

  socket.on("adX32", function(data) {
    const {
      shell
    } = require('electron')
    shell.openExternal('https://openbuildspartstore.com/BlackBox-Motion-Control-System-X32')
  });

  socket.on("gpuinfo", function(data) {
    // GPU
    var gpuInfoWindow = new BrowserWindow({
      // 1366 * 768 == minimum to cater for
      width: 800,
      height: 800,
      fullscreen: false,
      center: true,
      resizable: true,
      maximizable: true,
      title: "OpenBuilds CONTROL: Chromium's GPU Report",
      frame: true,
      autoHideMenuBar: true,
      //icon: '/app/favicon.png',
      icon: nativeImage.createFromPath(
        path.join(__dirname, "/app/favicon.png")
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
  });

  socket.on("minimisetotray", function(data) {
    jogWindow.hide();
  });

  socket.on("minimize", function(data) {
    jogWindow.minimize();
  });

  socket.on("maximize", function(data) {
    if (jogWindow.isFullScreen()) {
      jogWindow.setFullScreen(false);
    }
    if (jogWindow.isMaximized()) {
      jogWindow.unmaximize();
    } else {
      jogWindow.maximize();
    }
  });

  socket.on("fullscreen", function(data) {
    if (jogWindow.isFullScreen()) {
      jogWindow.setFullScreen(false);
    } else {
      jogWindow.setFullScreen(true);
    }
  });

  socket.on("quit", function(data) {
    if (appIcon) {
      appIcon.destroy();
    }
    electronApp.exit(0);
  });

  socket.on("applyUpdate", function(data) {
    autoUpdater.quitAndInstall();
  })

  socket.on("downloadUpdate", function(data) {
    if (!updateIsDownloading) {
      if (typeof autoUpdater !== 'undefined') {
        autoUpdater.checkForUpdates();
      } else {
        debug_log("autoUpdater not found")
      }
    }
  })

  socket.on("flashGrbl", function(data) {

    var port = data.port;
    var firmwareImagePath = data.file;
    var board = data.board
    var customImg = data.customImg
    console.log(__dirname, file, data.file)
    if (customImg) {
      var firmwarePath = data.file
    } else {
      var firmwarePath = path.join(__dirname, data.file)
    }

    console.log("-------------------------------------------")
    console.log(firmwarePath)
    console.log("-------------------------------------------")

    const Avrgirl = require('avrgirl-arduino');

    if (status.comms.connectionStatus > 0) {
      debug_log('WARN: Closing Port ' + port);
      stopPort();
    } else {
      debug_log('ERROR: Machine connection not open!');
    }

    function flashGrblCallback(debugString, port) {
      debug_log(port, debugString);
      var data = {
        'port': port,
        'string': debugString
      }
      io.sockets.emit("progStatus", data);
    }

    setTimeout(function() {
      var avrgirl = new Avrgirl({
        board: board,
        port: port,
        debug: function(debugString) {
          var port = this.connection.options.port;
          flashGrblCallback(debugString, port)
        }
      });

      debug_log(JSON.stringify(avrgirl));

      status.comms.connectionStatus = 6;
      avrgirl.flash(firmwarePath, function(error) {
        if (error) {
          console.error(error);
          io.sockets.emit("progStatus", 'Flashing FAILED!');
          status.comms.connectionStatus = 0;
        } else {
          console.info('done.');
          io.sockets.emit("progStatus", 'Programmed Succesfully');
          io.sockets.emit("progStatus", 'Please Reconnect');
          status.comms.connectionStatus = 0;
        }
        status.comms.connectionStatus = 0;
      });
    }, 1000)
  })

  socket.on("flashGrblHal", function(data) {
    if (status.comms.connectionStatus > 0) {
      debug_log('WARN: Closing Port ' + port);
      stopPort();
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
    console.log(JSON.stringify(data), null, 4);
    flashGrblHal(data)
  })

  socket.on("flashInterface", function(data) {
    if (status.comms.connectionStatus > 0) {
      debug_log('WARN: Closing Port ' + port);
      stopPort();
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
    flashInterface(data)
  })

  socket.on("writeInterfaceUsbDrive", function(data) {

    debug_log(data)
    //data.drive = mountpoint dest
    //data.controller = type of controller
    if (data.controller == "blackbox4x" || data.controller == "genericgrbl") {
      var probesrc = path.join(__dirname, './app/wizards/interface/PROBE/');
      var profilesrc = path.join(__dirname, './app/wizards/interface/PROFILESGRBL/');
    } else if (data.controller == "blackboxx32" || data.controller == "genericgrblhal") {
      var probesrc = path.join(__dirname, './app/wizards/interface/PROBE/');
      var profilesrc = path.join(__dirname, './app/wizards/interface/PROFILESHAL/');
    }

    var probedest = path.join(data.drive, "/PROBE/");
    var profiledest = path.join(data.drive, "/PROFILES/");

    var ncp = require('ncp').ncp;
    ncp.limit = 16;

    var output = {
      'command': 'Interface USB Drive',
      'response': "Starting to copy data to " + data.drive,
      'type': 'info'
    }
    io.sockets.emit('data', output);

    var errorCount = 0;



    ncp(probesrc, probedest,
      function(err) {
        if (err) {
          var output = {
            'command': 'Interface USB Drive',
            'response': "Failed to copy PROBE macros to " + probedest + ":  " + JSON.stringify(err),
            'type': 'error'
          }
          io.sockets.emit('data', output);
          errorCount++
        } else {
          var output = {
            'command': 'Interface USB Drive',
            'response': "Copied PROBE macros to " + probedest + " succesfully!",
            'type': 'success'
          }
          io.sockets.emit('data', output);
        }
      });


    ncp(profilesrc, profiledest,
      function(err) {
        if (err) {
          var output = {
            'command': 'Interface USB Drive',
            'response': "Failed to copy MACHINE PROFILES to " + profiledest + ":  " + JSON.stringify(err),
            'type': 'error'
          }
          io.sockets.emit('data', output);
          errorCount++
        } else {
          var output = {
            'command': 'Interface USB Drive',
            'response': "Copied MACHINE PROFILES to " + profiledest + " succesfully!",
            'type': 'success'
          }
          io.sockets.emit('data', output);
        }
      });

    setTimeout(function() {
      if (errorCount == 0) {
        var output = {
          'command': 'Interface USB Drive',
          'response': "Finished copying supporting files to Drive " + data.drive,
          'type': 'success'
        }
        io.sockets.emit('data', output);
        var output = {
          'command': 'Interface USB Drive',
          'response': "Please Eject the drive (Safely Remove) and insert it into your Interface's USB port",
          'type': 'info'
        }
        io.sockets.emit('data', output);
      }
    }, 500);
  });

  socket.on("connectTo", function(data) { // If a user picks a port to connect to, open a Node SerialPort Instance to it

    if (status.comms.connectionStatus < 1) {

      if (data.type == "usb") {
        console.log("connect", "Connecting to " + data.port + " via " + data.type);
        port = new SerialPort({
          path: data.port,
          baudRate: parseInt(data.baud),
          hupcl: false // Don't set DTR - useful for X32 Reset
        });
      } else if (data.type == "telnet") {
        console.log("connect", "Connecting to " + data.ip + " via " + data.type);
        port = net.connect(23, data.ip);
        port.isOpen = true;
      }

      parser = port.pipe(new ReadlineParser({
        delimiter: '\r\n'
      }));

      // port.on("data", function(data) {
      //   console.log(data)
      // })

      port.on("error", function(err) {
        if (err.message != "Port is not open") {
          debug_log("Error: ", err.message);
          var output = {
            'command': '',
            'response': "PORT ERROR: " + err.message,
            'type': 'error'
          }
          io.sockets.emit('data', output);

          if (status.comms.connectionStatus > 0) {
            debug_log('WARN: Closing Port ' + port.path);
            status.comms.connectionStatus = 0;
            stopPort();
          } else {
            debug_log('ERROR: Machine connection not open!');
          }
        }

      });


      port.on("ready", function(e) {
        portOpened(port, data)
      });

      port.on("open", function(e) {
        portOpened(port, data)
      });

      port.on("close", function() { // open errors will be emitted as an error event
        debug_log("PORT INFO: Port closed");
        var output = {
          'command': 'disconnect',
          'response': "PORT INFO: Port closed",
          'type': 'info'
        }
        io.sockets.emit('data', output);
        status.comms.connectionStatus = 0;
      }); // end port.onclose

      function portOpened(port, data) {
        debug_log("PORT INFO: Connected to " + port.path + " at " + port.baudRate);
        var output = {
          'command': 'connect',
          'response': "PORT INFO: Port is now open: " + port.path + " - Attempting to detect Firmware",
          'type': 'info'
        }
        io.sockets.emit('data', output);

        status.comms.connectionStatus = 1;

        var output = {
          'command': 'connect',
          'response': "Checking for firmware on " + port.path,
          'type': 'info'
        }
        io.sockets.emit('data', output);
        addQRealtime("\n"); // this causes smoothie and grblHAL to send the welcome string

        var output = {
          'command': 'connect',
          'response': "Detecting Firmware: Method 1 (Autoreset)",
          'type': 'info'
        }
        io.sockets.emit('data', output);

        setTimeout(function() { //wait for controller to be ready
          if (status.machine.firmware.type.length < 1) {
            debug_log("Didnt detect firmware after AutoReset. Lets see if we have Grbl instance with a board that doesnt have AutoReset");
            var output = {
              'command': 'connect',
              'response': "Detecting Firmware: Method 2 (Ctrl+X)",
              'type': 'info'
            }
            io.sockets.emit('data', output);
            addQRealtime(String.fromCharCode(0x18)); // ctrl-x (needed for rx/tx connection)
            debug_log("Sent: Ctrl+x");
          }
        }, config.grblWaitTime * 1000);

        setTimeout(function() { //wait for controller to be ready
          if (status.machine.firmware.type.length < 1) {
            debug_log("No firmware yet, probably not Grbl then. lets see if we have Smoothie?");
            var output = {
              'command': 'connect',
              'response': "Detecting Firmware: Method 3 (others that are not supported)",
              'type': 'info'
            }
            io.sockets.emit('data', output);
            addQRealtime("version\n"); // Check if it's Smoothieware?
            debug_log("Sent: version");
          }
        }, config.grblWaitTime * 2000);

        setTimeout(function() {
          if (status.machine.firmware.type.length > 1) {
            if (status.machine.firmware.type === "grbl") {
              debug_log("GRBL detected");
              var output = {
                'command': 'connect',
                'response': "Detecting Firmware: Detected Grbl Succesfully",
                'type': 'info'
              }
              setTimeout(function() {
                io.sockets.emit('grbl', status.machine.firmware)
                //v1.0.318 - commented out as a test - too many normal alarms clear prematurely
                //io.sockets.emit('errorsCleared', true);
              }, 600)
              // Start interval for status queries
              clearInterval(statusLoop);
              statusLoop = setInterval(function() {
                if (status.comms.connectionStatus > 0) {
                  addQRealtime("?");
                }
              }, 200);
              status.machine.modals.homedRecently = false;
            }
          }


        }, config.grblWaitTime * 3000)

        if (config.firmwareWaitTime > 0) {
          setTimeout(function() {
            // Close port if we don't detect supported firmware after 2s.
            if (status.machine.firmware.type.length < 1) {
              debug_log("No supported firmware detected. Closing port " + port.path);
              if (status.interface.connected) {
                var output = {
                  'command': 'connect',
                  'response': `ERROR!:  Connection established to INTERFACE, but no response from Grbl on the upstream controller. See https://docs.openbuilds.com/interface for more details. Closing port ` + port.path,
                  'type': 'error'
                }
              } else {
                var output = {
                  'command': 'connect',
                  'response': `ERROR!:  No supported firmware detected - See https://docs.openbuilds.com/doku.php?id=docs:blackbox:faq-usb-connection-failed
                  for more details. Closing port ` + port.path,
                  'type': 'error'
                }
              }
              io.sockets.emit('data', output);
              stopPort();
            } else {
              if (data.type == "usb") {
                var output = {
                  'command': 'connect',
                  'response': "Firmware Detected:  " + status.machine.firmware.type + " version " + status.machine.firmware.version + " on " + port.path,
                  'type': 'success'
                }
              } else if (data.type = "telnet") {
                var output = {
                  'command': 'connect',
                  'response': "Firmware Detected:  " + status.machine.firmware.type + " version " + status.machine.firmware.version + " on " + data.ip,
                  'type': 'success'
                }
              }
              io.sockets.emit('data', output);
            }
          }, config.firmwareWaitTime * 1000);
        }


        status.comms.connectionStatus = 2;
        if (data.type == "usb") {
          status.comms.interfaces.activePort = port.path;
          status.comms.interfaces.type = data.type
          status.comms.interfaces.activeBaud = port.baudRate;
        } else if (data.type = "telnet") {
          status.comms.interfaces.activePort = data.ip;
          status.comms.interfaces.type = data.type
          status.comms.interfaces.activeBaud = "net";
        }
      }

      parser.on("data", function(data) {
        //console.log(data)
        var command = sentBuffer[0];

        if (command == "$CD" && data != "ok") {
          fluidncConfig = fluidncConfig += data + "\n"
        }

        if (data.indexOf("<") != 0) {
          debug_log('data:', data)
        }

        // Grbl $I parser
        if (data.indexOf("[VER:") === 0) {
          status.machine.name = data.split(':')[2].split(']')[0].toLowerCase()
          io.sockets.emit("status", status);
          io.sockets.emit("machinename", data.split(':')[2].split(']')[0].toLowerCase());
          status.machine.firmware.date = data.split(':')[1].split(".")[2];
        }

        if (data.indexOf("[OPT:") === 0) {

          var startOpt = data.search(/opt:/i) + 4;
          var grblOpt;
          if (startOpt > 4) {
            var grblOptLen = data.substr(startOpt).search(/]/);
            grblOpts = data.substr(startOpt, grblOptLen).split(/,/);

            status.machine.firmware.blockBufferSize = grblOpts[1];
            status.machine.firmware.rxBufferSize = grblOpts[2];

            var features = []

            var i = grblOpts[0].length;
            while (i--) {
              features.push(grblOpts[0].charAt(i))
              switch (grblOpts[0].charAt(i)) {
                case 'Q':
                  debug_log('SPINDLE_IS_SERVO Enabled')
                  //
                  break;
                case 'V': //	Variable spindle enabled
                  debug_log('Variable spindle enabled')
                  //
                  break;
                case 'N': //	Line numbers enabled
                  debug_log('Line numbers enabled')
                  //
                  break;
                case 'M': //	Mist coolant enabled
                  debug_log('Mist coolant enabled')
                  //
                  break;
                case 'C': //	CoreXY enabled
                  debug_log('CoreXY enabled')
                  //
                  break;
                case 'P': //	Parking motion enabled
                  debug_log('Parking motion enabled')
                  //
                  break;
                case 'Z': //	Homing force origin enabled
                  debug_log('Homing force origin enabled')
                  //
                  break;
                case 'H': //	Homing single axis enabled
                  debug_log('Homing single axis enabled')
                  //
                  break;
                case 'T': //	Two limit switches on axis enabled
                  debug_log('Two limit switches on axis enabled')
                  //
                  break;
                case 'A': //	Allow feed rate overrides in probe cycles
                  debug_log('Allow feed rate overrides in probe cycles')
                  //
                  break;
                case '$': //	Restore EEPROM $ settings disabled
                  debug_log('Restore EEPROM $ settings disabled')
                  //
                  break;
                case '#': //	Restore EEPROM parameter data disabled
                  debug_log('Restore EEPROM parameter data disabled')
                  //
                  break;
                case 'I': //	Build info write user string disabled
                  debug_log('Build info write user string disabled')
                  //
                  break;
                case 'E': //	Force sync upon EEPROM write disabled
                  debug_log('Force sync upon EEPROM write disabled')
                  //
                  break;
                case 'W': //	Force sync upon work coordinate offset change disabled
                  debug_log('Force sync upon work coordinate offset change disabled')
                  //
                  break;
                case 'L': //	Homing init lock sets Grbl into an alarm state upon power up
                  debug_log('Homing init lock sets Grbl into an alarm state upon power up')
                  //
                  break;
              }
            }
            status.machine.firmware.features = features;
            io.sockets.emit("features", features);
          }
        }

        // [PRB:0.000,0.000,0.000:0]
        //if (data.indexOf("[PRB:") === 0 && command != "$#" && command != undefined) {
        if (data.indexOf("[PRB:") === 0) {
          debug_log(data)
          var prbLen = data.substr(5).search(/\]/);
          var prbData = data.substr(5, prbLen).split(/,/);
          var success = data.split(':')[2].split(']')[0];
          status.machine.probe.x = prbData[0];
          status.machine.probe.y = prbData[1];
          status.machine.probe.z = prbData[2].split(':')[0];
          status.machine.probe.state = success;
          if (success > 0) {
            var output = {
              'command': '[ PROBE ]',
              'response': "Probe Completed.",
              'type': 'success'
            }
            io.sockets.emit('data', output);
          } else {
            var output = {
              'command': '[ PROBE ]',
              'response': "Probe move ERROR - probe did not make contact within specified distance",
              'type': 'error'
            }
            io.sockets.emit('data', output);
          }
          io.sockets.emit('prbResult', status.machine.probe);
        };

        if (data.indexOf("[GC:") === 0) {
          gotModals(data)
        }

        if (data.indexOf("[INTF:") === 0) {
          var output = {
            'command': 'connect',
            'response': "Detected an OpenBuilds Interface on port " + port.path,
            'type': 'success'
          }
          io.sockets.emit('data', output);
          status.interface.connected = true;
          if (data.split(":")[1].indexOf("ver") == 0) {
            var installedVersion = parseFloat(data.split(":")[1].split("]")[0].split("-")[1])
            status.interface.firmware.installedVersion = installedVersion
            var output = {
              'command': 'connect',
              'response': "OpenBuilds Interface Firmware Version: v" + installedVersion,
              'type': 'info'
            }
            io.sockets.emit('data', output);
            if (installedVersion < status.interface.firmware.availVersion) {
              var output = {
                'command': 'connect',
                'response': "OpenBuilds Interface Firmware OUTDATED: v" + installedVersion + " can be upgraded to v" + status.interface.firmware.availVersion,
                'type': 'error'
              }
              io.sockets.emit('data', output);
              io.sockets.emit('interfaceOutdated', status);
            }
          }
          io.sockets.emit("status", status);
        }

        // Machine Identification
        if (data.indexOf("Grbl") === 0) { // Check if it's Grbl
          debug_log(data)
          status.comms.blocked = false;
          if (data.indexOf("GrblHAL") === 0) {
            status.machine.firmware.type = "grbl";
            status.machine.firmware.platform = "grblHAL"
            status.machine.firmware.version = data.substr(8, 4); // get version
          } else if (data.indexOf("FluidNC") != -1) { // Grbl 3.6 [FluidNC v3.6.5 (wifi) '$' for help]
            status.machine.firmware.type = "grbl";
            status.machine.firmware.platform = "FluidNC"
            status.machine.firmware.version = data.substr(19, 5); // get version
          } else {
            status.machine.firmware.type = "grbl";
            status.machine.firmware.platform = "gnea"
            status.machine.firmware.version = data.substr(5, 4); // get version
          }
          if (parseFloat(status.machine.firmware.version) < 1.1) { // If version is too old
            if (status.machine.firmware.version.length < 3) {
              debug_log('invalid version string, stay connected')
            } else {
              if (status.comms.connectionStatus > 0) {
                debug_log('WARN: Closing Port ' + port.path + " /  v" + parseFloat(status.machine.firmware.version));
                // stopPort();
              } else {
                debug_log('ERROR: Machine connection not open!');
              }
              var output = {
                'command': command,
                'response': "Detected an unsupported version: Grbl " + status.machine.firmware.version + ". This is sadly outdated. Please upgrade to Grbl 1.1 or newer to use this software.  Go to http://github.com/gnea/grbl",
                'type': 'error'
              }
              io.sockets.emit('data', output);
            }
          }
          status.machine.firmware.date = "";
          // debug_log("GRBL detected");
          // setTimeout(function() {
          //   io.sockets.emit('grbl', status.machine.firmware)
          //   //v1.0.318 - commented out as a test - too many normal alarms clear prematurely
          //   //io.sockets.emit('errorsCleared', true);
          // }, 600)
          // // Start interval for status queries
          // clearInterval(statusLoop);
          // statusLoop = setInterval(function() {
          //   if (status.comms.connectionStatus > 0) {
          //     addQRealtime("?");
          //   }
          // }, 200);

          if (config.aggressiveHomeReset)
          {
            // when aggressiveHomeReset is true (the default) reset the home state on every grbl reset
            status.machine.modals.homedRecently = false;
          }
        } else if (data.indexOf("LPC176") >= 0) { // LPC1768 or LPC1769 should be Smoothieware
          status.comms.blocked = false;
          debug_log("Smoothieware detected");
          status.machine.firmware.type = "smoothie";
          status.machine.firmware.version = data.substr(data.search(/version:/i) + 9).split(/,/);
          status.machine.firmware.date = new Date(data.substr(data.search(/Build date:/i) + 12).split(/,/)).toDateString();
          // Start interval for status queries
          // statusLoop = setInterval(function() {
          //   if (status.comms.connectionStatus > 0) {
          //     addQRealtime("?");
          //   }
          // }, 200);
          var output = {
            'command': "FIRMWARE ERROR",
            'response': "Detected an unsupported version: Smoothieware " + status.machine.firmware.version + ". This software no longer support Smoothieware. \nLuckilly there is an alternative firmware you can install on your controller to make it work with this software. Check out Grbl-LPC at https://github.com/cprezzi/grbl-LPC - Grbl-LPC is a Grbl port for controllers using the NXP LPC176x chips, for example Smoothieboards",
            'type': 'error'
          }
          io.sockets.emit('data', output);
          stopPort();
        } // end of machine identification

        // Machine Feedback: Position
        if (data.indexOf("<") === 0) {
          // debug_log(' Got statusReport (Grbl & Smoothieware)')
          // statusfeedback func
          parseFeedback(data)
          if (command == "?") {
            var output = {
              'command': command,
              'response': data,
              'type': 'info'
            }
            // debug_log(output.response)
            io.sockets.emit('data', output);
          }

          // debug_log(data)
        } else if (data.indexOf("ok") === 0) { // Got an OK so we are clear to send
          io.sockets.emit('ok', command);
          // debug_log("OK FOUND")
          if (status.machine.firmware.type === "grbl") {
            // debug_log('got OK from ' + command)
            command = sentBuffer.shift();
          }
          if (command == "$CD") {
            io.sockets.emit('fluidncConfig', fluidncConfig);
          }
          status.comms.blocked = false;
          send1Q();
        } else if (data.indexOf('ALARM') === 0) { //} || data.indexOf('HALTED') === 0) {
          debug_log("ALARM:  " + data)
          status.comms.connectionStatus = 5;
          switch (status.machine.firmware.type) {
            case 'grbl':
              // sentBuffer.shift();
              var alarmCode = parseInt(data.split(':')[1]);

              if (!config.aggressiveHomeReset)
              {
                // when aggressiveHomeReset is false, certain alarm codes will be safe and will not reset the home state
                const safeAlarmCodes = [0, 2, 4, 5, 12];
                if (!safeAlarmCodes.includes(alarmCode))
                {
                  status.machine.modals.homedRecently = false;
                }
              }

              debug_log('ALARM: ' + alarmCode + ' - ' + grblStrings.alarms(alarmCode));
              status.comms.alarm = alarmCode + ' - ' + grblStrings.alarms(alarmCode)
              if (alarmCode != 5) {
                io.sockets.emit("toastErrorAlarm", 'ALARM: ' + alarmCode + ' - ' + grblStrings.alarms(alarmCode) + " [ " + command + " ]")
              }
              var output = {
                'command': '',
                'response': 'ALARM: ' + alarmCode + ' - ' + grblStrings.alarms(alarmCode) + " [ " + command + " ]",
                'type': 'error'
              }
              io.sockets.emit('data', output);
              break;
          }
          status.comms.connectionStatus = 5;
        } else if (data.indexOf('WARNING: After HALT you should HOME as position is currently unknown') != -1) { //} || data.indexOf('HALTED') === 0) {
          status.comms.connectionStatus = 2;
        } else if (data.indexOf('Emergency Stop Requested') != -1) { //} || data.indexOf('HALTED') === 0) {
          debug_log("Emergency Stop Requested")
          status.comms.connectionStatus = 5;
        } else if (data.indexOf('wait') === 0) { // Got wait from Repetier -> ignore
          // do nothing
        } else if (data.indexOf('error') === 0) { // Error received -> stay blocked stops queue
          switch (status.machine.firmware.type) {
            case 'grbl':
              // sentBuffer.shift();
              var errorCode = parseInt(data.split(':')[1]);

              var lastAlarm = "";
              if (errorCode == 9 && status.comms.connectionStatus == 5 && status.comms.alarm.length > 0) {
                lastAlarm = "<hr>This error may just be a symptom of an earlier event:<br> ALARM: " + status.comms.alarm
              }
              debug_log('error: ' + errorCode + ' - ' + grblStrings.errors(errorCode) + " [ " + command + " ]");
              var output = {
                'command': '',
                'response': 'error: ' + errorCode + ' - ' + grblStrings.errors(errorCode) + " [ " + command + " ]" + lastAlarm,
                'type': 'error'
              }
              io.sockets.emit('data', output);
              io.sockets.emit("toastError", 'error: ' + errorCode + ' - ' + grblStrings.errors(errorCode) + " [ " + command + " ]" + lastAlarm)
              break;
          }
          debug_log("error;")
          sentBuffer.shift();
          status.comms.connectionStatus = 5;
        } else if (data === ' ') {
          // nothing
        } else {
          // do nothing with +data
        }

        if (data.indexOf("[MSG:Reset to continue]") === 0) {
          switch (status.machine.firmware.type) {
            case 'grbl':
              debug_log("[MSG:Reset to continue] -> Sending Reset")
              addQRealtime(String.fromCharCode(0x18)); // ctrl-x
              break;
          }
        }


        if (command) {
          command = command.replace(/(\r\n|\n|\r)/gm, "");
          // debug_log("CMD: " + command + " / DATA RECV: " + data.replace(/(\r\n|\n|\r)/gm, ""));

          if (command != "?" && command != "M105" && data.length > 0 && data.indexOf('<') == -1) {
            var string = "";
            if (status.comms.sduploading) {
              string += "SD: "
            }
            string += data //+ "  [ " + command + " ]"
            var output = {
              'command': command,
              'response': string,
              'type': 'info'
            }
            // debug_log(output.response)
            io.sockets.emit('data', output);
          }
        } else {
          if (data.indexOf("<") != 0) {
            var output = {
              'command': "",
              'response': data,
              'type': 'info'
            }
            io.sockets.emit('data', output);
          }
        }
      }); // end of parser.on(data)
    }
  });

  socket.on('saveToSd', function(datapack) {
    saveToSd(datapack);
  });


  socket.on('setqueuePointer', function(data) {
    debug_log('Setting queuePointer to ' + data)
    queuePointer = data
  });

  socket.on('runJob', function(object) {
    // debug_log(data)
    runJob(object);
  });

  socket.on('forceQueue', function(data) {
    send1Q();
  });

  socket.on('serialInject', function(data) {
    // Inject a live command into Serial stream in real-time (dev tool) even while a job is running, etc (straight Port.write from machineSend)
    machineSend(data, true);
  });

  socket.on("dump", function(data) {
    console.log(queuePointer);
    console.log(gcodeQueue);
    console.log(sentBuffer);
  })

  socket.on('runCommand', function(data) {
    debug_log('Run Command (' + data.replace('\n', '|') + ')');
    if (status.comms.connectionStatus > 0) {
      if (data) {
        data = data.split('\n');
        for (var i = 0; i < data.length; i++) {
          var line = data[i].split(';'); // Remove everything after ; = comment
          var tosend = line[0].trim();
          if (tosend.length > 0) {
            addQToEnd(tosend);
          }
        }
        status.comms.runStatus = 'Running'
        // debug_log('sending ' + JSON.stringify(gcodeQueue))
        send1Q();
      }
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
  });

  socket.on('jog', function(data) {
    debug_log('Jog ' + data);
    if (status.comms.connectionStatus > 0) {
      data = data.split(',');
      var dir = data[0];
      var dist = parseFloat(data[1]);
      var feed;
      if (data.length > 2) {
        feed = parseInt(data[2]);
        if (feed) {
          feed = 'F' + feed;
        }
      }
      if (dir && dist && feed) {
        debug_log('Adding jog commands to queue. Firmw=' + status.machine.firmware.type + ', blocked=' + status.comms.blocked + ', paused=' + status.comms.paused + ', Q=' + gcodeQueue.length);
        switch (status.machine.firmware.type) {
          case 'grbl':
            addQToEnd('$J=G91G21' + dir + dist + feed);
            send1Q();
            break;
          default:
            debug_log('ERROR: Unknown firmware!');
            break;
        }
      } else {
        debug_log('ERROR: Invalid params!');
      }
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
  });

  socket.on('jogXY', function(data) {
    debug_log('Jog XY' + data);
    if (status.comms.connectionStatus > 0) {
      // var data = {
      //   x: xincrement,
      //   y: yincrement,
      //   feed: feed
      // }
      var xincrement = parseFloat(data.x);
      var yincrement = parseFloat(data.y);
      var feed = parseFloat(data.feed)
      if (feed) {
        feed = 'F' + feed;
      }

      if (xincrement && yincrement && feed) {
        debug_log('Adding jog commands to queue. blocked=' + status.comms.blocked + ', paused=' + status.comms.paused + ', Q=' + gcodeQueue.length);
        switch (status.machine.firmware.type) {
          case 'grbl':
            addQToEnd('$J=G91G21X' + xincrement + " Y" + yincrement + " " + feed);
            send1Q();
            break;
          default:
            debug_log('ERROR: Unknown firmware!');
            break;
        }
      } else {
        debug_log('ERROR: Invalid params!');
      }
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
  });

  socket.on('jogTo', function(data) { // data = {x:xVal, y:yVal, z:zVal, mode:0(absulute)|1(relative), feed:fVal}
    debug_log('JogTo ' + JSON.stringify(data));
    if (status.comms.connectionStatus > 0) {
      if (data.x !== undefined || data.y !== undefined || data.z !== undefined) {
        var xVal = (data.x !== undefined ? 'X' + parseFloat(data.x) : '');
        var yVal = (data.y !== undefined ? 'Y' + parseFloat(data.y) : '');
        var zVal = (data.z !== undefined ? 'Z' + parseFloat(data.z) : '');
        var mode = ((data.mode == 0) ? 0 : 1);
        var feed = (data.feed !== undefined ? 'F' + parseInt(data.feed) : '');
        debug_log('Adding jog commands to queue. blocked=' + status.comms.blocked + ', paused=' + status.comms.paused + ', Q=' + gcodeQueue.length);
        switch (status.machine.firmware.type) {
          case 'grbl':
            addQToEnd('$J=G91G21' + mode + xVal + yVal + zVal + feed);
            break;
          default:
            debug_log('ERROR: Unknown firmware!');
            break;
        }
      } else {
        debug_log('error Invalid params!');
      }
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
  });

  socket.on('setZero', function(data) {
    debug_log('setZero(' + data + ')');
    if (status.comms.connectionStatus > 0) {
      switch (data) {
        case 'x':
          addQToEnd('G10 L20 P0 X0');
          break;
        case 'y':
          addQToEnd('G10 L20 P0 Y0');
          break;
        case 'z':
          addQToEnd('G10 L20 P0 Z0');
          break;
        case 'a':
          addQToEnd('G10 L20 P0 A0');
          break;
        case 'all':
          addQToEnd('G10 L20 P0 X0 Y0 Z0');
          break;
        case 'xyza':
          addQToEnd('G10 L20 P0 X0 Y0 Z0 A0');
          break;
      }
      send1Q();
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
  });

  socket.on('gotoZero', function(data) {
    debug_log('gotoZero(' + data + ')');
    if (status.comms.connectionStatus > 0) {
      switch (data) {
        case 'x':
          addQToEnd('G0 X0');
          break;
        case 'y':
          addQToEnd('G0 Y0');
          break;
        case 'z':
          addQToEnd('G0 Z0');
          break;
        case 'a':
          addQToEnd('G0 A0');
          break;
        case 'all':
          addQToEnd('G0 X0 Y0 Z0');
          break;
        case 'xyza':
          addQToEnd('G0 X0 Y0 Z0 A0');
          break;
      }
      send1Q();
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
  });

  socket.on('setPosition', function(data) {
    debug_log('setPosition(' + JSON.stringify(data) + ')');
    if (status.comms.connectionStatus > 0) {
      if (data.x !== undefined || data.y !== undefined || data.z !== undefined) {
        var xVal = (data.x !== undefined ? 'X' + parseFloat(data.x) + ' ' : '');
        var yVal = (data.y !== undefined ? 'Y' + parseFloat(data.y) + ' ' : '');
        var zVal = (data.z !== undefined ? 'Z' + parseFloat(data.z) + ' ' : '');
        var aVal = (data.a !== undefined ? 'A' + parseFloat(data.a) + ' ' : '');
        addQToEnd('G10 L20 P0 ' + xVal + yVal + zVal + aVal);
        send1Q();
      }
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
  });

  socket.on('probe', function(data) {
    debug_log('probe(' + JSON.stringify(data) + ')');
    if (status.comms.connectionStatus > 0) {
      switch (status.machine.firmware.type) {
        case 'grbl':
          addQToEnd('G38.2 ' + data.direction + '-5 F1');
          addQToEnd('G92 ' + data.direction + ' ' + data.probeOffset);
          send1Q();
          break;
        default:
          //not supported
          debug_log('Command not supported by firmware!');
          break;
      }
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
  });

  socket.on('feedOverride', function(data) {
    debug_log(data)
    if (status.comms.connectionStatus > 0) {
      switch (status.machine.firmware.type) {
        case 'grbl':
          debug_log("current FRO = " + status.machine.overrides.feedOverride)
          debug_log("requested FRO = " + data)
          var curfro = parseInt(status.machine.overrides.feedOverride)
          var reqfro = parseInt(data)
          var delta;

          if (reqfro == 100) {
            addQRealtime(String.fromCharCode(0x90));
          } else if (curfro < reqfro) {
            // FRO Increase
            delta = reqfro - curfro
            debug_log("delta = " + delta)
            var tens = Math.floor(delta / 10)

            debug_log("need to send " + tens + " x10s increase")
            // for (i = 0; i < tens; i++) {
            //   addQRealtime(String.fromCharCode(0x91));
            // }
            for (let i = 1; i < tens + 1; i++) {
              setTimeout(function timer() {
                addQRealtime(String.fromCharCode(0x91));
                addQRealtime("?");
              }, i * 50);
            }

            var ones = delta - (10 * tens);
            debug_log("need to send " + ones + " x1s increase")
            // for (i = 0; i < ones; i++) {
            //   addQRealtime(String.fromCharCode(0x93));
            // }
            for (let i = 1; i < ones + 1; i++) {
              setTimeout(function timer() {
                addQRealtime(String.fromCharCode(0x93));
                addQRealtime("?");
              }, i * 50);
            }
          } else if (curfro > reqfro) {
            // FRO Decrease
            delta = curfro - reqfro
            debug_log("delta = " + delta)

            var tens = Math.floor(delta / 10)
            debug_log("need to send " + tens + " x10s decrease")
            // for (i = 0; i < tens; i++) {
            //   addQRealtime(String.fromCharCode(0x92));
            // }
            for (let i = 1; i < tens + 1; i++) {
              setTimeout(function timer() {
                addQRealtime(String.fromCharCode(0x92));
                addQRealtime("?");
              }, i * 50);
            }

            var ones = delta - (10 * tens);
            debug_log("need to send " + ones + " x1s decrease")
            // for (i = 0; i < tens; i++) {
            //   addQRealtime(String.fromCharCode(0x94));
            // }
            for (let i = 1; i < ones + 1; i++) {
              setTimeout(function timer() {
                addQRealtime(String.fromCharCode(0x94));
                addQRealtime("?");
              }, i * 50);
            }
          }
          addQRealtime("?");
          status.machine.overrides.feedOverride = parseInt(reqfro); // Set now, but will be overriden from feedback from Grbl itself in next queryloop
          break;
      }
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
  });

  socket.on('spindleOverride', function(data) {
    if (status.comms.connectionStatus > 0) {
      switch (status.machine.firmware.type) {
        case 'grbl':
          debug_log("current SRO = " + status.machine.overrides.spindleOverride)
          debug_log("requested SRO = " + data)
          var cursro = parseInt(status.machine.overrides.spindleOverride)
          var reqsro = parseInt(data)
          var delta;

          if (reqsro == 100) {
            addQRealtime(String.fromCharCode(153));
          } else if (cursro < reqsro) {
            // FRO Increase
            delta = reqsro - cursro
            debug_log("delta = " + delta)
            var tens = Math.floor(delta / 10)

            debug_log("need to send " + tens + " x10s increase")
            // for (i = 0; i < tens; i++) {
            //   addQRealtime(String.fromCharCode(154));
            // }
            for (let i = 1; i < tens + 1; i++) {
              setTimeout(function timer() {
                addQRealtime(String.fromCharCode(154));
                addQRealtime("?");
              }, i * 50);
            }

            var ones = delta - (10 * tens);
            debug_log("need to send " + ones + " x1s increase")
            // for (i = 0; i < ones; i++) {
            //   addQRealtime(String.fromCharCode(156));
            // }
            for (let i = 1; i < ones + 1; i++) {
              setTimeout(function timer() {
                addQRealtime(String.fromCharCode(156));
                addQRealtime("?");
              }, i * 50);
            }
          } else if (cursro > reqsro) {
            // FRO Decrease
            delta = cursro - reqsro
            debug_log("delta = " + delta)

            var tens = Math.floor(delta / 10)
            debug_log("need to send " + tens + " x10s decrease")
            // for (i = 0; i < tens; i++) {
            //   addQRealtime(String.fromCharCode(155));
            // }
            for (let i = 1; i < tens + 1; i++) {
              setTimeout(function timer() {
                addQRealtime(String.fromCharCode(155));
                addQRealtime("?");
              }, i * 50);
            }

            var ones = delta - (10 * tens);
            debug_log("need to send " + ones + " x1s decrease")
            // for (i = 0; i < tens; i++) {
            //   addQRealtime(String.fromCharCode(157));
            // }
            for (let i = 1; i < ones + 1; i++) {
              setTimeout(function timer() {
                addQRealtime(String.fromCharCode(157));
                addQRealtime("?");
              }, i * 50);
            }
          }
          addQRealtime("?");
          status.machine.overrides.spindleOverride = parseInt(reqsro); // Set now, but will be overriden from feedback from Grbl itself in next queryloop
          break;
      }
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
  });

  socket.on('laserTest', function(data) { // Laser Test Fire
    laserTest(data);
  });

  socket.on('pause', function() {
    pause();
  });

  socket.on('resume', function() {
    unpause();
  });

  socket.on('stop', function(data) {
    stop(data);
  });

  socket.on('clearAlarm', function(data) { // Clear Alarm
    if (status.comms.connectionStatus > 0) {
      data = parseInt(data);
      debug_log('Clearing Queue: Method ' + data);
      switch (data) {
        case 1:
          debug_log('Clearing Lockout');
          switch (status.machine.firmware.type) {
            case 'grbl':
              addQRealtime('$X\n');
              debug_log('Sent: $X');
              break;
          }
          debug_log('Resuming Queue Lockout');
          break;
        case 2:
          debug_log('Emptying Queue');
          status.comms.queue = 0
          queuePointer = 0;
          gcodeQueue.length = 0; // Dump the queue
          sentBuffer.length = 0; // Dump bufferSizes
          queuePointer = 0;
          debug_log('Clearing Lockout');
          switch (status.machine.firmware.type) {
            case 'grbl':
              clearInterval(queueCounter);
              jogWindow.setProgressBar(0);
              addQRealtime(String.fromCharCode(0x18)); // ctrl-x
              setTimeout(function() {
                addQRealtime('$X\n');
                debug_log('Sent: $X');
              }, 500);
              status.comms.blocked = false;
              status.comms.paused = false;
              break;
          }
          break;
      }
      status.comms.runStatus = 'Stopped'
      status.comms.connectionStatus = 2;
      status.comms.alarm = "";
      io.sockets.emit('errorsCleared', true);
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
  });

  socket.on('resetMachine', function() {
    if (status.comms.connectionStatus > 0) {
      debug_log('Reset Machine');
      switch (status.machine.firmware.type) {
        case 'grbl':
          addQRealtime(String.fromCharCode(0x18)); // ctrl-x
          debug_log('Sent: Code(0x18)');
          break;
      }
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
  });

  socket.on('closePort', function(data) { // Close machine port and dump queue
    if (status.comms.connectionStatus > 0) {
      debug_log('WARN: Closing Port ' + port.path);
      stopPort();
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
  });


  socket.on('aggrressiveHomeReset', function(state) {
    config.aggressiveHomeReset = state;
  });

});

function readFile(filePath) {
  if (filePath) {
    if (filePath.length > 1) {
      var filename = path.parse(filePath)
      filename = filename.name + filename.ext
      debug_log('readfile: ' + filePath)
      fs.readFile(filePath, 'utf8',
        function(err, data) {
          if (err) {
            debug_log(err);
            var output = {
              'command': '',
              'response': "ERROR: File Upload Failed"
            }
            uploadedgcode = "";
          }
          if (data) {
            if (filePath.endsWith('.obc')) { // OpenBuildsCAM Workspace
              uploadedworkspace = data;
              const {
                shell
              } = require('electron')
              shell.openExternal('https://cam.openbuilds.com')
            } else { // GCODE
              var payload = {
                gcode: data,
                filename: filename
              }
              io.sockets.emit('gcodeupload', payload);
              uploadedgcode = data;
              status.interface.lastFilePath = filePath;
              return data
            }
          }
        });
    }
  }
}

function machineSend(gcode, realtime) {
  debug_log("SENDING: " + gcode)
  if (port.isOpen) {
    if (realtime) {
      // realtime commands doesnt count toward the queue, does not generate OK
      port.write(gcode);
    } else {
      if (gcode.match(/T([\d.]+)/i)) {
        var tool = parseFloat(RegExp.$1);
        status.machine.tool.nexttool.number = tool
        status.machine.tool.nexttool.line = gcode
      }
      var queueLeft = parseInt((gcodeQueue.length - queuePointer))
      var queueTotal = parseInt(gcodeQueue.length)
      // debug_log("Q: " + queueLeft)
      var data = []
      data.push(queueLeft);
      data.push(queueTotal);
      io.sockets.emit("queueCount", data);
      // debug_log(gcode)
      port.write(gcode);
      debug_log("SENT: " + gcode)
    }
  } else {
    debug_log("PORT NOT OPEN")
  }
}

function runJob(object) {

  // object = {
  //   isJob: true,
  //   completedMsg: "",
  //   data: "",
  // }

  jobStartTime = false;
  var data = object.data

  if (object.isJob) {
    if (data.length < 20000) {
      uploadedgcode = data;
    }
    jobStartTime = new Date().getTime();
  }

  if (object.completedMsg) {
    jobCompletedMsg = object.completedMsg
  }


  // debug_log('Run Job (' + data.length + ')');
  if (status.comms.connectionStatus > 0) {
    if (data) {
      data = data.split('\n');
      for (var i = 0; i < data.length; i++) {

        var line = data[i].replace("%", "").split(';'); // Remove everything after ; = comment
        var tosend = line[0].trim();
        if (tosend.length > 0) {
          addQToEnd(tosend);
        }
      }
      if (i > 0) {
        // Start interval for qCount messages to socket clients
        queueCounter = setInterval(function() {
          status.comms.queue = gcodeQueue.length - queuePointer
          jogWindow.setProgressBar(queuePointer / gcodeQueue.length)
        }, 500);
        send1Q(); // send first line
        status.comms.connectionStatus = 3;
      }

    }
  } else {
    debug_log('ERROR: Machine connection not open!');
  }
}

function stopPort() {
  clearInterval(queueCounter);
  clearInterval(statusLoop);
  jogWindow.setProgressBar(0);
  status.comms.interfaces.activePort = false;
  status.comms.interfaces.activeBaud = false;
  status.comms.connectionStatus = 0;
  status.machine.firmware.type = "";
  status.machine.firmware.version = ""; // get version
  status.machine.firmware.date = "";
  status.machine.firmware.buffer = "";
  gcodeQueue.length = 0;
  sentBuffer.length = 0; // dump bufferSizes
  // port.drain(port.close());

  if (status.comms.interfaces.type == "usb") {
    port.drain(port.close());
  } else if (status.comms.interfaces.type == "telnet") {
    port.destroy();
  }
}

function parseFeedback(data) {
  //debug_log(data)
  var state = data.substring(1, data.search(/(,|\|)/));
  status.comms.runStatus = state
  if (state == "Alarm") {
    // debug_log("ALARM:  " + data)
    status.comms.connectionStatus = 5;
    switch (status.machine.firmware.type) {
      case 'grbl':
        //var alarmCode = parseInt(data.split(':')[1]);
        debug_log('ALARM: ' + data);
        //status.comms.alarm = alarmCode + ' - ' + grblStrings.alarms(alarmCode)
        break;
    }
    status.comms.connectionStatus = 5;
  } else if (state == "Hold:0") {
    pause();
  }
  if (status.machine.firmware.type == "grbl") {
    // Extract work offset (for Grbl > 1.1 only!)
    var startWCO = data.search(/wco:/i) + 4;
    var wco;
    if (startWCO > 4) {
      wco = data.replace(">", "").substr(startWCO).split(/,|\|/, 4);
    }
    if (Array.isArray(wco)) {
      xOffset = parseFloat(wco[0]).toFixed(config.posDecimals);
      yOffset = parseFloat(wco[1]).toFixed(config.posDecimals);
      zOffset = parseFloat(wco[2]).toFixed(config.posDecimals);
      if (status.machine.has4thAxis) {
        aOffset = parseFloat(wco[3]).toFixed(config.posDecimals);
        status.machine.position.offset.x = parseFloat(xOffset);
        status.machine.position.offset.y = parseFloat(yOffset);
        status.machine.position.offset.z = parseFloat(zOffset);
        status.machine.position.offset.a = parseFloat(aOffset);
      } else {
        status.machine.position.offset.x = parseFloat(xOffset);
        status.machine.position.offset.y = parseFloat(yOffset);
        status.machine.position.offset.z = parseFloat(zOffset);
      }
    }
    // Extract wPos (for Grbl > 1.1 only!)
    var startWPos = data.search(/wpos:/i) + 5;
    var wPos;
    if (startWPos > 5) {
      var wPosLen = data.substr(startWPos).search(/>|\|/);
      wPos = data.substr(startWPos, wPosLen).split(/,/);
    }
    var startMPos = data.search(/mpos:/i) + 5;
    var mPos;
    if (startMPos > 5) {
      var mPosLen = data.substr(startMPos).search(/>|\|/);
      mPos = data.substr(startMPos, mPosLen).split(/,/);
    }
    // If we got a WPOS
    if (Array.isArray(wPos)) {
      // debug_log('wpos')
      if (xPos !== parseFloat(wPos[0]).toFixed(config.posDecimals)) {
        xPos = parseFloat(wPos[0]).toFixed(config.posDecimals);
      }
      if (yPos !== parseFloat(wPos[1]).toFixed(config.posDecimals)) {
        yPos = parseFloat(wPos[1]).toFixed(config.posDecimals);
      }
      if (zPos !== parseFloat(wPos[2]).toFixed(config.posDecimals)) {
        zPos = parseFloat(wPos[2]).toFixed(config.posDecimals);
      }
      if (wPos.length > 3) {
        if (aPos !== parseFloat(wPos[3]).toFixed(config.posDecimals)) {
          aPos = parseFloat(wPos[3]).toFixed(config.posDecimals);
          status.machine.has4thAxis = true;
        }
      }
      if (status.machine.has4thAxis) {
        status.machine.position.work.x = parseFloat(xPos);
        status.machine.position.work.y = parseFloat(yPos);
        status.machine.position.work.z = parseFloat(zPos);
        status.machine.position.work.a = parseFloat(aPos);
      } else {
        status.machine.position.work.x = parseFloat(xPos);
        status.machine.position.work.y = parseFloat(yPos);
        status.machine.position.work.z = parseFloat(zPos);
      }
      // end is WPOS
    } else if (Array.isArray(mPos)) {
      // debug_log('mpos', mPos)
      if (xPos !== parseFloat(mPos[0]).toFixed(config.posDecimals)) {
        xPos = parseFloat(mPos[0]).toFixed(config.posDecimals);
      }
      if (yPos !== parseFloat(mPos[1]).toFixed(config.posDecimals)) {
        yPos = parseFloat(mPos[1]).toFixed(config.posDecimals);
      }
      if (zPos !== parseFloat(mPos[2]).toFixed(config.posDecimals)) {
        zPos = parseFloat(mPos[2]).toFixed(config.posDecimals);
      }
      if (mPos.length > 3) {
        if (aPos !== parseFloat(mPos[3]).toFixed(config.posDecimals)) {
          aPos = parseFloat(mPos[3]).toFixed(config.posDecimals);
          status.machine.has4thAxis = true;
        }
      }
      if (status.machine.has4thAxis) {
        status.machine.position.work.x = parseFloat(parseFloat(xPos - status.machine.position.offset.x).toFixed(config.posDecimals));
        status.machine.position.work.y = parseFloat(parseFloat(yPos - status.machine.position.offset.y).toFixed(config.posDecimals));
        status.machine.position.work.z = parseFloat(parseFloat(zPos - status.machine.position.offset.z).toFixed(config.posDecimals));
        status.machine.position.work.a = parseFloat(parseFloat(aPos - status.machine.position.offset.a).toFixed(config.posDecimals));
      } else {
        status.machine.position.work.x = parseFloat(parseFloat(xPos - status.machine.position.offset.x).toFixed(config.posDecimals));
        status.machine.position.work.y = parseFloat(parseFloat(yPos - status.machine.position.offset.y).toFixed(config.posDecimals));
        status.machine.position.work.z = parseFloat(parseFloat(zPos - status.machine.position.offset.z).toFixed(config.posDecimals));
      }
      // end if MPOS
    }

  }
  // Extract override values (for Grbl > v1.1 only!)
  var startOv = data.search(/ov:/i) + 3;
  if (startOv > 3) {
    var ov = data.replace(">", "").substr(startOv).split(/,|\|/, 3);
    if (Array.isArray(ov)) {
      if (ov[0]) {
        status.machine.overrides.feedOverride = parseInt(ov[0]);
      }
      if (ov[1]) {
        status.machine.overrides.rapidOverride = parseInt(ov[1]);
      }
      if (ov[2]) {
        status.machine.overrides.spindleOverride = parseInt(ov[2]);
      }
    }
  }
  // Extract realtime Feed and Spindle (for Grbl > v1.1 only!)
  var startFS = data.search(/\|FS:/i) + 4;
  if (startFS > 4) {
    var fs = data.replace(">", "").substr(startFS).split(/,|\|/);
    if (Array.isArray(fs)) {
      if (fs[0]) {
        status.machine.overrides.realFeed = parseInt(fs[0]);
      }
      if (fs[1]) {
        status.machine.overrides.realSpindle = parseInt(fs[1]);
      }
    }
  }

  // extras realtime feed (if variable spindle is disabled)
  var startF = data.search(/\|F:/i) + 3;
  if (startF > 3) {
    var f = data.replace(">", "").substr(startF).split(/,|\|/);
    console.log(JSON.stringify(f, null, 4))
    if (Array.isArray(f)) {
      if (f[0]) {
        status.machine.overrides.realFeed = parseInt(f[0]);
      }
    }
  }

  // Extract Pin Data
  var startPin = data.search(/Pn:/i) + 3;
  if (startPin > 3) {
    var pinsdata = data.replace(">", "").replace("\r", "").substr(startPin).split(/,|\|/, 1);
    var pins = pinsdata[0].split('')
    status.machine.inputs = pins;
    if (!_.isEqual(pins, oldpinslist)) {
      if (pins.includes('H') && !pins.includes('D')) {
        // pause
        pause();
        var output = {
          'command': '[external from hardware]',
          'response': "OpenBuilds CONTROL received a FEEDHOLD notification from Grbl: This could be due to someone pressing the HOLD button (if connected)",
          'type': 'info'
        }
        io.sockets.emit('data', output);
      } // end if HOLD

      if (pins.includes('D')) {
        // pause
        pause();
      }

      if (pins.includes('R')) {
        // abort
        stop(true);
        var output = {
          'command': '[external from hardware]',
          'response': "OpenBuilds CONTROL received a RESET/ABORT notification from Grbl: This could be due to someone pressing the RESET/ABORT button (if connected)",
          'type': 'info'
        }
        io.sockets.emit('data', output);
      } // end if ABORT

      if (pins.includes('S')) {
        // abort
        unpause();
        var output = {
          'command': '[external from hardware]',
          'response': "OpenBuilds CONTROL received a CYCLESTART/RESUME notification from Grbl: This could be due to someone pressing the CYCLESTART/RESUME button (if connected)",
          'type': 'info'
        }
        io.sockets.emit('data', output);
      } // end if RESUME/START
    }
  } else {
    status.machine.inputs = [];
  }
  oldpinslist = pins;
  // Extract Buffer Data
  var startBuf = data.search(/Bf:/i) + 3;
  if (startBuf > 3) {
    var buffer = data.replace(">", "").replace("\r", "").substr(startBuf).split(/,|\|/, 2);
    // debug_log("BUF: " + JSON.stringify(buffer, null, 2));
    status.machine.firmware.buffer = buffer;
  } else {
    status.machine.firmware.buffer = [];
  }
  // end statusreport
}

function gotModals(data) {
  // as per https://github.com/gnea/grbl/wiki/Grbl-v1.1-Commands#g---view-gcode-parser-state
  // The shown g-code are the current modal states of Grbl's g-code parser.
  // This may not correlate to what is executing since there are usually
  // several motions queued in the planner buffer.
  // [GC:G0 G54 G17 G21 G90 G94 M5 M9 T0 F0.0 S0]

  // defaults

  data = data.split(/:|\[|\]/)[2].split(" ")

  for (i = 0; i < data.length; i++) {
    // if (data[i] == "G0") {
    //   status.machine.modals.motionmode = "G0";
    // }
    // if (data[i] == "G1") {
    //   status.machine.modals.motionmode = "G1";
    // }
    // if (data[i] == "G2") {
    //   status.machine.modals.motionmode = "G2";
    // }
    // if (data[i] == "G3") {
    //   status.machine.modals.motionmode = "G3";
    // }
    // if (data[i] == "G38.2") {
    //   status.machine.modals.motionmode = "G38.2";
    // }
    // if (data[i] == "G38.3") {
    //   status.machine.modals.motionmode = "G38.3";
    // }
    // if (data[i] == "G38.4") {
    //   status.machine.modals.motionmode = "G38.4";
    // }
    // if (data[i] == "G38.5") {
    //   status.machine.modals.motionmode = "G38.5";
    // }
    // if (data[i] == "G80") {
    //   status.machine.modals.motionmode = "G80";
    // }

    //   status.machine.modals.coordinatesys = "G54"; // G54, G55, G56, G57, G58, G59
    if (data[i] == "G54") {
      status.machine.modals.coordinatesys = "G54";
    }
    if (data[i] == "G55") {
      status.machine.modals.coordinatesys = "G55";
    }
    if (data[i] == "G56") {
      status.machine.modals.coordinatesys = "G56";
    }
    if (data[i] == "G57") {
      status.machine.modals.coordinatesys = "G57";
    }
    if (data[i] == "G58") {
      status.machine.modals.coordinatesys = "G58";
    }
    if (data[i] == "G59") {
      status.machine.modals.coordinatesys = "G59";
    }

    //   status.machine.modals.plane = "G17"; // G17, G18, G19
    if (data[i] == "G17") {
      status.machine.modals.plane = "G17";
    }
    if (data[i] == "G18") {
      status.machine.modals.plane = "G18";
    }
    if (data[i] == "G19") {
      status.machine.modals.plane = "G19";
    }

    //   status.machine.modals.distancemode = "G90"; // G90, G91
    if (data[i] == "G90") {
      status.machine.modals.distancemode = "G90";
    }
    if (data[i] == "G91") {
      status.machine.modals.distancemode = "G91";
    }

    //   status.machine.modals.arcdistmode = "G91.1"; // G91.1
    if (data[i] == "G91.1") {
      status.machine.modals.arcdistmode = "G91.1";
    }

    //   status.machine.modals.feedratemode = "G94"; // G93, G94
    if (data[i] == "G93") {
      status.machine.modals.feedratemode = "G93";
    }
    if (data[i] == "G94") {
      status.machine.modals.feedratemode = "G94";
    }

    //   status.machine.modals.unitsmode = "G21"; // G20, G21
    if (data[i] == "G20") {
      status.machine.modals.unitsmode = "G20";
    }
    if (data[i] == "G21") {
      status.machine.modals.unitsmode = "G21";
    }

    //   status.machine.modals.radiuscomp = "G40"; // G40
    if (data[i] == "G40") {
      status.machine.modals.radiuscomp = "G40";
    }

    //   status.machine.modals.tlomode = "G49"; // G43.1, G49
    if (data[i] == "G49") {
      status.machine.modals.tlomode = "G49";
    }
    if (data[i] == "G43.1") {
      status.machine.modals.tlomode = "G43.1";
    }

    //   status.machine.modals.programmode = "M0"; // M0, M1, M2, M30
    // if (data[i] == "M0") {
    //   status.machine.modals.programmode = "M0";
    // }
    // if (data[i] == "M1") {
    //   status.machine.modals.programmode = "M1";
    // }
    // if (data[i] == "M2") {
    //   status.machine.modals.programmode = "M2";
    // }
    // if (data[i] == "M30") {
    //   status.machine.modals.programmode = "M30";
    // }

    //   status.machine.modals.spindlestate = "M5"; // M3, M4, M5
    if (data[i] == "M3") {
      status.machine.modals.spindlestate = "M3";
    }
    if (data[i] == "M4") {
      status.machine.modals.spindlestate = "M4";
    }
    if (data[i] == "M5") {
      status.machine.modals.spindlestate = "M5";
    }

    //   status.machine.modals.coolantstate = "M9"; // M7, M8, M9
    if (data[i] == "M7") {
      status.machine.modals.coolantstate = "M7";
    }
    if (data[i] == "M8") {
      status.machine.modals.coolantstate = "M8";
    }
    if (data[i] == "M9") {
      status.machine.modals.coolantstate = "M9";
    }

    // //   status.machine.modals.tool = "0",
    // if (data[i].indexOf("T") === 0) {
    //   status.machine.modals.tool = parseFloat(data[i].substr(1))
    // }
    //
    // //   status.machine.modals.spindle = "0"
    // if (data[i].indexOf("S") === 0) {
    //   status.machine.modals.spindle = parseFloat(data[i].substr(1))
    // }
    //
    // //   status.machine.modals.feedrate = "0"
    // if (data[i].indexOf("F") === 0) {
    //   status.machine.modals.feedrate = parseFloat(data[i].substr(1))
    // }
  }
} // end gotModals

function laserTest(data) {
  if (status.comms.connectionStatus > 0) {
    data = data.split(',');
    var power = parseFloat(data[0]);
    var duration = parseInt(data[1]);
    var maxS = parseFloat(data[2]);
    if (power > 0) {
      if (!laserTestOn) {
        // laserTest is off
        // debug_log('laserTest: ' + 'Power ' + power + ', Duration ' + duration + ', maxS ' + maxS);
        if (duration >= 0) {
          switch (status.machine.firmware.type) {
            case 'grbl':
              addQToEnd('G1F1');
              addQToEnd('M3S' + parseInt(power * maxS / 100));
              laserTestOn = true;
              io.sockets.emit('laserTest', power);
              if (duration > 0) {
                addQToEnd('G4 P' + duration / 1000);
                addQToEnd('M5S0');
                laserTestOn = false;
              }
              send1Q();
              break;
          }
        }
      } else {
        // debug_log('laserTest: ' + 'Power off');
        switch (status.machine.firmware.type) {
          case 'grbl':
            addQToEnd('M5S0');
            send1Q();
            break;
        }
        laserTestOn = false;
        io.sockets.emit('laserTest', 0);
      }
    }
  } else {
    debug_log('ERROR: Machine connection not open!');
  }
}

// queue
function BufferSpace(firmware) {
  var total = 0;
  var len = sentBuffer.length;
  for (var i = 0; i < len; i++) {
    total += sentBuffer[i].length;
  }
  if (firmware == "grbl") {
    if (status.machine.firmware.rxBufferSize > 0) {
      return (status.machine.firmware.rxBufferSize - 1) - total;
    } else {
      if (status.machine.firmware.platform == "grblHAL") {
        return GRBLHAL_RX_BUFFER_SIZE - total;
      } else {
        return GRBL_RX_BUFFER_SIZE - total;
      }
    }

  }
}


function send1Q() {
  // console.time('send1Q');
  var gcode;
  var gcodeLen = 0;
  var spaceLeft = 0;
  if (status.comms.connectionStatus > 0) {
    switch (status.machine.firmware.type) {
      case 'grbl':
        if ((gcodeQueue.length - queuePointer) > 0 && !status.comms.blocked && !status.comms.paused) {
          spaceLeft = BufferSpace('grbl');

          // Do we have enough space in the buffer?
          if (gcodeQueue[queuePointer].length < spaceLeft) {
            gcode = gcodeQueue[queuePointer];
            queuePointer++;
            sentBuffer.push(gcode);
            machineSend(gcode + '\n', false);
            // debug_log('Sent: ' + gcode + ' Q: ' + (gcodeQueue.length - queuePointer) + ' Bspace: ' + (spaceLeft - gcode.length - 1));
          } else {
            status.comms.blocked = true;
          }
        }
        break;
    }
    if (queuePointer >= gcodeQueue.length) {
      if (gcodeQueue.length > 1) {
        var data = {
          completed: true,
          failed: false,
          jobCompletedMsg: jobCompletedMsg,
          jobStartTime: jobStartTime,
          jobEndTime: new Date().getTime()
        }
        io.sockets.emit('jobComplete', data);
      } else {
        var data = {
          completed: true,
          failed: true,
          jobCompletedMsg: jobCompletedMsg,
          jobStartTime: jobStartTime,
          jobEndTime: new Date().getTime()
        }
        io.sockets.emit('jobComplete', data);
      }
      status.comms.connectionStatus = 2; // finished
      clearInterval(queueCounter);
      jogWindow.setProgressBar(0);
      gcodeQueue.length = 0; // Dump the Queye
      queuePointer = 0;
      status.comms.connectionStatus = 2; // finished
      jobCompletedMsg = ""
      jobStartTime = false;
    }
  } else {
    debug_log('Not Connected')
  }
  // console.timeEnd('send1Q');
}

var modalCommands = ['G54', 'G55', 'G56', 'G57', 'G58', 'G59', 'G17', 'G18', 'G19', 'G90', 'G91', 'G91.1', 'G93', 'G94', 'G20', 'G21', 'G40', 'G43.1', 'G49', 'M0', 'M1', 'M2', 'M30', 'M3', 'M4', 'M5', 'M7', 'M8', 'M9']
var modalCommandsRegExp = new RegExp(modalCommands.join("|"));

function addQToEnd(gcode) {
  // debug_log('added ' + gcode)
  gcodeQueue.push(gcode);
  // if (gcode.indexOf("G54") != -1 || gcode.indexOf("G55") != -1 || gcode.indexOf("G56") != -1 || gcode.indexOf("G57") != -1 || gcode.indexOf("G58") != -1 || gcode.indexOf("G59") != -1) {
  //   gcodeQueue.push("$G");
  // }
  var testGcode = gcode.toUpperCase()
  if (testGcode.indexOf("$H") != -1) {
    status.machine.modals.homedRecently = true;
  }
  if (testGcode == "$CD") {
    fluidncConfig = ""; // empty string
  }
  if (!gcode.startsWith("$J=") && modalCommandsRegExp.test(testGcode)) {
    gcodeQueue.push("$G");
  }
  if (gcode.match(/T([\d.]+)/i)) {
    gcodeQueue.push("$G");
  }


}

function addQToStart(gcode) {
  gcodeQueue.unshift(gcode);
}

function addQRealtime(gcode) {
  // realtime command skip the send1Q as it doesnt respond with an ok
  machineSend(gcode, true);
}

function showJogWindow() {
  if (jogWindow === null) {
    createJogWindow();
  }
  jogWindow.show()
  jogWindow.setAlwaysOnTop(true);
  jogWindow.focus();
  jogWindow.setAlwaysOnTop(false);
}

// Electron
function isElectron() {
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }
  if (typeof process !== 'undefined' && process.versions && !!process.versions.electron) {
    return true;
  }
  return false;
}

if (isElectron()) {
  const gotTheLock = electronApp.requestSingleInstanceLock()
  var lauchGUI = true;
  if (!gotTheLock) {
    debug_log("Already running! Check the System Tray")
    electronApp.exit(0);
    electronApp.quit();
  } else {
    electronApp.on('second-instance', (event, commandLine, workingDirectory) => {
      //Someone tried to run a second instance, we should focus our window.
      // debug_log('SingleInstance')

      function checkFileType(fileName) {
        var fileNameLC = fileName.toLowerCase();
        if (fileNameLC.endsWith('.obc') || fileName.endsWith('.gcode') || fileName.endsWith('.gc') || fileName.endsWith('.tap') || fileName.endsWith('.nc') || fileName.endsWith('.cnc')) {
          return fileName;
        }
      }

      debug_log(commandLine)
      lauchGUI = true;

      var openFilePath = commandLine.find(checkFileType);
      if (openFilePath !== "") {
        readFile(openFilePath);
        if (openFilePath !== undefined) {
          if (openFilePath.endsWith('.obc')) {
            lauchGUI = false;
          } else {
            lauchGUI = true;
          }
        }
      }

      if (lauchGUI) {
        showJogWindow()
      }
    })
    // Create myWindow, load the rest of the app, etc...
    electronApp.on('ready', () => {
      if (process.platform == 'win32') {
        // Don't show window - sit in Tray
      } else {
        showJogWindow() // Macos and Linux - launch GUI
      }
    })
  }

  if (electronApp) {
    // Module to create native browser window.

    function createApp() {
      createTrayIcon();
      if (process.platform == 'darwin') {
        debug_log("Creating MacOS Menu");
        createMenu();
        status.driver.operatingsystem = 'macos';
      }
      if (process.platform == 'win32' && process.argv.length >= 2) {
        var openFilePath = process.argv[1];
        if (openFilePath !== "") {
          debug_log("path" + openFilePath);
          readFile(openFilePath);
        }
        status.driver.operatingsystem = 'windows';
      }

      if (process.platform == 'darwin' || uploadedgcode.length > 1) {
        showJogWindow()
      }

    }

    function createMenu() {

      var template = [{
        label: "Application",
        submenu: [{
          label: "Quit",
          accelerator: "Command+Q",
          click: function() {
            if (appIcon) {
              appIcon.destroy();
            }
            electronApp.exit(0);
          }
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

    function createTrayIcon() {
      if (process.platform !== 'darwin') {
        appIcon = new Tray(
          nativeImage.createFromPath(iconPath)
        )
        const contextMenu = Menu.buildFromTemplate([{
          label: 'Open User Interface (GUI)',
          click() {
            // debug_log("Clicked Systray")
            showJogWindow()
          }
        }, {
          label: 'Quit OpenBuilds CONTROL (Disables all integration until started again)',
          click() {
            if (appIcon) {
              appIcon.destroy();
            }
            electronApp.exit(0);
          }
        }])
        if (appIcon) {
          appIcon.on('click', function() {
            // debug_log("Clicked Systray")
            showJogWindow()
          })
        }

        if (appIcon) {
          appIcon.on('balloon-click', function() {
            // debug_log("Clicked Systray")
            showJogWindow()
          })
        }

        // Call this again for Linux because we modified the context menu
        if (appIcon) {
          appIcon.setContextMenu(contextMenu)
        }

        if (appIcon) {
          appIcon.displayBalloon({
            icon: nativeImage.createFromPath(iconPath),
            title: "OpenBuilds CONTROL Started",
            // content: "OpenBuilds CONTROL has started successfully: Active on " + ip.address() + ":" + config.webPort
            content: "OpenBuilds CONTROL has started successfully"
          })
        }
      } else {
        const dockMenu = Menu.buildFromTemplate([{
          label: 'Quit OpenBuilds CONTROL (Disables all integration until started again)',
          click() {
            // appIcon.destroy();
            electronApp.exit(0);
          }
        }])
        electronApp.dock.setMenu(dockMenu)
      };

    }

    function createJogWindow() {
      // Create the browser window.
      jogWindow = new BrowserWindow({
        // 1366 * 768 == minimum to cater for
        width: 1000,
        height: 850,
        fullscreen: false,
        center: true,
        resizable: true,
        maximizable: true,
        title: "OpenBuilds CONTROL ",
        frame: false,
        autoHideMenuBar: true,
        //icon: '/app/favicon.png',
        icon: nativeImage.createFromPath(
          path.join(__dirname, "/app/favicon.png")
        ),
        webgl: true,
        experimentalFeatures: true,
        experimentalCanvasFeatures: true,
        offscreen: true,
        backgroundColor: "#fff",
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      });

      jogWindow.setOverlayIcon(nativeImage.createFromPath(iconPath), 'Icon');
      var ipaddr = ip.address();
      // jogWindow.loadURL(`//` + ipaddr + `:3000/`)
      jogWindow.loadURL(`http://localhost:${config.webPort}/`);
      //jogWindow.webContents.openDevTools()

      jogWindow.on('close', function(event) {
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
      jogWindow.once('ready-to-show', () => {
        showJogWindow()
      })
    }

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    electronApp.on('ready', createApp);

    electronApp.on('before-quit', function() {
      forceQuit = true;
    })

    electronApp.on('will-quit', function(event) {
      // On OS X it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      // We don't take that route, we close it completely
      if (appIcon) {
        appIcon.destroy();
      }
      electronApp.exit(0);
    });

    // Quit when all windows are closed.
    electronApp.on('window-all-closed', function() {
      // On OS X it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      if (appIcon) {
        appIcon.destroy();
      }
      electronApp.exit(0);
    });

    electronApp.on('activate', function() {
      // On OS X it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) {
        createApp();
      }
    });

    // Autostart on Login
    if (process.platform == 'win32') {
      electronApp.setLoginItemSettings({
        openAtLogin: true,
        args: []
      })
    }
  }
} else { // if its not running under Electron, lets get Chrome up.
  var isPi = require('detect-rpi');
  if (isPi()) {
    DEBUG = true;
    debug_log('Running on Raspberry Pi!');
    status.driver.operatingsystem = 'rpi'
    startChrome();
  } else {
    debug_log("Running under NodeJS...");
  }
}


function stop(data) {
  //data = { stop: false, jog: false, abort: true}
  if (status.comms.connectionStatus > 0) {
    status.comms.paused = true;
    debug_log('STOP');
    switch (status.machine.firmware.type) {
      case 'grbl':

        if (data.jog) {
          addQRealtime(String.fromCharCode(0x85)); // canceljog
          debug_log('Sent: 0x85 Jog Cancel');
          debug_log(queuePointer, gcodeQueue)
        }

        if (!data.abort && !data.jog) { // pause motion first.
          addQRealtime('!'); // hold
          debug_log('Sent: !');
        }

        if (status.machine.firmware.version === '1.1d') {
          addQRealtime(String.fromCharCode(0x9E)); // Stop Spindle/Laser
          debug_log('Sent: Code(0x9E)');
        }

        debug_log('Cleaning Queue');
        if (!data.jog) {
          setTimeout(function() {
            addQRealtime(String.fromCharCode(0x18)); // ctrl-x
            debug_log('Sent: Code(0x18)');
          }, 200);
        }
        status.comms.connectionStatus = 2;
        break;
    }
    clearInterval(queueCounter);
    jogWindow.setProgressBar(0);
    status.comms.queue = 0
    queuePointer = 0;
    gcodeQueue.length = 0; // Dump the queue
    sentBuffer.length = 0; // Dump the queue
    // sentBuffer.length = 0; // Dump bufferSizes
    laserTestOn = false;
    status.comms.blocked = false;
    status.comms.paused = false;
    status.comms.runStatus = 'Stopped';
    status.comms.alarm = "";
  } else {
    debug_log('ERROR: Machine connection not open!');
  }
}

function pause() {
  if (status.comms.connectionStatus == 3) {
    status.comms.paused = true;
    debug_log('PAUSE');
    switch (status.machine.firmware.type) {
      case 'grbl':
        addQRealtime('!'); // Send hold command
        debug_log('Sent: !');
        if (status.machine.firmware.version === '1.1d') {
          addQRealtime(String.fromCharCode(0x9E)); // Stop Spindle/Laser
          debug_log('Sent: Code(0x9E)');
        }
        break;
    }
    status.comms.runStatus = 'Paused';
    status.comms.connectionStatus = 4;
  } else {
    debug_log('ERROR: Machine connection not open!');
  }
}

function unpause() {
  if (status.comms.connectionStatus > 0) {
    debug_log('UNPAUSE');
    switch (status.machine.firmware.type) {
      case 'grbl':
        addQRealtime('~'); // Send resume command
        debug_log('Sent: ~');
        break;
    }
    status.comms.paused = false;
    status.comms.blocked = false;
    setTimeout(function() {
      send1Q(); // restart queue
    }, 200);
    status.comms.runStatus = 'Resuming';
    status.comms.connectionStatus = 3;
  } else {
    debug_log('ERROR: Machine connection not open!');
  }
}

function isJson(item) {
  item = typeof item !== "string" ?
    JSON.stringify(item) :
    item;

  try {
    item = JSON.parse(item);
  } catch (e) {
    return false;
  }

  if (typeof item === "object" && item !== null) {
    return true;
  }

  return false;
}

function startChrome() {
  if (status.driver.operatingsystem == 'rpi') {
    const {
      spawn
    } = require('child_process');
    const chrome = spawn('chromium-browser', [`-app=http://127.0.0.1:${config.webPort}`]);
    chrome.on('close', (code) => {
      debug_log(`Chromium process exited with code ${code}`);
      process.exit(0);
    });
  } else {
    debug_log('Not a Raspberry Pi. Please use Electron Instead');
  }
}

// Interface Programming


// grab latest firmware.bin for Interface on startup

var file = fs.createWriteStream(path.join(uploadsDir, "firmware.bin"));
https.get("https://raw.githubusercontent.com/OpenBuilds/firmware/main/interface/firmware.bin", function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(function() {

      const options = {
        hostname: 'raw.githubusercontent.com',
        port: 443,
        path: '/OpenBuilds/firmware/main/interface/version.txt',
        method: 'GET'
      }

      const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`)

        res.on('data', d => {
          status.interface.firmware.availVersion = parseFloat(d.toString())

          var output = {
            'command': 'interface firmware update tool',
            'response': "Downloaded firmware.bin v" + status.interface.firmware.availVersion,
            'type': 'info'
          }
          io.sockets.emit('data', output);

        })
      })

      req.on('error', error => {
        var output = {
          'command': 'interface firmware update tool',
          'response': "Unable to download latest firmware.bin",
          'type': 'error'
        }
        io.sockets.emit('data', output);
      })

      req.end()


    });
  });
})



var firmwareImagePath = path.join(uploadsDir, './firmware.bin');
var spawn = require('child_process').spawn;
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  // By default, multer removes file extensions so let's add them back
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + new Date().toJSON().replace(new RegExp(':', 'g'), '.') + path.extname(file.originalname));
  }
});

function flashInterface(data) {
  status.comms.connectionStatus = 6;

  var port = data.port;
  var file = data.file;
  var board = data.board


  console.log("Flashing Interface on " + port + " with file: " + file)
  // var data = {
  //   'port': port,
  //   'string': debugString
  // }
  // io.sockets.emit("progStatus", data);
  //

  //for (let i = 0; i < ports.length; i++) {

  var data = {
    'port': port,
    'string': "[Starting...]"
  }
  io.sockets.emit("progStatus", data);

  var esptool_opts = [
    '--chip', 'esp32',
    '--port', port,
    '--baud', '921600',
    '--before', 'default_reset',
    '--after', 'hard_reset',
    'write_flash',
    '-z',
    '--flash_mode', 'dio',
    '--flash_freq', '80m',
    '--flash_size', 'detect',
    '0xe000', path.join(__dirname, "./boot_app0.bin").replace('app.asar', 'app.asar.unpacked'),
    '0x1000', path.join(__dirname, "./bootloader_qio_80m.bin").replace('app.asar', 'app.asar.unpacked'),
    '0x10000', path.resolve(firmwareImagePath).replace('app.asar', 'app.asar.unpacked'),
    '0x8000', path.join(__dirname, "./firmware.partitions.bin").replace('app.asar', 'app.asar.unpacked')
  ];

  if (process.platform == 'linux') {
    //path.join(__dirname, "..", "lib", "resources", "vad.onnx"),
    fs.chmodSync(path.join(__dirname, "./esptool.py").replace('app.asar', 'app.asar.unpacked'), 0o755);
    var child = spawn(path.join(__dirname, "./esptool.py").replace('app.asar', 'app.asar.unpacked'), esptool_opts);
  } else if (process.platform == 'win32') {
    var child = spawn(path.join(__dirname, "./esptool.exe").replace('app.asar', 'app.asar.unpacked'), esptool_opts);
  } else if (process.platform == 'darwin') {
    fs.chmodSync(path.join(__dirname, "./esptool.py").replace('app.asar', 'app.asar.unpacked'), 0o755);
    var child = spawn(path.join(__dirname, "./esptool.py").replace('app.asar', 'app.asar.unpacked'), esptool_opts);
  }




  child.stdout.on('data', function(data) {
    var debugString = data.toString();
    console.log(debugString)
    var data = {
      'port': port,
      'string': debugString
    }
    io.sockets.emit("progStatus", data);
    status.comms.connectionStatus = 6;

  });

  child.stderr.on('data', function(data) {
    var debugString = data.toString();
    console.log(debugString)
    var data = {
      'port': port,
      'string': debugString
    }
    io.sockets.emit("progStatus", data);
    status.comms.connectionStatus = 6;

  });

  child.on('close', (code) => {
    var data = {
      'port': port,
      'string': `[exit:` + code + `]`,
      'code': code
    }
    io.sockets.emit("progStatus", data);
    status.comms.connectionStatus = 0;

  });
}
// end Interface Programming

function flashGrblHal(data) {

  console.log(JSON.stringify(data))

  status.comms.connectionStatus = 6;

  var port = data.port;
  var file = data.file;
  var customImg = data.customImg
  var erase = data.erase

  if (customImg == true) {
    var firmwarePath = firmwareImagePath
  } else {
    var firmwarePath = path.join(__dirname, file)
  }

  console.log("Flashing BlackBoxX32 on " + port + " with file: " + path.resolve(firmwarePath).replace('app.asar', 'app.asar.unpacked'))

  var data = {
    'port': port,
    'string': "[Starting...]"
  }
  io.sockets.emit("progStatus", data);

  var esptool_opts = [
    '--port', port,
    '--baud', '460800',
    '--before', 'default_reset',
    '--after', 'hard_reset',
    '--chip', 'esp32',
    'write_flash',
    '--flash_mode', 'dio',
    '--flash_size', 'detect',
    '--flash_freq', '40m',
    '0x1000', path.join(__dirname, "./grblhal-bootloader.bin").replace('app.asar', 'app.asar.unpacked'),
    '0x8000', path.join(__dirname, "./grblhal-partition-table.bin").replace('app.asar', 'app.asar.unpacked'),
    '0x10000', path.resolve(firmwarePath).replace('app.asar', 'app.asar.unpacked')
  ];

  if (erase == true) {
    esptool_opts.push('--erase-all');
  }

  if (process.platform == 'linux') {
    //path.join(__dirname, "..", "lib", "resources", "vad.onnx"),
    fs.chmodSync(path.join(__dirname, "./esptool.py").replace('app.asar', 'app.asar.unpacked'), 0o755);
    var child = spawn(path.join(__dirname, "./esptool.py").replace('app.asar', 'app.asar.unpacked'), esptool_opts);
  } else if (process.platform == 'win32') {
    var child = spawn(path.join(__dirname, "./esptool.exe").replace('app.asar', 'app.asar.unpacked'), esptool_opts);
  } else if (process.platform == 'darwin') {
    fs.chmodSync(path.join(__dirname, "./esptool.py").replace('app.asar', 'app.asar.unpacked'), 0o755);
    var child = spawn(path.join(__dirname, "./esptool.py").replace('app.asar', 'app.asar.unpacked'), esptool_opts);
  }


  child.stdout.on('data', function(data) {
    var debugString = data.toString();
    console.log(debugString)
    var data = {
      'port': port,
      'string': debugString
    }
    io.sockets.emit("progStatus", data);
    status.comms.connectionStatus = 6;

  });

  child.stderr.on('data', function(data) {
    var debugString = data.toString();
    console.log(debugString)
    var data = {
      'port': port,
      'string': debugString
    }
    io.sockets.emit("progStatus", data);
    status.comms.connectionStatus = 6;

  });

  child.on('close', (code) => {
    var data = {
      'port': port,
      'string': `[exit:` + code + `]`,
      'code': code
    }
    io.sockets.emit("progStatus", data);
    status.comms.connectionStatus = 0;

  });
}
// end BlackBoxX32 Programming


// LAN Scanner for BlackBox X32, Interface, SwitchBlox etc //
function scanForTelnetDevices(range) {
  //var localNetwork = ip.address().split('.');
  //var network = localNetwork[0] + '.' + localNetwork[1] + '.' + localNetwork[2];
  //var range = network + ".1-" + network + ".254"

  var networkDevices = []
  oldiplist = status.comms.interfaces.networkDevices;
  const telnetScanOptions = {
    target: range,
    port: '23',
    status: 'TROU', // Timeout, Refused, Open, Unreachable
    banner: true
  };

  var output = {
    'command': 'network',
    'response': "Starting network scan for: " + telnetScanOptions.target,
    'type': 'success'
  }
  io.sockets.emit('data', output);

  new Evilscan(telnetScanOptions, (err, scan) => {

    if (err) {
      var output = {
        'command': 'network',
        'response': "Network Scan error: " + err,
        'type': 'success'
      }
      io.sockets.emit('data', output);
      //console.log(err);
      return;
    }

    scan.on('result', data => {
      // fired when item is matching options
      //console.log(data);
      if (data.status == "open") {
        var type = false;
        if (data.banner.indexOf("GrblHAL") != -1) {
          type = "grblHAL"
        } else if (data.banner.indexOf("Grbl") != -1) {
          type = "grbl"
        }
        networkDevices.push({
          ip: data.ip,
          type: type,
          banner: data.banner
        })
      }

    });

    scan.on('error', err => {
      //throw new Error(data.toString());
    });

    scan.on('done', () => {
      // finished !
      networkDevices.sort((a, b) => {
        return a.ip.split('.')[3] - b.ip.split('.')[3];
      });
      status.comms.interfaces.networkDevices = networkDevices;
      if (!_.isEqual(status.comms.interfaces.networkDevices, oldiplist)) {
        var newTelnetPorts = _.differenceWith(status.comms.interfaces.networkDevices, oldiplist, _.isEqual)
        if (newTelnetPorts.length > 0) {
          debug_log("Detected new device: " + newTelnetPorts[0].ip);
        }
        var removedTelnetPorts = _.differenceWith(oldiplist, status.comms.interfaces.networkDevices, _.isEqual)
        if (removedTelnetPorts.length > 0) {
          debug_log("No longer detecting device: " + removedTelnetPorts[0].ip);
        }
      }
      oldiplist = status.comms.interfaces.networkDevices;
      if (status.comms.interfaces.networkDevices.length > 0) {
        var output = {
          'command': 'network',
          'response': "Network Scan completed. Found " + status.comms.interfaces.networkDevices.length + " devices.  Network addresses added to the Port selection dropdown.",
          'type': 'success'
        }
      } else {
        var output = {
          'command': 'network',
          'response': "Network Scan completed. Found " + status.comms.interfaces.networkDevices.length + " devices",
          'type': 'error'
        }
      }

      io.sockets.emit('data', output);
    });

    scan.run();
  });
}
// end LAN Scanner

process.on('exit', () => debug_log('exit'))