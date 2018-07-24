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

var httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'domain-key.key')),
  cert: fs.readFileSync(path.join(__dirname, 'domain-crt.cer'))
};

const httpsserver = https.createServer(httpsOptions, app).listen(3001, function() {
  console.log('https: listening on:' + ip.address() + ":3001");
});

const httpserver = http.listen(config.webPort, '0.0.0.0', function() {
  console.log('http:  listening on:' + ip.address() + ":" + config.webPort);
  // Now refresh library
  refreshGcodeLibrary();
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
var rimraf = require("rimraf")
var formidable = require('formidable')
var util = require('util');
var lastsentuploadprogress = 0;
// var gcodethumbnail = require("gcodethumbnail");
var colors = {
  G0: '#00CC00',
  G1: '#CC0000',
  G2G3: "#0000CC"
};
var width = 250;
var height = 200;

// Electron app
const electron = require('electron');
const electronApp = electron.app;
console.log("Local User Data: " + electronApp.getPath('userData'))
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const nativeImage = require('electron').nativeImage
const Menu = require('electron').Menu

var appIcon = null,
  jogWindow = null,
  mainWindow = null

const autoUpdater = require("electron-updater").autoUpdater

autoUpdater.on('checking-for-update', () => {
  var string = 'Checking for update...';
  var output = {
    'command': 'autoupdate',
    'response': string
  }
  io.sockets.emit('updatedata', output);
  appIcon.displayBalloon({
    icon: nativeImage.createFromPath(iconPath),
    title: "OpenBuilds Machine Driver",
    content: string
  })
})
autoUpdater.on('update-available', (ev, info) => {
  var string = 'Update available.Installed version: ' + require('./package').version + " / Available version: " + ev.version + ". Starting Download...\n";
  var output = {
    'command': 'autoupdate',
    'response': string
  }
  io.sockets.emit('updatedata', output);
  console.log(JSON.stringify(ev))
  appIcon.displayBalloon({
    icon: nativeImage.createFromPath(iconPath),
    title: "OpenBuilds Machine Driver",
    content: string
  })
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
  appIcon.displayBalloon({
    icon: nativeImage.createFromPath(iconPath),
    title: "OpenBuilds Machine Driver",
    content: string
  })
})
autoUpdater.on('error', (ev, err) => {
  var string = 'Error in auto-updater: \n' + err.split('SyntaxError')[0];
  var output = {
    'command': 'autoupdate',
    'response': string
  }
  io.sockets.emit('updatedata', output);
  appIcon.displayBalloon({
    icon: nativeImage.createFromPath(iconPath),
    title: "OpenBuilds Machine Driver",
    content: string
  })
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
    appIcon.displayBalloon({
      icon: nativeImage.createFromPath(iconPath),
      title: "OpenBuilds Machine Driver",
      content: string
    })
  }
})

autoUpdater.on('update-downloaded', (info) => {
  var string = "New update ready.  Click INSTALL UPDATE once you are ready. NB Note that this closes the running instance of the OpenBuilds Machine Driver, and aborts any running jobs.  Only run the Update before beginning a job / once you are done working with your machine. ";
  var output = {
    'command': 'autoupdate',
    'response': string
  }
  io.sockets.emit('updatedata', output);
  io.sockets.emit('updateready', true);
  appIcon.displayBalloon({
    icon: nativeImage.createFromPath(iconPath),
    title: "OpenBuilds Machine Driver",
    content: string
  })
});

var uploadsDir = electronApp.getPath('userData') + '/upload/';

fs.existsSync(uploadsDir) || fs.mkdirSync(uploadsDir)

var oldportslist;
const iconPath = path.join(__dirname, 'app/icon.png');
const iconNoComm = path.join(__dirname, 'app/icon-notconnected.png');
const iconPlay = path.join(__dirname, 'app/icon-play.png');
const iconStop = path.join(__dirname, 'app/icon-stop.png');
const iconPause = path.join(__dirname, 'app/icon-pause.png');
const iconAlarm = path.join(__dirname, 'app/icon-bell.png');


var iosocket;
var isAlarmed = false;
var lastmd5sum = '00000000000000000000000000000000'
var lastGcode = []
var lastCommand = false
var gcodeQueue = [];
var queuePointer = 0;
var startTime;
var statusLoop;
var queueCounter;
var listPortsLoop;

var GRBL_RX_BUFFER_SIZE = 128; // 128 characters
var grblBufferSize = [];
var new_grbl_buffer = false;

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
    version: require('./package').version
  },
  machine: {
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
      config: []
    },
    sdcard: {
      list: []
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

function refreshGcodeLibrary() {
  // if (fs.existsSync(uploadsDir)) {
  //   const dirTree = require('directory-tree');
  //
  //   var tree = dirTree(uploadsDir, {
  //     extensions: /\.gcode|\.nc|\.tap|\.cnc|\.gc|\.g-code$/
  //   }, (item, PATH) => {
  //     // if a gcode is found, then
  //     // console.log(item);
  //     ConvertGCODEtoPNG(item.path, item.path + ".png")
  //   });
  //   // console.log("---------------")
  //   var tree = dirTree(uploadsDir, {
  //     extensions: /\.gcode|\.png/
  //   });
  //   var treeData = JSON.stringify(tree, null, 2)
  //   // console.log(treeData);
  //   fs.writeFileSync(join(uploadsDir + '/data.json'), treeData, 'utf-8')
  // }
}

function ConvertGCODEtoPNG(file, out) {
  // var path = out;
  // fs.readFile(file, 'utf8',
  //   function(err, data) {
  //     if (err) {
  //       console.log(err);
  //       process.exit(1);
  //     }
  //     gcodethumbnail.generatePNG(path, data, colors, width, height);
  //   });
}

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
          appIcon.displayBalloon({
            icon: nativeImage.createFromPath(iconPath),
            title: "Driver Detected a new Port",
            content: "OpenBuilds Machine Driver detected a new port: " + newPorts[0].comName
          })
        }
        var removedPorts = _.differenceWith(oldportslist, ports, _.isEqual)
        if (removedPorts.length > 0) {
          console.log("Unplugged " + removedPorts[0].comName);
          appIcon.displayBalloon({
            icon: nativeImage.createFromPath(iconPath),
            title: "Driver Detected a disconnected Port",
            content: "OpenBuilds Machine Driver detected that port: " + removedPorts[0].comName + " was removed"
          })
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



  // Cleanup old files - later
  // fs.readdir(uploadsDir, function(err, files) {
  //   files.forEach(function(file, index) {
  //     fs.stat(path.join(uploadsDir, file), function(err, stat) {
  //       var endTime, now;
  //       if (err) {
  //         return console.error(err);
  //       }
  //       now = new Date().getTime();
  //       // older than an hour
  //       endTime = new Date(stat.ctime).getTime() + 3600000;
  //       if (now > endTime) {
  //         return rimraf(path.join(uploadsDir, file), function(err) {
  //           if (err) {
  //             return console.error(err);
  //           }
  //           console.log('successfully deleted' + file);
  //         });
  //       }
  //     });
  //   });
  // });

  // form.parse(req);
  form.parse(req, function(err, fields, files) {
    // console.log(util.inspect({
    //   fields: fields,
    //   files: files
    // }));
  });

  form.on('fileBegin', function(name, file) {
    // Emitted whenever a new file is detected in the upload stream. Use this event if you want to stream the file to somewhere else while buffering the upload on the file system.
    console.log('Uploading ' + file.name);
    file.path = uploadsDir + file.name;
    // io.sockets.in('sessionId').emit('startupload', 'STARTING');
  });

  form.on('progress', function(bytesReceived, bytesExpected) {
    uploadprogress = parseInt(((bytesReceived * 100) / bytesExpected).toFixed(0));
    if (uploadprogress != lastsentuploadprogress) {
      // io.sockets.in('sessionId').emit('uploadprogress', uploadprogress);
      lastsentuploadprogress = uploadprogress;
    }
  });

  form.on('file', function(name, file) {
    // Emitted whenever a field / file pair has been received. file is an instance of File.
    console.log('Uploaded ' + file.path);
    // io.sockets.in('sessionId').emit('doneupload', 'COMPLETE');

    refreshGcodeLibrary();

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
            appIcon.displayBalloon({
              icon: nativeImage.createFromPath(iconPath),
              title: "ERROR: File Upload Failed",
              content: "OpenBuilds Machine Driver ERROR: File Upload Failed"
            })
            // process.exit(1);
          }
          // console.log(data)
          if (data) {
            io.sockets.emit('gcodeupload', data);
            appIcon.displayBalloon({
              icon: nativeImage.createFromPath(iconPath),
              title: "GCODE Received",
              content: "OpenBuilds Machine Driver received new GCODE"
            })
          }
        });


    }, 1500);
    // console.log("Done, now lets work with " + file.path)
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

function stopPort() {
  clearInterval(queueCounter);
  clearInterval(statusLoop);
  status.comms.interfaces.activePort = false;
  status.comms.interfaces.activeBaud = false;
  status.comms.connectionStatus = 0;
  status.machine.firmware.type = "";
  status.machine.firmware.version = ""; // get version
  status.machine.firmware.date = "";
  gcodeQueue.length = 0;
  lastGcode.length = 0;
  grblBufferSize.length = 0; // dump bufferSizes
  port.drain(port.close());

}

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

  socket.on("minimise", function(data) {
    jogWindow.hide();
  });
  socket.on("maximise", function(data) {});
  socket.on("quit", function(data) {
    appIcon.destroy();
    electronApp.exit(0);
  });

  socket.on("applyUpdate", function(data) {
    autoUpdater.quitAndInstall();
  })

  socket.on("checkUpdates", function(data) {
    autoUpdater.checkForUpdates();
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
        appIcon.displayBalloon({
          icon: nativeImage.createFromPath(iconPath),
          title: "Driver encountered a Port error",
          content: "OpenBuilds Machine Driver received the following error: " + err.message
        })
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
          machineSend(String.fromCharCode(0x18)); // ctrl-x (needed for rx/tx connection)
          console.log("Sent: ctrl-x");
        } else {
          machineSend("\n"); // this causes smoothie to send the welcome string
        }
        setTimeout(function() { //wait for controller to be ready
          if (status.machine.firmware.type.length < 1) {
            console.log("No GRBL, lets see if we have Smoothie?");
            machineSend("version\n"); // Check if it's Smoothieware?
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
        // console.log("DATA RECV: " + data.replace(/(\r\n|\n|\r)/gm, ""));
        // console.log()

        // Command Tracking
        if (lastGcode.length == 0) {
          command = lastCommand;
        } else {
          command = lastGcode.shift();
          if (lastGcode.length == 0) {
            lastCommand = command;
          }
        }

        if (!command) {
          command = ""
        };
        command = command.replace(/(\r\n|\n|\r)/gm, "");

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

          io.sockets.emit('data', output);
        }

        // Machine Identification
        if (data.indexOf("Grbl") === 0) { // Check if it's Grbl
          status.comms.blocked = false;
          status.machine.firmware.type = "grbl";
          status.machine.firmware.version = data.substr(5, 4); // get version
          status.machine.firmware.date = "";
          console.log("GRBL detected");
          socket.emit('grbl')
          appIcon.displayBalloon({
            icon: nativeImage.createFromPath(iconPath),
            title: "Driver has established a Connection",
            content: "OpenBuilds Machine Driver is now connected to " + status.comms.interfaces.activePort + " running " + status.machine.firmware.type + " " + status.machine.firmware.version
          })
          // Start interval for status queries
          statusLoop = setInterval(function() {
            if (status.comms.connectionStatus > 0) {
              if (!status.comms.sduploading && !status.comms.blocked) {
                machineSend("?");
              }
            }
          }, 1000);
        } else if (data.indexOf("LPC176") >= 0) { // LPC1768 or LPC1769 should be Smoothieware
          status.comms.blocked = false;
          console.log("Smoothieware detected");
          appIcon.displayBalloon({
            icon: nativeImage.createFromPath(iconPath),
            title: "Driver has established a Connection",
            content: "OpenBuilds Machine Driver is now connected to " + status.comms.interfaces.activePort + " running " + status.machine.firmware.type + " " + status.machine.firmware.version
          })
          status.machine.firmware.type = "smoothie";
          status.machine.firmware.version = data.substr(data.search(/version:/i) + 9).split(/,/);
          status.machine.firmware.date = new Date(data.substr(data.search(/Build date:/i) + 12).split(/,/)).toDateString();
          // Start interval for status queries
          statusLoop = setInterval(function() {
            if (status.comms.connectionStatus > 0) {
              if (!status.comms.sduploading) {
                machineSend("?");
                if (status.machine.tools.hotend1 || status.machine.tools.hotend2 || status.machine.tools.heatbed) {
                  machineSend("M105\n");
                }
                // machineSend("M911 J0\n");
              }
            }
          }, 200);
          // Lets see what we have to deal with
          // setTimeout(function() {
          //     machineSend("config-get extruder.hotend.enable\n"); //cached: extruder.hotend.enable is set to true
          // }, 100);
          // setTimeout(function() {
          //     machineSend("config-get extruder.hotend2.enable\n"); //cached: extruder.hotend2.enable is not in config
          // }, 200);
          // setTimeout(function() {
          //     machineSend("config-get temperature_control.bed.enable\n"); //cached: temperature_control.bed.enable is set to true
          // }, 300);
          // setTimeout(function() {
          //     machineSend("config-get laser_module_enable\n"); //cached: laser_module_enable is set to false
          // }, 400);
          // setTimeout(function() {
          //     machineSend("config-get spindle.enable\n"); //cached: spindle.enable is not in config
          // }, 500);
        } // end of machine identification


        // sdcard listing and upload verification
        if (command == "M20") {
          if (data.indexOf("Begin file list") === 0) {
            status.machine.sdcard.list.length = 0;
          } else if (data.indexOf("End file list") === 0) {
            // ignore
          } else if (data.indexOf("ok") === 0) {
            // ignore
          } else if (data.indexOf("Done saving file") != -1) {
            status.comms.sduploading = false;
          } else {
            status.machine.sdcard.list.push(data)
          }
        } else if (re.test(data)) {
          var md5sum = data.split(/[ ,]+/)[0]
          if (lastmd5sum === md5sum) {
            console.log("SD UPLOAD VERIFIED! OK")
            var output = {
              'command': '',
              'response': 'SD UPLOAD COMPLETED, AND MD5 VERIFIED! OK'
            }
            io.sockets.emit('data', output);
          } else {
            // console.log("SD UPLOAD VERIFIED! FAILED:   Original file: " + lastmd5sum +", SD file: " + md5sum )
            // Due to firmware changing the content of the file, sometimes a valid upload still fails.   A pass is definately a pass.  But a fail could just be cosmetic.
          }
        } // end sdcard

        // config identification: generate Array of Config Entries for Smoothie
        if (command == "cat /sd/config" || command == "cat /sd/config.txt") {
          // console.log("CONF: " + data)
          status.machine.firmware.config.push(data)
        }

        if (data.indexOf('\"type\": \"TMC26x\"') != -1) {
          try {
            var object = JSON.parse(data)
          } catch (e) {
            console.log(e); // error in the above string (in this case, yes)!
          }
          if (object) {
            if (object.axis == "X") {
              status.machine.drivers.x = object;
            }
            if (object.axis == "Y") {
              status.machine.drivers.y = object;
            }
            if (object.axis == "Z") {
              status.machine.drivers.z = object;
            }
            if (object.axis == "A") {
              status.machine.drivers.a = object;
            }
          }
        }

        // config identification: trinamic driver status
        if (command.indexOf("M911.1 PX") != -1) {
          if (data.indexOf("Chip type") != -1) {
            status.machine.drivers.x.type = data.split(" ")[4];
          }
          if (data.indexOf("Stall Guard value") === 0) {
            status.machine.drivers.x.stallGuard = data.split(" ")[3];
          }
          if (data.indexOf("Current setting") === 0) {
            status.machine.drivers.x.current = data.split(" ")[2];
          }
          if (data.indexOf("Microsteps") === 0) {
            status.machine.drivers.x.microstep = data.split(" ")[1];
          }
        }

        if (command.indexOf("M911.1 PY") != -1) {
          if (data.indexOf("Chip type") != -1) {
            status.machine.drivers.y.type = data.split(" ")[4];
          }
          if (data.indexOf("Stall Guard value") === 0) {
            status.machine.drivers.y.stallGuard = data.split(" ")[3];
          }
          if (data.indexOf("Current setting") === 0) {
            status.machine.drivers.y.current = data.split(" ")[2];
          }
          if (data.indexOf("Microsteps") === 0) {
            status.machine.drivers.y.microstep = data.split(" ")[1];
          }
        }

        if (command.indexOf("M911.1 PZ") != -1) {
          if (data.indexOf("Chip type") != -1) {
            status.machine.drivers.z.type = data.split(" ")[4];
          }
          if (data.indexOf("Stall Guard value") === 0) {
            status.machine.drivers.z.stallGuard = data.split(" ")[3];
          }
          if (data.indexOf("Current setting") === 0) {
            status.machine.drivers.z.current = data.split(" ")[2];
          }
          if (data.indexOf("Microsteps") === 0) {
            status.machine.drivers.z.microstep = data.split(" ")[1];
          }
        }

        if (command.indexOf("M911.1 PA") != -1) {
          if (data.indexOf("Chip type") != -1) {
            status.machine.drivers.a.type = data.split(" ")[4];
          }
          if (data.indexOf("Stall Guard value") === 0) {
            status.machine.drivers.a.stallGuard = data.split(" ")[3];
          }
          if (data.indexOf("Current setting") === 0) {
            status.machine.drivers.a.current = data.split(" ")[2];
          }
          if (data.indexOf("Microsteps") === 0) {
            status.machine.drivers.a.microstep = data.split(" ")[1];
          }
        }

        // config identification:  Tools availability
        if (data.indexOf("extruder.hotend.enable") != -1) {
          if (data.indexOf("set to true") != -1) {
            console.log("Adding 1st Extruder to Tools table");
            status.machine.tools.hotend1 = true;
            status.comms.blocked = false;
          }
        } else if (data.indexOf("extruder.hotend2.enabl") != -1) {
          if (data.indexOf("set to true") != -1) {
            console.log("Adding 2nd Extruder to Tools table");
            status.machine.tools.hotend2 = true;
            status.comms.blocked = false;
          }
        } else if (data.indexOf("temperature_control.bed.enable") != -1) {
          if (data.indexOf("set to true") != -1) {
            console.log("Adding Heatbed to Tools table");
            status.machine.tools.heatbed = true;
            status.comms.blocked = false;
          }
        } else if (data.indexOf("laser_module_enable") != -1) {
          if (data.indexOf("set to true") != -1) {
            console.log("Adding Laser to Tools table");
            status.machine.tools.laser = true;
            status.comms.blocked = false;
          }
        } else if (data.indexOf("spindle.enable") != -1) {
          if (data.indexOf("set to true") != -1) {
            console.log("Adding Spindle to Tools table");
            status.machine.tools.spindle = true;
            status.comms.blocked = false;
          }
        }

        // Machine Feedback: Temperature and Position
        if (data.indexOf("ok T:") == 0) {
          // Got an Temperature Feedback (Smoothie)
          parseTemp(data)
        } else if (data.indexOf("<") === 0) {
          // Got statusReport (Grbl & Smoothieware)
          // statusfeedback func
          parseFeedback(data)
        } else if (data.indexOf("ok") === 0) { // Got an OK so we are clear to send
          // console.log("OK FOUND")
          if (status.machine.firmware.type === "grbl") {
            grblBufferSize.shift();
          }
          status.comms.blocked = false;
          send1Q();
        } else if (data.indexOf('ALARM') === 0) { //} || data.indexOf('HALTED') === 0) {
          console.log("ALARM:  " + data)
          status.comms.connectionStatus = 5;
          isAlarmed = true;
          switch (status.machine.firmware.type) {
            case 'grbl':
              grblBufferSize.shift();
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
          isAlarmed = false;
        } else if (data.indexOf('Emergency Stop Requested ') != -1) { //} || data.indexOf('HALTED') === 0) {
          status.comms.connectionStatus = 5;
          isAlarmed = true;
        } else if (data.indexOf('wait') === 0) { // Got wait from Repetier -> ignore
          // do nothing
        } else if (data.indexOf('error') === 0) { // Error received -> stay blocked stops queue
          if (data.indexOf('error:Alarm lock') === 0) {
            isAlarmed = true;
          }
          switch (status.machine.firmware.type) {
            case 'grbl':
              grblBufferSize.shift();
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
        } else if (data === ' ') {
          // nothing
        } else {
          // do nothing with +data
        }
      }); // end of parser.on(data)
    }
  });

  socket.on('saveToSd', function(datapack) {
    saveToSd(datapack);
  });


  socket.on('runJob', function(data) {
    console.log('Run Job (' + data.length + ')');
    if (status.comms.connectionStatus > 0) {
      if (data) {
        runningJob = data;
        data = data.split('\n');
        for (var i = 0; i < data.length; i++) {
          var line = data[i].split(';'); // Remove everything after ; = comment
          var tosend = line[0].trim();
          if (tosend.length > 0) {
            addQ(tosend);
          }
        }
        if (i > 0) {
          startTime = new Date(Date.now());
          // Start interval for qCount messages to socket clients
          queueCounter = setInterval(function() {
            status.comms.queue = gcodeQueue.length - queuePointer
          }, 500);
          send1Q();
          status.comms.connectionStatus = 3;
        }

      }
      appIcon.displayBalloon({
        icon: nativeImage.createFromPath(iconPath),
        title: "Driver: Job Started",
        content: "OpenBuilds Machine Driver started a job: Job Size: " + data.length + " lines of GCODE"
      })
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
            addQ(tosend);
          }
        }
        if (i > 0) {
          status.comms.runStatus = 'Running'
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
            addQ('$J=G91' + dir + dist + feed);
            send1Q();
            break;
          case 'smoothie':
            addQ('G91');
            addQ('G0' + feed + dir + dist);
            addQ('G90');
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
            addQ('$J=G91' + mode + xVal + yVal + zVal + feed);
            send1Q();
            break;
          case 'smoothie':
            addQ('G91' + mode);
            addQ('G0' + feed + xVal + yVal + zVal);
            addQ('G90');
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
          addQ('G10 L20 P0 X0');
          break;
        case 'y':
          addQ('G10 L20 P0 Y0');
          break;
        case 'z':
          addQ('G10 L20 P0 Z0');
          break;
        case 'a':
          addQ('G10 L20 P0 A0');
          break;
        case 'all':
          addQ('G10 L20 P0 X0 Y0 Z0');
          break;
        case 'xyza':
          addQ('G10 L20 P0 X0 Y0 Z0 A0');
          break;
      }
      send1Q();
      appIcon.displayBalloon({
        icon: nativeImage.createFromPath(iconPath),
        title: "Driver: Work Coordinate System Reset",
        content: "OpenBuilds Machine Driver has reset the WCS on the " + data + " axes."
      })
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('gotoZero', function(data) {
    console.log('gotoZero(' + data + ')');
    if (status.comms.connectionStatus > 0) {
      switch (data) {
        case 'x':
          addQ('G0 X0');
          break;
        case 'y':
          addQ('G0 Y0');
          break;
        case 'z':
          addQ('G0 Z0');
          break;
        case 'a':
          addQ('G0 A0');
          break;
        case 'all':
          addQ('G0 X0 Y0 Z0');
          break;
        case 'xyza':
          addQ('G0 X0 Y0 Z0 A0');
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
        addQ('G10 L20 P0 ' + xVal + yVal + zVal + aVal);
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
              addQ('G30 Z' + data.probeOffset);
              break;
            default:
              addQ('G38.2 ' + data.direction);
              break;
          }
        case 'grbl':
          addQ('G38.2 ' + data.direction + '-5 F1');
          addQ('G92 ' + data.direction + ' ' + data.probeOffset);
          break;
        default:
          //not supported
          console.log('Command not supported by firmware!');
          break;
      }
      send1Q();
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
            machineSend(String.fromCharCode(144));
          } else if (curfro < reqfro) {
            // FRO Increase
            delta = reqfro - curfro
            console.log("delta = " + delta)
            var tens = Math.floor(delta / 10)

            console.log("need to send " + tens + " x10s increase")
            for (i = 0; i < tens; i++) {
              machineSend(String.fromCharCode(145));
            }

            var ones = delta - (10 * tens);
            console.log("need to send " + ones + " x1s increase")
            for (i = 0; i < ones; i++) {
              machineSend(String.fromCharCode(147));
            }
          } else if (curfro > reqfro) {
            // FRO Decrease
            delta = curfro - reqfro
            console.log("delta = " + delta)

            var tens = Math.floor(delta / 10)
            console.log("need to send " + tens + " x10s decrease")
            for (i = 0; i < tens; i++) {
              machineSend(String.fromCharCode(146));
            }

            var ones = delta - (10 * tens);
            console.log("need to send " + ones + " x1s decrease")
            for (i = 0; i < tens; i++) {
              machineSend(String.fromCharCode(148));
            }
          }

          status.machine.overrides.feedOverride = reqfro // Set now, but will be overriden from feedback from Grbl itself in next queryloop
          // var code;
          // switch (data) {
          //     case 0:
          //         code = 144; // set to 100%
          //         data = '100';
          //         break;
          //     case 10:
          //         code = 145; // +10%
          //         data = '+' + data;
          //         break;
          //     case -10:
          //         code = 146; // -10%
          //         break;
          //     case 1:
          //         code = 147; // +1%
          //         data = '+' + data;
          //         break;
          //     case -1:
          //         code = 148; // -1%
          //         break;
          // }
          // console.log("Code:" + code)
          //     //jumpQ(String.fromCharCode(parseInt(code)));
          // if (code) {
          //     machineSend(String.fromCharCode(parseInt(code)));
          //     console.log('Sent: Code(' + code + ')');
          //     console.log('Feed Override ' + data + '%');
          // }
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
          //jumpQ('M220S' + feedOverride);
          machineSend('M220S' + feedOverride + '\n');
          // console.log('Sent: M220S' + feedOverride);
          status.machine.overrides.feedOverride = feedOverride
          // console.log('Feed Override ' + feedOverride.toString() + '%');
          //send1Q();
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
            machineSend(String.fromCharCode(153));
          } else if (cursro < reqsro) {
            // FRO Increase
            delta = reqsro - cursro
            console.log("delta = " + delta)
            var tens = Math.floor(delta / 10)

            console.log("need to send " + tens + " x10s increase")
            for (i = 0; i < tens; i++) {
              machineSend(String.fromCharCode(154));
            }

            var ones = delta - (10 * tens);
            console.log("need to send " + ones + " x1s increase")
            for (i = 0; i < ones; i++) {
              machineSend(String.fromCharCode(156));
            }
          } else if (cursro > reqsro) {
            // FRO Decrease
            delta = cursro - reqsro
            console.log("delta = " + delta)

            var tens = Math.floor(delta / 10)
            console.log("need to send " + tens + " x10s decrease")
            for (i = 0; i < tens; i++) {
              machineSend(String.fromCharCode(155));
            }

            var ones = delta - (10 * tens);
            console.log("need to send " + ones + " x1s decrease")
            for (i = 0; i < tens; i++) {
              machineSend(String.fromCharCode(157));
            }
          }
          status.machine.overrides.spindleOverride = reqsro // Set now, but will be overriden from feedback from Grbl itself in next queryloop
          // var code;
          // switch (data) {
          //     case 0:
          //         code = 153; // set to 100%
          //         data = '100';
          //         break;
          //     case 10:
          //         code = 154; // +10%
          //         data = '+' + data;
          //         break;
          //     case -10:
          //         code = 155; // -10%
          //         break;
          //     case 1:
          //         code = 156; // +1%
          //         data = '+' + data;
          //         break;
          //     case -1:
          //         code = 157; // -1%
          //         break;
          // }
          // if (code) {
          //     //jumpQ(String.fromCharCode(parseInt(code)));
          //     machineSend(String.fromCharCode(parseInt(code)));
          //     console.log('Sent: Code(' + code + ')');
          //     console.log('Spindle (Laser) Override ' + data + '%');
          // }
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
          //jumpQ('M221S' + spindleOverride);
          machineSend('M221S' + spindleOverride + '\n');
          // console.log('Sent: M221S' + spindleOverride);
          status.machine.overrides.spindleOverride = spindleOverride;
          // console.log('Spindle (Laser) Override ' + spindleOverride.toString() + '%');
          //send1Q();
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
          machineSend('!'); // Send hold command
          console.log('Sent: !');
          if (status.machine.firmware.version === '1.1d') {
            machineSend(String.fromCharCode(0x9E)); // Stop Spindle/Laser
            console.log('Sent: Code(0x9E)');
          }
          break;
        case 'smoothie':
          machineSend('M600'); // Laser will be turned off by smoothie (in default config!)
          //machineSend('M600\n'); // Laser will be turned off by smoothie (in default config!)
          console.log('Sent: M600');
          break;
      }
      status.comms.runStatus = 'Paused';
      status.comms.connectionStatus = 4;
      appIcon.displayBalloon({
        icon: nativeImage.createFromPath(iconPath),
        title: "Driver: Job Paused",
        content: "OpenBuilds Machine Driver paused the job"
      })
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('resume', function() {
    if (status.comms.connectionStatus > 0) {
      console.log('UNPAUSE');
      switch (status.machine.firmware.type) {
        case 'grbl':
          machineSend('~'); // Send resume command
          console.log('Sent: ~');
          break;
        case 'smoothie':
          machineSend('M601'); // Send resume command
          //machineSend('M601\n');
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
      appIcon.displayBalloon({
        icon: nativeImage.createFromPath(iconPath),
        title: "Driver: Job Resumed",
        content: "OpenBuilds Machine Driver resumed the job"
      })
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
          machineSend('!'); // hold
          console.log('Sent: !');
          if (status.machine.firmware.version === '1.1d') {
            machineSend(String.fromCharCode(0x9E)); // Stop Spindle/Laser
            console.log('Sent: Code(0x9E)');
          }
          console.log('Cleaning Queue');
          machineSend(String.fromCharCode(0x18)); // ctrl-x
          console.log('Sent: Code(0x18)');
          break;
        case 'smoothie':
          status.comms.paused = true;
          machineSend('M112'); // ctrl-x
          console.log('Sent: M112');
          break;
      }
      clearInterval(queueCounter);
      status.comms.queue = 0
      queuePointer = 0;
      gcodeQueue.length = 0; // Dump the queue
      grblBufferSize.length = 0; // Dump bufferSizes
      lastGcode.length = 0 // Dump Last Command Queue
      queueLen = 0;
      queuePos = 0;
      laserTestOn = false;
      startTime = null;
      runningJob = null;
      status.comms.blocked = false;
      status.comms.paused = false;
      status.comms.runStatus = 'Stopped';
      status.comms.connectionStatus = 2;
      isAlarmed = false;
      appIcon.displayBalloon({
        icon: nativeImage.createFromPath(iconPath),
        title: "Driver: Job Aborted",
        content: "OpenBuilds Machine Driver was asked to abort the running job."
      })
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
              machineSend('$X\n');
              console.log('Sent: $X');
              break;
            case 'smoothie':
              machineSend('$X\n');
              console.log('Sent: $X');
              break;
          }
          console.log('Resuming Queue Lockout');
          break;
        case 2:
          console.log('Emptying Queue');
          gcodeQueue.length = 0; // Dump the queue
          grblBufferSize.length = 0; // Dump bufferSizes
          lastGcode.length = 0 // Dump Last Command Queue
          queueLen = 0;
          queuePointer = 0;
          queuePos = 0;
          startTime = null;
          console.log('Clearing Lockout');
          switch (status.machine.firmware.type) {
            case 'grbl':
              machineSend('$X\n');
              console.log('Sent: $X');
              status.comms.blocked = false;
              status.comms.paused = false;
              break;
            case 'smoothie':
              machineSend('M999'); //M999
              console.log('Sent: M999');
              send1Q();
              status.comms.blocked = false;
              status.comms.paused = false;
              break;
          }
          break;
      }
      status.comms.runStatus = 'Stopped'
      status.comms.connectionStatus = 2;
      isAlarmed = false;
      appIcon.displayBalloon({
        icon: nativeImage.createFromPath(iconPath),
        title: "Driver: Alarm Cleared",
        content: "OpenBuilds Machine Driver has cleared the Alarm Condition, you may continue"
      })
    } else {
      console.log('ERROR: Machine connection not open!');
    }
  });

  socket.on('resetMachine', function() {
    if (status.comms.connectionStatus > 0) {
      console.log('Reset Machine');
      switch (status.machine.firmware.type) {
        case 'grbl':
          machineSend(String.fromCharCode(0x18)); // ctrl-x
          console.log('Sent: Code(0x18)');
          break;
        case 'smoothie':
          machineSend(String.fromCharCode(0x18)); // ctrl-x
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
    data.push(status.comms.sduploading)
    io.sockets.emit("queueCount", data);
    port.write(gcode);
    lastGcode.push(gcode);
    if (gcode == "cat /sd/config\n" || gcode == "cat /sd/config.txt\n") {
      // console.log("DUMPING CONFIG ARRAY")
      status.machine.firmware.config.length = 0;
    }
    if (gcode.indexOf("M20") != -1) {
      status.machine.sdcard.list.length = 0;
    }
    // console.log("SENT: " + gcode)
  } else {
    console.log("PORT NOT OPEN")
  }
}

function grblBufferSpace() {
  var total = 0;
  var len = grblBufferSize.length;
  for (var i = 0; i < len; i++) {
    total += grblBufferSize[i];
  }
  return GRBL_RX_BUFFER_SIZE - total;
}

function send1Q() {
  var gcode;
  var gcodeLen = 0;
  var spaceLeft = 0;
  if (status.comms.connectionStatus > 0) {
    switch (status.machine.firmware.type) {
      case 'grbl':
        if (new_grbl_buffer) {
          if (grblBufferSize.length === 0) {
            spaceLeft = GRBL_RX_BUFFER_SIZE;
            while ((queueLen - queuePointer) > 0 && spaceLeft > 0 && !status.comms.blocked && !status.comms.paused) {
              gcodeLen = gcodeQueue[queuePointer].length;
              if (gcodeLen < spaceLeft) {
                // Add gcode to send buffer
                gcode = gcodeQueue[queuePointer];
                queuePointer++;
                grblBufferSize.push(gcodeLen + 1);
                gcodeLine += gcode + '\n';
                spaceLeft = GRBL_RX_BUFFER_SIZE - gcodeLine.length;
              } else {
                // Not enough space left in send buffer
                status.comms.blocked = true;
              }
            }
            if (gcodeLine.length > 0) {
              // Send the buffer
              status.comms.blocked = true;
              machineSend(gcodeLine);
              // console.log('Sent: ' + gcodeLine + ' Q: ' + (queueLen - queuePointer));
            }
          }
        } else {
          while ((queueLen - queuePointer) > 0 && !status.comms.blocked && !status.comms.paused) {
            spaceLeft = grblBufferSpace();
            gcodeLen = gcodeQueue[queuePointer].length;
            if (gcodeLen < spaceLeft) {
              gcode = gcodeQueue[queuePointer];
              queuePointer++;
              grblBufferSize.push(gcodeLen + 1);
              machineSend(gcode + '\n');
              // console.log('Sent: ' + gcode + ' Q: ' + (queueLen - queuePointer) + ' Bspace: ' + (spaceLeft - gcodeLen - 1));
            } else {
              status.comms.blocked = true;
            }
          }
        }
        break;
      case 'smoothie':
        if ((gcodeQueue.length - queuePointer) > 0 && !status.comms.blocked && !status.comms.paused) {
          gcode = gcodeQueue[queuePointer];
          queuePointer++;
          status.comms.blocked = true;
          machineSend(gcode + '\n');
          // console.log('Sent: ' + gcode + ' Q: ' + (gcodeQueue.length  - queuePointer));
        }
        break;
    }
    if (queuePointer >= gcodeQueue.length) {
      if (!isAlarmed) {
        status.comms.connectionStatus = 2;
      } else if (isAlarmed) {
        status.comms.connectionStatus = 5;
      }
      clearInterval(queueCounter);
      if (startTime) {
        finishTime = new Date(Date.now());
        elapsedTimeMS = finishTime.getTime() - startTime.getTime();
        elapsedTime = Math.round(elapsedTimeMS / 1000);
        speed = (queuePointer / elapsedTime).toFixed(0);
        console.log("Job started at " + startTime.toString());
        console.log("Job finished at " + finishTime.toString());
        console.log("Elapsed time: " + elapsedTime + " seconds.");
        console.log('Ave. Speed: ' + speed + ' lines/s');
        appIcon.displayBalloon({
          icon: nativeImage.createFromPath(iconPath),
          title: "Driver: Job Completed!",
          content: "OpenBuilds Machine Driver completed a Job in " + elapsedTime + " seconds. We processed " + speed + " gcode lines/second on average."
        })
      }
      gcodeQueue.length = 0; // Dump the Queye
      grblBufferSize.length = 0; // Dump bufferSizes
      queueLen = 0;
      queuePointer = 0;
      queuePos = 0;
      startTime = null;
      runningJob = null;
      // status.comms.runStatus = "Finished"
    }

  }
}

function addQ(gcode) {
  gcodeQueue.push(gcode);
  queueLen = gcodeQueue.length;
}

function parseFeedback(data) {
  // console.log(data)
  var state = data.substring(1, data.search(/(,|\|)/));
  status.comms.runStatus = state
  if (state == "Alarm") {
    // console.log("ALARM:  " + data)
    status.comms.connectionStatus = 5;
    isAlarmed = true;
    switch (status.machine.firmware.type) {
      case 'grbl':
        grblBufferSize.shift();
        var alarmCode = parseInt(data.split(':')[1]);
        // console.log('ALARM: ' + alarmCode + ' - ' + grblStrings.alarms(alarmCode));
        status.comms.alarm = alarmCode + ' - ' + grblStrings.alarms(alarmCode)
        // if (alarmCode == 10) {
        //   io.sockets.emit("toastError", 'alarm: ' + alarmCode + ' - Locked. Please Unlock or Clear Alarm');
        // } else {
        //   io.sockets.emit("toastError", 'alarm: ' + alarmCode + ' - ' + grblStrings.alarms(alarmCode));
        // }
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
  // end statusreport
}

function parseTemp(data) {
  var heaterT0ActualTemp, heaterT0DisplayTemp, heaterT1ActualTemp, heaterT1DisplayTemp, bedActualTemp, bedDisplayTemp;
  // console.log(response);
  for (var r, n = /(B|T(\d*)):\s*([+]?[0-9]*\.?[0-9]+)? (\/)([+]?[0-9]*\.?[0-9]+)?/gi; null !== (r = n.exec(data));) {
    var o = r[1],
      a = r[3] + "°C";
    a += "/" + r[5] + "°C", "T" == o ? (heaterT0ActualTemp = r[3], heaterT0DisplayTemp = r[5]) : "T1" == o && (heaterT1ActualTemp = r[3], heaterT1DisplayTemp = r[5]), "B" == o && (bedActualTemp = Number(r[3]), bedDisplayTemp = r[5]);
  }

  if (heaterT0ActualTemp) {
    status.machine.temperature.setpoint.t0 = parseFloat(heaterT0DisplayTemp);
    status.machine.temperature.actual.t0 = parseFloat(heaterT0ActualTemp);
  }

  if (heaterT1ActualTemp) {
    status.machine.temperature.setpoint.t1 = parseFloat(heaterT1DisplayTemp);
    status.machine.temperature.actual.t1 = parseFloat(heaterT1ActualTemp);
  }

  if (bedActualTemp) {
    status.machine.temperature.setpoint.b = parseFloat(bedDisplayTemp);
    status.machine.temperature.actual.b = parseFloat(bedActualTemp);
  }
}

function saveToSd(datapack) {
  var filename = datapack[0]
  var data = datapack[1]
  status.comms.sduploading = true
  console.log('Saving Job (' + data.length + ' bytes) to SD as ' + filename);
  switch (status.machine.firmware.type) {
    case 'grbl':
      console.log('SD not supported by Grbl');
      break;
    case 'smoothie':
      if (status.comms.connectionStatus > 0) {
        if (data) {
          data = data.split('\n');
          var string = "";
          addQ('M28 ' + filename);
          for (var i = 0; i < data.length; i++) {
            var line = data[i].split(';'); // Remove everything after ; = comment
            var tosend = line[0].trim();
            if (tosend.length > 0) {
              addQ(tosend);
              string += tosend + "\n"
            }
          }
          addQ('M29');
          addQ('md5sum /sd/' + filename);
          addQ('M20');
          send1Q();
          lastmd5sum = md5(string);
          // console.log(string)
        }
      } else {
        console.log('ERROR: Machine connection not open!');
      }
      break;
  }
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
              addQ('G1F1');
              addQ('M3S' + parseInt(power * maxS / 100));
              laserTestOn = true;
              io.sockets.emit('laserTest', power);
              if (duration > 0) {
                addQ('G4 P' + duration / 1000);
                addQ('M5S0');
                laserTestOn = false;
              }
              send1Q();
              break;
            case 'smoothie':
              addQ('M3\n');
              addQ('fire ' + power + '\n');
              laserTestOn = true;
              io.sockets.emit('laserTest', power);
              if (duration > 0) {
                var divider = 1;
                if (fDate >= new Date('2017-01-02')) {
                  divider = 1000;
                }
                addQ('G4P' + duration / divider + '\n');
                addQ('fire off\n');
                addQ('M5');
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
            addQ('M5S0');
            send1Q();
            break;
          case 'smoothie':
            addQ('fire off\n');
            addQ('M5\n');
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

function isElectron() {
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }
  if (typeof process !== 'undefined' && process.versions && !!process.versions.electron) {
    return true;
  }
  return false;
}

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
    // createWindow();
    // createJogWindow();
  }

  function createTrayIcon() {
    appIcon = new Tray(
      nativeImage.createFromPath(iconPath)
    )
    const contextMenu = Menu.buildFromTemplate([
      // {
      //   label: 'Launch Full Application',
      //   click() {
      //     createWindow();
      //   }
      // },
      {
        label: 'Quit Machine Driver',
        click() {
          appIcon.destroy();
          electronApp.exit(0);
        }
      }
    ])
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
  }

  function createJogWindow() {
    // Create the browser window.
    jogWindow = new BrowserWindow({
      width: 660,
      height: 710,
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

    jogWindow.on('minimize', function(event) {
      event.preventDefault();
      jogWindow.hide();
    });

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

    mainWindow.on('minimize', function(event) {
      event.preventDefault();
      mainWindow.hide();
    });

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

  electronApp.commandLine.appendSwitch("--ignore-gpu-blacklist");

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  electronApp.on('ready', createApp);

  // Quit when all windows are closed.
  electronApp.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      electronApp.quit();
      appIcon.destroy();
    }
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

process.on('uncaughtException', function(error) {
  // console.log("Uncaught Error " + error)
});