var surfacingWizardTemplate = `
    <form>
      <div class="row mb-2">
        <div class="cell-sm-7">
          <div class="row mb-2">
            <label class="cell-sm-6">Surfacing Bit Diameter</label>
            <div class="cell-sm-6">
              <input id="surfaceDiameter" type="number" data-role="input" data-append="mm" data-clear-button="false" value="22" data-editable="true">
            </div>
          </div>

          <div class="row mb-2">
            <label class="cell-sm-6">Stepover</label>
            <div class="cell-sm-6">
              <input id="surfaceStepover" type="number" data-role="input" data-append="%" data-clear-button="false" value="40" data-editable="true">
            </div>
          </div>

          <div class="row mb-2">
            <label class="cell-sm-6">Feedrate</label>
            <div class="cell-sm-6">
              <input id="surfaceFeedrate" type="number" maxlength="5" data-role="input" data-append="mm/min" data-clear-button="false" value="800" data-editable="true"
                oninput="javascript: if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);">
            </div>
          </div>

          <div class="row mb-2 pb-2  border-bottom bd-gray">
            <label class="cell-sm-6">Spindle RPM</label>
            <div class="cell-sm-6">
              <input id="surfaceRPM" type="number" data-role="input" data-append="RPM" data-clear-button="false" value="1000" data-editable="true">
            </div>
          </div>

          <div class="row mb-2">
            <label class="cell-sm-6">Width<br> <small class="dark">X-Axis</small></label>
            <div class="cell-sm-6">
              <input id="surfaceX" type="number" data-role="input" data-append="mm" data-clear-button="false" value="200" data-editable="true">
            </div>
          </div>

          <div class="row mb-2 border-bottom bd-gray">
            <label class="cell-sm-6">Length<br> <small class="dark">Y-Axis</small></label>
            <div class="cell-sm-6">
              <input id="surfaceY" type="number" data-role="input" data-append="mm" data-clear-button="false" value="300" data-editable="true">
            </div>
          </div>

          <div class="row mb-2 pb-2 border-bottom bd-gray">
           <label class="cell-sm-6">Surface Direction</label>
           <div class="cell-sm-6">
             <select id="surfaceDirection" data-role="input" data-clear-button="false">
               <option value="X" selected>Along X-Axis</option>
               <option value="Y">Along Y-Axis</option>
             </select>
           </div>
         </div>

          <div class="row mb-2">
            <label class="cell-sm-6">Cut Depth per Pass</label>
            <div class="cell-sm-6">
              <input id="surfaceDepth" type="number" data-role="input" data-append="mm" data-clear-button="false" value="2" data-editable="true">
            </div>
          </div>

          <div class="row mb-2 pb-2 border-bottom bd-gray">
            <label class="cell-sm-6  mb-2">Final Cut Depth</label>
            <div class="cell-sm-6">
              <input id="surfaceFinalDepth" type="number" data-role="input" data-append="mm" data-clear-button="false" value="2" data-editable="true">
            </div>
          </div>

          <div class="row mb-2 pb-2 border-bottom bd-gray">
            <label class="cell-sm-6">Enable Coolant/Vacuum</label>
            <div class="cell-sm-6">
              <select id="surfaceCoolant" data-role="input" data-clear-button="false">
                <option value="enabled" selected>Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <div class="row mb-2 pb-2 border-bottom bd-gray">
            <label class="cell-sm-6">Enable Framing</label>
            <div class="cell-sm-6">
              <select id="surfaceFraming" data-role="input" data-clear-button="false">
                <option value="enabled" selected>Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

        </div>
        <div class="cell-sm-5">
          <small class="dark">NB: make sure your spindle is 100% perpendicular (trammed) to your bed, before running a Surfacing operation. Incorrectly trammed spindles will cause uneven machining of the surface, leading to pitting and
            uneven surface finish
          </small>
          <hr>

          <small class="dark">You can use the Surfacing / Flattening Wizard to
            <ul class="dark">
              <li>Prepare / flatten your spoilboard</li>
              <li>Level off stock</li>
            </ul></small>
          <hr>
          <center>
            <img src="img/surfacing/wizard1.png" alt="diameter" border="0" style="max-width: calc(100% - 10px); ">
          </center>
        </div>
      </div>
    </form>`

function populateSurfaceToolForm() {
  $("#gcode").empty();

  Metro.dialog.create({
    title: "<i class='fas fa-exchange-alt'></i> Surfacing / Flattening Wizard",
    content: surfacingWizardTemplate,
    toTop: true,
    width: '90%',
    clsDialog: 'dark',
    actions: [{
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {
          //
        }
      },
      {
        caption: "Proceed",
        cls: "js-dialog-close success",
        onclick: function() {
          createSurfaceGcode()
        }
      }
      // {
      //   caption: "Cancel",
      //   cls: "js-dialog-close",
      //   onclick: function() {
      //     // do nothing
      //   }
      // }
    ]
  });

  if (localStorage.getItem("lastSurfacingTool")) {
    var data = JSON.parse(localStorage.getItem("lastSurfacingTool"));
  } else {
    var data = {
      surfaceDiameter: 22,
      surfaceStepover: 40,
      surfaceFeedrate: 800,
      surfaceX: 200,
      surfaceY: 300,
      surfaceDepth: 3,
      surfaceFinalDepth: 3,
      surfaceCoolant: "enabled",
      surfaceFraming: "enabled",
      surfaceRPM: 1000,
      surfaceDirection: "X"
    };
  }
  $("#surfaceDiameter").val(data.surfaceDiameter);
  $("#surfaceStepover").val(data.surfaceStepover);
  $("#surfaceFeedrate").val(data.surfaceFeedrate);
  $("#surfaceX").val(data.surfaceX);
  $("#surfaceY").val(data.surfaceY);
  $("#surfaceDepth").val(data.surfaceDepth);
  if (data.surfaceFinalDepth != undefined) {
    data.surfaceFinalDepth = data.surfaceFinalDepth;
    $("#surfaceFinalDepth").val(data.surfaceFinalDepth);
  } else {
    $("#surfaceFinalDepth").val(data.surfaceDepth);
  }
  if (data.surfaceCoolant != undefined) {
    $('#surfaceCoolant').val(data.surfaceCoolant)
  }
  if (data.surfaceFraming != undefined) {
    $('#surfaceFraming').val(data.surfaceFraming)
  }

  $('#surfaceRPM').val(data.surfaceRPM)
  var $radios = $("input:radio[name=surfaceType]");
  $radios.filter("[value=" + data.surfaceType + "]").prop("checked", true);
  //Metro.dialog.open("#surfacingDialog");

  if (data.surfaceDirection != undefined) {
    $('#surfaceDirection').val(data.surfaceDirection); // Restore surface direction
  }

}

function createSurfaceGcode() {
  var data = {
    surfaceDiameter: $("#surfaceDiameter").val(),
    surfaceStepover: $("#surfaceStepover").val(),
    surfaceFeedrate: $("#surfaceFeedrate").val(),
    surfaceX: $("#surfaceX").val(),
    surfaceY: $("#surfaceY").val(),
    surfaceDepth: parseFloat($("#surfaceDepth").val()),
    surfaceFinalDepth: parseFloat($("#surfaceFinalDepth").val()),
    surfaceType: $("input[name='surfaceType']:checked").val(),
    surfaceRPM: $('#surfaceRPM').val(),
    surfaceCoolant: $('#surfaceCoolant').val(),
    surfaceFraming: $('#surfaceFraming').val(),
    surfaceDirection: $('#surfaceDirection').val() // New dropdown value
  };

  console.log(data);

  if (data.surfaceFinalDepth > data.surfaceDepth) {
    console.log("multipass");
  } else if (data.surfaceFinalDepth == data.surfaceDepth || data.surfaceFinalDepth < data.surfaceDepth) {
    console.log("singlepass");
    data.surfaceFinalDepth = data.surfaceDepth;
  }

  localStorage.setItem("lastSurfacingTool", JSON.stringify(data));

  var startpoint, endpoint, primaryAxis, secondaryAxis;
  if (data.surfaceDirection === "X") {
    primaryAxis = "X";
    secondaryAxis = "Y";
    startpoint = {
      primary: 0 + data.surfaceDiameter / 2,
      secondary: 0 + data.surfaceDiameter / 2
    };
    endpoint = {
      primary: data.surfaceX - data.surfaceDiameter / 2,
      secondary: data.surfaceY - data.surfaceDiameter / 2
    };
  } else {
    primaryAxis = "Y";
    secondaryAxis = "X";
    startpoint = {
      primary: 0 + data.surfaceDiameter / 2,
      secondary: 0 + data.surfaceDiameter / 2
    };
    endpoint = {
      primary: data.surfaceY - data.surfaceDiameter / 2,
      secondary: data.surfaceX - data.surfaceDiameter / 2
    };
  }

  var lineOver = data.surfaceDiameter * (data.surfaceStepover / 100);

  var gcode =
    `; Surfacing / Flattening Operation
; Endmill Diameter: ` +
    data.surfaceDiameter +
    `mm
; Stepover: ` +
    data.surfaceStepover +
    `%, Feedrate: ` +
    data.surfaceFeedrate +
    `mm/min
; ` + primaryAxis + `: ` +
    (primaryAxis === "X" ? data.surfaceX : data.surfaceY) +
    `, ` + secondaryAxis + `: ` +
    (secondaryAxis === "X" ? data.surfaceX : data.surfaceY) +
    `, Z: ` +
    data.surfaceDepth +
    `
G54; Work Coordinates
G21; mm-mode
G90; Absolute Positioning
M3 S` + data.surfaceRPM + `; Spindle On
`;

  if (data.surfaceCoolant == "enabled") {
    gcode += `M8 ;  Coolant On
`;
  }

  gcode += `G4 P1.8; Wait for spindle to come up to speed
G0 Z10 ; Move to Safe Height
G0 ` + primaryAxis + `0 ` + secondaryAxis + `0; Move to origin position
G1 F` +
    data.surfaceFeedrate + ` ; Set feedrate\n`;

  // MULTIPASS
  for (q = data.surfaceDepth; q < data.surfaceFinalDepth + data.surfaceDepth; q += data.surfaceDepth) {
    var zval = q > data.surfaceFinalDepth ? -data.surfaceFinalDepth : -q;
    console.log(q, zval);

    gcode += `\nG0 ` + primaryAxis + startpoint.primary.toFixed(4) + ` ` + secondaryAxis + startpoint.secondary.toFixed(4) + ` Z10 ; Move to start Position
`;
    gcode += `G1 ` + primaryAxis + startpoint.primary.toFixed(4) + ` ` + secondaryAxis + startpoint.secondary.toFixed(4) + ` Z` + zval + `; Plunge\n`;

    var reverse = false;

    for (i = startpoint.secondary; i.toFixed(4) < endpoint.secondary; i += lineOver) {
      if (!reverse) {
        gcode += `G1 ` + secondaryAxis + i.toFixed(4) + `\n`;
        gcode += `G1 ` + primaryAxis + startpoint.primary.toFixed(4) + ` ` + secondaryAxis + i.toFixed(4) + ` Z` + zval + `\n`;
        gcode += `G1 ` + primaryAxis + endpoint.primary.toFixed(4) + ` ` + secondaryAxis + i.toFixed(4) + ` Z` + zval + `\n`;
        reverse = true;
      } else {
        gcode += `G1 ` + secondaryAxis + i.toFixed(4) + `\n`;
        gcode += `G1 ` + primaryAxis + endpoint.primary.toFixed(4) + ` ` + secondaryAxis + i.toFixed(4) + ` Z` + zval + `\n`;
        gcode += `G1 ` + primaryAxis + startpoint.primary.toFixed(4) + ` ` + secondaryAxis + i.toFixed(4) + ` Z` + zval + `\n`;
        reverse = false;
      }
    }

    gcode += `G0 Z10; Pass complete, lifting to Z Safe height\n`;

    // Framing Pass
    if (data.surfaceFraming == "enabled") {
      gcode += `; Framing pass\n`;
      gcode += `G0 ` + primaryAxis + startpoint.primary.toFixed(4) + ` ` + secondaryAxis + startpoint.secondary.toFixed(4) + ` Z10\n`; // position at start point
      gcode += `G1 Z` + zval + `\n`; // plunge
      gcode += `G1 ` + primaryAxis + startpoint.primary.toFixed(4) + ` ` + secondaryAxis + endpoint.secondary.toFixed(4) + ` Z` + zval + `\n`; // Cut side
      gcode += `G0 Z10\n`;
      gcode += `G0 ` + primaryAxis + endpoint.primary.toFixed(4) + ` ` + secondaryAxis + endpoint.secondary.toFixed(4) + `\n`; // position at start point
      gcode += `G1 Z` + zval + `\n`; // plunge
      gcode += `G1 ` + primaryAxis + endpoint.primary.toFixed(4) + ` ` + secondaryAxis + startpoint.secondary.toFixed(4) + ` Z` + zval + `\n`; // Cut side
      gcode += `G0 Z10\n`;
      gcode += `G0 ` + primaryAxis + `0 ` + secondaryAxis + `0\n`;
    }
  }

  gcode += `M5 S0\n`;

  if (data.surfaceCoolant == "enabled") {
    gcode += `M9 ;  Coolant Off`;
  }

  editor.session.setValue(gcode);
  parseGcodeInWebWorker(gcode);
  loadedFileName = "Surfacing/Flattening Wizard Job"
  printLog("<span class='fg-red'>[ Surfacing / Flattening Wizard ] </span><span class='fg-green'>GCODE Loaded</span>");
}
