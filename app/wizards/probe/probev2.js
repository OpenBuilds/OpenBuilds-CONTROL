var xyzprobeplate = {
  xoffset: 10,
  yoffset: 10,
  zoffset: 9,
  name: "OpenBuilds XYZ Probe Plus",
  xyzmode: true
}

var zprobeplate = {
  xoffset: 0,
  yoffset: 0,
  zoffset: 20,
  xyzmode: false,
  name: "OpenBuilds Z Touchplate",
}

var customprobeplate = {
  xoffset: 6,
  yoffset: 6,
  zoffset: 8,
  xyzmode: true,
  name: "Custom XYZ Touchplate",
}

var probemode = {
  mode: "auto", // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  endmilldia: 0,
  stock: {
    x: 0,
    y: 0,
    position: "fl" // fl, fr, rl, rr, c
  },
  probe: xyzprobeplate,
}

$(document).ready(function() {
  if (localStorage.getItem('probeType')) {
    if (localStorage.getItem('probeType') == "z") {
      $(".needsXYZProbe").hide()
    } else {
      // console.log("Enabling XYZ Probing")
      $(".needsXYZProbe").show()
    }
  }

  if (localStorage.getItem('z0platethickness')) {
    zprobeplate.zoffset = localStorage.getItem('z0platethickness')
  }
});

if (localStorage.getItem('customProbe')) {
  customprobeplate = (JSON.parse(localStorage.getItem('customProbe')))
}

$("#z0platethickness").keyup(function() {
  localStorage.setItem('z0platethickness', $("#z0platethickness").val())
  zprobeplate.zoffset = $("#z0platethickness").val()
});


// still beta, lets hide it from users
// if (!enableBetaFeatures) {
//   $(".needsXYZProbe").hide();
// }

function openProbeDialog() {
  Metro.dialog.open("#xyzProbeWindow");
  if (localStorage.getItem('probeType')) {
    probetype(localStorage.getItem('probeType'))
    if (localStorage.getItem('probeType') == "z") { // Z Touchplate
      setTimeout(function() {
        probezplatetab()
        $(".probetabxyz").removeClass("active")
        $("#probezplatetab").addClass("active")
      }, 100)
    } else if (localStorage.getItem('probeType') == "xyz") { // OpenBuilds Probe Plus XYZ
      setTimeout(function() {
        probeautotab()
        $(".probetabxyz").removeClass("active")
        $("#probeautotab").addClass("active")
      }, 100)
    } else { // Custom Probe
      setTimeout(function() {
        probexyztab()
        $(".probetabxyz").removeClass("active")
        $("#probexyztab").addClass("active")
      }, 100)
    }
  } else {
    setTimeout(function() {
      probexyztab()
      $(".probetabxyz").removeClass("active")
      $("#probexyztab").addClass("active")
    }, 100)
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
  } else {
    setTimeout(function() {
      probextab()
      $(".probetabxyz").removeClass("active")
      $("#probextab").addClass("active")
    }, 100)
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
  } else {
    setTimeout(function() {
      probeytab()
      $(".probetabxyz").removeClass("active")
      $("#probeytab").addClass("active")
    }, 100)
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
  } else {
    setTimeout(function() {
      probeztab()
      $(".probetabxyz").removeClass("active")
      $("#probeztab").addClass("active")
    }, 100)
  }
}

function probeautotab() {
  probemode.mode = "auto"; // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  $(".probe-tab-content").hide();
  $("#probe-auto").show();
  $("#xyzdatum").show();
  $("#zplatesettings").hide();
  $(".img-probe").hide();
  $("#img-probe-auto").show();
  $("#toggle-probe-advanced").hide();
  $("#toggle-probe-advanced-content").data('collapse').collapse()
  $("#endmilldiameterform").hide();
  probemode.stock.position == "fl"
  $('#runNewProbeBtn').addClass("disabled")
  $('#confirmNewProbeBtn').removeClass("disabled")
  $('#jogTypeContinuous').prop('checked', true)
  allowContinuousJog = true;
  $('.probetabxyz').removeClass('active');
  $('#probeautotab').addClass('active');
}

function probexyztab() {
  probemode.mode = "xyz"; // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  $(".probe-tab-content").hide();
  $("#probe-xyz").show();
  $("#xyzdatum").show();
  $("#zplatesettings").hide();
  $(".img-probe").hide();
  $("#img-probe-xyz").show();
  $("#toggle-probe-advanced").show();
  $("#toggle-probe-advanced-content").data('collapse').collapse()
  $("#endmilldiameterform").show();
  if (probemode.stock.position == "fl") {
    $("#toggle-probe-advanced-content").data('collapse').collapse()
  } else {
    $("#toggle-probe-advanced-content").data('collapse').expand()
  }
  $('#runNewProbeBtn').addClass("disabled")
  $('#confirmNewProbeBtn').removeClass("disabled")
  $('#jogTypeContinuous').prop('checked', true)
  allowContinuousJog = true;
  $('.probetabxyz').removeClass('active');
  $('#probexyztab').addClass('active');
}

function probextab() {
  probemode.mode = "xzero"; // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  resetOffsetFL();
  $(".probe-tab-content").hide();
  $("#probe-x").show();
  $("#xyzdatum").hide();
  $("#zplatesettings").hide();
  $(".img-probe").hide();
  $("#img-probe-x").show();
  $("#toggle-probe-advanced").hide();
  $("#endmilldiameterform").show();
  $("#toggle-probe-advanced-content").data('collapse').collapse()
  $('#runNewProbeBtn').addClass("disabled")
  $('#confirmNewProbeBtn').removeClass("disabled")
  $('#jogTypeContinuous').prop('checked', true)
  allowContinuousJog = true;
}

function probeytab() {
  probemode.mode = "yzero"; // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  resetOffsetFL();
  $(".probe-tab-content").hide();
  $("#probe-y").show();
  $("#xyzdatum").hide();
  $("#zplatesettings").hide();
  $(".img-probe").hide();
  $("#img-probe-y").show();
  $("#toggle-probe-advanced").hide();
  $("#endmilldiameterform").show();
  $("#toggle-probe-advanced-content").data('collapse').collapse()
  $('#runNewProbeBtn').addClass("disabled")
  $('#confirmNewProbeBtn').removeClass("disabled")
  $('#jogTypeContinuous').prop('checked', true)
  allowContinuousJog = true;
}

function probeztab() {
  probemode.mode = "zzero"; // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  resetOffsetFL();
  $(".probe-tab-content").hide();
  $("#probe-z").show();
  $("#xyzdatum").hide();
  $("#zplatesettings").hide();
  $("#zplatesettings").hide();
  $(".img-probe").hide();
  $("#img-probe-z").show();
  $("#toggle-probe-advanced").hide();
  $("#endmilldiameterform").hide();
  $("#toggle-probe-advanced-content").data('collapse').collapse()
  $('#runNewProbeBtn').addClass("disabled")
  $('#confirmNewProbeBtn').removeClass("disabled")
  $('#jogTypeContinuous').prop('checked', true)
  allowContinuousJog = true;
}

function probezplatetab() {
  probemode.mode = "zplate"; // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  resetOffsetFL();
  $(".probe-tab-content").hide();
  $("#probe-z").show();
  $("#xyzdatum").hide();
  $("#zplatesettings").show();
  $(".img-probe").hide();
  $("#img-probe-zplate").show();
  $("#toggle-probe-advanced").show();
  $("#endmilldiameterform").hide();
  $("#toggle-probe-advanced-content").data('collapse').collapse()
  $('#runNewProbeBtn').addClass("disabled")
  $('#confirmNewProbeBtn').removeClass("disabled")
  $('#jogTypeContinuous').prop('checked', true)
  allowContinuousJog = true;
  $('#z0platethickness').val(zprobeplate.zoffset)
  $('.probetabxyz').removeClass('active');
  $('#probezplatetab').addClass('active');
  if (zprobeplate.zoffset != 20) {
    $("#toggle-probe-advanced-content").data('collapse').expand()
  } else {
    $("#toggle-probe-advanced-content").data('collapse').collapse()
  }

}

function probeendmilltab() {
  probemode.mode = "endmilldia"; // auto, xyz, xzero, yzero, zzero, zplate, endmilldia
  resetOffsetFL();
  $(".probe-tab-content").hide();
  $("#probe-endmill").show();
  $("#xyzdatum").hide();
  $("#zplatesettings").hide();
  $(".img-probe").hide();
  $("#img-probe-endmill").show();
  $("#toggle-probe-advanced").hide();
  $("#endmilldiameterform").hide();
  $("#toggle-probe-advanced-content").data('collapse').collapse()
  $('#runNewProbeBtn').addClass("disabled")
  $('#confirmNewProbeBtn').removeClass("disabled")
  $('#jogTypeContinuous').prop('checked', true)
  allowContinuousJog = true;
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
    $(".needsXYZProbe").show()
    probemode.probe = xyzprobeplate // customprobeplate, xyzprobeplate, zprobeplate
    var template = `<span class="icon"><img src="/img/xyzprobe/xyztouch.png"/></span> OpenBuilds XYZ Probe Plus`;
    $("#probetypebtn").html(template)
    $(".probetabz").hide();
    $(".probetabxyz").show();
    $("#editCustomProbeBtn").hide()
    $("#ProbeButtonBarSpacer").show()
    $("#probeautotab").show();
    probeautotab()
  } else if (type == "z") {
    $(".needsXYZProbe").hide()
    probemode.probe = zprobeplate // customprobeplate, xyzprobeplate, zprobeplate
    var template = `<span class="icon"><img src="/img/xyzprobe/ztouch.png"/></span>OpenBuilds Z Touch Plate`;
    $("#probetypebtn").html(template)
    $(".probetabxyz").hide();
    $(".probetabz").show();
    $("#editCustomProbeBtn").hide()
    $("#ProbeButtonBarSpacer").show()
    $("#probeautotab").hide();
    probezplatetab();
  } else if (type == "custom") {
    $(".needsXYZProbe").show()
    probemode.probe = customprobeplate // customprobeplate, xyzprobeplate, zprobeplate
    var template = `<span class="icon"><img src="/img/xyzprobe/custom.png"/></span> Custom XYZ Probe`;
    $("#probetypebtn").html(template)
    $(".probetabz").hide();
    $(".probetabxyz").show();
    $("#editCustomProbeBtn").show()
    $("#ProbeButtonBarSpacer").hide()
    $("#probeautotab").hide();
    probexyztab()
  }
}

function confirmProbeInPlace(operation) {
  $('#confirmNewProbeBtn').addClass("disabled")
  $('#runNewProbeBtn').removeClass("disabled").focus();
}

function resetJogModeAfterProbe() {
  if (localStorage.getItem('continuousJog')) {
    if (JSON.parse(localStorage.getItem('continuousJog')) == true) {
      $('#jogTypeContinuous').prop('checked', true)
      allowContinuousJog = true;
      $('.distbtn').hide()
    } else {
      $('#jogTypeContinuous').prop('checked', false)
      allowContinuousJog = false;
      $('.distbtn').show();
    }
  }
  $('#confirmNewProbeBtn').removeClass("disabled")
}


function runProbeNew() {
  resetJogModeAfterProbe()
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
    probemode.endmilldia = parseFloat($("#probediameterxyz").val());
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
    stockoffset.x = probemode.stock.x / 2
    stockoffset.y = probemode.stock.y / 2
  }

  // alert(template)

  if (probemode.mode == "auto") {
    findCenter();
  }

  if (probemode.mode == "xzero") {
    var xoffset = (probemode.probe.xoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the left too far from x0
    var yoffset = (probemode.probe.yoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the front too far from y0
    var zoffset = probemode.probe.zoffset // not *-1 as its offset in z pos

    var xmacro = `
    ; Header
    G21 ; mm mode
    G10 P0 L20 X0 ; zero out current location

    ; Probe X
    G38.2 X25 F100 ; Probe X
    G4 P0.4
    G10 P0 L20 X` + xoffset + ` ; set X as offset and half endmill diameter
    G0 X` + (xoffset - 2).toFixed(3) + `
    `

    socket.off('prbResult'); // Disable old listeners
    socket.emit('runJob', {
      data: xmacro,
      isJob: false,
      completedMsg: "Probe Complete: Remove the Probe Clip and Probe Plate before continuing... ",
      fileName: ""
    });

  }

  if (probemode.mode == "yzero") {
    var xoffset = (probemode.probe.xoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the left too far from x0
    var yoffset = (probemode.probe.yoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the front too far from y0
    var zoffset = probemode.probe.zoffset // not *-1 as its offset in z pos

    var ymacro = `
    ; Header
    G21 ; mm mode
    G10 P0 L20 Y0 ; zero out current location

    G38.2 Y25 F100 ; probe Y
    G4 P0.4
    G10 P0 L20 Y` + yoffset + ` ; set Y as offset and half endmill diameter
    G0 Y` + (yoffset - 2).toFixed(3) + `
    `
    socket.off('prbResult'); // Disable old listeners
    socket.emit('runJob', {
      data: ymacro,
      isJob: false,
      completedMsg: "Probe Complete: Remove the Probe Clip and Probe Plate before continuing... ",
      fileName: ""
    });
  }

  if (probemode.mode == "zzero") {
    var xoffset = (probemode.probe.xoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the left too far from x0
    var yoffset = (probemode.probe.yoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the front too far from y0
    var zoffset = probemode.probe.zoffset // not *-1 as its offset in z pos

    var zmacro = `
    G21
    G10 P0 L20 Z0
    G38.2 Z-25 F100
    G4 P0.4
    G10 P0 L20 Z` + zoffset + `
    $J=G91G21Z5F1000
    `

    socket.off('prbResult'); // Disable old listeners
    socket.emit('runJob', {
      data: zmacro,
      isJob: false,
      completedMsg: "Probe Complete: Remove the Probe Clip and Probe Plate before continuing... ",
      fileName: ""
    });

  }

  if (probemode.mode == "zplate") {
    var zoffset = probemode.probe.zoffset // not *-1 as its offset in z pos
    var thickness = $('#z0platethickness').val()
    if (thickness != probemode.probe.zoffset) {
      zoffset = thickness; // custom value from Advanced
    }

    var zmacro = `
    ; Header
    G21 ; mm mode
    G10 P0 L20 Z0 ; zero out current location

    ; Probe Z
    G38.2 Z-25 F100 ; Probe Z
    G4 P0.4
    G10 P0 L20 Z` + zoffset + ` ; Set Z` + zoffset + ` where ` + zoffset + ` is thickness of plate
    $J=G91G21Z5F1000 ; retract
    `

    socket.off('prbResult'); // Disable old listeners
    socket.emit('runJob', {
      data: zmacro,
      isJob: false,
      completedMsg: "Probe Complete: Remove the Probe Clip and Probe Plate before continuing... ",
      fileName: ""
    });

  }

  if (probemode.mode == "xyz") {
    var xoffset = (probemode.probe.xoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the left too far from x0
    var yoffset = (probemode.probe.yoffset + probemode.endmilldia / 2) * -1 // *-1 to make negative as we are off to the front too far from y0
    var zoffset = parseFloat(probemode.probe.zoffset) // not *-1 as its offset in z pos

    var xyzmacro = `
    ; Header
    G21 ; mm mode
    G10 P0 L20 X0 Y0 Z0 ; zero out current location

    ; Probe Z
    G0 X22.5 Y22.5 ; position to center of logo
    G38.2 Z-25 F100 ; Probe Z
    G4 P0.4
    G10 P0 L20 Z` + zoffset + ` ; Set Z6 where 6 is thickness of plate
    G0 Z` + (zoffset + 5) + ` ; retract

    ; Probe X
    G0 X-20 Y10 ; position to left side and move forward a little to be closer to center of edge
    G0 Z` + (zoffset - 6) + ` ; drop down to be next to plate
    G38.2 X25 F100 ; Probe X
    G4 P0.4
    G10 P0 L20 X` + xoffset + ` ; set X as offset and half endmill diameter
    G0 X` + (xoffset - 2).toFixed(3) + `
    G0 Z` + (zoffset + 5) + ` ; retract

    ; Probe Y
    G0 X15 Y-20 ; position to front side and move right a little to be closer to center of edge
    G0 Z` + (zoffset - 6) + ` ; drop down to be next to plate
    G38.2 Y25 F100 ; probe Y
    G4 P0.4
    G10 P0 L20 Y` + yoffset + ` ; set Y as offset and half endmill diameter
    G0 Y` + (yoffset - 2).toFixed(3) + `
    G0 Z` + (zoffset + 5) + ` ; retract
    G0 X0 Y0 ; return
    `

    if (stockoffset.x != 0 || stockoffset.y != 0) {
      xyzmacro += `
      G10 P0 L20 X-` + stockoffset.x + ` ; set X stock offset
      G10 P0 L20 Y-` + stockoffset.y + ` ; set Y stock offset
      G0 X0 Y0 ; return
      `
    }

    socket.off('prbResult'); // Disable old listeners
    socket.emit('runJob', {
      data: xyzmacro,
      isJob: false,
      completedMsg: "Probe Complete: Remove the Probe Clip and Probe Plate before continuing... ",
      fileName: ""
    });

  }
}

function rippleEffect(el, color) {
  var timer = null;

  if (el.css('position') === 'static') {
    el.css('position', 'relative');
  }

  el.css({
    overflow: 'hidden'
  });

  $(".ripple").remove();

  var size = Math.max(el.outerWidth(), el.outerHeight());

  // Add the element
  var ripple = $("<span class='ripple'></span>").css({
    width: size,
    height: size
  });

  el.prepend(ripple);

  // Add the ripples CSS and start the animation
  ripple.css({
    background: color,
    width: size,
    height: size,
    top: 0 + 'px',
    left: 0 + 'px'
  }).addClass("rippleEffect");
  timer = setTimeout(function() {
    timer = null;
    $(".ripple").remove();
  }, 400);
}

function editCustomProbe() {
  Metro.dialog.open('#editCustomProbeDialog');
  $("#customProbeXOffset").val(customprobeplate.xoffset);
  $("#customProbeYOffset").val(customprobeplate.yoffset);
  $("#customProbeZOffset").val(customprobeplate.zoffset);
}

function saveEditCustomProbe() {
  customprobeplate = {
    xoffset: parseFloat($("#customProbeXOffset").val()),
    yoffset: parseFloat($("#customProbeYOffset").val()),
    zoffset: parseFloat($("#customProbeZOffset").val()),
    xyzmode: true, // stays
    name: "Custom Z Touchplate", // stays
  };
  localStorage.setItem('customProbe', JSON.stringify(customprobeplate));
  probetype('custom');
}