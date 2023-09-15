var socket, laststatus;;
var server = ''; //192.168.14.100';
var programBoard = {};
var grblParams = {}
var smoothieParams = {}
var nostatusyet = true;
var safeToUpdateSliders = false;
var laststatus
var simstopped = false;
var bellstate = false;
var toast = Metro.toast.create;
var unit = "mm"
var waitingForStatus = false;
var openDialogs = [];


$(document).ready(function() {
  initSocket();

  $("#command").inputHistory({
    enter: function() {
      $("#sendCommand").click();
    }
  });

  $("form").submit(function() {
    return false;
  });
});

function showGrbl(bool, firmware) {
  //console.log(firmware)
  if (bool) {
    if (firmware.platform == "grblHAL" || firmware.platform == "gnea") { // Doesn't use $$ settings, uses config.yaml
      setTimeout(function() {
        sendGcode('$$')
      }, 500);
    } else if (firmware.platform == "FluidNC") {
      // Show FluidNC specific tabs and buttons
      setTimeout(function() {
        sendGcode('$CD')
      }, 500);
    }

    setTimeout(function() {
      sendGcode('$I')
    }, 700);

    setTimeout(function() {
      sendGcode('$G')
    }, 900);

    $("#grblButtons").show()
    $("#firmwarename").html(firmware.platform)

  } else { // Hide
    $("#grblButtons").hide()
    $("#firmwarename").html('')
  }
  if (localStorage.getItem('jogOverride')) {
    jogOverride(localStorage.getItem('jogOverride'))
  }
  if (laststatus !== undefined) {
    $("#firmwareversionstatus").html(laststatus.machine.firmware.platform + " " + laststatus.machine.firmware.version);
  };
}

function printLogModern(icon, source, string, printLogCls) {
  if (!disableSerialLog) {
    if (document.getElementById("console") !== null) {
      if (string.isString) {
        string = string.replace(/\r\n|\n|\r/, "<br />");
      }
      if ($('#console p').length > 300) {
        // remove oldest if already at 300 lines
        $('#console p').first().remove();
      }
      var template = '<p class="pf">';
      if (icon) {
        template += icon
      }
      var time = new Date();
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
};

function printLog(string) {
  if (!disableSerialLog) {
    if (document.getElementById("console") !== null) {
      if (string.isString) {
        // split(/\r\n|\n|\r/);
        string = string.replace(/\r\n|\n|\r/, "<br />");
      }
      if ($('#console p').length > 100) {
        // remove oldest if already at 300 lines
        $('#console p').first().remove();
      }
      var template = '<p class="pf">';
      var time = new Date();

      template += '<span class="fg-dark">[' + (time.getHours() < 10 ? '0' : '') + time.getHours() + ":" + (time.getMinutes() < 10 ? '0' : '') + time.getMinutes() + ":" + (time.getSeconds() < 10 ? '0' : '') + time.getSeconds() + ']</span> ';
      template += string;
      $('#console').append(template);
      $('#console').scrollTop(($("#console")[0].scrollHeight - $("#console").height()) + 20);
    }
  }
};

function initSocket() {
  socket = io.connect(server, {
    'timeout': 60000,
    'connect timeout': 60000
  }); // socket.io init
  socket.emit('aggrressiveHomeReset', !disableAggressiveHomeReset);
  var icon = ''
  var source = "websocket"
  var string = "Bidirectional Websocket Interface Started Succesfully"
  var printLogCls = "fg-darkGreen"
  printLogModern(icon, source, string, printLogCls)
  setTimeout(function() {
    populatePortsMenu();
  }, 2000);

  socket.on('disconnect', function() {
    console.log("WEBSOCKET DISCONNECTED")
    var icon = ''
    var source = "websocket"
    var string = "Disconnected.  OpenBuilds CONTROL probably quit or crashed"
    var printLogCls = "fg-darkRed"
    printLogModern(icon, source, string, printLogCls)
    $("#websocketstatus").html("Disconnected")
  });

  socket.on('connect', function() {
    $("#websocketstatus").html("Connected")
  });

  socket.on('interfaceDrive', function(data) {
    console.log(data)
    if (data.length > 1) {
      $("#interfaceDriveLetterBtn").html("<i class='fab fa-usb'></i> Selected: " + data)
      if ($("#profileTargetController").val() != "") {
        $(".interfaceCopyBtn").removeClass('disabled');
      }
    }
  })

  socket.on('gcodeupload', function(data) {
    var icon = ''
    var source = "api"
    var string = "Received new GCODE from API"
    var printLogCls = "fg-darkGreen"
    printLogModern(icon, source, string, printLogCls)

    if (data.gcode.length > 10000000) {
      gcode = data.gcode
      editor.session.setValue("GCODE " + data.filename + " is too large (" + (data.gcode.length / 1024).toFixed(0) + "kB) to load into the GCODE Editor. \nIf you need to edit it inside CONTROL, please use a standalone text editing application and reload it ");
    } else {
      editor.session.setValue(data.gcode);
      gcode = false;
    }

    loadedFileName = data.filename;

    setWindowTitle()
    $('#reloadFile,#reloadFile19').attr('title', "Reload " + loadedFileName);
    $('#reloadFile,#reloadFile19').removeClass('disabled');
    parseGcodeInWebWorker(data.gcode)
    $('#controlTab').click()
    if (webgl) {
      $('#gcodeviewertab').click();
    } else {
      $('#gcodeeditortab').click()
    }
    jobNeedsHoming();
  });

  socket.on('gcodeupload', function(data) {
    var icon = ''
    var source = "api"
    var string = "API called window into focus"
    var printLogCls = "fg-darkGreen"
    printLogModern(icon, source, string, printLogCls)
  });

  socket.on('integrationpopup', function(data) {
    var icon = ''
    var source = "api"
    var string = "Integration called from " + data
    var printLogCls = "fg-darkGreen"
    printLogModern(icon, source, string, printLogCls)
    $('#controlTab').click()
    $('#consoletab').click()
  });

  socket.on('updatedata', function(data) {
    // console.log(data.length, data)
    var icon = ''
    var source = data.command
    var string = data.response
    var printLogCls = "fg-darkGreen"
    printLogModern(icon, source, string, printLogCls)
  });

  socket.on('updateready', function(data) {
    // 0 = not connected
    // 1 = Connected, but not Playing yet
    // 2 = Connected, but not Playing yet
    // 3 = Busy Streaming GCODE
    // 4 = Paused
    // 5 = Alarm State
    // 6 = Firmware Upgrade State
    if (laststatus.comms.connectionStatus < 3 && !continuousJogRunning) {
      $('#availVersion').html(data)
      getReleaseStats()
      getChangelog();
      Metro.dialog.open('#downloadUpdate')
    }

  });

  socket.on('updateprogress', function(data) {
    $('#downloadprogress').html(data + "%");
  });

  socket.on('fluidncConfig', function(data) {
    console.log(data);
    var fluidnceditor = ace.edit("fluidnceditor");
    fluidnceditor.setTheme('ace/theme/sqlserver')
    fluidnceditor.session.setMode("ace/mode/yaml");
    fluidnceditor.session.setValue(data); // from samplefile.js
    $('#fluidncSettings').show()
    var fluidncJSON = YAML.parse(data);
    console.log(fluidncJSON)
    //yamlString = YAML.stringify(nativeObject[, inline /* @integer depth to start using inline notation at */[, spaces /* @integer number of spaces to use for indentation */] ]);


  });

  socket.on('data', function(data) {
    // console.log(data)
    var toPrint = escapeHTML(data.response);

    var lineColor = "fg-dark"
    if (data.type == "error") {
      lineColor = "fg-darkRed"
    } else if (data.type == "success") {
      lineColor = "fg-darkGreen"
    } else if (data.type == "info") {
      lineColor = "fg-dark"
    }

    // Parse Grbl Settings Feedback
    if (data.response.indexOf('$') === 0) {
      if (typeof grblSettings !== 'undefined') {
        grblSettings(data.response)
        var key = data.response.split('=')[0].substr(1);
        if (grblSettingsTemplate2[key] !== undefined) {
          var descr = grblSettingsTemplate2[key].title
        } else {
          var descr = "unknown"
        }
        toPrint = data.response + "  ;" + descr
        var icon = ''
        var source = data.command
        var string = toPrint
        var printLogCls = lineColor
        printLogModern(icon, source, string, printLogCls)
      }
    } else {
      var icon = ''
      var source = data.command
      var string = toPrint
      var printLogCls = lineColor
      printLogModern(icon, source, string, printLogCls)
    };

  });

  socket.on("grbl", function(data) {
    console.log(data)
    showGrbl(true, data)
  });

  socket.on("jobComplete", function(data) {

    // Jobstats.js
    if (data.completed && data.jobStartTime && data.jobEndTime) {
      console.log("jobComplete", data)
      var runTime = data.jobEndTime - data.jobStartTime; // in Milliseconds
      $('#timeRemaining').html("DONE: " + msToTime(runTime));
      if (object && object.userData != undefined) {
        var estimateTime = object.userData.totalTime; // in Minutes
      } else {
        var estimateTime = 0;
      }
      var startDate = new Date(data.jobStartTime);
      var startDateString = startDate.toString();
      var endDate = new Date(data.jobEndTime);
      var endDateString = endDate.toString();
      var completionStatus = "complete"
      if (data.failed) {
        completionStatus = "incomplete"
      }
      console.log("Completed: " + completionStatus + " / Filename: " + loadedFileName + " / Estimated Runtime: " + timeConvert(estimateTime) + " / Streaming Runtime: " + msToTime(runTime) + " / Start Date: " + startDateString + " / End Date: " + endDateString)
      var completedJob = {
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
      if (data.jobStartTime && data.jobEndTime) {
        var runTime = data.jobEndTime - data.jobStartTime;
        $("#completeMsgDiv").html("Job completed in " + msToTime(runTime) + "<hr>" + data.jobCompletedMsg);
        $('#timeRemaining').html("DONE: " + msToTime(runTime));
      } else {
        $("#completeMsgDiv").html(data.jobCompletedMsg);
        $('#timeRemaining').html("DONE: " + msToTime(runTime));
      }
      Metro.dialog.open("#completeMsgModal");
      var icon = ''
      var source = "JOB COMPLETE"
      var string = "Job completed in " + msToTime(runTime) + " / " + data.jobCompletedMsg
      var printLogCls = "fg-darkGreen"
      printLogModern(icon, source, string, printLogCls)
      $('#timeRemaining').html("DONE: " + msToTime(runTime));
    } else if (data.jobStartTime && data.jobEndTime) {
      // Without jobCompletedMsg Message (Normal Job)
      var runTime = data.jobEndTime - data.jobStartTime;
      var icon = ''
      var source = "JOB COMPLETE"
      var string = "Job completed in " + msToTime(runTime)
      var printLogCls = "fg-darkGreen"
      printLogModern(icon, source, string, printLogCls)
      $('#timeRemaining').html("DONE: " + msToTime(runTime));
    }

    // Focus Button
    setTimeout(function() {
      $('#jobCompleteBtnOk').focus();
    }, 200)

    // Cleanup
    lastJobStartTime = false;
    // if (typeof object !== 'undefined' && object.userData != undefined) {
    //   var timeremain = object.userData.totalTime;
    //   if (!isNaN(timeremain)) {
    //     $('#timeRemaining').html(timeConvert(timeremain) + " / " + timeConvert(timeremain));
    //   }
    // }


  });

  socket.on("machinename", function(data) {
    if (typeof setMachineButton !== 'undefined') {
      setMachineButton(data)
    }
  });

  socket.on("queueCount", function(data) {
    // calc percentage
    var left = data[0]
    var total = data[1]
    var done = total - left;
    var donepercent = done / total * 100
    var progressbar = $("#progressbar").data("progress");
    if (progressbar) {
      progressbar.val(donepercent);
    }

    if (total > done) {
      localStorage.setItem('gcodeLineNumber', done); //recovery line number
    }

    if (laststatus) {
      if (laststatus.comms.connectionStatus == 3) {
        editor.gotoLine(data[1] - data[0]);
      }
      if (typeof object !== 'undefined' && done > 0) {
        if (object.userData !== 'undefined' && object.userData && object.userData.linePoints.length > 2) {
          var timeremain = object.userData.totalTime;
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
  })

  socket.on('toastErrorAlarm', function(data) {
    console.log(data)
    var icon = ''
    var source = "ALARM"
    var string = data
    var printLogCls = "fg-darkRed"
    printLogModern(icon, source, string, printLogCls)

    var dialog = Metro.dialog.create({
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
          onclick: function() {
            //
          }
        }
      ]
    });

    if (data.indexOf("ALARM: 6") == -1 && data.indexOf("ALARM: 7") == -1 && data.indexOf("ALARM: 8") == -1 && data.indexOf("ALARM: 9") == -1 && data.indexOf("ALARM: 10") == -1) {
      openDialogs.push(dialog);
    }

    setTimeout(function() {
      $(".closeAlarmBtn").focus();
    }, 200, )
    //
  });

  socket.on('toastError', function(data) {
    console.log(data)

    var icon = ''
    var source = "ERROR"
    var string = data
    var printLogCls = "fg-darkRed"
    printLogModern(icon, source, string, printLogCls)

    var dialog = Metro.dialog.create({
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
    }, 200, )
    //
  });

  socket.on("errorsCleared", function(data) {
    if (data) {
      for (i = 0; i < openDialogs.length; i++) {
        Metro.dialog.close(openDialogs[i]);
      }
      openDialogs.length = 0;
    }
  })

  socket.on('progStatus', function(data) {
    $('#controlTab').click();
    $('#consoletab').click();
    console.log(data.port, data.string)
    var string = data.string
    if (string) {
      if (string.indexOf('flash complete') != -1) {
        setTimeout(function() {
          populatePortsMenu();
        }, 400)
      }
      string = string.replace('[31mflash complete.[39m', "<span class='fg-darkRed'><i class='fas fa-times fa-fw fg-darkRed fa-fw'> </i> FLASH FAILED!</span> ");
      string = string.replace('[32m', "<span class='fg-darkGreen'><i class='fas fa-check fa-fw fg-darkGreen fa-fw'></i> ");
      string = string.replace('[39m', "</span>");
      if (string.indexOf("Hash of data verified") != -1) {
        string = "<span class='fg-darkGreen'><i class='fas fa-check fa-fw fg-darkGreen fa-fw'></i>" + string + "</span>"
      }
      if (string.indexOf("could not open port") != -1) {
        string = "<span class='fg-darkRed'><i class='fas fa-times fa-fw fg-darkRed fa-fw'></i>" + string + "</span>"
      }
      if (string.indexOf("something went wrong") != -1) {
        string = "<span class='fg-darkRed'><i class='fas fa-times fa-fw fg-darkRed fa-fw'></i>" + string + "</span>"
      }
      if (string.indexOf("fatal error occurred") != -1) {
        string = "<span class='fg-darkRed'><i class='fas fa-times fa-fw fg-darkRed fa-fw'></i>" + string + "</span>"
      }

      if (string.indexOf("A fatal error occurred: Failed to connect to ESP32: Timed out waiting for packet header") != -1) {
        string = "<span class='fg-darkRed'>" + string + ":  Make sure the device is in BOOTLOADER MODE. Your computer failed to put it into Bootloader mode automatically. You can enter bootloader mode by: Press and hold down MODE, then Press RESET while still holding MODE. Let go of RESET, then wait a second or two and let go of MODE.  Best performed right after starting the Firmware Flashing operation."
      }


      var icon = ''
      var source = " Firmware Upgrade"
      //var string = string
      var printLogCls = "fg-dark"
      printLogModern(icon, source, string, printLogCls)

      if (data.code != undefined) {
        var icon = ''
        var source = " Firmware Upgrade"
        if (data.code == 0) {
          var string = "<i class='fas fa-check fa-fw fg-darkGreen fa-fw'></i> <b>Firmware Update COMPLETED!</b>  Please click the Reset button on the device now, to reboot it with the new firmware. "
          var printLogCls = "fg-darkGreen"
        } else {
          var string = "<i class='fas fa-times fa-fw fg-darkRed fa-fw'></i> <b>Firmware Update FAILED!</b>  Please review the logs above, or try again"
          var printLogCls = "fg-darkRed"
        }
        printLogModern(icon, source, string, printLogCls)
        populatePortsMenu()
      }

    }
  });

  socket.on('status', function(status) {

    if (nostatusyet) {
      // $('#windowtitle').html("OpenBuilds CONTROL v" + status.driver.version)
      setWindowTitle(status)
      if (status.driver.operatingsystem == "rpi") {
        $('#windowtitlebar').hide();
      }
    }
    nostatusyet = false;

    // if (!_.isEqual(status, laststatus)) {
    if (laststatus !== undefined) {

      if (!isJogWidget) {
        if (!_.isEqual(status.machine.position.offset, laststatus.machine.position.offset) || machineCoordinateSpace == false) {
          drawMachineCoordinates(status);
        }
      }

      if (!_.isEqual(status.comms.interfaces.ports, laststatus.comms.interfaces.ports)) {
        var string = "Detected a change in available ports: ";
        for (i = 0; i < status.comms.interfaces.ports.length; i++) {
          string += "[" + status.comms.interfaces.ports[i].path + "]"
        }

        if (!status.comms.interfaces.ports.length) {
          string += "[ No devices connected ]"
        }
        var icon = ''
        var source = "usb ports"
        //var string = string
        var printLogCls = "fg-dark"
        printLogModern(icon, source, string, printLogCls)
        laststatus.comms.interfaces.ports = status.comms.interfaces.ports;
        populatePortsMenu();
      }

      if (!_.isEqual(status.comms.interfaces.networkDevices, laststatus.comms.interfaces.networkDevices)) {
        var string = "Detected a change in IP devices: ";
        for (i = 0; i < status.comms.interfaces.networkDevices.length; i++) {
          string += "[" + status.comms.interfaces.networkDevices[i].ip + "]"
        }

        if (!status.comms.interfaces.networkDevices.length) {
          string += "[ No IP devices ]"
        }
        var icon = ''
        var source = "network ports"
        //var string = string
        var printLogCls = "fg-dark"
        printLogModern(icon, source, string, printLogCls)
        laststatus.comms.interfaces.networkDevices = status.comms.interfaces.networkDevices;
        populatePortsMenu();
      }

    }

    if (status.comms.runStatus.indexOf("Door") == 0) {
      var doorType = status.comms.runStatus.split(":")[1]
      var doorMsg = "";
      if (doorType == 0) {
        doorMsg += "Closed: Ready to Resume"
      }
      if (doorType == 1) {
        doorMsg += "Open: Paused"
      }
      if (doorType == 2) {
        doorMsg += "De-energising"
      }
      if (doorType == 3) {
        doorMsg += "Re-energising"
      }
      $('#runStatus').html("Door : " + doorMsg);
      var icon = ''
      var source = "door"
      var printLogCls = "fg-dark"
    } else {
      $('#runStatus').html("Controller: " + status.comms.runStatus);
    }



    if (!disableDROupdates) {
      if (unit == "mm") {
        var xpos = status.machine.position.work.x.toFixed(2) + unit;
        var ypos = status.machine.position.work.y.toFixed(2) + unit;
        var zpos = status.machine.position.work.z.toFixed(2) + unit;
        var apos = status.machine.position.work.a.toFixed(2) + "deg";

        $(" #xPos ").attr('title', 'X Machine: ' + (status.machine.position.work.x + status.machine.position.offset.x).toFixed(2) + unit + "/ X Work: " + xpos);
        $(" #yPos ").attr('title', 'Y Machine: ' + (status.machine.position.work.y + status.machine.position.offset.y).toFixed(2) + unit + "/ Y Work: " + ypos);
        $(" #zPos ").attr('title', 'Z Machine: ' + (status.machine.position.work.z + status.machine.position.offset.z).toFixed(2) + unit + "/ Z Work: " + zpos);
        $(" #aPos ").attr('title', 'A Machine: ' + (status.machine.position.work.a + status.machine.position.offset.a).toFixed(2) + "deg" + "/ A Work: " + apos);

      } else if (unit == "in") {
        var xpos = (status.machine.position.work.x / 25.4).toFixed(3) + unit;
        var ypos = (status.machine.position.work.y / 25.4).toFixed(3) + unit;
        var zpos = (status.machine.position.work.z / 25.4).toFixed(3) + unit;
        var apos = status.machine.position.work.a.toFixed(2) + "deg";

        $(" #xPos ").attr('title', 'X Machine: ' + ((status.machine.position.work.x / 25.4) + (status.machine.position.offset.x / 25.4)).toFixed(3) + unit + "/ X Work: " + xpos);
        $(" #yPos ").attr('title', 'Y Machine: ' + ((status.machine.position.work.y / 25.4) + (status.machine.position.offset.y / 25.4)).toFixed(3) + unit + "/ Y Work: " + ypos);
        $(" #zPos ").attr('title', 'Z Machine: ' + ((status.machine.position.work.z / 25.4) + (status.machine.position.offset.z / 25.4)).toFixed(3) + unit + "/ Z Work: " + zpos);
        $(" #aPos ").attr('title', 'A Machine: ' + ((status.machine.position.work.a) + (status.machine.position.offset.a)).toFixed(3) + "deg" + "/ A Work: " + apos);


      }

      if ($('#xPos').html() != xpos) {
        $('#xPos').html(xpos);
      }
      if ($('#yPos').html() != ypos) {
        $('#yPos').html(ypos);
      }
      if ($('#zPos').html() != zpos) {
        $('#zPos').html(zpos);
      }
      if ($('#aPos').html() != apos) {
        $('#aPos').html(apos);
      }



    } else {
      $('#xPos').html('disabled');
      $('#yPos').html('disabled');
      $('#zPos').html('disabled');
    }

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
      if ($('#fro').data('slider') && $('#tro').data('slider')) {
        $('#fro').data('slider').val(status.machine.overrides.feedOverride)
        $('#tro').data('slider').val(status.machine.overrides.spindleOverride)
      }
    }

    if (unit == "mm") {
      $("#realFeed").html(status.machine.overrides.realFeed + " mm/min");
    } else if (unit == "in") {
      $("#realFeed").html((status.machine.overrides.realFeed / 25.4).toFixed(0) + " in/min");
    }
    $("#realSpeed").html( status.machine.overrides.realSpindle + " rpm");

    //console.log(JSON.stringify(status.machine.overrides, null, 4));


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





    // Grbl Pins Input Status
    $('.pinstatus').removeClass('alert').addClass('success').html('OFF')
    $('#holdpin').html('HOLD/DOOR:OFF')
    $('#resetpin').html('RST:OFF')
    $('#startpin').html('START:OFF')
    if (status.machine.inputs.length > 0) {
      for (i = 0; i < status.machine.inputs.length; i++) {
        switch (status.machine.inputs[i]) {
          case 'X':
            // console.log('PIN: X-LIMIT');
            $('.xpin').removeClass('success').addClass('alert').html('TRIGGERED')
            break;
          case 'Y':
            // console.log('PIN: Y-LIMIT');
            $('.ypin').removeClass('success').addClass('alert').html('TRIGGERED')
            break;
          case 'Z':
            // console.log('PIN: Z-LIMIT');
            $('.zpin').removeClass('success').addClass('alert').html('TRIGGERED')
            break;
          case 'P':
            // console.log('PIN: PROBE');
            $('.prbpin').removeClass('success').addClass('alert').html('TRIGGERED')
            break;
          case 'D':
            // console.log('PIN: DOOR');
            $('.doorpin').removeClass('success').addClass('alert').html('DOOR OPEN')

            break;
          case 'H':
            // console.log('PIN: HOLD');
            $('.holdpin').removeClass('success').addClass('alert').html('HOLD/DOOR:ON')
            break;
          case 'R':
            // console.log('PIN: SOFTRESET');
            $('.resetpin').removeClass('success').addClass('alert').html('RST:ON')
            break;
          case 'S':
            // console.log('PIN: CYCLESTART');
            $('.startpin').removeClass('success').addClass('alert').html('START:ON')
            break;
        }
      }
    }

    $('#driverver').html("v" + status.driver.version);
    if (!status.machine.firmware.type) {
      $('#firmwarever').html("NOCOMM");
    } else {
      $('#firmwarever').html(status.machine.firmware.type + " v" + status.machine.firmware.version);
    }
    $('#commblocked').html(status.comms.blocked ? "BLOCKED" : "Ready");
    var string = '';
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

    if (status.comms.interfaces.activePort) {
      $('#activeportstatus').html(status.comms.interfaces.activePort)
    } else {
      $('#activeportstatus').html("none")
    }

    // Set the Connection Toolbar option
    setConnectBar(status.comms.connectionStatus, status);
    setControlBar(status.comms.connectionStatus, status)
    setJogPanel(status.comms.connectionStatus, status)
    setConsole(status.comms.connectionStatus, status)
    if (status.comms.connectionStatus != 5) {
      bellstate = false
    };
    if (status.comms.connectionStatus == 0) {
      showGrbl(false, false)
    }

    var updateWCS = false
    if (laststatus == undefined) {
      var updateWCS = true
    } else {
      if (status.machine.modals.coordinatesys != laststatus.machine.modals.coordinatesys) {
        var updateWCS = true
      }
    }


    if (updateWCS) {
      $('#wcsBtn').html(`<span class="fas fa-fw fa-layer-group icon fg-darkGray"></span>` + status.machine.modals.coordinatesys)
      $('.wcsItem').removeClass('checked')
      switch (status.machine.modals.coordinatesys) {
        case "G54":
          $('.wcsItemG54').addClass('checked')
          break;
        case "G55":
          $('.wcsItemG55').addClass('checked')
          break;
        case "G56":
          $('.wcsItemG56').addClass('checked')
          break;
        case "G57":
          $('.wcsItemG57').addClass('checked')
          break;
        case "G58":
          $('.wcsItemG58').addClass('checked')
          break;
        case "G59":
          $('.wcsItemG59').addClass('checked')
          break;
      }

    }


    // Enable or disable 4th axis UI elements
    if (status.machine.has4thAxis) {
      $(".4thaxis-active").show();
    } else {
      $(".4thaxis-active").hide();
    }


    laststatus = status;
    waitingForStatus = false;
  });

  socket.on('features', function(data) {
    // console.log('FEATURES', data)
    for (i = 0; i < data.length; i++) {
      switch (data[i]) {
        case 'Q':
          // console.log('SPINDLE_IS_SERVO Enabled')
          // Also enabled for grblHAL from grbl-settings if $33=50
          $('#enServo').removeClass('alert').addClass('success').html('ON')
          $(".servo-active").show()
          break;
        case 'V': //	Variable spindle enabled
          // console.log('Variable spindle enabled')
          $('#enVariableSpindle').removeClass('alert').addClass('success').html('ON')
          break;
        case 'N': //	Line numbers enabled
          // console.log('Line numbers enabled')
          $('#enLineNumbers').removeClass('alert').addClass('success').html('ON')
          break;
        case 'M': //	Mist coolant enabled
          // console.log('Mist coolant enabled')
          $('#menuMisting').show();
          $('#enMisting').removeClass('alert').addClass('success').html('ON')
          break;
        case 'C': //	CoreXY enabled
          // console.log('CoreXY enabled')
          $('#enCoreXY').removeClass('alert').addClass('success').html('ON')
          break;
        case 'P': //	Parking motion enabled
          // console.log('Parking motion enabled')
          $('#enParking').removeClass('alert').addClass('success').html('ON')
          break;
        case 'Z': //	Homing force origin enabled
          // console.log('Homing force origin enabled')
          $('#enHomingOrigin').removeClass('alert').addClass('success').html('ON')
          break;
        case 'H': //	Homing single axis enabled
          // console.log('Homing single axis enabled')
          $('#enSingleAxisHome').removeClass('alert').addClass('success').html('ON')
          break;
        case 'T': //	Two limit switches on axis enabled
          // console.log('Two limit switches on axis enabled')
          $('#enTwoLimits').removeClass('alert').addClass('success').html('ON')
          break;
        case 'A': //	Allow feed rate overrides in probe cycles
          // console.log('Allow feed rate overrides in probe cycles')
          $('#enFeedOVProbe').removeClass('alert').addClass('success').html('ON')
          break;
        case '$': //	Restore EEPROM $ settings disabled
          // console.log('Restore EEPROM $ settings disabled')
          $('#enEepromSettingsDisable').removeClass('alert').addClass('success').html('ON')
          break;
        case '#': //	Restore EEPROM parameter data disabled
          // console.log('Restore EEPROM parameter data disabled')
          $('#enEepromParamsDisable').removeClass('alert').addClass('success').html('ON')
          break;
        case 'I': //	Build info write user string disabled
          // console.log('Build info write user string disabled')
          $('#enBuildInfoDisabled').removeClass('alert').addClass('success').html('ON')
          break;
        case 'E': //	Force sync upon EEPROM write disabled
          // console.log('Force sync upon EEPROM write disabled')
          $('#enForceSyncEeprom').removeClass('alert').addClass('success').html('ON')
          break;
        case 'W': //	Force sync upon work coordinate offset change disabled
          // console.log('Force sync upon work coordinate offset change disabled')
          $('#enForceSyncWco').removeClass('alert').addClass('success').html('ON')
          break;
        case 'L': //	Homing init lock sets Grbl into an alarm state upon power up
          // console.log('Homing init lock sets Grbl into an alarm state upon power up')
          $('#enHomingInitLock').removeClass('alert').addClass('success').html('ON')
          break;
      }
    }
  })

  socket.on("interfaceOutdated", function(status) {
    console.log("interfaceOutdated", status)
    openFlashingTool();
    var select = $("#flashController").data("select").val("interface")
    //status.interface.firmware.installedVersion
    //status.interface.firmware.availVersion
    var template = `We've detected that you are connected to an OpenBuilds Interface on port ` + status.comms.interfaces.activePort + `.<p>
    It's firmware is currently out of date. You are running <code>v` + status.interface.firmware.installedVersion + `</code> and you can now update to <code>v` + status.interface.firmware.availVersion + `</code>.
    Use the wizard below to update the firmware:
    <hr>
    `

    $("#FlashDialogMsg").html(template);
  })

  $('#sendCommand').on('click', function() {
    var commandValue = $('#command').val();
    sendGcode(commandValue);
    // $('#command').val('');
  });

  $('#command').on('keypress', function(e) {
    if (e.which === 13) {
      $(this).attr("disabled", "disabled");
      var commandValue = $('#command').val();
      sendGcode(commandValue);
      $('#command').val('');
      $(this).removeAttr("disabled");
    }
  });

  var bellflash = setInterval(function() {
    if (!nostatusyet) {
      if (laststatus) {
        if (laststatus.comms.connectionStatus == 5) {
          if (bellstate == false) {
            $('#navbell').hide();
            $('#navbellBtn1').hide();
            $('#navbellBtn2').hide();
            $('#navbellBtn3').hide();
            bellstate = true
          } else {
            $('#navbell').show();
            $('#navbellBtn1').show();
            $('#navbellBtn2').show();
            $('#navbellBtn3').show();
            bellstate = false
          }
        } else {
          $('#navbell').hide();
          $('#navbellBtn1').hide();
          $('#navbellBtn2').hide();
          $('#navbellBtn3').hide();
        }
      }
    }
  }, 200);

};



function scanNetwork() {

  var currentIp = laststatus.driver.ipaddress.split(".")
  var scanTemplate = `
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
        var network = $("#scanIp1").val() + '.' + $("#scanIp2").val() + '.' + $("#scanIp3").val();
        var range = network + ".1-" + network + ".254"
        socket.emit('scannetwork', range)
        $('#controlTab').click();
        $('#consoletab').click();
      }
    }, {
      caption: "Cancel",
      cls: "js-dialog-close",
      onclick: function() {
        //
      }
    }]
  });

}

function selectPort(port) {
  $('#consoletab').click();
  if (port == undefined) {
    port = $("#portUSB").val()
  }
  if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(port)) {
    var data = {
      ip: port,
      port: false,
      baud: false,
      type: "telnet"
    };
    localStorage.setItem("lastip", port);
  } else {
    var data = {
      port: port,
      baud: 115200,
      type: "usb"
    };
  }
  if (port.length > 1) {
    socket.emit('connectTo', data);
    localStorage.setItem("lastGrblPort", port);
  } else {
    printLog("[connect] No Ports/IP selected/entered")
  }
  // socket.emit('connectTo', 'usb,' + $("#portUSB").val() + ',' + '115200');
};

function closePort() {
  socket.emit('closePort', 1);
  populatePortsMenu();
  $('#controlTab').click();
  $('#consoletab').click();
}

// function populateDrivesMenu() { // removed in 1.0.350 due to Drivelist stability issues
//   if (laststatus) {
//     var response = `<select id="select1" data-role="select" class="mt-4"><optgroup label="USB Flashdrives">`
//
//     var usbDrives = []
//
//     for (i = 0; i < laststatus.interface.diskdrives.length; i++) {
//       if (laststatus.interface.diskdrives[i].isUSB || !laststatus.interface.diskdrives[i].isSystem) {
//         usbDrives.push(laststatus.interface.diskdrives[i])
//       }
//     };
//
//     if (!usbDrives.length > 0) {
//       response += `<option value="">Waiting for USB Flashdrive</option>`
//     } else {
//       for (i = 0; i < usbDrives.length; i++) {
//         response += `<option value="` + usbDrives[i].mountpoints[0].path + `">` + usbDrives[i].mountpoints[0].path + ` ` + usbDrives[i].description + `</option>`;
//       };
//     }
//     response += `</optgroup></select>`
//     var select = $("#UsbDriveList").data("select");
//     if (select) {
//       select.data(response);
//       if (!usbDrives.length > 0) {
//         $('#UsbDriveList').parent(".select").addClass('disabled')
//         $("#copyToUsbBtn").attr('disabled', true);
//       } else {
//         $('#UsbDriveList').parent(".select").removeClass('disabled')
//         $("#copyToUsbBtn").attr('disabled', false);
//       }
//     }
//   }
// }

function populatePortsMenu() {
  if (laststatus) {
    var lastGrblPort = localStorage.getItem("lastGrblPort");
    var foundPort = false;
    var response = ``
    if (!laststatus.comms.interfaces.ports.length) {
      response += `<optgroup label="USB/Serial Ports">`
      response += `<option value="">No USB/Serial Ports</option>`
    } else {
      response += `<optgroup label="USB Ports">`
      for (i = 0; i < laststatus.comms.interfaces.ports.length; i++) {
        var port = friendlyPort(i)
        var name = laststatus.comms.interfaces.ports[i].path;
        response += `<option value="` + name + `">` + port.note + " " + name.replace("/dev/tty.", "") + `</option>`;
        if (name == lastGrblPort) {
          foundPort = true;
        }
      };
    }
    response += `</optgroup>`

    // Set USB Ports menu for Firmware Flashing tool before we add the Network ports - you cannot flash over the network
    var select2 = $("#portUSB2").data("select");
    if (select2) {
      select2.data(response);
    }
    $('#portUSB2').parent(".select").removeClass('disabled')

    // Add the Network Ports to the list then populate the Machine Connection selection
    if (!laststatus.comms.interfaces.networkDevices.length) {
      response += `<optgroup label="Network Ports">`
      response += `<option value="">No Network Ports</option>`
    } else {
      response += `<optgroup label="Network Ports">`
      for (i = 0; i < laststatus.comms.interfaces.networkDevices.length; i++) {
        var name = laststatus.comms.interfaces.networkDevices[i].ip;
        if (laststatus.comms.interfaces.networkDevices[i].type) {
          response += `<option value="` + name + `">` + name + " [ " + laststatus.comms.interfaces.networkDevices[i].type + ` ]</option>`;
        } else {
          response += `<option value="` + name + `">` + name + `</option>`;
        }
        if (name == lastGrblPort) {
          foundPort = true;
        }
      };
    }
    response += `</optgroup>`
    var select = $("#portUSB").data("select");
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

function friendlyPort(i) {
  // var likely = false;
  var img = 'usb.png';
  var note = '';
  var manufacturer = laststatus.comms.interfaces.ports[i].manufacturer
  if (manufacturer == `(Standard port types)`) {
    img = 'serial.png'
    note = 'Motherboard Serial Port';
  } else if (laststatus.comms.interfaces.ports[i].productId && laststatus.comms.interfaces.ports[i].vendorId) {
    if (laststatus.comms.interfaces.ports[i].productId == '6015' && laststatus.comms.interfaces.ports[i].vendorId == '1D50') {
      // found Smoothieboard
      img = 'smoothieboard.png';
      note = 'Smoothieware USB Port';
    }
    if (laststatus.comms.interfaces.ports[i].productId == '6001' && laststatus.comms.interfaces.ports[i].vendorId == '0403') {
      // found FTDI FT232
      img = 'usb.png';
      note = 'FTDI USB to Serial';
    }
    if (laststatus.comms.interfaces.ports[i].productId == '6015' && laststatus.comms.interfaces.ports[i].vendorId == '0403') {
      // found FTDI FT230x
      img = 'usb.png';
      note = 'FTDI USD to Serial';
    }
    if (laststatus.comms.interfaces.ports[i].productId == '606D' && laststatus.comms.interfaces.ports[i].vendorId == '1D50') {
      // found TinyG G2
      img = 'usb.png';
      note = 'Tiny G2';
    }
    if (laststatus.comms.interfaces.ports[i].productId == '003D' && laststatus.comms.interfaces.ports[i].vendorId == '2341') {
      // found Arduino Due Prog Port
      img = 'due.png';
      note = 'Arduino Due Prog';
    }
    if (laststatus.comms.interfaces.ports[i].productId == '0043' && laststatus.comms.interfaces.ports[i].vendorId == '2341' || laststatus.comms.interfaces.ports[i].productId == '0001' && laststatus.comms.interfaces.ports[i].vendorId == '2341' || laststatus.comms.interfaces.ports[i].productId == '0043' && laststatus.comms.interfaces.ports[i].vendorId == '2A03') {
      // found Arduino Uno
      img = 'uno.png';
      note = 'Arduino Uno';
    }
    if (laststatus.comms.interfaces.ports[i].productId == '2341' && laststatus.comms.interfaces.ports[i].vendorId == '0042') {
      // found Arduino Mega
      img = 'mega.png';
      note = 'Arduino Mega';
    }
    if (laststatus.comms.interfaces.ports[i].productId == '7523' && laststatus.comms.interfaces.ports[i].vendorId == '1A86') {
      // found CH340
      img = 'uno.png';
      note = 'CH340 Arduino Fake';
    }
    if (laststatus.comms.interfaces.ports[i].productId == 'EA60' && laststatus.comms.interfaces.ports[i].vendorId == '10C4') {
      // found CP2102
      img = 'nodemcu.png';
      note = 'NodeMCU';
    }
    if (laststatus.comms.interfaces.ports[i].productId == '2303' && laststatus.comms.interfaces.ports[i].vendorId == '067B') {
      // found CP2102
      // img = 'nodemcu.png';
      note = 'Prolific USB to Serial';
    }
  } else {
    img = "usb.png";
  }

  return {
    img: img,
    note: note
  };
}

function escapeHTML(html) {
  return document.createElement('div').appendChild(document.createTextNode(html)).parentNode.innerHTML;
}

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + "h" + minutes + "m";
}