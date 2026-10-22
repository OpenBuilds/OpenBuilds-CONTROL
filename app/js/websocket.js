"use strict";

var socket, laststatus, lastsysinfo;
var server = ''; //192.168.14.100';
var grblParams = {}
var nostatusyet = true;
var bellstate = false;
var waitingForStatus = false;
var openDialogs = [];

const MAX_GCODE_IN_EDITOR = 20 * 1024 * 1024;

function printLogModern(icon, source, string, printLogCls) {
  if (document.getElementById("console") !== null) {
    if (string.isString) {
      string = string.replace(/\r\n|\n|\r/, "<br />");
    }
    if ($('#console p').length > 300) {
      // remove oldest if already at 300 lines
      $('#console p').first().remove();
    }
    let template = '<p class="pf">';
    if (icon) {
      template += icon
    }
    const time = new Date();
    template += '<span class="fg-dark">[' + (time.getHours() < 10 ? '0' : '') + time.getHours() + ":" + (time.getMinutes() < 10 ? '0' : '') + time.getMinutes() + ":" + (time.getSeconds() < 10 ? '0' : '') + time.getSeconds() + ']</span> ';

    if (source) {
      template += "<span class='fg-darkRed'>[ " + source + " ] </span>"
    } else {
      template += "<span class='fg-darkRed'>[  ] </span>"
    }
    if (string) {
      template += "<span class='" + printLogCls + "'>" + string + "</span>"
    }
    $('#console').append(template);
    $('#console').scrollTop(($("#console")[0].scrollHeight - $("#console").height()) + 20);
  }
}

function printLog(string) {
  if (document.getElementById("console") !== null) {
    if (string.isString) {
      // split(/\r\n|\n|\r/);
      string = string.replace(/\r\n|\n|\r/, "<br />");
    }
    if ($('#console p').length > 100) {
      // remove oldest if already at 300 lines
      $('#console p').first().remove();
    }
    let template = '<p class="pf">';
    const time = new Date();

    template += '<span class="fg-dark">[' + (time.getHours() < 10 ? '0' : '') + time.getHours() + ":" + (time.getMinutes() < 10 ? '0' : '') + time.getMinutes() + ":" + (time.getSeconds() < 10 ? '0' : '') + time.getSeconds() + ']</span> ';
    template += string;
    $('#console').append(template);
    $('#console').scrollTop(($("#console")[0].scrollHeight - $("#console").height()) + 20);
  }
}

function onGcodeUpload(gcode, filename) {
  if (isJogWidget) return;
  printLogModern('', "api", "Received new G-code from API", "fg-darkGreen");
  printLogModern('', "api", "API called window into focus", "fg-darkGreen");

  currentGcode = gcode;
  loadedFileName = filename;

  if (!editor) {
    useEditor = false;
  } else if (gcode.length > MAX_GCODE_IN_EDITOR) {
    enableViaClass('.editorEnabled', false);
    editor.session.setValue(
`The G-code file ` + filename + ` is too large (` + (gcode.length / (1024*1024)).toFixed(1) + ` MB) to load into the G-code Editor.
If you need to edit it, please use a standalone text editing application and reload it.
The editor is currently disabled. You can click the Clear button to clear the current G-code and type a new program here.`);
    useEditor = false;
  } else {
    enableViaClass('.editorEnabled', true);
    editor.session.setValue(gcode);
    useEditor = true;
  }

  setWindowTitle()
  $('#reloadGcodeBtn').attr('title', "Reload " + loadedFileName);
  $('#reloadGcodeBtn').removeClass('disabled');
  parseGcodeInWebWorker(gcode);
  $('#controlTab').click()
  if (webgl) {
    $('#gcodeviewertab').click();
  } else {
    $('#gcodeeditortab').click();
  }
}

function onRecentFiles(recentFiles) {
  if (!isJogWidget) {
    $('#recentFilesList').nextAll().remove();

    let elements = ``;
    for (const file of recentFiles) {
      elements += `<li title="` + file +`"><a href="#" onclick="reloadJobFile('` + file.replaceAll('\\', '\\\\') + 
        `')"><span class="fas fa-file-alt fg-darkGray icon"></span> ` + file.split(/[/\\]/).at(-1) + `</a></li>\n`;
    }
    $('#recentFilesList').after(elements);
    enableViaClass('#clearRecentBtn', recentFiles.length > 0);
  }
}

function onSysInfo(sysinfo) {
  if (sysinfo) {
    lastsysinfo = sysinfo;

    const mobo = sysinfo.hardware.motherboard.manufacturer + " " + sysinfo.hardware.motherboard.model;
    $("#mobospecs").html(mobo);

    const cpu = sysinfo.hardware.cpu[0].model;
    $("#cpuspecs").html(cpu);

    const gpu = sysinfo.hardware.gpu.length > 0 ? sysinfo.hardware.gpu[0].model + " (" + sysinfo.hardware.gpu[0].vram + "mb)" : "NONE";
    $("#gpuspecs").html(gpu);

    const memory = "Free: " + sysinfo.hardware.memory.free + " / Total: " + sysinfo.hardware.memory.total;
    $("#memoryspecs").html(memory);

    const operatingsys = sysinfo.operatingSystem.distro + " / " + sysinfo.operatingSystem.arch + " (" + sysinfo.operatingSystem.version + ")";
    $("#osspecs").html(operatingsys);

    const ipaddresses = sysinfo.network.flatMap(iface => iface.addresses.map(addr => addr.address)).join(' / ');
    $("#ipspecs").html(ipaddresses);
  }
}

function onSocketConnect() {
  $("#websocketstatus").html("Connected")
}

function onSocketDisconnect() {
  console.log("WEBSOCKET DISCONNECTED")
  const icon = ''
  const source = "websocket"
  const string = "Disconnected. Groove Control probably quit or crashed"
  const printLogCls = "fg-darkRed"
  printLogModern(icon, source, string, printLogCls)
  $("#websocketstatus").html("Disconnected")
}

function onInterfaceDrive(data) {
  console.log(data)
  if (data && data.length > 1) {
    $("#interfaceDriveLetterBtn").html("<i class='fab fa-usb'></i> Selected: " + data)
    if ($("#profileTargetController").val() != "") {
      $(".interfaceCopyBtn").removeClass('disabled');
    }
  }
}
function onSocketData(data) {
  let toPrint = escapeHTML(data.response);

  let lineColor = "fg-dark"
  if (data.type == "error") {
    lineColor = "fg-darkRed"
  } else if (data.type == "success") {
    lineColor = "fg-darkGreen"
  } else if (data.type == "info") {
    lineColor = "fg-dark"
  }

  // look for grbl settings change and update grblparams variable
  // matches $number(s)=
  if (/^\$\d*=/.test(data.command) && data.response == 'ok') {
    grblSettings(data.command)
  }

  // Parse Grbl Settings Feedback
  if (data.response.indexOf('$') === 0) {

    const key = data.response.split('=')[0].substr(1);
    let descr;
    if (grblSettingsTemplate[key] !== undefined) {
      descr = grblSettingsTemplate[key].title
    } else {
      descr = "unknown"
    }
    toPrint = data.response + "  ;" + descr
    const icon = ''
    const source = data.command
    const string = toPrint
    const printLogCls = lineColor
    printLogModern(icon, source, string, printLogCls)

    if (data.response.match(/\$(\d+)(=)/)) {
      if (typeof grblSettings !== 'undefined') {
        grblSettings(data.response);
      }
    }

  } else {
    const icon = ''
    const source = data.command
    const string = toPrint
    const printLogCls = lineColor
    printLogModern(icon, source, string, printLogCls)
  };
}

function onGrbl(firmware) {
  if (firmware.type != "grbl") return;
  grblParams = {};
  fluidncConfig = undefined;
  fluidncConfigYaml = undefined;
  setTimeout(function() {
    sendGcode(firmware.platform == "FluidNC" ? '$$\n$I\n$CD' : '$$\n$I');
  }, 500);

  $("#grblButtons").show();
  $("#firmwarename").html(firmware.platform);
  if (localStorage.getItem('jogOverride')) {
    jogOverride(localStorage.getItem('jogOverride'));
  }
}

function onJobComplete(data) {
  if (isJogWidget) return;

  if (data.completed && data.jobStartTime && data.jobEndTime) {
    console.log("jobComplete", data)
    const runTime = data.jobEndTime - data.jobStartTime; // in Milliseconds
    $('#timeRemaining').html("DONE: " + msToTime(runTime));
    let estimateTime = 0;
    if (object && object.userData != undefined) {
      estimateTime = object.userData.totalTime; // in Minutes
    }
    const startDate = new Date(data.jobStartTime);
    const startDateString = startDate.toString();
    const endDate = new Date(data.jobEndTime);
    const endDateString = endDate.toString();
    let completionStatus = "complete"
    if (data.failed) {
      completionStatus = "incomplete"
    }
    console.log("Completed: " + completionStatus + " / Filename: " + loadedFileName + " / Estimated Runtime: " + timeConvert(estimateTime) + " / Streaming Runtime: " + msToTime(runTime) + " / Start Date: " + startDateString + " / End Date: " + endDateString)
    const completedJob = {
      "completed": !data.failed, // Did job complete?
      "filename": loadedFileName, // File Name
      "estruntime": estimateTime, // in Minutes
      "streamruntime": runTime,
      "startdate": data.jobStartTime,
      "enddate": data.jobEndTime
    }
    storeJob(completedJob);

  }

  // With jobCompletedMsg Message
  if (data.jobCompletedMsg && data.jobCompletedMsg.length > 0) {
    let runTime = undefined;
    if (data.jobStartTime && data.jobEndTime) {
      runTime = data.jobEndTime - data.jobStartTime;
      $("#completeMsgDiv").html("Job completed in " + msToTime(runTime) + "<hr>" + data.jobCompletedMsg);
      $('#timeRemaining').html("DONE: " + msToTime(runTime));
    } else {
      $("#completeMsgDiv").html(data.jobCompletedMsg);
      $('#timeRemaining').html("DONE: " + msToTime(runTime));
    }
    Metro.dialog.open("#completeMsgModal");
    const icon = ''
    const source = "JOB COMPLETE"
    const string = (runTime != undefined ? "Job completed in " + msToTime(runTime) : "Job completed") + " / " + data.jobCompletedMsg
    const printLogCls = "fg-darkGreen"
    printLogModern(icon, source, string, printLogCls)
    $('#timeRemaining').html("DONE: " + msToTime(runTime));
  } else if (data.jobStartTime && data.jobEndTime) {
    // Without jobCompletedMsg Message (Normal Job)
    const runTime = data.jobEndTime - data.jobStartTime;
    const icon = ''
    const source = "JOB COMPLETE"
    const string = "Job completed in " + msToTime(runTime)
    const printLogCls = "fg-darkGreen"
    printLogModern(icon, source, string, printLogCls)
    $('#timeRemaining').html("DONE: " + msToTime(runTime));
  }

  // Focus Button
  setTimeout(function() {
    $('#jobCompleteBtnOk').focus();
  }, 200)

  // Cleanup
  lastJobStartTime = false;
}

function onQueueCount(data) {
  // calc percentage
  const left = data[0]
  const total = data[1]
  const done = total - left;
  const donepercent = done / total * 100
  const progressbar = $("#progressbar").data("progress");
  if (progressbar) {
    progressbar.val(donepercent);
  }

  if (laststatus) {
    if (typeof object !== 'undefined' && done > 0) {
      if (object.userData !== 'undefined' && object.userData && object.userData.pointCount > 2) {
        const timeremain = object.userData.totalTime;
        if (!isNaN(timeremain)) {
          if (lastJobStartTime) {
            $('#timeRemaining').html(timeConvert((new Date().getTime() - lastJobStartTime) / 1000 / 60) + " / " + timeConvert(timeremain));
          }
        }
      }

    } else {
      $('#timeRemaining').empty();
    }
  }
  $('#gcodesent').html("Job Queue: " + data[0]);
}

function toastErrorAlarm(data) {
  const icon = ''
  const source = "ALARM"
  const string = data
  const printLogCls = "fg-darkRed"
  printLogModern(icon, source, string, printLogCls)

  const dialog = Metro.dialog.create({
    clsDialog: 'dark',
    title: "<i class='fas fa-exclamation-triangle'></i> Grbl Alarm:",
    content: "<i class='fas fa-exclamation-triangle fg-darkRed'></i>  " + data,
    actions: [{
        caption: "Clear Alarm",
        cls: "js-dialog-close alert closeAlarmBtn",
        onclick: function() {
          socket.emit('clearAlarm', 2)
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {}
      }
    ]
  });

  if (data.indexOf("ALARM: 6") == -1 && data.indexOf("ALARM: 7") == -1 && data.indexOf("ALARM: 8") == -1 && data.indexOf("ALARM: 9") == -1 && data.indexOf("ALARM: 10") == -1) {
    openDialogs.push(dialog);
  }

  setTimeout(function() {
    $(".closeAlarmBtn").focus();
  }, 200);
}

function toastError(data) {
  const icon = ''
  const source = "ERROR"
  const string = data
  const printLogCls = "fg-darkRed"
  printLogModern(icon, source, string, printLogCls)

  const dialog = Metro.dialog.create({
    title: "<i class='fas fa-exclamation-triangle'></i> Grbl Error:",
    content: "<i class='fas fa-exclamation-triangle fg-darkRed'></i>  " + data,
    clsDialog: 'dark',
    actions: [{
      caption: "OK",
      cls: "js-dialog-close alert closeErrorBtn",
      onclick: function() {
        socket.emit('clearAlarm', 2)
      }
    }]
  });
  openDialogs.push(dialog);
  setTimeout(function() {
    $(".closeErrorBtn").focus();
  }, 200);
}

function errorsCleared(data) {
  if (data) {
    for (const dlg of openDialogs) {
      Metro.dialog.close(dlg);
    }
    openDialogs.length = 0;
  }
}

function onStatus(status) {
  if (nostatusyet && !isJogWidget) {
    setWindowTitle(status);
    if (status.driver.operatingsystem == "rpi") {
      $('#windowtitlebar').hide();
    }
  }
  nostatusyet = false;

  let featuresChanged = false;
  let offsetChanged = false;

  if (laststatus !== undefined) {

    featuresChanged = !_.isEqual(status.machine.firmware.features, laststatus.machine.firmware.features);
    offsetChanged = !_.isEqual(status.machine.position.offset, laststatus.machine.position.offset);

    if (!_.isEqual(status.comms.interfaces.ports, laststatus.comms.interfaces.ports)) {
      let string = "Detected a change in available ports: ";
      for (const port of status.comms.interfaces.ports) {
        string += "[" + port.path + "]";
      }

      if (status.comms.interfaces.ports.length == 0) {
        string += "[ No devices connected ]";
      }
      const icon = ''
      const source = "usb ports"
      const printLogCls = "fg-dark"
      printLogModern(icon, source, string, printLogCls)
      laststatus.comms.interfaces.ports = status.comms.interfaces.ports;
      populatePortsMenu();
    }

    if (!_.isEqual(status.comms.interfaces.networkDevices, laststatus.comms.interfaces.networkDevices)) {
      let string = "Detected a change in IP devices: ";
      for (const device in status.comms.interfaces.networkDevices) {
        string += "[" + device.ip + "]"
      }

      if (status.comms.interfaces.networkDevices.length == 0) {
        string += "[ No IP devices ]"
      }
      const icon = ''
      const source = "network ports"
      //const string = string
      const printLogCls = "fg-dark"
      printLogModern(icon, source, string, printLogCls)
      laststatus.comms.interfaces.networkDevices = status.comms.interfaces.networkDevices;
      populatePortsMenu();
    }
  }

  if (status.comms.runStatus.startsWith("Door")) {
    const doorType = status.comms.runStatus.split(":")[1]
    let doorMsg = "";
    if (doorType == 0) {
      doorMsg += "Door Closed: Ready to Resume"
    }
    if (doorType == 1) {
      doorMsg += "Door Open: Paused"
    }
    if (doorType == 2) {
      doorMsg += "Door Open: Tool Stopping"
    }
    if (doorType == 3 || doorType == 4) {
      doorMsg += "Door Closed: Tool Starting Up"
    }
    $('#runStatus').html(doorMsg);
  } else {
    $('#runStatus').html("Controller: " + status.comms.runStatus);
  }

  updateDro(status);

  if (webgl) {
    if (!disable3Drealtimepos) {
      if (!isJogWidget) {
        if (!simRunning) {
          cone.position.x = status.machine.position.work.x
          cone.position.y = status.machine.position.work.y
          cone.position.z = status.machine.position.work.z
        }
      }
    }
  }

  if (safeToUpdateSliders) {
    if ($('#fro').data('slider') && $('#fro').data('slider').val() != status.machine.overrides.feedOverride) {
      $('#fro').data('slider').val(status.machine.overrides.feedOverride);
    }

    if ($('#tro').data('slider') && $('#tro').data('slider').val() != status.machine.overrides.spindleOverride) {
      $('#tro').data('slider').val(status.machine.overrides.spindleOverride);
    }
  }

  if (unit == "in") {
    $("#realFeed").html((status.machine.overrides.realFeed / 25.4).toFixed(0) + "<br>in/min");
  } else {
    $("#realFeed").html(status.machine.overrides.realFeed.toFixed(0) + "<br>mm/min");
  }
  $("#realSpeed").html( status.machine.overrides.realSpindle.toFixed(0) + "<br>rpm");


  // Windows Power Management
  if (status.driver.operatingsystem == "windows") {
    $("#powerSettingsCard").show();
    if (status.driver.powersettings.usbselectiveAC == false) {
      $('#selectivesuspendAC').removeClass('alert').addClass('success').html('DISABLED')
    } else if (status.driver.powersettings.usbselectiveAC == null) {
      $('#selectivesuspendAC').removeClass('success').addClass('alert').html('UNKNOWN')
    } else if (status.driver.powersettings.usbselectiveAC == true) {
      $('#selectivesuspendAC').removeClass('success').addClass('alert').html('ENABLED')
    }

    if (status.driver.powersettings.usbselectiveDC == false) {
      $('#selectivesuspendDC').removeClass('alert').addClass('success').html('DISABLED')
    } else if (status.driver.powersettings.usbselectiveDC == null) {
      $('#selectivesuspendDC').removeClass('success').addClass('alert').html('UNKNOWN')
    } else if (status.driver.powersettings.usbselectiveDC == true) {
      $('#selectivesuspendDC').removeClass('success').addClass('alert').html('ENABLED')
    }
  } else {
    $("#powerSettingsCard").hide();
  }

  $("#firmwareversionstatus").html(status.machine.firmware.platform + " " + status.machine.firmware.version + " (" + status.machine.firmware.date + ")");

  // Grbl Pins Input Status
  updatePinStatus($('#xpin'), status.machine.inputs.includes('X'), 'TRIGGERED', 'OFF');
  updatePinStatus($('#ypin'), status.machine.inputs.includes('Y'), 'TRIGGERED', 'OFF');
  updatePinStatus($('#zpin'), status.machine.inputs.includes('Z'), 'TRIGGERED', 'OFF');
  updatePinStatus($('#prbpin'), status.machine.inputs.includes('P'), 'TRIGGERED', 'OFF');
  updatePinStatus($('#doorpin'), status.machine.inputs.includes('D'), 'DOOR OPEN', 'DOOR CLOSED');
  updatePinStatus($('#holdpin'), status.machine.inputs.includes('H'), 'HOLD:ON', 'HOLD:OFF');
  updatePinStatus($('#resetpin'), status.machine.inputs.includes('R'), 'RST:ON', 'RST:OFF');
  updatePinStatus($('#startpin'), status.machine.inputs.includes('S'), 'START:ON', 'START:OFF');

  $('#driverver').html("v" + status.driver.version);
  if (!status.machine.firmware.type) {
    $('#firmwarever').html("NOCOMM");
  } else {
    $('#firmwarever').html(status.machine.firmware.type + " v" + status.machine.firmware.version);
  }
  $('#commblocked').html(status.comms.blocked ? "BLOCKED" : "Ready");
  let string = '';
  switch (status.comms.connectionStatus) {
    case 0:
      string += "Not Connected"
      break;
    case 2:
      string += "Connected"
      break;
    case 3:
      string += "Streaming"
      break;
    case 4:
      string += "Paused"
      break;
    case 5:
      string += "Alarmed"
      break;

  }
  $('#commstatus').html(string);
  $('#drvqueue').html(status.comms.queue);

  $('#activeportstatus').html(status.comms.interfaces.activePort || "none")

  // Only allow jogging during idle
  $('.jogbtn').attr('disabled', status.comms.connectionStatus != 2);
  $('.dro').attr('disconnected', status.comms.connectionStatus < 2 || status.comms.connectionStatus == 6);

  // Allow typing on the console only during idle or alarm
  $("#command, #sendCommand").attr('disabled', status.comms.connectionStatus != 2 && status.comms.connectionStatus != 5);

  // Set the Connection Toolbar option
  setConnectBar(status.comms.connectionStatus, status);
  setControlBar(status.comms.connectionStatus, status);
  if (status.comms.connectionStatus != 5) {
    bellstate = false
  }
  if (status.comms.connectionStatus == 0) {
    $("#grblButtons").hide();
    $("#firmwarename").html('');
    if (localStorage.getItem('jogOverride')) {
      jogOverride(localStorage.getItem('jogOverride'));
    }
  }

  enableViaClass('#resetGrblBtn, #section-grbl .group:not(.estop)', status.comms.connectionStatus != 3 && status.comms.connectionStatus != 4);
  enableViaClass('#grblMetroTable', status.comms.connectionStatus != 3 && status.comms.connectionStatus != 4 && status.machine.firmware.platform != "FluidNC");

  if (laststatus == undefined || status.machine.modals.coordinatesys != laststatus.machine.modals.coordinatesys) {
    $('.wcsText').html(status.machine.modals.coordinatesys)
    addRemoveClass($('#wcsItemG54'), 'checked', status.machine.modals.coordinatesys == "G54");
    addRemoveClass($('#wcsItemG55'), 'checked', status.machine.modals.coordinatesys == "G55");
    addRemoveClass($('#wcsItemG56'), 'checked', status.machine.modals.coordinatesys == "G56");
    addRemoveClass($('#wcsItemG57'), 'checked', status.machine.modals.coordinatesys == "G57");
    addRemoveClass($('#wcsItemG58'), 'checked', status.machine.modals.coordinatesys == "G58");
    addRemoveClass($('#wcsItemG59'), 'checked', status.machine.modals.coordinatesys == "G59");
    updateWcsHistory(status.machine.modals.coordinatesys);
  }

  // Enable or disable 4th axis UI elements
  $(".4thaxis-present").toggle(status.machine.has4thAxis);
  $(".4thaxis-active").toggle(status.machine.has4thAxis && !disable4thAxis);

  if (!isJogWidget && (!laststatus || laststatus.misc.trayIcon != status.misc.trayIcon) &&
      (status.driver.platform == 'win32' || status.driver.platform == 'linux')) {
    $('#mainCloseBtn').attr( "title", status.misc.trayIcon ? "Close to Tray" : "Close");
  }

  const firstStatus = !laststatus;
  laststatus = status;

  if (!isJogWidget && webgl && (featuresChanged || offsetChanged)) {
    updateMachineCoordinates();
  }

  if (featuresChanged) {
    updateGotoLimits();
  }

  waitingForStatus = false;
  if (firstStatus) {
    if (!isJogWidget) {
      updatesFirstStatus();
    }
  }
}

function onFeatures(data) {
/* Ivo: none of these UI elements exist anymore. Besides, there is no code to revert the state if the feature disappears. Disabling the entire thing.
  for (let i = 0; i < data.length; i++) {
    switch (data[i]) {
      case 'Q':
        // console.log('SPINDLE_IS_SERVO Enabled')
        // Also enabled for grblHAL from grbl-settings if $33=50
        $('#enServo').removeClass('alert').addClass('success').html('ON')
        break;
      case 'V': // Variable spindle enabled
        // console.log('Variable spindle enabled')
        $('#enVariableSpindle').removeClass('alert').addClass('success').html('ON')
        break;
      case 'N': // Line numbers enabled
        // console.log('Line numbers enabled')
        $('#enLineNumbers').removeClass('alert').addClass('success').html('ON')
        break;
      case 'M': // Mist coolant enabled
        // console.log('Mist coolant enabled')
        $('#enMisting').removeClass('alert').addClass('success').html('ON')
        break;
      case 'C': // CoreXY enabled
        // console.log('CoreXY enabled')
        $('#enCoreXY').removeClass('alert').addClass('success').html('ON')
        break;
      case 'P': // Parking motion enabled
        // console.log('Parking motion enabled')
        $('#enParking').removeClass('alert').addClass('success').html('ON')
        break;
      case 'Z': // Homing force origin enabled
        // console.log('Homing force origin enabled')
        $('#enHomingOrigin').removeClass('alert').addClass('success').html('ON')
        break;
      case 'H': // Homing single axis enabled
        // console.log('Homing single axis enabled')
        $('#enSingleAxisHome').removeClass('alert').addClass('success').html('ON')
        break;
      case 'T': // Two limit switches on axis enabled
        // console.log('Two limit switches on axis enabled')
        $('#enTwoLimits').removeClass('alert').addClass('success').html('ON')
        break;
      case 'A': // Allow feed rate overrides in probe cycles
        // console.log('Allow feed rate overrides in probe cycles')
        $('#enFeedOVProbe').removeClass('alert').addClass('success').html('ON')
        break;
      case '$': // Restore EEPROM $ settings disabled
        // console.log('Restore EEPROM $ settings disabled')
        $('#enEepromSettingsDisable').removeClass('alert').addClass('success').html('ON')
        break;
      case '#': // Restore EEPROM parameter data disabled
        // console.log('Restore EEPROM parameter data disabled')
        $('#enEepromParamsDisable').removeClass('alert').addClass('success').html('ON')
        break;
      case 'I': // Build info write user string disabled
        // console.log('Build info write user string disabled')
        $('#enBuildInfoDisabled').removeClass('alert').addClass('success').html('ON')
        break;
      case 'E': // Force sync upon EEPROM write disabled
        // console.log('Force sync upon EEPROM write disabled')
        $('#enForceSyncEeprom').removeClass('alert').addClass('success').html('ON')
        break;
      case 'W': // Force sync upon work coordinate offset change disabled
        // console.log('Force sync upon work coordinate offset change disabled')
        $('#enForceSyncWco').removeClass('alert').addClass('success').html('ON')
        break;
      case 'L': // Homing init lock sets Grbl into an alarm state upon power up
        // console.log('Homing init lock sets Grbl into an alarm state upon power up')
        $('#enHomingInitLock').removeClass('alert').addClass('success').html('ON')
        break;
    }
  }
*/
  if (laststatus.machine.firmware.platform != "grblHAL") {
    $(".servo-active").toggle(data.contains('Q')); // the grblHAL case is handled by setting $33
  }
  $('#menuMisting').toggle(data.contains('M'));
  $("#homeSingleMenu").parent().toggle(data.contains('H'));
}

function initSocket() {
  socket = io.connect(server, {
    'timeout': 60000,
    'connect timeout': 60000
  }); // socket.io init
  const icon = ''
  const source = "websocket"
  const string = "Bidirectional Websocket Interface Started Succesfully"
  const printLogCls = "fg-darkGreen"
  printLogModern(icon, source, string, printLogCls)
  setTimeout(function() {
    populatePortsMenu();
  }, 2000);

  socket.on('connect', onSocketConnect);

  socket.on('disconnect', onSocketDisconnect);

  socket.on('interfaceDrive', onInterfaceDrive);

  socket.on('gcodeupload', function(data) { onGcodeUpload(data.gcode, data.filename); });

  socket.on('fluidncConfig', setFluidNcConfig);

  socket.on('data', onSocketData);

  socket.on("grbl", onGrbl);

  // eslint-disable-next-line no-unused-vars
  socket.on("queueComplete", function(data) {});

  socket.on("jobComplete", onJobComplete);

  socket.on('status', onStatus);

  socket.on('features', onFeatures);

  socket.on("queueCount", onQueueCount);

  socket.on('toastErrorAlarm', toastErrorAlarm);

  socket.on('toastError', toastError);

  socket.on("errorsCleared", errorsCleared);

  if (!isJogWidget) {
    socket.on('sysinfo', onSysInfo);

    socket.on("interfaceOutdated", function(status) {
      console.log("interfaceOutdated", status)
    })

    socket.on('captureWcsHistory', function(data) {
     captureWcsHistoryInternal(data.position, data.wcs, data.name, data.tooltip, data.isRunJob);
    });

    socket.on('showSettings', appSettings);

    socket.on('recentFiles', onRecentFiles);
  }

  $('#sendCommand').on('click', function() {
    const commandValue = $('#command').val();
    sendGcode(commandValue);
  });

  $('#command').on('keypress', function(e) {
    if (e.which === 13) {
      $(this).attr("disabled", "disabled");
      const commandValue = $('#command').val();
      sendGcode(commandValue);
      $('#command').val('');
      $(this).removeAttr("disabled");
    }
  });

  setInterval(function() {
    if (!nostatusyet && laststatus) {
      if (laststatus.comms.connectionStatus == 5) {
        bellstate = !bellstate;
        $('#navbell, #navbellBtn1, #navbellBtn2, #navbellBtn3').toggle(bellstate);
      } else {
        $('#navbell, #navbellBtn1, #navbellBtn2, #navbellBtn3').hide();
      }
    }
  }, 200);
}

function scanNetwork() {

  const currentIp = laststatus.driver.ipaddress.split(".")
  const scanTemplate = `
  <div class="row mt-2">
    <div class="cell-md-12 mb-1">
      Enter the IP address range to scan for devices.  <p>
      <small>Warning: This may disconnect other running instances / open connections to/from other devices</small>
    </div>
  </div>
  <hr>
  <div class="row mt-2">
    <div class="cell-md-3 mb-1">IP Range</div>
    <div class="cell-md-9 mb-1">
      <form class="inline-form">
        <input id="scanIp1" type="number" data-clear-button="false" style="width: 80px;" data-append="." data-editable="true" value="` + currentIp[0] + `">.
        <input id="scanIp2" type="number" data-clear-button="false" style="width: 80px;" data-append="." data-editable="true" value="` + currentIp[1] + `">.
        <input id="scanIp3" type="number" data-clear-button="false" style="width: 80px;" data-append="." data-editable="true" value="` + currentIp[2] + `">.
        <input type="text" readonly disabled value="1-254" data-clear-button="false"  style="width: 80px;" data-editable="true">
      </form>
    </div>
  </div>
  `

  Metro.dialog.create({
    title: "<i class='fas fa-network-wired fa-fw'></i> Network Scan",
    content: scanTemplate,
    toTop: true,
    width: '75%',
    clsDialog: 'dark',
    actions: [{
      caption: "Start Scan",
      cls: "js-dialog-close success",
      onclick: function() {
        const network = $("#scanIp1").val() + '.' + $("#scanIp2").val() + '.' + $("#scanIp3").val();
        const range = network + ".1-" + network + ".254"
        socket.emit('scannetwork', range)
        $('#controlTab').click();
        $('#consoletab').click();
      }
    }, {
      caption: "Cancel",
      cls: "js-dialog-close",
      onclick: function() {}
    }]
  });

}

function selectPort(port) {
  $('#consoletab').click();
  if (port == undefined) {
    port = $("#portUSB").val()
  }
  let data;
  if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(port)) {
    data = {
      ip: port,
      port: false,
      baud: false,
      type: "telnet"
    };
    localStorage.setItem("lastip", port);
  } else {
    data = {
      port: port,
      baud: 115200,
      type: "usb"
    };
    localStorage.setItem('lastUsedPort', port);
  }
  if (port.length > 1) {
    socket.emit('connectTo', data);
    localStorage.setItem("lastGrblPort", port);
  } else {
    printLog("[connect] No Ports/IP selected/entered")
  }
};

function closePort() {
  socket.emit('closePort', 1);
  populatePortsMenu();
  $('#controlTab').click();
  $('#consoletab').click();
}

function populatePortsMenu() {
  if (laststatus) {
    const lastGrblPort = localStorage.getItem("lastGrblPort");
    let foundPort = false;
    let response = ``
    if (laststatus.comms.interfaces.ports.length == 0) {
      response += `<optgroup label="USB/Serial Ports">`
      response += `<option value="">No USB/Serial Ports</option>`
    } else {
      response += `<optgroup label="USB Ports">`
      for (const port of laststatus.comms.interfaces.ports) {
        const lastUsedPort = localStorage.getItem('lastUsedPort');
        if (port.path == lastUsedPort) {
          response += `<option value="` + port.path + `" selected>` + port.path.replace("/dev/tty.", "") + " " + port.note + `</option>`;
        } else {
          response += `<option value="` + port.path + `">` + port.path.replace("/dev/tty.", "") + " " + port.note + `</option>`;
        }

      }
    }
    response += `</optgroup>`

    // Set USB Ports menu for Firmware Flashing tool before we add the Network ports - you cannot flash over the network
    const select2 = $("#portUSB2").data("select");
    if (select2) {
      select2.data(response);
    }
    $('#portUSB2').parent(".select").removeClass('disabled')

    // Add the Network Ports to the list then populate the Machine Connection selection
    if (laststatus.comms.interfaces.networkDevices.length == 0) {
      response += `<optgroup label="Network Ports">`
      response += `<option value="">No Network Ports</option>`
    } else {
      response += `<optgroup label="Network Ports">`
      for (const device of laststatus.comms.interfaces.networkDevices) {
        const name = device.ip;
        if (device.type) {
          response += `<option value="` + name + `">` + name + " [ " + device.type + ` ]</option>`;
        } else {
          response += `<option value="` + name + `">` + name + `</option>`;
        }
        if (name == lastGrblPort) {
          foundPort = true;
        }
      };
    }
    response += `</optgroup>`
    const select = $("#portUSB").data("select");
    select.data(response);
    if (foundPort) {
      select.val(lastGrblPort);
    }

    $('#portUSB').parent(".select").removeClass('disabled')
    $("#connectBtn").attr('disabled', false);
  }
}

function sendGcode(gcode) {
  if (gcode) {
    socket.emit('runCommand', gcode);
  }
}

function feedOverride(step) {
  if (socket) {
    socket.emit('feedOverride', step);
    $('#fro').data('slider').buff(((step - 10) * 100) / (200 - 10))
  }
}

function spindleOverride(step) {
  if (socket) {
    socket.emit('spindleOverride', step);
    $('#tro').data('slider').buff(((step - 10) * 100) / (200 - 10))
  }
}

function spindleDelay(sec) {
  if (socket) {
    socket.emit('spindleDelay', sec);
  }
}

function pauseSpindle() {
  if (socket) {
    socket.emit('serialInject', String.fromCharCode(0x84));

    if (localStorage.getItem('disablePauseSpindleDlg') != "true") {
      Metro.dialog.create({
        clsDialog: 'dark',
        title: "<i class='fas fa-exclamation-triangle'></i> Spindle Paused",
        content: `The spindle will automatically turn back on when the job is resumed.<br>The movement will continue a few seconds later.<br><br>` +
    `<input id="disablePauseSpindleDlg" type="checkbox" data-role="checkbox" data-style="2" data-caption="Don't show this again"/>`,
        actions: [{
          caption: "OK",
          cls: "js-dialog-close",
          onclick: function() {
            if ($('#disablePauseSpindleDlg').prop('checked')) {
              localStorage.setItem('disablePauseSpindleDlg', "true");
            }
          }
        }]
      });
    }
  }
}

function escapeHTML(html) {
  return document.createElement('div').appendChild(document.createTextNode(html)).parentNode.innerHTML;
}

function msToTime(duration) {
//  let milliseconds = parseInt((duration % 1000) / 100);
//  let seconds = Math.floor((duration / 1000) % 60);
  let minutes = Math.floor((duration / (1000 * 60)) % 60);
  let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
//  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + "h" + minutes + "m";
}
