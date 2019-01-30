var grblSettingCodes = {
  0: "Step pulse time, microseconds",
  1: "Step idle delay, milliseconds",
  2: "Step pulse invert, mask",
  3: "Step direction invert, mask",
  4: "Invert step enable pin, boolean",
  5: "Invert limit pins, boolean",
  6: "Invert probe pin, boolean",
  10: "Status report options, mask",
  11: "Junction deviation, millimeters",
  12: "Arc tolerance, millimeters",
  13: "Report in inches, boolean",
  20: "Soft limits enable, boolean",
  21: "Hard limits enable, boolean",
  22: "Homing cycle enable, boolean",
  23: "Homing direction invert, mask",
  24: "Homing locate feed rate, mm/min",
  25: "Homing search seek rate, mm/min",
  26: "Homing switch debounce delay, milliseconds",
  27: "Homing switch pull-off distance, millimeters",
  30: "Maximum spindle speed, RPM",
  31: "Minimum spindle speed, RPM",
  32: "Laser-mode enable, boolean",
  100: "X-axis steps per millimeter",
  101: "Y-axis steps per millimeter",
  102: "Z-axis steps per millimeter",
  110: "X-axis maximum rate, mm/min",
  111: "Y-axis maximum rate, mm/min",
  112: "Z-axis maximum rate, mm/min",
  120: "X-axis acceleration, mm/sec^2",
  121: "Y-axis acceleration, mm/sec^2",
  122: "Z-axis acceleration, mm/sec^2",
  130: "X-axis maximum travel, millimeters",
  131: "Y-axis maximum travel, millimeters",
  132: "Z-axis maximum travel, millimeters"
};

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

  if (grblParams['$22'] == 1) {
    $('#gotozeroMPos').removeClass('disabled')
    $('#homeBtn').attr('disabled', false)
    $('#gotoXzeroMpos').removeClass('disabled')
    $('#gotoYzeroMpos').removeClass('disabled')
    $('#gotoZzeroMpos').removeClass('disabled')
  } else {
    $('#gotozeroMPos').addClass('disabled')
    $('#homeBtn').attr('disabled', true)
    $('#gotoXzeroMpos').addClass('disabled')
    $('#gotoYzeroMpos').addClass('disabled')
    $('#gotoZzeroMpos').addClass('disabled')
  }
}

function grblPopulate() {
  $('#grblconfig').show();
  $('#grblconfig').empty();
  var template = `
        <form id="grblSettingsTable">
        <ul class="step-list">

          <li id="installDriversOnSettingspage">
            <h6 class="fg-openbuilds">Load Default Settings<br><small>Populate Grbl parameters from machine-type defaults. You can customize values as needed below</small></h6>
            <hr class="bg-openbuilds">
            <div>

            <div class="grid">
              <div class="row">
                <div class="cell-8">
                <a style="width: 100%;" class="button dropdown-toggle bd-openbuilds secondary outline" id="context_toggle2"><img src="img/mch/sphinx55.png"/> Select Machine</a>
                <ul class="d-menu border bd-gray" data-role="dropdown" data-toggle-element="#context_toggle2">
                  <li onclick="selectMachine('custom');"><a href="#"><img src="img/mch/custom.png"/>  Custom Machine</a></li>
                  <li class="divider"></li>
                  <li onclick="selectMachine('acro55');"><a href="#"><img src="img/mch/acro55.png"/>  OpenBuilds Acro 55</a></li>
                  <li onclick="selectMachine('acro510');"><a href="#"><img src="img/mch/acro510.png"/>  OpenBuilds Acro 510</a></li>
                  <li onclick="selectMachine('acro1010');"><a href="#"><img src="img/mch/acro1010.png"/>  OpenBuilds Acro 1010</a></li>
                  <li onclick="selectMachine('acro1510');"><a href="#"><img src="img/mch/acro1510.png"/>  OpenBuilds Acro 1510</a></li>
                  <li onclick="selectMachine('acro1515');"><a href="#"><img src="img/mch/acro1515.png"/>  OpenBuilds Acro 1515</a></li>
                  <li class="divider"></li>
                  <li onclick="selectMachine('cbeam');"><a href="#"><img src="img/mch/cbeam.png"/>  OpenBuilds C-Beam Machine</a></li>
                  <li onclick="selectMachine('cbeamxl');"><a href="#"><img src="img/mch/cbeamxl.png"/>  OpenBuilds C-Beam XL </a></li>
                  <li class="divider"></li>
                  <!--li onclick="selectMachine('leadmachine55');"><a href="#"><img src="img/mch/leadmachine55.png"/>  OpenBuilds Lead Machine 55 </a></li -->
                  <li onclick="selectMachine('leadmachine1010');"><a href="#"><img src="img/mch/leadmachine1010.png"/>  OpenBuilds Lead Machine 1010 </a></li>
                  <li class="divider"></li>
                  <li onclick="selectMachine('minimill');"><a href="#"><img src="img/mch/minimill.png"/>  OpenBuilds MiniMill</a></li>
                  <li class="divider"></li>
                  <li onclick="selectMachine('sphinx55');"><a href="#"><img src="img/mch/sphinx55.png"/>  OpenBuilds Sphinx 55</a></li>
                  <li onclick="selectMachine('sphinx1050');"><a href="#"><img src="img/mch/sphinx1050.png"/>  OpenBuilds Sphinx 1050</a></li>
                  <li class="divider"></li>
                  <li onclick="selectMachine('workbee1010');"><a href="#"><img src="img/mch/workbee1010.png"/>  OpenBuilds Workbee 1010</a></li>
                  <li onclick="selectMachine('workbee1050');"><a href="#"><img src="img/mch/workbee1050.png"/>  OpenBuilds Workbee 1050</a></li>
                  <li onclick="selectMachine('workbee1510');"><a href="#"><img src="img/mch/workbee1510.png"/>  OpenBuilds Workbee 1510</a></li>
                </ul>
                </div>
                <div class="cell-4">
                  <input id="limitsinstalled" data-cls-caption="fg-openbuilds" data-cls-check="bd-openbuilds openbuilds-switch" data-cls-switch="openbuilds-switch" type="checkbox" data-role="switch" data-caption="Limit&nbsp;Switches&nbsp;Installed">
                </div>
              </div>
            </div>
          </div>
        </li>


          <li id="installDriversOnSettingspage">
            <h6 class="fg-openbuilds">Advanced Settings<br><small>Customise your Grbl settings below</small></h6>
            <hr class="bg-openbuilds">
            <div>

          <div style="overflow-y: scroll; height: calc(100vh - 450px); max-height: calc(100vh - 450px); ">
          <table class="table compact striped row-hover row-border" data-show-rows-steps="false" data-rows="200" data-show-pagination="false" data-show-table-info="false" data-show-search="false">
          <thead>
            <tr>
                <th>Key</th>
                <th>Parameter</th>
                <th style="width: 250px; min-width: 240px !important;">Value</th>
                <th style="width: 110px; min-width: 110px !important;">Utility</th>
            </tr>
          </thead>

          <tbody>
          <tr><td>$0</td><td>Step pulse time, microseconds</td><td><input data-role="input" data-clear-button="false" data-append="&micro;s" type="text" value="` + grblParams['$0'] + `" id="val-` + 0 + `-input"></td><td></td></tr>
          <tr><td>$1</td><td>Step idle delay, milliseconds</td><td><input data-role="input" data-clear-button="false" data-append="ms" type="text" value="` + grblParams['$1'] + `" id="val-` + 1 + `-input"></td><td></td></tr>
          <tr><td>$2</td>
          <td>Step pulse invert</td>
          <td>
            <select id="val-` + 2 + `-input" value="` + grblParams['$2'] + `">
              <option value="0">[0] X:&#9898; Y:&#9898; Z:&#9898;</option>
              <option value="1">[1] X:&#9899; Y:&#9898; Z:&#9898;</option>
              <option value="2">[2] X:&#9898; Y:&#9899; Z:&#9898;</option>
              <option value="3">[3] X:&#9898; Y:&#9898; Z:&#9899;</option>
              <option value="4">[4] X:&#9899; Y:&#9899; Z:&#9898;</option>
              <option value="5">[5] X:&#9899; Y:&#9898; Z:&#9899;</option>
              <option value="6">[6] X:&#9898; Y:&#9899; Z:&#9899;</option>
              <option value="7">[7] X:&#9899; Y:&#9899; Z:&#9899;</option>
            </select>
          </td>
          <td></td>
          </tr>
          <tr><td>$3</td><td>Step direction invert</td><td><input readonly type="hidden" id="val-` + 3 + `-input" value="` + grblParams['$3'] + `">
          <input data-cls-caption="fg-openbuilds" id="xdirinvert" class="secondary" type="checkbox" data-role="switch" data-caption="Invert X Direction"><br>
          <input data-cls-caption="fg-openbuilds" id="ydirinvert" class="secondary" type="checkbox" data-role="switch" data-caption="Invert Y Direction"><br>
          <input data-cls-caption="fg-openbuilds" id="zdirinvert" class="secondary" type="checkbox" data-role="switch" data-caption="Invert Z Direction">
          </td><td></td></tr>
          <tr><td>$4</td><td>Invert step enable pin</td><td><select id="val-` + 4 + `-input" value="` + grblParams['$4'] + `"><option value="0">&#x2717; Disable</option><option value="1">&#x2713; Enable</option></select></td><td></td></tr>
          <tr><td>$5</td><td>Invert limit pins</td><td><select id="val-` + 5 + `-input" value="` + grblParams['$5'] + `"><option value="0">&#x2717; Disable</option><option value="1">&#x2713; Enable</option></select></td><td></td></tr>
          <tr><td>$6</td><td>Invert probe pin</td><td><select id="val-` + 6 + `-input" value="` + grblParams['$6'] + `"><option value="0">&#x2717; Disable</option><option value="1">&#x2713; Enable</option></select></td><td></td></tr>
          <tr><td>$10</td><td>Status report options</td><td><select id="val-` + 10 + `-input" value="` + grblParams['$10'] + `">
            <option value="0">[0] WPos:&#9899; MPos:&#9898; Buf:&#9898;</option>
            <option value="1">[1] WPos:&#9898; MPos:&#9899; Buf:&#9898;</option>
            <option value="2">[2] WPos:&#9899; MPos:&#9898; Buf:&#9899;</option>
          </select></td><td></td></tr>
          <tr><td>$11</td><td>Junction deviation, millimeters</td><td><input data-role="input" data-clear-button="false" data-append="mm" type="text" value="` + grblParams['$11'] + `" id="val-` + 11 + `-input"></td><td></td></tr>
          <tr><td>$12</td><td>Arc tolerance, millimeters</td><td><input data-role="input" data-clear-button="false" data-append="mm" type="text" value="` + grblParams['$12'] + `" id="val-` + 12 + `-input"></td><td></td></tr>
          <tr><td>$13</td><td>Report in inches</td><td><select id="val-` + 13 + `-input" value="` + grblParams['$13'] + `"><option value="0">&#9898; Disable</option><option value="1">&#9899; Enable</option></select></td><td></td></tr>

          <tr><td>$20</td><td>Soft limits enable <br><small>(Enable and Save Homing first before enabling)<small></td><td><select id="val-` + 20 + `-input" value="` + grblParams['$20'] + `"><option value="0">&#x2717; Disable</option><option value="1">&#x2713; Enable</option></select></td><td></td></tr>
          <tr><td>$21</td><td>Hard limits enable</td><td><select id="val-` + 21 + `-input" value="` + grblParams['$21'] + `"><option value="0">&#x2717; Disable</option><option value="1">&#x2713; Enable</option></select></td><td></td></tr>
          <tr><td>$22</td><td>Homing cycle enable</td><td><select id="val-` + 22 + `-input" value="` + grblParams['$22'] + `"><option value="0">&#x2717; Disable</option><option value="1">&#x2713; Enable</option></select></td><td></td></tr>
          <tr><td>$23</td><td>Homing direction invert</td><td><select id="val-` + 23 + `-input" value="` + grblParams['$23'] + `">
            <option value="0">[0] X:&#9898; Y:&#9898; Z:&#9898;</option>
            <option value="1">[1] X:&#9899; Y:&#9898; Z:&#9898;</option>
            <option value="2">[2] X:&#9898; Y:&#9899; Z:&#9898;</option>
            <option value="3">[3] X:&#9898; Y:&#9898; Z:&#9899;</option>
            <option value="4">[4] X:&#9899; Y:&#9899; Z:&#9898;</option>
            <option value="5">[5] X:&#9899; Y:&#9898; Z:&#9899;</option>
            <option value="6">[6] X:&#9898; Y:&#9899; Z:&#9899;</option>
            <option value="7">[7] X:&#9899; Y:&#9899; Z:&#9899;</option>
          </select></td><td></td></tr>
          <tr><td>$24</td><td>Homing locate feed rate, mm/min</td><td><input data-role="input" data-clear-button="false" data-append="mm/min" type="text" value="` + grblParams['$24'] + `" id="val-` + 24 + `-input"></td><td></td></tr>
          <tr><td>$25</td><td>Homing search seek rate, mm/min</td><td><input data-role="input" data-clear-button="false" data-append="mm/min" type="text" value="` + grblParams['$25'] + `" id="val-` + 25 + `-input"></td><td></td></tr>
          <tr><td>$26</td><td>Homing switch debounce delay, milliseconds</td><td><input data-role="input" data-clear-button="false" data-append="ms" type="text" value="` + grblParams['$26'] + `" id="val-` + 26 + `-input"></td><td></td></tr>
          <tr><td>$27</td><td>Homing switch pull-off distance, millimeters</td><td><input data-role="input" data-clear-button="false" data-append="mm" type="text" value="` + grblParams['$27'] + `" id="val-` + 27 + `-input"></td><td></td></tr>

          <tr><td>$30</td><td>Maximum spindle speed, RPM</td><td><input data-role="input" data-clear-button="false" data-append="RPM" type="text" value="` + grblParams['$30'] + `" id="val-` + 30 + `-input"></td><td></td></tr>
          <tr><td>$31</td><td>Minimum spindle speed, RPM</td><td><input data-role="input" data-clear-button="false" data-append="RPM" type="text" value="` + grblParams['$31'] + `" id="val-` + 31 + `-input"></td><td></td></tr>
          <tr><td>$32</td><td>Laser-mode enable</td><td><select id="val-` + 32 + `-input" value="` + grblParams['$32'] + `"><option value="0">&#x2717; Disable</option><option value="1">&#x2713; Enable</option></select></td><td></td></tr>

          <tr>
            <td>$100</td>
            <td>X-axis steps per millimeter</td>
            <td><input data-role="input" data-clear-button="false" data-append="steps/mm" type="text" value="` + grblParams['$100'] + `" id="val-` + 100 + `-input"></td>
            <td>
              <button title="Calculate X-Axis Steps per mm" class="button " type="button" onclick="xstepspermm()">
                <span class="fa-layers fa-fw">
                  <i class="fas fa-calculator" data-fa-transform="shrink-2"></i>
                  <span class="fa-layers-text" data-fa-transform="up-16" style="font-weight:600; font-family: Arial; font-size: 10px;">Calc</span>
                  <span class="fa-layers-text" data-fa-transform="down-19" style="font-weight:600; font-family: Arial; font-size: 10px;">Steps</span>
                </span>
              </button>
              <button title="Fine Tune X-Axis Steps per mm" class="button " type="button" onclick="xstepscalibrate()">
                <span class="fa-layers fa-fw">
                  <i class="fas fa-wrench" data-fa-transform="shrink-2"></i>
                  <span class="fa-layers-text" data-fa-transform="up-16" style="font-weight:600; font-family: Arial; font-size: 10px;">Fine</span>
                  <span class="fa-layers-text" data-fa-transform="down-19" style="font-weight:600; font-family: Arial; font-size: 10px;">Tune</span>
                </span>
              </button>
            </td>
          </tr>

          <tr>
            <td>$101</td>
            <td>Y-axis steps per millimeter</td>
            <td><input data-role="input" data-clear-button="false" data-append="steps/mm" type="text" value="` + grblParams['$101'] + `" id="val-` + 101 + `-input"></td>
            <td>
              <button title="Calculate Y-Axis Steps per mm" class="button" type="button" onclick="ystepspermm()">
              <span class="fa-layers fa-fw">
                  <i class="fas fa-calculator" data-fa-transform="shrink-2"></i>
                  <span class="fa-layers-text" data-fa-transform="up-16" style="font-weight:600; font-family: Arial; font-size: 10px;">Calc</span>
                  <span class="fa-layers-text" data-fa-transform="down-19" style="font-weight:600; font-family: Arial; font-size: 10px;">Steps</span>
                </span>
              </button>
              <button title="Fine Tune Y-Axis Steps per mm" class="button " type="button" onclick="ystepscalibrate()">
                <span class="fa-layers fa-fw">
                  <i class="fas fa-wrench" data-fa-transform="shrink-2"></i>
                  <span class="fa-layers-text" data-fa-transform="up-16" style="font-weight:600; font-family: Arial; font-size: 10px;">Fine</span>
                  <span class="fa-layers-text" data-fa-transform="down-19" style="font-weight:600; font-family: Arial; font-size: 10px;">Tune</span>
                </span>
              </button>
            </td>
          </tr>

          <tr>
            <td>$102</td>
            <td>Z-axis steps per millimeter</td>
            <td><input data-role="input" data-clear-button="false" data-append="steps/mm" type="text" value="` + grblParams['$102'] + `" id="val-` + 102 + `-input"></td>
            <td>
              <button title="Calculate Z-Axis Steps per mm" class="button" type="button" onclick="zstepspermm()">
              <span class="fa-layers fa-fw">
                  <i class="fas fa-calculator" data-fa-transform="shrink-2"></i>
                  <span class="fa-layers-text" data-fa-transform="up-16" style="font-weight:600; font-family: Arial; font-size: 10px;">Calc</span>
                  <span class="fa-layers-text" data-fa-transform="down-19" style="font-weight:600; font-family: Arial; font-size: 10px;">Steps</span>
                </span>
              </button>
              <button title="Fine Tune Z-Axis Steps per mm" class="button " type="button" onclick="zstepscalibrate()">
                <span class="fa-layers fa-fw">
                  <i class="fas fa-wrench" data-fa-transform="shrink-2"></i>
                  <span class="fa-layers-text" data-fa-transform="up-16" style="font-weight:600; font-family: Arial; font-size: 10px;">Fine</span>
                  <span class="fa-layers-text" data-fa-transform="down-19" style="font-weight:600; font-family: Arial; font-size: 10px;">Tune</span>
                </span>
              </button>
            </td>
          </tr>

          <tr><td>$110</td><td>X-axis maximum rate, mm/min</td><td><input data-role="input" data-clear-button="false" data-append="mm/min"  type="text" value="` + grblParams['$110'] + `" id="val-` + 110 + `-input"></td><td></td></tr>
          <tr><td>$111</td><td>Y-axis maximum rate, mm/min</td><td><input data-role="input" data-clear-button="false" data-append="mm/min"  type="text" value="` + grblParams['$111'] + `" id="val-` + 111 + `-input"></td><td></td></tr>
          <tr><td>$112</td><td>Z-axis maximum rate, mm/min</td><td><input data-role="input" data-clear-button="false" data-append="mm/min"  type="text" value="` + grblParams['$112'] + `" id="val-` + 112 + `-input"></td><td></td></tr>

          <tr><td>$120</td><td>X-axis acceleration, mm/sec<sup>2</sup></td><td><input data-role="input" data-clear-button="false" data-append="mm/sec&sup2" type="text" value="` + grblParams['$120'] + `" id="val-` + 120 + `-input"></td><td></td></tr>
          <tr><td>$121</td><td>Y-axis acceleration, mm/sec<sup>2</sup></td><td><input data-role="input" data-clear-button="false" data-append="mm/sec&sup2" type="text" value="` + grblParams['$121'] + `" id="val-` + 121 + `-input"></td><td></td></tr>
          <tr><td>$122</td><td>Z-axis acceleration, mm/sec<sup>2</sup></td><td><input data-role="input" data-clear-button="false" data-append="mm/sec&sup2" type="text" value="` + grblParams['$122'] + `" id="val-` + 122 + `-input"></td></td><td></td></tr>

          <tr><td>$130</td><td>X-axis maximum travel, millimeters</td><td><input data-role="input" data-clear-button="false" data-append="mm" type="text" value="` + grblParams['$130'] + `" id="val-` + 130 + `-input"></td><td></td></tr>
          <tr><td>$131</td><td>Y-axis maximum travel, millimeters</td><td><input data-role="input" data-clear-button="false" data-append="mm" type="text" value="` + grblParams['$131'] + `" id="val-` + 131 + `-input"></td><td></td></tr>
          <tr><td>$132</td><td>Z-axis maximum travel, millimeters</td><td><input data-role="input" data-clear-button="false" data-append="mm" type="text" value="` + grblParams['$132'] + `" id="val-` + 132 + `-input"></td><td></td></tr>

          </tbody>
          </table>
          </div>
        </div>
      </li>
    </ul>
        </form>
      </div>
  </div>`
  $('#grblconfig').append(template)

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
    $("#val-10-input").val(parseInt(grblParams['$10'])).trigger("change");
  }, 100);;

  $('#grblSettingsTable').on('keyup paste click change', 'input, select', function() {
    checkifchanged()
  });

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

    // populare Direction Invert Checkboxes
    displayDirInvert()

  }, 100)



  $('#grblSettingsBadge').hide();

  if (grblParams['$21'] == 1 && grblParams['$22'] == 1) {
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

function checkifchanged() {
  var hasChanged = false;
  for (var key in grblParams) {
    if (grblParams.hasOwnProperty(key)) {
      var j = key.substring(1)
      var newVal = $("#val-" + j + "-input").val();
      // Only send values that changed
      if (parseFloat(newVal) != parseFloat(grblParams[key])) {
        hasChanged = true;
        if (!$("#val-" + j + "-input").parent().is('td')) {
          $("#val-" + j + "-input").parent().addClass('alert')
        } else if ($("#val-" + j + "-input").is('select')) {
          $("#val-" + j + "-input").addClass('alert')
        } else if (j == 3) { // Endstops
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
  var commands = ""
  for (var key in grblParams) {
    if (grblParams.hasOwnProperty(key)) {
      var j = key.substring(1)
      var newVal = $("#val-" + j + "-input").val();
      // Only send values that changed
      if (parseFloat(newVal) != parseFloat(grblParams[key])) {
        // console.log(key + ' was ' + grblParams[key] + ' but now, its ' + newVal);
        commands += key + '=' + newVal + "\n"
        // sendGcode(key + '=' + newVal);
      }
    }
  }
  console.log("commands", commands)
  socket.emit('runJob', commands);
  grblParams = {};

  Metro.dialog.create({
    title: "Configuration Updated. Reset Grbl?",
    content: "<div>Some changes in the Grbl Configuration only take effect after a restart/reset of the controller. Would you like to Reset the controller now?</div>",
    actions: [{
        caption: "Yes",
        cls: "js-dialog-close secondary",
        onclick: function() {
          setTimeout(function() {
            sendGcode(String.fromCharCode(0x18));
            setTimeout(function() {
              refreshGrblSettings()
            }, 1000);
          }, 400);
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
  }, 50);

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
  checkifchanged();
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

// <div class="ribbon-group">
//   <button class="ribbon-icon-button" onclick="sendGcode('$RST=$'); refreshGrblSettings()">
//     <span class="icon">
//       <i class="fas fa-sliders-h"></i>
//     </span>
//     <span class="caption">Reset&nbsp;Settings</span>
//   </button><br>
//   <button class="ribbon-icon-button" onclick="sendGcode('$RST=#'); refreshGrblSettings()">
//     <span class="icon">
//       <i class="fas fa-layer-group"></i>
//     </span>
//     <span class="caption">Reset&nbsp;WCOs</span>
//   </button><br>
//   <button class="ribbon-icon-button" onclick="sendGcode('$RST=*'); refreshGrblSettings()">
//     <span class="icon">
//       <i class="fas fa-microchip"></i>
//     </span>
//     <span class="caption">Reset&nbsp;EEPROM</span>
//   </button>
// </div>

clearWCO
clearSettings

function clearSettings() {
  Metro.dialog.create({
    title: "Are you sure?",
    content: "<div>Resetting the Grbl Settings will restore all the settings to factory defaults, but will keep other EEPROM settings intact. Would you like to continue?</div>",
    actions: [{
        caption: "Yes",
        cls: "js-dialog-close secondary",
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
    actions: [{
        caption: "Yes",
        cls: "js-dialog-close secondary",
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
    actions: [{
        caption: "Yes",
        cls: "js-dialog-close secondary",
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