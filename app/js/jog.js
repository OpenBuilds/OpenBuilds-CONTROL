"use strict";

var allowContinuousJog = false;
var continuousJogRunning = false;
var safeToUpdateSliders = true;
var jogRate = {x: 4000, y: 4000, z: 2000, a: 2000};
var showMCS = false;

const jogDistArray = [ // must have 4 items
  {mm: 0.1, mmStr: '0.1mm', in: 0.0254, inStr: '0.001"', button: '#dist01', label: '#dist01label'},
  {mm: 1, mmStr: '1mm', in: 0.254, inStr: '0.01"', button: '#dist1', label: '#dist1label'},
  {mm: 10, mmStr: '10mm', in: 2.54, inStr: '0.1"', button: '#dist10', label: '#dist10label'},
  {mm: 100, mmStr: '100mm', in: 25.4, inStr: '1"', button: '#dist100', label: '#dist100label'},
];

var jogDistIndex = 2; // initial selection
var jogdistXYZ = 10;
var jogdistA = 10;
var unit = "mm";

function jogOverride(newVal) {
  if (laststatus && laststatus.comms.connectionStatus > 0) {
    jogRate.x = 4000;
    jogRate.y = 4000;
    jogRate.z = 2000;
    jogRate.a = 2000;

    if (grblParams.$110 != undefined) {
      jogRate.x = (grblParams.$110 * (newVal / 100)).toFixed(0);
    }
    if (grblParams.$111 != undefined) {
      jogRate.y = (grblParams.$111 * (newVal / 100)).toFixed(0);
    }
    if (grblParams.$112 != undefined) {
      jogRate.z = (grblParams.$112 * (newVal / 100)).toFixed(0);
    }
    if (grblParams.$113 != undefined) {
      jogRate.a = (grblParams.$113 * (newVal / 100)).toFixed(0);
    }

    if ($('#jro').data('slider').val() != newVal)
      $('#jro').data('slider').val(newVal)
  }

  localStorage.setItem('jogOverride', newVal);
}

function setJogDist(index) {
  for (let i = 0; i < 4; i++) {
    const jogDist = jogDistArray[i];
    const button = $(jogDist.button);
    const label = $(jogDist.label);
    if (i == index) {
     button.addClass('bd-openbuilds');
     label.removeClass('fg-gray').addClass('fg-openbuilds');
    } else {
     button.removeClass('bd-openbuilds');
     label.removeClass('fg-openbuilds').addClass('fg-gray');
    }
  }
  jogDistIndex = index;
  jogdistXYZ = unit == "in" ? jogDistArray[index].in : jogDistArray[index].mm;
}

function setADist(newADist) {
  $("#distAAxislabel").html("A: " + newADist + "&deg;");
  jogdistA = newADist;
}

function mmMode() {
  unit = "mm";
  localStorage.setItem('unitsMode', unit);
  for (let i = 0; i < 4; i++) {
    const jogDist = jogDistArray[i];
    $(jogDist.label).html(jogDist.mmStr);
  }
  jogdistXYZ = jogDistArray[jogDistIndex].mm;

  updateDro(laststatus);

  if (typeof redrawGrid === "function") { // Check if function exists, because in Mobile view it does not
    redrawGrid(sizexmin, sizexmax, sizeymin, sizeymax, false);
  }
  updateWcsHistory();
}

function inMode() {
  unit = "in";
  localStorage.setItem('unitsMode', unit);
  for (let i = 0; i < 4; i++) {
    const jogDist = jogDistArray[i];
    $(jogDist.label).html(jogDist.inStr);
  }
  jogdistXYZ = jogDistArray[jogDistIndex].in;

  updateDro(laststatus);

  if (typeof redrawGrid === "function") { // Check if function exists, because in Mobile view it does not
    redrawGrid(sizexmin / 25.4, sizexmax / 25.4, sizeymin / 25.4, sizeymax / 25.4, true);
  }
  updateWcsHistory();
}

function toggleWCS() {
  showMCS = !showMCS;
  $('#mcsBtn').html(showMCS ? "MCS" : "WCS");
  $('#Xwork, #Ywork, #Zwork, #Awork').html(showMCS ? "MCS" : "WORK");
  addRemoveClass('#mcsBtn, .dro', 'droMCS', showMCS);
  enableViaClass($(".setzero"), !showMCS);

  updateDro(laststatus);
}

function cancelJog() {
  socket.emit('stop', {
    stop: false,
    jog: true,
    abort: false
  })
  continuousJogRunning = false;
}

function onDroClick(axis) {
  if (!laststatus || laststatus.comms.connectionStatus != 2) return; // only allow during Idle

  const main = $("#" + axis + "PosDro");
  const view = $("#" + axis + "Pos");
  const input = $("#" + axis + "PosInput");

  view.hide();
  main.addClass("drop-shadow");

  let value = laststatus.machine.position.work[axis];
  if (showMCS) {
    value += laststatus.machine.position.offset[axis];
  }
  if (axis != 'a' && unit == "in") {
    value /= 25.4;
  }
  input.show().focus().val(value.toFixed(3));
  input.attr('title', showMCS ? "Enter to Go" : "Enter to Go, Shift+Enter to Set");
  input[0].select();
}

// Round small negative values to 0 so they don't show up as -0
function prettyCoord(val, dec) {
  val = Number(val);
  if (dec == 2 && val < 0 && val > -0.005) {
    return 0;
  }
  if (dec == 3 && val < 0 && val > -0.0005) {
    return 0;
  }
  return val;
}

function updateDro(status) {
  if (!status || status.comms.connectionStatus == 0 || status.comms.connectionStatus == 6) {
    $('#xPos, #yPos, #zPos, #aPos').html('0.00');
    $("#xPosDro, #yPosDro, #zPosDro, #aPosDro").attr('title', '');
    return;
  }

  let xpos = status.machine.position.work.x;
  let ypos = status.machine.position.work.y;
  let zpos = status.machine.position.work.z;
  let apos = status.machine.position.work.a;
  if (showMCS) {
    xpos += status.machine.position.offset.x;
    ypos += status.machine.position.offset.y;
    zpos += status.machine.position.offset.z;
    apos += status.machine.position.offset.a;
  }

  if (unit == "in") {
    $(" #xPosDro").attr('title', 'X Machine: ' + ((status.machine.position.work.x + status.machine.position.offset.x) / 25.4).toFixed(3) + unit +
      "\nX Work: " + (status.machine.position.work.x / 25.4).toFixed(3) + unit);
    $(" #yPosDro").attr('title', 'Y Machine: ' + ((status.machine.position.work.y + status.machine.position.offset.y) / 25.4).toFixed(3) + unit +
      "\nY Work: " + (status.machine.position.work.y / 25.4).toFixed(3) + unit);
    $(" #zPosDro").attr('title', 'Z Machine: ' + ((status.machine.position.work.z + status.machine.position.offset.z) / 25.4).toFixed(3) + unit +
      "\nZ Work: " + (status.machine.position.work.z / 25.4).toFixed(3) + unit);

    xpos = prettyCoord(xpos / 25.4, 3).toFixed(3) + unit;
    ypos = prettyCoord(ypos / 25.4, 3).toFixed(3) + unit;
    zpos = prettyCoord(zpos / 25.4, 3).toFixed(3) + unit;
  } else {
    $("#xPosDro").attr('title', 'X Machine: ' + (status.machine.position.work.x + status.machine.position.offset.x).toFixed(3) + unit +
      "\nX Work: " + status.machine.position.work.x.toFixed(3) + unit);
    $("#yPosDro").attr('title', 'Y Machine: ' + (status.machine.position.work.y + status.machine.position.offset.y).toFixed(3) + unit +
      "\nY Work: " + status.machine.position.work.y.toFixed(3) + unit);
    $("#zPosDro").attr('title', 'Z Machine: ' + (status.machine.position.work.z + status.machine.position.offset.z).toFixed(3) + unit +
      "\nZ Work: " + status.machine.position.work.z.toFixed(3) + unit);

    xpos = prettyCoord(xpos, 2).toFixed(2) + unit;
    ypos = prettyCoord(ypos, 2).toFixed(2) + unit;
    zpos = prettyCoord(zpos, 2).toFixed(2) + unit;
  }

  $("#aPosDro").attr('title', 'A Machine: ' + (status.machine.position.work.a + status.machine.position.offset.a).toFixed(3) + "\u{00B0}" +
    "\nA Work: " + status.machine.position.work.a.toFixed(3) + "\u{00B0}");
  apos = prettyCoord(apos, 2).toFixed(2) + "&deg;";

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
}

function onDroKeydown(axis, e) {
  if (e.key === "Enter" || e.key === "NumpadEnter" || e.key == "Escape") {
    if (e.ctrlKey) return; // ignore Ctrl to avoid confusion with Shift
    if (showMCS && e.shiftKey) return; // can't change the origin of MCS

    const view = $("#" + axis + "Pos");
    const input = $("#" + axis + "PosInput");

    //Disable textbox to prevent multiple submit
    input.attr("disabled", "disabled");
    view.show();
    input.hide();
    //Enable the textbox again if needed.
    input.removeAttr("disabled");

    if (e.key == "Escape") return;

    const Axis = axis.toUpperCase();
    let value = parseFloat(input.val());
    if (!showMCS && e.shiftKey) {
      // Modify the origin (always in mm for better precision)
      captureWcsHistory('Before <b>' + Axis + ' input</b>');
      if (axis != 'a' && unit == "in") {
        value *= 25.4;
      }
      sendGcode("G10 G21 P0 L20 " + Axis + value.toFixed(3));
    } else {
      const origin = showMCS ? "G53 " : "";

      if (axis != 'a' && unit == "in") {
        sendGcode("$J=" + origin + "G90 G20 " + Axis + value.toFixed(3) + " F" + (jogRate[axis] / 25.4).toFixed(3));
      } else {
        sendGcode("$J=" + origin + "G90 G21 " + Axis + value.toFixed(3) + " F" + parseFloat(jogRate[axis]).toFixed(3));
      }
    }
  }
}

function onDroBlur(axis) {
  const main = $("#" + axis + "PosDro");
  const view = $("#" + axis + "Pos");
  const input = $("#" + axis + "PosInput");

  main.removeClass("drop-shadow");
  view.show();
  input.hide();
}

function jogDocReady() {

  if (localStorage.getItem('continuousJog')) {
    allowContinuousJog = JSON.parse(localStorage.getItem('continuousJog')) == true;
    $('#jogTypeContinuous').prop('checked', allowContinuousJog);
    $('.distbtn').toggle(!allowContinuousJog);
  }

  $('#jogTypeContinuous').on('click', function() {
    allowContinuousJog = $(this).is(':checked');
    localStorage.setItem('continuousJog', allowContinuousJog);
    $('.distbtn').toggle(!allowContinuousJog);
    document.activeElement.blur();
  });

  setJogDist(jogDistIndex);
  if (localStorage.getItem('unitsMode') == "in") {
    inMode();
    $('#inMode').click();
  } else {
    mmMode();
    $('#mmMode').click();
  }

  $(document).mousedown(function() {
    safeToUpdateSliders = false;
  }).mouseup(function() {
    safeToUpdateSliders = true;
    // Added to cancel Jog moves even when user moved the mouse off the button before releasing
    if (allowContinuousJog) {
      if (continuousJogRunning) {
        cancelJog()
      }
    }
  }).mouseleave(function() {
    safeToUpdateSliders = true;
  });

  $('#dist01').on('click', () => { setJogDist(0); });
  $('#dist1').on('click', () => { setJogDist(1); });
  $('#dist10').on('click', () => { setJogDist(2); });
  $('#dist100').on('click', () => { setJogDist(3); });

  $('#gotozeroWPos').on('click', function() {
    sendGcode('G21 G90');
    sendGcode('G0 Z5');
    sendGcode('G0 X0 Y0');
    sendGcode('G0 Z0');
  });

  $('#gotoXMinMpos').on('click', function() {
    if (grblParams.$22 > 0) {
      const minX = computeMachineLimits().minX;
      sendGcode("G0 G53 G90 G21 X" + minX.toFixed(2));
    }
  });

  $('#gotoXMaxMpos').on('click', function() {
    if (grblParams.$22 > 0) {
      const maxX = computeMachineLimits().maxX;
      sendGcode("G0 G53 G90 G21 X" + maxX.toFixed(2));
    }
  });

  $('#gotoYMinMpos').on('click', function() {
    if (grblParams.$22 > 0) {
      const minY = computeMachineLimits().minY;
      sendGcode("G0 G53 G90 G21 Y" + minY.toFixed(2));
    }
  });

  $('#gotoYMaxMpos').on('click', function() {
    if (grblParams.$22 > 0) {
      const maxY = computeMachineLimits().maxY;
      sendGcode("G0 G53 G90 G21 Y" + maxY.toFixed(2));
    }
  });

  $('#gotoZMinMpos').on('click', function() {
    if (grblParams.$22 > 0) {
      const minZ = computeMachineLimits().minZ;
      sendGcode("G0 G53 G90 G21 Z" + minZ.toFixed(2));
    }
  });

  $('#gotoZMaxMpos').on('click', function() {
    if (grblParams.$22 > 0) {
      const maxZ = computeMachineLimits().maxZ;
      sendGcode("G0 G53 G90 G21 Z" + maxZ.toFixed(2));
    }
  });

  $('#gotoAMinMpos').on('click', function() {
    if (grblParams.$22 > 0) {
      const minA = computeMachineLimits().minA;
      sendGcode("G0 G53 G90 G21 A" + minA.toFixed(2));
    }
  });

  $('#gotoAMaxMpos').on('click', function() {
    if (grblParams.$22 > 0) {
      const maxA = computeMachineLimits().maxA;
      sendGcode("G0 G53 G90 G21 A" + maxA.toFixed(2));
    }
  });

  $('#gotozeroZmPosXYwPos').on('click', function() {
    const maxZ = computeMachineLimits().maxZ;
    sendGcode('G0 G53 G90 G21 Z' + maxZ.toFixed(2));
    sendGcode('G0 X0 Y0');
    sendGcode('G0 Z0');
  });

  $('#gotozeroMPos').on('click', function() {
    const limits = computeMachineLimits();
    if (limits.homingMask && limits.homingMask.z) {
      // Z0 at the bottom - first move XY, then Z
      sendGcode('G0 G53 X' + limits.X0.toFixed(2) + ' Y' + limits.Y0.toFixed(2));
      sendGcode('G0 G53 G90 G21 Z' + limits.Z0.toFixed(2));
    } else {
      // Z0 at the top - first move Z, then XY
      sendGcode('G0 G53 G90 G21 Z' + limits.Z0.toFixed(2));
      sendGcode('G0 G53 X' + limits.X0.toFixed(2) + ' Y' + limits.Y0.toFixed(2));
    }
  });

  $('.xM').on('touchstart mousedown', function(ev) {
    if (ev.which > 1) {
      return
    }
    ev.preventDefault();
    if (allowContinuousJog) {
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        const mcsX = parseFloat(laststatus.machine.position.offset.x) + parseFloat(laststatus.machine.position.work.x);
        let minX = mcsX - 1000;
        const hasSoftLimits = Object.keys(grblParams).length > 0 && parseInt(grblParams.$20) == 1;
        if (hasSoftLimits) {
          // Soft Limits is enabled so lets calculate maximum move distance
          minX = computeMachineLimits(1).minX;
          if (minX >= mcsX) {
            toastJogWillHit("X-");
          }
        }

        if (minX < mcsX) {
          sendGcode("$J=G53 G90 G21 X" + minX.toFixed(2) + " F" + jogRate.x);
          continuousJogRunning = true;
          waitingForStatus = true;
          $('.xM').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      sendGcode("$J=G91 G21 X" + (-jogdistXYZ).toFixed(2) + " F" + jogRate.x);
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
    if (ev.which > 1) {
      return
    }
    ev.preventDefault();

    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        const mcsX = parseFloat(laststatus.machine.position.offset.x) + parseFloat(laststatus.machine.position.work.x);
        let maxX = mcsX + 1000;
        const hasSoftLimits = Object.keys(grblParams).length > 0 && parseInt(grblParams.$20) == 1;
        if (hasSoftLimits) {
          // Soft Limits is enabled so lets calculate maximum move distance
          maxX = computeMachineLimits(1).maxX;
          if (maxX <= mcsX) {
            toastJogWillHit("X+");
          }
        }
        if (maxX > mcsX) {
          sendGcode("$J=G53 G90 G21 X" + maxX.toFixed(2) + " F" + jogRate.x);
          continuousJogRunning = true;
          waitingForStatus = true;
          $('.xP').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      sendGcode("$J=G91 G21 X" + jogdistXYZ.toFixed(2) + " F" + jogRate.x);
    }
    $('#runNewProbeBtn').addClass("disabled")
    $('#confirmNewProbeBtn').removeClass("disabled")
  });
  $('.xP').on('touchend mouseup', function(ev) {
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

    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        const mcsY = parseFloat(laststatus.machine.position.offset.y) + parseFloat(laststatus.machine.position.work.y);
        let minY = mcsY - 1000;
        const hasSoftLimits = Object.keys(grblParams).length > 0 && parseInt(grblParams.$20) == 1;
        if (hasSoftLimits) {
          // Soft Limits is enabled so lets calculate maximum move distance
          minY = computeMachineLimits(1).minY;
          if (minY >= mcsY) {
            toastJogWillHit("Y-");
          }
        }

        if (minY < mcsY) {
          sendGcode("$J=G53 G90 G21 Y" + minY.toFixed(2) + " F" + jogRate.y);
          continuousJogRunning = true;
          waitingForStatus = true;
          $('.yM').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      sendGcode("$J=G91 G21 Y" + (-jogdistXYZ).toFixed(2) + " F" + jogRate.y);
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

    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        const mcsY = parseFloat(laststatus.machine.position.offset.y) + parseFloat(laststatus.machine.position.work.y);
        let maxY = mcsY + 1000;
        const hasSoftLimits = Object.keys(grblParams).length > 0 && parseInt(grblParams.$20) == 1;
        if (hasSoftLimits) {
          // Soft Limits is enabled so lets calculate maximum move distance
          maxY = computeMachineLimits(1).maxY;
          if (maxY <= mcsY) {
            toastJogWillHit("Y+");
          }
        }
        if (maxY > mcsY) {
          sendGcode("$J=G53 G90 G21 Y" + maxY.toFixed(2) + " F" + jogRate.y);
          continuousJogRunning = true;
          waitingForStatus = true;
          $('#yP').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      sendGcode("$J=G91 G21 Y" + jogdistXYZ.toFixed(2) + " F" + jogRate.y);
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

    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        const mcsZ = parseFloat(laststatus.machine.position.offset.z) + parseFloat(laststatus.machine.position.work.z);
        let minZ = mcsZ - 1000;
        const hasSoftLimits = Object.keys(grblParams).length > 0 && parseInt(grblParams.$20) == 1;
        if (hasSoftLimits) {
          // Soft Limits is enabled so lets calculate maximum move distance
          minZ = computeMachineLimits(1).minZ;
          if (minZ >= mcsZ) {
            toastJogWillHit("Z-");
          }
        }

        if (minZ < mcsZ) {
          sendGcode("$J=G53 G90 G21 Z" + minZ.toFixed(2) + " F" + jogRate.z);
          continuousJogRunning = true;
          waitingForStatus = true;
          $('.zM').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      sendGcode("$J=G91 G21 Z" + (-jogdistXYZ).toFixed(2) + " F" + jogRate.z);
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

    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        const mcsZ = parseFloat(laststatus.machine.position.offset.z) + parseFloat(laststatus.machine.position.work.z);
        let maxZ = mcsZ + 1000;
        const hasSoftLimits = Object.keys(grblParams).length > 0 && parseInt(grblParams.$20) == 1;
        if (hasSoftLimits) {
          // Soft Limits is enabled so lets calculate maximum move distance
          maxZ = computeMachineLimits(1).maxZ;
          if (maxZ <= mcsZ) {
            toastJogWillHit("Z+");
          }
        }
        if (maxZ > mcsZ) {
          sendGcode("$J=G53 G90 G21 Z" + maxZ.toFixed(2) + " F" + jogRate.z);
          continuousJogRunning = true;
          waitingForStatus = true;
          $('.zP').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      sendGcode("$J=G91 G21 Z" + jogdistXYZ.toFixed(2) + " F" + jogRate.z);
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

    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        const mcsA = parseFloat(laststatus.machine.position.offset.a) + parseFloat(laststatus.machine.position.work.a);
        let minA = mcsA - 1000;
        const travelA = parseFloat(grblParams.$133);
        const hasSoftLimits = Object.keys(grblParams).length > 0 && parseInt(grblParams.$20) == 1;
        if (hasSoftLimits && travelA > 0) {
          // Soft Limits is enabled so lets calculate maximum move distance
          minA = computeMachineLimits(0).minA;
          if (minA >= mcsA) {
            toastJogWillHit("A-");
          }
        }

        if (minA < mcsA) {
          sendGcode("$J=G53 G90 G21 A" + minA.toFixed(3) + " F" + jogRate.a);
          continuousJogRunning = true;
          waitingForStatus = true;
          $('.aM').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      sendGcode("$J=G91 G21 A" + (-jogdistA).toFixed(3) + " F" + jogRate.a);
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

    if (allowContinuousJog) { // startJog();
      if (!waitingForStatus && laststatus.comms.runStatus == "Idle" || laststatus.comms.runStatus == "Door:0") {
        const mcsA = parseFloat(laststatus.machine.position.offset.a) + parseFloat(laststatus.machine.position.work.a);
        let maxA = mcsA + 1000;
        const travelA = parseFloat(grblParams.$133);
        const hasSoftLimits = Object.keys(grblParams).length > 0 && parseInt(grblParams.$20) == 1;
        if (hasSoftLimits && travelA > 0) {
          // Soft Limits is enabled so lets calculate maximum move distance
          maxA = computeMachineLimits(0).maxA;
          if (maxA <= mcsA) {
            toastJogWillHit("A+");
          }
        }
        if (maxA > mcsA) {
          sendGcode("$J=G53 G90 G21 A" + maxA.toFixed(3) + " F" + jogRate.a);
          continuousJogRunning = true;
          waitingForStatus = true;
          $('.aP').click();
        }
      } else {
        toastJogNotIdle();
      }
    } else {
      sendGcode("$J=G91 G21 A" + jogdistA.toFixed(3) + " F" + jogRate.a);
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


  $('#homeBtn').on('click', function() {
    smartHome();
  })

  $('#chkSize').on('click', function() {
    const bbox2 = new THREE.Box3().setFromObject(object);
    console.log('bbox for Draw Bounding Box: ' + object + ' Min X: ', (bbox2.min.x), '  Max X:', (bbox2.max.x), 'Min Y: ', (bbox2.min.y), '  Max Y:', (bbox2.max.y));
    const feedrate = 5000;
    const moves = `
      $J=G90G21X` + (bbox2.min.x).toFixed(3) + ` Y` + (bbox2.min.y).toFixed(3) + ` F` + feedrate + `\n
      $J=G90G21X` + (bbox2.max.x).toFixed(3) + ` Y` + (bbox2.min.y).toFixed(3) + ` F` + feedrate + `\n
      $J=G90G21X` + (bbox2.max.x).toFixed(3) + ` Y` + (bbox2.max.y).toFixed(3) + ` F` + feedrate + `\n
      $J=G90G21X` + (bbox2.min.x).toFixed(3) + ` Y` + (bbox2.max.y).toFixed(3) + ` F` + feedrate + `\n
      $J=G90G21X` + (bbox2.min.x).toFixed(3) + ` Y` + (bbox2.min.y).toFixed(3) + ` F` + feedrate + `\n
      `;
    socket.emit('runJob', {
      data: moves,
      isJob: false,
      fileName: ""
    });
  });

}

function changeStepSize(dir) {
  $('.distbtn').blur();
  setJogDist(Math.min(Math.max(jogDistIndex + dir, 0), jogDistArray.length - 1));
}

function jog(dir, dist, feed) {
  sendGcode("$J=G91 G21 " + dir + dist.toFixed(3) + " F" + feed);
}

function jogXY(xincrement, yincrement, feed = null) {
  const data = {
    x: xincrement,
    y: yincrement,
    feed: feed
  }
  socket.emit('jogXY', data);
}

function home() {
  sendGcode('$H');
}

function smartHome() {
  if (laststatus.machine.modals.homedRecently) {
    Metro.dialog.create({
      title: "Home All",
      content: "The machine was recently homed. Do you want to home again?",
      clsDialog: 'dark',
      actions: [{
          caption: "Proceed",
          cls: "js-dialog-close success",
          onclick: home
        },
        {
          caption: "Cancel",
          cls: "js-dialog-close",
          onclick: function() {
            // do nothing
          }
        }],
    });
  } else {
    home();
  }
}

function toastJogWillHit(axis) {
  printLog("<span class='fg-red'>[ jog ] </span><span class='fg-red'>Unable to jog toward " + axis + ", will hit soft-limit</span>")
  Metro.toast.create("Unable to jog toward " + axis + ", will hit soft-limit", null, 1000, "bg-darkRed fg-white")
}

function toastJogNotIdle() {
  printLog("<span class='fg-red'>[ jog ] </span><span class='fg-red'>Please wait for machine to be Idle, before jogging</span>")
  Metro.toast.create("Please wait for machine to be Idle, before jogging. Try again once it is Idle", null, 1000, "bg-darkRed fg-white")
}
