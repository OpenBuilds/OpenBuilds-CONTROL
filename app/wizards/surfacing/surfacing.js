function populateSurfaceToolForm() {
  $("#gcode").empty();

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
    };
  }
  $("#surfaceDiameter").val(data.surfaceDiameter);
  $("#surfaceStepover").val(data.surfaceStepover);
  $("#surfaceFeedrate").val(data.surfaceFeedrate);
  $("#surfaceX").val(data.surfaceX);
  $("#surfaceY").val(data.surfaceY);
  $("#surfaceDepth").val(data.surfaceDepth);
  var $radios = $("input:radio[name=surfaceType]");
  $radios.filter("[value=" + data.surfaceType + "]").prop("checked", true);
  Metro.dialog.open("#surfacingDialog");
}

function createSurfaceGcode() {
  var data = {
    surfaceDiameter: $("#surfaceDiameter").val(),
    surfaceStepover: $("#surfaceStepover").val(),
    surfaceFeedrate: $("#surfaceFeedrate").val(),
    surfaceX: $("#surfaceX").val(),
    surfaceY: $("#surfaceY").val(),
    surfaceDepth: $("#surfaceDepth").val(),
    surfaceType: $("input[name='surfaceType']:checked").val(),
    surfaceRPM: $('#surfaceRPM').val()
  };
  console.log(data);
  localStorage.setItem("lastSurfacingTool", JSON.stringify(data));

  var startpointX = 0 + data.surfaceDiameter / 2;
  var endpointX = data.surfaceX - data.surfaceDiameter / 2;

  var startpointY = 0 + data.surfaceDiameter / 2;
  var endpointY = data.surfaceY - data.surfaceDiameter / 2;

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
; X: ` +
    data.surfaceX +
    `, Y: ` +
    data.surfaceY +
    `, Z: ` +
    data.surfaceDepth +
    `
G54; Work Coordinates
G21; mm-mode
G90; Absolute Positioning
M3 S` + data.surfaceRPM + `; Spindle On
G4 P1.8; Wait for spindle to come up to speed
G0 Z10
G0 X0 Y0
G1 F` +
    data.surfaceFeedrate + `\n`;

  var reverse = false;

  if (!reverse) {
    gcode +=
      `G0 X` +
      startpointX.toFixed(4) +
      ` Y` +
      startpointY.toFixed(4) +
      ` Z10\n
G1 X` +
      startpointX.toFixed(4) +
      ` Y` +
      startpointY.toFixed(4) +
      ` Z-` +
      data.surfaceDepth +
      `\n`;
  } else {
    gcode +=
      `G0 X` +
      endpointX.toFixed(4) +
      ` Y` +
      startpointY.toFixed(4) +
      ` Z10\n
G1 X` +
      endpointX.toFixed(4) +
      ` Y` +
      startpointY.toFixed(4) +
      ` Z-` +
      data.surfaceDepth +
      `\n`;
  }

  for (i = startpointY; i.toFixed(4) < endpointY; i += lineOver) {
    if (!reverse) {
      gcode += `G1 Y` + i.toFixed(4) + `\n`;
      gcode += `G1 X` + startpointX.toFixed(4) + ` Y` + i.toFixed(4) + ` Z-` + data.surfaceDepth + `\n`;
      gcode += `G1 X` + endpointX.toFixed(4) + ` Y` + i.toFixed(4) + ` Z-` + data.surfaceDepth + `\n`;
      reverse = true;
    } else {
      gcode += `G1 Y` + i.toFixed(4) + `\n`;
      gcode += `G1 X` + endpointX.toFixed(4) + ` Y` + i.toFixed(4) + ` Z-` + data.surfaceDepth + `\n`;
      gcode += `G1 X` + startpointX.toFixed(4) + ` Y` + i.toFixed(4) + ` Z-` + data.surfaceDepth + `\n`;
      reverse = false;
    }
  }

  if (!reverse) {
    gcode += `G1 Y` + endpointY.toFixed(4) + `\n`;
    gcode += `G1 X` + startpointX.toFixed(4) + ` Y` + endpointY.toFixed(4) + ` Z-` + data.surfaceDepth + `\n`;
    gcode += `G1 X` + endpointX.toFixed(4) + ` Y` + endpointY.toFixed(4) + ` Z-` + data.surfaceDepth + `\n`;
    reverse = true;
  } else {
    gcode += `G1 Y` + endpointY.toFixed(4) + `\n`;
    gcode += `G1 X` + endpointX.toFixed(4) + ` Y` + endpointY.toFixed(4) + ` Z-` + data.surfaceDepth + `\n`;
    gcode += `G1 X` + startpointX.toFixed(4) + ` Y` + endpointY.toFixed(4) + ` Z-` + data.surfaceDepth + `\n`;
    reverse = false;
  }

  gcode += `G0 Z10\n`;

  // Framing Pass
  gcode += `; Framing pass\n`;
  gcode += `G0 X` + startpointX.toFixed(4) + ` Y` + startpointY.toFixed(4) + ` Z10\n`; // position at start point
  gcode += `G1 Z-` + data.surfaceDepth + `\n`; // plunge
  gcode += `G1 X` + startpointX.toFixed(4) + ` Y` + endpointY.toFixed(4) + ` Z-` + data.surfaceDepth + `\n`; // Cut side
  gcode += `G0 Z10\n`;
  gcode += `G0 X` + endpointX.toFixed(4) + ` Y` + endpointY.toFixed(4) + `\n`; // position at start point
  gcode += `G1 Z-` + data.surfaceDepth + `\n`; // plunge
  gcode += `G1 X` + endpointX.toFixed(4) + ` Y` + startpointY.toFixed(4) + ` Z-` + data.surfaceDepth + `\n`; // Cut side
  gcode += `G0 Z10\n`;
  gcode += `G0 X0 Y0\n`;


  gcode += `M5 S0\n`;

  editor.session.setValue(gcode);
  parseGcodeInWebWorker(gcode)
  printLog("<span class='fg-red'>[ Surfacing / Flattening Wizard ] </span><span class='fg-green'>GCODE Loaded</span>")

  // console.log(gcode);
  //
  // $("#gcode").html(gcode.replace(/(?:\r\n|\r|\n)/g, "<br>"));
}