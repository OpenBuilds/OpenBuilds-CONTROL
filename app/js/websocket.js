var socket, laststatus;;
var server = ''; //192.168.14.100';
var programBoard = {};
var grblParams = {}
var smoothieParams = {}
var sduploading;
var nostatusyet = true;
var safeToUpdateSliders = false;
var laststatus
var simstopped = false;
var bellstate = false;
var toast = Metro.toast.create;

$(document).ready(function() {
  initSocket();

  $("#command").keyup(function(event) {
    event.preventDefault()
    if (event.keyCode === 13) {
      $("#sendCommand").click();
    }
    return false;
  });

  $("form").submit(function() {
    return false;
  });


});

function printLog(string) {
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

  template += '<span class="fg-brandColor1">[' + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + ']</span> ';
  template += string;
  $('#console').append(template);
  $('#console').scrollTop($("#console")[0].scrollHeight - $("#console").height());
}


function initSocket() {
  socket = io.connect(server); // socket.io init
  printLog("Connected to backend ")
  setTimeout(function() {
    populatePortsMenu();
  }, 2000);

  socket.on('disconnect', function() {
    console.log("WEBSOCKET DISCONNECTED")
  });

  socket.on('data', function(data) {
    // console.log(data.length, data)
    var toPrint = data;
    if (data.indexOf("Done saving file.") != -1) {
      $('#sdupload_modal').modal('hide');
      $("#sduploadform").show()
      $("#sduploadprogress").hide()
      $("#sduploadbtn").prop('disabled', false);
      $("#sduploadcancelbtn").prop('disabled', false);
      $("#sdmodalclosebtn").prop('disabled', false);
      $('#sdprogressup').css('width', '0%').attr('aria-valuenow', 0);
    }
    if (data.indexOf("End file list") != -1) {
      // We just got an M20 sd listing back... lets update UI
      setTimeout(function() {
        sdListPopulate();
      }, 600);
    }

    // Parse Grbl Settings Feedback
    if (data.indexOf('$') === 0) {
      grblSettings(data)
      var key = data.split('=')[0].substr(1);
      var descr = grblSettingCodes[key];
      toPrint = data + "  ;" + descr
    };
    printLog(toPrint)

  });

  socket.on("grbl", function(data) {
    showGrbl(true)
  });

  function showGrbl(bool) {
    if (bool) {
      sendGcode('$$')
      $("#grblButtons").show()
      $("#firmwarename").html('Grbl')
    } else {
      $("#grblButtons").hide()
      $("#firmwarename").html('')
    }
  }

  socket.on("queueCount", function(data) {
    if (laststatus) {
      if (laststatus.comms.connectionStatus == 3) {
        editor.gotoLine(parseInt(data[1]) - parseInt(data[0]))
      }
    }
    $('#gcodesent').html("Queue: " + parseInt(data[0]));
    // }
    sduploading = data[2];
    if (sduploading) {
      var percent = 100 - (parseInt(data[0]) / parseInt(data[1]) * 100)
      $('#sdprogressup').css('width', percent + '%').attr('aria-valuenow', percent);
    }
  })

  socket.on('toastError', function(data) {
    // console.log("toast", data)
    toast("<i class='fas fa-exclamation-triangle'></i> " + data, null, 5000, "bg-red fg-white");
    //
  });
  socket.on('toastSuccess', function(data) {
    console.log("toast", data)
    toast("<i class='fas fa-exclamation-triangle'></i> " + data, null, 5000, "bg-green fg-white");
    //
  });

  socket.on('status', function(status) {
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
    // console.log(status.comms.connectionStatus);
    if (status.comms.connectionStatus == 0) { // Not Connected Yet
      // $("#portUSB").val(status.comms.interfaces.activePort);
      $('#connectStatus').html("Port: Not Connected");
      $("#disconnectBtn").hide();
      $("#connectBtn").attr('disabled', false);
      $(".grblmode").attr('disabled', true);
      $("#playpauseresumelabel").html("Run<br>Job")
      $("#playpauseresumeicon").html("<i class='fas fa-play'></i>")
      $("#jogcontrols").slideUp("fast");
      $("#editor").css('height', 'calc(' + 100 + 'vh - ' + 210 + 'px)');
      editor.resize()
      $("#connectBtn").show();
      if (!$('#command').attr('disabled')) {
        $('#command').attr('disabled', true);
      }
      $("#sendCommand").prop('disabled', true);
      if ($('#portUSB').val() != "") {
        $('#portUSB').parent(".select").removeClass('disabled')
      } else {
        $('#portUSB').parent(".select").addClass('disabled')
      }
      $('#portUSB').parent(".select").addClass('success')
      $('#portUSB').parent(".select").removeClass('alert')
      showGrbl(false)
      bellstate = false
    } else if (status.comms.connectionStatus == 1 || status.comms.connectionStatus == 2) { // Connected, but not Playing yet
      $("#portUSB").val(status.comms.interfaces.activePort);
      $('#connectStatus').html("Port: Connected");
      $("#connectBtn").hide();
      $("#connectBtn").attr('disabled', false);
      $("#disconnectBtn").show();
      $(".grblmode").attr('disabled', false);
      $("#playpauseresumelabel").html("Run<br>Job")
      $("#playpauseresumeicon").html("<i class='fas fa-play'></i>")
      $("#jogcontrols").slideDown("fast");
      $("#editor").css('height', 'calc(' + 100 + 'vh - ' + 405 + 'px)');
      editor.resize()
      if (editor.session.getLength() < 2) {
        $("#runBtn").attr('disabled', true);
      } else {
        $("#runBtn").attr('disabled', false);
      }
      $("#command").attr('disabled', false);
      $("#sendCommand").prop('disabled', false);
      $('#portUSB').parent(".select").addClass('disabled')
      $('#portUSB').parent(".select").removeClass('success')
      $('#portUSB').parent(".select").addClass('alert')
      bellstate = false
    } else if (status.comms.connectionStatus == 3) { // Busy Streaming GCODE
      $("#portUSB").val(status.comms.interfaces.activePort);
      $('#connectStatus').html("Port: Connected");
      $("#connectBtn").hide();
      $("#connectBtn").attr('disabled', false);
      $("#disconnectBtn").show();
      $(".grblmode").attr('disabled', false);
      $("#playpauseresumelabel").html("Pause<br>Job")
      $("#playpauseresumeicon").html("<i class='fas fa-pause'></i>")
      $("#jogcontrols").slideUp("fast");
      $("#editor").css('height', 'calc(' + 100 + 'vh - ' + 210 + 'px)');
      editor.resize()
      $("#command").attr('disabled', true);
      $("#sendCommand").prop('disabled', true);
      $('#portUSB').parent(".select").addClass('disabled')
      $('#portUSB').parent(".select").removeClass('success')
      $('#portUSB').parent(".select").addClass('alert')
      bellstate = false
    } else if (status.comms.connectionStatus == 4) { // Paused
      $("#portUSB").val(status.comms.interfaces.activePort);
      $('#connectStatus').html("Port: Connected");
      $("#connectBtn").hide();
      $("#connectBtn").attr('disabled', false);
      $("#disconnectBtn").show();
      $(".grblmode").attr('disabled', false);
      $("#playpauseresumelabel").html("Resume<br>Job")
      $("#playpauseresumeicon").html("<i class='fas fa-play'></i>")
      $("#jogcontrols").slideDown("fast")
      $("#editor").css('height', 'calc(' + 100 + 'vh - ' + 405 + 'px)');
      editor.resize()
      $("#command").attr('disabled', false);
      $("#sendCommand").prop('disabled', false);
      $('#portUSB').parent(".select").addClass('disabled')
      $('#portUSB').parent(".select").removeClass('success')
      $('#portUSB').parent(".select").addClass('alert')
      bellstate = false
    } else if (status.comms.connectionStatus == 5) { // Alarm State
      $("#portUSB").val(status.comms.interfaces.activePort);
      $('#connectStatus').html("Port: Connected");
      $("#connectBtn").hide();
      $("#connectBtn").attr('disabled', false);
      $("#disconnectBtn").show();
      $(".grblmode").attr('disabled', true);
      $("#jogcontrols").hide();
      $("#editor").css('height', 'calc(' + 100 + 'vh - ' + 210 + 'px)');
      editor.resize()
      $("#command").attr('disabled', false);
      $("#sendCommand").prop('disabled', false);
      $('#portUSB').parent(".select").addClass('disabled')
      $('#portUSB').parent(".select").removeClass('success')
      $('#portUSB').parent(".select").addClass('alert')
    }

    $('#runStatus').html("Controller: " + status.comms.runStatus);

    if ($('#xPos').html() != status.machine.position.work.x + " mm") {
      $('#xPos').html(status.machine.position.work.x + " mm");
    }
    if ($('#yPos').html() != status.machine.position.work.y + " mm") {
      $('#yPos').html(status.machine.position.work.y + " mm");
    }
    if ($('#zPos').html() != status.machine.position.work.z + " mm") {
      $('#zPos').html(status.machine.position.work.z + " mm");
    }

    // $('#ModernXPos').html(parseFloat(status.machine.position.work.x).toFixed(3));
    // $('#ModernYPos').html(parseFloat(status.machine.position.work.y).toFixed(3));
    // $('#ModernZPos').html(parseFloat(status.machine.position.work.z).toFixed(3));
    // $('#ModernAPos').html(parseFloat(status.machine.position.work.a).toFixed(3));
    // $('#oF').html(status.machine.overrides.feedOverride);
    // $('#oS').html(status.machine.overrides.spindleOverride);
    // $('#T0CurTemp').html(status.machine.temperature.actual.t0.toFixed(1) + " / " + status.machine.temperature.setpoint.t0.toFixed(1));
    // $('#T1CurTemp').html(status.machine.temperature.actual.t1.toFixed(1) + " / " + status.machine.temperature.setpoint.t1.toFixed(1));
    // $('#B0CurTemp').html(status.machine.temperature.actual.b.toFixed(1) + " / " + status.machine.temperature.setpoint.b.toFixed(1));

    if (safeToUpdateSliders) {
      $('#fro').data('slider').val(status.machine.overrides.feedOverride)
      $('#tro').data('slider').val(status.machine.overrides.spindleOverride)

      // $("#FROslider").slider('option', 'value', status.machine.overrides.feedOverride);
      // $("#handle").text(status.machine.overrides.feedOverride + "%");
      //
      // $("#SROslider").slider('option', 'value', status.machine.overrides.spindleOverride);
      // $("#handle2").text(status.machine.overrides.spindleOverride + "%");
    }

    // setTemp(status.machine.temperature.actual.t0, status.machine.temperature.actual.t1, status.machine.temperature.actual.b)

    if (simstopped) {
      cone.position.x = status.machine.position.work.x;
      cone.position.y = status.machine.position.work.y;
      cone.position.z = (parseFloat(status.machine.position.work.z) + 20);
    }

    // console.log(status.machine.drivers.x.stallGuard)
    var amplitude = (status.machine.drivers.x.stallGuard.stallGuardReading) / 10.24;
    $("#xMotorVU").attr("style", "-webkit-clip-path: inset(0 " + (amplitude) + "% 0 0);")

    var amplitude = (status.machine.drivers.y.stallGuard.stallGuardReading) / 10.24;
    $("#yMotorVU").attr("style", "-webkit-clip-path: inset(0 " + (amplitude) + "% 0 0);")

    var amplitude = (status.machine.drivers.z.stallGuard.stallGuardReading) / 10.24;
    $("#zMotorVU").attr("style", "-webkit-clip-path: inset(0 " + (amplitude) + "% 0 0);")

    var amplitude = (status.machine.drivers.a.stallGuard.stallGuardReading) / 10.24;
    $("#aMotorVU").attr("style", "-webkit-clip-path: inset(0 " + (amplitude) + "% 0 0);")

    laststatus = status;
    // }

  });

  $('#sendCommand').on('click', function() {
    var commandValue = $('#command').val();
    sendGcode(commandValue);
    $('#command').val('');
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

  $("#sdtogglemodal").on("click", function() {
    $('#sdupload_modal').modal('show');
    if (sduploading) {
      $("#sduploadform").hide()
      $("#sduploadprogress").show()
    } else {
      $("#sduploadform").show()
      $("#sduploadprogress").hide()
    }
  })

  $("#sdlist").on("click", function() {
    sendGcode("M20");
  })


  var bellflash = setInterval(function() {
    if (!nostatusyet) {
      if (laststatus) {
        if (laststatus.comms.connectionStatus == 5) {
          if (bellstate == false) {
            // $('#navbell').addClass("text-dark");
            // $('#navbell').removeClass("text-danger");
            $('#navbell').hide();
            $('#navbellBtn').hide();
            bellstate = true
          } else {
            // $('#navbell').removeClass("text-dark");
            // $('#navbell').addClass("text-danger");
            $('#navbell').show();
            $('#navbellBtn').show();
            bellstate = false
          }
        } else {
          $('#navbell').hide();
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
  $('#portUSB').parent(".select").removeClass('disabled')
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

function sdListPopulate() {
  $('#sdfilelist').empty();
  if (laststatus.machine.sdcard.list.length > 0) {
    for (i = laststatus.machine.sdcard.list.length - 1; i >= 0; i--) {
      var name = laststatus.machine.sdcard.list[i]
      console.log(name);
      if (name.length > 25) {
        var newname = ""
        newname += name.substring(0, 10)
        newname += "..."
        newname += name.substring(name.length - 10)
        name = newname;
      }

      if (name.indexOf("config") != -1 || name.indexOf("CONFIG") != -1) {
        $("#sdfilelist").append(`<tr><td><i class="far fa-file"></i> ` + name + `</td><td></td></tr>`);
      } else if (name.indexOf("FIRMWARE.CUR") != -1 || name.indexOf("firmware.cur") != -1) {
        $("#sdfilelist").append(`<tr><td><i class="far fa-file"></i> ` + name + `</td><td></td></tr>`);
      } else {
        $("#sdfilelist").append(`<tr>
          <td>
            <i class="far fa-file"></i> ` + name + `
          </td>
          <td>
            <div class="btn-group btn-group-xs" role="group">
              <button type="button" class="btn btn-xs btn-outline-secondary" onclick="sendGcode('rm /sd/` + laststatus.machine.sdcard.list[i].replace(/(\r\n|\n|\r)/gm, "") + `'); sendGcode('M20'); ">Delete</button>
              <button type="button" class="btn btn-xs btn-outline-secondary" onclick="sendGcode('M32 ` + laststatus.machine.sdcard.list[i].replace(/(\r\n|\n|\r)/gm, "") + `'); sendGcode('M20'); ">Print</button>
            </div>
          </td>
        </tr>`);
      }
    }
    $("#sdlist_modal").modal("show")
  }

}

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

function sdUpload() {
  $("#sduploadbtn").prop('disabled', true);
  $("#sduploadcancelbtn").prop('disabled', true);
  $("#sdmodalclosebtn").prop('disabled', true);
  $("#sduploadform").hide()
  $("#sduploadprogress").show()
  var filename = $("#sdfilename").val();
  var gcode = editor.getValue()
  var data = []
  data.push(filename)
  data.push(gcode)
  socket.emit("saveToSd", data)
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