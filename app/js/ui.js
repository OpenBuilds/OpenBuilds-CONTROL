// Toolbar with USB port/connect/disconnect
function setConnectBar(val, status) {
  if (val == 0) { // Not Connected Yet
    // Status Badge
    $('#connectStatus').html("Port: Not Connected");

    $("#clearSettings").attr('disabled', true);
    $("#clearWCO").attr('disabled', true);
    $("#clearEEPROM").attr('disabled', true);

    // Connect/Disconnect Button
    $("#disconnectBtn").hide();
    $("#flashBtn").hide();
    $('#portUSB').parent().show();
    $("#connectBtn").show();
    $("#driverBtn").show();
    if ($('#portUSB').val() != "") {
      $("#connectBtn").attr('disabled', false);
    } else {
      $("#connectBtn").attr('disabled', true);
    }
    // Port Dropdown
    if ($('#portUSB').val() != "") {
      $('#portUSB').parent(".select").removeClass('disabled')
    } else {
      $('#portUSB').parent(".select").addClass('disabled')
    }
    $('#portUSB').parent(".select").addClass('success')
    $('#portUSB').parent(".select").removeClass('alert')
    $('.macrobtn').addClass('disabled')
    // Set Port Dropdown to Current Value
    // Not applicable to Status 0 as its set by populatePortsMenu();

  } else if (val == 1 || val == 2) { // Connected, but not Playing yet
    // Status Badge
    $('#connectStatus').html("Port: Connected");

    $("#clearSettings").attr('disabled', false);
    $("#clearWCO").attr('disabled', false);
    $("#clearEEPROM").attr('disabled', false);
    // Connect/Disconnect Button
    $("#connectBtn").hide();
    $("#driverBtn").hide();
    $('#portUSB').parent().hide();
    $("#connectBtn").attr('disabled', false);
    $("#disconnectBtn").show();
    $("#flashBtn").hide();

    // Port Dropdown
    $('#portUSB').parent(".select").addClass('disabled')
    $('#portUSB').parent(".select").removeClass('success')
    $('#portUSB').parent(".select").addClass('alert')
    // Set Port Dropdown to Current Value
    $("#portUSB").val(status.comms.interfaces.activePort);
    $('.macrobtn').removeClass('disabled')

  } else if (val == 3) { // Busy Streaming GCODE
    // Status Badge
    $('#connectStatus').html("Port: Connected");

    $("#clearSettings").attr('disabled', true);
    $("#clearWCO").attr('disabled', true);
    $("#clearEEPROM").attr('disabled', true);
    // Connect/Disconnect Button
    $("#connectBtn").hide();
    $("#driverBtn").hide();
    $('#portUSB').parent().hide();
    $("#connectBtn").attr('disabled', false);
    $("#disconnectBtn").show();
    $("#flashBtn").hide();
    // Port Dropdown
    $('#portUSB').parent(".select").addClass('disabled')
    $('#portUSB').parent(".select").removeClass('success')
    $('#portUSB').parent(".select").addClass('alert')
    // Set Port Dropdown to Current Value
    $("#portUSB").val(status.comms.interfaces.activePort);
    $('.macrobtn').addClass('disabled')

  } else if (val == 4) { // Paused
    // Status Badge
    $('#connectStatus').html("Port: Connected");

    $("#clearSettings").attr('disabled', true);
    $("#clearWCO").attr('disabled', true);
    $("#clearEEPROM").attr('disabled', true);
    // Connect/Disconnect Button
    $("#connectBtn").hide();
    $("#driverBtn").hide();
    $('#portUSB').parent().hide();
    $("#connectBtn").attr('disabled', false);
    $("#disconnectBtn").show();
    $("#flashBtn").hide();
    // Port Dropdown
    $('#portUSB').parent(".select").addClass('disabled')
    $('#portUSB').parent(".select").removeClass('success')
    $('#portUSB').parent(".select").addClass('alert')
    // Set Port Dropdown to Current Value
    $("#portUSB").val(status.comms.interfaces.activePort);
    $('.macrobtn').addClass('disabled')

  } else if (val == 5) { // Alarm State
    // Status Badge
    $('#connectStatus').html("Port: Connected");
    $("#clearSettings").attr('disabled', false);
    $("#clearWCO").attr('disabled', false);
    $("#clearEEPROM").attr('disabled', false);
    // Connect/Disconnect Button
    $("#connectBtn").hide();
    $("#driverBtn").hide();
    $('#portUSB').parent().hide();
    $("#connectBtn").attr('disabled', false);
    $("#disconnectBtn").show();
    $("#flashBtn").hide();
    // Port Dropdown
    $('#portUSB').parent(".select").addClass('disabled')
    $('#portUSB').parent(".select").removeClass('success')
    $('#portUSB').parent(".select").addClass('alert')
    // Set Port Dropdown to Current Value
    $("#portUSB").val(status.comms.interfaces.activePort);
    $('.macrobtn').addClass('disabled')

  } else if (val == 6) { // Firmware Upgrade State
    // Status Badge
    $('#connectStatus').html("Port: Flashing");
    // Connect/Disconnect Button
    $("#clearSettings").attr('disabled', true);
    $("#clearWCO").attr('disabled', true);
    $("#clearEEPROM").attr('disabled', true);
    $("#connectBtn").hide();
    $("#driverBtn").hide();
    $('#portUSB').parent().hide();
    $("#connectBtn").attr('disabled', false);
    $("#disconnectBtn").hide();
    $("#flashBtn").show();
    // Port Dropdown
    $('#portUSB').parent(".select").addClass('disabled')
    $('#portUSB').parent(".select").removeClass('success')
    $('#portUSB').parent(".select").addClass('alert')
    // Set Port Dropdown to Current Value
    $("#portUSB").val(status.comms.interfaces.activePort);
    $('.macrobtn').addClass('disabled')


  }
}

// Toolbar with play/pause/stop
function setControlBar(val, status) {
  if (val == 0) { // Not Connected Yet
    if (toolchanges && toolchanges.length) {
      $('#runToolsBtn').hide().attr('disabled', true);
      $('#runBtn').hide().attr('disabled', true);
    } else {
      $('#runToolsBtn').hide().attr('disabled', true);
      $('#runBtn').hide().attr('disabled', true);
    }
    $('#grblProbeMenu').show().attr('disabled', true);
    $('#chkSize').show().attr('disabled', true);
    $('#resumeBtn').hide().attr('disabled', true);
    $('#pauseBtn').hide().attr('disabled', true);
    $('#stopBtn').hide().attr('disabled', true);
    $('#toolBtn').hide().attr('disabled', true);
    $('#toolBtn2').hide().attr('disabled', true);
    if (laststatus != undefined && laststatus.machine.firmware.type == 'grbl') {
      if (grblParams['$22'] == 1) {
        $('#homeBtn').hide().attr('disabled', true);
      } else {
        $('#homeBtn').hide().attr('disabled', true);
      }
    }
    $('.estop').hide()
  } else if (val == 1 || val == 2) { // Connected, but not Playing yet
    $('#grblProbeMenu').show().attr('disabled', false);
    if (typeof ace !== 'undefined') {
      if (toolchanges.length) {
        if (status.machine.inputs.includes('D')) {
          $('#runToolsBtn').show().attr('disabled', true);
          $('#runBtn').hide().attr('disabled', true);
        } else {
          $('#runToolsBtn').show().attr('disabled', editor.session.getLength() < 2);
          $('#runBtn').hide().attr('disabled', editor.session.getLength() < 2);
        }
        if (webgl) {
          $('#chkSize').show().attr('disabled', editor.session.getLength() < 2);
        } else {
          $('#chkSize').show().attr('disabled', true);
        }

      } else {
        $('#runToolsBtn').hide().attr('disabled', editor.session.getLength() < 2);
        if (status.machine.inputs.includes('D')) {
          $('#runBtn').show().attr('disabled', true);
        } else {
          $('#runBtn').show().attr('disabled', editor.session.getLength() < 2);
        }

        if (webgl) {
          $('#chkSize').show().attr('disabled', editor.session.getLength() < 2);
        } else {
          $('#chkSize').show().attr('disabled', true);
        }
      }

    } else {
      if (status.machine.inputs.includes('D')) {
        $('#runBtn').show().attr('disabled', true);
      } else {
        $('#runBtn').show().attr('disabled', false);
      }
      $('#runToolsBtn').hide().attr('disabled', false);
    }
    $('#resumeBtn').hide().attr('disabled', true);
    $('#pauseBtn').hide().attr('disabled', true);
    $('#stopBtn').show().attr('disabled', true);
    $('#toolBtn').show().attr('disabled', false);
    $('#toolBtn2').show().attr('disabled', false);
    if (laststatus != undefined && laststatus.machine.firmware.type == 'grbl') {
      if (grblParams['$22'] == 1) {
        $('#homeBtn').show().attr('disabled', false);
      } else {
        $('#homeBtn').show().attr('disabled', true);
      }
    }
    $('.estop').show()
  } else if (val == 3) { // Busy Streaming GCODE
    $('#grblProbeMenu').show().attr('disabled', true);

    if (toolchanges.length) {
      $('#runToolsBtn').hide().attr('disabled', true);
      $('#runBtn').hide().attr('disabled', true);
    } else {
      $('#runToolsBtn').hide().attr('disabled', true);
      $('#runBtn').hide().attr('disabled', true);
    }
    $('#chkSize').show().attr('disabled', true);
    $('#resumeBtn').hide().attr('disabled', true);
    $('#pauseBtn').show().attr('disabled', false);
    $('#stopBtn').show().attr('disabled', false);
    $('#toolBtn').show().attr('disabled', false);
    $('#toolBtn2').show().attr('disabled', false);
    if (laststatus != undefined && laststatus.machine.firmware.type == 'grbl') {
      if (grblParams['$22'] == 1) {
        $('#homeBtn').show().attr('disabled', true);
      } else {
        $('#homeBtn').show().attr('disabled', true);
      }
    }
    $('.estop').show()
  } else if (val == 4) { // Paused
    $('#grblProbeMenu').show().attr('disabled', true);

    if (toolchanges.length) {
      $('#runToolsBtn').hide().attr('disabled', true);
      $('#runBtn').hide().attr('disabled', true);
    } else {
      $('#runToolsBtn').hide().attr('disabled', true);
      $('#runBtn').hide().attr('disabled', true);
    }
    $('#chkSize').show().attr('disabled', true);
    if (status.machine.inputs.includes('D')) {
      $('#resumeBtn').hide().attr('disabled', true);
      $('#pauseBtn').show().attr('disabled', true);
    } else {
      $('#resumeBtn').show().attr('disabled', false);
      $('#pauseBtn').hide().attr('disabled', true);
    }

    $('#stopBtn').show().attr('disabled', false);
    $('#toolBtn').show().attr('disabled', false);
    $('#toolBtn2').show().attr('disabled', false);
    if (laststatus != undefined && laststatus.machine.firmware.type == 'grbl') {
      if (grblParams['$22'] == 1) {
        $('#homeBtn').show().attr('disabled', true);
      } else {
        $('#homeBtn').show().attr('disabled', true);
      }
    }
    $('.estop').show()
  } else if (val == 5) { // Alarm State
    $('#grblProbeMenu').show().attr('disabled', true);

    if (toolchanges.length) {
      $('#runToolsBtn').show().attr('disabled', true);
      $('#runBtn').hide().attr('disabled', true);
    } else {
      $('#runToolsBtn').hide().attr('disabled', true);
      $('#runBtn').show().attr('disabled', true);
    }
    // $('#runBtn').show().attr('disabled', true);
    $('#chkSize').show().attr('disabled', true);
    $('#resumeBtn').hide().attr('disabled', true);
    $('#pauseBtn').hide().attr('disabled', true);
    $('#stopBtn').show().attr('disabled', true);
    $('#toolBtn').show().attr('disabled', true);
    $('#toolBtn2').show().attr('disabled', true);
    if (laststatus != undefined && laststatus.machine.firmware.type == 'grbl') {
      if (grblParams['$22'] == 1) {
        $('#homeBtn').show().attr('disabled', false);
      } else {
        $('#homeBtn').show().attr('disabled', true);
      }
    }
    $('.estop').show()
  } else if (val == 6) { // Firmware Upgrade State
    $('#grblProbeMenu').show().attr('disabled', true);

    if (toolchanges.length) {
      $('#runToolsBtn').hide().attr('disabled', true);
      $('#runBtn').hide().attr('disabled', true);
    } else {
      $('#runToolsBtn').hide().attr('disabled', true);
      $('#runBtn').hide().attr('disabled', true);
    }
    $('#chkSize').show().attr('disabled', true);
    $('#resumeBtn').hide().attr('disabled', true);
    $('#pauseBtn').hide().attr('disabled', true);
    $('#stopBtn').hide().attr('disabled', true);
    $('#toolBtn').hide().attr('disabled', true);
    $('#toolBtn2').hide().attr('disabled', true);
    if (laststatus != undefined && laststatus.machine.firmware.type == 'grbl') {
      if (grblParams['$22'] == 1) {
        $('#homeBtn').hide().attr('disabled', true);
      } else {
        $('#homeBtn').show().attr('disabled', true);
      }
    }
    $('.estop').hide()
  }
}

function setJogPanel(val, status) {
  if (val == 0) { // Not Connected Yet
    // Show panel and resize editor
    // $("#jogcontrols").slideUp(20);
    // $("#editor").css('height', 'calc(' + 100 + 'vh - ' + 485 + 'px)');
    // $("#macros").css('height', 'calc(' + 100 + 'vh - ' + 485 + 'px)');
    // $("#console").css('height', 'calc(' + 100 + 'vh - ' + 505 + 'px)');
    // $("#renderArea").css('height', 'calc(' + 100 + 'vh - ' + 448 + 'px)');
    // $('#console').scrollTop($("#console")[0].scrollHeight - $("#console").height());
    if (editor) {
      editor.resize()
    }
    $('.jogbtn').attr('disabled', true);
    $('#xPos').html('0.00');
    $('#yPos').html('0.00');
    $('#zPos').html('0.00');
    if (!isJogWidget && webgl) {
      if (!simRunning) {
        if (webgl) {
          if (!disable3Drealtimepos) {
            cone.visible = false;
          }
        }
      }
    }

  } else if (val == 1 || val == 2) { // Connected, but not Playing yet
    // Show panel and resize editor
    // $("#editor").css('height', 'calc(' + 100 + 'vh - ' + 485 + 'px)');
    // $("#macros").css('height', 'calc(' + 100 + 'vh - ' + 485 + 'px)');
    // $("#console").css('height', 'calc(' + 100 + 'vh - ' + 505 + 'px)');
    // $("#renderArea").css('height', 'calc(' + 100 + 'vh - ' + 448 + 'px)');
    // $('#console').scrollTop($("#console")[0].scrollHeight - $("#console").height());
    if (editor) {
      editor.resize()
    }
    $('.jogbtn').attr('disabled', false);
    if (!isJogWidget && webgl) {
      if (object) {
        if (!simRunning) {
          if (!disable3Drealtimepos) {
            cone.visible = false;
          }
          // update3Dprogress(object.children.length)
        }
      }
    }
  } else if (val == 3) { // Busy Streaming GCODE
    // Show panel and resize editor
    // $("#editor").css('height', 'calc(' + 100 + 'vh - ' + 485 + 'px)');
    // $("#macros").css('height', 'calc(' + 100 + 'vh - ' + 485 + 'px)');
    // $("#console").css('height', 'calc(' + 100 + 'vh - ' + 505 + 'px)');
    // $("#renderArea").css('height', 'calc(' + 100 + 'vh - ' + 448 + 'px)');
    if (editor) {
      editor.resize()
    }
    // $("#jogcontrols").slideDown(20);
    $('.jogbtn').attr('disabled', true);
    if (!isJogWidget && webgl) {
      if (!simRunning) {
        if (webgl) {
          if (!disable3Drealtimepos) {
            cone.visible = true;
          }
        }
      }
    }
  } else if (val == 4) { // Paused
    // Show panel and resize editor
    // $("#editor").css('height', 'calc(' + 100 + 'vh - ' + 485 + 'px)');
    // $("#macros").css('height', 'calc(' + 100 + 'vh - ' + 485 + 'px)');
    // $("#console").css('height', 'calc(' + 100 + 'vh - ' + 505 + 'px)');
    // $("#renderArea").css('height', 'calc(' + 100 + 'vh - ' + 448 + 'px)');
    if (editor) {
      editor.resize()
    }
    $('.jogbtn').attr('disabled', true);
    if (!isJogWidget && webgl) {
      if (!simRunning) {
        if (!disable3Drealtimepos) {
          cone.visible = true;
        }
      }
    }
  } else if (val == 5) { // Alarm State
    // Show panel and resize editor
    // $("#editor").css('height', 'calc(' + 100 + 'vh - ' + 485 + 'px)');
    // $("#macros").css('height', 'calc(' + 100 + 'vh - ' + 485 + 'px)');
    // $("#console").css('height', 'calc(' + 100 + 'vh - ' + 505 + 'px)');
    // $("#renderArea").css('height', 'calc(' + 100 + 'vh - ' + 448 + 'px)');
    // $('#console').scrollTop($("#console")[0].scrollHeight - $("#console").height());
    if (editor) {
      editor.resize()
    }
    $('.jogbtn').attr('disabled', true);
    if (!isJogWidget && webgl) {
      if (!simRunning) {
        if (webgl) {
          if (!disable3Drealtimepos) {
            cone.visible = false;
          }
        }
      }
    }
  } else if (val == 6) { // Firmware Upgrade State
    // Show panel and resize editor
    // $("#jogcontrols").slideUp(20);
    // $("#editor").css('height', 'calc(' + 100 + 'vh - ' + 485 + 'px)');
    // $("#macros").css('height', 'calc(' + 100 + 'vh - ' + 485 + 'px)');
    // $("#console").css('height', 'calc(' + 100 + 'vh - ' + 505 + 'px)');
    // $("#renderArea").css('height', 'calc(' + 100 + 'vh - ' + 448 + 'px)');
    // $('#console').scrollTop($("#console")[0].scrollHeight - $("#console").height());
    if (editor) {
      editor.resize()
    }
    $('.jogbtn').attr('disabled', true);
    $('#xPos').html('0.00');
    $('#yPos').html('0.00');
    $('#zPos').html('0.00');
    $('#aPos').html('0.00');
    if (!isJogWidget && webgl) {
      if (!simRunning) {
        if (!disable3Drealtimepos) {
          cone.visible = false;
        }
      }
    }
  }
}

function setConsole(val, status) {
  if (val == 0) { // Not Connected Yet
    if (!$('#command').attr('disabled')) {
      $('#command').attr('disabled', true);
    }
    $("#sendCommand").prop('disabled', true);
  } else if (val == 0 || val == 2) { // Connected, but not Playing yet
    $("#command").attr('disabled', false);
    $("#sendCommand").prop('disabled', false);
  } else if (val == 3) { // Busy Streaming GCODE
    if (!$('#command').attr('disabled')) {
      $('#command').attr('disabled', true);
    }
    $("#sendCommand").prop('disabled', true);
  } else if (val == 4) { // Paused
    if (!$('#command').attr('disabled')) {
      $('#command').attr('disabled', true);
    }
    $("#sendCommand").prop('disabled', false);
  } else if (val == 5) { // Alarm State
    $("#command").attr('disabled', false);
    $("#sendCommand").prop('disabled', false);
  } else if (val == 6) { // Firmware Upgrade State
    if (!$('#command').attr('disabled')) {
      $('#command').attr('disabled', true);
    }
    $("#sendCommand").prop('disabled', true);
  }
}