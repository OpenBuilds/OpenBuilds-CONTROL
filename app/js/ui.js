"use strict";

var MAX_WCS_HISTORY = 5;
var WCS_HISTORY_TIMEOUT = 3000; // WCS changes within that timeout of the last one are ignored

var wcsHistory = {
  G54: [],
  G55: [],
  G56: [],
  G57: [],
  G58: [],
  G59: [],
};

var wcsHistoryEmpty = true;
var lastWcsCapture = {};

function AddRemoveClass(element, className, add) {
  if (typeof element == "string") {
    element = $(element);
  }
  if (add) {
    element.addClass(className);
  } else {
    element.removeClass(className);
  }
}

function EnableViaClass(button, enabled) {
  AddRemoveClass(button, "disabled", !enabled);
}

function rippleEffect(el, color) {
  if (el.css('position') === 'static') {
    el.css('position', 'relative');
  }

  el.css({
    overflow: 'hidden'
  });

  $(".ripple").remove();

  const size = Math.max(el.outerWidth(), el.outerHeight()) + "px";

  // Add the element
  el.prepend(`<span class="ripple"></span>`);
  const ripple = el.children(".ripple");

  // Add the ripples CSS and start the animation
  ripple.css({
    background: color,
    opacity: "30%",
    width: size,
    height: size,
    top: '0px',
    left: '0px'
  }).addClass("rippleEffect");
  setTimeout(function() {
    $(".ripple").remove();
  }, 400);
}

// Toolbar with USB port/connect/disconnect
function setConnectBar(val, status) {
  if (val == 0) { // Not Connected Yet
    $('#connectStatus').html("Port: Not Connected");
    $("#disconnectBtn").hide();
    $("#flashBtn").hide();
    $('#portUSB').parent().show();
    $("#connectBtn, #scanBtn, #driverBtn").show();
    $("#connectBtn").attr('disabled', $('#portUSB').val() == "");
    $('#portUSB').parent(".select").addClass('success');
    $('#portUSB').parent(".select").removeClass('alert');
    EnableViaClass('.macrobtn', true);
    EnableViaClass('.grblCalibrationMenu', false);

    if (!wcsHistoryEmpty) {
      clearWcsHistory();
    }

  } else if (val >= 1 && val <= 5) { // Normal operation
    // 1 - connecting
    // 2 - idle
    // 3 - running
    // 4 - paused
    // 5 - alarm

    $('#connectStatus').html("Port: Connected");
    $("#connectBtn, #scanBtn, #driverBtn").hide();
    $('#portUSB').parent().hide();
    $("#connectBtn").attr('disabled', false);
    $("#disconnectBtn").show();
    $("#flashBtn").hide();

    // Port Dropdown
    $('#portUSB').parent(".select").removeClass('success')
    $('#portUSB').parent(".select").addClass('alert')
    // Set Port Dropdown to Current Value
    $("#portUSB").val(status.comms.interfaces.activePort);

    EnableViaClass('.macrobtn', val != 3); // disable macros while running
    EnableViaClass('.grblCalibrationMenu', val == 2); // enable calibration only during idle
  } else if (val == 6) { // Firmware Upgrade State
    $('#connectStatus').html("Port: Flashing");
    $("#disconnectBtn").hide();
    $("#flashBtn").show();
    $('#portUSB').parent().hide();
    $("#connectBtn, #scanBtn, #driverBtn").hide();

    // Port Dropdown
    $('#portUSB').parent(".select").removeClass('success')
    $('#portUSB').parent(".select").addClass('alert')
    // Set Port Dropdown to Current Value
    $("#portUSB").val(status.comms.interfaces.activePort);

    EnableViaClass('.macrobtn', true);
    EnableViaClass('.grblCalibrationMenu', false);
  }
}

// Toolbar with play/pause/stop
function setControlBar(val, status) {
  if (val == 0) { // Not Connected Yet
    $('#controlBtnGrp').hide();
    $("#grblSettings").hide(); // Hide Grbl Settings if it was Open
    $('#grblconfig').empty();
    $('.estop').hide();
  } else if (val >= 1 && val <= 5) { // Normal operation
    // 1 - connecting
    // 2 - idle
    // 3 - running
    // 4 - paused
    // 5 - alarm

    $('#grblProbeMenu').show().attr('disabled', val != 2);

    // Determine the correct state for Run/Play/Pause/Stop
    const hasJob = (useEditor && editor && editor.session.getLength() > 1) || (!useEditor && currentGcode != "");
    const activeJob = val == 3 || val == 4;
    const doorOpen = status.machine.inputs.includes('D');

    $('#toolBtn').show().attr('disabled', activeJob);
    AddRemoveClass('#spinDelay0', "checked", status.misc.spindleDelay == 0 || status.misc.laserMode);
    AddRemoveClass('#spinDelay3', "checked", status.misc.spindleDelay == 3 && !status.misc.laserMode);
    AddRemoveClass('#spinDelay5', "checked", status.misc.spindleDelay == 5 && !status.misc.laserMode);
    AddRemoveClass('#spinDelay8', "checked", status.misc.spindleDelay == 8 && !status.misc.laserMode);
    EnableViaClass('#spinDelay0, #spinDelay3, #spinDelay5, #spinDelay8', !status.misc.laserMode);

    $('#toolBtn2').toggle(!activeJob);
    $('#toolBtn3').toggle(activeJob).attr('disabled', val != 4 || status.machine.overrides.realSpindle == 0);

    // Hide the Run button if running or paused. Enable if the door is closed and there is a job to run
    $('#runBtn').toggle(val != 3 && val != 4).attr('disabled', doorOpen || !hasJob);

    // Show the Resume button only if paused. Enable if the door is closed
    $('#resumeBtn').toggle(val == 4).attr('disabled', doorOpen);

    // Show the Pause button only if running. Disable if the job uses $J commands, as they can't be paused
    $('#pauseBtn').toggle(val == 3).attr('disabled', status.misc.jobStatus == 2);

    // Enable the Stop button if running or paused
    $('#stopBtn').show().attr('disabled', !activeJob);

    $('#chkSize').show().attr('disabled', val != 2 || isJogWidget || !object);

    // Disable the Home button during a job or if the homing feature is disabled
    $('#homeBtn').show().attr('disabled', activeJob || grblParams['$22'] == 0);

    $('#controlBtnGrp').show();
    $('.estop').show();
  } else if (val == 6) { // Firmware Upgrade State
    $('#controlBtnGrp').hide();
    $('.estop').hide();
  }
}


function updateWcsHistory(wcs) {
  if (isJogWidget || !laststatus) return;

  $('#wcsHistory').nextAll().remove();

  wcs = wcs || laststatus.machine.modals.coordinatesys;
  const has4thAxis = laststatus.machine.has4thAxis && !disable4thAxis;
  const history = wcsHistory[wcs];

  let elements = ``;
  if (history == undefined || history.length == 0) {
    elements = `<li class="disabled">` + wcs + ` history will show here</li>`;
  } else {
    for (let i = 0; i < history.length; i++) {
      let tooltip;
      if (unit == "in") {
        tooltip = "ORIGIN:  X = " + (history[i].x / 25.4).toFixed(3) + "in   Y = " + (history[i].y / 25.4).toFixed(3) + "in   Z = " + (history[i].z / 25.4).toFixed(3) + "in";
      } else {
        tooltip = "ORIGIN:  X = " + history[i].x.toFixed(2) + "mm   Y = " + history[i].y.toFixed(2) + "mm   Z = " + history[i].z.toFixed(2) + "mm";
      }

      if (has4thAxis)
        tooltip += "   A = " + history[i].a.toFixed(3) + '\u00b0';

      if (history[i].tooltip)
        tooltip += "\n" + history[i].tooltip;

      elements += `<li title="` + tooltip +`"><a href="#" onclick="gotoHistory(` + i + 
        `)"><span class="far fa-bookmark fg-darkGray icon"></span> ` + history[i].name + `</a></li>\n`;
    }
  }
  $('#wcsHistory').after(elements);
}

function captureWcsHistory(name, tooltip, isRunJob) {
  if (isJogWidget) {
    socket.emit('captureWcsHistory', {
      position: {
        x: laststatus.machine.position.offset.x,
        y: laststatus.machine.position.offset.y,
        z: laststatus.machine.position.offset.z,
        a: laststatus.machine.position.offset.a,
      },
      wcs: laststatus.machine.modals.coordinatesys,
      name: name,
      tooltip: tooltip,
      isRunJob: isRunJob});
  } else {
    captureWcsHistoryInternal(laststatus.machine.position.offset, laststatus.machine.modals.coordinatesys, name, tooltip, isRunJob);
  }
}

function captureWcsHistoryInternal(position, wcs, name, tooltip, isRunJob) {

  const has4thAxis = laststatus.machine.has4thAxis && !disable4thAxis;
  const history = wcsHistory[wcs];

  if (!isRunJob && lastWcsCapture.wcs == wcs && new Date().getTime() < lastWcsCapture.time + WCS_HISTORY_TIMEOUT)
    return; // ignore updates to the same WCS that are within the timeout, as they are likely related to the same user intent

  if (history.length > 0 && history[0].isRedo) {
    history.splice(index, 1);
  }

  let newItem = {
    x: position.x,
    y: position.y,
    z: position.z,
    a: position.a,
    name: isRunJob ? "Origin of latest <b>Job at " + (new Date()).toLocaleTimeString() + "</b>" : name,
    tooltip: tooltip,
    isRunJob: isRunJob,
    isLastJob: isRunJob == true,
  };

  let index = undefined;
  for (let i = 0; i < history.length; i++) {
    if (Math.abs(history[i].x - newItem.x) < 0.001 && Math.abs(history[i].y - newItem.y) < 0.001
      && Math.abs(history[i].z - newItem.z) < 0.001 && (!has4thAxis || Math.abs(history[i].a - newItem.a) < 0.001)) {
      // found matching offset
      index = i;
      break;
    }
  }

  if (index != undefined) {
    // found an existing item with the same coordinates: update it and bring it to the top
    if (!isRunJob && history[index].isRunJob) {
      newItem = history[index]; // keep the original if it is a job item
    }
    history.splice(index, 1);
  } else {
    if (history.length >= MAX_WCS_HISTORY) {
      // drop the last item, or the one before if the last is isLastJob
      if (history[history.length - 1].isLastJob)
        history.splice(history.length - 2, 1);
      else
        history.splice(history.length - 1, 1);
    }
    if (isRunJob) {
      for (let i = 0; i < history.length; i++) {
        if (history[i].isLastJob) {
          history[i].name = history[i].name.replace(" latest", "");
          history[i].isLastJob = false;
        }
      }
    }
  }
  history.unshift(newItem);
  if (wcs == laststatus.machine.modals.coordinatesys) {
    updateWcsHistory(wcs);
  }
  lastWcsCapture = {wcs: wcs, time: new Date().getTime()};
}

function gotoHistory(index) {
  const wcs = laststatus.machine.modals.coordinatesys;
  const has4thAxis = laststatus.machine.has4thAxis && !disable4thAxis;
  const history = wcsHistory[wcs];

  if (index >= 0 && index < history.length) {
    let gcode = "G10 G90 G21 L2 P0 X" + history[index].x.toFixed(3) + " Y" + history[index].y.toFixed(3) + " Z" +  + history[index].z.toFixed(3);
    if (has4thAxis) {
      gcode += " A" + history[index].a.toFixed(3);
    }

    if (history[index].isRedo)
    {
      history.splice(index, 1);
    } else {
      if (history[0].isRedo)
      {
        history.splice(0, 1);
      }
      const newItem = {
        x: laststatus.machine.position.offset.x,
        y: laststatus.machine.position.offset.y,
        z: laststatus.machine.position.offset.z,
        a: laststatus.machine.position.offset.a,
        name: "&lt;Restore latest&gt;",
        tooltip: "Restore the offset before the history was rolled back",
        isRedo: true,
      };
      history.unshift(newItem);
    }
    updateWcsHistory(wcs);
    lastWcsCapture = {};
    sendGcode(gcode);
  }

  wcsHistoryEmpty = false;
}

function clearWcsHistory() {
  wcsHistory.G54.length = 0;
  wcsHistory.G55.length = 0;
  wcsHistory.G56.length = 0;
  wcsHistory.G57.length = 0;
  wcsHistory.G58.length = 0;
  wcsHistory.G59.length = 0;
  updateWcsHistory();
  wcsHistoryEmpty = true;
}
