console.log("Starting OpenBuilds Machine Driver v" + require('./package').version)

var config = {};
config.webPort = process.env.WEB_PORT || 3000;
config.posDecimals = process.env.DRO_DECIMALS || 2;
config.grblWaitTime = 1;
config.firmwareWaitTime = 4;

var express = require("express");
var app = express();
var http = require("http").Server(app);
var https = require('https');

var ioServer = require('socket.io');
var io = new ioServer();

var fs = require('fs');
var path = require("path");
const join = require('path').join;
var mkdirp = require('mkdirp');

var httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'domain-key.key')),
  cert: fs.readFileSync(path.join(__dirname, 'domain-crt.cer'))
};

const httpsserver = https.createServer(httpsOptions, app).listen(3001, function() {
  console.log('https: listening on:' + ip.address() + ":3001");
});

const httpserver = http.listen(config.webPort, '0.0.0.0', function() {
  console.log('http:  listening on:' + ip.address() + ":" + config.webPort);
});

io.attach(httpserver);
io.attach(httpsserver);

const grblStrings = require("./grblStrings.js");
const serialport = require('serialport');
var SerialPort = serialport;
var md5 = require('md5');
var ip = require("ip");
var _ = require('lodash');
var fs = require("fs");
var formidable = require('formidable')
var lastsentuploadprogress = 0;

// Electron app
const electron = require('electron');
const electronApp = electron.app;
if (isElectron()) {
  console.log("Local User Data: " + electronApp.getPath('userData'))
}
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const nativeImage = require('electron').nativeImage
const Menu = require('electron').Menu

var appIcon = null,
  jogWindow = null,
  mainWindow = null


if (isElectron()) {
  const autoUpdater = require("electron-updater").autoUpdater
  var availversion = '0.0.0'

  autoUpdater.on('checking-for-update', () => {
    var string = 'Starting update... Please wait';
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    io.sockets.emit('updatedata', output);
    if (jogWindow && !jogWindow.isFocused()) {
      appIcon.displayBalloon({
        icon: nativeImage.createFromPath(iconPath),
        title: "OpenBuilds Machine Driver",
        content: string
      })
    }
  })
  autoUpdater.on('update-available', (ev, info) => {
    var string = "Starting Download: v" + ev.version;
    availversion = ev.version
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    io.sockets.emit('updatedata', output);
    console.log(JSON.stringify(ev))
    if (jogWindow && !jogWindow.isFocused()) {
      appIcon.displayBalloon({
        icon: nativeImage.createFromPath(iconPath),
        title: "OpenBuilds Machine Driver",
        content: string
      })
    }
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
    console.log(JSON.stringify(ev))
    if (jogWindow && !jogWindow.isFocused()) {
      appIcon.displayBalloon({
        icon: nativeImage.createFromPath(iconPath),
        title: "OpenBuilds Machine Driver",
        content: string
      })
    }
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
    if (jogWindow && !jogWindow.isFocused()) {
      appIcon.displayBalloon({
        icon: nativeImage.createFromPath(iconPath),
        title: "OpenBuilds Machine Driver",
        content: string
      })
    }
  })
  autoUpdater.on('download-progress', (ev, progressObj) => {
    var string = 'Download update ... ' + ev.percent.toFixed(1) + '%';
    console.log(string)
    var output = {
      'command': 'autoupdate',
      'response': string
    }
    io.sockets.emit('updatedata', output);
    io.sockets.emit('updateprogress', ev.percent.toFixed(0));
    if (ev.percent % 10 === 0) {
      if (jogWindow && !jogWindow.isFocused()) {
        appIcon.displayBalloon({
          icon: nativeImage.createFromPath(iconPath),
          title: "OpenBuilds Machine Driver",
          content: string
        })
      }
    }
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
    }, 15 * 60 * 1000) // 5 mins
    if (jogWindow && !jogWindow.isFocused()) {
      appIcon.displayBalloon({
        icon: nativeImage.createFromPath(iconPath),
        title: "OpenBuilds Machine Driver",
        content: string
      })
    }
  });
}

if (isElectron()) {
  var uploadsDir = electronApp.getPath('userData') + '/upload/';
} else {
  var uploadsDir = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local')
}

// fs.existsSync(uploadsDir) || fs.mkdirSync(uploadsDir)
mkdirp(uploadsDir, function(err) {
  if (err) console.error(err)
  else console.log('Created Uploads Temp Directory')
});

var oldportslist;
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
var queueCounter;
var listPortsLoop;

var GRBL_RX_BUFFER_SIZE = 127; // 128 characters
var sentBuffer = [];

var SMOOTHIE_RX_BUFFER_SIZE = 64; // max. length of one command line
var smoothie_buffer = false;
var lastMode;

var xPos = 0.00;
var yPos = 0.00;
var zPos = 0.00;
var aPos = 0.00;
var xOffset = 0.00;
var yOffset = 0.00;
var zOffset = 0.00;
var aOffset = 0.00;
var has4thAxis = false;

var feedOverride = 100,
  spindleOverride = 100;

//regex to identify MD5hash on sdupload later
var re = new RegExp("^[a-f0-9]{32}");

var status = {
  driver: {
    version: require('./package').version,
    ipaddress: ip.address()
  },
  machine: {
    inputs: [],
    tools: {
      hotend1: false,
      hotend2: false,
      heatbed: false,
      laser: false,
      spindle: false
    },
    overrides: {
      feedOverride: 100, //
      spindleOverride: 100, //
      realFeed: 0, //
      realSpindle: 0 //
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
    temperature: {
      setpoint: {
        t0: 0,
        t1: 0,
        b: 0
      },
      actual: {
        t0: 0,
        t1: 0,
        b: 0
      }
    },
    firmware: {
      type: "",
      version: "",
      date: "",
      buffer: [],
    },
    drivers: {
      x: {
        type: "",
        axis: "",
        microstep: 0,
        currentSetting: 0,
        enabled: 0,
        stallGuard: {
          stallGuardReading: 1023,
          stallGuardThreshold: 0,
          stallGuardFilter: 0
        },
        coolStep: {
          coolStepEnabled: 0,
          coolStepCurrent: 0,
          coolStepLowerThreshold: 0,
          coolStepUpperThreshold: 0,
          coolStepNumberOfReadings: 0,
          coolStepCurrentIncrement: 0,
          coolStepLowerCurrentLimit: 0
        },
        troubleshooting: {
          shortGndA: 0,
          shortGndB: 0,
          openLoadA: 0,
          openLoadB: 0,
          overTemp: 0
        }
      },
      y: {
        type: "",
        axis: "",
        microstep: 0,
        currentSetting: 0,
        enabled: 0,
        stallGuard: {
          stallGuardReading: 1023,
          stallGuardThreshold: 0,
          stallGuardFilter: 0
        },
        coolStep: {
          coolStepEnabled: 0,
          coolStepCurrent: 0,
          coolStepLowerThreshold: 0,
          coolStepUpperThreshold: 0,
          coolStepNumberOfReadings: 0,
          coolStepCurrentIncrement: 0,
          coolStepLowerCurrentLimit: 0
        },
        troubleshooting: {
          shortGndA: 0,
          shortGndB: 0,
          openLoadA: 0,
          openLoadB: 0,
          overTemp: 0
        }
      },
      z: {
        type: "",
        axis: "",
        microstep: 0,
        currentSetting: 0,
        enabled: 0,
        stallGuard: {
          stallGuardReading: 1023,
          stallGuardThreshold: 0,
          stallGuardFilter: 0
        },
        coolStep: {
          coolStepEnabled: 0,
          coolStepCurrent: 0,
          coolStepLowerThreshold: 0,
          coolStepUpperThreshold: 0,
          coolStepNumberOfReadings: 0,
          coolStepCurrentIncrement: 0,
          coolStepLowerCurrentLimit: 0
        },
        troubleshooting: {
          shortGndA: 0,
          shortGndB: 0,
          openLoadA: 0,
          openLoadB: 0,
          overTemp: 0
        }
      },
      a: {
        type: "",
        axis: "",
        microstep: 0,
        currentSetting: 0,
        enabled: 0,
        stallGuard: {
          stallGuardReading: 1023,
          stallGuardThreshold: 0,
          stallGuardFilter: 0
        },
        coolStep: {
          coolStepEnabled: 0,
          coolStepCurrent: 0,
          coolStepLowerThreshold: 0,
          coolStepUpperThreshold: 0,
          coolStepNumberOfReadings: 0,
          coolStepCurrentIncrement: 0,
          coolStepLowerCurrentLimit: 0
        },
        troubleshooting: {
          shortGndA: 0,
          shortGndB: 0,
          openLoadA: 0,
          openLoadB: 0,
          overTemp: 0
        }
      },
    }
  },
  comms: {
    connectionStatus: 0, //0 = not connected, 1 = opening, 2 = connected, 3 = playing, 4 = paused
    connectedTo: "none",
    runStatus: "Pending", // 0 = init, 1 = idle, 2 = alarm, 3 = stop, 4 = run, etc?
    queue: 0,
    blocked: false,
    paused: false,
    controllerBuffer: 0, // Seems like you are tracking available buffer?  Maybe nice to have in frontend?
    interfaces: {
      ports: "",
      activePort: "" // or activeIP in the case of wifi/telnet?
    },
    alarm: ""
  }
};

SerialPort.list(function(err, ports) {
  oldportslist = ports;
  status.comms.interfaces.ports = ports;
});

var PortCheckinterval = setInterval(function() {
  if (status.comms.connectionStatus == 0) {
    SerialPort.list(function(err, ports) {
      status.comms.interfaces.ports = ports;
      if (!_.isEqual(ports, oldportslist)) {
        var newPorts = _.differenceWith(ports, oldportslist, _.isEqual)
        if (newPorts.length > 0) {
          console.log("Plugged " + newPorts[0].comName);
          if (jogWindow && !jogWindow.isFocused()) {
            appIcon.displayBalloon({
              icon: nativeImage.createFromPath(iconPath),
              title: "Driver Detected a new Port",
              content: "OpenBuilds Machine Driver detected a new port: " + newPorts[0].comName
            })
          }
        }
        var removedPorts = _.differenceWith(oldportslist, ports, _.isEqual)
        if (removedPorts.length > 0) {
          console.log("Unplugged " + removedPorts[0].comName);
          if (jogWindow && !jogWindow.isFocused()) {
            appIcon.displayBalloon({
              icon: nativeImage.createFromPath(iconPath),
              title: "Driver Detected a disconnected Port",
              content: "OpenBuilds Machine Driver detected that port: " + removedPorts[0].comName + " was removed"
            })
          }
        }
      }
      oldportslist = ports;
    });
  }
}, 500);

// Static Webserver
app.use(express.static(path.join(__dirname, "app")));

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
  console.log(req.hostname)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.send('Host: ' + req.hostname + ' asked to activate OpenBuildsMachineDriver v' + require('./package').version);
  if (jogWindow === null) {
    createJogWindow();
    jogWindow.show()
    // workaround from https://github.com/electron/electron/issues/2867#issuecomment-261067169 to make window pop over for focus
    jogWindow.setAlwaysOnTop(true);
    jogWindow.focus();
    jogWindow.setAlwaysOnTop(false);
  } else {
    jogWindow.show()
    jogWindow.setAlwaysOnTop(true);
    jogWindow.focus();
    jogWindow.setAlwaysOnTop(false);
  }
  setTimeout(function() {
    io.sockets.emit('activate', req.hostname);
  }, 1500);
})

// Upload
app.get('/upload', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.sendFile(__dirname + '/app/upload.html');
})

// File Post
app.post('/upload', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  // console.log(req)
  uploadprogress = 0
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {});

  form.on('fileBegin', function(name, file) {
    console.log('Uploading ' + file.name);
    file.path = uploadsDir + file.name;
  });

  form.on('progress', function(bytesReceived, bytesExpected) {
    uploadprogress = parseInt(((bytesReceived * 100) / bytesExpected).toFixed(0));
    if (uploadprogress != lastsentuploadprogress) {
      lastsentuploadprogress = uploadprogress;
    }
  });

  form.on('file', function(name, file) {
    console.log('Uploaded ' + file.path);

    if (jogWindow === null) {
      createJogWindow();
      jogWindow.show()
      // workaround from https://github.com/electron/electron/issues/2867#issuecomment-261067169 to make window pop over for focus
      jogWindow.setAlwaysOnTop(true);
      jogWindow.focus();
      jogWindow.setAlwaysOnTop(false);
    } else {
      jogWindow.show()
      jogWindow.setAlwaysOnTop(true);
      jogWindow.focus();
      jogWindow.setAlwaysOnTop(false);
    }
    setTimeout(function() {

      fs.readFile(file.path, 'utf8',
        function(err, data) {
          if (err) {
            console.log(err);
            var output = {
              'command': '',
              'response': "ERROR: File Upload Failed"
            }
            io.sockets.emit('data', output);
            if (jogWindow && !jogWindow.isFocused()) {
              appIcon.displayBalloon({
                icon: nativeImage.createFromPath(iconPath),
                title: "ERROR: File Upload Failed",
                content: "OpenBuilds Machine Driver ERROR: File Upload Failed"
              })
            }
          }
          if (data) {
            io.sockets.emit('gcodeupload', data);
            if (jogWindow && !jogWindow.isFocused()) {
              appIcon.displayBalloon({
                icon: nativeImage.createFromPath(iconPath),
                title: "GCODE Received",
                content: "OpenBuilds Machine Driver received new GCODE"
              })
            }
          }
        });
    }, 1500);
  });

  form.on('aborted', function() {
    // Emitted when the request was aborted by the user. Right now this can be due to a 'timeout' or 'close' event on the socket. After this event is emitted, an error event will follow. In the future there will be a separate 'timeout' event (needs a change in the node core).
  });

  form.on('end', function() {
    //Emitted when the entire request has been received, and all contained files have finished flushing to disk. This is a great place for you to send your response.
  });

  res.sendFile(__dirname + '/app/upload.html');
});

app.on('certificate-error', function(event, webContents, url, error,
  certificate, callback) {
  event.preventDefault();
  callback(true);
});

io.on("connection", function(socket) {

  iosocket = socket;

  if (status.machine.firmware.type == 'grbl') {
    socket.emit('grbl')
  }

  var interval = setInterval(function() {
    io.sockets.emit("status", status);
    if (jogWindow) {
      if (status.comms.connectionStatus == 0) {
        jogWindow.setOverlayIcon(nativeImage.createFromPath(iconNoComm), 'Not Connected');
      } else if (status.comms.connectionStatus == 1) {
        jogWindow.setOverlayIcon(nativeImage.createFromPath(iconStop), 'Port Connected');
      } else if (status.comms.connectionStatus == 2) {
        jogWindow.setOverlayIcon(nativeImage.createFromPath(iconStop), 'Connected, and Firmware');
      } else if (status.comms.connectionStatus == 3) {
        jogWindow.setOverlayIcon(nativeImage.createFromPath(iconPlay), 'Playing');
      } else if (status.comms.connectionStatus == 4) {
        jogWindow.setOverlayIcon(nativeImage.createFromPath(iconPause), 'Paused');
      } else if (status.comms.connectionStatus == 5) {
        jogWindow.setOverlayIcon(nativeImage.createFromPath(iconAlarm), 'Alarm');
      }
    }
  }, 400);

  socket.on("opencam", function(data) {
    const {
      shell
    } = require('electron')
    shell.openExternal('https://cam.openbuilds.com')
  });

  socket.on("minimisetotray", function(data) {
    jogWindow.hide();
  });

  socket.on("minimize", function(data) {
    jogWindow.minimize();
  });

  socket.on("maximise", function(data) {});

  socket.on("quit", function(data) {
    appIcon.destroy();
    electronApp.exit(0);
  });

  socket.on("applyUpdate", function(data) {
    autoUpdater.quitAndInstall();
  })

  socket.on("downloadUpdate", function(data) {
    if (typeof autoUpdater !== 'undefined') {
      autoUpdater.checkForUpdates();
    }
  })


  socket.on("connectTo", function(data) { // If a user picks a port to connect to, open a Node SerialPort Instance to it

    if (status.comms.connectionStatus < 1) {
      data = data.split(",");
      console.log("Connecting via " + data[0] + " to " + data[1] + " at baud " + data[2]);

      port = new SerialPort(data[1], {
        parser: serialport.parsers.readline('\n'),
        baudRate: parseInt(data[2])
      });

      port.on("error", function(err) {
        console.log("Error: ", err.message);
        var output = {
          'command': '',
          'response': "PORT ERROR: " + err.message
        }
        io.sockets.emit('data', output);
        if (jogWindow && !jogWindow.isFocused()) {
          appIcon.displayBalloon({
            icon: nativeImage.createFromPath(iconPath),
            title: "Driver encountered a Port error",
            content: "OpenBuilds Machine Driver received the following error: " + err.message
          })
        }
        if (status.comms.connectionStatus > 0) {
          console.log('WARN: Closing Port ' + port.path);
          stopPort();
        } else {
          console.log('ERROR: Machine connection not open!');
        }
      });
      port.on("open", function() {
        var output = {
          'command': '',
          'response': "PORT INFO: Opening USB Port"
        }
        io.sockets.emit('data', output);
        status.comms.connectionStatus = 1;
        if (config.resetOnConnect == 1) {
          addQRealtime(String.fromCharCode(0x18)); // ctrl-x (needed for rx/tx connection)
          console.log("Sent: ctrl-x");
        } else {
          addQRealtime("\n"); // this causes smoothie to send the welcome string
        }
        setTimeout(function() { //wait for controller to be ready
          if (status.machine.firmware.type.length < 1) {
            console.log("No GRBL, lets see if we have Smoothie?");
            addQRealtime("version\n"); // Check if it's Smoothieware?
            console.log("Sent: version");
          }
        }, config.grblWaitTime * 1000);
        if (config.firmwareWaitTime > 0) {
          setTimeout(function() {
            // Close port if we don't detect supported firmware after 2s.
            if (status.machine.firmware.type.length < 1) {
              console.log("No supported firmware detected. Closing port " + port.path);
              stopPort();
            }
          }, config.firmwareWaitTime * 1000);
        }

        console.log("PORT INFO: Connected to " + port.path + " at " + port.options.baudRate);
        var output = {
          'command': '',
          'response': "PORT INFO: Port is now open: " + port.path + " - Attempting to detect Firmware"
        }
        io.sockets.emit('data', output);
        status.comms.connectionStatus = 2;
        status.comms.interfaces.activePort = port.path;
        status.comms.interfaces.activeBaud = port.options.baudRate;
      }); // end port .onopen

      port.on("close", function() { // open errors will be emitted as an error event
        console.log("PORT INFO: Port closed");
        var output = {
          'command': '',
          'response': "PORT INFO: Port closed"
        }
        io.sockets.emit('data', output);
      }); // end port.onclose

      port.on("data", function(data) {
        var command = sentBuffer[0];

        // Machine Identification
        if (data.indexOf("Grbl") === 0) { // Check if it's Grbl
          status.comms.blocked = false;
          status.machine.firmware.type = "grbl";
          status.machine.firmware.version = data.substr(5, 4); // get version
          if (parseFloat(status.machine.firmware.version) < 1.1) { // If version is too old
            if (status.comms.connectionStatus > 0) {
              console.log('WARN: Closing Port ' + port.path);
              stopPort();
            } else {
              console.log('ERROR: Machine connection not open!');
            }
            var output = {
              'command': command,
              'response': "Detected an unsupported version: Grbl " + status.machine.firmware.version + ". This is sadly outdated. Please upgrade to Grbl 1.1 or newer to use this software.  Go to http://github.com/gnea/grbl"
            }
            io.sockets.emit('data', output);
          }
          status.machine.firmware.date = "";
          console.log("GRBL detected");
          socket.emit('grbl')
          addQRealtime("$10=2\n"); // force Status Report to WPOS
          if (jogWindow && !jogWindow.isFocused()) {
            appIcon.displayBalloon({
              icon: nativeImage.createFromPath(iconPath),
              title: "Driver has established a Connection",
              content: "OpenBuilds Machine Driver is now connected to " + status.comms.interfaces.activePort + " running " + status.machine.firmware.type + " " + status.machine.firmware.version
            })
          }
          // Start interval for status queries
          statusLoop = setInterval(function() {
            if (status.comms.connectionStatus > 0) {
              addQRealtime("?");
            }
          }, 250);
        } else if (data.indexOf("LPC176") >= 0) { // LPC1768 or LPC1769 should be Smoothieware
          status.comms.blocked = false;
          console.log("Smoothieware detected");
          if (jogWindow && !jogWindow.isFocused()) {
            appIcon.displayBalloon({
              icon: nativeImage.createFromPath(iconPath),
              title: "Driver has established a Connection",
              content: "OpenBuilds Machine Driver is now connected to " + status.comms.interfaces.activePort + " running " + status.machine.firmware.type + " " + status.machine.firmware.version
            })
          }
          status.machine.firmware.type = "smoothie";
          status.machine.firmware.version = data.substr(data.search(/version:/i) + 9).split(/,/);
          status.machine.firmware.date = new Date(data.substr(data.search(/Build date:/i) + 12).split(/,/)).toDateString();
          // Start interval for status queries
          statusLoop = setInterval(function() {
            if (status.comms.connectionStatus > 0) {
              addQRealtime("?");
            }
          }, 200);
        } // end of machine identification

        // Machine Feedback: Temperature and Position
        if (data.indexOf("<") === 0) {
          // console.log(' Got statusReport (Grbl & Smoothieware)')
          // statusfeedback func
          parseFeedback(data)
          // console.log(data)
        } else if (data.indexOf("ok") === 0) { // Got an OK so we are clear to send
          // console.log("OK FOUND")
          if (status.machine.firmware.type === "grbl") {
            // console.log('got OK from ' + command)
            command = sentBuffer.shift();
          }

          if (status.machine.firmware.type === "smoothie") {
            // console.log('got OK from ' + command)
            command = sentBuffer.shift();
          }
          status.comms.blocked = false;
          send1Q();
        } else if (data.indexOf('ALARM') === 0) { //} || data.indexOf('HALTED') === 0) {
          console.log("ALARM:  " + data)
          status.comms.connectionStatus = 5;
          switch (status.machine.firmware.type) {
            case 'grbl':
              // sentBuffer.shift();
              var alarmCode = parseInt(data.split(':')[1]);
              console.log('ALARM: ' + alarmCode + ' - ' + grblStrings.alarms(alarmCode));
              status.comms.alarm = alarmCode + ' - ' + grblStrings.alarms(alarmCode)
              break;
            case 'smoothie':
              status.comms.alarm = data;
              break;
          }
          status.comms.connectionStatus = 5;
        } else if (data.indexOf('WARNING: After HALT you should HOME as position is currently unknown') != -1) { //} || data.indexOf('HALTED') === 0) {
          status.comms.connectionStatus = 2;
        } else if (data.indexOf('Emergency Stop Requested') != -1) { //} || data.indexOf('HALTED') === 0) {
          console.log("Emergency Stop Requested")
          status.comms.connectionStatus = 5;
        } else if (data.indexOf('wait') === 0) { // Got wait from Repetier -> ignore
          // do nothing
        } else if (data.indexOf('error') === 0) { // Error received -> stay blocked stops queue
          switch (status.machine.firmware.type) {
            case 'grbl':
              // sentBuffer.shift();
              var errorCode = parseInt(data.split(':')[1]);
              console.log('error: ' + errorCode + ' - ' + grblStrings.errors(errorCode) + " [ " + command + " ]");
              var output = {
                'command': '',
                'response': 'error: ' + errorCode + ' - ' + grblStrings.errors(errorCode) + " [ " + command + " ]"
              }
              io.sockets.emit('data', output);
              socket.emit("toastError", 'error: ' + errorCode + ' - ' + grblStrings.errors(errorCode) + " [ " + command + " ]")
              break;
            case 'smoothie':
              var output = {
                'command': '',
                'response': data
              }
              io.sockets.emit('data', output);
              // io.sockets.emit('data', data);
              break;
          }
          console.log("error;")
          status.comms.connectionStatus = 5;
        } else if (data === ' ') {
          // nothing
        } else {
          // do nothing with +data
        }

        if (command) {
          command = command.replace(/(\r\n|\n|\r)/gm, "");
          // console.log("CMD: " + command + " / DATA RECV: " + data.replace(/(\r\n|\n|\r)/gm, ""));

          if (command != "?" && command != "M105" && data.length > 0) {
            var string = "";
            if (status.comms.sduploading) {
              string += "SD: "
            }
            string += data //+ "  [ " + command + " ]"
            var output = {
              'command': command,
              'response': string
            }
            // console.log(output.response)
            io.sockets.emit('data', output);
          }
        }

      }); // end of parser.on(data)
    }
  });

  socket.on('saveToSd', function(datapack) {
    saveToSd(datapack);
  });


  socket.on('runJob', function(data) {
    // console.log(data)
    console.log('Run Job (' + data.length + ')');
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
          }, 500);
          send1Q(); // send first line
          status.comms.connectionStatus = 3;
        }

      }
      if (jogWindow && !jogWindow.isFocused()) {
        appIcon.displayBalloon({
          icon: nativeImage.createFromPath(iconPath),
          title: "Driver: Job Started",
          content: "OpenBuilds Machine Driver started a job: Job Size: " + data.length + " lines of GCODE"
        })
      }
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('forceQueue', function(data) {
    send1Q();
  });

  socket.on('runCommand', function(data) {
    console.log('Run Command (' + data.replace('\n', '|') + ')');
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
        if (i > 0) {
          status.comms.runStatus = 'Running'
          // console.log('sending ' + JSON.stringify(gcodeQueue))
          send1Q();
        }
      }
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('jog', function(data) {
    console.log('Jog ' + data);
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
        console.log('Adding jog commands to queue. blocked=' + status.comms.blocked + ', paused=' + status.comms.paused + ', Q=' + gcodeQueue.length);
        switch (status.machine.firmware.type) {
          case 'grbl':
            addQToEnd('$J=G91' + dir + dist + feed);
            send1Q();
            break;
          case 'smoothie':
            addQToEnd('G91');
            addQToEnd('G0' + feed + dir + dist);
            addQToEnd('G90');
            send1Q();
            break;
          default:
            console.log('ERROR: Unknown firmware!');
            break;
        }
      } else {
        console.log('ERROR: Invalid params!');
      }
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('jogXY', function(data) {
    console.log('Jog XY' + data);
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
        console.log('Adding jog commands to queue. blocked=' + status.comms.blocked + ', paused=' + status.comms.paused + ', Q=' + gcodeQueue.length);
        switch (status.machine.firmware.type) {
          case 'grbl':
            addQToEnd('$J=G91 X' + xincrement + " Y" + yincrement + " " + feed);
            send1Q();
            break;
          case 'smoothie':
            addQToEnd('G91');
            addQToEnd('G0 X' + xincrement + " Y" + yincrement + " " + feed);
            addQToEnd('G90');
            send1Q();
            break;
          default:
            console.log('ERROR: Unknown firmware!');
            break;
        }
      } else {
        console.log('ERROR: Invalid params!');
      }
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('jogTo', function(data) { // data = {x:xVal, y:yVal, z:zVal, mode:0(absulute)|1(relative), feed:fVal}
    console.log('JogTo ' + JSON.stringify(data));
    if (status.comms.connectionStatus > 0) {
      if (data.x !== undefined || data.y !== undefined || data.z !== undefined) {
        var xVal = (data.x !== undefined ? 'X' + parseFloat(data.x) : '');
        var yVal = (data.y !== undefined ? 'Y' + parseFloat(data.y) : '');
        var zVal = (data.z !== undefined ? 'Z' + parseFloat(data.z) : '');
        var mode = ((data.mode == 0) ? 0 : 1);
        var feed = (data.feed !== undefined ? 'F' + parseInt(data.feed) : '');
        console.log('Adding jog commands to queue. blocked=' + status.comms.blocked + ', paused=' + status.comms.paused + ', Q=' + gcodeQueue.length);
        switch (status.machine.firmware.type) {
          case 'grbl':
            addQToEnd('$J=G91' + mode + xVal + yVal + zVal + feed);
            break;
          case 'smoothie':
            addQToEnd('G91' + mode);
            addQToEnd('G0' + feed + xVal + yVal + zVal);
            addQToEnd('G90');
            send1Q();
            break;
          default:
            console.log('ERROR: Unknown firmware!');
            break;
        }
      } else {
        console.log('error Invalid params!');
      }
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('setZero', function(data) {
    console.log('setZero(' + data + ')');
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
      if (jogWindow && !jogWindow.isFocused()) {
        appIcon.displayBalloon({
          icon: nativeImage.createFromPath(iconPath),
          title: "Driver: Work Coordinate System Reset",
          content: "OpenBuilds Machine Driver has reset the WCS on the " + data + " axes."
        })
      }
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('gotoZero', function(data) {
    console.log('gotoZero(' + data + ')');
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
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('setPosition', function(data) {
    console.log('setPosition(' + JSON.stringify(data) + ')');
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
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('probe', function(data) {
    console.log('probe(' + JSON.stringify(data) + ')');
    if (status.comms.connectionStatus > 0) {
      switch (status.machine.firmware.type) {
        case 'smoothie':
          switch (data.direction) {
            case 'z':
              addQToEnd('G30 Z' + data.probeOffset);
              break;
            default:
              addQToEnd('G38.2 ' + data.direction);
              break;
          }
          send1Q();
          break;
        case 'grbl':
          addQToEnd('G38.2 ' + data.direction + '-5 F1');
          addQToEnd('G92 ' + data.direction + ' ' + data.probeOffset);
          send1Q();
          break;
        default:
          //not supported
          console.log('Command not supported by firmware!');
          break;
      }
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('feedOverride', function(data) {
    console.log(data)
    if (status.comms.connectionStatus > 0) {
      switch (status.machine.firmware.type) {
        case 'grbl':
          console.log("current FRO = " + status.machine.overrides.feedOverride)
          console.log("requested FRO = " + data)
          var curfro = parseInt(status.machine.overrides.feedOverride)
          var reqfro = parseInt(data)
          var delta;

          if (reqfro == 100) {
            addQRealtime(String.fromCharCode(144));
          } else if (curfro < reqfro) {
            // FRO Increase
            delta = reqfro - curfro
            console.log("delta = " + delta)
            var tens = Math.floor(delta / 10)

            console.log("need to send " + tens + " x10s increase")
            for (i = 0; i < tens; i++) {
              addQRealtime(String.fromCharCode(145));
            }

            var ones = delta - (10 * tens);
            console.log("need to send " + ones + " x1s increase")
            for (i = 0; i < ones; i++) {
              addQRealtime(String.fromCharCode(147));
            }
          } else if (curfro > reqfro) {
            // FRO Decrease
            delta = curfro - reqfro
            console.log("delta = " + delta)

            var tens = Math.floor(delta / 10)
            console.log("need to send " + tens + " x10s decrease")
            for (i = 0; i < tens; i++) {
              addQRealtime(String.fromCharCode(146));
            }
            var ones = delta - (10 * tens);
            console.log("need to send " + ones + " x1s decrease")
            for (i = 0; i < tens; i++) {
              addQRealtime(String.fromCharCode(148));
            }
          }
          status.machine.overrides.feedOverride = reqfro // Set now, but will be overriden from feedback from Grbl itself in next queryloop
          break;
        case 'smoothie':
          if (data === 0) {
            feedOverride = 100;
          } else {
            if ((feedOverride + data <= 200) && (feedOverride + data >= 10)) {
              // valid range is 10..200, else ignore!
              feedOverride += data;
            }
          }
          addQToStart('M220S' + feedOverride + '\n');
          send1Q();
          status.machine.overrides.feedOverride = feedOverride
          break;
      }
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('spindleOverride', function(data) {
    if (status.comms.connectionStatus > 0) {
      switch (status.machine.firmware.type) {
        case 'grbl':
          console.log("current SRO = " + status.machine.overrides.spindleOverride)
          console.log("requested SRO = " + data)
          var cursro = parseInt(status.machine.overrides.spindleOverride)
          var reqsro = parseInt(data)
          var delta;

          if (reqsro == 100) {
            addQRealtime(String.fromCharCode(153));
          } else if (cursro < reqsro) {
            // FRO Increase
            delta = reqsro - cursro
            console.log("delta = " + delta)
            var tens = Math.floor(delta / 10)

            console.log("need to send " + tens + " x10s increase")
            for (i = 0; i < tens; i++) {
              addQRealtime(String.fromCharCode(154));
            }

            var ones = delta - (10 * tens);
            console.log("need to send " + ones + " x1s increase")
            for (i = 0; i < ones; i++) {
              addQRealtime(String.fromCharCode(156));
            }
          } else if (cursro > reqsro) {
            // FRO Decrease
            delta = cursro - reqsro
            console.log("delta = " + delta)

            var tens = Math.floor(delta / 10)
            console.log("need to send " + tens + " x10s decrease")
            for (i = 0; i < tens; i++) {
              addQRealtime(String.fromCharCode(155));
            }

            var ones = delta - (10 * tens);
            console.log("need to send " + ones + " x1s decrease")
            for (i = 0; i < tens; i++) {
              addQRealtime(String.fromCharCode(157));
            }
          }
          status.machine.overrides.spindleOverride = reqsro // Set now, but will be overriden from feedback from Grbl itself in next queryloop
          break;
        case 'smoothie':
          if (data === 0) {
            spindleOverride = 100;
          } else {
            if ((spindleOverride + data <= 200) && (spindleOverride + data >= 0)) {
              // valid range is 0..200, else ignore!
              spindleOverride += data;
            }
          }
          addQToStart('M221S' + spindleOverride + '\n');
          send1Q();
          status.machine.overrides.spindleOverride = spindleOverride;
          break;
      }
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('laserTest', function(data) { // Laser Test Fire
    laserTest(data);
  });

  socket.on('pause', function() {
    if (status.comms.connectionStatus > 0) {
      status.comms.paused = true;
      console.log('PAUSE');
      switch (status.machine.firmware.type) {
        case 'grbl':
          addQRealtime('!'); // Send hold command
          console.log('Sent: !');
          if (status.machine.firmware.version === '1.1d') {
            addQRealtime(String.fromCharCode(0x9E)); // Stop Spindle/Laser
            console.log('Sent: Code(0x9E)');
          }
          break;
        case 'smoothie':
          addQToStart('M600'); // Laser will be turned off by smoothie (in default config!)
          send1Q();
          console.log('Sent: M600');
          break;
      }
      status.comms.runStatus = 'Paused';
      status.comms.connectionStatus = 4;
      if (jogWindow && !jogWindow.isFocused()) {
        appIcon.displayBalloon({
          icon: nativeImage.createFromPath(iconPath),
          title: "Driver: Job Paused",
          content: "OpenBuilds Machine Driver paused the job"
        })
      }
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('resume', function() {
    if (status.comms.connectionStatus > 0) {
      console.log('UNPAUSE');
      switch (status.machine.firmware.type) {
        case 'grbl':
          addQRealtime('~'); // Send resume command
          console.log('Sent: ~');
          break;
        case 'smoothie':
          addQToStart('M601'); // Send resume command
          send1Q();
          console.log('Sent: M601');
          break;
      }
      status.comms.paused = false;
      status.comms.blocked = false;
      setTimeout(function() {
        send1Q(); // restart queue
      }, 200);
      status.comms.runStatus = 'Resuming';
      status.comms.connectionStatus = 3;
      if (jogWindow && !jogWindow.isFocused()) {
        appIcon.displayBalloon({
          icon: nativeImage.createFromPath(iconPath),
          title: "Driver: Job Resumed",
          content: "OpenBuilds Machine Driver resumed the job"
        })
      }
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('stop', function() {
    if (status.comms.connectionStatus > 0) {
      status.comms.paused = true;
      console.log('STOP');
      switch (status.machine.firmware.type) {
        case 'grbl':
          addQRealtime('!'); // hold
          console.log('Sent: !');
          if (status.machine.firmware.version === '1.1d') {
            addQRealtime(String.fromCharCode(0x9E)); // Stop Spindle/Laser
            console.log('Sent: Code(0x9E)');
          }
          console.log('Cleaning Queue');
          addQRealtime(String.fromCharCode(0x18)); // ctrl-x
          console.log('Sent: Code(0x18)');
          status.comms.connectionStatus = 2;
          break;
        case 'smoothie':
          status.comms.paused = true;
          addQRealtime('M112'); // ctrl-x
          setTimeout(function() {
            addQToEnd("?");
            send1Q();
          }, 1000);
          status.comms.connectionStatus = 5;
          console.log('Sent: M112');
          break;
      }
      clearInterval(queueCounter);
      status.comms.queue = 0
      queuePointer = 0;
      gcodeQueue.length = 0; // Dump the queue
      sentBuffer.length = 0; // Dump the queue
      // sentBuffer.length = 0; // Dump bufferSizes
      laserTestOn = false;
      status.comms.blocked = false;
      status.comms.paused = false;
      status.comms.runStatus = 'Stopped';
      if (jogWindow && !jogWindow.isFocused()) {
        appIcon.displayBalloon({
          icon: nativeImage.createFromPath(iconPath),
          title: "Driver: Job Aborted",
          content: "OpenBuilds Machine Driver was asked to abort the running job."
        })
      }
      // status.comms.connectionStatus = 2;
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('clearAlarm', function(data) { // Clear Alarm
    if (status.comms.connectionStatus > 0) {
      data = parseInt(data);
      console.log('Clearing Queue: Method ' + data);
      switch (data) {
        case 1:
          console.log('Clearing Lockout');
          switch (status.machine.firmware.type) {
            case 'grbl':
              addQRealtime('$X\n');
              console.log('Sent: $X');
              break;
            case 'smoothie':
              addQRealtime('$X\n');
              console.log('Sent: $X');
              break;
          }
          console.log('Resuming Queue Lockout');
          break;
        case 2:
          console.log('Emptying Queue');
          gcodeQueue.length = 0; // Dump the queue
          sentBuffer.length = 0; // Dump bufferSizes
          queuePointer = 0;
          console.log('Clearing Lockout');
          switch (status.machine.firmware.type) {
            case 'grbl':
              addQRealtime('$X\n');
              console.log('Sent: $X');
              status.comms.blocked = false;
              status.comms.paused = false;
              break;
            case 'smoothie':
              addQToStart('M999'); //M999
              send1Q();
              console.log('Sent: M999');
              status.comms.blocked = false;
              status.comms.paused = false;
              break;
          }
          break;
      }
      status.comms.runStatus = 'Stopped'
      status.comms.connectionStatus = 2;
      if (jogWindow && !jogWindow.isFocused()) {
        appIcon.displayBalloon({
          icon: nativeImage.createFromPath(iconPath),
          title: "Driver: Alarm Cleared",
          content: "OpenBuilds Machine Driver has cleared the Alarm Condition, you may continue"
        })
      }
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('resetMachine', function() {
    if (status.comms.connectionStatus > 0) {
      console.log('Reset Machine');
      switch (status.machine.firmware.type) {
        case 'grbl':
          addQRealtime(String.fromCharCode(0x18)); // ctrl-x
          console.log('Sent: Code(0x18)');
          break;
        case 'smoothie':
          addQRealtime(String.fromCharCode(0x18)); // ctrl-x
          console.log('Sent: Code(0x18)');
          break;
      }
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('closePort', function(data) { // Close machine port and dump queue
    if (status.comms.connectionStatus > 0) {
      console.log('WARN: Closing Port ' + port.path);
      stopPort();
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

});

function machineSend(gcode) {
  // console.log("SENDING: " + gcode)
  if (port.isOpen) {
    var queueLeft = (gcodeQueue.length - queuePointer)
    var queueTotal = gcodeQueue.length
    // console.log("Q: " + queueLeft)
    var data = []
    data.push(queueLeft);
    data.push(queueTotal);
    io.sockets.emit("queueCount", data);
    // console.log(gcode)
    port.write(gcode);
  } else {
    console.log("PORT NOT OPEN")
  }
}

function stopPort() {
  clearInterval(queueCounter);
  clearInterval(statusLoop);
  status.comms.interfaces.activePort = false;
  status.comms.interfaces.activeBaud = false;
  status.comms.connectionStatus = 0;
  status.machine.firmware.type = "";
  status.machine.firmware.version = ""; // get version
  status.machine.firmware.date = "";
  status.machine.firmware.buffer = "";
  gcodeQueue.length = 0;
  sentBuffer.length = 0; // dump bufferSizes
  port.drain(port.close());
}

function parseFeedback(data) {
  // console.log(data)
  var state = data.substring(1, data.search(/(,|\|)/));
  status.comms.runStatus = state
  if (state == "Alarm") {
    console.log("ALARM:  " + data)
    status.comms.connectionStatus = 5;
    switch (status.machine.firmware.type) {
      case 'grbl':
        // sentBuffer.shift();
        var alarmCode = parseInt(data.split(':')[1]);
        // console.log('ALARM: ' + alarmCode + ' - ' + grblStrings.alarms(alarmCode));
        status.comms.alarm = alarmCode + ' - ' + grblStrings.alarms(alarmCode)
        break;
      case 'smoothie':
        status.comms.alarm = data;
        break;
    }
    status.comms.connectionStatus = 5;
  }
  if (status.machine.firmware.type == "grbl") {
    // Extract wPos (for Grbl > 1.1 only!)
    var startWPos = data.search(/wpos:/i) + 5;
    var wPos;
    if (startWPos > 5) {
      var wPosLen = data.substr(startWPos).search(/>|\|/);
      wPos = data.substr(startWPos, wPosLen).split(/,/);
    }
    if (Array.isArray(wPos)) {
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
          has4thAxis = true;
        }
      }
      if (has4thAxis) {
        status.machine.position.work.x = xPos
        status.machine.position.work.y = yPos
        status.machine.position.work.z = zPos
        status.machine.position.work.a = aPos
      } else {
        status.machine.position.work.x = xPos
        status.machine.position.work.y = yPos
        status.machine.position.work.z = zPos
      }
    } // END IS WPOS
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
      if (has4thAxis) {
        aOffset = parseFloat(wco[3]).toFixed(config.posDecimals);
        status.machine.position.offset.x = xOffset;
        status.machine.position.offset.y = yOffset;
        status.machine.position.offset.z = zOffset;
        status.machine.position.offset.a = aOffset;
      } else {
        status.machine.position.offset.x = xOffset;
        status.machine.position.offset.y = yOffset;
        status.machine.position.offset.z = zOffset;
      }
    }
  }
  if (status.machine.firmware.type == "smoothie") {
    // Extract wPos (for Smoothieware only!)
    var startWPos = data.search(/wpos:/i) + 5;
    var wPos;
    if (startWPos > 5) {
      wPos = data.replace('>', '').substr(startWPos).split(/,/, 4);
    }
    if (Array.isArray(wPos)) {
      if (xPos !== wPos[0]) {
        xPos = wPos[0];
      }
      if (yPos !== wPos[1]) {
        yPos = wPos[1];
      }
      if (zPos !== wPos[2]) {
        zPos = wPos[2];
      }
      if (wPos.length > 3) {
        if (aPos !== wPos[3]) {
          aPos = wPos[3];
          has4thAxis = true;
        }
      }
      if (has4thAxis) {
        status.machine.position.work.x = parseFloat(xPos).toFixed(config.posDecimals)
        status.machine.position.work.y = parseFloat(yPos).toFixed(config.posDecimals)
        status.machine.position.work.z = parseFloat(zPos).toFixed(config.posDecimals)
        status.machine.position.work.a = parseFloat(aPos).toFixed(config.posDecimals)
      } else {
        status.machine.position.work.x = parseFloat(xPos).toFixed(config.posDecimals)
        status.machine.position.work.y = parseFloat(yPos).toFixed(config.posDecimals)
        status.machine.position.work.z = parseFloat(zPos).toFixed(config.posDecimals)
      }
    }
    // Extract mPos (for Smoothieware only!)
    var startMPos = data.search(/mpos:/i) + 5;
    var mPos;
    if (startMPos > 5) {
      mPos = data.replace(">", "").substr(startMPos).split(/,|\|/, 4);
    }
    if (Array.isArray(mPos)) {
      if (xOffset != mPos[0] - xPos) {
        xOffset = mPos[0] - xPos;
      }
      if (yOffset != mPos[1] - yPos) {
        yOffset = mPos[1] - yPos;
      }
      if (zOffset != mPos[2] - zPos) {
        zOffset = mPos[2] - zPos;
      }
      if (has4thAxis) {
        if (aOffset != mPos[3] - aPos) {
          aOffset = mPos[3] - aPos;
        }
      }
      if (has4thAxis) {
        status.machine.position.offset.x = parseFloat(xOffset).toFixed(config.posDecimals);
        status.machine.position.offset.y = parseFloat(yOffset).toFixed(config.posDecimals);
        status.machine.position.offset.z = parseFloat(zOffset).toFixed(config.posDecimals);
        status.machine.position.offset.a = parseFloat(aOffset).toFixed(config.posDecimals);
      } else {
        status.machine.position.offset.x = parseFloat(xOffset).toFixed(config.posDecimals);
        status.machine.position.offset.y = parseFloat(yOffset).toFixed(config.posDecimals);
        status.machine.position.offset.z = parseFloat(zOffset).toFixed(config.posDecimals);
      }
    }
  }
  // Extract override values (for Grbl > v1.1 only!)
  var startOv = data.search(/ov:/i) + 3;
  if (startOv > 3) {
    var ov = data.replace(">", "").substr(startOv).split(/,|\|/, 3);
    if (Array.isArray(ov)) {
      if (ov[0]) {
        status.machine.overrides.feedOverride = ov[0];
      }
      if (ov[1]) {
        status.machine.overrides.rapidOverride = ov[1];
      }
      if (ov[2]) {
        status.machine.overrides.spindleOverride = ov[2];
      }
    }
  }
  // Extract realtime Feed and Spindle (for Grbl > v1.1 only!)
  var startFS = data.search(/FS:/i) + 3;
  if (startFS > 3) {
    var fs = data.replace(">", "").substr(startFS).split(/,|\|/);
    if (Array.isArray(fs)) {
      if (fs[0]) {
        status.machine.overrides.realFeed = fs[0];
      }
      if (fs[1]) {
        status.machine.overrides.realSpindle = fs[1];
      }
    }
  }
  // Extract Pin Data
  var startPin = data.search(/Pn:/i) + 3;
  if (startPin > 3) {
    var pinsdata = data.replace(">", "").replace("\r", "").substr(startPin).split(/,|\|/, 1);
    var pins = pinsdata[0].split('')
    // console.log("PINS: " + JSON.stringify(pins, null, 2));
    status.machine.inputs = pins;
  } else {
    status.machine.inputs = [];
  }

  // Extract Buffer Data
  var startBuf = data.search(/Bf:/i) + 3;
  if (startBuf > 3) {
    var buffer = data.replace(">", "").replace("\r", "").substr(startBuf).split(/,|\|/, 2);
    // console.log("BUF: " + JSON.stringify(buffer, null, 2));
    status.machine.firmware.buffer = buffer;
  } else {
    status.machine.firmware.buffer = [];
  }
  // end statusreport
}

function laserTest(data) {
  if (status.comms.connectionStatus > 0) {
    data = data.split(',');
    var power = parseFloat(data[0]);
    var duration = parseInt(data[1]);
    var maxS = parseFloat(data[2]);
    if (power > 0) {
      if (!laserTestOn) {
        // laserTest is off
        // console.log('laserTest: ' + 'Power ' + power + ', Duration ' + duration + ', maxS ' + maxS);
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
            case 'smoothie':
              addQToEnd('M3\n');
              addQToEnd('fire ' + power + '\n');
              laserTestOn = true;
              io.sockets.emit('laserTest', power);
              if (duration > 0) {
                var divider = 1;
                if (fDate >= new Date('2017-01-02')) {
                  divider = 1000;
                }
                addQToEnd('G4P' + duration / divider + '\n');
                addQToEnd('fire off\n');
                addQToEnd('M5');
                setTimeout(function() {
                  laserTestOn = false;
                  io.sockets.emit('laserTest', 0);
                }, duration);
              }
              send1Q();
              break;
          }
        }
      } else {
        // console.log('laserTest: ' + 'Power off');
        switch (status.machine.firmware.type) {
          case 'grbl':
            addQToEnd('M5S0');
            send1Q();
            break;
          case 'smoothie':
            addQToEnd('fire off\n');
            addQToEnd('M5\n');
            send1Q();
            break;
        }
        laserTestOn = false;
        io.sockets.emit('laserTest', 0);
      }
    }
  } else {
    console.log('ERROR: Machine connection not open!');
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
    return GRBL_RX_BUFFER_SIZE - total;
  } else {
    return SMOOTHIE_RX_BUFFER_SIZE - total;
  }
}


function send1Q() {
  var gcode;
  var gcodeLen = 0;
  var spaceLeft = 0;
  if (status.comms.connectionStatus > 0) {
    switch (status.machine.firmware.type) {
      case 'grbl':
        if ((gcodeQueue.length - queuePointer) > 0 && !status.comms.blocked && !status.comms.paused) {
          spaceLeft = BufferSpace('grbl');
          if (gcodeQueue[queuePointer].length < spaceLeft) {
            gcode = gcodeQueue[queuePointer];
            queuePointer++;
            sentBuffer.push(gcode);
            machineSend(gcode + '\n');
            // console.log('Sent: ' + gcode + ' Q: ' + (gcodeQueue.length - queuePointer) + ' Bspace: ' + (spaceLeft - gcode.length - 1));
          } else {
            status.comms.blocked = true;
          }
        }
        break;
      case 'smoothie':
        if ((gcodeQueue.length - queuePointer) > 0 && !status.comms.blocked && !status.comms.paused) {
          gcode = gcodeQueue[queuePointer];
          queuePointer++;
          status.comms.blocked = true;
          sentBuffer.push(gcode);
          machineSend(gcode + '\n');
          // console.log('Sent: ' + gcode + ' Q: ' + (gcodeQueue.length - queuePointer));
        }
        break;
    }
    if (queuePointer >= gcodeQueue.length) {
      if (!status.comms.connectionStatus == 5) {
        status.comms.connectionStatus = 2; // finished
      }
      clearInterval(queueCounter);
      // if (jogWindow && !jogWindow.isFocused()) {
      //   appIcon.displayBalloon({
      //     icon: nativeImage.createFromPath(iconPath),
      //     title: "Driver: Job Completed!",
      //     content: "OpenBuilds Machine Driver completed a Job"
      //   })
      // }
      gcodeQueue.length = 0; // Dump the Queye
      // sentBuffer.length = 0; // Dump bufferSizes
      queuePointer = 0;
      status.comms.connectionStatus = 2; // finished
      // status.comms.runStatus = "Finished"
    }

  }
}

function addQToEnd(gcode) {
  // console.log('added ' + gcode)
  gcodeQueue.push(gcode);
}

function addQToStart(gcode) {
  gcodeQueue.unshift(gcode);
}

function addQRealtime(gcode) {
  // realtime command skip the send1Q as it doesnt respond with an ok
  machineSend(gcode);
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
  const shouldQuit = electronApp.makeSingleInstance((commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (jogWindow === null) {
      createJogWindow();
      jogWindow.show()
      jogWindow.setAlwaysOnTop(true);
      jogWindow.focus();
      jogWindow.setAlwaysOnTop(false);
    } else {
      jogWindow.show()
      jogWindow.setAlwaysOnTop(true);
      jogWindow.focus();
      jogWindow.setAlwaysOnTop(false);
    }
  });

  if (shouldQuit) {
    console.log("Already running! Check the System Tray")
    electronApp.exit(0);
    electronApp.quit();
  }

  if (electronApp) {
    // Module to create native browser window.

    function createApp() {
      createTrayIcon();
      if (process.platform == 'darwin') {
        if (jogWindow === null) {
          createJogWindow();
          jogWindow.show()
          jogWindow.setAlwaysOnTop(true);
          jogWindow.focus();
          jogWindow.setAlwaysOnTop(false);
        } else {
          jogWindow.show()
          jogWindow.setAlwaysOnTop(true);
          jogWindow.focus();
          jogWindow.setAlwaysOnTop(false);
        }
      }
      // createWindow();
      // createJogWindow();
    }

    function createTrayIcon() {
      if (process.platform !== 'darwin') {
        appIcon = new Tray(
          nativeImage.createFromPath(iconPath)
        )
        const contextMenu = Menu.buildFromTemplate([{
          label: 'Quit Machine Driver (Disables all integration until started again)',
          click() {
            appIcon.destroy();
            electronApp.exit(0);
          }
        }])
        appIcon.on('click', function() {
          // console.log("Clicked Systray")
          if (jogWindow === null) {
            createJogWindow();
            jogWindow.show()
            jogWindow.setAlwaysOnTop(true);
            jogWindow.focus();
            jogWindow.setAlwaysOnTop(false);
          } else {
            jogWindow.show()
            jogWindow.setAlwaysOnTop(true);
            jogWindow.focus();
            jogWindow.setAlwaysOnTop(false);
          }
        })

        appIcon.on('balloon-click', function() {
          // console.log("Clicked Systray")
          if (jogWindow === null) {
            createJogWindow();
            jogWindow.show()
            jogWindow.setAlwaysOnTop(true);
            jogWindow.focus();
            jogWindow.setAlwaysOnTop(false);
          } else {
            jogWindow.show()
            jogWindow.setAlwaysOnTop(true);
            jogWindow.focus();
            jogWindow.setAlwaysOnTop(false);
          }
        })

        // Call this again for Linux because we modified the context menu
        appIcon.setContextMenu(contextMenu)

        appIcon.displayBalloon({
          icon: nativeImage.createFromPath(iconPath),
          title: "Driver Started",
          content: "OpenBuilds Machine Driver has started successfully: Active on " + ip.address() + ":" + config.webPort
        })
      } else {
        const dockMenu = Menu.buildFromTemplate([{
          label: 'Quit Machine Driver (Disables all integration until started again)',
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
        width: 660,
        height: 730,
        fullscreen: false,
        center: true,
        resizable: true,
        title: "OpenBuilds Machine Driver ",
        frame: false,
        autoHideMenuBar: true,
        icon: '/app/favicon.png'
      });

      jogWindow.setOverlayIcon(nativeImage.createFromPath(iconPath), 'Icon');
      var ipaddr = ip.address();
      // jogWindow.loadURL(`//` + ipaddr + `:3000/`)
      jogWindow.loadURL("http://localhost:3000/");

      jogWindow.on('close', function(event) {
        event.preventDefault();
        jogWindow.hide();
        return false;
      });

      // Emitted when the window is closed.
      jogWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        jogWindow = null;
      });
      jogWindow.once('ready-to-show', () => {
        jogWindow.show()
        jogWindow.setAlwaysOnTop(true);
        jogWindow.focus();
        jogWindow.setAlwaysOnTop(false);
      })
      // jogWindow.maximize()
      // jogWindow.webContents.openDevTools()

    }

    function createWindow() {
      // Create the browser window.
      mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        fullscreen: false,
        center: true,
        resizable: true,
        title: "OpenBuilds Machine Driver ",
        frame: true,
        autoHideMenuBar: true,
        icon: '/app/favicon.png'
      });

      // and load the index.html of the app.
      // mainWindow.loadURL('file://' + __dirname + '/app/index.html');
      // mainWindow.loadURL(`file://${__dirname}/app/index.html`)
      var ipaddr = ip.address();
      // mainWindow.loadURL(`//` + ipaddr + `:3000/`)
      mainWindow.loadURL("http://localhost:3000");

      mainWindow.on('close', function(event) {
        event.preventDefault();
        mainWindow.hide();
        return false;
      });

      // Emitted when the window is closed.
      mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
      });
      mainWindow.once('ready-to-show', () => {
        mainWindow.show()
      })
      mainWindow.maximize()
      // mainWindow.webContents.openDevTools()

    };

    // electronApp.commandLine.appendSwitch("--ignore-gpu-blacklist");

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    electronApp.on('ready', createApp);

    electronApp.on('will-quit', function(event) {
      event.preventDefault()
      // On OS X it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      if (process.platform !== 'darwin') {
        electronApp.quit();
        appIcon.destroy();
      }
      electronApp.quit();
      appIcon.destroy();
    });

    // Quit when all windows are closed.
    electronApp.on('window-all-closed', function() {
      // On OS X it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      if (process.platform !== 'darwin') {
        electronApp.quit();
        appIcon.destroy();
      }
      electronApp.quit();
      appIcon.destroy();
    });

    electronApp.on('activate', function() {
      // On OS X it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) {
        createApp();
      }
    });

    // Autostart on Login
    electronApp.setLoginItemSettings({
      openAtLogin: true,
      args: []
    })
  }
}

process.on('exit', () => console.log('exit'))