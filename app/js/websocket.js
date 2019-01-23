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
    var template = '<p class="pf">';
    var time = new Date();

    template += '<span class="fg-brandColor1">[' + (time.getHours() < 10 ? '0' : '') + time.getHours() + ":" + (time.getMinutes() < 10 ? '0' : '') + time.getMinutes() + ":" + (time.getSeconds() < 10 ? '0' : '') + time.getSeconds() + ']</span> ';
    template += string;
    $('#console').append(template);
    $('#console').scrollTop(($("#console")[0].scrollHeight - $("#console").height()) + 20);
  }
}

// function printUpdateLog(string) {
//   if (string.isString) {
//     // split(/\r\n|\n|\r/);
//     string = string.replace(/\r\n|\n|\r/, "<br />");
//   }
//   if ($('#console p').length > 100) {
//     // remove oldest if already at 300 lines
//     $('#console p').first().remove();
//   }
//   var template = '<p class="pf">';
//   var time = new Date();
//
//   template += '<span class="fg-brandColor1">[' + (time.getHours() < 10 ? '0' : '') + time.getHours() + ":" + (time.getMinutes() < 10 ? '0' : '') + time.getMinutes() + ":" + (time.getSeconds() < 10 ? '0' : '') + time.getSeconds() + ']</span> ';
//   template += string;
//   $('#updateconsole').append(template);
//   $('#updateconsole').scrollTop($("#updateconsole")[0].scrollHeight - $("#updateconsole").height());
// }


function initSocket() {
  socket = io.connect(server); // socket.io init
  printLog("<span class='fg-red'>[ Websocket ] </span><span class='fg-green'>Bidirectional Websocket Interface Started</span>")
  setTimeout(function() {
    populatePortsMenu();
  }, 2000);

  socket.on('disconnect', function() {
    console.log("WEBSOCKET DISCONNECTED")
    printLog("<span class='fg-red'>[ Websocket ] </span><span class='fg-brown'> Disconnected.  OpenBuilds CONTROL probably quit or crashed</span>")
    $("#websocketstatus").html("Disconnected")
  });

  socket.on('connect', function() {
    $("#websocketstatus").html("Connected")
  });

  socket.on('gcodeupload', function(data) {
    printLog("Received new GCODE from API")
    editor.session.setValue(data);
    parseGcodeInWebWorker(data)
    $('#controlTab').click()
    if (webgl) {
      $('#gcodeviewertab').click();
    } else {
      $('#gcodeeditortab').click()
    }
  });

  socket.on('gcodeupload', function(data) {
    printLog("Activated window");
  });

  socket.on('integrationpopup', function(data) {
    printLog("Integration called from " + data)
    // editor.session.setValue(data);
    $('#controlTab').click()
    $('#consoletab').click()
    // gcodeeditortab
  });

  socket.on('updatedata', function(data) {
    // console.log(data.length, data)
    var toPrint = data.response;
    printLog("<span class='fg-red'>[ " + data.command + " ]</span>  <span class='fg-green'>" + toPrint + "</span>")
  });

  socket.on('updateready', function(data) {
    $('#availVersion').html(data)
    Metro.dialog.open('#downloadUpdate')

    // $('#applyupdatesbtn').prop('disabled', false);
  });

  socket.on('updateprogress', function(data) {
    $('#downloadprogress').html(data + "%");
  });

  socket.on('data', function(data) {
    // console.log(data)
    var toPrint = escapeHTML(data.response);

    // Parse Grbl Settings Feedback
    if (data.response.indexOf('$') === 0) {
      if (typeof grblSettings !== 'undefined') {
        grblSettings(data.response)
        var key = data.response.split('=')[0].substr(1);
        var descr = grblSettingCodes[key];
        toPrint = data.response + "  ;" + descr
        printLog("<span class='fg-red'>[ " + data.command + " ]</span>  <span class='fg-green'>" + toPrint + "</span>")
      }
    } else {
      printLog("<span class='fg-red'>[ " + data.command + " ]</span>  <span class='fg-green'>" + toPrint + "</span>")
    };

  });

  socket.on("grbl", function(data) {
    showGrbl(true)
  });

  socket.on("prbResult", function(data) {
    z0proberesult(data)
  });

  function showGrbl(bool) {
    if (bool) {
      sendGcode('$$')
      sendGcode('$I')
      $("#grblButtons").show()
      $("#firmwarename").html('Grbl')
    } else {
      $("#grblButtons").hide()
      $("#firmwarename").html('')
    }
  }


  socket.on("machinename", function(data) {
    setMachineButton(data)
  });
  socket.on("queueCount", function(data) {
    if (laststatus) {
      if (laststatus.comms.connectionStatus == 3) {
        editor.gotoLine(parseInt(data[1]) - parseInt(data[0]));
      }
    }
    $('#gcodesent').html("Queue: " + parseInt(data[0]));

    // calc percentage
    var left = parseInt(data[0])
    var total = parseInt(data[1])
    var done = total - left;
    var donepercent = parseInt(done / total * 100)
    var progressbar = $("#progressbar").data("progress");
    if (progressbar) {
      progressbar.val(donepercent);
    }
    // }
  })

  socket.on('toastError', function(data) {
    // console.log("toast", data)
    // toast("<i class='fas fa-exclamation-triangle'></i> " + data, null, 2300, "bg-red fg-white");
    Metro.dialog.create({
      content: "<i class='fas fa-exclamation-triangle fg-red'></i>  " + data
    });
    //
  });

  socket.on('toastSuccess', function(data) {
    console.log("toast", data)
    toast("<i class='fas fa-exclamation-triangle'></i> " + data, null, 2300, "bg-green fg-white");
    //
  });

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
      string = string.replace('[31mflash complete.[39m', "<span class='fg-red'><i class='fas fa-times fa-fw fg-red fa-fw'> </i> FLASH FAILED!</span> ");
      string = string.replace('[32m', "<span class='fg-green'><i class='fas fa-check fa-fw fg-green fa-fw'></i> ");
      string = string.replace('[39m', "</span>");
      printLog("<span class='fg-red'>[ Firmware Upgrade ] </span>" + string)

      // $('#sendCommand').click();
    }
  });

  socket.on('status', function(status) {

    if (nostatusyet) {
      $('#windowtitle').html("OpenBuilds CONTROL v" + status.driver.version)
    }
    nostatusyet = false;

    // if (!_.isEqual(status, laststatus)) {
    if (laststatus !== undefined) {
      if (!_.isEqual(status.comms.interfaces.ports, laststatus.comms.interfaces.ports)) {
        var string = "Detected a change in available ports: ";
        for (i = 0; i < status.comms.interfaces.ports.length; i++) {
          string += "[" + status.comms.interfaces.ports[i].comName + "]"
        }
        printLog(string)
        laststatus.comms.interfaces.ports = status.comms.interfaces.ports;
        populatePortsMenu();
      }
    }

    $('#runStatus').html("Controller: " + status.comms.runStatus);


    // if (status.machine.firmware.state.units == "G20") {
    //   var unit = " in"
    // } else if (status.machine.firmware.state.units == "G21") {
    //   var unit = " mm"
    // } else {
    var unit = " mm"
    // }

    if (unit == " mm") {
      var xpos = status.machine.position.work.x + unit;
      var ypos = status.machine.position.work.y + unit;
      var zpos = status.machine.position.work.z + unit;
    } else if (unit == " in") {
      var xpos = (status.machine.position.work.x / 25.4).toFixed(2) + unit;
      var ypos = (status.machine.position.work.y / 25.4).toFixed(2) + unit;
      var zpos = (status.machine.position.work.z / 25.4).toFixed(2) + unit;
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

    if (webgl) {
      if (!isJogWidget) {
        if (!simRunning) {
          if (object) {
            if (object.userData.inch) {
              cone.position.x = status.machine.position.work.x * 0.0393701
              cone.position.y = status.machine.position.work.y * 0.0393701
              cone.position.z = (parseFloat(status.machine.position.work.z * 0.0393701) + 20)
            } else {
              cone.position.x = status.machine.position.work.x
              cone.position.y = status.machine.position.work.y
              cone.position.z = (parseFloat(status.machine.position.work.z) + 20)
            }
          }

        }
      }
    }

    // $('#T0CurTemp').html(status.machine.temperature.actual.t0.toFixed(1) + " / " + status.machine.temperature.setpoint.t0.toFixed(1));
    // $('#T1CurTemp').html(status.machine.temperature.actual.t1.toFixed(1) + " / " + status.machine.temperature.setpoint.t1.toFixed(1));
    // $('#B0CurTemp').html(status.machine.temperature.actual.b.toFixed(1) + " / " + status.machine.temperature.setpoint.b.toFixed(1));
    // setTemp(status.machine.temperature.actual.t0, status.machine.temperature.actual.t1, status.machine.temperature.actual.b)

    if (safeToUpdateSliders) {
      if ($('#fro').data('slider') && $('#tro').data('slider')) {
        $('#fro').data('slider').val(status.machine.overrides.feedOverride)
        $('#tro').data('slider').val(status.machine.overrides.spindleOverride)
      }
    }

    // Grbl Pins Input Status
    $('.pinstatus').removeClass('alert').addClass('success').html('OFF')
    $('#holdpin').html('HOLD:OFF')
    $('#resetpin').html('RST:OFF')
    $('#startpin').html('START:OFF')
    if (status.machine.inputs.length > 0) {
      for (i = 0; i < status.machine.inputs.length; i++) {
        switch (status.machine.inputs[i]) {
          case 'X':
            // console.log('PIN: X-LIMIT');
            $('#xpin').removeClass('success').addClass('alert').html('ON')
            break;
          case 'Y':
            // console.log('PIN: Y-LIMIT');
            $('#ypin').removeClass('success').addClass('alert').html('ON')
            break;
          case 'Z':
            // console.log('PIN: Z-LIMIT');
            $('#zpin').removeClass('success').addClass('alert').html('ON')
            break;
          case 'P':
            // console.log('PIN: PROBE');
            $('#prbpin').removeClass('success').addClass('alert').html('ON')
            break;
          case 'D':
            // console.log('PIN: DOOR');
            $('#doorpin').removeClass('success').addClass('alert').html('ON')
            break;
          case 'H':
            // console.log('PIN: HOLD');
            $('#holdpin').removeClass('success').addClass('alert').html('HOLD:ON')
            break;
          case 'R':
            // console.log('PIN: SOFTRESET');
            $('#resetpin').removeClass('success').addClass('alert').html('RST:ON')
            break;
          case 'S':
            // console.log('PIN: CYCLESTART');
            $('#startpin').removeClass('success').addClass('alert').html('START:ON')
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
    $('#runstatus').html(status.comms.runStatus);
    $('#drvqueue').html(status.comms.queue);
    // if (status.machine.firmware.buffer.length > 0) {
    //   $('#buffstatus').html(status.machine.firmware.buffer[0] + " blocks / " + status.machine.firmware.buffer[1] + " bytes");
    // } else {
    //   $('#buffstatus').html("NOCOMM");
    // }

    // if (status.machine.firmware.state) {
    //   if (status.machine.firmware.state.workoffset.length) {
    //     $('#wcostatus').html(status.machine.firmware.state.workoffset);
    //   } else {
    //     $('#wcostatus').html("NOCOMM");
    //   }
    //   if (status.machine.firmware.state.plane.length) {
    //     $('#planestatus').html(status.machine.firmware.state.plane);
    //   } else {
    //     $('#planestatus').html("NOCOMM");
    //   }
    //   if (status.machine.firmware.state.absrel.length) {
    //     if (status.machine.firmware.state.absrel == "G90") {
    //       $('#absrel').html(status.machine.firmware.state.absrel + " (absolute)");
    //     } else if (status.machine.firmware.state.absrel == "G91") {
    //       $('#absrel').html(status.machine.firmware.state.absrel + " (relative)");
    //     }
    //   } else {
    //     $('#absrel').html("NOCOMM");
    //   }
    //   if (status.machine.firmware.state.units.length) {
    //     if (status.machine.firmware.state.units == "G20") {
    //       $('#units').html(status.machine.firmware.state.units + " (inches)");
    //       $('#dist01label').html("0.1in");
    //       $('#dist1label').html("1in");
    //       $('#dist10label').html("10in");
    //       $('#dist100label').html("100in");
    //     } else if (status.machine.firmware.state.units == "G21") {
    //       $('#units').html(status.machine.firmware.state.units + " (mm)");
    //       $('#dist01label').html("0.1mm");
    //       $('#dist1label').html("1mm");
    //       $('#dist10label').html("10mm");
    //       $('#dist100label').html("100mm");
    //     }
    //   } else {
    //     $('#units').html("NOCOMM");
    //   }
    //
    if (status.comms.interfaces.activePort) {
      $('#activeportstatus').html(status.comms.interfaces.activePort)
    } else {
      $('#activeportstatus').html("none")
    }
    //
    // }

    // Set the Connection Toolbar option
    setConnectBar(status.comms.connectionStatus, status);
    setControlBar(status.comms.connectionStatus, status)
    setJogPanel(status.comms.connectionStatus, status)
    setConsole(status.comms.connectionStatus, status)
    if (status.comms.connectionStatus != 5) {
      bellstate = false
    };
    if (status.comms.connectionStatus == 0) {
      showGrbl(false)
    }

    laststatus = status;
  });

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

function selectPort() {
  socket.emit('connectTo', 'usb,' + $("#portUSB").val() + ',' + '115200');
};

function closePort() {
  socket.emit('closePort', 1);
  populatePortsMenu();
  $('.mdata').val('');
}

function populatePortsMenu() {
  var response = `<select id="select1" data-role="select" class="mt-4"><optgroup label="USB Ports">`
  for (i = 0; i < laststatus.comms.interfaces.ports.length; i++) {
    var port = friendlyPort(i)
    response += `<option value="` + laststatus.comms.interfaces.ports[i].comName + `">` + laststatus.comms.interfaces.ports[i].comName + " " + port.note + `</option>`;
  };
  response += `</optgroup></select>`
  var select = $("#portUSB").data("select");
  select.data(response);
  var select2 = $("#portUSB2").data("select");
  select2.data(response);
  $('#portUSB').parent(".select").removeClass('disabled')
  $('#portUSB2').parent(".select").removeClass('disabled')
  $("#connectBtn").attr('disabled', false);
}

function sendGcode(gcode) {
  if (gcode) {
    socket.emit('runCommand', gcode);
  }
}

// function ContextLineRun() { //Rightclick Contextmenu in Ace editor: Send single line of gcode
//   sendGcode(editor.session.getLine(editor.getSelectionRange().start.row));
//   $('#editorContextMenu').hide();
// }


function feedOverride(step) {
  if (socket) {
    socket.emit('feedOverride', step);
  }
}

function spindleOverride(step) {
  if (socket) {
    socket.emit('spindleOverride', step);
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