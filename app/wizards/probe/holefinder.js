function findCenter() {
  var xoffset = (probemode.probe.xoffset) * -1 // *-1 to make negative as we are off to the left too far from x0
  var yoffset = (probemode.probe.yoffset) * -1 // *-1 to make negative as we are off to the front too far from y0
  var zoffset = parseFloat(probemode.probe.zoffset) // not *-1 as its offset in z pos
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

  ; First we establish Zero
  ; Probe Z
  G0 X22.5 Y22.5 ; position to center of logo
  G38.2 Z-25 F100 ; Probe Z
  G4 P0.3
  G10 P0 L20 Z` + zoffset + ` ; Set Z6 where 6 is thickness of plate
  G0 Z` + (zoffset + 5) + ` ; retract

  ; Probe X
  G0 X-20 Y10 ; position to left side and move forward a little to be closer to center of edge
  G0 Z` + (zoffset - 6) + ` ; drop down to be next to plate
  G38.2 X25 F100 ; Probe X
  G4 P0.3
  G10 P0 L20 X` + xoffset + ` ; set X as offset and half endmill diameter
  G0 X` + (xoffset - 2).toFixed(3) + `
  G0 Z` + (zoffset + 5) + ` ; retract

  ; Probe Y
  G0 X15 Y-20 ; position to front side and move right a little to be closer to center of edge
  G0 Z` + (zoffset - 6) + ` ; drop down to be next to plate
  G38.2 Y25 F100 ; probe Y
  G4 P0.3
  G10 P0 L20 Y` + yoffset + ` ; set Y as offset and half endmill diameter
  G0 Y` + (yoffset - 2).toFixed(3) + `
  G0 Z` + (zoffset + 5) + ` ; retract
  G0 X0 Y0 ; return

  G0 X4 Y4
  G0 Z1
  G38.2 X10 F50 ; Probe X`

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

      if (step == 4) {
        rightside = prbdata.x
        console.log(rightside);

        var holefindermacroStep5 = `
        G4 P0.3
        G91
        G0 X-1
        G90
        G38.2 X-10 F50 ; Probe X`

        socket.emit('runJob', {
          data: holefindermacroStep5,
          isJob: false,
          completedMsg: false,
          fileName: ""
        });
      }

      if (step == 5) {
        leftside = prbdata.x
        var centerdistance = (rightside - leftside);
        var holefindermacroStep6 = `
        G4 P0.3
        G91
        G0 X` + centerdistance / 2 + `
        G90
        G38.2 Y10 F50 ; Probe Y`

        socket.emit('runJob', {
          data: holefindermacroStep6,
          isJob: false,
          completedMsg: false,
          fileName: ""
        });
      }

      if (step == 6) {
        farside = prbdata.y

        var holefindermacroStep7 = `
        G4 P0.3
        G91
        G0 Y-1
        G90
        G38.2 Y-10 F50 ; Probe Y`

        socket.emit('runJob', {
          data: holefindermacroStep7,
          isJob: false,
          completedMsg: false,
          fileName: ""
        });
      }

      if (step == 7) {
        nearside = prbdata.y
        centerYdistance = (farside - nearside);
        console.log(centerYdistance)
        var holefindermacroStep7 = `
        G4 P0.3
        G91
        G0 Y` + centerYdistance / 2 + `
        G90
        G38.2 X-10 F50 ; Probe Y`

        socket.emit('runJob', {
          data: holefindermacroStep7,
          isJob: false,
          completedMsg: false,
          fileName: ""
        });
      }

      if (step == 8) {
        leftside = prbdata.x

        var holefindermacroStep7 = `
        G4 P0.3
        G91
        G0 X1
        G90
        G38.2 X10 F50 ; Probe Y`

        socket.emit('runJob', {
          data: holefindermacroStep7,
          isJob: false,
          completedMsg: false,
          fileName: ""
        });
      }

      if (step == 9) {
        rightside = prbdata.x
        centerXdistance = (rightside - leftside);
        console.log(centerXdistance)
        var holefindermacroStep7 = `
        G4 P0.3
        G91
        G0 X-` + centerXdistance / 2 + `
        G90
        G10 P0 L20 X0 Y0
        G0 Z` + (zoffset + 5) + ` ; retract`

        socket.emit('runJob', {
          data: holefindermacroStep7,
          isJob: false,
          completedMsg: "Probe Complete: Remove the Probe Clip and Probe Plate before continuing... <hr> Approx Endmill Diameter: " + (12 - ((centerXdistance + centerYdistance) / 2)).toFixed(2) + "mm",
          fileName: ""
        });
      }
    } else {
      console.log("Probe Failed")
    }

  })
}