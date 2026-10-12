"use strict";

var settingsUIConstructed = false;
var editedGrblParams = {};
var settingsFilterIndex;
const prioritySettings = ["$22"]; // change homing setting first because it can prevent soft limits from being set (grblHAL)

var fluidncConfig = "";
var fluidncConfigYaml = undefined;

const backupFileFilters = [
  {name: "TXT files", extensions: ["txt"]},
  {name: "All files", extensions: ["*"]},
];

function loadGrblBackupFile() {
  const loadFileParams = {
    id: "settings",
    title: "Restore Settings",
    filters: backupFileFilters,
    showErrorDlg: true,
  };

  // eslint-disable-next-line no-unused-vars
  invokeOpenDialogReadFile(loadFileParams).then(({filePath, data}) => {
    editedGrblParams = {};
    $("#grblSettingsAdvTab").click();
    $('#settingsModifiedFilter:checkbox').prop('checked', false);
    toggleModifiedFilter(false);

    data = data.split("\n");
    for (let i = 0; i < data.length; i++) {
      const parts = data[i].split('=');
      if (data[i].indexOf("$I=") == 0) {
        setMachineButton(parts[1])
      } else {
        const key = parts[0].substring(1);
        const value = parts[1];
        if (grblSettingsTemplate[key] == undefined || grblSettingsTemplate[key].type == "text")
          $("#val-" + key + "-input").val(value); // treat unknown properties like strings
        else
          $("#val-" + key + "-input").val(parseFloat(value));
      }
    }

    setTimeout( () => {
      updateDirSettingChecks();
      checkifchanged();
    }, 0);
  });
}

function populateRestoreMenu() {
  // Retrieve backups from localStorage
  const backups = JSON.parse(localStorage.getItem('grblParamsBackups')) || [];

  // Get the dropdown menu element
  const backupMenu = document.getElementById('restoreBackupMenu');

  // Clear existing menu items (in case you're calling this multiple times)
  backupMenu.innerHTML = '';

  // Loop through each backup and create a list item for it
  backups.forEach((backup, index) => {
    const backupItem = document.createElement('li');

    // Format the timestamp (you can format it as needed)
    const formattedTimestamp = new Date(backup.timestamp).toLocaleString(); // Adjust formatting as needed

    // Create the list item HTML content
    backupItem.innerHTML = `
      <a href="#" onclick="restoreAutoBackup(${index})">
        <i class="fas fa-clock fa-fw"></i>
        Restore AutoBackup: ${formattedTimestamp} (${backup.note || 'No note'})
      </a>
    `;

    // Append the list item to the dropdown menu
    backupMenu.appendChild(backupItem);
  });
}

function autoBackup(note) {
  const timestamp = new Date().toISOString(); // Generate current timestamp
  const currentParams = {
    machinetype: laststatus.machine.name,
    note: note,
    timestamp: timestamp,
    grblParams: {
      ...grblParams // Spread Operator copy
    }
  }; // Add timestamp to the current parameters

  // Retrieve existing backups from localStorage or initialize an empty array
  let backups = JSON.parse(localStorage.getItem('grblParamsBackups')) || [];

  // Add the current backup to the beginning of the array
  backups.unshift(currentParams);

  // Trim backups to keep only the last 20
  if (backups.length > 20) {
    backups = backups.slice(0, 20);
  }

  // Save the updated backups array back to localStorage
  localStorage.setItem('grblParamsBackups', JSON.stringify(backups));

  // Optionally, add your existing save functionality here
}

function restoreAutoBackup(index) {
  const backups = JSON.parse(localStorage.getItem('grblParamsBackups')) || [];
  const selectedBackup = backups[index];

  // Retrieve grblParams from the backup
  const grblParamsBackup = selectedBackup.grblParams;

  editedGrblParams = {};
  $("#grblSettingsAdvTab").click();
  $('#settingsModifiedFilter:checkbox').prop('checked', false);
  toggleModifiedFilter(false);

  // Iterate through the keys in the grblParams object and apply them using jQuery
  for (let key in grblParamsBackup) {
    const paramValue = grblParamsBackup[key];
    const key2 = key.substr(1);
    const inputElement = $("#val-" + key2 + "-input");

    if (grblSettingsTemplate[key2] == undefined || grblSettingsTemplate[key2].type == "text") {
      inputElement.val(paramValue);
    } else {
      const parsedValue = parseFloat(paramValue);

      // Check if the parsed value is a valid number
      if (!isNaN(parsedValue)) {
        // Update the input field based on the parameter using jQuery

        if (inputElement.length) {
          inputElement.val(parsedValue); // Apply the value to the input field
        }
      } else {
        console.warn(`Invalid value for ${key}: ${paramValue}`);
      }
    }
  }

    setTimeout( () => {
      updateDirSettingChecks();
      checkifchanged();
    }, 0);
}


function backupGrblSettings() {
  autoBackup("Manual Backup");
  let grblBackup = ""
  for (let key in grblParams) {
    const key2 = key.substr(1);

    const template = grblSettingsTemplate[key2];
    if (template !== undefined && template.type != "text") {
      grblBackup += key + "=" + grblParams[key] + "  ;  " + template.title + "\n";
    } else {
        grblBackup += key + "=" + grblParams[key] + "\n";
    }
  }
  if (laststatus.machine.name.length > 0) {
    grblBackup += "$I=" + laststatus.machine.name
  }
  const blob = new Blob([grblBackup], {
    type: "plain/text"
  });
  const date = new Date();

  const saveFileParams = {
    id: "settings",
    title: "Backup Settings",
    filters: backupFileFilters,
    showErrorDlg: true,
  };

  if (laststatus.machine.name.length > 0) {
    saveFileParams.fileName = 'grbl-settings-backup-' + laststatus.machine.name + "-" + date.yyyymmdd() + '.txt';
  } else {
    saveFileParams.fileName = 'grbl-settings-backup-' + date.yyyymmdd() + '.txt';
  }
  invokeSaveAsDialogNew(blob, saveFileParams);
}

function grblSaveSettings() {
  autoBackup("Updated Grbl Settings");
  const toSaveCommandsFirst = [];
  const toSaveCommandsSecond = [];
  const saveProgressBar = $("#grblSaveProgress").data("progress");
  for (let key in grblParams) {
    const j = key.substring(1)
    const newVal = $("#val-" + j + "-input").val();
    // Only send values that changed
    if (newVal !== undefined) {
      if (parseFloat(newVal) != parseFloat(grblParams[key]) && newVal != grblParams[key]) {

        if (prioritySettings.contains(key))
          toSaveCommandsFirst.push(key + '=' + newVal);
        else
          toSaveCommandsSecond.push(key + '=' + newVal);
      }
    }
  }

  let toSaveCommands = [...toSaveCommandsFirst, ...toSaveCommandsSecond];

  if (toSaveCommands.length > 0) {
    let counter = 0;
    // Blank the dialog
    if (saveProgressBar) {
      saveProgressBar.val(0);
    }
    $("#grblNewParam").html("")
    $("#grblNewParamVal").html("")
    // Open Dialog savingGrblSettingsProgress
    Metro.dialog.open('#savingGrblSettingsProgress')
    const sendInterval = setInterval(function() {
      const newParam = toSaveCommands[counter].split("=")[0];
      const newParamKey = newParam.substr(1);
      let newParamName = "unknown";
      if (grblSettingsTemplate[newParamKey] !== undefined) {
        newParamName = grblSettingsTemplate[newParamKey].title;
      }
      const newParamVal = toSaveCommands[counter].split("=")[1];
      $("#grblNewParam").html("<code>" + newParam + " : " + newParamName + "</code>")
      $("#grblNewParamVal").html("<code>" + newParamVal + "</code>")

      if (saveProgressBar) {
        saveProgressBar.val(counter / toSaveCommands.length * 100);
      }
      //
      sendGcode(toSaveCommands[counter] + "\n");;
      counter++;
      if (counter === toSaveCommands.length) {
        // Finished running
        clearInterval(sendInterval);
        grblParams = {};
        toSaveCommands = [];
        setTimeout(askToResetOnGrblSettingsChange, 1000); // Just to show settings was written
      }
    }, 400); // send another command every 400ms
  }

}
function grblSettings(data) {
  const grblconfig = data.split('\n')
  for (let i = 0; i < grblconfig.length; i++) {
    const key = grblconfig[i].split('=')[0];
    const param = grblconfig[i].split(/[= ;(]/)[1]
    grblParams[key] = param
  }

  $('#grblSettings').show();

  if (laststatus.machine.firmware.platform == "FluidNC") {
    $('#backupSettingsGroup').hide();
    $("#grbl-settings-tab-title").html('FluidNC Configuration (read-only)');
  } else {
    $('#backupSettingsGroup').show();
    if (laststatus.machine.firmware.platform == "grblHAL") {
      $("#grbl-settings-tab-title").html('grblHAL Configuration');
    } else {
      $("#grbl-settings-tab-title").html('Grbl Configuration');
    }
  }

  const homingEnabled = grblParams['$22'] > 0;
  $('#homeBtn, #homeSingleMenu').attr('disabled', !homingEnabled);
  addRemoveClass('#gotoXMinMpos, #gotoXMaxMpos, #gotoYMinMpos, #gotoYMaxMpos, #gotoZMinMpos, #gotoZMaxMpos, #gotoAMinMpos, #gotoAMaxMpos', 'disabled', !homingEnabled);
  addRemoveClass('#gotozeroZmPosXYwPos, #gotozeroMPos', 'disabled', !homingEnabled);

  updateGotoLimits();
  if (!isJogWidget && webgl) {
    updateMachineCoordinates();
  }

  if (laststatus.machine.firmware.platform == "grblHAL") {
    // grblHAL - enable Servo Buttons if Spindle PWM == 50hz (Ivo: HUH?)
    $(".servo-active").toggle(grblParams['$33'] == 50);
  }

  updateToolOnSValues();

  if (localStorage.getItem('jogOverride')) {
    jogOverride(localStorage.getItem('jogOverride'));
  } else {
    jogOverride(100);
  }
}

function showBasicSettings() {
  $("#grbl-settings-basic").show();
  $("#grbl-settings-advanced").hide();
}

function showAdvSettings() {
  $("#grbl-settings-basic").hide();
  $("#grbl-settings-advanced").show();
}

function grblPopulate() {
  if (isJogWidget) return;

  $('#grblconfig').show();
  $('#grblconfig').empty();
  let template = `
  <form id="grblSettingsTable">

  <ul data-role="tabs" data-expand="true" class="mb-2">
    <li id="grblSettingsBasicTab" onclick="showBasicSettings()"><a href="#"><small><i class="fas fa-fw fa-cog mr-1 fg-darkGreen"></i>Basic Settings</a></small></li>
    <li id="grblSettingsAdvTab" onclick="showAdvSettings()" class="active"><a href="#"><small><i class="fas fa-fw fa-cogs mr-1 fg-darkRed"></i>Advanced Settings</a></small></li>
  </ul>


  <div id="grbl-settings-basic" style="display: none;">
      <ul class="step-list mb-3">
        <li>
          <h6>Select your Machine<br><small>Tell us what machine you have?</small></h6>
          <a style="width: 100%;"
            class="button dropdown-toggle bd-dark dark outline"
            id="context_toggle2"><img src="img/mch/leadmachine1010.png" /> Select
            your machine type from the list:</a>
          <ul class="ribbon-dropdown machine-profile-menu" data-role="dropdown"
            data-duration="100">
            <li><a href="#" onclick="selectMachine('custom');"><img
                  src="img/mch/custom.png" width="16px" /> CUSTOM Machine (Profile
                sets sane defaults)</a></li>
            <li>
              <a href="#" class="dropdown-toggle"><img src="img/mch/acro55.png"
                  width="16px" /> OpenBuilds ACRO</a>
              <ul class="ribbon-dropdown" data-role="dropdown">
                <li onclick="selectMachine('acro55');"><a href="#"><img
                      src="img/mch/acro55.png" width="16px" /> OpenBuilds ACRO 55</a></li>
                <li onclick="selectMachine('acro510');"><a href="#"><img
                      src="img/mch/acro510.png" width="16px" /> OpenBuilds ACRO
                    510</a></li>
                <li onclick="selectMachine('acro1010');"><a href="#"><img
                      src="img/mch/acro1010.png" width="16px" /> OpenBuilds ACRO
                    1010</a></li>
                <li onclick="selectMachine('acro1510');"><a href="#"><img
                      src="img/mch/acro1510.png" width="16px" /> OpenBuilds ACRO
                    1510</a></li>
                <li onclick="selectMachine('acro1515');"><a href="#"><img
                      src="img/mch/acro1515.png" width="16px" /> OpenBuilds ACRO
                    1515</a></li>
                <li class="divider"></li>
                <li onclick="selectMachine('acroa1');"><a href="#"><img
                      src="img/mch/acroa1.png" width="16px" /> OpenBuilds ACRO A1</a></li>
              </ul>
            </li>
            <li>
              <a href="#" class="dropdown-toggle"><img src="img/mch/cbeam.png"
                  width="16px" /> OpenBuilds C-Beam Machine</a>
              <ul class="ribbon-dropdown" data-role="dropdown">
                <li onclick="selectMachine('cbeam');"><a href="#"><img
                      src="img/mch/cbeam.png" width="16px" /> OpenBuilds C-Beam
                    Machine</a></li>
                <li onclick="selectMachine('cbeamxl');"><a href="#"><img
                      src="img/mch/cbeamxl.png" width="16px" /> OpenBuilds C-Beam
                    XL</a></li>
              </ul>
            </li>
            <li>
              <a href="#" class="dropdown-toggle"><img
                  src="img/mch/leadmachine1010.png" width="16px" /> OpenBuilds
                LEAD Machine</a>
              <ul class="ribbon-dropdown" data-role="dropdown">
                <li onclick="selectMachine('leadmachine1010');"><a href="#"><img
                      src="img/mch/leadmachine1010.png" width="16px" />OpenBuilds
                    LEAD 1010</a></li>
                <li onclick="selectMachine('leadmachine1010laser');"><a href="#"><img
                      src="img/mch/leadmachine1010laser.png" width="16px" />OpenBuilds
                    LEAD 1010 with Laser Module</a></li>
                <li onclick="selectMachine('leadmachine1010plasma');"><a href="#"><img
                      src="img/mch/leadmachine1010plasma.png" width="16px" />OpenBuilds
                    LEAD 1010 Plasma Add-On</a></li>
                <li onclick="selectMachine('leadmachine1515');"><a href="#"><img
                      src="img/mch/leadmachine1515.png" width="16px" />OpenBuilds
                    LEAD 1515</a></li>
              </ul>
            </li>
            <li><a href="#" onclick="selectMachine('minimill');"><img
                  src="img/mch/minimill.png" width="16px" /> OpenBuilds MiniMill</a>
            </li>
          </ul>
        </li>
        <li>
          <h6>Add-Ons Installed<br><small>Telling us what kind of attachments the
              machine has, allows us to pre-configure your Grbl Settings to match</small></h6>
          <ul class="image-checkbox-ul">
            <li>
              <input type="checkbox" name="limits" id="limitsinstalled"
                value="limits">
              <label for="limitsinstalled"><img
                  src="./img/toolhead/xtensionslimit.png" /></label>
              <div class="image-checkbox-text">Xtension Limit Switches</div>
            </li>
            <!-- Radio Group -->
            <li>
              <input type="radio" name="toolhead" id="toolhead_router11"
                value="router11">
              <label for="toolhead_router11"><img
                  src="./img/toolhead/router11.png" /></label>
              <div class="image-checkbox-text">RoutER11 with IoT Relay</div>
            </li>
            <li>
              <input type="radio" name="toolhead" id="toolhead_plasma"
                value="plasma">
              <label for="toolhead_plasma"><img
                  src="./img/toolhead/leadplasma.png" /></label>
              <div class="image-checkbox-text">LEAD 1010 Plasma Add-On</div>
            </li>
            <li>
              <input type="radio" name="toolhead" id="toolhead_laser"
                value="laser">
              <label for="toolhead_laser"><img src="./img/toolhead/laser.png" /></label>
              <div class="image-checkbox-text">Laser Diode Module</div>
            </li>
            <li>
              <input type="radio" name="toolhead" id="toolhead_scribe"
                value="scribe">
              <label for="toolhead_scribe"><img src="./img/toolhead/plotter.png" /></label>
              <div class="image-checkbox-text">SCRIBE<br>Pen Lifter</div>
            </li>
            <li>
              <input type="radio" name="toolhead" id="toolhead_vfd_spindle"
                value="vfd_spindle">
              <label for="toolhead_vfd_spindle"><img src="./img/toolhead/vfd.png" /></label>
              <div class="image-checkbox-text">Variable Speed Spindle</div>
            </li>
            <!-- End Radio Group -->
          </ul>
        </li>

        <li>
          <h6>Finished<br><small>Remember to "Save to Firmware" and Reset when Prompted. <br>If you have any custom requirements,
              please customise the settings in the Advanced Settings section above</small></h6>
        </li>


      </ul>
  </div>
  <div id="grbl-settings-advanced">
      <div id="grblSettingsTableView">
        <style>
          .param-label {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .revert-button {
            line-height: initial !important;
            height: initial !important;
            padding: 10px !important;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;
          }
          tr:hover .revert-button[modified] {
            opacity: 1;
            visibility: visible;
          }
        </style>
        <table id="grblMetroTable" data-role="table"
          data-table-search-title="Search for Parameters by Name or $-Key"
          data-search-fields="Key, Parameter"
          data-on-draw="onSettingsTableDraw"
          data-on-table-create="onSettingsTableCreate"
          data-cell-wrapper="false"
          class="table compact striped row-hover row-border"
          data-show-rows-steps="false" data-rows="200"
          data-show-pagination="false" data-show-table-info="true"
          data-show-search="true">
          <thead>
            <tr>
              <th style="text-align: left;">Key</th>
              <th style="text-align: left;">Parameter</th>
              <th style="width: 250px; min-width: 240px !important;">Value</th>
              <th style="width: 110px; min-width: 110px !important;">Utility</th>
            </tr>
          </thead>
          <tbody>`;

  editedGrblParams = {};

  const sortedKeys = Object.keys(grblParams).sort((a, b) => {
    return parseInt(a.substr(1)) - parseInt(b.substr(1));
  });
  sortedKeys.forEach((key) => {
    const key2 = key.substr(1);
    const revertButton = `<button class="button small revert-button" type="button" title="Revert change"` + 
      `onclick="revertGrblSetting('` + key + `')"><i class="fas fa-undo"></i></button>`;
    if (grblSettingsTemplate[key2] !== undefined) {
      template += `<tr>
              <td>` + grblSettingsTemplate[key2].key + `</td>
              <td><div class="param-label">` + grblSettingsTemplate[key2].title + revertButton + `</div></td>
              <td>` + grblSettingsTemplate[key2].template + `</td>
              <td>` + grblSettingsTemplate[key2].utils + `</td>
            </tr>`
    } else {
      template += `
            <tr>
              <td>` + key + `</td>
              <td><div class="param-label"><span class="tally alert">` + key +`</span>`  + revertButton + `</div></td>
              <td><input data-role="input" data-clear-button="false"
                  data-append="?" type="text"
                  value="` + grblParams[key] + `"
                  id="val-` + key2 + `-input"></td>
              <td></td>
            </tr>
            `
    }
  });

  template += `
          </tbody>
        </table>
      </div> <!-- End of grblSettingsTableView -->
      </div>
    </div>
  </nav>
</form>
    `

  settingsFilterIndex = undefined;
  $('#grblconfig').append(template);
  settingsUIConstructed = false;

  $('#grblSettingsTable').on('keyup paste click change', 'input, select', checkifchanged);

  $('#grblSettingsBadge').hide();
  $('#limitsinstalled:checkbox').prop('checked', grblParams['$21'] == 1 && grblParams['$22'] > 0);

  if (isMatchingConfig(grblParams, grblParams_scribe)) {
    setSelectedToolhead('scribe')
  } else if (isMatchingConfig(grblParams, grblParams_plasma)) {
    setSelectedToolhead('plasma')
  } else if (isMatchingConfig(grblParams, grblParams_router)) {
    setSelectedToolhead('router11')
  } else if (isMatchingConfig(grblParams, grblParams_laser)) {
    setSelectedToolhead('laser')
  } else if (isMatchingConfig(grblParams, grblParams_vfd)) {
    setSelectedToolhead('vfd_spindle')
  }

  setTimeout(function() {
    setMachineButton(laststatus.machine.name);
  }, 500)

  populateRestoreMenu();
}

function revertGrblSetting(key) {
  const j = key.substring(1);
  const input = $("#val-" + j + "-input");
  input.val(grblParams[key]);
  delete editedGrblParams[key];
  if (key == '$3' || key == '$23') {
    updateDirSettingChecks();
  }
  else {
    checkifchanged();
  }
}

function checkifchanged() {
  if (!settingsUIConstructed) return;

  let hasChanged = false;

  for (let key in grblParams) {
    const j = key.substring(1);
    const input = $("#val-" + j + "-input");
    const newVal = input.val();

    if (newVal !== undefined) {
      // Determine if the value should be compared as text or number
      const oldVal = grblParams[key];
      const compareAsNumber = !isNaN(parseFloat(oldVal)) && !isNaN(parseFloat(newVal));

      // Perform appropriate comparison
      if ((compareAsNumber && parseFloat(newVal) !== parseFloat(oldVal)) ||
        (!compareAsNumber && newVal !== oldVal)) {
        hasChanged = true;
        editedGrblParams[key] = newVal;
        input.closest('tr').find('.revert-button').attr('modified', true);

        if (!input.parent().is('td')) {
          input.parent().addClass('alert');
        } else if (input.is('select')) {
          input.addClass('alert');
        } else if (j == 3) { // axes
          if (!compareAsNumber || ((parseInt(oldVal)^parseInt(newVal)) & 1) != 0)
            $('#xdirinvert').parent().children('.app-notification').addClass('bd-red');
          else
            $('#xdirinvert').parent().children('.app-notification').removeClass('bd-red');

          if (!compareAsNumber || ((parseInt(oldVal)^parseInt(newVal)) & 2) != 0)
            $('#ydirinvert').parent().children('.app-notification').addClass('bd-red');
          else
            $('#ydirinvert').parent().children('.app-notification').removeClass('bd-red');

          if (!compareAsNumber || ((parseInt(oldVal)^parseInt(newVal)) & 4) != 0)
            $('#zdirinvert').parent().children('.app-notification').addClass('bd-red');
          else
            $('#zdirinvert').parent().children('.app-notification').removeClass('bd-red');

          if (!compareAsNumber || ((parseInt(oldVal)^parseInt(newVal)) & 8) != 0)
            $('#adirinvert').parent().children('.app-notification').addClass('bd-red');
          else
            $('#adirinvert').parent().children('.app-notification').removeClass('bd-red');
        } else if (j == 23) { // home axes
          if (!compareAsNumber || ((parseInt(oldVal)^parseInt(newVal)) & 1) != 0)
            $('#xHomeDir').parent().children('.app-notification').addClass('bd-red');
          else
            $('#xHomeDir').parent().children('.app-notification').removeClass('bd-red');

          if (!compareAsNumber || ((parseInt(oldVal)^parseInt(newVal)) & 2) != 0)
            $('#yHomeDir').parent().children('.app-notification').addClass('bd-red');
          else
            $('#yHomeDir').parent().children('.app-notification').removeClass('bd-red');

          if (!compareAsNumber || ((parseInt(oldVal)^parseInt(newVal)) & 4) != 0)
            $('#zHomeDir').parent().children('.app-notification').addClass('bd-red');
          else
            $('#zHomeDir').parent().children('.app-notification').removeClass('bd-red');

          if (!compareAsNumber || ((parseInt(oldVal)^parseInt(newVal)) & 8) != 0)
            $('#aHomeDir').parent().children('.app-notification').addClass('bd-red');
          else
            $('#aHomeDir').parent().children('.app-notification').removeClass('bd-red');
        }
      } else {
        input.closest('tr').find('.revert-button').removeAttr('modified');
        delete editedGrblParams[key];
        if (!input.parent().is('td')) {
          input.parent().removeClass('alert');
        } else if (input.is('select')) {
          input.removeClass('alert');
        } else if (j == 3) {
          $('#xdirinvert').parent().children('.app-notification').removeClass('bd-red');
          $('#ydirinvert').parent().children('.app-notification').removeClass('bd-red');
          $('#zdirinvert').parent().children('.app-notification').removeClass('bd-red');
          $('#adirinvert').parent().children('.app-notification').removeClass('bd-red');
        } else if (j == 23) { // home axes
          $('#xHomeDir').parent().children('.app-notification').removeClass('bd-red');
          $('#yHomeDir').parent().children('.app-notification').removeClass('bd-red');
          $('#zHomeDir').parent().children('.app-notification').removeClass('bd-red');
          $('#aHomeDir').parent().children('.app-notification').removeClass('bd-red');
        }
      }
    } else if (Object.hasOwn(editedGrblParams, key)) {
      hasChanged = true;
    }
  }

  if (hasChanged) {
    $('#grblSettingsBadge').fadeIn('slow');
    $('#saveBtn').attr('disabled', false).removeClass('disabled');
    $('#saveBtnIcon').removeClass('fg-gray').addClass('fg-grayBlue');
  } else {
    $('#grblSettingsBadge').fadeOut('slow');
    $('#saveBtn').attr('disabled', true).addClass('disabled');
    $('#saveBtnIcon').removeClass('fg-grayBlue').addClass('fg-gray');
  }
}

function askToResetOnGrblSettingsChange() {
  Metro.dialog.close('#savingGrblSettingsProgress')
  Metro.dialog.create({
    title: "Configuration Updated. Reset Grbl?",
    content: "<div>Some changes in the Grbl Configuration only take effect after a restart/reset of the controller. Would you like to Reset the controller now?</div>",
    clsDialog: 'dark',
    actions: [{
        caption: "Yes",
        cls: "js-dialog-close success",
        onclick: function() {
          setTimeout(function() {
            socket.emit('resetMachine');
            setTimeout(function() {
              refreshGrblSettings();
            }, 1000); // refresh grbl settings
          }, 800); // reset
        }
      },
      {
        caption: "Later",
        cls: "js-dialog-close",
        onclick: function() {
          refreshGrblSettings();
        }
      }
    ]
  });
  $('#grblSettingsBadge').hide();
}

function refreshGrblSettings() {
  $('#saveBtn').attr('disabled', true).addClass('disabled');
  $('#saveBtnIcon').removeClass('fg-grayBlue').addClass('fg-gray');
  grblParams = {};
  $('#grblconfig').empty();
  $('#grblconfig').append("<center>Please Wait... </center><br><center>Requesting updated parameters from the controller firmware...</center>");
  setTimeout(function() {
    sendGcode(laststatus.machine.firmware.platform == "FluidNC" ? '$$\n$I\n$CD' : '$$\n$I');
    setTimeout(function() {
      grblPopulate();
    }, 500);
  }, 200);
}

// Calc Grbl 1.1 Invert Masks
// Call: calcDecFromMask(true, false, false)
// Return: 1
function calcDecFromMask(x, y, z, a) {
  return (x?1:0) + (y?2:0) + (z?4:0) + (a?8:0);
}

// Calc Grbl 1.1 Invert Masks
// Call: calcMaskFromDec("4")
// Returns: {x: false, y: false, z: true, a:false}
function calcMaskFromDec(dec) {
  const num = parseInt(dec)
  const invertmask = {
    x: (num&1) != 0,
    y: (num&2) != 0,
    z: (num&4) != 0,
    a: (num&8) != 0,
  }
  return invertmask;
}

function changeHomeDirInvert() {
  const xticked = $('#xHomeDir').is(':checked');
  const yticked = $('#yHomeDir').is(':checked');
  const zticked = $('#zHomeDir').is(':checked');
  const aticked = $('#aHomeDir').is(':checked');
  const value = calcDecFromMask(!xticked, !yticked, !zticked, !aticked);
  $("#val-23-input").val(value).trigger("change");
  checkifchanged();
}

function changeDirInvert() {
  const xticked = $('#xdirinvert').is(':checked');
  const yticked = $('#ydirinvert').is(':checked');
  const zticked = $('#zdirinvert').is(':checked');
  const aticked = $('#adirinvert').is(':checked');
  const value = calcDecFromMask(xticked, yticked, zticked, aticked);
  $("#val-3-input").val(value).trigger("change");
  checkifchanged();
}

function updateDirSettingChecks() {
  const dirMask = calcMaskFromDec($("#val-3-input").val());
  $('#xdirinvert:checkbox').prop('checked', dirMask.x);
  $('#ydirinvert:checkbox').prop('checked', dirMask.y);
  $('#zdirinvert:checkbox').prop('checked', dirMask.z);
  $('#adirinvert:checkbox').prop('checked', dirMask.a);

  const homeMask = calcMaskFromDec($("#val-23-input").val());
  $('#xHomeDir:checkbox').prop('checked', !homeMask.x);
  $('#yHomeDir:checkbox').prop('checked', !homeMask.y);
  $('#zHomeDir:checkbox').prop('checked', !homeMask.z);
  $('#aHomeDir:checkbox').prop('checked', !homeMask.a);
  checkifchanged();
}

function clearSettings() {
  Metro.dialog.create({
    title: "Are you sure?",
    content: "<div>Resetting the Grbl Settings will restore all the settings to factory defaults, but will keep other EEPROM settings intact. Would you like to continue?</div>",
    clsDialog: 'dark',
    actions: [{
        caption: "Yes",
        cls: "js-dialog-close success",
        onclick: function() {
          sendGcode('$RST=$');
          refreshGrblSettings()
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {
        }
      }
    ]
  });
}

function clearWCO() {
  Metro.dialog.create({
    title: "Are you sure?",
    content: "<div>Resetting the Work Coordinate Systems will erase all the coordinate system offsets currently stored in the EEPROM on the controller. Would you like to continue?</div>",
    clsDialog: 'dark',
    actions: [{
        caption: "Yes",
        cls: "js-dialog-close success",
        onclick: function() {
          sendGcode('$RST=#');
          refreshGrblSettings()
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {
        }
      }
    ]
  });
}

function clearEEPROM() {
  Metro.dialog.create({
    title: "Are you sure?",
    content: "<div>Resetting the EEPROM will erase all the Grbl Firmware settings from your controller, effectively resetting it back to factory defaults. Would you like to continue?</div>",
    clsDialog: 'dark',
    actions: [{
        caption: "Yes",
        cls: "js-dialog-close success",
        onclick: function() {
          sendGcode('$RST=*');
          refreshGrblSettings()
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {
        }
      }
    ]
  });
}

function updateToolOnSValues() {
  const maxSpeed = parseInt(grblParams.$30);
  $(".ToolOnS1").html((maxSpeed * 0.01).toFixed(0));
  $(".ToolOnS5").html((maxSpeed * 0.05).toFixed(0));
  $(".ToolOnS10").html((maxSpeed * 0.1).toFixed(0));
  $(".ToolOnS25").html((maxSpeed * 0.25).toFixed(0));
  $(".ToolOnS50").html((maxSpeed * 0.5).toFixed(0));
  $(".ToolOnS75").html((maxSpeed * 0.75).toFixed(0));
  $(".ToolOnS100").html(maxSpeed.toFixed(0));

  const laser = parseInt(grblParams.$32) == 1;
  $(".laserMode").toggle(laser);
  $(".spindleMode").toggle(!laser);
}

function getEditorParamValue(key) {
  return Object.hasOwn(editedGrblParams, key) ? editedGrblParams[key] : grblParams[key];
}

function setFluidNcConfig(data) {
  fluidncConfig = data;
  fluidncConfigYaml = YAML.parse(data);
  updateMachineCoordinates();
  updateGotoLimits();
  if ($('#fluidnceditor').length > 0) {
    const fluidnceditor = ace.edit("fluidnceditor");
    fluidnceditor.session.setValue(fluidncConfig);
  }
}

function setup_settings_table() {
  for (let key in grblParams) {
    const key2 = key.substr(1);
    const input = $("#val-" + key2 + "-input");
    input.val(getEditorParamValue(key));
    const setting = grblSettingsTemplate[key2];
    // Metro UI destroys the tooltips for td and tr elements - readding here
    if (setting !== undefined && setting.description.length > 0)
      input.closest('td').prev().attr('title', setting.description);
  }
  settingsUIConstructed = true;

  $('#limitsinstalled:checkbox').change(enableLimits);
//  $('#scribeinstalled:checkbox').change(enableScribe);

  // Handle the change event for radio buttons
  $('input[name="toolhead"]').on('change', function() {
    const selectedToolhead = $(this).val();
    if (selectedToolhead == 'router11') {
      enableRouter();
    } else if (selectedToolhead == 'scribe') {
      enableScribe();
    } else if (selectedToolhead == 'laser') {
      enableLaser();
    } else if (selectedToolhead == 'plasma') {
      enablePlasma();
    } else if (selectedToolhead == 'vfd_spindle') {
      enableVFD();
    }
  });

  $('#xdirinvert:checkbox').change(changeDirInvert);
  $('#ydirinvert:checkbox').change(changeDirInvert);
  $('#zdirinvert:checkbox').change(changeDirInvert);
  $('#adirinvert:checkbox').change(changeDirInvert);

  $('#xHomeDir:checkbox').change(changeHomeDirInvert);
  $('#yHomeDir:checkbox').change(changeHomeDirInvert);
  $('#zHomeDir:checkbox').change(changeHomeDirInvert);
  $('#aHomeDir:checkbox').change(changeHomeDirInvert);

  // populate Direction Invert Checkboxes
  updateDirSettingChecks();
  setTimeout(checkifchanged, 0);
}

function toggleModifiedFilter(checked) {
  const table = $('#grblMetroTable').data('table');
  if (checked) {
    settingsFilterIndex = table.addFilter((row) => Object.hasOwn(editedGrblParams, row[0]), true);
  } else if (settingsFilterIndex != undefined) {
    table.removeFilter(settingsFilterIndex, true);
    settingsFilterIndex = undefined;
  }
}

function onSettingsTableDraw() {
  setup_settings_table();
}

function onSettingsTableCreate() {
  if (laststatus && laststatus.machine.firmware.platform == "FluidNC") {
    $("#grblSettingsTableView .table-container").append(`
      <h6 class="disabled" style="margin:5px; font-size:1rem;">FluidNC configuration</h6>
      <div id="fluidnceditor" class="bd-openbuilds"></div>`);

    const fluidnceditor = ace.edit("fluidnceditor");
    fluidnceditor.$blockScrolling = Infinity;
    fluidnceditor.setTheme('ace/theme/sqlserver')
    fluidnceditor.session.setMode("ace/mode/yaml");
    fluidnceditor.session.setValue(fluidncConfig);
    fluidnceditor.setReadOnly(true);
  } else {
    // add filter checkbox directly before the search bar
    $('#grblSettingsTableView .table-top').prepend(`
        <input type="checkbox" data-role="switch" data-caption="Show Modified" id="settingsModifiedFilter"
        style="padding-right:10px;" onchange="toggleModifiedFilter(this.checked)"/>`);
  }

  setup_settings_table();
}

function enableLimits() {
  const grblParams_lim = {
    $21: "0", //"Hard limits enable, boolean"
    $22: "0", //"Homing cycle enable, boolean"
  }
  const hasLimits = $('#limitsinstalled').is(':checked');
  if (hasLimits) {
    grblParams_lim.$21 = "1"; //"Hard limits enable, boolean"
    grblParams_lim.$22 = "1"; //"Homing cycle enable, boolean"
  } else {
    grblParams_lim.$21 = "0"; //"Hard limits enable, boolean"
    grblParams_lim.$22 = "0"; //"Homing cycle enable, boolean"
  }
  for (let key in grblParams_lim) {
    const j = key.substring(1)
    $("#val-" + j + "-input").val(parseFloat(grblParams_lim[key]))
  }
  checkifchanged();
}

const grblParams_scribe = {
  $32: "0", //PWM Freq for RC Servo
  $33: "50", //PWM Freq for RC Servo
  $34: "5", //Spindle Off Value for RC Servo
  $35: "5", //Spinde Min Value for RC Servo
  $36: "10", //Spindle max Value for RC Servo
}

function enableScribe() {
  for (let key in grblParams_scribe) {
    const j = key.substring(1)
    $("#val-" + j + "-input").val(parseFloat(grblParams_scribe[key]))
  }
  checkifchanged();
}

const grblParams_laser = {
  $30: "1000", // S Max
  $32: "1", // Laser Mode On
  $33: "1000", //PWM Freq
  $34: "0", //Spindle Off Value
  $35: "0", //Spinde Min Value
  $36: "100", //Spindle max Value
}

function enableLaser() {

  for (let key in grblParams_laser) {
    const j = key.substring(1)
    $("#val-" + j + "-input").val(parseFloat(grblParams_laser[key]))
  }
  checkifchanged();
}

const grblParams_router = {
  $30: "1000", // S Max
  $32: "0", // Laser Mode On
  $33: "5000", //PWM Freq
  $34: "0", //Spindle Off Value
  $35: "0", //Spinde Min Value
  $36: "100", //Spindle max Value
}

function enableRouter() {

  for (let key in grblParams_router) {
    const j = key.substring(1)
    $("#val-" + j + "-input").val(parseFloat(grblParams_router[key]))
  }
  checkifchanged();
}

const grblParams_plasma = {
  $30: "1000", // S Max
  $32: "0", // Laser Mode On
  $33: "1000", //PWM Freq
  $34: "0", //Spindle Off Value
  $35: "0", //Spinde Min Value
  $36: "100", //Spindle max Value
}

function enablePlasma() {

  for (let key in grblParams_plasma) {
    const j = key.substring(1)
    $("#val-" + j + "-input").val(parseFloat(grblParams_plasma[key]))
  }
  checkifchanged();
}

const grblParams_vfd = {
  $30: "24000", // S Max
  $32: "0", // Laser Mode On
  $33: "1000", //PWM Freq
  $34: "0", //Spindle Off Value
  $35: "0", //Spinde Min Value
  $36: "100", //Spindle max Value
}

function enableVFD() {

  for (let key in grblParams_vfd) {
    const j = key.substring(1)
    $("#val-" + j + "-input").val(parseFloat(grblParams_vfd[key]))
  }
  checkifchanged();
}

function isMatchingConfig(currentParams, predefinedParams) {
  for (let key in predefinedParams) {
    // Compare values as numbers to handle type mismatches
    if (parseFloat(currentParams[key]) !== parseFloat(predefinedParams[key])) {
      return false;
    }
  }
  return true;
}


// Function to programmatically set the selected radio
function setSelectedToolhead(value) {
  const $radio = $(`input[name="toolhead"][value="${value}"]`);
  if ($radio.length) {
    $radio.prop('checked', true).trigger('change'); // Trigger the change event
  } else {
    console.error('Toolhead not found:', value);
  }

  if (value == "scribe") {
    // Set Default Pen Up/Down values
    penupval = 250
    pendownval = 0
    servo = {
      up: penupval,
      down: pendownval
    }
    localStorage.setItem("servo-calibration", JSON.stringify(servo));
  }
}

// Compute the accurate machine dimensions. Takes into account:
//   * homing enabled or disabled
//   * the homing side for each axis (the homing side may need a pulloff offset)
//      * the pulloff distance can be overriden for special use cases
//   * the "home origin" feature 'Z' - if set, the pulloff is ignored
//   * the manual homing flag (ignores pulloff for the manually homed axes)
//   * the FluidNC homing settings
// Expects that grblParams and laststatus.machine.firmware.features.contains are up to date
//
// This should be the definitive source of the machine limits info
function computeMachineLimits(pulloffOverride) {
  let limits = {
    X0: 0,
    Y0: 0,
    Z0: 0,
    minX: 0,
    minY: 0,
    minZ: 0,
    minA: 0,
    maxX: parseFloat(grblParams.$130),
    maxY: parseFloat(grblParams.$131),
    maxZ: parseFloat(grblParams.$132),
    maxA: parseFloat(grblParams.$133),
  };

  const homingMask = calcMaskFromDec(grblParams.$23);
  const sizeX = limits.maxX;
  const sizeY = limits.maxY;
  const sizeZ = limits.maxZ;
  const sizeA = limits.maxA;
  if (fluidncConfigYaml) {
    limits.minX = homingMask.x ? 0 : -sizeX;
    limits.minY = homingMask.y ? 0 : -sizeY;
    limits.minZ = homingMask.z ? 0 : -sizeZ;
    limits.minA = homingMask.a ? 0 : -sizeA;
    if (fluidncConfigYaml.axes) {
      if (fluidncConfigYaml.axes.X?.homing?.mpos_mm !== undefined) {
        limits.minX += fluidncConfigYaml.axes.X.homing.mpos_mm;
      }
      if (fluidncConfigYaml.axes.Y?.homing?.mpos_mm !== undefined) {
        limits.minY += fluidncConfigYaml.axes.Y.homing.mpos_mm;
      }
      if (fluidncConfigYaml.axes.Z?.homing?.mpos_mm !== undefined) {
        limits.minZ += fluidncConfigYaml.axes.Z.homing.mpos_mm;
      }
      if (fluidncConfigYaml.axes.A?.homing?.mpos_mm !== undefined) {
        limits.minA += fluidncConfigYaml.axes.A.homing.mpos_mm;
      }

      limits.maxX = limits.minX + sizeX;
      limits.maxY = limits.minY + sizeY;
      limits.maxZ = limits.minZ + sizeZ;
      limits.maxA = limits.minA + sizeA;
    }
  } else if (laststatus && laststatus.machine.firmware.features.contains('Z')) {
    limits.minX = homingMask.x ? 0 : -sizeX;
    limits.minY = homingMask.y ? 0 : -sizeY;
    limits.minZ = homingMask.z ? 0 : -sizeZ;
    limits.minA = homingMask.a ? 0 : -sizeA;

    limits.maxX = limits.minX + sizeX;
    limits.maxY = limits.minY + sizeY;
    limits.maxZ = limits.minZ + sizeZ;
    limits.maxA = limits.minA + sizeA;
  } else {
    const pulloff = pulloffOverride != undefined ? pulloffOverride : parseFloat(grblParams.$27);
    let pulloffMask = 15;
    if (grblParams.$22 & 32) {
      pulloffMask = 0; // find which axes can be manually homed using settings $44 through $49
      for (let i = 44; i <= 49; i++) {
        const mask = grblParams['$' + i];
        if (mask == undefined)
          break;
        pulloffMask |= parseInt(mask);
      }
    }
    pulloffMask = calcMaskFromDec(pulloffMask);

    if (!homingMask.x && pulloffMask.x) limits.X0 = -pulloff;
    if (!homingMask.y && pulloffMask.y) limits.Y0 = -pulloff;
    if (!homingMask.z && pulloffMask.z) limits.Z0 = -pulloff;
    limits.minX = (homingMask.x &&  pulloffMask.x) ? pulloff-sizeX : -sizeX;
    limits.maxX = (homingMask.x || !pulloffMask.x) ? 0 : -pulloff;
    limits.minY = (homingMask.y &&  pulloffMask.y) ? pulloff-sizeY : -sizeY;
    limits.maxY = (homingMask.y || !pulloffMask.y) ? 0 : -pulloff;
    limits.minZ = (homingMask.z &&  pulloffMask.z) ? pulloff-sizeZ : -sizeZ;
    limits.maxZ = (homingMask.z || !pulloffMask.z) ? 0 : -pulloff;
    limits.minA = -sizeA;
    limits.maxA = 0;
  }
  if (isNaN(limits.minX)) limits.minX = 0;
  if (isNaN(limits.maxX)) limits.maxX = 0;
  if (isNaN(limits.minY)) limits.minY = 0;
  if (isNaN(limits.maxY)) limits.maxY = 0;
  if (isNaN(limits.minZ)) limits.minZ = 0;
  if (isNaN(limits.maxZ)) limits.maxZ = 0;
  if (isNaN(limits.minA)) limits.minA = 0;
  if (isNaN(limits.maxA)) limits.maxA = 0;
  limits.homingMask = homingMask;

  return limits;
}

function updateGotoLimits() {
  const limits = computeMachineLimits();
  $('#gotoXMinMpos > a > .coord').html(limits.minX.toFixed(0));
  $('#gotoXMaxMpos > a > .coord').html(limits.maxX.toFixed(0));
  $('#gotoYMinMpos > a > .coord').html(limits.minY.toFixed(0));
  $('#gotoYMaxMpos > a > .coord').html(limits.maxY.toFixed(0));
  $('#gotoZMinMpos > a > .coord').html(limits.minZ.toFixed(0));
  $('#gotoZMaxMpos > a > .coord').html(limits.maxZ.toFixed(0));
  $('#gotoAMinMpos > a > .coord').html(limits.minA.toFixed(0));
  $('#gotoAMaxMpos > a > .coord').html(limits.maxA.toFixed(0));

  $('#gotozeroZmPosXYwPos > a > .oord').html(limits.maxZ.toFixed(0));
  const command = isJogWidget ? "G53" : "G0 G53";
  const commandXY = command + " X"+ limits.X0.toFixed(0) +" Y" + limits.Y0.toFixed(0);
  const commandZ = command + " Z" + limits.Z0.toFixed(0);
  if (limits.homingMask && limits.homingMask.z)
    $('#gotozeroMPos > a > .gcode').html(commandXY + ", " + commandZ);
  else
    $('#gotozeroMPos > a > .gcode').html(commandZ + ", " + commandXY);
}
