// grblSender.js handles communication with the grbl controller, as well as core functions like running, pausing, stopping

"use strict";

// System dependencies
const _ = require('lodash');
const multer = require('multer');

const {
  ReadlineParser
} = require('@serialport/parser-readline')


// App dependencies
const grblStrings = require("./grblStrings.js");

const {
  debug_log,
  status,
  config,
  persistentConfig,
  savePersistentConfig,
} = require('./core.js');

const {
  jogWindowProgress
} = require('./jogWindowAPI.js');

const {
  app,
  serverEmit,
  serverEmitOutput,
  addConnectionHandler,
  addDocReadyHandler,
} = require('./server.js');

const {
  closePort,
  addPortOpenHandler,
  addPortCloseHandler,
} = require('./grblPort.js');


// Globals variables
var port;
var connectionCancelToken;

// Status parsing
var oldPinsList;
var grblStatusLoop;

// Queue
var gcodeQueue = [];
var queuePointer = 0;
var queueCounterLoop;
const sentBuffer = [];

// Job info
var jobStartTime = false;
var jobIsJob = false;
var jobStatusInternal = 0; // 0 - no job, 1 - running, 2 - jog job running, 3 - wait for idle, 4 - jog job waiting for idle
var jobCompletedMsg = ""; // message sent when job is done
var currentGcode = ""; // the gcode for the current job

const GRBL_RX_BUFFER_SIZE = 127;
const GRBLHAL_RX_BUFFER_SIZE = 1023;

// FluidNC test
var fluidncConfig = "";
// FluidNC end test

const memoryStorage = multer.memoryStorage();

// Parses Grbl status report: <Idle|MPos:0.000,0.000,0.000,0.000|Bf:100,1022|FS:0,0|Pn:XYZP|WCO:10.000,10.000,0.000,-10.000>
function parseStatusReport(data) {
  var state = data.substring(1, data.search(/(,|\|)/));
  status.comms.runStatus = state
  if (state == "Idle") {
    if (jobStatusInternal >= 3 && (new Date().getTime()) > jobStartTime + 100) {
      finalizeJob(true); // Idle after at least 100ms after the "ok" for the last line, declare the job as done
    }
  } else if (state == "Alarm" && status.comms.connectionStatus >= 2) {
    // debug_log("ALARM:  " + data)
    status.comms.connectionStatus = 5;
  } else if (state == "Hold:0") {
    pause();
  }

  // Extract work offset (for Grbl > 1.1 only!)
  const startWCO = data.search(/wco:/i) + 4;
  if (startWCO > 4) {
    const wcoLen = data.substr(startWCO).search(/>|\|/);
    const wcoArray = data.substr(startWCO, wcoLen).split(',', 4).map(parseFloat);

    const xOffset = wcoArray[0];
    const yOffset = wcoArray[1];
    const zOffset = wcoArray[2];
    const aOffset = wcoArray.length > 3 ? wcoArray[3] : 0;

    status.machine.position.offset.x = parseFloat(xOffset.toFixed(config.posDecimals));
    status.machine.position.offset.y = parseFloat(yOffset.toFixed(config.posDecimals));
    status.machine.position.offset.z = parseFloat(zOffset.toFixed(config.posDecimals));
    status.machine.position.offset.a = parseFloat(aOffset.toFixed(config.posDecimals));
  }

  // Extract wPos/mPos (for Grbl > 1.1 only!)
  const startWPos = data.search(/wpos:/i) + 5;
  const startMPos = data.search(/mpos:/i) + 5;
  const isMPos = startMPos > 5;
  const startPos = isMPos ? startMPos : startWPos;

  if (startPos > 5) {
    const posLen = data.substr(startPos).search(/>|\|/);
    const posArray = data.substr(startPos, posLen).split(',', 4).map(parseFloat);

    status.machine.has4thAxis = posArray.length > 3;

    var xPos = posArray[0];
    var yPos = posArray[1];
    var zPos = posArray[2];
    var aPos = status.machine.has4thAxis ? posArray[3] : 0;

    if (isMPos) {
      //If the status includes machine coordinates, subtract the offset to convert to work space
      xPos -= status.machine.position.offset.x;
      yPos -= status.machine.position.offset.y;
      zPos -= status.machine.position.offset.z;
      aPos -= status.machine.position.offset.a;
    }

    status.machine.position.work.x = parseFloat(xPos.toFixed(config.posDecimals));
    status.machine.position.work.y = parseFloat(yPos.toFixed(config.posDecimals));
    status.machine.position.work.z = parseFloat(zPos.toFixed(config.posDecimals));
    status.machine.position.work.a = parseFloat(aPos.toFixed(config.posDecimals));
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
    if (!_.isEqual(pins, oldPinsList)) {
      if (pins.includes('H') && !pins.includes('D')) {
        // pause
        pause();
        serverEmitOutput({
          command: '[external from hardware]',
          response: "Groove Control received a FEEDHOLD notification from Grbl: This could be due to someone pressing the HOLD button (if connected)",
          type: 'info'
        });
      } // end if HOLD

      if (pins.includes('D')) {
        // pause
        pause();
      }

      if (pins.includes('R')) {
        // abort
        stop(true);
        serverEmitOutput({
          command: '[external from hardware]',
          response: "Groove Control received a RESET/ABORT notification from Grbl: This could be due to someone pressing the RESET/ABORT button (if connected)",
          type: 'info'
        });
      } // end if ABORT

      if (pins.includes('S')) {
        // abort
        unpause();
        serverEmitOutput({
          command: '[external from hardware]',
          response: "Groove Control received a CYCLESTART/RESUME notification from Grbl: This could be due to someone pressing the CYCLESTART/RESUME button (if connected)",
          type: 'info'
        });
      } // end if RESUME/START
    }
  } else {
    status.machine.inputs = [];
  }
  oldPinsList = pins;
  // Extract Buffer Data
  var startBuf = data.search(/Bf:/i) + 3;
  if (startBuf > 3) {
    var buffer = data.replace(">", "").replace("\r", "").substr(startBuf).split(/,|\|/, 2);
    // debug_log("BUF: " + JSON.stringify(buffer, null, 2));
    status.machine.firmware.buffer = buffer;
  } else {
    status.machine.firmware.buffer = [];
  }
}

const coordinateSysCommands = ["G54", "G55", "G56", "G57", "G58", "G59"];
const planeCommands = ["G17", "G18", "G19"];
const distanceModeCommands = ["G90", "G91"];
const feedrateModeCommands = ["G93", "G94"];
const unitModeCommands = ["G20", "G21"];
const tloModeCommands = ["G49", "G43.1"];
const spindleStateCommands = ["M3", "M4", "M5"];
const coolantStateCommands = ["M7", "M8", "M9"];

// Parses the Grbl modal status: [GC:G0 G54 G17 G21 G90 G94 M5 M9 T0 F0 S0]
function parseModals(data) {
  // as per https://github.com/gnea/grbl/wiki/Grbl-v1.1-Commands#g---view-gcode-parser-state
  // The shown g-code are the current modal states of Grbl's g-code parser.
  // This may not correlate to what is executing since there are usually
  // several motions queued in the planner buffer.

  data = data.split(/:|\[|\]/)[2].split(" ")

  for (var i = 0; i < data.length; i++) {

    if (coordinateSysCommands.includes(data[i])) {
      status.machine.modals.coordinatesys = data[i]; // handle G54, G55, G56, G57, G58, G59
    }

    if (planeCommands.includes(data[i])) {
      status.machine.modals.plane = data[i]; // handle G17, G18, G19
    }

    if (distanceModeCommands.includes(data[i])) {
      status.machine.modals.distancemode = data[i]; // handle G90, G91
    }

    if (data[i] == "G91.1") {
      status.machine.modals.arcdistmode = data[i];
    }

    if (feedrateModeCommands.includes(data[i])) {
      status.machine.modals.feedratemode = data[i]; // handle G93, G94
    }

    if (unitModeCommands.includes(data[i])) {
      status.machine.modals.unitsmode = data[i]; // handle G20, G21
    }

    //   status.machine.modals.radiuscomp = "G40"; // G40
    if (data[i] == "G40") {
      status.machine.modals.radiuscomp = data[i];
    }

    if (tloModeCommands.includes(data[i])) {
      status.machine.modals.tlomode = data[i]; // handle G49, G43.1
    }

    if (spindleStateCommands.includes(data[i])) {
      status.machine.modals.spindlestate = data[i]; // handle M3, M4, M5
    }

    if (coolantStateCommands.includes(data[i])) {
      status.machine.modals.coolantstate = data[i]; // handle M7, M8, M9
    }
  }
}

// Parses the version string: [VER:1.1f.20260908:minimill]
function parseVersion(data) {
  const parts = data.split(/:|\]/);
  // Extracting the full version (1.1f)
  const versionParts = parts[1].split('.');
  const version = versionParts[0] + '.' + versionParts[1];
  // Extracting the date (.20260908)
  const date = versionParts[2];

  status.machine.firmware.version = version;
  status.machine.firmware.date = date;
  status.machine.name = parts[2].toLowerCase();
}

// Parses the options: [OPT:VNMGZH,35,255,58]
function parseOptions(data) {
  const grblOpts = data.substr(5).split(/,|\]/);
  const featuresStr = grblOpts[0];
  status.machine.firmware.blockBufferSize = grblOpts[1];
  status.machine.firmware.rxBufferSize = grblOpts[2];

  var features = [];

  for (var i = 0; i < featuresStr.length; i++) {
    features.push(featuresStr[i]);
    switch (featuresStr[i]) {
      case 'Q':
        debug_log('SPINDLE_IS_SERVO Enabled')
        //
        break;
      case 'V': // Variable spindle enabled
        debug_log('Variable spindle enabled')
        //
        break;
      case 'N': // Line numbers enabled
        debug_log('Line numbers enabled')
        //
        break;
      case 'M': // Mist coolant enabled
        debug_log('Mist coolant enabled')
        //
        break;
      case 'C': // CoreXY enabled
        debug_log('CoreXY enabled')
        //
        break;
      case 'P': // Parking motion enabled
        debug_log('Parking motion enabled')
        //
        break;
      case 'Z': // Homing force origin enabled
        debug_log('Homing force origin enabled')
        //
        break;
      case 'H': // Homing single axis enabled
        debug_log('Homing single axis enabled')
        //
        break;
      case 'T': // Two limit switches on axis enabled
        debug_log('Two limit switches on axis enabled')
        //
        break;
      case 'A': // Allow feed rate overrides in probe cycles
        debug_log('Allow feed rate overrides in probe cycles')
        //
        break;
      case '$': // Restore EEPROM $ settings disabled
        debug_log('Restore EEPROM $ settings disabled')
        //
        break;
      case '#': // Restore EEPROM parameter data disabled
        debug_log('Restore EEPROM parameter data disabled')
        //
        break;
      case 'I': // Build info write user string disabled
        debug_log('Build info write user string disabled')
        //
        break;
      case 'E': // Force sync upon EEPROM write disabled
        debug_log('Force sync upon EEPROM write disabled')
        //
        break;
      case 'W': // Force sync upon work coordinate offset change disabled
        debug_log('Force sync upon work coordinate offset change disabled')
        //
        break;
      case 'L': // Homing init lock sets Grbl into an alarm state upon power up
        debug_log('Homing init lock sets Grbl into an alarm state upon power up')
        //
        break;
    }
  }
  status.machine.firmware.features = features;
}

// Handle probe output and reporting: [PRB:0.000,0.000,0.000:0]
function handleProbe(data, report) {
  debug_log(data);
  var prbData = data.substr(5).split(/,|\]/);
  var success = data.split(':')[2].split(']')[0];
  status.machine.probe.x = prbData[0];
  status.machine.probe.y = prbData[1];
  status.machine.probe.z = prbData[2].split(':')[0];
  status.machine.probe.state = success;
  if (report) {
    if (success > 0) {
      serverEmitOutput({
        command: '[ PROBE ]',
        response: "Probe Completed.",
        type: 'success'
      });
    } else {
      serverEmitOutput({
        command: '[ PROBE ]',
        response: "Probe move ERROR - probe did not make contact within specified distance",
        type: 'error'
      });
    }
  }

  serverEmit('prbResult', status.machine.probe);
}

function handleGreeting(data, command) {
  debug_log(data)
  // Machine Identification
  if (status.comms.connectionStatus == 1) {
    if (data.startsWith("GrblHAL")) {
      status.machine.firmware.type = "grbl";
      status.machine.firmware.platform = "grblHAL";
      status.machine.firmware.version = data.substr(8, 4); // get version
    }
    else if (data.startsWith("[FIRMWARE:grblHAL]")) {
      status.machine.firmware.type = "grbl";
      status.machine.firmware.platform = "grblHAL";
      // Parse version from seperate [VER:...] line not here for this response
    }
    else if (data.indexOf("FluidNC") != -1) { // Grbl 3.6 [FluidNC v3.6.5 (wifi) '$' for help]
      status.machine.firmware.type = "grbl";
      status.machine.firmware.platform = "FluidNC";
      status.machine.firmware.version = data.substr(19, 5); // get version
    }
    else {
      status.machine.firmware.type = "grbl";
      status.machine.firmware.platform = "gnea";
      status.machine.firmware.version = data.substr(5, 4); // get version
    }
    if (parseFloat(status.machine.firmware.version) < 1.1) { // If version is too old
      if (status.machine.firmware.version.length < 3) {
        debug_log('invalid version string, stay connected')
      } else {
        if (status.comms.connectionStatus > 0) {
          debug_log('WARN: Closing Port ' + port.path + " /  v" + parseFloat(status.machine.firmware.version));
          // closePort();
        } else {
          debug_log('ERROR: Machine connection not open!');
        }
        serverEmitOutput({
          command: command,
          response: "Detected an unsupported version: Grbl " + status.machine.firmware.version + ". This is sadly outdated. Please upgrade to Grbl 1.1 or newer to use this software.  Go to http://github.com/gnea/grbl",
          type: 'error'
        });
      }
    }

    onGrblDetected();
  }
  // end of machine identification

  // handle Grbl reset
  sentBuffer.length = 0; // Dump the queue
  status.comms.blocked = false;
  status.comms.paused = false;
  clearGcodeQueue(false);

  // after reset, immediately ask for modals
  gcodeQueue.splice(queuePointer, 0, "$G");
  if (status.machine.firmware.platform == "FluidNC") {
    // for FluidNC, set the report interval to 200ms
    gcodeQueue.splice(queuePointer, 0, "$RI=200");
  }
  send1Q();
}

function handleOK(data, command) {
  serverEmit('ok', command);
  sentBuffer.shift();
  if (command == "$CD") {
    serverEmit('fluidncConfig', fluidncConfig);
  }
  status.comms.blocked = false;
  serverEmit("queueCount", [gcodeQueue.length + sentBuffer.length - queuePointer, gcodeQueue.length]);
  if (queuePointer < gcodeQueue.length) {
    send1Q();
  }
  else if (sentBuffer.length == 0) {
    clearGcodeQueue(true);
    if (jobStatusInternal == 1 || jobStatusInternal == 2) {
      jobStatusInternal += 2; // last command was accepted, just wait for idle
    }
  }
}

function handleAlarm(data, command) {
  debug_log("ALARM:  " + data)

  const alarmCode = parseInt(data.split(':')[1]);
  const alarmMessage = alarmCode + ' - ' + grblStrings.alarms(alarmCode);

  // certain alarm codes are safe and will not reset the home state
  const safeAlarmCodes = [0, 2, 4, 5, 12];
  if (!safeAlarmCodes.includes(alarmCode)) {
    status.machine.modals.homedRecently = false;
  }

  debug_log('ALARM: ' + alarmMessage);
  status.comms.alarm = alarmMessage;
  if (alarmCode != 5) {
    serverEmit("toastErrorAlarm", 'ALARM: ' + alarmMessage + " [ " + command + " ]")
  }
  serverEmitOutput({
    command: '',
    response: 'ALARM: ' + alarmMessage + " [ " + command + " ]",
    type: 'error'
  });

  clearGcodeQueue(false);
  status.comms.connectionStatus = 5;
}

function handleError(data, command) {
  var errorCode = parseInt(data.split(':')[1]);

  var lastAlarm = "";
  if (errorCode == 9 && status.comms.connectionStatus == 5 && status.comms.alarm.length > 0) {
    lastAlarm = "<hr>This error may just be a symptom of an earlier event:<br> ALARM: " + status.comms.alarm
  }
  debug_log('error: ' + errorCode + ' - ' + grblStrings.errors(errorCode) + " [ " + command + " ]");
  serverEmitOutput({
    command: '',
    response: 'error: ' + errorCode + ' - ' + grblStrings.errors(errorCode) + " [ " + command + " ]" + lastAlarm,
    type: 'error'
  });
  serverEmit("toastError", 'error: ' + errorCode + ' - ' + grblStrings.errors(errorCode) + " [ " + command + " ]" + lastAlarm)

  debug_log("error;")
  clearGcodeQueue(false);
  status.comms.connectionStatus = 5;
}

function onParserData(data) {
  var command = sentBuffer[0];
  if (data.startsWith("<")) {
    parseStatusReport(data);
    if (command == "?") {
      serverEmitOutput({
        command: command,
        response: data,
        type: 'info'
      });
    }
  }
  else if (data.startsWith("[VER:")) {
    parseVersion(data);
    serverEmit("status", status);
  }
  else if (data.startsWith("[OPT:")) {
    parseOptions(data);
    serverEmit("features", status.machine.firmware.features);
  }
  else if (data.startsWith("[GC:")) {
    parseModals(data);
  }
  else if (data.startsWith("[PRB:")) {
    handleProbe(data, command != "$#" && command != undefined);
  }
  else if (data.startsWith("Grbl") || data.startsWith("[FIRMWARE:grblHAL]")) { // Check if it's Grbl
    handleGreeting(data, command);
  }
  else if (data.startsWith("ok")) {
    handleOK(data, command); // Got an OK so we are clear to send
  }
  else if (data.startsWith('ALARM') && status.comms.connectionStatus >= 2) {
    handleAlarm(data, command);
  }
  else if (data.startsWith('error') && status.comms.connectionStatus >= 2) {
    handleError(data, command); // Error received -> stay blocked stops queue
  }
  else if (data.startsWith("$32=")) {
    // detect laser mode to know if the spindle delay should be used
    status.misc.laserMode = (parseInt(data.substr(4)) == 1);
  }
  else if (data.startsWith("[MSG:Reset to continue]")) {
    clearGcodeQueue(false);
    debug_log("[MSG:Reset to continue] -> Sending Reset")
    addQRealtime(String.fromCharCode(0x18)); // ctrl-x
  }
  else if (data.indexOf('WARNING: After HALT you should HOME as position is currently unknown') != -1 && status.comms.connectionStatus >= 2) {
    clearGcodeQueue(false);
    status.comms.connectionStatus = 2;
  }
  else if (data.indexOf('Emergency Stop Requested') != -1 && status.comms.connectionStatus >= 2) {
    debug_log("Emergency Stop Requested")
    clearGcodeQueue(false);
    status.comms.connectionStatus = 5;
  }
  else if (command == "$CD" && data != "ok") {
    fluidncConfig += data + "\n";
  }

  if (command) {
    command = command.replace(/(\r\n|\n|\r)/gm, "");

    if (command != "?" && data.length > 0 && data.indexOf('<') == -1) {
      serverEmitOutput({
        command: command,
        response: data,
        type: 'info'
      });
    }
  } else {
    if (data.indexOf("<") != 0) {
      serverEmitOutput({
        command: "",
        response: data,
        type: 'info'
      });
    }
  }
}

function onGrblDetected() {
  if (connectionCancelToken) {
    connectionCancelToken.abort = true;
  }
  debug_log("GRBL detected");
  setTimeout(function() {
    serverEmit('grbl', status.machine.firmware);
  }, 100)
  // Start interval for status queries
  clearInterval(grblStatusLoop);
  if (status.machine.firmware.platform != "FluidNC") { // FluidNC uses a different method to get status
    grblStatusLoop = setInterval(function() {
      if (status.comms.connectionStatus > 0) {
        addQRealtime("?");
      }
    }, 200);
  }
  status.comms.connectionStatus = 2;
  status.machine.modals.homedRecently = false;

  serverEmitOutput({
    command: 'connect',
    response: "Firmware Detected:  " + status.machine.firmware.platform + " version " + status.machine.firmware.version + " dated " + status.machine.firmware.date + " on " + status.comms.interfaces.activePort,
    type: 'success'
  });
}

// Helper promise that creates a cancelable delay
function connectionDelay(ms, cancelToken) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      (cancelToken.abort ? reject : resolve)();
    }, ms);
  });
}

// Initiates handshake with the controller
async function connectController(data) {
  // set status
  status.comms.connectionStatus = 1;
  if (data.type == "usb") {
    status.comms.interfaces.activePort = port.path;
    status.comms.interfaces.type = data.type
    status.comms.interfaces.activeBaud = port.baudRate;
  } else if (data.type == "telnet") {
    status.comms.interfaces.activePort = data.ip;
    status.comms.interfaces.type = data.type
    status.comms.interfaces.activeBaud = "net";
  }

  debug_log("PORT INFO: Connected to " + port.path + " at " + port.baudRate);
  serverEmitOutput({
    command: 'connect',
    response: "PORT INFO: Port is now open: " + port.path + " - Attempting to detect Controller...",
    type: 'info'
  });

  serverEmitOutput({
    command: 'connect',
    response: "Attempting to detect Controller (1): (Ctrl+X)",
    type: 'info'
  });

  if (connectionCancelToken) {
    connectionCancelToken.abort = true; // cancel any previous connection
  }

  try {
    connectionCancelToken = {abort: false};

    // First attempt - send Ctrl+X and wait for response
    addQRealtime(String.fromCharCode(0x18));
    debug_log("Sent: Ctrl+X");

    await connectionDelay(persistentConfig.grblWaitResponse * 1000, connectionCancelToken);

    if (data.type == "usb") {
      // Second attempt - toggle DTR to trigger a reset
      debug_log("Didn't detect firmware after Ctrl+X. Lets try toggling DTR");
      serverEmitOutput({
        command: 'connect',
        response: "Attempting to detect Controller (2): (DTR Enable)",
        type: 'info'
      });
      port.set({dtr: true});

      // Wait for the bootloader to give up on connecting with the programmer and start the main code. Ideally this should send a greeting automatically
      await connectionDelay(persistentConfig.grblWaitReboot * 1000, connectionCancelToken);

      // If no greeting was received, send one more Ctrl+X and wait for response
      addQRealtime(String.fromCharCode(0x18));
      debug_log("Sent: Ctrl+X");

      await connectionDelay(persistentConfig.grblWaitResponse * 1000, connectionCancelToken);
    }

    // Finally give up and close the port
    debug_log("No supported firmware detected. Closing port " + port.path);
    serverEmitOutput({
      command: 'connect',
      response: `ERROR!:  No Response from Controller - See https://github.com/OpenBuilds/docs-migrated/wiki for troubleshooting information. Closing port ` + port.path,
      type: 'error'
    });
    closePort();
  }
  // eslint-disable-next-line no-unused-vars, no-empty
  catch (ex) {}
}

function machineSendRealtime(gcode) {
  debug_log("SENDING: " + gcode)
  if (port.isOpen) {
    // realtime commands doesn't count toward the queue, does not generate OK
    port.write(gcode);
  } else {
    debug_log("PORT NOT OPEN")
  }
}

function machineSend(gcode) {
  debug_log("SENDING: " + gcode)
  if (port.isOpen) {
    if (gcode.match(/T([\d.]+)/i)) {
      var tool = parseFloat(RegExp.$1);
      status.machine.tool.nexttool.number = tool
      status.machine.tool.nexttool.line = gcode
    }
    port.write(gcode);
    debug_log("SENT: " + gcode)
  } else {
    debug_log("PORT NOT OPEN")
  }
}

// Splits the data into lines and adds them to the queue
// Removes comments
function addLinesToQueue(data, isJob) {
  var empty = true;
  data = data.split('\n');
  for (var i = 0; i < data.length; i++) {

    var line = data[i].replace("%", "").split(';')[0]; // Remove everything after ; = comment

    // remove () comments
    var commentStart = line.indexOf('(');
    while (commentStart >= 0) {
      const commentEnd = line.indexOf(')', commentStart);
      if (commentEnd < 0) {
        line = line.slice(0, commentStart);
        break;
      }
      line = line.slice(0, commentStart) + line.slice(commentEnd + 1);
      commentStart = line.indexOf('(');
    }

    var tosend = line.trim();
    if (tosend.length > 0) {
      if (addQToEnd(tosend) && isJob && status.misc.spindleDelay > 0 && !status.misc.laserMode) {
        if (tosend.indexOf("M3") >= 0 || tosend.indexOf("M4") >= 0 || tosend.indexOf("M03") >= 0 || tosend.indexOf("M04") >= 0) {
          addQToEnd("G4 P" + parseInt(status.misc.spindleDelay) + ".");
        }
      }
      empty = false;
    }
  }

  return !empty;
}

function runJob(object) {
  jobStartTime = false;
  var data = object.data;

  jobIsJob = object.isJob;
  jobStartTime = new Date().getTime();
  if (object.isJob) {
    setCurrentGcode(data);
  }

  if (object.completedMsg) {
    jobCompletedMsg = object.completedMsg
  }

  if (status.comms.connectionStatus == 0) {
    debug_log('ERROR: Machine connection not open!');
    return;
  }

  if (data && addLinesToQueue(data, true)) {
    // Start interval for qCount messages to socket clients
    queueCounterLoop = setInterval(function() {
      status.comms.queue = gcodeQueue.length - queuePointer + sentBuffer.length;
      jogWindowProgress(queuePointer / gcodeQueue.length);
    }, 500);
    jobStatusInternal = 1;
    status.misc.jobStatus = 1;
    send1Q(); // send first line
    status.comms.connectionStatus = 3;
  }
}

function runCommand(data) {
  debug_log('Run Command (' + data.replace('\n', '|') + ')');
  if (status.comms.connectionStatus > 0) {
    if (data) {
      addLinesToQueue(data, false);
      status.comms.runStatus = 'Running'
      send1Q();
    }
  } else {
    debug_log('ERROR: Machine connection not open!');
  }
}

function calcBufferSpace() {
  const len = sentBuffer.length;
  var total = len; // account for the \n at the end
  for (var i = 0; i < len; i++) {
    total += sentBuffer[i].length;
  }
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

function send1Q() {
  if (status.comms.connectionStatus > 0) {
    if (queuePointer == 0) {
      serverEmit("queueCount", [gcodeQueue.length, gcodeQueue.length]);
    }
    while ((gcodeQueue.length - queuePointer) > 0 && !status.comms.blocked && !status.comms.paused) {
      const spaceLeft = calcBufferSpace();

      // Do we have enough space in the buffer?
      if (gcodeQueue[queuePointer].length < spaceLeft) {
        const gcode = gcodeQueue[queuePointer];
        if (jobStatusInternal == 1 && gcode.startsWith("$J")) {
          jobStatusInternal = 2;
          status.misc.jobStatus = 2;
        }
        queuePointer++;
        sentBuffer.push(gcode);
        machineSend(gcode + '\n');
      } else {
        status.comms.blocked = true;
      }

      if (config.singleCommandMode) break; // set singleCommandMode to false to push as many commands as fit in the buffer
    }
  } else {
    debug_log('Not Connected')
  }
}

// Clears the queue and generates a queueComplete event
function clearGcodeQueue(success) {
  if (gcodeQueue.length > 0) {
    var data = {
      failed: !success,
    }
    serverEmit('queueComplete', data);
    const queueLeft = gcodeQueue.length - queuePointer + sentBuffer.length;
    const queueTotal = gcodeQueue.length;
    serverEmit("queueCount", [queueLeft, queueTotal]);
  }

  clearInterval(queueCounterLoop);
  jogWindowProgress(0);

  status.comms.queue = 0;
  gcodeQueue.length = 0; // Dump the Queue
  queuePointer = 0;

  if (!success) {
    finalizeJob(false); // on failure, also finalize the job right now
  } else if (jobStatusInternal == 0 && status.comms.connectionStatus >= 2) {
    status.comms.connectionStatus = 2; // finished non-job queue
  }
}

// If a job is currently in progress, sends the jobComplete message
function finalizeJob(success) {
  if (jobStatusInternal > 0) {
    var data = {
      completed: true, // always true, kept for backwards compatibility
      failed: !success,
      jobCompletedMsg: jobCompletedMsg,
      jobStartTime: jobIsJob ? jobStartTime : false,
      jobEndTime: new Date().getTime()
    }
    serverEmit('jobComplete', data);
    jobCompletedMsg = "";
    jobStartTime = false;
    jobStatusInternal = 0;
    status.misc.jobStatus = 0;
    status.comms.connectionStatus = 2;
  }
}

const modalCommands = ['G54', 'G55', 'G56', 'G57', 'G58', 'G59', 'G17', 'G18', 'G19', 'G90', 'G91', 'G91.1', 'G93', 'G94', 'G20', 'G21', 'G40', 'G43.1', 'G49', 'M0', 'M1', 'M2', 'M30', 'M3', 'M03', 'M4', 'M04', 'M5', 'M7', 'M8', 'M9'];
const modalCommandsRegExp = new RegExp(modalCommands.join("|"));

// Returns true if a modal command was found
function addQToEnd(gcode) {
  gcodeQueue.push(gcode);

  var testGcode = gcode.toUpperCase();
  if (testGcode.indexOf("$H") != -1) {
    status.machine.modals.homedRecently = true;
  }
  else if (testGcode == "$CD") {
    fluidncConfig = ""; // empty string
  }
  else if (!testGcode.startsWith("$J=") && modalCommandsRegExp.test(testGcode)) {
    gcodeQueue.push("$G");
    return true;
  }
  else if (testGcode.match(/T([\d.]+)/i)) {
    gcodeQueue.push("$G");
    return true;
  }
  return false;
}

// Adds a line to the queue and kicks the sender if currently idle
function addQToEndAndKick(gcode) {
  addQToEnd(gcode);
  if (sentBuffer.length == 0) {
    send1Q(); // nothing in the pending buffer, start the queue
  }
}

function addQRealtime(gcode) {
  // realtime command skip the queue as it doesnt respond with an ok
  // doesn't count towards the RX buffer limit
  machineSendRealtime(gcode);
}

function stop(data) {
  if (status.comms.connectionStatus > 0) {
    status.comms.paused = true;
    debug_log('STOP');

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

    status.comms.runStatus = 'Stopped';
    status.comms.alarm = "";
    sentBuffer.length = 0; // Dump the queue
    status.comms.blocked = false;
    status.comms.paused = false;
    clearGcodeQueue(false);
  } else {
    debug_log('ERROR: Machine connection not open!');
  }
}

function pause() {
  if (status.comms.connectionStatus == 3) {
    status.comms.paused = true;
    debug_log('PAUSE');
    addQRealtime('!'); // Send hold command
    debug_log('Sent: !');
    if (status.machine.firmware.version === '1.1d') {
      addQRealtime(String.fromCharCode(0x9E)); // Stop Spindle/Laser
      debug_log('Sent: Code(0x9E)');
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
    addQRealtime('~'); // Send resume command
    debug_log('Sent: ~');
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

function clearAlarm(data) {
  if (status.comms.connectionStatus > 0) {
    data = parseInt(data);
    debug_log('Clearing Queue: Method ' + data);
    switch (data) {
      case 1:
        debug_log('Clearing Lockout');
        addQRealtime('$X\n');
        debug_log('Resuming Queue Lockout');
        serverEmitOutput({
          command: '[clear alarm]',
          response: "Operator clicked Clear Alarm: Cleared Lockout",
          type: 'info'
        });
        break;
      case 2:
        debug_log('Emptying Queue');
        status.comms.queue = 0
        queuePointer = 0;
        gcodeQueue.length = 0; // Dump the queue
        sentBuffer.length = 0; // Dump bufferSizes
        debug_log('Clearing Lockout');

        clearInterval(queueCounterLoop);
        jogWindowProgress(0);
        addQRealtime(String.fromCharCode(0x18)); // ctrl-x
        setTimeout(function() {
          debug_log('Sent: $X');
          addQToEndAndKick("$X");
        }, 500);
        status.comms.blocked = false;
        status.comms.paused = false;

        serverEmitOutput({
          command: '[clear alarm]',
          response: "Operator clicked Clear Alarm: Cleared Lockout and Emptied Queue",
          type: 'info'
        });
        break;
    }
    status.comms.runStatus = 'Stopped'
    if (status.comms.connectionStatus >= 2) {
      status.comms.connectionStatus = 2;
    }
    status.comms.alarm = "";
    serverEmit('errorsCleared', true);
  } else {
    debug_log('ERROR: Machine connection not open!');
  }
}

function onConnection(socket) {
  socket.on('runJob', runJob);
  socket.on('runCommand', runCommand);

  socket.on('forceQueue', send1Q);

   // Inject a live command into Serial stream in real-time (dev tool) even while a job is running, etc (straight Port.write from machineSendRealtime)
  socket.on('serialInject', machineSendRealtime);

  socket.on('pause', pause);
  socket.on('resume', unpause);
  socket.on('stop', stop);

  socket.on('clearAlarm', clearAlarm);

  socket.on('resetMachine', function() {
    if (status.comms.connectionStatus > 0) {
      debug_log('Reset Machine');
      addQRealtime(String.fromCharCode(0x18)); // ctrl-x
      debug_log('Sent: Code(0x18)');
    } else {
      debug_log('ERROR: Machine connection not open!');
    }
  });

  socket.on("spindleDelay", function(data) {
    status.misc.spindleDelay = data;
    if (persistentConfig.spindleDelay != data) {
      persistentConfig.spindleDelay = data;
      savePersistentConfig();
    }
  });

  socket.on('captureWcsHistory', function(data) {
    serverEmit('captureWcsHistory', data);
  });
}

function onDocReady(result) {
  result.firmware = status.machine.firmware;
}

function onPortOpen(_port, data) {
  port = _port;

  // setup listeners first
  const parser = port.pipe(new ReadlineParser({
    delimiter: '\r\n' // grbl always uses \r\n
  }));
  parser.on("data", onParserData);

  // then try to connect
  connectController(data);
}

function onPortClose() {
  clearInterval(queueCounterLoop);
  clearInterval(grblStatusLoop);
  jogWindowProgress(0);

  status.comms.interfaces.activePort = false;
  status.comms.interfaces.activeBaud = false;
  status.comms.connectionStatus = 0;
  status.comms.queue = 0;
  status.machine.firmware.type = "";
  status.machine.firmware.version = ""; // get version
  status.machine.firmware.date = "";
  status.machine.firmware.buffer = "";
  status.machine.modals.homedRecently = false;
  gcodeQueue.length = 0;
  sentBuffer.length = 0; // dump bufferSizes
  queuePointer = 0;
  jobStatusInternal = 0;
}

function runJobRequest(req, res) {
  let upload = multer({
    storage: memoryStorage
  }).single('file');

  upload(req, res, function(err) {
    if (err) {
      return res.send(err);
    }
    runJob({data: req.file.buffer.toString(), isJob: true});
    res.send(`Running ` + req.file.path);
  });
}

function getCurrentGcode() {
  return currentGcode;
}

function setCurrentGcode(gcode) {
  currentGcode = gcode;
}

function initGrblSender() {
  app.post('/runjob', runJobRequest);

  addConnectionHandler(onConnection);
  addDocReadyHandler(onDocReady);
  addPortOpenHandler(onPortOpen);
  addPortCloseHandler(onPortClose);
}

module.exports = {
  addQToEnd,
  addQToEndAndKick,
  addQRealtime,
  getCurrentGcode,
  setCurrentGcode,
  initGrblSender
};
