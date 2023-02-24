var allowContinuousJog = false;
var continuousJogRunning = false;
var jogdistXYZ = 10;
var jogdistA = 10;
var safeToUpdateSliders = true;
var jogRateX = 4000
var jogRateY = 4000
var jogRateZ = 2000
var jogRateA = 2000

function jogOverride(newVal) {
  if (grblParams.hasOwnProperty('$110')) {
    jogRateX = (grblParams['$110'] * (newVal / 100)).toFixed(0);
    jogRateY = (grblParams['$111'] * (newVal / 100)).toFixed(0);
    jogRateZ = (grblParams['$112'] * (newVal / 100)).toFixed(0);

    $('#jro').data('slider').val(newVal)
  }
  if (grblParams.hasOwnProperty('$113')) {
    jogRateA = (grblParams['$113'] * (newVal / 100)).toFixed(0);
  }
  localStorage.setItem('jogOverride', newVal);
}

function setADist(newADist) {
  $("#distAAxislabel").html("A: " + newADist + " deg")
  jogdistA = newADist;
}

function mmMode() {
  unit = "mm";
  localStorage.setItem('unitsMode', unit);
  $('#dist01label').html('0.1mm')
  $('#dist1label').html('1mm')
  $('#dist10label').html('10mm')
  $('#dist100label').html('100mm')
  if (jogdistXYZ == 0.0254) {
    jogdistXYZ = 0.1
  }
  if (jogdistXYZ == 0.254) {
    jogdistXYZ = 1
  }
  if (jogdistXYZ == 2.54) {
    jogdistXYZ = 10
  }
  if (jogdistXYZ == 25.4) {
    jogdistXYZ = 100
  }
  if (typeof object !== 'undefined') {
    if (object.userData.inch) {
      if (typeof redrawGrid === "function") { // Check if function exists, because in Mobile view it does not
        redrawGrid(object.userData.bbbox2.min.x * 25.4, object.userData.bbbox2.max.x * 25.4, object.userData.bbbox2.min.y * 25.4, object.userData.bbbox2.max.y * 25.4, false);
      }
    } else {
      if (typeof redrawGrid === "function") { // Check if function exists, because in Mobile view it does not
        redrawGrid(object.userData.bbbox2.min.x, object.userData.bbbox2.max.x, object.userData.bbbox2.min.y, object.userData.bbbox2.max.y, false);
      }
    }
  } else {
    if (typeof redrawGrid === "function") { // Check if function exists, because in Mobile view it does not
      redrawGrid(xmin, xmax, ymin, ymax, false);
    }
  }
}

function inMode() {
  unit = "in";
  localStorage.setItem('unitsMode', unit);
  $('#dist01label').html('0.001"')
  $('#dist1label').html('0.01"')
  $('#dist10label').html('0.1"')
  $('#dist100label').html('1"')
  if (jogdistXYZ == 0.1) {
    jogdistXYZ = 0.0254
  }
  if (jogdistXYZ == 1) {
    jogdistXYZ = 0.254
  }
  if (jogdistXYZ == 10) {
    jogdistXYZ = 2.54
  }
  if (jogdistXYZ == 100) {
    jogdistXYZ = 25.4
  }

  if (typeof object !== 'undefined') {
    if (object.userData.inch) {
      if (typeof redrawGrid === "function") { // Check if function exists, because in Mobile view it does not
        redrawGrid(object.userData.bbbox2.min.x, object.userData.bbbox2.max.x, object.userData.bbbox2.min.y, object.userData.bbbox2.max.y, true);
      }
    } else {
      if (typeof redrawGrid === "function") { // Check if function exists, because in Mobile view it does not
        redrawGrid(object.userData.bbbox2.min.x / 25.4, object.userData.bbbox2.max.x / 25.4, object.userData.bbbox2.min.y / 25.4, object.userData.bbbox2.max.y / 25.4, true);
      }
    }
  } else {
    if (typeof redrawGrid === "function") { // Check if function exists, because in Mobile view it does not
      redrawGrid(xmin / 25.4, xmax / 25.4, ymin / 25.4, ymax / 25.4, true);
    }
  }

}

function cancelJog() {
  socket.emit('stop', {
    stop: false,
    jog: true,
    abort: false
  })
  continuousJogRunning = false;
}


$(document).ready(function() {

  if (localStorage.getItem('continuousJog')) {
    if (JSON.parse(localStorage.getItem('continuousJog')) == true) {
      $('#jogTypeContinuous').prop('checked', true)
      allowContinuousJog = true;
      $('.distbtn').hide()
    } else {
      $('#jogTypeContinuous').prop('checked', false)
      allowContinuousJog = false;
      $('.distbtn').show();
    }
  }

  $('#jogTypeContinuous').on('click', function() {
    if ($(this).is(':checked')) {
      localStorage.setItem('continuousJog', true);
      allowContinuousJog = true;
      $('.distbtn').hide();
    } else {
      localStorage.setItem('continuousJog', false);
      allowContinuousJog = false;
      $('.distbtn').show();
    }
    // console.log(document.activeElement)
    document.activeElement.blur();
  });

  if (localStorage.getItem('unitsMode')) {
    if (localStorage.getItem('unitsMode') == "mm") {
      mmMode()
      $('#mmMode').click()
    } else if (localStorage.getItem('unitsMode') == "in") {
      inMode();
      $('#inMode').click()
    }
  } else {
    // default to inches
    inMode();
    $('#inMode').click()
  }

  $(document).mousedown(function(e) {
    safeToUpdateSliders = false;
  }).mouseup(function(e) {
    safeToUpdateSliders = true;
    // Added to cancel Jog moves even when user moved the mouse off the button before releasing
    if (allowContinuousJog) {
      if (continuousJogRunning) {
        cancelJog()
      }
    }
  }).mouseleave(function(e) {
    safeToUpdateSliders = true;
  });

  $("#xPosDro").click(function() {
    $("#xPos").hide()
    $("#xPosDro").addClass("drop-shadow");
    if (unit == "mm") {
      $("#xPosInput").show().focus().val(laststatus.machine.position.work.x)
    } else if (unit == "in") {
      $("#xPosInput").show().focus().val((laststatus.machine.position.work.x / 25.4).toFixed(3))
    }
  });

  $("#xPosInput").blur(function() {
    $("#xPosDro").removeClass("drop-shadow");
    $("#xPos").show()
    $("#xPosInput").hide()
  });

  $('#xPosInput').on('keypress', function(e) {
    console.log(e)
    if (e.key === "Enter" || e.key === "NumpadEnter") {
      //Disable textbox to prevent multiple submit
      $(this).attr("disabled", "disabled");
      $("#xPos").show()
      $("#xPosInput").hide()
      //Enable the textbox again if needed.
      $(this).removeAttr("disabled");
      if (unit == "mm") {
        if (e.shiftKey) {
          sendGcode("G21\nG10 P0 L20 X" + $("#xPosInput").val());
        } else {
          sendGcode("$J=G90 G21 X" + $("#xPosInput").val() + " F" + jogRateX);
        }

      } else if (unit == "in") {
        if (e.shiftKey) {
          sendGcode("G21\nG10 P0 L20 X" + ($("#xPosInput").val() * 25.4));
        } else {
          sendGcode("$J=G90 G20 X" + $("#xPosInput").val() + " F" + jogRateX);
        }
      }
    }
  });

  $("#yPosDro").click(function() {
    $("#yPos").hide()
    $("#yPosDro").addClass("drop-shadow");
    if (unit == "mm") {
      $("#yPosInput").show().focus().val(laststatus.machine.position.work.y)
    } else if (unit == "in") {
      $("#yPosInput").show().focus().val((laststatus.machine.position.work.y / 25.4).toFixed(3))
    }
  });

  $("#yPosInput").blur(function() {
    $("#yPos").show()
    $("#yPosDro").removeClass("drop-shadow");
    $("#yPosInput").hide()
  });

  $('#yPosInput').on('keypress', function(e) {
    if (e.which === 13) {
      //Disable textbox to prevent multiple submit
      $(this).attr("disabled", "disabled");
      $("#yPos").show()
      $("#yPosInput").hide()
      //Enable the textbox again if needed.
      $(this).removeAttr("disabled");
      if (unit == "mm") {
        if (e.shiftKey) {
          sendGcode("G21\nG10 P0 L20 Y" + $("#yPosInput").val());
        } else {
          sendGcode("$J=G90 G21 Y" + $("#yPosInput").val() + " F" + jogRateY);
        }
      } else if (unit == "in") {
        if (e.shiftKey) {
          sendGcode("G21\nG10 P0 L20 Y" + ($("#yPosInput").val() * 25.4));
        } else {
          sendGcode("$J=G90 G20 Y" + $("#yPosInput").val() + " F" + jogRateY);
        }
      }
    }
  });

  $("#zPosDro").click(function() {
    $("#zPos").hide()
    $("#zPosDro").addClass("drop-shadow");
    if (unit == "mm") {
      $("#zPosInput").show().focus().val(laststatus.machine.position.work.z)
    } else if (unit == "in") {
      $("#zPosInput").show().focus().val((laststatus.machine.position.work.z / 25.4).toFixed(3))
    }
  });

  $("#zPosInput").blur(function() {
    $("#zPos").show()
    $("#zPosDro").removeClass("drop-shadow");
    $("#zPosInput").hide()
  });

  $('#zPosInput').on('keypress', function(e) {
    if (e.which === 13) {
      //Disable textbox to prevent multiple submit
      $(this).attr("disabled", "disabled");
      $("#zPos").show()
      $("#zPosInput").hide()
      //Enable the textbox again if needed.
      $(this).removeAttr("disabled");
      if (unit == "mm") {
        if (e.shiftKey) {
          sendGcode("G21\nG10 P0 L20 Z" + $("#zPosInput").val());
        } else {
          sendGcode("$J=G90 G21 Z" + $("#zPosInput").val() + " F" + jogRateZ);
        }
      } else if (unit == "in") {
        if (e.shiftKey) {
          sendGcode("G21\nG10 P0 L20 Z" + ($("#zPosInput").val() * 25.4));
        } else {
          sendGcode("$J=G90 G20 Z" + $("#zPosInput").val() + " F" + jogRateZ);
        }
      }
    }
  });


  $('#dist01').on('click', function(ev) {
    if (unit == "mm") {
      jogdistXYZ = 0.1;
    } else if (unit == "in") {
      jogdistXYZ = 0.0254;
    }
    $('.distbtn').removeClass('bd-openbuilds')
    $('#dist01').addClass('bd-openbuilds')
    $('.jogdistXYZ').removeClass('fg-openbuilds')
    $('.jogdistXYZ').addClass('fg-gray')
    $('#dist01label').removeClass('fg-gray')
    $('#dist01label').addClass('fg-openbuilds')
  })

  $('#dist1').on('click', function(ev) {
    if (unit == "mm") {
      jogdistXYZ = 1;
    } else if (unit == "in") {
      jogdistXYZ = 0.254;
    }
    $('.distbtn').removeClass('bd-openbuilds')
    $('#dist1').addClass('bd-openbuilds')
    $('.jogdistXYZ').removeClass('fg-openbuilds')
    $('.jogdistXYZ').addClass('fg-gray')
    $('#dist1label').removeClass('fg-gray')
    $('#dist1label').addClass('fg-openbuilds')
  })

  $('#dist10').on('click', function(ev) {
    if (unit == "mm") {
      jogdistXYZ = 10;
    } else if (unit == "in") {
      jogdistXYZ = 2.54;
    }
    $('.distbtn').removeClass('bd-openbuilds')
    $('#dist10').addClass('bd-openbuilds')
    $('.jogdistXYZ').removeClass('fg-openbuilds')
    $('.jogdistXYZ').addClass('fg-gray')
    $('#dist10label').removeClass('fg-gray')
    $('#dist10label').addClass('fg-openbuilds')
  })

  $('#dist100').on('click', function(ev) {
    if (unit == "mm") {
      jogdistXYZ = 100;
    } else if (unit == "in") {
      jogdistXYZ = 25.4;
    }
    $('.distbtn').removeClass('bd-openbuilds')
    $('#dist100').addClass('bd-openbuilds')
    $('.jogdistXYZ').removeClass('fg-openbuilds')
    $('.jogdistXYZ').addClass('fg-gray')
    $('#dist100label').removeClass('fg-gray')
    $('#dist100label').addClass('fg-openbuilds')
  })

  $('#gotozeroWPos').on('click', function(ev) {
    sendGcode('G21 G90');
    sendGcode('G0 Z5');
    sendGcode('G0 X0 Y0');
    sendGcode('G0 Z0');
  });

  $('#gotoXzeroMpos').on('click', function(ev) {
    if (grblParams['$22'] == 1) {
      sendGcode('G53 G0 X-' + grblParams["$27"]);
    } else {
      sendGcode('G53 G0 X0');
    }
  });

  $('#gotoYzeroMpos').on('click', function(ev) {
    if (grblParams['$22'] == 1) {
      sendGcode('G53 G0 Y-' + grblParams["$27"]);
    } else {
      sendGcode('G53 G0 Y0');
    }
  });

  $('#gotoZzeroMpos').on('click', function(ev) {
    if (grblParams['$22'] == 1) {
      sendGcode('G53 G0 Z-' + grblParams["$27"]);
    } else {
      sendGcode('G53 G0 Z0');
    }
  });

  $('#gotozeroZmPosXYwPos').on('click', function(ev) {
    if (grblParams['$22'] == 1) {
      sendGcode('G53 G0 Z-' + grblParams["$27"]);
    } else {
      sendGcode('G53 G0 Z0');
    }
    sendGcode('G0 X0 Y0');
    sendGcode('G0 Z0');
  });

  $('#gotozeroMPos').on('click', function(ev) {
    if (grblParams['$22'] == 1) {
      sendGcode('G53 G0 Z-' + grblParams["$27"]);
      sendGcode('G53 G0 X-' + grblParams["$27"] + ' Y-' + grblParams["$27"]);
    } else {
      sendGcode('G53 G0 Z0');
      sendGcode('G53 G0 X0 Y0');
    }
  });




  $('.xM').on('touchstart mousedown', function(ev) {
    console.log(ev)
    if (ev.which > 1) {
      return
    }
    ev.preventDefault();
    var hasSoftLimits = false;
    if (Object.keys(grblParams).length > 0) {
      if (parseInt(grblParams.$20) == 1) {
        hasSoftLimits = true;
      }
    }
    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        var direction = "X-";
        var distance = 1000;

        if (hasSoftLimits) {
          // Soft Limits is enabled so lets calculate maximum move distance
          var mindistance = parseInt(grblParams.$130)
          var maxdistance = 0; // Grbl all negative coordinates
          // Negative move:
          distance = (mindistance + (parseFloat(laststatus.machine.position.offset.x) + parseFloat(laststatus.machine.position.work.x))) - 1
          distance = distance.toFixed(3);
          if (distance < 1) {
            toastJogWillHit("X-");
          }
        }

        if (distance >= 1) {
          socket.emit('runCommand', "$J=G91 G21 " + direction + distance + " F" + jogRateX + "\n");
          continuousJogRunning = true;
          waitingForStatus = true;
          $('.xM').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      jog('X', '-' + jogdistXYZ, jogRateX);
    }
    $('#runNewProbeBtn').addClass("disabled")
    $('#confirmNewProbeBtn').removeClass("disabled")
  });
  $('.xM').on('touchend mouseup', function(ev) {
    ev.preventDefault();
    if (allowContinuousJog) {
      cancelJog()
    }
  });

  $('.xP').on('touchstart mousedown', function(ev) {
    // console.log("xp down")
    if (ev.which > 1) {
      return
    }
    ev.preventDefault();
    var hasSoftLimits = false;
    if (Object.keys(grblParams).length > 0) {
      if (parseInt(grblParams.$20) == 1) {
        hasSoftLimits = true;
      }
    }
    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        var direction = "X";
        var distance = 1000;
        if (hasSoftLimits) {
          // Soft Limits is enabled so lets calculate maximum move distance
          var mindistance = parseInt(grblParams.$130)
          var maxdistance = 0; // Grbl all negative coordinates
          // Positive move:
          distance = (maxdistance - (parseFloat(laststatus.machine.position.offset.x) + parseFloat(laststatus.machine.position.work.x))) - 1
          distance = distance.toFixed(3);
          if (distance < 1) {
            toastJogWillHit("X+");
          }
        }
        if (distance >= 1) {
          socket.emit('runCommand', "$J=G91 G21 " + direction + distance + " F" + jogRateX + "\n");
          continuousJogRunning = true;
          waitingForStatus = true;
          $('.xP').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      jog('X', jogdistXYZ, jogRateX);
    }
    $('#runNewProbeBtn').addClass("disabled")
    $('#confirmNewProbeBtn').removeClass("disabled")
  });
  $('.xP').on('touchend mouseup', function(ev) {
    // console.log("xp up")
    ev.preventDefault();
    if (allowContinuousJog) {
      cancelJog()
    }
  });

  $('.yM').on('touchstart mousedown', function(ev) {
    if (ev.which > 1) { // Ignore middle and right click
      return
    }
    ev.preventDefault();
    var hasSoftLimits = false;
    if (Object.keys(grblParams).length > 0) {
      if (parseInt(grblParams.$20) == 1) {
        hasSoftLimits = true;
      }
    }
    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        var direction = "Y-";
        var distance = 1000;

        if (hasSoftLimits) {
          // Soft Limits is enabled so lets calculate maximum move distance
          var mindistance = parseInt(grblParams.$131)
          var maxdistance = 0; // Grbl all negative coordinates
          // Negative move:
          distance = (mindistance + (parseFloat(laststatus.machine.position.offset.y) + parseFloat(laststatus.machine.position.work.y))) - 1
          distance = distance.toFixed(3);
          if (distance < 1) {
            toastJogWillHit("Y-");
          }
        }

        if (distance >= 1) {
          socket.emit('runCommand', "$J=G91 G21 " + direction + distance + " F" + jogRateY + "\n");
          continuousJogRunning = true;
          waitingForStatus = true;
          $('.yM').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      jog('Y', '-' + jogdistXYZ, jogRateY);
    }
    $('#runNewProbeBtn').addClass("disabled")
    $('#confirmNewProbeBtn').removeClass("disabled")
  });
  $('.yM').on('touchend mouseup', function(ev) {
    ev.preventDefault();
    if (allowContinuousJog) {
      cancelJog()
    }
  });

  $('.yP').on('touchstart mousedown', function(ev) {
    if (ev.which > 1) { // Ignore middle and right click
      return
    }
    ev.preventDefault();
    var hasSoftLimits = false;
    if (Object.keys(grblParams).length > 0) {
      if (parseInt(grblParams.$20) == 1) {
        hasSoftLimits = true;
      }
    }
    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        var direction = "Y";
        var distance = 1000;

        if (hasSoftLimits) {
          // Soft Limits is enabled so lets calculate maximum move distance
          var mindistance = parseInt(grblParams.$131)
          var maxdistance = 0; // Grbl all negative coordinates
          // Positive move:
          distance = (maxdistance - (parseFloat(laststatus.machine.position.offset.y) + parseFloat(laststatus.machine.position.work.y))) - 1
          distance = distance.toFixed(3);
          if (distance < 1) {
            toastJogWillHit("Y+");
          }
        }

        if (distance >= 1) {
          socket.emit('runCommand', "$J=G91 G21 " + direction + distance + " F" + jogRateY + "\n");
          continuousJogRunning = true;
          waitingForStatus = true;
          $('#yP').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      jog('Y', jogdistXYZ, jogRateY);
    }
    $('#runNewProbeBtn').addClass("disabled")
    $('#confirmNewProbeBtn').removeClass("disabled")
  });
  $('.yP').on('touchend mouseup', function(ev) {
    ev.preventDefault();
    if (allowContinuousJog) {
      cancelJog()
    }
  });

  $('.zM').on('touchstart mousedown', function(ev) {
    if (ev.which > 1) { // Ignore middle and right click
      return
    }
    ev.preventDefault();
    var hasSoftLimits = false;
    if (Object.keys(grblParams).length > 0) {
      if (parseInt(grblParams.$20) == 1) {
        hasSoftLimits = true;
      }
    }
    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        var direction = "Z-";
        var distance = 1000;

        if (hasSoftLimits) {
          // Soft Limits is enabled so lets calculate maximum move distance
          var mindistance = parseInt(grblParams.$132)
          var maxdistance = 0; // Grbl all negative coordinates
          // Negative move:
          distance = (mindistance + (parseFloat(laststatus.machine.position.offset.z) + parseFloat(laststatus.machine.position.work.z))) - 1
          distance = distance.toFixed(3);
          if (distance < 1) {
            toastJogWillHit("Z-");
          }
        }

        if (distance >= 1) {
          socket.emit('runCommand', "$J=G91 G21 " + direction + distance + " F" + jogRateZ + "\n");
          continuousJogRunning = true;
          waitingForStatus = true;
          $('.zM').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      jog('Z', '-' + jogdistXYZ, jogRateZ);
    }
    $('#runNewProbeBtn').addClass("disabled")
    $('#confirmNewProbeBtn').removeClass("disabled")
  });
  $('.zM').on('touchend mouseup', function(ev) {
    ev.preventDefault();
    if (allowContinuousJog) {
      cancelJog()
    }
  });

  $('.zP').on('touchstart mousedown', function(ev) {
    if (ev.which > 1) { // Ignore middle and right click
      return
    }
    ev.preventDefault();
    var hasSoftLimits = false;
    if (Object.keys(grblParams).length > 0) {
      if (parseInt(grblParams.$20) == 1) {
        hasSoftLimits = true;
      }
    }
    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        var direction = "Z";
        var distance = 1000;

        if (hasSoftLimits) {
          // Soft Limits is enabled so lets calculate maximum move distance
          var mindistance = parseInt(grblParams.$132)
          var maxdistance = 0; // Grbl all negative coordinates
          // Positive move:
          distance = (maxdistance - (parseFloat(laststatus.machine.position.offset.z) + parseFloat(laststatus.machine.position.work.z))) - 1
          distance = distance.toFixed(3);
          if (distance < 1) {
            toastJogWillHit("Z+");
          }
        }

        if (distance >= 1) {
          socket.emit('runCommand', "$J=G91 G21 " + direction + distance + " F" + jogRateZ + "\n");
          continuousJogRunning = true;
          waitingForStatus = true;
          $('.zP').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      jog('Z', jogdistXYZ, jogRateZ);
    }
    $('#runNewProbeBtn').addClass("disabled")
    $('#confirmNewProbeBtn').removeClass("disabled")
  });
  $('.zP').on('touchend mouseup', function(ev) {
    ev.preventDefault();
    if (allowContinuousJog) {
      cancelJog()
    }
  });

  $('.aM').on('touchstart mousedown', function(ev) {
    if (ev.which > 1) { // Ignore middle and right click
      return
    }
    ev.preventDefault();
    var hasSoftLimits = false;
    if (Object.keys(grblParams).length > 0) {
      if (parseInt(grblParams.$20) == 1) {
        hasSoftLimits = true;
      }
    }
    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        var direction = "A-";
        var distance = 1000;

        if (hasSoftLimits) {
          // Soft Limits is enabled so lets calculate maximum move distance
          var mindistance = parseInt(grblParams.$133)
          var maxdistance = 0; // Grbl all negative coordinates
          // Negative move:
          distance = (mindistance + (parseFloat(laststatus.machine.position.offset.a) + parseFloat(laststatus.machine.position.work.a))) - 1
          distance = distance.toFixed(3);
          if (distance < 1) {
            toastJogWillHit("A-");
          }
        }

        if (distance >= 1) {
          socket.emit('runCommand', "$J=G91 G21 " + direction + distance + " F" + jogRateA + "\n");
          continuousJogRunning = true;
          waitingForStatus = true;
          $('.aM').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      jog('A', '-' + jogdistA, jogRateA);
    }
    $('#runNewProbeBtn').addClass("disabled")
    $('#confirmNewProbeBtn').removeClass("disabled")
  });
  $('.aM').on('touchend mouseup', function(ev) {
    ev.preventDefault();
    if (allowContinuousJog) {
      cancelJog()
    }
  });

  $('.aP').on('touchstart mousedown', function(ev) {
    if (ev.which > 1) { // Ignore middle and right click
      return
    }
    ev.preventDefault();
    var hasSoftLimits = false;
    if (Object.keys(grblParams).length > 0) {
      if (parseInt(grblParams.$20) == 1) {
        hasSoftLimits = true;
      }
    }
    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        var direction = "A";
        var distance = 1000;

        if (hasSoftLimits) {
          // Soft Limits is enabled so lets calculate maximum move distance
          var mindistance = parseInt(grblParams.$133)
          var maxdistance = 0; // Grbl all negative coordinates
          // Positive move:
          distance = (maxdistance - (parseFloat(laststatus.machine.position.offset.a) + parseFloat(laststatus.machine.position.work.a))) - 1
          distance = distance.toFixed(3);
          if (distance < 1) {
            toastJogWillHit("A+");
          }
        }

        if (distance >= 1) {
          socket.emit('runCommand', "$J=G91 G21 " + direction + distance + " F" + jogRateA + "\n");
          continuousJogRunning = true;
          waitingForStatus = true;
          $('.aP').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      jog('A', jogdistA, jogRateA);
    }
    $('#runNewProbeBtn').addClass("disabled")
    $('#confirmNewProbeBtn').removeClass("disabled")
  });
  $('.aP').on('touchend mouseup', function(ev) {
    ev.preventDefault();
    if (allowContinuousJog) {
      cancelJog()
    }
  });


  $('#homeBtn').on('click', function(ev) {
    home();
  })

  $('#chkSize').on('click', function() {
    var bbox2 = new THREE.Box3().setFromObject(object);
    console.log('bbox for Draw Bounding Box: ' + object + ' Min X: ', (bbox2.min.x), '  Max X:', (bbox2.max.x), 'Min Y: ', (bbox2.min.y), '  Max Y:', (bbox2.max.y));
    var feedrate = 5000
    if (laststatus.machine.firmware.type === 'grbl') {
      var moves = `
        $J=G90G21X` + (bbox2.min.x).toFixed(3) + ` Y` + (bbox2.min.y).toFixed(3) + ` F` + feedrate + `\n
        $J=G90G21X` + (bbox2.max.x).toFixed(3) + ` Y` + (bbox2.min.y).toFixed(3) + ` F` + feedrate + `\n
        $J=G90G21X` + (bbox2.max.x).toFixed(3) + ` Y` + (bbox2.max.y).toFixed(3) + ` F` + feedrate + `\n
        $J=G90G21X` + (bbox2.min.x).toFixed(3) + ` Y` + (bbox2.max.y).toFixed(3) + ` F` + feedrate + `\n
        $J=G90G21X` + (bbox2.min.x).toFixed(3) + ` Y` + (bbox2.min.y).toFixed(3) + ` F` + feedrate + `\n
        `;
    } else {
      var moves = `
       G90\n
       G0 X` + (bbox2.min.x).toFixed(3) + ` Y` + (bbox2.min.y).toFixed(3) + ` F` + feedrate + `\n
       G0 X` + (bbox2.max.x).toFixed(3) + ` Y` + (bbox2.min.y).toFixed(3) + ` F` + feedrate + `\n
       G0 X` + (bbox2.max.x).toFixed(3) + ` Y` + (bbox2.max.y).toFixed(3) + ` F` + feedrate + `\n
       G0 X` + (bbox2.min.x).toFixed(3) + ` Y` + (bbox2.max.y).toFixed(3) + ` F` + feedrate + `\n
       G0 X` + (bbox2.min.x).toFixed(3) + ` Y` + (bbox2.min.y).toFixed(3) + ` F` + feedrate + `\n
       G90\n`;
    }
    socket.emit('runJob', {
      data: moves,
      isJob: false,
      fileName: ""
    });
  });

});

function changeStepSize(dir) {
  $('.distbtn').blur();
  if (jogdistXYZ == 0.1 || jogdistXYZ == 0.0254) {
    if (dir == 1) {
      if (unit == "mm") {
        jogdistXYZ = 1;
      } else if (unit == "in") {
        jogdistXYZ = .254;
      }
      $('.distbtn').removeClass('bd-openbuilds')
      $('#dist1').addClass('bd-openbuilds')
      $('.jogdistXYZ').removeClass('fg-openbuilds')
      $('.jogdistXYZ').addClass('fg-gray')
      $('#dist1label').removeClass('fg-gray')
      $('#dist1label').addClass('fg-dark')
    }
    if (dir == -1) {
      // do nothing
    }
  } else if (jogdistXYZ == 1 || jogdistXYZ == 0.254) {
    if (dir == 1) {
      if (unit == "mm") {
        jogdistXYZ = 10;
      } else if (unit == "in") {
        jogdistXYZ = 2.54;
      }
      $('.distbtn').removeClass('bd-openbuilds')
      $('#dist10').addClass('bd-openbuilds')
      $('.jogdistXYZ').removeClass('fg-openbuilds')
      $('.jogdistXYZ').addClass('fg-gray')
      $('#dist10label').removeClass('fg-gray')
      $('#dist10label').addClass('fg-openbuilds')
    }
    if (dir == -1) {
      if (unit == "mm") {
        jogdistXYZ = 0.1;
      } else if (unit == "in") {
        jogdistXYZ = 0.0254;
      }
      $('.distbtn').removeClass('bd-openbuilds')
      $('#dist01').addClass('bd-openbuilds')
      $('.jogdistXYZ').removeClass('fg-openbuilds')
      $('.jogdistXYZ').addClass('fg-gray')
      $('#dist01label').removeClass('fg-gray')
      $('#dist01label').addClass('fg-openbuilds')
    }
  } else if (jogdistXYZ == 10 || jogdistXYZ == 2.54) {
    if (dir == 1) {
      if (unit == "mm") {
        jogdistXYZ = 100;
      } else if (unit == "in") {
        jogdistXYZ = 25.4;
      }
      $('.distbtn').removeClass('bd-openbuilds')
      $('#dist100').addClass('bd-openbuilds')
      $('.jogdistXYZ').removeClass('fg-openbuilds')
      $('.jogdistXYZ').addClass('fg-gray')
      $('#dist100label').removeClass('fg-gray')
      $('#dist100label').addClass('fg-openbuilds')
    }
    if (dir == -1) {
      if (unit == "mm") {
        jogdistXYZ = 1;
      } else if (unit == "in") {
        jogdistXYZ = 0.254;
      }
      $('.distbtn').removeClass('bd-openbuilds')
      $('#dist1').addClass('bd-openbuilds')
      $('.jogdistXYZ').removeClass('fg-openbuilds')
      $('.jogdistXYZ').addClass('fg-gray')
      $('#dist1label').removeClass('fg-gray')
      $('#dist1label').addClass('fg-openbuilds')
    }
  } else if (jogdistXYZ == 100 || jogdistXYZ == 25.4) {
    if (dir == 1) {
      // do nothing
    }
    if (dir == -1) {
      if (unit == "mm") {
        jogdistXYZ = 10;
      } else if (unit == "in") {
        jogdistXYZ = 2.54;
      }
      $('.distbtn').removeClass('bd-openbuilds')
      $('#dist10').addClass('bd-openbuilds')
      $('.jogdistXYZ').removeClass('fg-openbuilds')
      $('.jogdistXYZ').addClass('fg-gray')
      $('#dist10label').removeClass('fg-gray')
      $('#dist10label').addClass('fg-openbuilds')
    }
  }

}

function jog(dir, dist, feed = null) {
  if (feed) {
    socket.emit('jog', dir + ',' + dist + ',' + feed);
  } else {
    socket.emit('jog', dir + ',' + dist);
  }
}

function jogXY(xincrement, yincrement, feed = null) {
  var data = {
    x: xincrement,
    y: yincrement,
    feed: feed
  }
  socket.emit('jogXY', data);
}

function home() {
  if (laststatus != undefined && laststatus.machine.firmware.type == 'grbl') {
    sendGcode('$H')
  } else if (laststatus != undefined && laststatus.machine.firmware.type == 'smoothie') {
    sendGcode('G28')
  }
}

function toastJogWillHit(axis) {
  printLog("<span class='fg-red'>[ jog ] </span><span class='fg-red'>Unable to jog toward " + axis + ", will hit soft-limit</span>")
  var toast = Metro.toast.create;
  toast("Unable to jog toward " + axis + ", will hit soft-limit", null, 1000, "bg-darkRed fg-white")
}

function toastJogNotIdle(axis) {
  printLog("<span class='fg-red'>[ jog ] </span><span class='fg-red'>Please wait for machine to be Idle, before jogging</span>")
  var toast = Metro.toast.create;
  toast("Please wait for machine to be Idle, before jogging. Try again once it is Idle", null, 1000, "bg-darkRed fg-white")
}