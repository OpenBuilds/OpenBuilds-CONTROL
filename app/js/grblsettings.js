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
  $('.grblCalibrationMenu').removeClass("disabled")


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

  if (grblParams['$32'] == 1) {
    console.log('Laser Mode Enabled')
    $('#enLaser').removeClass('alert').addClass('success').html('ON')
  } else {
    $('#enLaser').removeClass('success').addClass('alert').html('OFF')
  }
}

function grblPopulate() {
  $('#grblconfig').show();
  $('#grblconfig').empty();
  var template = `
        <form id="grblSettingsTable">
        <ul class="step-list">

          <li id="installDriversOnSettingspage">
            <h6 class="fg-openbuilds">Load Default Settings<br><small>Populate Grbl parameters from machine-type defaults. You can customize values as needed below. Remember to click Save above to apply</small></h6>
            <hr class="bg-openbuilds">
            <div>

            <div class="grid">
              <div class="row">
                <div class="cell-8">
                  <a style="width: 100%;" class="button dropdown-toggle bd-openbuilds secondary outline" id="context_toggle2"><img src="img/mch/sphinx55.png"/> Select Machine</a>
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
                      <a href="#" class="dropdown-toggle"><img src="img/mch/leadmachine1010.png" width="16px"/>  OpenBuilds Lead Machine</a>
                      <ul class="ribbon-dropdown" data-role="dropdown">
                        <li onclick="selectMachine('leadmachine55');"><a href="#"><img src="img/mch/leadmachine55.png" width="16px"/>  OpenBuilds Lead 55</a></li>
                        <li onclick="selectMachine('leadmachine1010');"><a href="#"><img src="img/mch/leadmachine1010.png" width="16px"/>OpenBuilds Lead 1010</a></li>
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
          <tr title="` + grblConfigDesc['$0'] + `"><td>$0</td><td>Step pulse time, microseconds</td><td><input data-role="input" data-clear-button="false" data-append="&micro;s" type="text" value="` + grblParams['$0'] + `" id="val-` + 0 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$1'] + `"><td>$1</td><td>Step idle delay, milliseconds</td><td><input data-role="input" data-clear-button="false" data-append="ms" type="text" value="` + grblParams['$1'] + `" id="val-` + 1 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$2'] + `"><td>$2</td>
          <td>Step pulse invert</td>
          <td>
            <select id="val-` + 2 + `-input" value="` + grblParams['$2'] + `">
              <option value="0">[0] X:&#9898; Y:&#9898; Z:&#9898;</option>
              <option value="1">[1] X:&#9899; Y:&#9898; Z:&#9898;</option>
              <option value="2">[2] X:&#9898; Y:&#9899; Z:&#9898;</option>
              <option value="3">[3] X:&#9899; Y:&#9899; Z:&#9898;</option>
              <option value="4">[4] X:&#9898; Y:&#9898; Z:&#9899;</option>
              <option value="5">[5] X:&#9899; Y:&#9898; Z:&#9899;</option>
              <option value="6">[6] X:&#9898; Y:&#9899; Z:&#9899;</option>
              <option value="7">[7] X:&#9899; Y:&#9899; Z:&#9899;</option>
            </select>
          </td>
          <td></td>
          </tr>
          <tr title="` + grblConfigDesc['$3'] + `"><td>$3</td><td>Step direction invert</td><td><input readonly type="hidden" id="val-` + 3 + `-input" value="` + grblParams['$3'] + `">
          <input data-cls-caption="fg-openbuilds" id="xdirinvert" class="secondary" type="checkbox" data-role="switch" data-caption="Invert X Direction"><br>
          <input data-cls-caption="fg-openbuilds" id="ydirinvert" class="secondary" type="checkbox" data-role="switch" data-caption="Invert Y Direction"><br>
          <input data-cls-caption="fg-openbuilds" id="zdirinvert" class="secondary" type="checkbox" data-role="switch" data-caption="Invert Z Direction">
          </td><td></td></tr>
          <tr title="` + grblConfigDesc['$4'] + `"><td>$4</td><td>Invert step enable pin</td><td><select id="val-` + 4 + `-input" value="` + grblParams['$4'] + `"><option value="0">&#x2717; Disable</option><option value="1">&#x2713; Enable</option></select></td><td></td></tr>
          <tr title="` + grblConfigDesc['$5'] + `"><td>$5</td><td>Invert limit pins</td><td><select id="val-` + 5 + `-input" value="` + grblParams['$5'] + `"><option value="0">&#x2717; Disable</option><option value="1">&#x2713; Enable</option></select></td><td></td></tr>
          <tr title="` + grblConfigDesc['$6'] + `"><td>$6</td><td>Invert probe pin</td><td><select id="val-` + 6 + `-input" value="` + grblParams['$6'] + `"><option value="0">&#x2717; Disable</option><option value="1">&#x2713; Enable</option></select></td><td></td></tr>
          <tr title="` + grblConfigDesc['$10'] + `"><td>$10</td><td>Status report options</td><td><select id="val-` + 10 + `-input" value="` + grblParams['$10'] + `">
            <option value="0">[0] WPos:&#9899; MPos:&#9898; Buf:&#9898;</option>
            <option value="1">[1] WPos:&#9898; MPos:&#9899; Buf:&#9898;</option>
            <option value="2">[2] WPos:&#9899; MPos:&#9898; Buf:&#9899;</option>
          </select></td><td></td></tr>
          <tr title="` + grblConfigDesc['$11'] + `"><td>$11</td><td>Junction deviation, millimeters</td><td><input data-role="input" data-clear-button="false" data-append="mm" type="text" value="` + grblParams['$11'] + `" id="val-` + 11 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$12'] + `"><td>$12</td><td>Arc tolerance, millimeters</td><td><input data-role="input" data-clear-button="false" data-append="mm" type="text" value="` + grblParams['$12'] + `" id="val-` + 12 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$13'] + `"><td>$13</td><td>Report in inches</td><td><select id="val-` + 13 + `-input" value="` + grblParams['$13'] + `"><option value="0">&#9898; Disable</option><option value="1">&#9899; Enable</option></select></td><td></td></tr>

          <tr title="` + grblConfigDesc['$20'] + `"><td>$20</td><td>Soft limits enable <br><small>(Enable and Save Homing first before enabling)<small></td><td><select id="val-` + 20 + `-input" value="` + grblParams['$20'] + `"><option value="0">&#x2717; Disable</option><option value="1">&#x2713; Enable</option></select></td><td></td></tr>
          <tr title="` + grblConfigDesc['$21'] + `"><td>$21</td><td>Hard limits enable</td><td><select id="val-` + 21 + `-input" value="` + grblParams['$21'] + `"><option value="0">&#x2717; Disable</option><option value="1">&#x2713; Enable</option></select></td><td></td></tr>
          <tr title="` + grblConfigDesc['$22'] + `"><td>$22</td><td>Homing cycle enable</td><td><select id="val-` + 22 + `-input" value="` + grblParams['$22'] + `"><option value="0">&#x2717; Disable</option><option value="1">&#x2713; Enable</option></select></td><td></td></tr>
          <tr title="` + grblConfigDesc['$23'] + `"><td>$23</td><td>Homing direction invert</td><td><select id="val-` + 23 + `-input" value="` + grblParams['$23'] + `">
            <option value="0">[0] X:&#9898; Y:&#9898; Z:&#9898;</option>
            <option value="1">[1] X:&#9899; Y:&#9898; Z:&#9898;</option>
            <option value="2">[2] X:&#9898; Y:&#9899; Z:&#9898;</option>
            <option value="3">[3] X:&#9899; Y:&#9899; Z:&#9898;</option>
            <option value="4">[4] X:&#9898; Y:&#9898; Z:&#9899;</option>
            <option value="5">[5] X:&#9899; Y:&#9898; Z:&#9899;</option>
            <option value="6">[6] X:&#9898; Y:&#9899; Z:&#9899;</option>
            <option value="7">[7] X:&#9899; Y:&#9899; Z:&#9899;</option>
          </select></td><td></td></tr>
          <tr title="` + grblConfigDesc['$24'] + `"><td>$24</td><td>Homing locate feed rate, mm/min</td><td><input data-role="input" data-clear-button="false" data-append="mm/min" type="text" value="` + grblParams['$24'] + `" id="val-` + 24 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$25'] + `"><td>$25</td><td>Homing search seek rate, mm/min</td><td><input data-role="input" data-clear-button="false" data-append="mm/min" type="text" value="` + grblParams['$25'] + `" id="val-` + 25 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$26'] + `"><td>$26</td><td>Homing switch debounce delay, milliseconds</td><td><input data-role="input" data-clear-button="false" data-append="ms" type="text" value="` + grblParams['$26'] + `" id="val-` + 26 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$27'] + `"><td>$27</td><td>Homing switch pull-off distance, millimeters</td><td><input data-role="input" data-clear-button="false" data-append="mm" type="text" value="` + grblParams['$27'] + `" id="val-` + 27 + `-input"></td><td></td></tr>

          <tr title="` + grblConfigDesc['$30'] + `"><td>$30</td><td>Maximum spindle speed, RPM</td><td><input data-role="input" data-clear-button="false" data-append="RPM" type="text" value="` + grblParams['$30'] + `" id="val-` + 30 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$31'] + `"><td>$31</td><td>Minimum spindle speed, RPM</td><td><input data-role="input" data-clear-button="false" data-append="RPM" type="text" value="` + grblParams['$31'] + `" id="val-` + 31 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$32'] + `"><td>$32</td><td>Laser-mode enable</td><td><select id="val-` + 32 + `-input" value="` + grblParams['$32'] + `"><option value="0">&#x2717; Disable</option><option value="1">&#x2713; Enable</option></select></td><td></td></tr>

          <tr title="` + grblConfigDesc['$100'] + `">
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
            </td>
          </tr>

          <tr title="` + grblConfigDesc['$101'] + `">
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
            </td>
          </tr>

          <tr title="` + grblConfigDesc['$102'] + `">
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
            </td>
          </tr>

          <tr title="` + grblConfigDesc['$110'] + `"><td>$110</td><td>X-axis maximum rate, mm/min</td><td><input data-role="input" data-clear-button="false" data-append="mm/min"  type="text" value="` + grblParams['$110'] + `" id="val-` + 110 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$111'] + `"><td>$111</td><td>Y-axis maximum rate, mm/min</td><td><input data-role="input" data-clear-button="false" data-append="mm/min"  type="text" value="` + grblParams['$111'] + `" id="val-` + 111 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$112'] + `"><td>$112</td><td>Z-axis maximum rate, mm/min</td><td><input data-role="input" data-clear-button="false" data-append="mm/min"  type="text" value="` + grblParams['$112'] + `" id="val-` + 112 + `-input"></td><td></td></tr>

          <tr title="` + grblConfigDesc['$120'] + `"><td>$120</td><td>X-axis acceleration, mm/sec<sup>2</sup></td><td><input data-role="input" data-clear-button="false" data-append="mm/sec&sup2" type="text" value="` + grblParams['$120'] + `" id="val-` + 120 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$121'] + `"><td>$121</td><td>Y-axis acceleration, mm/sec<sup>2</sup></td><td><input data-role="input" data-clear-button="false" data-append="mm/sec&sup2" type="text" value="` + grblParams['$121'] + `" id="val-` + 121 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$122'] + `"><td>$122</td><td>Z-axis acceleration, mm/sec<sup>2</sup></td><td><input data-role="input" data-clear-button="false" data-append="mm/sec&sup2" type="text" value="` + grblParams['$122'] + `" id="val-` + 122 + `-input"></td></td><td></td></tr>

          <tr title="` + grblConfigDesc['$130'] + `"><td>$130</td><td>X-axis maximum travel, millimeters</td><td><input data-role="input" data-clear-button="false" data-append="mm" type="text" value="` + grblParams['$130'] + `" id="val-` + 130 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$131'] + `"><td>$131</td><td>Y-axis maximum travel, millimeters</td><td><input data-role="input" data-clear-button="false" data-append="mm" type="text" value="` + grblParams['$131'] + `" id="val-` + 131 + `-input"></td><td></td></tr>
          <tr title="` + grblConfigDesc['$132'] + `"><td>$132</td><td>Z-axis maximum travel, millimeters</td><td><input data-role="input" data-clear-button="false" data-append="mm" type="text" value="` + grblParams['$132'] + `" id="val-` + 132 + `-input"></td><td></td></tr>

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


// Strings from https://github.com/gnea/grbl/wiki/Grbl-v1.1-Configuration
var grblConfigDesc = {
  $0: "Stepper drivers are rated for a certain minimum step pulse length. Check the data sheet or just try some numbers. You want the shortest pulses the stepper drivers can reliably recognize. If the pulses are too long, you might run into trouble when running the system at very high feed and pulse rates, because the step pulses can begin to overlap each other. We recommend something around 10 microseconds, which is the default value",
  $1: "Every time your steppers complete a motion and come to a stop, Grbl will delay disabling the steppers by this value. OR, you can always keep your axes enabled (powered so as to hold position) by setting this value to the maximum 255 milliseconds. Again, just to repeat, you can keep all axes always enabled by setting $1=255. The stepper idle lock time is the time length Grbl will keep the steppers locked before disabling. Depending on the system, you can set this to zero and disable it. On others, you may need 25-50 milliseconds to make sure your axes come to a complete stop before disabling. This is to help account for machine motors that do not like to be left on for long periods of time without doing something. Also, keep in mind that some stepper drivers don't remember which micro step they stopped on, so when you re-enable, you may witness some 'lost' steps due to this. In this case, just keep your steppers enabled via $1=255",
  $2: "This setting inverts the step pulse signal. By default, a step signal starts at normal-low and goes high upon a step pulse event. After a step pulse time set by $0, the pin resets to low, until the next step pulse event. When inverted, the step pulse behavior switches from normal-high, to low during the pulse, and back to high. Most users will not need to use this setting, but this can be useful for certain CNC-stepper drivers that have peculiar requirements. For example, an artificial delay between the direction pin and step pulse can be created by inverting the step pin.",
  $3: "This setting inverts the direction signal for each axis. By default, Grbl assumes that the axes move in a positive direction when the direction pin signal is low, and a negative direction when the pin is high. Often, axes don't move this way with some machines. This setting will invert the direction pin signal for those axes that move the opposite way.",
  $4: "If you have an XPRO or BlackBox, set it to Enabled.  By default, the stepper enable pin is high to disable and low to enable. If your setup needs the opposite, just invert the stepper enable pin by typing $4=1. Disable with $4=0. (May need a power cycle to load the change.)",
  $5: "By default, the limit pins are held normally-high with the Arduino's internal pull-up resistor. When a limit pin is low, Grbl interprets this as triggered. For the opposite behavior, just invert the limit pins by typing $5=1. Disable with $5=0. You may need a power cycle to load the change. NOTE: For more advanced usage, the internal pull-up resistor on the limit pins may be disabled in config.h.",
  $6: "By default, the probe pin is held normally-high with the Arduino's internal pull-up resistor. When the probe pin is low, Grbl interprets this as triggered. For the opposite behavior, just invert the probe pin by typing $6=1. Disable with $6=0. You may need a power cycle to load the change.",
  $10: "This setting determines what Grbl real-time data it reports back to the user when a '?' status report is sent. This data includes current run state, real-time position, real-time feed rate, pin states, current override values, buffer states, and the g-code line number currently executing (if enabled through compile-time options).",
  $11: "Junction deviation is used by the acceleration manager to determine how fast it can move through line segment junctions of a G-code program path. For example, if the G-code path has a sharp 10 degree turn coming up and the machine is moving at full speed, this setting helps determine how much the machine needs to slow down to safely go through the corner without losing steps",
  $12: "Grbl renders G2/G3 circles, arcs, and helices by subdividing them into teeny tiny lines, such that the arc tracing accuracy is never below this value. You will probably never need to adjust this setting, since 0.002mm is well below the accuracy of most all CNC machines. But if you find that your circles are too crude or arc tracing is performing slowly, adjust this setting. Lower values give higher precision but may lead to performance issues by overloading Grbl with too many tiny lines. Alternately, higher values traces to a lower precision, but can speed up arc performance since Grbl has fewer lines to deal with.",
  $13: "Grbl has a real-time positioning reporting feature to provide a user feedback on where the machine is exactly at that time, as well as, parameters for coordinate offsets and probing. By default, it is set to report in mm, but by sending a $13=1 command, you send this boolean flag to true and these reporting features will now report in inches. $13=0 to set back to mm.",
  $20: "Soft limits is a safety feature to help prevent your machine from traveling too far and beyond the limits of travel, crashing or breaking something expensive. It works by knowing the maximum travel limits for each axis and where Grbl is in machine coordinates. Whenever a new G-code motion is sent to Grbl, it checks whether or not you accidentally have exceeded your machine space. If you do, Grbl will issue an immediate feed hold wherever it is, shutdown the spindle and coolant, and then set the system alarm indicating the problem. Machine position will be retained afterwards, since it's not due to an immediate forced stop like hard limits. NOTE: Soft limits requires homing to be enabled and accurate axis maximum travel settings, because Grbl needs to know where it is. $20=1 to enable, and $20=0 to disable.",
  $21: "Hard limit work basically the same as soft limits, but use physical switches instead. Basically you wire up some switches (mechanical, magnetic, or optical) near the end of travel of each axes, or where ever you feel that there might be trouble if your program moves too far to where it shouldn't. When the switch triggers, it will immediately halt all motion, shutdown the coolant and spindle (if connected), and go into alarm mode, which forces you to check your machine and reset everything. To use hard limits with Grbl, the limit pins are held high with an internal pull-up resistor, so all you have to do is wire in a normally-open switch with the pin and ground and enable hard limits with $21=1. (Disable with $21=0.) We strongly advise taking electric interference prevention measures. If you want a limit for both ends of travel of one axes, just wire in two switches in parallel with the pin and ground, so if either one of them trips, it triggers the hard limit. Keep in mind, that a hard limit event is considered to be critical event, where steppers immediately stop and will have likely have lost steps. Grbl doesn't have any feedback on position, so it can't guarantee it has any idea where it is. So, if a hard limit is triggered, Grbl will go into an infinite loop ALARM mode, giving you a chance to check your machine and forcing you to reset Grbl. Remember it's a purely a safety feature.",
  $22: "Ahh, homing. For those just initiated into CNC, the homing cycle is used to accurately and precisely locate a known and consistent position on a machine every time you start up your Grbl between sessions. In other words, you know exactly where you are at any given time, every time. Say you start machining something or are about to start the next step in a job and the power goes out, you re-start Grbl and Grbl has no idea where it is due to steppers being open-loop control. You're left with the task of figuring out where you are. If you have homing, you always have the machine zero reference point to locate from, so all you have to do is run the homing cycle and resume where you left off. To set up the homing cycle for Grbl, you need to have limit switches in a fixed position that won't get bumped or moved, or else your reference point gets messed up. Usually they are setup in the farthest point in +x, +y, +z of each axes. Wire your limit switches in with the limit pins, add a recommended RC-filter to help reduce electrical noise, and enable homing. If you're curious, you can use your limit switches for both hard limits AND homing. They play nice with each other. Prior to trying the homing cycle for the first time, make sure you have setup everything correctly, otherwise homing may behave strangely. First, ensure your machine axes are moving in the correct directions per Cartesian coordinates (right-hand rule). If not, fix it with the $3 direction invert setting. Second, ensure your limit switch pins are not showing as 'triggered' in Grbl's status reports. If are, check your wiring and settings. Finally, ensure your $13x max travel settings are somewhat accurate (within 20%), because Grbl uses these values to determine how far it should search for the homing switches. By default, Grbl's homing cycle moves the Z-axis positive first to clear the workspace and then moves both the X and Y-axes at the same time in the positive direction. To set up how your homing cycle behaves, there are more Grbl settings down the page describing what they do (and compile-time options as well.). Also, one more thing to note, when homing is enabled. Grbl will lock out all G-code commands until you perform a homing cycle. Meaning no axes motions, unless the lock is disabled ($X) but more on that later. Most, if not all CNC controllers, do something similar, as it is mostly a safety feature to prevent users from making a positioning mistake, which is very easy to do and be saddened when a mistake ruins a part. If you find this annoying or find any weird bugs, please let us know and we'll try to work on it so everyone is happy. :)  NOTE: Check out config.h for more homing options for advanced users. You can disable the homing lockout at startup, configure which axes move first during a homing cycle and in what order, and more.",
  $23: "By default, Grbl assumes your homing limit switches are in the positive direction, first moving the z-axis positive, then the x-y axes positive before trying to precisely locate machine zero by going back and forth slowly around the switch. If your machine has a limit switch in the negative direction, the homing direction mask can invert the axes' direction. It works just like the step port invert and direction port invert masks, where all you have to do is send the value in the table to indicate what axes you want to invert and search for in the opposite direction.",
  $24: "The homing cycle first searches for the limit switches at a higher seek rate, and after it finds them, it moves at a slower feed rate to home into the precise location of machine zero. Homing feed rate is that slower feed rate. Set this to whatever rate value that provides repeatable and precise machine zero locating.",
  $25: "Homing seek rate is the homing cycle search rate, or the rate at which it first tries to find the limit switches. Adjust to whatever rate gets to the limit switches in a short enough time without crashing into your limit switches if they come in too fast.",
  $26: "Whenever a switch triggers, some of them can have electrical/mechanical noise that actually 'bounce' the signal high and low for a few milliseconds before settling in. To solve this, you need to debounce the signal, either by hardware with some kind of signal conditioner or by software with a short delay to let the signal finish bouncing. Grbl performs a short delay, only homing when locating machine zero. Set this delay value to whatever your switch needs to get repeatable homing. In most cases, 5-25 milliseconds is fine.",
  $27: "To play nice with the hard limits feature, where homing can share the same limit switches, the homing cycle will move off all of the limit switches by this pull-off travel after it completes. In other words, it helps to prevent accidental triggering of the hard limit after a homing cycle. Make sure this value is large enough to clear the limit switch. If not, Grbl will throw an alarm error for failing to clear it.",
  $30: "This sets the spindle speed for the maximum 5V PWM pin output. For example, if you want to set 10000rpm at 5V, program $30=10000. For 255rpm at 5V, program $30=255. If a program tries to set a higher spindle RPM greater than the $30 max spindle speed, Grbl will just output the max 5V, since it can't go any faster. By default, Grbl linearly relates the max-min RPMs to 5V-0.02V PWM pin output in 255 equally spaced increments. When the PWM pin reads 0V, this indicates spindle disabled. Note that there are additional configuration options are available in config.h to tweak how this operates.",
  $31: "This sets the spindle speed for the minimum 0.02V PWM pin output (0V is disabled). Lower RPM values are accepted by Grbl but the PWM output will not go below 0.02V, except when RPM is zero. If zero, the spindle is disabled and PWM output is 0V.",
  $32: "When enabled, Grbl will move continuously through consecutive G1, G2, or G3 motion commands when programmed with a S spindle speed (laser power). The spindle PWM pin will be updated instantaneously through each motion without stopping. Please read the GRBL laser documentation and your laser device documentation prior to using this mode. Lasers are very dangerous. They can instantly damage your vision permanantly and cause fires. Grbl does not assume any responsibility for any issues the firmware may cause, as defined by its GPL license. When disabled, Grbl will operate as it always has, stopping motion with every S spindle speed command. This is the default operation of a milling machine to allow a pause to let the spindle change speeds.",
  $100: "Grbl needs to know how far each step will take the tool in reality.  - use the tools on the right to compute/calibrate",
  $101: "Grbl needs to know how far each step will take the tool in reality.  - use the tools on the right to compute/calibrate",
  $102: "Grbl needs to know how far each step will take the tool in reality.  - use the tools on the right to compute/calibrate",
  $110: "This sets the maximum rate each axis can move. Whenever Grbl plans a move, it checks whether or not the move causes any one of these individual axes to exceed their max rate. If so, it'll slow down the motion to ensure none of the axes exceed their max rate limits. This means that each axis has its own independent speed, which is extremely useful for limiting the typically slower Z-axis. The simplest way to determine these values is to test each axis one at a time by slowly increasing max rate settings and moving it. For example, to test the X-axis, send Grbl something like G0 X50 with enough travel distance so that the axis accelerates to its max speed. You'll know you've hit the max rate threshold when your steppers stall. It'll make a bit of noise, but shouldn't hurt your motors. Enter a setting a 10-20% below this value, so you can account for wear, friction, and the mass of your workpiece/tool. Then, repeat for your other axes. NOTE: This max rate setting also sets the G0 seek rates.",
  $111: "This sets the maximum rate each axis can move. Whenever Grbl plans a move, it checks whether or not the move causes any one of these individual axes to exceed their max rate. If so, it'll slow down the motion to ensure none of the axes exceed their max rate limits. This means that each axis has its own independent speed, which is extremely useful for limiting the typically slower Z-axis. The simplest way to determine these values is to test each axis one at a time by slowly increasing max rate settings and moving it. For example, to test the X-axis, send Grbl something like G0 X50 with enough travel distance so that the axis accelerates to its max speed. You'll know you've hit the max rate threshold when your steppers stall. It'll make a bit of noise, but shouldn't hurt your motors. Enter a setting a 10-20% below this value, so you can account for wear, friction, and the mass of your workpiece/tool. Then, repeat for your other axes. NOTE: This max rate setting also sets the G0 seek rates.",
  $112: "This sets the maximum rate each axis can move. Whenever Grbl plans a move, it checks whether or not the move causes any one of these individual axes to exceed their max rate. If so, it'll slow down the motion to ensure none of the axes exceed their max rate limits. This means that each axis has its own independent speed, which is extremely useful for limiting the typically slower Z-axis. The simplest way to determine these values is to test each axis one at a time by slowly increasing max rate settings and moving it. For example, to test the X-axis, send Grbl something like G0 X50 with enough travel distance so that the axis accelerates to its max speed. You'll know you've hit the max rate threshold when your steppers stall. It'll make a bit of noise, but shouldn't hurt your motors. Enter a setting a 10-20% below this value, so you can account for wear, friction, and the mass of your workpiece/tool. Then, repeat for your other axes. NOTE: This max rate setting also sets the G0 seek rates.",
  $120: "This sets the axes acceleration parameters in mm/second/second. Simplistically, a lower value makes Grbl ease slower into motion, while a higher value yields tighter moves and reaches the desired feed rates much quicker. Much like the max rate setting, each axis has its own acceleration value and are independent of each other. This means that a multi-axis motion will only accelerate as quickly as the lowest contributing axis can. Again, like the max rate setting, the simplest way to determine the values for this setting is to individually test each axis with slowly increasing values until the motor stalls. Then finalize your acceleration setting with a value 10-20% below this absolute max value. This should account for wear, friction, and mass inertia. We highly recommend that you dry test some G-code programs with your new settings before committing to them. Sometimes the loading on your machine is different when moving in all axes together.",
  $121: "This sets the axes acceleration parameters in mm/second/second. Simplistically, a lower value makes Grbl ease slower into motion, while a higher value yields tighter moves and reaches the desired feed rates much quicker. Much like the max rate setting, each axis has its own acceleration value and are independent of each other. This means that a multi-axis motion will only accelerate as quickly as the lowest contributing axis can. Again, like the max rate setting, the simplest way to determine the values for this setting is to individually test each axis with slowly increasing values until the motor stalls. Then finalize your acceleration setting with a value 10-20% below this absolute max value. This should account for wear, friction, and mass inertia. We highly recommend that you dry test some G-code programs with your new settings before committing to them. Sometimes the loading on your machine is different when moving in all axes together.",
  $122: "This sets the axes acceleration parameters in mm/second/second. Simplistically, a lower value makes Grbl ease slower into motion, while a higher value yields tighter moves and reaches the desired feed rates much quicker. Much like the max rate setting, each axis has its own acceleration value and are independent of each other. This means that a multi-axis motion will only accelerate as quickly as the lowest contributing axis can. Again, like the max rate setting, the simplest way to determine the values for this setting is to individually test each axis with slowly increasing values until the motor stalls. Then finalize your acceleration setting with a value 10-20% below this absolute max value. This should account for wear, friction, and mass inertia. We highly recommend that you dry test some G-code programs with your new settings before committing to them. Sometimes the loading on your machine is different when moving in all axes together.",
  $130: "This sets the maximum travel from end to end for each axis in mm. This is only useful if you have soft limits (and homing) enabled, as this is only used by Grbl's soft limit feature to check if you have exceeded your machine limits with a motion command.",
  $131: "This sets the maximum travel from end to end for each axis in mm. This is only useful if you have soft limits (and homing) enabled, as this is only used by Grbl's soft limit feature to check if you have exceeded your machine limits with a motion command.",
  $132: "This sets the maximum travel from end to end for each axis in mm. This is only useful if you have soft limits (and homing) enabled, as this is only used by Grbl's soft limit feature to check if you have exceeded your machine limits with a motion command."
}
