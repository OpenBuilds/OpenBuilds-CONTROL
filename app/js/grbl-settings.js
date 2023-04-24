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
    var param = grblconfig[i].split('=')[1]
    grblParams[key] = param
  }
  // $('#grblconfig').show();
  // grblPopulate();
  // $('#grblSaveBtn').removeAttr('disabled');
  // $('#grblFirmwareBtn').removeAttr('disabled');
  $('#grblSettings').show()



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
      <h6 class="fg-dark"><i class="fas fa-tasks fg-blue"></i> 1. Load Machine Profile<br>
      <small>Loads our standard Machine Profiles to your controller. If you have built a machine exactly to specification this is all your need. If you made modifications, or built a custom machine, you can customize the parameters below. Remember to click SAVE when done</small>
      </h6>

<div class="grid">
   <div class="row">
      <div class="cell-8">
         <a style="width: 100%;" class="button dropdown-toggle bd-dark dark outline" id="context_toggle2"><img src="img/mch/sphinx55.png"/> Select Machine</a>
         <ul class="ribbon-dropdown" data-role="dropdown" data-duration="100">
            <li><a href="#" onclick="selectMachine('custom');"><img src="img/mch/custom.png" width="16px"/>  Custom Machine</a></li>
            <li>
               <a href="#" class="dropdown-toggle"><img src="img/mch/acro55.png" width="16px"/> OpenBuilds Acro</a>
               <ul class="ribbon-dropdown" data-role="dropdown">
                  <li onclick="selectMachine('acro55');"><a href="#"><img src="img/mch/acro55.png" width="16px"/>  OpenBuilds Acro 55</a></li>
                  <li onclick="selectMachine('acro510');"><a href="#"><img src="img/mch/acro510.png" width="16px"/>  OpenBuilds Acro 510</a></li>
                  <li onclick="selectMachine('acro1010');"><a href="#"><img src="img/mch/acro1010.png" width="16px"/>  OpenBuilds Acro 1010</a></li>
                  <li onclick="selectMachine('acro1510');"><a href="#"><img src="img/mch/acro1510.png" width="16px"/>  OpenBuilds Acro 1510</a></li>
                  <li onclick="selectMachine('acro1515');"><a href="#"><img src="img/mch/acro1515.png" width="16px"/>  OpenBuilds Acro 1515</a></li>
               </ul>
            </li>
            <li>
               <a href="#" class="dropdown-toggle"><img src="img/mch/acro55.png" width="16px"/> OpenBuilds Acro with Servo Pen Attachment</a>
               <ul class="ribbon-dropdown" data-role="dropdown">
                  <li onclick="selectMachine('acro55pen');"><a href="#"><img src="img/mch/acro55.png" width="16px"/>  OpenBuilds Acro 55  with Servo Pen Attachment</a></li>
                  <li onclick="selectMachine('acro510pen');"><a href="#"><img src="img/mch/acro510.png" width="16px"/>  OpenBuilds Acro 510  with Servo Pen Attachment</a></li>
                  <li onclick="selectMachine('acro1010pen');"><a href="#"><img src="img/mch/acro1010.png" width="16px"/>  OpenBuilds Acro 1010  with Servo Pen Attachment</a></li>
                  <li onclick="selectMachine('acro1510pen');"><a href="#"><img src="img/mch/acro1510.png" width="16px"/>  OpenBuilds Acro 1510  with Servo Pen Attachment</a></li>
                  <li onclick="selectMachine('acro1515pen');"><a href="#"><img src="img/mch/acro1515.png" width="16px"/>  OpenBuilds Acro 1515  with Servo Pen Attachment</a></li>
               </ul>
            </li>
            <li>
               <a href="#" class="dropdown-toggle"><img src="img/mch/cbeam.png" width="16px"/>  OpenBuilds C-Beam Machine</a>
               <ul class="ribbon-dropdown" data-role="dropdown">
                  <li onclick="selectMachine('cbeam');"><a href="#"><img src="img/mch/cbeam.png" width="16px"/>  OpenBuilds C-Beam Machine</a></li>
                  <li onclick="selectMachine('cbeamxl');"><a href="#"><img src="img/mch/cbeamxl.png" width="16px"/>  OpenBuilds C-Beam XL</a></li>
               </ul>
            </li>
            <li>
               <a href="#" class="dropdown-toggle"><img src="img/mch/leadmachine1010.png" width="16px"/>  OpenBuilds LEAD Machine</a>
               <ul class="ribbon-dropdown" data-role="dropdown">
                  <li onclick="selectMachine('leadmachine1010');"><a href="#"><img src="img/mch/leadmachine1010.png" width="16px"/>OpenBuilds LEAD 1010</a></li>
                  <li onclick="selectMachine('leadmachine1010laser');"><a href="#"><img src="img/mch/leadmachine1010laser.png" width="16px"/>OpenBuilds LEAD 1010 with Laser Module</a></li>
                  <li onclick="selectMachine('leadmachine1515');"><a href="#"><img src="img/mch/leadmachine1515.png" width="16px"/>OpenBuilds LEAD 1515</a></li>
               </ul>
            </li>
            <li><a href="#" onclick="selectMachine('minimill');"><img src="img/mch/minimill.png" width="16px"/>  OpenBuilds MiniMill</a></li>
            <li>
               <a href="#" class="dropdown-toggle"><img src="img/mch/sphinx55.png" width="16px"/>  OpenBuilds Sphinx</a>
               <ul class="ribbon-dropdown" data-role="dropdown">
                  <li onclick="selectMachine('sphinx55');"><a href="#"><img src="img/mch/sphinx55.png" width="16px"/>  OpenBuilds Sphinx 55</a></li>
                  <li onclick="selectMachine('sphinx1050');"><a href="#"><img src="img/mch/sphinx1050.png" width="16px"/>  OpenBuilds Sphinx 1050</a></li>
               </ul>
            </li>
            <li>
               <a href="#" class="dropdown-toggle"><img src="img/mch/workbee1010.png" width="16px"/>  OpenBuilds WorkBee</a>
               <ul class="ribbon-dropdown" data-role="dropdown">
                  <li onclick="selectMachine('workbee1010');"><a href="#"><img src="img/mch/workbee1010.png" width="16px"/>  OpenBuilds WorkBee 1010</a></li>
                  <li onclick="selectMachine('workbee1050');"><a href="#"><img src="img/mch/workbee1050.png" width="16px"/>  OpenBuilds WorkBee 1050</a></li>
                  <li onclick="selectMachine('workbee1510');"><a href="#"><img src="img/mch/workbee1510.png" width="16px"/>  OpenBuilds WorkBee 1510</a></li>
               </ul>
            </li>
         </ul>
      </div>
      <div class="cell-4">
         <input id="limitsinstalled" data-cls-caption="fg-openbuilds" data-cls-check="bd-openbuilds openbuilds-switch" data-cls-switch="openbuilds-switch" type="checkbox" data-role="switch" data-caption="Limit&nbsp;Switches&nbsp;Installed">
      </div>
   </div>
</div>

<hr class="bg-openbuilds">
</div> <!-- End grblProfileSection -->
<h6 class="fg-dark"><i class="fas fa-cogs fg-lightOrange"></i> 2.  Customize Profile (Optional)<br><small>Customise your Grbl settings below. For custom machines, modifications and also for fine tuning your machine profile. Remember to make a BACKUP so you don't lose your customized settings</small></h6>

<div id="grblSettingsTableView" style="overflow-y: scroll; height: calc(100vh - 460px); max-height: calc(100vh - 460px);">
   <table class="table compact striped row-hover row-border" data-show-rows-steps="false" data-rows="200" data-show-pagination="false" data-show-table-info="false" data-show-search="false">

      <tbody>

         <tr>
            <th style="text-align: left;">Key</th>
            <th style="text-align: left;">Parameter</th>
            <th style="width: 250px; min-width: 240px !important;">Value</th>
            <th style="width: 110px; min-width: 110px !important;">Utility</th>
         </tr>`

    // Insert Table Rows here
    for (key in grblParams) {
      var key2 = key.split('=')[0].substr(1);
      //console.log(key2)
      if (grblSettingsTemplate2[key2] !== undefined) {
        //template += grblSettingsTemplate2[key2].template;
        template += `<tr id="grblSettingsRow` + key2 + `" title="` + grblSettingsTemplate2[key2].description + `">
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
           <td><input data-role="input" data-clear-button="false" data-append="?" type="text" value="` + grblParams[key] + `" id="val-` + key2 + `-input"></td>
           <td></td>
        </tr>
        `
      }
    }

    template += `</tbody>
   </table>
</div> <!-- End of grblSettingsTableView -->

</form>
        `
    $('#grblconfig').append(template)

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
    }, 100);;

    $('#grblSettingsTable').on('keyup paste click change', 'input, select', function() {
      checkifchanged()
    });

    // $("#grblSettingsTableView").scroll(function() {
    //   var scroll = $("#grblSettingsTableView").scrollTop();
    //   console.log('scrolling: ', scroll)
    //   if (scroll > 200) {
    //     if (allowGrblSettingsViewScroll) {
    //       $("#grblProfileSection").slideUp('slow');
    //       $("#grblSettingsTableView").css("max-height", "calc(100vh - 320px)")
    //       $("#grblSettingsTableView").css("height", "calc(100vh - 320px)")
    //     }
    //   } else if (scroll < 200) {
    //     $("#grblProfileSection").slideDown('slow')
    //     $("#grblSettingsTableView").css("max-height", "calc(100vh - 460px)")
    //     $("#grblSettingsTableView").css("height", "calc(100vh - 460px)")
    //   }
    // });


    // Event Handlers for Switch Checkboxes
    setTimeout(function() {
      $('#limitsinstalled:checkbox').change(function() {
        enableLimits();
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

  // if ($("#val-21-input").val() == 1 && $("#val-22-input").val() == 1) {
  //   $('#limitsinstalled:checkbox').prop('checked', true);
  //   $('#gotozeroMPos').removeClass('disabled')
  //   $('#homeBtn').attr('disabled', false)
  // } else {
  //   $('#limitsinstalled:checkbox').prop('checked', false);
  //   $('#gotozeroMPos').addClass('disabled')
  //   $('#homeBtn').attr('disabled', true)
  // }

  // if ($("#val-21-input").val() == 1) { // Hard Limits enabled?
  //   if (laststatus.machine.inputs.includes('X') || laststatus.machine.inputs.includes('Y') || laststatus.machine.inputs.includes('Z')) { // But a limit is currently Active?
  //     console.log("created")
  //     for (i = 0; i < openDialogs.length; i++) {
  //       Metro.dialog.close(openDialogs[i]);
  //     }
  //     openDialogs.length = 0;
  //     var dialog = Metro.dialog.create({
  //       title: "Enable Hard Limits / Endstops?",
  //       content: `<div>You have <code>$21=1 ; Hard Limits = Enabled</code> in your settings. <br>
  //       We detected one or more Limits inputs as Triggered.  <br>
  //       Please make sure none of the Limit switches are triggered before enabling Hard Limits:<p>
  //
  //       <table class="table striped compact">
  //         <thead>
  //           <tr>
  //             <th style="width: 40%;">PIN</th>
  //             <th style="width: 60%;">Status</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           <tr>
  //             <td class="pt-1 mt-0 pb-0 pt-0">X-Limit</td>
  //             <td class="pt-1 mt-0 pb-0 pt-0"><span class="tally alert pinstatus xpin">NOCOMM</span></td>
  //           </tr>
  //           <tr>
  //             <td class="pt-1 mt-0 pb-0 pt-0">Y-Limit</td>
  //             <td class="pt-1 mt-0 pb-0 pt-0"><span class="tally alert pinstatus ypin">NOCOMM</span></td>
  //           </tr>
  //           <tr>
  //             <td class="pt-1 mt-0 pb-0 pt-0">Z-Limit</td>
  //             <td class="pt-1 mt-0 pb-0 pt-0"><span class="tally alert pinstatus zpin">NOCOMM</span></td>
  //           </tr>
  //         </tbody>
  //       </table>`,
  //       clsDialog: 'dark',
  //       actions: [{
  //         caption: "Set 'Hard Limits' to Disabled",
  //         cls: "js-dialog-close",
  //         onclick: function() {
  //           $("#limitsinstalled").prop("checked", false);
  //           enableLimits()
  //           setTimeout(function() {
  //             checkifchanged()
  //           }, 400); // reset
  //         }
  //       }]
  //     });
  //     openDialogs.push(dialog);
  //   }
  // }


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
    }, 400); // send another command every 200ms
  }

}


// Old Gnea-Grbl way
// function grblSaveSettings() {
//   var commands = ""
//   for (var key in grblParams) {
//     if (grblParams.hasOwnProperty(key)) {
//       var j = key.substring(1)
//       var newVal = $("#val-" + j + "-input").val();
//       // Only send values that changed
//       if (newVal !== undefined) {
//         if (parseFloat(newVal) != parseFloat(grblParams[key])) {
//           // console.log(key + ' was ' + grblParams[key] + ' but now, its ' + newVal);
//           commands += key + '=' + newVal + "\n"
//           // sendGcode(key + '=' + newVal) + "\n";
//         }
//       }
//     }
//   }
//   console.log("commands", commands)
//   socket.emit('runJob', {
//     data: commands,
//     isJob: false,
//     fileName: ""
//   });
//   grblParams = {};
//
//   Metro.dialog.create({
//     title: "Configuration Updated. Reset Grbl?",
//     content: "<div>Some changes in the Grbl Configuration only take effect after a restart/reset of the controller. Would you like to Reset the controller now?</div>",
//     actions: [{
//         caption: "Yes",
//         cls: "js-dialog-close secondary",
//         onclick: function() {
//           setTimeout(function() {
//             sendGcode(String.fromCharCode(0x18));
//             setTimeout(function() {
//               refreshGrblSettings()
//             }, 1000);
//           }, 400);
//         }
//       },
//       {
//         caption: "Later",
//         cls: "js-dialog-close",
//         onclick: function() {
//           console.log("Do nothing")
//           refreshGrblSettings();
//         }
//       }
//     ]
//   });
//   $('#grblSettingsBadge').hide();
// }

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
  elm.scrollIntoView(true);

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