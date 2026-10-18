"use strict";

var disable3Dviewer = false;
var disable3Dskybox = false;
var disable3Drealtimepos = false;
var disable3Dgcodepreview = false;
var disable4thAxis = false;

const disable3Dcontrols = false; // always false, keep for now, may delete later

function updatePinStatus(pin, status, onText, offText) {
  if (status && !pin.hasClass('alert')) {
    pin.removeClass('success').addClass('alert').html(onText);
  }

  if (!status && pin.hasClass('alert')) {
    pin.addClass('success').removeClass('alert').html(offText);
  }
}

function updateSettingsState() {
  const disable3DviewerNew = !$('#enable3DviewerCheck').prop('checked');
  $('#enable3DskyboxCheck').prop('disabled', disable3DviewerNew);
  $('#enable3DrealtimeposCheck').prop('disabled', disable3DviewerNew);
  $('#enable3DgcodepreviewCheck').prop('disabled', disable3DviewerNew);

  if (laststatus.driver.operatingsystem == "linux") {
    $('#trayIconNote').toggle(laststatus.misc.trayIcon && !$('#enableTrayIconCheck').prop('checked'));
  }
}

const appSettingsDlg = `
<div class="row border-top bd-gray">
  <label class="cell-sm-8"><b>Performance</b></label>
</div>

<div class="row ml-2" title="You may try disabling this for slower computers">
  <input type="checkbox" data-role="checkbox" data-style="2" data-caption="Enable 3D Viewer System" id="enable3DviewerCheck" onclick="updateSettingsState()"/>
</div>

<div class="row ml-8">
  <input type="checkbox" data-role="checkbox" data-style="2" data-caption="Enable 3D Viewer Skybox/Fog"id="enable3DskyboxCheck" />
</div>

<div class="row ml-8">
  <input type="checkbox" data-role="checkbox" data-style="2" data-caption="Enable 3D Viewer Realtime Jog Position Indicator" id="enable3DrealtimeposCheck" />
</div>

<div class="row ml-8">
  <input type="checkbox" data-role="checkbox" data-style="2" data-caption="Enable 3D Viewer G-code Preview" id="enable3DgcodepreviewCheck" />
</div>

<div id="osSettings">
  <div class="row border-top mt-2 bd-gray">
    <label class="cell-sm-8"><b>OS Integration</b></label>
  </div>

  <div class="cell-sm-10" style="padding-left:8px;">
    <input type="checkbox" data-role="checkbox" data-style="2" data-caption="Check for updates on startup" id="enableUpdatesCheck" />
  </div>
  <div class="row" style="padding-left:8px;">
    <div class="cell-sm-5" id="enableTrayIconCell">
      <input type="checkbox" data-role="checkbox" data-style="2" data-caption="Enable Tray Icon" id="enableTrayIconCheck" onclick="updateSettingsState()" />
    </div>
    <div class="cell-sm-5" id="enableAutoStartCell">
      <input type="checkbox" data-role="checkbox" data-style="2" data-caption="Autostart at Login" id="enableAutoStartCheck" />
    </div>
    <small class="cell-sm-5" style="margin-top:-4px; display:none;" id="trayIconNote"><i>The tray icon will be fully removed once the app closes</i></small>
  </div>
</div>

<div class="row border-top mt-2 bd-gray">
  <label class="cell-sm-8"><b>Machine Control</b></label>
</div>

<div class="row ml-3">
  <label class="cell-sm-3" style="padding-left:0px; padding-top:5px;" title="Insert a pause after the spindle starts. Useful primarily for Grbl.
For GrblHAL use parameter $394 instead and for FluidNC use the spinup_ms setting.
Ignored in Laser mode.">Spindle Delay</label>
  <div class="cell-sm-7">
    <select data-role="select" id="spindleDelay" data-filter="false" data-drop-height="">
      <option value="0" selected>No Delay</option>
      <option value="3">Delay 3 sec (G4 P3)</option>
      <option value="5">Delay 5 sec (G4 P5)</option>
      <option value="8">Delay 8 sec (G4 P8)</option>
    </select>
  </div>
</div>

<div class="row ml-2" title="Hide the 4th axis controls if the controller supports a 4th axis but it is not currently in use">
  <input type="checkbox" data-role="checkbox" data-style="2" data-caption="Hide 4th Axis Controls" id="disable4thAxisCheck" />
</div>`;

function applySettings() {
  const disable3DviewerNew = !$('#enable3DviewerCheck').prop('checked');
  const disable3DskyboxNew = !$('#enable3DskyboxCheck').prop('checked');
  const disable3DrealtimeposNew = !$('#enable3DrealtimeposCheck').prop('checked');
  const disable3DgcodepreviewNew = !$('#enable3DgcodepreviewCheck').prop('checked');

  const reload = disable3DviewerNew != disable3Dviewer ||
    disable3DskyboxNew != disable3Dskybox ||
    disable3DrealtimeposNew != disable3Drealtimepos ||
    disable3DgcodepreviewNew != disable3Dgcodepreview;

  disable3Dviewer = disable3DviewerNew;
  disable3Dskybox = disable3DskyboxNew;
  disable3Drealtimepos = disable3DrealtimeposNew;
  disable3Dgcodepreview = disable3DgcodepreviewNew;

  localStorage.setItem('disable3Dviewer', disable3Dviewer);
  localStorage.setItem('disable3Dskybox', disable3Dskybox);
  localStorage.setItem('disable3Drealtimepos', disable3Drealtimepos);
  localStorage.setItem('disable3Dgcodepreview', disable3Dgcodepreview);

  if (laststatus.driver.operatingsystem == "windows" || laststatus.driver.operatingsystem == "linux") {
    socket.emit('trayIcon', $('#enableTrayIconCheck').prop('checked'));
    if (laststatus.driver.operatingsystem == "windows") {
      socket.emit('autoStart', $('#enableAutoStartCheck').prop('checked'));
    }
  }
  socket.emit('enableUpdates', $('#enableUpdatesCheck').prop('checked'));

  disable4thAxis = $('#disable4thAxisCheck').prop('checked');
  localStorage.setItem('disable4thAxis', disable4thAxis);
  updateWcsHistory();

  spindleDelay(parseInt($('#spindleDelay').val()));

  if (reload) {
    location.reload();
  }
}

function resetWarnings() {
  localStorage.setItem('disableJobNeedsHoming', "false");
  localStorage.setItem('disablePauseSpindleDlg', "false");
}

// eslint-disable-next-line no-unused-vars
function appSettings(category) {
  if (!laststatus) return; // not ready
  if ($('#enable3DviewerCheck').length > 0) return; // avoid reentrancy

  Metro.dialog.create({
    clsDialog: 'dark',
    title: "<i class='fas fa-cog'></i> Settings",
    content: appSettingsDlg,
    width: 500,
    actions: [
      {
        caption: "Reset Warnings",
        cls: "reset-warnings float-left",
        onclick: resetWarnings
      },
      {
        caption: "OK",
        cls: "js-dialog-close success",
        onclick: applySettings
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {}
      },
    ],
  });

  $('#enable3DviewerCheck').prop('checked', !disable3Dviewer);
  $('#enable3DskyboxCheck').prop('checked', !disable3Dskybox);
  $('#enable3DrealtimeposCheck').prop('checked', !disable3Drealtimepos);
  $('#enable3DgcodepreviewCheck').prop('checked', !disable3Dgcodepreview);

  if (laststatus.driver.operatingsystem == "windows" || laststatus.driver.operatingsystem == "linux") {
    $('#enableTrayIconCheck').prop('checked', laststatus.misc.trayIcon);
    if (laststatus.driver.operatingsystem == "windows") {
      $('#enableAutoStartCheck').prop('checked', laststatus.misc.autoStart);
    } else {
      $('#enableAutoStartCell').hide();
    }
  } else {
    $('#enableTrayIconCheckCell').hide();
    $('#enableAutoStartCheckCell').hide();
  }
  $('#enableUpdatesCheck').prop('checked', laststatus.misc.enableUpdates);

  $('#spindleDelay').val(laststatus.misc.spindleDelay);

  $('#disable4thAxisCheck').prop('checked', disable4thAxis);

  $('.reset-warnings').attr('title', "Resets \"Don't show this again\" for all warning dialogs");

  updateSettingsState();
}

function initSettings() {
  disable3Dviewer = localStorage.getItem('disable3Dviewer') != null && (JSON.parse(localStorage.getItem('disable3Dviewer')) == true);
  disable3Dskybox = localStorage.getItem('disable3Dskybox') != null  && (JSON.parse(localStorage.getItem('disable3Dskybox')) == true);
  disable3Drealtimepos = localStorage.getItem('disable3Drealtimepos') != null  && (JSON.parse(localStorage.getItem('disable3Drealtimepos')) == true);
  disable3Dgcodepreview = localStorage.getItem('disable3Dgcodepreview') != null  && (JSON.parse(localStorage.getItem('disable3Dgcodepreview')) == true);
  disable4thAxis = localStorage.getItem('disable4thAxis') != null  && (JSON.parse(localStorage.getItem('disable4thAxis')) == true);

  $('#runSimBtn').parent().toggle(!disable3Drealtimepos && !disable3Dgcodepreview);
}

initSettings();
