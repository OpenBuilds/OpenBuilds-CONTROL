var xyzprobeplate = {
  xoffset: 10,
  yoffset: 10,
  zoffset: 9,
  name: "OpenBuilds XYZ Touchplate",
  xyzmode: true
}

var zprobeplate = {
  xoffset: 0,
  yoffset: 0,
  zoffset: 20,
  name: "OpenBuilds Z Touchplate",
  xyzmode: false
}

var probemode = {
  mode: "auto", // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  endmilldia: 0,
  stock: {
    x: 0,
    y: 0,
    position: "fl" // fl, fr, rl, rr, c
  },
  plate: {
    traveldistance: 25,
    thickness: 20,
    feedrate: 500
  },
  probe: xyzprobeplate,
}

// still beta, lets hide it from users
// if (!enableBetaFeatures) {
//   $(".needsXYZProbe").hide();
// }

function openProbeDialog() {
  Metro.dialog.open("#xyzProbeWindow");
  if (localStorage.getItem('probeType')) {
    probetype(localStorage.getItem('probeType'))
    if (localStorage.getItem('probeType') == "z") {
      setTimeout(function() {
        probezplatetab()
        $(".probetabxyz").removeClass("active")
        $("#probezplatetab").addClass("active")
      }, 100)
    } else {
      setTimeout(function() {
        probexyztab()
        $(".probetabxyz").removeClass("active")
        $("#probexyztab").addClass("active")
      }, 100)
    }
  }
}

function openProbeXDialog() {
  Metro.dialog.open("#xyzProbeWindow");
  if (localStorage.getItem('probeType')) {
    probetype(localStorage.getItem('probeType'))
    if (localStorage.getItem('probeType') == "z") {
      // setTimeout(function() {
      //   probezplatetab()
      //   $(".probetabxyz").removeClass("active")
      //   $("#probezplatetab").addClass("active")
      // }, 100)
    } else {
      setTimeout(function() {
        probextab()
        $(".probetabxyz").removeClass("active")
        $("#probextab").addClass("active")
      }, 100)
    }
  }
}

function openProbeYDialog() {
  Metro.dialog.open("#xyzProbeWindow");
  if (localStorage.getItem('probeType')) {
    probetype(localStorage.getItem('probeType'))
    if (localStorage.getItem('probeType') == "z") {
      // setTimeout(function() {
      //   probezplatetab()
      //   $(".probetabxyz").removeClass("active")
      //   $("#probezplatetab").addClass("active")
      // }, 100)
    } else {
      setTimeout(function() {
        probeytab()
        $(".probetabxyz").removeClass("active")
        $("#probeytab").addClass("active")
      }, 100)
    }
  }
}

function openProbeZDialog() {
  Metro.dialog.open("#xyzProbeWindow");
  if (localStorage.getItem('probeType')) {
    probetype(localStorage.getItem('probeType'))
    if (localStorage.getItem('probeType') == "z") {
      setTimeout(function() {
        probezplatetab()
        $(".probetabxyz").removeClass("active")
        $("#probezplatetab").addClass("active")
      }, 100)
    } else {
      setTimeout(function() {
        probeztab()
        $(".probetabxyz").removeClass("active")
        $("#probeztab").addClass("active")
      }, 100)
    }
  }
}

function probeautotab() {
  probemode.mode = "auto"; // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  $(".probe-tab-content").hide();
  $("#probe-auto").show();
  $("#xyzdatum").show();
  $(".img-probe").hide();
  $("#img-probe-auto").show();
  $("#toggle-probe-advanced").show();
  $("#endmilldiameterform").hide();
  if (probemode.stock.position == "fl") {
    $("#toggle-probe-advanced-content").data('collapse').collapse()
  } else {
    $("#toggle-probe-advanced-content").data('collapse').expand()
  }

}

function probexyztab() {
  probemode.mode = "xyz"; // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  $(".probe-tab-content").hide();
  $("#probe-xyz").show();
  $("#xyzdatum").show();
  $(".img-probe").hide();
  $("#img-probe-xyz").show();
  $("#toggle-probe-advanced").show();
  $("#endmilldiameterform").show();
  if (probemode.stock.position == "fl") {
    $("#toggle-probe-advanced-content").data('collapse').collapse()
  } else {
    $("#toggle-probe-advanced-content").data('collapse').expand()
  }

}

function probextab() {
  probemode.mode = "xzero"; // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  resetOffsetFL();
  $(".probe-tab-content").hide();
  $("#probe-x").show();
  $("#xyzdatum").hide();
  $(".img-probe").hide();
  $("#img-probe-x").show();
  $("#toggle-probe-advanced").hide();
  $("#endmilldiameterform").show();
  $("#toggle-probe-advanced-content").data('collapse').collapse()
}

function probeytab() {
  probemode.mode = "yzero"; // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  resetOffsetFL();
  $(".probe-tab-content").hide();
  $("#probe-y").show();
  $("#xyzdatum").hide();
  $(".img-probe").hide();
  $("#img-probe-y").show();
  $("#toggle-probe-advanced").hide();
  $("#endmilldiameterform").show();
  $("#toggle-probe-advanced-content").data('collapse').collapse()
}

function probeztab() {
  probemode.mode = "zzero"; // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  resetOffsetFL();
  $(".probe-tab-content").hide();
  $("#probe-z").show();
  $("#xyzdatum").hide();
  $(".img-probe").hide();
  $("#img-probe-z").show();
  $("#toggle-probe-advanced").hide();
  $("#endmilldiameterform").hide();
  $("#toggle-probe-advanced-content").data('collapse').collapse()
}

function probezplatetab() {
  probemode.mode = "zplate"; // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  resetOffsetFL();
  $(".probe-tab-content").hide();
  $("#probe-z").show();
  $("#xyzdatum").hide();
  $(".img-probe").hide();
  $("#img-probe-zplate").show();
  $("#toggle-probe-advanced").hide();
  $("#endmilldiameterform").hide();
  $("#toggle-probe-advanced-content").data('collapse').expand()
}

function probeendmilltab() {
  probemode.mode = "endmilldia"; // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  resetOffsetFL();
  $(".probe-tab-content").hide();
  $("#probe-endmill").show();
  $("#xyzdatum").hide();
  $(".img-probe").hide();
  $("#img-probe-endmill").show();
  $("#toggle-probe-advanced").hide();
  $("#endmilldiameterform").hide();
  $("#toggle-probe-advanced-content").data('collapse').collapse()
}

function resetOffsetFL() {
  $(".probe-label").removeClass("areaactive")
  $("#probe-fl").addClass("areaactive")
  probemode.stock.position = "fl" // fl, fr, rl, rr, c
}

$("#probe-fl, #probe-fl-text").on("click", function() {
  resetOffsetFL();
});

$("#probe-fr, #probe-fr-text").on("click", function() {
  $(".probe-label").removeClass("areaactive")
  $("#probe-fr").addClass("areaactive")
  probemode.stock.position = "fr" // fl, fr, rl, rr, c
});

$("#probe-rl, #probe-rl-text").on("click", function() {
  $(".probe-label").removeClass("areaactive")
  $("#probe-rl").addClass("areaactive")
  probemode.stock.position = "rl" // fl, fr, rl, rr, c
});

$("#probe-rr, #probe-rr-text").on("click", function() {
  $(".probe-label").removeClass("areaactive")
  $("#probe-rr").addClass("areaactive")
  probemode.stock.position = "rr" // fl, fr, rl, rr, c
});

$("#probe-c, #probe-c-text").on("click", function() {
  $(".probe-label").removeClass("areaactive")
  $("#probe-c").addClass("areaactive")
  probemode.stock.position = "c" // fl, fr, rl, rr, c
});

function probetype(type) {
  localStorage.setItem('probeType', type);
  if (type == "xyz") {
    probemode.probe = xyzprobeplate // protoxyzprobeplate, xyzprobeplate, zprobeplate
    var template = `<span class="icon"><img src="https://i.ibb.co/QkxzYN8/xyztouch.png"/></span> OpenBuilds XYZ Probe`;
    $("#probetypebtn").html(template)
    $(".probetabz").hide();
    $(".probetabxyz").show();
    probexyztab()
  } else if (type == "protoxyz") {
    probemode.probe = protoxyzprobeplate // protoxyzprobeplate, xyzprobeplate, zprobeplate
    var template = `<span class="icon"><img src="https://i.ibb.co/QkxzYN8/xyztouch.png"/></span> Prototype OpenBuilds XYZ Probe`;
    $("#probetypebtn").html(template)
    $(".probetabz").hide();
    $(".probetabxyz").show();
    probexyztab()
  } else if (type == "z") {
    probemode.probe = zprobeplate // protoxyzprobeplate, xyzprobeplate, zprobeplate
    var template = `<span class="icon"><img src="https://i.ibb.co/CQ7rSW6/ztouch.png"/></span>OpenBuilds Z Touch Plate`;
    $("#probetypebtn").html(template)
    $(".probetabxyz").hide();
    $(".probetabz").show();
    probezplatetab();
  }
}

function confirmProbeInPlace(operation) {

  var imgurl = "./img/xyzprobe/xyz.png"
  if (probemode.mode == "xyz") { // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
    imgurl = "./img/xyzprobe/xyz.png"
  } else if (probemode.mode == "xzero") { // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
    imgurl = "./img/xyzprobe/x.png"
  } else if (probemode.mode == "yzero") { // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
    imgurl = "./img/xyzprobe/y.png"
  } else if (probemode.mode == "zzero") { // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
    imgurl = "./img/xyzprobe/z.png"
  } else if (probemode.mode == "zplate") { // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
    imgurl = "./img/xyzprobe/zplate.png"
  } else if (probemode.mode == "endmilldia") { // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
    imgurl = "./img/xyzprobe/endmill.png"
  } else if (probemode.mode == "auto") { // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
    imgurl = "./img/xyzprobe/auto.png"
  }

  var confirmTemplate = `
  <table>
    <tr>
      <td><img src="` + imgurl + `" height="350" class="img-probe"/>
      </td>
      <td style="padding: 4px; vertical-align: middle;">
        <ul>
          <li>Are you sure the probe plate was placed onto the front, left corner of the stock/workpiece?</li>
          <li>Are you sure the probe clip is attached to the bit?</li>
          <li>Are you sure you jogged the bit to the correct approximate position as shown, prior to initiating the probe?</li>
        </ul>
      </td>
    </tr>
  </table>
  `

  $("#confirmXYZprobeDiv").html(confirmTemplate);
  setTimeout(function() {
    Metro.dialog.open("#confirmXYZprobeModal")
  }, 100);

}


function runProbeNew() {
  $("#consoletab").click()
  probemode.stock.x = $("#stockwidth").val();
  probemode.stock.y = $("#stocklength").val();

  template = `Code todo: run: \n`
  template += `Mode: ` + probemode.mode + `\n`
  template += `Probe: ` + probemode.probe.name + `\n`
  template += `Probe: X:` + probemode.probe.xoffset + `\n`
  template += `Probe: Y:` + probemode.probe.yoffset + `\n`
  template += `Probe: Z:` + probemode.probe.zoffset + `\n`

  if (probemode.mode == "xyz" || probemode.mode == "xzero" || probemode.mode == "yzero" || probemode.mode == "zzero") {
    probemode.endmilldia = $("#probediameterxyz").val();
    template += `Endmill: ` + probemode.endmilldia + `mm\n`
  }

  var stockoffset = {
    x: 0,
    y: 0
  }
  if (probemode.stock.position == "fl") { // fl, fr, rl, rr, c
    template += `Offset: NONE\n`
  }
  if (probemode.stock.position == "fr") { // fl, fr, rl, rr, c
    template += `Stock x:` + probemode.stock.x + `\n`;
    template += `Stock y: ` + probemode.stock.y + `\n`;
    template += `Offset: Front Right:\n`;
    template += `Offset x:` + probemode.stock.x + `\n`;
    template += `Offset y: ` + 0 + `\n`;
    stockoffset.x = probemode.stock.x
  }
  if (probemode.stock.position == "rl") { // fl, fr, rl, rr, c
    template += `Stock x:` + probemode.stock.x + `\n`;
    template += `Stock y: ` + probemode.stock.y + `\n`;
    template += `Offset: Rear Left:\n`;
    template += `Offset x:` + 0 + `\n`;
    template += `Offset y: ` + probemode.stock.y + `\n`;
    stockoffset.y = probemode.stock.y
  }
  if (probemode.stock.position == "rr") { // fl, fr, rl, rr, c
    template += `Stock x:` + probemode.stock.x + `\n`;
    template += `Stock y: ` + probemode.stock.y + `\n`;
    template += `Offset: Rear Right:\n`;
    template += `Offset x:` + probemode.stock.x + `\n`;
    template += `Offset y: ` + probemode.stock.y + `\n`;
    stockoffset.x = probemode.stock.x
    stockoffset.y = probemode.stock.y
  }
  if (probemode.stock.position == "c") { // fl, fr, rl, rr, c
    template += `Stock x:` + probemode.stock.x + `\n`;
    template += `Stock y: ` + probemode.stock.y + `\n`;
    template += `Offset: Center:\n`;
    template += `Offset x:` + probemode.stock.x / 2 + `\n`;
    template += `Offset y: ` + probemode.stock.y / 2 + `\n`;
    stockoffset.x = probemode.stock.y / 2
    stockoffset.y = probemode.stock.y / 2
  }

  // alert(template)

  if (probemode.mode == "xzero") {
    var xoffset = (probemode.probe.xoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the left too far from x0
    var yoffset = (probemode.probe.yoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the front too far from y0
    var zoffset = probemode.probe.zoffset // not *-1 as its offset in z pos

    var xmacro = `
    ; Header
    G21 ; mm mode
    G10 P1 L20 X0 ; zero out current location

    ; Probe X
    G38.2 X25 F100 ; Probe X
    G4 P0.4
    G10 P1 L20 X` + xoffset + ` ; set X as offset and half endmill diameter
    G0 X` + (xoffset - 2).toFixed(3) + `
    `


    socket.emit('runJob', {
      data: xmacro,
      isJob: false,
      completedMsg: "Probe Complete: Remove the Probe Clip and Probe Plate before continuing... "
    });

  }

  if (probemode.mode == "yzero") {
    var xoffset = (probemode.probe.xoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the left too far from x0
    var yoffset = (probemode.probe.yoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the front too far from y0
    var zoffset = probemode.probe.zoffset // not *-1 as its offset in z pos

    var ymacro = `
    ; Header
    G21 ; mm mode
    G10 P1 L20 Y0 ; zero out current location

    G38.2 Y25 F100 ; probe Y
    G4 P0.4
    G10 P1 L20 Y` + yoffset + ` ; set Y as offset and half endmill diameter
    G0 Y` + (yoffset - 2).toFixed(3) + `
    `
    socket.emit('runJob', {
      data: ymacro,
      isJob: false,
      completedMsg: "Probe Complete: Remove the Probe Clip and Probe Plate before continuing... "
    });
  }

  if (probemode.mode == "zzero") {
    var xoffset = (probemode.probe.xoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the left too far from x0
    var yoffset = (probemode.probe.yoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the front too far from y0
    var zoffset = probemode.probe.zoffset // not *-1 as its offset in z pos

    var zmacro = `
    ; Header
    G21 ; mm mode
    G10 P1 L20 Z0 ; zero out current location

    ; Probe Z
    G38.2 Z-25 F100 ; Probe Z
    G4 P0.4
    G10 P1 L20 Z` + zoffset + ` ; Set Z6 where 6 is thickness of plate
    G0 Z10 ; retract
    `

    socket.emit('runJob', {
      data: zmacro,
      isJob: false,
      completedMsg: "Probe Complete: Remove the Probe Clip and Probe Plate before continuing... "
    });

  }

  if (probemode.mode == "xyz") {
    var xoffset = (probemode.probe.xoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the left too far from x0
    var yoffset = (probemode.probe.yoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the front too far from y0
    var zoffset = probemode.probe.zoffset // not *-1 as its offset in z pos

    var xyzmacro = `
    ; Header
    G21 ; mm mode
    G10 P1 L20 X0 Y0 Z0 ; zero out current location

    ; Probe Z
    G0 X22.5 Y22.5 ; position to center of logo
    G38.2 Z-25 F100 ; Probe Z
    G4 P0.4
    G10 P1 L20 Z` + zoffset + ` ; Set Z6 where 6 is thickness of plate
    G0 Z10 ; retract
    G0 X0 Y0 ; return

    ; Probe X
    G0 X-20 ; position to left side
    G0 Y15 ; and move forward a little to be closer to center of edge
    G0 Z0 ; drop down to be next to plate
    G38.2 X25 F100 ; Probe X
    G4 P0.4
    G10 P1 L20 X` + xoffset + ` ; set X as offset and half endmill diameter
    G0 X` + (xoffset - 2).toFixed(3) + `
    G0 Z10 ; retract
    G0 X0 Y0 ; return

    ; Probe Y
    G0 Y-20 ; position to front side
    G0 X15 ; and move right a little to be closer to center of edge
    G0 Z0 ; drop down to be next to plate
    G38.2 Y25 F100 ; probe Y
    G4 P0.4
    G10 P1 L20 Y` + yoffset + ` ; set Y as offset and half endmill diameter
    G0 Y` + (yoffset - 2).toFixed(3) + `
    G0 Z10 ; retract
    G0 X0 Y0 ; return
    `

    if (stockoffset.x != 0 || stockoffset.y != 0) {
      xyzmacro += `
      G10 P1 L20 X-` + stockoffset.x + ` ; set X stock offset
      G10 P1 L20 Y-` + stockoffset.y + ` ; set Y stock offset
      G0 X0 Y0 ; return
      `
    }
    socket.emit('runJob', {
      data: xyzmacro,
      isJob: false,
      completedMsg: "Probe Complete: Remove the Probe Clip and Probe Plate before continuing... "
    });

  }
}