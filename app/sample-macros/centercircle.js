function findCircleCenter(approxCircleDia, endmillDiameter, probeFeed) {

  // var approxCircleDia = 60;
  // var endmillDiameter = 3.175
  // var probeFeed = 200;

  var step = 0;
  var rightside = 0,
    leftside = 0,
    farside = 0,
    nearside = 0,
    centerXdistance = 0,
    centerYdistance = 0;

  socket.off('prbResult'); // Disable old listeners

  var holefindermacroStep1 = `
  ; Header

  G21 ; mm mode
  G10 P0 L20 X0 Y0 Z0 ; zero out current location

  G38.2 X` + approxCircleDia / 2 + ` F` + probeFeed + ` ; Probe X` // find right side of circle

  socket.emit('runJob', {
    data: holefindermacroStep1,
    isJob: false,
    completedMsg: false,
    fileName: ""
  });

  socket.on('prbResult', function(prbdata) {
    if (prbdata.state > 0) {
      step++;
      console.log("Step " + step, prbdata);

      // Steps 1-3 just positions endmill for probes that count

      if (step == 1) {
        rightside = prbdata.x
        console.log(rightside);

        var holefindermacroStep5 = `
        G4 P0.3
        G91
        G0 X-1
        G90
        G38.2 X-` + approxCircleDia / 2 + ` F` + probeFeed + ` ; Probe X` // find left side of circle

        socket.emit('runJob', {
          data: holefindermacroStep5,
          isJob: false,
          completedMsg: false,
          fileName: ""
        });
      }

      if (step == 2) {
        leftside = prbdata.x
        var centerdistance = (rightside - leftside);
        var holefindermacroStep6 = `
        G4 P0.3
        G91
        G0 X` + centerdistance / 2 + `
        G90
        G10 P0 L20 X0
        G38.2 Y` + approxCircleDia / 2 + ` F` + probeFeed + ` ; Probe Y` // find far side of circle

        socket.emit('runJob', {
          data: holefindermacroStep6,
          isJob: false,
          completedMsg: false,
          fileName: ""
        });
      }

      if (step == 3) {
        farside = prbdata.y

        var holefindermacroStep7 = `
        G4 P0.3
        G91
        G0 Y-1
        G90
        G38.2 Y-` + approxCircleDia / 2 + ` F` + probeFeed + ` ; Probe Y` // find near side of circle

        socket.emit('runJob', {
          data: holefindermacroStep7,
          isJob: false,
          completedMsg: false,
          fileName: ""
        });
      }

      if (step == 4) {
        nearside = prbdata.y
        centerYdistance = (farside - nearside);
        centerXdistance = (rightside - leftside);
        console.log(centerXdistance, centerYdistance)
        var holefindermacroStep7 = `
        G4 P0.3
        G91
        G0 Y` + centerYdistance / 2 + `
        G90
        G10 P0 L20 Y0
        `

        socket.emit('runJob', {
          data: holefindermacroStep7,
          isJob: false,
          completedMsg: `Probe Complete: Remove the Probe Clip and Probe GND before continuing... <hr>
          Probed dimension X: ` + (centerXdistance + endmillDiameter).toFixed(3) + `<br>
          Probed dimension Y: ` + (centerYdistance + endmillDiameter).toFixed(3) + `<br>
          <hr>`,
          fileName: ""
        });
      }

    } else {
      console.log("Probe Failed")
    }

  })
}

Metro.dialog.create({
  title: "Center Finding Macro",
  content: `
    <div class="row mb-0">
      <label class="cell-sm-6">Maximum Distance between edges</label>
      <div class="cell-sm-6">
      	<input id="centerProbeDistance" type="number" value="100" data-role="input" data-append="mm" data-prepend="<i class='fas fa-ruler-combined'></i>" data-clear-button="false">
      </div>
    </div>

    <small>This is the approximate diameter of the circle, or the maximum width between edges of the rectangular/square hole you are probing inside</small>
    <hr>
    <div class="row mb-0">
      <label class="cell-sm-6">Endmill Diameter</label>
      <div class="cell-sm-6">
      	<input id="centerProbeEndmill" type="number" value="6.35" data-role="input" data-append="mm" data-prepend="<i class='fas fa-arrows-alt-h'></i>" data-clear-button="false">
      </div>
    </div>
    <small>Enter the Endmill Diameter</small>
    <hr>
    <div class="row mb-0">
      <label class="cell-sm-6">Probe Feedrate</label>
      <div class="cell-sm-6">
      	<input id="centerProbeFeedrate" type="number" value="100" data-role="input" data-append="mm/min" data-prepend="<i class='fas fa-running'></i>" data-clear-button="false">
      </div>
    </div>
    <small>How fast the probe will move - slower is safer/more accurate</small>
    `,
  actions: [{
      caption: "Run center finding Probe",
      cls: "js-dialog-close success",
      onclick: function() {
        var approxCircleDia = parseFloat($("#centerProbeDistance").val())
        var endmillDiameter = parseFloat($("#centerProbeEndmill").val())
        var probeFeed = parseInt($("#centerProbeFeedrate").val())
        findCircleCenter(approxCircleDia, endmillDiameter, probeFeed)
      }
    },
    {
      caption: "Cancel",
      cls: "js-dialog-close alert",
      onclick: function() {
        //
      }
    }
  ]
});