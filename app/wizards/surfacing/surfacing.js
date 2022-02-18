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
G4 P1.8 ; Wait for spindle to come up to speed
G0 Z10
G0 X0 Y0
G1 F` +
    data.surfaceFeedrate + `\n`;

  var reverse = false;

  if (!reverse) {
    gcode +=
      `G0 X` +
      startpointX +
      ` Y` +
      startpointY +
      ` Z10\n
G1 X` +
      startpointX +
      ` Y` +
      startpointY +
      ` Z-` +
      data.surfaceDepth +
      `\n`;
  } else {
    gcode +=
      `G0 X` +
      endpointX +
      ` Y` +
      startpointY +
      ` Z10\n
G1 X` +
      endpointX +
      ` Y` +
      startpointY +
      ` Z-` +
      data.surfaceDepth +
      `\n`;
  }

  for (i = startpointY; i.toFixed(4) < endpointY; i += lineOver) {
    if (!reverse) {
      gcode += `G1 Y` + i.toFixed(4) + `\n`;
      gcode += `G1 X` + startpointX + ` Y` + i.toFixed(4) + ` Z-` + data.surfaceDepth + `\n`;
      gcode += `G1 X` + endpointX + ` Y` + i.toFixed(4) + ` Z-` + data.surfaceDepth + `\n`;
      reverse = true;
    } else {
      gcode += `G1 Y` + i.toFixed(4) + `\n`;
      gcode += `G1 X` + endpointX + ` Y` + i.toFixed(4) + ` Z-` + data.surfaceDepth + `\n`;
      gcode += `G1 X` + startpointX + ` Y` + i.toFixed(4) + ` Z-` + data.surfaceDepth + `\n`;
      reverse = false;
    }
  }

  if (!reverse) {
    gcode += `G1 Y` + endpointY + `\n`;
    gcode += `G1 X` + startpointX + ` Y` + endpointY + ` Z-` + data.surfaceDepth + `\n`;
    gcode += `G1 X` + endpointX + ` Y` + endpointY + ` Z-` + data.surfaceDepth + `\n`;
    reverse = true;
  } else {
    gcode += `G1 Y` + endpointY + `\n`;
    gcode += `G1 X` + endpointX + ` Y` + endpointY + ` Z-` + data.surfaceDepth + `\n`;
    gcode += `G1 X` + startpointX + ` Y` + endpointY + ` Z-` + data.surfaceDepth + `\n`;
    reverse = false;
  }

  gcode += `G0 Z10\n`;

  // Framing Pass
  gcode += `; Framing pass\n`;
  gcode += `G0 X` + startpointX + ` Y` + startpointY + `Z10\n`; // position at start point
  gcode += `G1 Z-` + data.surfaceDepth + `\n`; // plunge
  gcode += `G1 X` + startpointX + ` Y` + endpointY + `Z-` + data.surfaceDepth + `\n`; // Cut side
  gcode += `G0 Z10\n`;
  gcode += `G0 X` + endpointX + ` Y` + endpointY + `\n`; // position at start point
  gcode += `G1 Z-` + data.surfaceDepth + `\n`; // plunge
  gcode += `G1 X` + endpointX + ` Y` + startpointY + `Z-` + data.surfaceDepth + `\n`; // Cut side
  gcode += `G0 Z10\n`;
  gcode += `G0 X0 Y0\n`;


  gcode += `M5 S0\n`;

  editor.session.setValue(gcode);
  parseGcodeInWebWorker(gcode)
  printLog("<span class='fg-red'>[ Surfacing Wizard ] </span><span class='fg-green'>GCODE Loaded</span>")

  // console.log(gcode);
  //
  // $("#gcode").html(gcode.replace(/(?:\r\n|\r|\n)/g, "<br>"));
}



function populateRoundingToolForm() {
  $("#gcode").empty();

  if (localStorage.getItem("lastRoundingTool")) {
    var data = JSON.parse(localStorage.getItem("lastRoundingTool"));
  } else {
    var data = {
      roundingDiameter: 6.35,
      roundingStepover: 40,
      roundingFeedrate: 1500,
      roundingX: 200,
      roundingStartA: 165,
      roundingFinishA: 150,
      roundingDepth: 3,
    };
  }
  $("#roundDiameter").val(data.roundingDiameter);
  $("#roundStepover").val(data.roundingStepover);
  $("#roundFeedrate").val(data.roundingFeedrate);
  $("#roundX").val(data.roundingX);
  $("#roundStartA").val(data.roundingStartA);
  $("#roundFinishA").val(data.roundingFinishA);
  $("#roundDepth").val(data.roundingDepth);
  var $radios = $("input:radio[name=surfaceType]");
  $radios.filter("[value=" + data.surfaceType + "]").prop("checked", true);
  Metro.dialog.open("#roundingDialog");
}


function createRoundingGcode() {
  var data = {
    roundingDiameter: $("#roundDiameter").val(),
    roundingStepover: $("#roundStepover").val(),
    roundingFeedrate: $("#roundFeedrate").val(),
    roundingX: $("#roundX").val(),
    roundingStartA: $("#roundStartA").val(),
    roundingFinishA: $("#roundFinishA").val(),
    roundingDepth: $("#roundDepth").val(),

  };
  //console.log(data);
  localStorage.setItem("lastRoundingTool", JSON.stringify(data));


  var RoundingStepOver=parseFloat(data.roundingStepover)/100.0
  var rotationCount=Math.ceil(data.roundingX/(data.roundingDiameter*RoundingStepOver));
  var passCount= Math.floor(0.5*(data.roundingStartA-data.roundingFinishA)/data.roundingDepth);
  var passRadius=parseFloat(data.roundingStartA)/2.0
  var passDepth=parseFloat(data.roundingDepth)
  var Xvalue=parseFloat(data.roundingX)
  var FinishRadius=parseFloat(data.roundingFinishA)/2.0
  var FR= parseFloat(data.roundingFeedrate)


  //console.log(data);
  var gcode =
`; Surfacing / Flattening Operation
; Endmill Diameter: ` +  data.roundingDiameter +`mm
; Stepover: ` + data.roundingStepover + `%
; Feedrate: ` + data.roundingFeedrate + `mm/min
; X: ` +  data.roundingX + `
; Start Diameter: ` + data.roundingStartA + `mm
; Project Diameter: ` + data.roundingFinishA +`mm

G54; Work Coordinates
G21; mm-mode
G90; Absolute Positioning
M3 S1000 ;Spindle On
G4 P1.8 ; Wait for spindle to come up to speed\n`

  gcode +=`G0 Z` + (passRadius+5) + `\n`
  gcode += `G0 X0 A0\n`
  gcode +=`G0 Z`+ (passRadius+1) +`\n` 

  for(i=0;i<passCount;i++){
    gcode +=`G1 Z`+ (passRadius-passDepth*(i+1)) + ` F`+ FR +`\n`;
    gcode += 'G1 X' + Xvalue + ` A` + rotationCount*360 + `\n`;
    gcode += `G92 A0 ; reset A0\n`
    gcode += `G0 Z` + (passRadius+5) + `A0\n`
    gcode += 'G0 X0\n'
    gcode += `G0 Z`+ (passRadius+1) +`\n`

  }

  if(passRadius-passDepth*passCount>FinishRadius){  // partial pass depth if needed
      gcode +=`G1 Z`+ (FinishRadius).toFixed(4) + ` F`+ FR +`\n`;
      gcode += 'G1 X' + Xvalue + ` A` + rotationCount*360 + `\n`;
      gcode += `G92 A0 ; reset A0\n`
      gcode += `G0 Z` + (passRadius+5) + `A0\n`
      gcode += 'G0 X0\n'
  }

  gcode += `G0 Z`+ (passRadius+5).toFixed(4) +`\n`;
  gcode += `G0 X0 A0\n`;
  gcode += `M5 S0\n`;





  console.log(gcode);





  editor.session.setValue(gcode);
  parseGcodeInWebWorker(gcode)
  printLog("<span class='fg-red'>[ Rounding Wizard ] </span><span class='fg-green'>GCODE Loaded</span>")

}
