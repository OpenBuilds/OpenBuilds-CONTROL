$(document).ready(function() {
  var backupFileOpen = document.getElementById('grblBackupFile');
  if (backupFileOpen) {
    backupFileOpen.addEventListener('change', readGrblBackupFile, false);
  }
});

function readGrblBackupFile(evt) {
  var files = evt.target.files || evt.dataTransfer.files;
  loadGrblBackupFile(files[0]);
  document.getElementById('grblBackupFile').value = '';

}

function loadGrblBackupFile(f) {
  if (f) {
    // Filereader
    var r = new FileReader();
    // if (f.name.match(/.gcode$/i)) {
    r.readAsText(f);
    r.onload = function(event) {
      //var grblsettingsfile = this.result
      //console.log(this.result)
      var data = this.result.split("\n");
      for (i = 0; i < data.length; i++) {
        if (data[i].indexOf("$I=") == 0) {
          setMachineButton(data[i].split('=')[1])
        } else {
          var key = data[i].split('=')[0];
          var param = data[i].split('=')[1]
          $("#val-" + key.substring(1) + "-input").val(parseFloat(param))
          fixGrblHALSettings(key.substring(1)); // Fix GrblHAL Defaults
        }
      };

      checkifchanged();
      enableLimits(); // Enable or Disable
      displayDirInvert();
    }
  }
}

function backupGrblSettings() {
  var grblBackup = ""
  for (key in grblParams) {
    var key2 = key.split('=')[0].substr(1);

    if (grblSettingsTemplate2[key2] !== undefined) {
      var descr = grblSettingsTemplate2[key2].title
    } else {
      var descr = "unknown"
    }

    grblBackup += key + "=" + grblParams[key] + "  ;  " + descr + "\n"
  }
  if (laststatus.machine.name.length > 0) {
    grblBackup += "$I=" + laststatus.machine.name
  }
  var blob = new Blob([grblBackup], {
    type: "plain/text"
  });
  var date = new Date();
  if (laststatus.machine.name.length > 0) {
    invokeSaveAsDialog(blob, 'grbl-settings-backup-' + laststatus.machine.name + "-" + date.yyyymmdd() + '.txt');
  } else {
    invokeSaveAsDialog(blob, 'grbl-settings-backup-' + date.yyyymmdd() + '.txt');
  }

}

function grblSettings(data) {
  // console.log(data)
  var template = ``
  grblconfig = data.split('\n')
  for (i = 0; i < grblconfig.length; i++) {
    var key = grblconfig[i].split('=')[0];
    var param = grblconfig[i].split(/[= ;(]/)[1]
    grblParams[key] = param
  }
  // $('#grblconfig').show();
  // grblPopulate();
  // $('#grblSaveBtn').removeAttr('disabled');
  // $('#grblFirmwareBtn').removeAttr('disabled');
  $('#grblSettings').show()

  if (laststatus.machine.firmware.platform == "grblHAL") {
    $("#grbl-settings-tab-title").html('grblHAL');
  } else {
    $("#grbl-settings-tab-title").html('Grbl');
  }



  if (grblParams['$22'] > 0) {
    $('#gotozeroMPos').removeClass('disabled')
    $('#homeBtn').attr('disabled', false)
    $('#gotoXzeroMpos').removeClass('disabled')
    $('#gotoYzeroMpos').removeClass('disabled')
    $('#gotoZzeroMpos').removeClass('disabled')
    $('.PullOffMPos').html("-" + grblParams['$27'])
  } else {
    $('#gotozeroMPos').addClass('disabled')
    $('#homeBtn').attr('disabled', true)
    $('#gotoXzeroMpos').addClass('disabled')
    $('#gotoYzeroMpos').addClass('disabled')
    $('#gotoZzeroMpos').addClass('disabled')
  }

  if (grblParams['$32'] == 1) {
    $('#enLaser').removeClass('alert').addClass('success').html('ON')
  } else {
    $('#enLaser').removeClass('success').addClass('alert').html('OFF')
  }

  // grblHAL - enable Servo Buttons if Spindle PWM == 50hz
  if (grblParams['$33'] == 50) {
    $('#enServo').removeClass('alert').addClass('success').html('ON')
    $(".servo-active").show()
  } else {
    $('#enServo').removeClass('success').addClass('alert').html('OFF')
    $(".servo-active").hide()
  }


  updateToolOnSValues();

  if (localStorage.getItem('jogOverride')) {
    jogOverride(localStorage.getItem('jogOverride'))
  } else {
    jogOverride(100);
  }
}

function grblPopulate() {
  if (!isJogWidget) {
    $('#grblconfig').show();
    $('#grblconfig').empty();
    var template = `
    <form id="grblSettingsTable">

      <div id="grblProfileSection">
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
                    src="img/mch/minimill.png" width="16px" /> OpenBuilds MiniMill</a></li>
              <li>
                <a href="#" class="dropdown-toggle"><img src="img/mch/sphinx55.png"
                    width="16px" /> OpenBuilds Sphinx</a>
                <ul class="ribbon-dropdown" data-role="dropdown">
                  <li onclick="selectMachine('sphinx55');"><a href="#"><img
                        src="img/mch/sphinx55.png" width="16px" /> OpenBuilds Sphinx
                      55</a></li>
                  <li onclick="selectMachine('sphinx1050');"><a href="#"><img
                        src="img/mch/sphinx1050.png" width="16px" /> OpenBuilds
                      Sphinx 1050</a></li>
                </ul>
              </li>
              <li>
                <a href="#" class="dropdown-toggle"><img
                    src="img/mch/workbee1010.png" width="16px" /> OpenBuilds WorkBee</a>
                <ul class="ribbon-dropdown" data-role="dropdown">
                  <li onclick="selectMachine('workbee1010');"><a href="#"><img
                        src="img/mch/workbee1010.png" width="16px" /> OpenBuilds
                      WorkBee 1010</a></li>
                  <li onclick="selectMachine('workbee1050');"><a href="#"><img
                        src="img/mch/workbee1050.png" width="16px" /> OpenBuilds
                      WorkBee 1050</a></li>
                  <li onclick="selectMachine('workbee1510');"><a href="#"><img
                        src="img/mch/workbee1510.png" width="16px" /> OpenBuilds
                      WorkBee 1510</a></li>
                </ul>
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
            <h6>Advanced Settings<br><small>If you have any custom requirements,
                please customise the settings in the Advanced Settings section</small></h6>

            <button class="button" id="collapse_toggle_2">Show Advanced Settings</button>
            <div class="pos-relative">
              <div data-role="collapse" data-toggle-element="#collapse_toggle_2"
                data-collapsed="true">
                <div id="grblSettingsTableView"
                  style="overflow-y: scroll; height: calc(100vh - 510px); max-height: calc(100vh - 460px);">
                  <table data-role="table"
                    data-table-search-title="Search for Parameters by Name or $-Key"
                    data-search-fields="Key, Parameter"
                    data-on-draw="setup_settings_table"
                    data-on-table-create="setup_settings_table"
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
                    <tbody>`

    for (key in grblParams) {
      var key2 = key.split('=')[0].substr(1);
      //console.log(key2)
      if (grblSettingsTemplate2[key2] !== undefined) {
        //template += grblSettingsTemplate2[key2].template;
        template += `<tr id="grblSettingsRow` + key2 + `"
                        title="` + grblSettingsTemplate2[key2].description + `">
                        <td>` + grblSettingsTemplate2[key2].key + `</td>
                        <td>` + grblSettingsTemplate2[key2].title + `</td>
                        <td>` + grblSettingsTemplate2[key2].template + `</td>
                        <td>` + grblSettingsTemplate2[key2].utils + `</td>
                      </tr>`
      } else {
        template += `
                      <tr>
                        <td>` + key + `</td>
                        <td><span class="tally alert">` + key + `</span></td>
                        <td><input data-role="input" data-clear-button="false"
                            data-append="?" type="text"
                            value="` + grblParams[key] + `"
                            id="val-` + key2 + `-input"></td>
                        <td></td>
                      </tr>
                      `
      }
    }

    template += `</tbody>
                  </table>
                </div> <!-- End of grblSettingsTableView --> </div>
            </div>
          </li>
        </div>
        <!-- End of grblProfileSection  -->
      </form>
      `
    $('#grblconfig').append(template)

    $('#grblSettingsTable').on('keyup paste click change', 'input, select', function() {
      checkifchanged()
    });

    // Event Handlers for Switch Checkboxes
    setTimeout(function() {
      setup_settings_table();
    }, 100)



    $('#grblSettingsBadge').hide();

    if (grblParams['$21'] == 1 && grblParams['$22'] > 0) {
      $('#limitsinstalled:checkbox').prop('checked', true);
      $('#gotozeroMPos').removeClass('disabled')
      $('#homeBtn').attr('disabled', false)
    } else {
      $('#limitsinstalled:checkbox').prop('checked', false);
      $('#gotozeroMPos').addClass('disabled')
      $('#homeBtn').attr('disabled', true)
    }

    // if (grblParams['$33'] == 50 && grblParams['$34'] == 5 && grblParams['$35'] == 5 && grblParams['$36'] == 10) {
    //   setSelectedToolhead('scribe')
    // }

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
      setMachineButton(laststatus.machine.name)
    }, 500)
  }

}

function checkifchanged() {
  var hasChanged = false;
  for (var key in grblParams) {
    if (grblParams.hasOwnProperty(key)) {
      var j = key.substring(1)
      var newVal = $("#val-" + j + "-input").val();

      if (newVal !== undefined) {
        // Only send values that changed
        if (newVal != grblParams[key]) {
          hasChanged = true;
          console.log("changed: " + key)
          console.log("old: " + grblParams[key])
          console.log("new: " + newVal)
          if (!$("#val-" + j + "-input").parent().is('td')) {
            $("#val-" + j + "-input").parent().addClass('alert')
          } else if ($("#val-" + j + "-input").is('select')) {
            $("#val-" + j + "-input").addClass('alert')
          } else if (j == 3) { // axes
            $('#xdirinvert').parent().children('.check').addClass('bd-red')
            $('#ydirinvert').parent().children('.check').addClass('bd-red')
            $('#zdirinvert').parent().children('.check').addClass('bd-red')
          }
        } else {
          if (!$("#val-" + j + "-input").parent().is('td')) {
            $("#val-" + j + "-input").parent().removeClass('alert')
          } else if ($("#val-" + j + "-input").is('select')) {
            $("#val-" + j + "-input").removeClass('alert')
          } else if (j == 3) {
            $('#xdirinvert').parent().children('.check').removeClass('bd-red')
            $('#ydirinvert').parent().children('.check').removeClass('bd-red')
            $('#zdirinvert').parent().children('.check').removeClass('bd-red')
          }
        }
      }
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

function grblSaveSettings() {
  var toSaveCommands = [];
  var saveProgressBar = $("#grblSaveProgress").data("progress");
  for (var key in grblParams) {
    if (grblParams.hasOwnProperty(key)) {
      var j = key.substring(1)
      var newVal = $("#val-" + j + "-input").val();
      // Only send values that changed
      if (newVal !== undefined) {
        if (parseFloat(newVal) != parseFloat(grblParams[key]) && newVal != grblParams[key]) {
          // console.log(key + ' was ' + grblParams[key] + ' but now, its ' + newVal);
          toSaveCommands.push(key + '=' + newVal);
        }
      }
    }
  }
  if (toSaveCommands.length > 0) {
    //console.log("commands", toSaveCommands)
    let counter = 0;
    // Blank the dialog
    if (saveProgressBar) {
      saveProgressBar.val(0);
    }
    $("#grblNewParam").html("")
    $("#grblNewParamVal").html("")
    // Open Dialog savingGrblSettingsProgress
    Metro.dialog.open('#savingGrblSettingsProgress')
    const i = setInterval(function() {
      //console.log(counter, toSaveCommands[counter]);
      var newParam = toSaveCommands[counter].split("=")[0];
      var newParamKey = newParam.substr(1);
      if (grblSettingsTemplate2[newParamKey] !== undefined) {
        var newParamName = grblSettingsTemplate2[newParamKey].title
      } else {
        var newParamName = "unknown"
      }
      var newParamVal = toSaveCommands[counter].split("=")[1];
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
        clearInterval(i);
        grblParams = {};
        toSaveCommands = [];
        askToResetOnGrblSettingsChange();
      }
    }, 400); // send another command every 200ms
  }

}

function askToResetOnGrblSettingsChange() {
  setTimeout(function() {
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
              sendGcode(String.fromCharCode(0x18));
              setTimeout(function() {
                refreshGrblSettings()
              }, 1000); // refresh grbl settings
            }, 800); // reset
          }
        },
        {
          caption: "Later",
          cls: "js-dialog-close",
          onclick: function() {
            console.log("Do nothing")
            refreshGrblSettings();
          }
        }
      ]
    });
    $('#grblSettingsBadge').hide();
  }, 1000); // Just to show settings was written
}

function refreshGrblSettings() {
  $('#saveBtn').attr('disabled', true).addClass('disabled');
  $('#saveBtnIcon').removeClass('fg-grayBlue').addClass('fg-gray');
  grblParams = {};
  $('#grblconfig').empty();
  $('#grblconfig').append("<center>Please Wait... </center><br><center>Requesting updated parameters from the controller firmware...</center>");
  setTimeout(function() {
    sendGcode('$$');
    sendGcode('$I');
    setTimeout(function() {
      grblPopulate();
    }, 500);
  }, 200);

}

// Calc Grbl 1.1 Invert Masks
// Call: calcDecFromMask(true, false, false)
// Return: 1
function calcDecFromMask(x, y, z) {
  var string = "0000000" + (z ? "1" : "0") + (y ? "1" : "0") + (x ? "1" : "0");
  // console.log(string)
  return parseInt(string, 2);
}

// Calc Grbl 1.1 Invert Masks
// Call: calcMaskFromDec("4")
// Returns: {x: false, y: false, z: true}
function calcMaskFromDec(dec) {
  var num = parseInt(dec)
  num = num.toString(2)
  num = ("000" + num).substr(-3, 3)
  // console.log(num)
  var invertmask = {
    x: (num.charAt(2) == 0 ? false : true),
    y: (num.charAt(1) == 0 ? false : true),
    z: (num.charAt(0) == 0 ? false : true)
  }
  return invertmask
}

function changeProbeDirInvert() {
  var xticked = $('#xHomeDir').is(':checked');
  var yticked = $('#yHomeDir').is(':checked');
  var zticked = $('#zHomeDir').is(':checked');
  var value = calcDecFromMask(!xticked, !yticked, !zticked)
  console.log("Homing Dir $23=" + value)
  $("#val-23-input").val(value).trigger("change");
  checkifchanged();
}

function displayProbeDirInvert() {
  var dir = calcMaskFromDec($("#val-23-input").val())
  $('#xHomeDir:checkbox').prop('checked', !dir.x);
  $('#yHomeDir:checkbox').prop('checked', !dir.y);
  $('#zHomeDir:checkbox').prop('checked', !dir.z);
  checkifchanged();
}

function changeDirInvert() {
  var xticked = $('#xdirinvert').is(':checked');
  var yticked = $('#ydirinvert').is(':checked');
  var zticked = $('#zdirinvert').is(':checked');
  var value = calcDecFromMask(xticked, yticked, zticked)
  $("#val-3-input").val(value).trigger("change");
  checkifchanged();
}

function displayDirInvert() {
  var dir = calcMaskFromDec($("#val-3-input").val())
  $('#xdirinvert:checkbox').prop('checked', dir.x);
  $('#ydirinvert:checkbox').prop('checked', dir.y);
  $('#zdirinvert:checkbox').prop('checked', dir.z);
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
          refreshGrblSettings();
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
          refreshGrblSettings();
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
          refreshGrblSettings();
        }
      }
    ]
  });
}

function updateToolOnSValues() {
  $(".ToolOnS1").html((parseInt(grblParams.$30) * 0.01).toFixed(0))
  $(".ToolOnS5").html((parseInt(grblParams.$30) * 0.05).toFixed(0))
  $(".ToolOnS10").html((parseInt(grblParams.$30) * 0.1).toFixed(0))
  $(".ToolOnS25").html((parseInt(grblParams.$30) * 0.25).toFixed(0))
  $(".ToolOnS50").html((parseInt(grblParams.$30) * 0.5).toFixed(0))
  $(".ToolOnS75").html((parseInt(grblParams.$30) * 0.75).toFixed(0))
  $(".ToolOnS100").html(parseInt(grblParams.$30).toFixed(0))
}

function setup_settings_table() {

  for (key in grblParams) {
    var key2 = key.split('=')[0].substr(1);
    $("#val-" + key2 + "-input").val(grblParams[key])
  }

  setTimeout(function() {
    $("#val-32-input").val(parseInt(grblParams['$32'])).trigger("change");
    $("#val-20-input").val(parseInt(grblParams['$20'])).trigger("change");
    $("#val-21-input").val(parseInt(grblParams['$21'])).trigger("change");
    $("#val-22-input").val(parseInt(grblParams['$22'])).trigger("change");
    $("#val-23-input").val(parseInt(grblParams['$23'])).trigger("change");
    $("#val-5-input").val(parseInt(grblParams['$5'])).trigger("change");
    $("#val-6-input").val(parseInt(grblParams['$6'])).trigger("change");
    $("#val-2-input").val(parseInt(grblParams['$2'])).trigger("change");
    $("#val-3-input").val(parseInt(grblParams['$3'])).trigger("change");
    $("#val-4-input").val(parseInt(grblParams['$4'])).trigger("change");
    $("#val-13-input").val(parseInt(grblParams['$13'])).trigger("change");
  }, 100);;

  $('#limitsinstalled:checkbox').change(function() {
    enableLimits();
  });

  // $('#scribeinstalled:checkbox').change(function() {
  //   enableScribe();
  // });

  // Handle the change event for radio buttons
  $('input[name="toolhead"]').on('change', function() {
    console.log(`Selected toolhead: ${$(this).val()}`);
    var selectedToolhead = $(this).val();
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

  $('#xdirinvert:checkbox').change(function() {
    changeDirInvert();
  });
  $('#ydirinvert:checkbox').change(function() {
    changeDirInvert();
  });
  $('#zdirinvert:checkbox').change(function() {
    changeDirInvert();
  });

  $('#xHomeDir:checkbox').change(function() {
    changeProbeDirInvert();
  });
  $('#yHomeDir:checkbox').change(function() {
    changeProbeDirInvert();
  });
  $('#zHomeDir:checkbox').change(function() {
    changeProbeDirInvert();
  });

  // populare Direction Invert Checkboxes
  displayDirInvert()
  displayProbeDirInvert()

  console.log("Updated")
}

function enableLimits() {
  var grblParams_lim = {
    $21: "0", //"Hard limits enable, boolean"
    $22: "0", //"Homing cycle enable, boolean"
  }
  var hasLimits = $('#limitsinstalled').is(':checked');
  if (hasLimits) {
    grblParams_lim.$21 = "1"; //"Hard limits enable, boolean"
    grblParams_lim.$22 = "1"; //"Homing cycle enable, boolean"
  } else {
    grblParams_lim.$21 = "0"; //"Hard limits enable, boolean"
    grblParams_lim.$22 = "0"; //"Homing cycle enable, boolean"
  }
  for (var key in grblParams_lim) {
    if (grblParams_lim.hasOwnProperty(key)) {
      var j = key.substring(1)
      var newVal = $("#val-" + j + "-input").val();
      // console.log("$" + j + " = " + newVal)
      $("#val-" + j + "-input").val(parseFloat(grblParams_lim[key]))
    }
  }
  allowGrblSettingsViewScroll = false;
  setTimeout(function() {
    allowGrblSettingsViewScroll = true;
  }, 500);
  checkifchanged();
  var elm = document.getElementById("grblSettingsLimits");
  // elm.scrollIntoView(true);
}

var grblParams_scribe = {
  $33: "50", //PWM Freq for RC Servo
  $34: "5", //Spindle Off Value for RC Servo
  $35: "5", //Spinde Min Value for RC Servo
  $36: "10", //Spindle max Value for RC Servo
}

function enableScribe() {
  for (var key in grblParams_scribe) {
    if (grblParams_scribe.hasOwnProperty(key)) {
      var j = key.substring(1)
      var newVal = $("#val-" + j + "-input").val();
      // console.log("$" + j + " = " + newVal)
      $("#val-" + j + "-input").val(parseFloat(grblParams_scribe[key]))
    }
  }
  allowGrblSettingsViewScroll = false;
  setTimeout(function() {
    allowGrblSettingsViewScroll = true;
  }, 500);
  checkifchanged();
  var elm = document.getElementById("grblSettingsPWM");
  // elm.scrollIntoView(true);
}

var grblParams_laser = {
  $30: "1000", // S Max
  $32: "1", // Laser Mode On
  $33: "1000", //PWM Freq
  $34: "0", //Spindle Off Value
  $35: "0", //Spinde Min Value
  $36: "100", //Spindle max Value
}

function enableLaser() {

  for (var key in grblParams_laser) {
    if (grblParams_laser.hasOwnProperty(key)) {
      var j = key.substring(1)
      var newVal = $("#val-" + j + "-input").val();
      // console.log("$" + j + " = " + newVal)
      $("#val-" + j + "-input").val(parseFloat(grblParams_laser[key]))
    }
  }
  allowGrblSettingsViewScroll = false;
  setTimeout(function() {
    allowGrblSettingsViewScroll = true;
  }, 500);
  checkifchanged();
  var elm = document.getElementById("grblSettingsPWM");
  // elm.scrollIntoView(true);
}

var grblParams_router = {
  $30: "1000", // S Max
  $32: "0", // Laser Mode On
  $33: "5000", //PWM Freq
  $34: "0", //Spindle Off Value
  $35: "0", //Spinde Min Value
  $36: "100", //Spindle max Value
}

function enableRouter() {

  for (var key in grblParams_router) {
    if (grblParams_router.hasOwnProperty(key)) {
      var j = key.substring(1)
      var newVal = $("#val-" + j + "-input").val();
      // console.log("$" + j + " = " + newVal)
      $("#val-" + j + "-input").val(parseFloat(grblParams_router[key]))
    }
  }
  allowGrblSettingsViewScroll = false;
  setTimeout(function() {
    allowGrblSettingsViewScroll = true;
  }, 500);
  checkifchanged();
  var elm = document.getElementById("grblSettingsPWM");
  // elm.scrollIntoView(true);
}

var grblParams_plasma = {
  $30: "1000", // S Max
  $32: "0", // Laser Mode On
  $33: "1000", //PWM Freq
  $34: "0", //Spindle Off Value
  $35: "0", //Spinde Min Value
  $36: "100", //Spindle max Value
}

function enablePlasma() {

  for (var key in grblParams_plasma) {
    if (grblParams_plasma.hasOwnProperty(key)) {
      var j = key.substring(1)
      var newVal = $("#val-" + j + "-input").val();
      // console.log("$" + j + " = " + newVal)
      $("#val-" + j + "-input").val(parseFloat(grblParams_plasma[key]))
    }
  }
  allowGrblSettingsViewScroll = false;
  setTimeout(function() {
    allowGrblSettingsViewScroll = true;
  }, 500);
  checkifchanged();
  var elm = document.getElementById("grblSettingsPWM");
  // elm.scrollIntoView(true);
}

var grblParams_vfd = {
  $30: "24000", // S Max
  $32: "0", // Laser Mode On
  $33: "1000", //PWM Freq
  $34: "0", //Spindle Off Value
  $35: "0", //Spinde Min Value
  $36: "100", //Spindle max Value
}

function enableVFD() {

  for (var key in grblParams_vfd) {
    if (grblParams_vfd.hasOwnProperty(key)) {
      var j = key.substring(1)
      var newVal = $("#val-" + j + "-input").val();
      // console.log("$" + j + " = " + newVal)
      $("#val-" + j + "-input").val(parseFloat(grblParams_vfd[key]))
    }
  }
  allowGrblSettingsViewScroll = false;
  setTimeout(function() {
    allowGrblSettingsViewScroll = true;
  }, 500);
  checkifchanged();
  var elm = document.getElementById("grblSettingsPWM");
  // elm.scrollIntoView(true);
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
}