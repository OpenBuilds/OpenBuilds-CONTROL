//v1.0.152
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1';

process.on("uncaughtException", (err) => {
  console.log(err)
});

console.log("Starting OpenBuilds CONTROL v" + require('./package').version)

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
var safetosend;

var fs = require('fs');
var path = require("path");
const join = require('path').join;
var mkdirp = require('mkdirp');

let parser;

app.use(express.static(path.join(__dirname, "app")));

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
const Readline = SerialPort.parsers.Readline;
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
  electronApp.commandLine.appendSwitch('ignore-gpu-blacklist', 'true')
  electronApp.commandLine.appendSwitch('enable-gpu-rasterization', 'true')
  electronApp.commandLine.appendSwitch('enable-zero-copy', 'true')
  electronApp.commandLine.appendSwitch('disable-software-rasterizer', 'true')
  electronApp.commandLine.appendSwitch('enable-native-gpu-memory-buffers', 'true')
  // Removing max-old-space-size switch (Introduced in 1.0.168 and removed in 1.0.169) due it causing High CPU load on some PCs.
  //electronApp.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192')
  console.log('Command Line Arguments for Electron: Set OK')
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
    console.log(JSON.stringify(ev))
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
    console.log(string)
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
    }, 15 * 60 * 1000) // 15 mins
    updateIsDownloading = false;
  });
} else {
  console.log("Running outside Electron: Disabled AutoUpdater")
}

if (isElectron()) {
  var uploadsDir = electronApp.getPath('userData') + '/upload/';
} else {
  var uploadsDir = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local')
}
var uploadedgcode = ""; // var to store uploaded gcode
var uploadedworkspace = ""; // var to store uploaded OpenBuildsCAM Workspace

mkdirp(uploadsDir, function(err) {
  if (err) console.error(err)
  else console.log('Created Uploads Temp Directory')
});

var oldportslist;
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
var queueCounter;
var listPortsLoop;

var GRBL_RX_BUFFER_SIZE = 127; // 128 characters
var sentBuffer = [];

var SMOOTHIE_RX_BUFFER_SIZE = 64; // max. length of one command line
var smoothie_buffer = false;

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
    ipaddress: ip.address(),
    operatingsystem: false
  },
  machine: {
    name: '',
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
    probe: {
      x: 0.00,
      y: 0.00,
      z: 0.00,
      state: -1,
      plate: 0.00,
      request: {}
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
      version: "",
      date: "",
      buffer: [],
      features: [],
      blockBufferSize: "",
      rxBufferSize: "",
    },
  },
  comms: {
    connectionStatus: 0, //0 = not connected, 1 = opening, 2 = connected, 3 = playing, 4 = paused, 5 = alarm, 6 = firmware upgrade
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
        }
        var removedPorts = _.differenceWith(oldportslist, ports, _.isEqual)
        if (removedPorts.length > 0) {
          console.log("Unplugged " + removedPorts[0].comName);
        }
      }
      oldportslist = ports;
    });
  }
}, 500);


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
  res.send('Host: ' + req.hostname + ' asked to activate OpenBuilds CONTROL v' + require('./package').version);
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

// File Post
app.post('/upload', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  //console.log(req)
  uploadprogress = 0
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    // console.log(files);
  });

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

    /*if (jogWindow === null) {
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
    }*/
    readFile(file.path)
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

    // handle Grbl RESET external input
    if (status.machine.inputs.length > 0) {
      for (i = 0; i < status.machine.inputs.length; i++) {
        switch (status.machine.inputs[i]) {
          case 'R':
            // console.log('PIN: SOFTRESET');
            safetosend = true;
            break;
        }
      }
    } else {
      io.sockets.emit('grbl')
    }
    if (safetosend != undefined && safetosend == true) {
      io.sockets.emit('grbl')
    }
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



  socket.on("openbuilds", function(data) {
    const {
      shell
    } = require('electron')
    shell.openExternal('https://www.openbuilds.com')
  });

  socket.on("opencam", function(data) {
    const {
      shell
    } = require('electron')
    shell.openExternal('https://cam.openbuilds.com')
  });

  socket.on("openforum", function(data) {
    const {
      shell
    } = require('electron')
    shell.openExternal('https://openbuilds.com/threads/openbuilds-control-software.13121/')
  });

  socket.on("minimisetotray", function(data) {
    jogWindow.hide();
  });

  socket.on("minimize", function(data) {
    jogWindow.minimize();
  });

  socket.on("maximise", function(data) {});

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
        console.log("autoUpdater not found")
      }
    }
  })


  socket.on("flashGrbl", function(data) {

    var port = data.port;
    var file = data.file;
    var board = data.board
    const Avrgirl = require('avrgirl-arduino');

    if (status.comms.connectionStatus > 0) {
      console.log('WARN: Closing Port ' + port);
      stopPort();
    } else {
      console.log('ERROR: Machine connection not open!');
    }

    function flashGrblCallback(debugString, port) {
      console.log(port, debugString);
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

      console.log(JSON.stringify(avrgirl));

      status.comms.connectionStatus = 6;
      avrgirl.flash(path.join(__dirname, file), function(error) {
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


  socket.on("connectTo", function(data) { // If a user picks a port to connect to, open a Node SerialPort Instance to it

    if (status.comms.connectionStatus < 1) {
      data = data.split(",");
      console.log("Connecting via " + data[0] + " to " + data[1] + " at baud " + data[2]);

      port = new SerialPort(data[1], {
        baudRate: parseInt(data[2])
      });

      parser = port.pipe(new Readline({
        delimiter: '\r\n'
      }));

      port.on("error", function(err) {
        if (err.message != "Port is not open") {
          console.log("Error: ", err.message);
          var output = {
            'command': '',
            'response': "PORT ERROR: " + err.message
          }
          io.sockets.emit('data', output);

          if (status.comms.connectionStatus > 0) {
            console.log('WARN: Closing Port ' + port.path);
            status.comms.connectionStatus = 0;
            stopPort();
          } else {
            console.log('ERROR: Machine connection not open!');
          }
        }

      });
      port.on("open", function() {
        console.log("PORT INFO: Connected to " + port.path + " at " + port.baudRate);
        var output = {
          'command': 'connect',
          'response': "PORT INFO: Port is now open: " + port.path + " - Attempting to detect Firmware"
        }
        io.sockets.emit('data', output);

        status.comms.connectionStatus = 1;

        var output = {
          'command': 'connect',
          'response': "Checking for firmware on " + port.path
        }
        io.sockets.emit('data', output);
        addQRealtime("\n"); // this causes smoothie to send the welcome string

        var output = {
          'command': 'connect',
          'response': "Detecting Firmware: Method 1 (Autoreset)"
        }
        io.sockets.emit('data', output);

        setTimeout(function() { //wait for controller to be ready
          if (status.machine.firmware.type.length < 1) {
            console.log("Didnt detect firmware after AutoReset. Lets see if we have Grbl instance with a board that doesnt have AutoReset");
            var output = {
              'command': 'connect',
              'response': "Detecting Firmware: Method 2 (Ctrl+X)"
            }
            io.sockets.emit('data', output);
            addQRealtime(String.fromCharCode(0x18)); // ctrl-x (needed for rx/tx connection)
            console.log("Sent: Ctrl+x");
          }
        }, config.grblWaitTime * 1000);

        setTimeout(function() { //wait for controller to be ready
          if (status.machine.firmware.type.length < 1) {
            console.log("No firmware yet, probably not Grbl then. lets see if we have Smoothie?");
            var output = {
              'command': 'connect',
              'response': "Detecting Firmware: Method 3 (others that are not supported)"
            }
            io.sockets.emit('data', output);
            addQRealtime("version\n"); // Check if it's Smoothieware?
            console.log("Sent: version");
          }
        }, config.grblWaitTime * 2000);

        if (config.firmwareWaitTime > 0) {
          setTimeout(function() {
            // Close port if we don't detect supported firmware after 2s.
            if (status.machine.firmware.type.length < 1) {
              console.log("No supported firmware detected. Closing port " + port.path);
              var output = {
                'command': 'connect',
                'response': "ERROR!:  No supported firmware detected - you need a controller with Grbl 1.1x on it, or there is a problem with your controller. Closing port " + port.path
              }
              io.sockets.emit('data', output);
              stopPort();
            } else {
              var output = {
                'command': 'connect',
                'response': "Firmware Detected:  " + status.machine.firmware.type + " version " + status.machine.firmware.version + " on " + port.path
              }
              io.sockets.emit('data', output);
            }
          }, config.firmwareWaitTime * 1000);
        }


        status.comms.connectionStatus = 2;
        status.comms.interfaces.activePort = port.path;
        status.comms.interfaces.activeBaud = port.baudRate;
      }); // end port .onopen

      port.on("close", function() { // open errors will be emitted as an error event
        console.log("PORT INFO: Port closed");
        var output = {
          'command': 'disconnect',
          'response': "PORT INFO: Port closed"
        }
        io.sockets.emit('data', output);
        status.comms.connectionStatus = 0;
      }); // end port.onclose

      parser.on("data", function(data) {
        var command = sentBuffer[0];

        // console.log('data:', data)

        // Grbl $I parser
        if (data.indexOf("[VER:") === 0) {
          status.machine.name = data.split(':')[2].split(']')[0].toLowerCase()
          io.sockets.emit("status", status);
          io.sockets.emit("machinename", data.split(':')[2].split(']')[0].toLowerCase());
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
                  console.log('SPINDLE_IS_SERVO Enabled')
                  //
                  break;
                case 'V': //	Variable spindle enabled
                  console.log('Variable spindle enabled')
                  //
                  break;
                case 'N': //	Line numbers enabled
                  console.log('Line numbers enabled')
                  //
                  break;
                case 'M': //	Mist coolant enabled
                  console.log('Mist coolant enabled')
                  //
                  break;
                case 'C': //	CoreXY enabled
                  console.log('CoreXY enabled')
                  //
                  break;
                case 'P': //	Parking motion enabled
                  console.log('Parking motion enabled')
                  //
                  break;
                case 'Z': //	Homing force origin enabled
                  console.log('Homing force origin enabled')
                  //
                  break;
                case 'H': //	Homing single axis enabled
                  console.log('Homing single axis enabled')
                  //
                  break;
                case 'T': //	Two limit switches on axis enabled
                  console.log('Two limit switches on axis enabled')
                  //
                  break;
                case 'A': //	Allow feed rate overrides in probe cycles
                  console.log('Allow feed rate overrides in probe cycles')
                  //
                  break;
                case '$': //	Restore EEPROM $ settings disabled
                  console.log('Restore EEPROM $ settings disabled')
                  //
                  break;
                case '#': //	Restore EEPROM parameter data disabled
                  console.log('Restore EEPROM parameter data disabled')
                  //
                  break;
                case 'I': //	Build info write user string disabled
                  console.log('Build info write user string disabled')
                  //
                  break;
                case 'E': //	Force sync upon EEPROM write disabled
                  console.log('Force sync upon EEPROM write disabled')
                  //
                  break;
                case 'W': //	Force sync upon work coordinate offset change disabled
                  console.log('Force sync upon work coordinate offset change disabled')
                  //
                  break;
                case 'L': //	Homing init lock sets Grbl into an alarm state upon power up
                  console.log('Homing init lock sets Grbl into an alarm state upon power up')
                  //
                  break;
              }
            }
            status.machine.firmware.features = features;
            io.sockets.emit("features", features);
          }
        }

        // [PRB:0.000,0.000,0.000:0]
        if (data.indexOf("[PRB:") === 0) {
          if (status.machine.probe.request.plate) {
            console.log(data)
            var prbLen = data.substr(5).search(/\]/);
            var prbData = data.substr(5, prbLen).split(/,/);
            var success = data.split(':')[2].split(']')[0];
            status.machine.probe.x = prbData[0];
            status.machine.probe.y = prbData[1];
            status.machine.probe.z = prbData[2];
            status.machine.probe.state = success;
            if (success > 0) {
              var output = {
                'command': '[ PROBE ]',
                'response': "Probe Completed.  Setting Z to " + status.machine.probe.plate + 'mm',
              }
              io.sockets.emit('data', output);
              addQToEnd('G10 P1 L20 Z' + status.machine.probe.plate);
              send1Q();
            } else {
              var output = {
                'command': '[ PROBE ]',
                'response': "Probe move aborted - probe did not make contact within specified distance",
              }
              io.sockets.emit('data', output);
            }
            io.sockets.emit('prbResult', status);
            status.machine.probe.request = "";
          }
        };

        // Machine Identification
        if (data.indexOf("Grbl") === 0) { // Check if it's Grbl
          console.log(data)
          status.comms.blocked = false;
          status.machine.firmware.type = "grbl";
          status.machine.firmware.version = data.substr(5, 4); // get version
          if (parseFloat(status.machine.firmware.version) < 1.1) { // If version is too old
            if (status.machine.firmware.version.length < 3) {
              console.log('invalid version string, stay connected')
            } else {
              if (status.comms.connectionStatus > 0) {
                console.log('WARN: Closing Port ' + port.path + " /  v" + parseFloat(status.machine.firmware.version));
                // stopPort();
              } else {
                console.log('ERROR: Machine connection not open!');
              }
              var output = {
                'command': command,
                'response': "Detected an unsupported version: Grbl " + status.machine.firmware.version + ". This is sadly outdated. Please upgrade to Grbl 1.1 or newer to use this software.  Go to http://github.com/gnea/grbl"
              }
              io.sockets.emit('data', output);
            }
          }
          status.machine.firmware.date = "";
          console.log("GRBL detected");
          setTimeout(function() {
            io.sockets.emit('grbl')
          }, 600)
          // Start interval for status queries
          statusLoop = setInterval(function() {
            if (status.comms.connectionStatus > 0) {
              addQRealtime("?");
            }
          }, 250);
        } else if (data.indexOf("LPC176") >= 0) { // LPC1768 or LPC1769 should be Smoothieware
          status.comms.blocked = false;
          console.log("Smoothieware detected");
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
            'response': "Detected an unsupported version: Smoothieware " + status.machine.firmware.version + ". This software no longer support Smoothieware. \nLuckilly there is an alternative firmware you can install on your controller to make it work with this software. Check out Grbl-LPC at https://github.com/cprezzi/grbl-LPC - Grbl-LPC is a Grbl port for controllers using the NXP LPC176x chips, for example Smoothieboards"
          }
          io.sockets.emit('data', output);
          stopPort();
        } // end of machine identification

        // Machine Feedback: Position
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
              if (alarmCode != 5) {
                io.sockets.emit("toastErrorAlarm", 'ALARM: ' + alarmCode + ' - ' + grblStrings.alarms(alarmCode) + " [ " + command + " ]")
              }
              var output = {
                'command': '',
                'response': 'ALARM: ' + alarmCode + ' - ' + grblStrings.alarms(alarmCode) + " [ " + command + " ]"
              }
              io.sockets.emit('data', output);
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
              io.sockets.emit("toastError", 'error: ' + errorCode + ' - ' + grblStrings.errors(errorCode) + " [ " + command + " ]")
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
              console.log("[MSG:Reset to continue] -> Sending Reset")
              addQRealtime(String.fromCharCode(0x18)); // ctrl-x
              break;
              // case 'smoothie':
              //
              //   break;
          }
        }

        if (command) {
          command = command.replace(/(\r\n|\n|\r)/gm, "");
          // console.log("CMD: " + command + " / DATA RECV: " + data.replace(/(\r\n|\n|\r)/gm, ""));

          if (command != "?" && command != "M105" && data.length > 0 && data.indexOf('<') == -1) {
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
        } else {
          if (data.indexOf("<") != 0) {
            var output = {
              'command': "",
              'response': data
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


  socket.on('runJob', function(data) {
    // console.log(data)
    uploadedgcode = data;
    // console.log('Run Job (' + data.length + ')');
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

  socket.on('zProbe', function(data) {
    console.log('Probing ' + data.direction + ' down to ' + data.dist + "mm at " + data.feedrate + "mm/min and then subtracting a plate of " + data.plate + "mm")
    status.machine.probe.request = data;
    status.machine.probe.x = 0.00;
    status.machine.probe.y = 0.00;
    status.machine.probe.z = 0.00;
    status.machine.probe.state = -1;
    status.machine.probe.plate = data.plate;
    switch (status.machine.firmware.type) {
      case 'grbl':
        addQToEnd('G21');
        addQToEnd('G10 P1 L20 Z0');
        addQToEnd('G38.2 Z-' + data.dist + ' F' + data.feedrate);
        send1Q();
        break;
        // case 'smoothie':
        //   addQToEnd('G91');
        //   addQToEnd('G0' + feed + dir + dist);
        //   addQToEnd('G90');
        //   send1Q();
        //   break;
        console.log('ERROR: Unsupported firmware!');
        break;
      default:
        console.log('ERROR: Unsupported firmware!');
        break;
    }
  });


  socket.on("surfaceLevelCalibration", async function(params) {
/*    if (status.machine.firmware.type !== "grbl") {
      console.log('ERROR: Unsupported firmware!');
      return;
    }*/
    const {surfaceLevelCalibration} = require("./surface-level-calibration");
    let calibrationData = await surfaceLevelCalibration(
        params,
        parser,
        (gcode) => machineSend(gcode+"\n"),
        uploadsDir
    );
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
        console.log('Adding jog commands to queue. Firmw=' + status.machine.firmware.type + ', blocked=' + status.comms.blocked + ', paused=' + status.comms.paused + ', Q=' + gcodeQueue.length);
        switch (status.machine.firmware.type) {
          case 'grbl':
            addQToEnd('$J=G91G21' + dir + dist + feed);
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
            addQToEnd('$J=G91G21X' + xincrement + " Y" + yincrement + " " + feed);
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
            addQToEnd('$J=G91G21' + mode + xVal + yVal + zVal + feed);
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
            addQRealtime(String.fromCharCode(0x90));
          } else if (curfro < reqfro) {
            // FRO Increase
            delta = reqfro - curfro
            console.log("delta = " + delta)
            var tens = Math.floor(delta / 10)

            console.log("need to send " + tens + " x10s increase")
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
            console.log("need to send " + ones + " x1s increase")
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
            console.log("delta = " + delta)

            var tens = Math.floor(delta / 10)
            console.log("need to send " + tens + " x10s decrease")
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
            console.log("need to send " + ones + " x1s decrease")
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
            console.log("need to send " + ones + " x1s increase")
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
            console.log("delta = " + delta)

            var tens = Math.floor(delta / 10)
            console.log("need to send " + tens + " x10s decrease")
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
            console.log("need to send " + ones + " x1s decrease")
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
          status.comms.queue = 0
          queuePointer = 0;
          gcodeQueue.length = 0; // Dump the queue
          sentBuffer.length = 0; // Dump bufferSizes
          queuePointer = 0;
          console.log('Clearing Lockout');
          switch (status.machine.firmware.type) {
            case 'grbl':
              addQRealtime(String.fromCharCode(0x18)); // ctrl-x
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

function readFile(path) {
  if (path) {
    if (path.length > 1) {
      console.log('readfile: ' + path)
      fs.readFile(path, 'utf8',
        function(err, data) {
          if (err) {
            console.log(err);
            var output = {
              'command': '',
              'response': "ERROR: File Upload Failed"
            }
            uploadedgcode = "";
          }
          if (data) {
            if (path.endsWith('.obc')) { // OpenBuildsCAM Workspace
              uploadedworkspace = data;
              const {
                shell
              } = require('electron')
              shell.openExternal('https://cam.openbuilds.com')
            } else { // GCODE
              const {adjustGCodeLevel} = require("./surface-level-calibration");
              data = adjustGCodeLevel(uploadsDir, data);
              io.sockets.emit('gcodeupload', data);
              uploadedgcode = data;
              return data
            }
          }
        });
    }
  }
}

function machineSend(gcode) {
  // console.log("SENDING: " + gcode)
  if (port.isOpen) {
    if (gcode.match(/T([\d.]+)/i)) {
      var tool = parseFloat(RegExp.$1);
      status.machine.tool.nexttool.number = tool
      status.machine.tool.nexttool.line = gcode
    }
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
    // console.log("ALARM:  " + data)
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
      // console.log('wpos')
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
      // end is WPOS
    } else if (Array.isArray(mPos)) {
      // console.log('mpos', mPos)
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
          has4thAxis = true;
        }
      }
      if (has4thAxis) {
        status.machine.position.work.x = parseFloat(xPos - status.machine.position.offset.x).toFixed(config.posDecimals)
        status.machine.position.work.y = parseFloat(yPos - status.machine.position.offset.y).toFixed(config.posDecimals)
        status.machine.position.work.z = parseFloat(zPos - status.machine.position.offset.z).toFixed(config.posDecimals)
        status.machine.position.work.a = parseFloat(aPos - status.machine.position.offset.a).toFixed(config.posDecimals)
      } else {
        status.machine.position.work.x = parseFloat(xPos - status.machine.position.offset.x).toFixed(config.posDecimals)
        status.machine.position.work.y = parseFloat(yPos - status.machine.position.offset.y).toFixed(config.posDecimals)
        status.machine.position.work.z = parseFloat(zPos - status.machine.position.offset.z).toFixed(config.posDecimals)
      }
      // end if MPOS
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
    status.machine.inputs = pins;
    if (!_.isEqual(pins, oldpinslist)) {
      if (pins.includes('H')) {
        // pause
        pause();
        var output = {
          'command': '[external from hardware]',
          'response': "OpenBuilds CONTROL received a FEEDHOLD notification from Grbl: This could be due to someone pressing the HOLD button (if connected), or DriverMinder on the xPROv4 detected a driver fault"
        }
        io.sockets.emit('data', output);
      } // end if HOLD

      if (pins.includes('R')) {
        // abort
        stop(true);
        var output = {
          'command': '[external from hardware]',
          'response': "OpenBuilds CONTROL received a RESET/ABORT notification from Grbl: This could be due to someone pressing the RESET/ABORT button (if connected), or DriverMinder on the xPROv4 detected a driver fault"
        }
        io.sockets.emit('data', output);
      } // end if ABORT

      if (pins.includes('S')) {
        // abort
        unpause();
        var output = {
          'command': '[external from hardware]',
          'response': "OpenBuilds CONTROL received a CYCLESTART/RESUME notification from Grbl: This could be due to someone pressing the CYCLESTART/RESUME button (if connected)"
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
      status.comms.connectionStatus = 2; // finished
      clearInterval(queueCounter);
      gcodeQueue.length = 0; // Dump the Queye
      queuePointer = 0;
      status.comms.connectionStatus = 2; // finished
      io.sockets.emit('jobComplete', true);
    }
  } else {
    console.log('Not Connected')
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
  const gotTheLock = electronApp.requestSingleInstanceLock()
  var lauchGUI = true;
  if (!gotTheLock) {
    console.log("Already running! Check the System Tray")
    electronApp.exit(0);
    electronApp.quit();
  } else {
    electronApp.on('second-instance', (event, commandLine, workingDirectory) => {
      //Someone tried to run a second instance, we should focus our window.
      // console.log('SingleInstance')
      // console.log(commandLine)
      lauchGUI = true;
      var openFilePath = commandLine[1];
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



    })
    // Create myWindow, load the rest of the app, etc...
    app.on('ready', () => {})
  }

  if (electronApp) {
    // Module to create native browser window.

    function createApp() {
      createTrayIcon();
      if (process.platform == 'darwin') {
        console.log("Creating MacOS Menu");
        createMenu();
        status.driver.operatingsystem = 'macos';
      }
      if (process.platform == 'win32' && process.argv.length >= 2) {
        var openFilePath = process.argv[1];
        if (openFilePath !== "") {
          console.log("path" + openFilePath);
          readFile(openFilePath);
        }
        status.driver.operatingsystem = 'windows';
      }

      if (process.platform == 'darwin' || uploadedgcode.length > 1) {
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
        }

        if (appIcon) {
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
        }

        // Call this again for Linux because we modified the context menu
        if (appIcon) {
          appIcon.setContextMenu(contextMenu)
        }

        if (appIcon) {
          appIcon.displayBalloon({
            icon: nativeImage.createFromPath(iconPath),
            title: "OpenBuilds CONTROL Started",
            content: "OpenBuilds CONTROL has started successfully: Active on " + ip.address() + ":" + config.webPort
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
        width: 870,
        height: 850,
        fullscreen: false,
        center: true,
        resizable: true,
        title: "OpenBuilds CONTROL ",
        frame: false,
        autoHideMenuBar: true,
        icon: '/app/favicon.png',
        webgl: true,
        experimentalFeatures: true,
        experimentalCanvasFeatures: true,
        offscreen: true,
      });

      jogWindow.setOverlayIcon(nativeImage.createFromPath(iconPath), 'Icon');
      var ipaddr = ip.address();
      // jogWindow.loadURL(`//` + ipaddr + `:3000/`)
      jogWindow.loadURL("http://localhost:3000/");

      jogWindow.on('close', function(event) {
        if (!forceQuit) {
          event.preventDefault();
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
        jogWindow.show()
        jogWindow.setAlwaysOnTop(true);
        jogWindow.focus();
        jogWindow.setAlwaysOnTop(false);
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
    if (!process.platform == 'darwin') {
      electronApp.setLoginItemSettings({
        openAtLogin: true,
        args: []
      })
    }
  }
} else {
  var isPi = require('detect-rpi');
  if (isPi()) {
    console.log('Running on Raspberry Pi!');
    status.driver.operatingsystem = 'rpi'
    startChrome();
    status.driver.operatingsystem = 'raspberrypi';
  } else {
    console.log("Running under NodeJS...");
  }
}


function stop(jog) {
  if (status.comms.connectionStatus > 0) {
    status.comms.paused = true;
    console.log('STOP');
    switch (status.machine.firmware.type) {
      case 'grbl':
        if (jog) {
          addQRealtime(String.fromCharCode(0x85)); // canceljog
          console.log('Sent: 0x85 Jog Cancel');
        } else {
          addQRealtime('!'); // hold
          console.log('Sent: !');
        }
        if (status.machine.firmware.version === '1.1d') {
          addQRealtime(String.fromCharCode(0x9E)); // Stop Spindle/Laser
          console.log('Sent: Code(0x9E)');
        }
        console.log('Cleaning Queue');
        if (!jog) {
          addQRealtime(String.fromCharCode(0x18)); // ctrl-x
          console.log('Sent: Code(0x18)');
        }
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
  } else {
    console.log('ERROR: Machine connection not open!');
  }
}

function pause() {
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
  } else {
    console.log('ERROR: Machine connection not open!');
  }
}

function unpause() {
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
  } else {
    console.log('ERROR: Machine connection not open!');
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
    const chrome = spawn('chromium-browser', ['-app=http://127.0.0.1:3000']);
    chrome.on('close', (code) => {
      console.log(`Chromium process exited with code ${code}`);
      console.log(`If you want to continue using OpenBuildsCONTROL, please open Chromium Browser to http://` + ip.address() + `:3000`);
    });
  } else {
    console.log('Not a Raspberry Pi. Please use Electron Instead');
  }
}

process.on('exit', () => console.log('exit'))