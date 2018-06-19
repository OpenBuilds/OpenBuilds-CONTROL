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
  var template = ``
  grblconfig = data.split('\n')
  for (i = 0; i < grblconfig.length; i++) {
    var key = grblconfig[i].split('=')[0];
    var param = grblconfig[i].split('=')[1]
    grblParams[key] = param
  }
  $('#grbl-placeholder').hide();
  $('#grblconfig').show();
  grblPopulate();
  $('#grblSaveBtn').removeAttr('disabled');
  $('#grblFirmwareBtn').removeAttr('disabled');
}

function grblPopulate() {
  $('#grblconfig').empty();
  var template = `
        <table class="table table-striped"><tr><th>Parameter</th><th>Value</th><th></th></tr>
          <tr><td>X-axis steps per millimeter [$100]</td><td><input class="form-control" value="` + grblParams['$100'] + `" id="val-` + 100 + `-input"></td></tr>
          <tr><td>X-axis maximum rate, mm/min [$110]</td><td><input class="form-control" value="` + grblParams['$110'] + `" id="val-` + 110 + `-input"></td></tr>
          <tr><td>X-axis acceleration, mm/sec<sup>2</sup> [$120]</td><td><input class="form-control" value="` + grblParams['$120'] + `" id="val-` + 120 + `-input"></td></tr>
          <tr><td>X-axis maximum travel, millimeters [$130]</td><td><input class="form-control" value="` + grblParams['$130'] + `" id="val-` + 130 + `-input"></td></tr>

          <tr><td>Y-axis steps per millimeter [$101]</td><td><input class="form-control" value="` + grblParams['$101'] + `" id="val-` + 101 + `-input"></td></tr>
          <tr><td>Y-axis maximum rate, mm/min [$111]</td><td><input class="form-control" value="` + grblParams['$111'] + `" id="val-` + 111 + `-input"></td></tr>
          <tr><td>Y-axis acceleration, mm/sec<sup>2</sup> [$121]</td><td><input class="form-control" value="` + grblParams['$121'] + `" id="val-` + 121 + `-input"></td></tr>
          <tr><td>Y-axis maximum travel, millimeters [$131]</td><td><input class="form-control" value="` + grblParams['$131'] + `" id="val-` + 131 + `-input"></td></tr>

          <tr><td>Z-axis steps per millimeter [$102]</td><td><input class="form-control" value="` + grblParams['$102'] + `" id="val-` + 102 + `-input"></td></tr>
          <tr><td>Z-axis maximum rate, mm/min [$112]</td><td><input class="form-control" value="` + grblParams['$112'] + `" id="val-` + 112 + `-input"></td></tr>
          <tr><td>Z-axis acceleration, mm/sec<sup>2</sup> [$122]</td><td><input class="form-control" value="` + grblParams['$122'] + `" id="val-` + 122 + `-input"></td></td></tr>
          <tr><td>Z-axis maximum travel, millimeters [$132]</td><td><input class="form-control" value="` + grblParams['$132'] + `" id="val-` + 132 + `-input"></td></tr>

          <tr><td>Soft limits enable [$20] <small>(Enable and Save Homing first before enabling)<small></td><td><select id="val-` + 20 + `-input" class="form-control" value="` + grblParams['$20'] + `"><option value="0">&#xf00d Disable</option><option value="1">&#xf00c Enable</option></select></td></tr>
          <tr><td>Hard limits enable [$21]</td><td><select id="val-` + 21 + `-input" class="form-control" value="` + grblParams['$21'] + `"><option value="0">&#xf00d Disable</option><option value="1">&#xf00c Enable</option></select></td></tr>
          <tr><td>Homing cycle enable [$22]</td><td><select id="val-` + 22 + `-input" class="form-control" value="` + grblParams['$22'] + `"><option value="0">&#xf00d Disable</option><option value="1">&#xf00c Enable</option></select></td></tr>
          <tr><td>Homing direction invert [$23]</td><td><select id="val-` + 23 + `-input" class="form-control" value="` + grblParams['$23'] + `">
            <option value="0">X:&#xf10c Y:&#xf10c Z:&#xf10c</option>
            <option value="1">X:&#xf111 Y:&#xf10c Z:&#xf10c</option>
            <option value="2">X:&#xf10c Y:&#xf111 Z:&#xf10c</option>
            <option value="4">X:&#xf10c Y:&#xf10c Z:&#xf111</option>
            <option value="3">X:&#xf111 Y:&#xf111 Z:&#xf10c</option>
            <option value="5">X:&#xf111 Y:&#xf10c Z:&#xf111</option>
            <option value="6">X:&#xf10c Y:&#xf111 Z:&#xf111</option>
            <option value="7">X:&#xf111 Y:&#xf111 Z:&#xf111</option>
          </select></td></tr>
          <tr><td>Homing locate feed rate, mm/min [$24]</td><td><input class="form-control" value="` + grblParams['$24'] + `" id="val-` + 24 + `-input"></td></tr>
          <tr><td>Homing search seek rate, mm/min [$25]</td><td><input class="form-control" value="` + grblParams['$25'] + `" id="val-` + 25 + `-input"></td></tr>
          <tr><td>Homing switch debounce delay, milliseconds [$26]</td><td><input class="form-control" value="` + grblParams['$26'] + `" id="val-` + 26 + `-input"></td></tr>
          <tr><td>Homing switch pull-off distance, millimeters [$27]</td><td><input class="form-control" value="` + grblParams['$27'] + `" id="val-` + 27 + `-input"></td></tr>
          <tr><td>Invert limit pins [$5]</td><td><select id="val-` + 5 + `-input" class="form-control" value="` + grblParams['$5'] + `"><option value="0">&#xf00d Disable</option><option value="1">&#xf00c Enable</option></select></td></tr>
          <tr><td>Invert probe pin [$6]</td><td><select id="val-` + 6 + `-input" class="form-control" value="` + grblParams['$6'] + `"><option value="0">&#xf00d Disable</option><option value="1">&#xf00c Enable</option></select></td></tr>

          <tr><td>Laser-mode enable [$32]</td><td><select id="val-` + 32 + `-input" class="form-control" value="` + grblParams['$32'] + `"><option value="0">&#xf00d Disable</option><option value="1">&#xf00c Enable</option></select></td></tr>
          <tr><td>Minimum spindle speed, RPM [$31]</td><td><input class="form-control" value="` + grblParams['$31'] + `" id="val-` + 31 + `-input"></td></tr>
          <tr><td>Maximum spindle speed, RPM [$30]</td><td><input class="form-control" value="` + grblParams['$30'] + `" id="val-` + 30 + `-input"></td></tr>

          <tr><td>Step pulse time, microseconds [$0]</td><td><input class="form-control" value="` + grblParams['$0'] + `" id="val-` + 0 + `-input"></td></tr>
          <tr><td>Step idle delay, milliseconds [$1]</td><td><input class="form-control" value="` + grblParams['$1'] + `" id="val-` + 1 + `-input"></td></tr>
          <tr>
            <td>Step pulse invert [$2]</td>
            <td>
              <select id="val-` + 2 + `-input" class="form-control" value="` + grblParams['$2'] + `">
                <option value="0">X:&#xf10c Y:&#xf10c Z:&#xf10c</option>
                <option value="1">X:&#xf111 Y:&#xf10c Z:&#xf10c</option>
                <option value="2">X:&#xf10c Y:&#xf111 Z:&#xf10c</option>
                <option value="4">X:&#xf10c Y:&#xf10c Z:&#xf111</option>
                <option value="3">X:&#xf111 Y:&#xf111 Z:&#xf10c</option>
                <option value="5">X:&#xf111 Y:&#xf10c Z:&#xf111</option>
                <option value="6">X:&#xf10c Y:&#xf111 Z:&#xf111</option>
                <option value="7">X:&#xf111 Y:&#xf111 Z:&#xf111</option>
              </select>
            </td>
            </tr>
          <tr><td>Step direction invert  [$3]</td><td><select id="val-` + 3 + `-input" class="form-control" value="` + grblParams['$3'] + `">
            <option value="0">X:&#xf10c Y:&#xf10c Z:&#xf10c</option>
            <option value="1">X:&#xf111 Y:&#xf10c Z:&#xf10c</option>
            <option value="2">X:&#xf10c Y:&#xf111 Z:&#xf10c</option>
            <option value="4">X:&#xf10c Y:&#xf10c Z:&#xf111</option>
            <option value="3">X:&#xf111 Y:&#xf111 Z:&#xf10c</option>
            <option value="5">X:&#xf111 Y:&#xf10c Z:&#xf111</option>
            <option value="6">X:&#xf10c Y:&#xf111 Z:&#xf111</option>
            <option value="7">X:&#xf111 Y:&#xf111 Z:&#xf111</option>
          </select></td></tr>
          <tr><td>Invert step enable pin [$4]</td><td><select id="val-` + 4 + `-input" class="form-control" value="` + grblParams['$4'] + `"><option value="0">&#xf00d Disable</option><option value="1">&#xf00c Enable</option></select></td></tr>

          <tr><td>Status report options [$10]</td><td><select id="val-` + 10 + `-input" class="form-control" value="` + grblParams['$10'] + `">
            <option value="0">WPos:&#xf111 MPos:&#xf10c Buf:&#xf10c</option>
            <option value="1">WPos:&#xf10c MPos:&#xf111 Buf:&#xf10c</option>
            <option value="2">WPos:&#xf111 MPos:&#xf10c Buf:&#xf111</option>
          </select></td></tr>
          <tr><td>Junction deviation, millimeters [$11]</td><td><input class="form-control" value="` + grblParams['$11'] + `" id="val-` + 11 + `-input"></td></tr>
          <tr><td>Arc tolerance, millimeters [$12]</td><td><input class="form-control" value="` + grblParams['$12'] + `" id="val-` + 12 + `-input"></td></tr>
          <tr><td>Report in inches [$13]</td><td><select id="val-` + 13 + `-input" class="form-control" value="` + grblParams['$13'] + `"><option value="0">&#xf10c Disable</option><option value="1">&#xf111 Enable</option></select></td></tr>
        </table>
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
  }, 500);;

}

function grblSaveSettings() {
  for (var key in grblParams) {
    if (grblParams.hasOwnProperty(key)) {
      var j = key.substring(1)
      var newVal = $("#val-" + j + "-input").val();
      sendGcode(key + '=' + newVal);
    }
  }
  $('#grblModal').modal('hide');
  sendGcode('$$');
}

function grblModal() {
  $('#grblModal').modal('show');
  grblPopulate();
}