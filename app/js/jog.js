var allowContinuousJog;
var jogdist = 10;
var safeToUpdateSliders = true;

$(document).ready(function() {

  $(document).mousedown(function(e) {
    safeToUpdateSliders = false;
  }).mouseup(function(e) {
    safeToUpdateSliders = true;
  }).mouseleave(function(e) {
    safeToUpdateSliders = true;
  });

  $("#xPos").click(function() {
    $("#xPos").hide()
    $("#xPosInput").show().focus().val(laststatus.machine.position.work.x)
  });

  $("#xPosInput").blur(function() {
    $("#xPos").show()
    $("#xPosInput").hide()
  });

  $('#xPosInput').on('keypress', function(e) {
    if (e.which === 13) {
      //Disable textbox to prevent multiple submit
      $(this).attr("disabled", "disabled");
      $("#xPos").show()
      $("#xPosInput").hide()
      //Enable the textbox again if needed.
      $(this).removeAttr("disabled");
      sendGcode("G0 X" + $("#xPosInput").val())
    }
  });

  $("#yPos").click(function() {
    $("#yPos").hide()
    $("#yPosInput").show().focus().val(laststatus.machine.position.work.y)
  });

  $("#yPosInput").blur(function() {
    $("#yPos").show()
    $("#yPosInput").hide()
  });

  $('#yPosInput').on('keypress', function(e) {
    if (e.which === 13) {
      //Disable textbox to prevent multiple submit
      $(this).attr("disabled", "disabled");
      $("#yPos").show()
      $("#yPosInput").hide()
      //Enable the textbox again if needed.
      $(this).removeAttr("disabled");
      sendGcode("G0 Y" + $("#yPosInput").val())
    }
  });

  $("#zPos").click(function() {
    $("#zPos").hide()
    $("#zPosInput").show().focus().val(laststatus.machine.position.work.z)
  });

  $("#zPosInput").blur(function() {
    $("#zPos").show()
    $("#zPosInput").hide()
  });

  $('#zPosInput').on('keypress', function(e) {
    if (e.which === 13) {
      //Disable textbox to prevent multiple submit
      $(this).attr("disabled", "disabled");
      $("#zPos").show()
      $("#zPosInput").hide()
      //Enable the textbox again if needed.
      $(this).removeAttr("disabled");
      sendGcode("G0 Z" + $("#zPosInput").val())
    }
  });


  $('#dist01').on('click', function(ev) {
    jogdist = 0.1;
    $('.distbtn').removeClass('bd-openbuilds')
    $('#dist01').addClass('bd-openbuilds')
    $('.jogdist').removeClass('fg-openbuilds')
    $('.jogdist').addClass('fg-gray')
    $('#dist01label').removeClass('fg-gray')
    $('#dist01label').addClass('fg-openbuilds')
  })

  $('#dist1').on('click', function(ev) {
    jogdist = 1;
    $('.distbtn').removeClass('bd-openbuilds')
    $('#dist1').addClass('bd-openbuilds')
    $('.jogdist').removeClass('fg-openbuilds')
    $('.jogdist').addClass('fg-gray')
    $('#dist1label').removeClass('fg-gray')
    $('#dist1label').addClass('fg-openbuilds')
  })

  $('#dist10').on('click', function(ev) {
    jogdist = 10;
    $('.distbtn').removeClass('bd-openbuilds')
    $('#dist10').addClass('bd-openbuilds')
    $('.jogdist').removeClass('fg-openbuilds')
    $('.jogdist').addClass('fg-gray')
    $('#dist10label').removeClass('fg-gray')
    $('#dist10label').addClass('fg-openbuilds')
  })

  $('#dist100').on('click', function(ev) {
    jogdist = 100;
    $('.distbtn').removeClass('bd-openbuilds')
    $('#dist100').addClass('bd-openbuilds')
    $('.jogdist').removeClass('fg-openbuilds')
    $('.jogdist').addClass('fg-gray')
    $('#dist100label').removeClass('fg-gray')
    $('#dist100label').addClass('fg-openbuilds')
  })

  $('#dist500').on('click', function(ev) {
    jogdist = 500;
    $('.distbtn').removeClass('bd-openbuilds')
    $('#dist500').addClass('bd-openbuilds')
    $('.jogdist').removeClass('fg-openbuilds')
    $('.jogdist').addClass('fg-gray')
    $('#dist500label').removeClass('fg-gray')
    $('#dist500label').addClass('fg-openbuilds')
  })

  $('#gotozeroWPos').on('click', function(ev) {
    sendGcode('G21 G90');
    sendGcode('G0 Z5');
    sendGcode('G0 X0 Y0');
    sendGcode('G0 Z0');
  });

  $('#gotozeroMPos').on('click', function(ev) {
    sendGcode('G53 G0 Z0');
    sendGcode('G0 X0 Y0');
    sendGcode('G0 Z0');
  });

  $('#xM').on('click', function(ev) {
    if (!allowContinuousJog) {
      var dir = 'X-';
      var feedrate = $('#jograte').val();
      jog('X', '-' + jogdist, feedrate);
    }
  })

  $('#xP').on('click', function(ev) {
    if (!allowContinuousJog) {
      var dir = 'X-';
      var feedrate = $('#jograte').val();
      jog('X', jogdist, feedrate);
    }
  })

  $('#yM').on('click', function(ev) {
    if (!allowContinuousJog) {
      var dir = 'X-';
      var feedrate = $('#jograte').val();
      jog('Y', '-' + jogdist, feedrate);
    }
  })

  $('#yP').on('click', function(ev) {
    if (!allowContinuousJog) {
      var dir = 'X-';
      var feedrate = $('#jograte').val();
      jog('Y', jogdist, feedrate);
    }
  })

  $('#zM').on('click', function(ev) {
    if (!allowContinuousJog) {
      var dir = 'X-';
      var feedrate = $('#jograte').val();
      jog('Z', '-' + jogdist, feedrate);
    }
  })

  $('#zP').on('click', function(ev) {
    if (!allowContinuousJog) {
      var dir = 'X-';
      var feedrate = $('#jograte').val();
      jog('Z', jogdist, feedrate);
    }
  })

  $('#xP').on('mousedown', function(ev) {
    if (allowContinuousJog) { // startJog();
      var direction = "X";
      var feed = $('#jograte').val();
      socket.emit('runCommand', "$J=G91 G21 " + direction + "1000 F" + feed + "\n");
      $('#xM').click();
    }
  });
  $('#xP').on('mouseup', function(ev) {
    if (allowContinuousJog) {
      cancelJog()
    }
  });

  $('#yM').on('mousedown', function(ev) {
    if (allowContinuousJog) { // startJog();
      var direction = "Y-";
      var feed = $('#jograte').val();
      socket.emit('runCommand', "$J=G91 G21 " + direction + "1000 F" + feed + "\n");
      $('#xM').click();
    }
  });
  $('#yM').on('mouseup', function(ev) {
    if (allowContinuousJog) {
      cancelJog()
    }
  });

  $('#yP').on('mousedown', function(ev) {
    if (allowContinuousJog) { // startJog();
      var direction = "Y";
      var feed = $('#jograte').val();
      socket.emit('runCommand', "$J=G91 G21 " + direction + "1000 F" + feed + "\n");
      $('#xM').click();
    }
  });
  $('#yP').on('mouseup', function(ev) {
    if (allowContinuousJog) {
      cancelJog()
    }
  });

  $('#zM').on('mousedown', function(ev) {
    if (allowContinuousJog) { // startJog();
      var direction = "Z-";
      var feed = $('#jograte').val();
      socket.emit('runCommand', "$J=G91 G21 " + direction + "1000 F" + feed + "\n");
      $('#xM').click();
    }
  });
  $('#zM').on('mouseup', function(ev) {
    if (allowContinuousJog) {
      cancelJog()
    }
  });

  $('#zP').on('mousedown', function(ev) {
    if (allowContinuousJog) { // startJog();
      var direction = "Z";
      var feed = $('#jograte').val();
      socket.emit('runCommand', "$J=G91 G21 " + direction + "1000 F" + feed + "\n");
      $('#xM').click();
    }
  });
  $('#zP').on('mouseup', function(ev) {
    if (allowContinuousJog) {
      cancelJog()
    }
  });

  $('#xM').on('mousedown', function(ev) {
    if (allowContinuousJog) { // startJog();
      var direction = "X-";
      var feed = $('#jograte').val();
      socket.emit('runCommand', "$J=G91 G21 " + direction + "1000 F" + feed + "\n");
      $('#xM').click();
    }
  });
  $('#xM').on('mouseup', function(ev) {
    if (allowContinuousJog) {
      cancelJog()
    }
  });

  $('#homeBtn').on('click', function(ev) {
    home();
  })

  $('#chkSize').on('click', function() {
    var bbox2 = new THREE.Box3().setFromObject(object);
    console.log('bbox for Draw Bounding Box: ' + object + ' Min X: ', (bbox2.min.x), '  Max X:', (bbox2.max.x), 'Min Y: ', (bbox2.min.y), '  Max Y:', (bbox2.max.y));
    var feedrate = $('#jograte').val();
    if (laststatus.machine.firmware.type === 'grbl') {
      if (object.userData.inch) {
        var moves = `
        $J=G90G20X` + (bbox2.min.x) + ` Y` + (bbox2.min.y) + ` F` + feedrate + `\n
        $J=G90G20X` + (bbox2.max.x) + ` Y` + (bbox2.min.y) + ` F` + feedrate + `\n
        $J=G90G20X` + (bbox2.max.x) + ` Y` + (bbox2.max.y) + ` F` + feedrate + `\n
        $J=G90G20X` + (bbox2.min.x) + ` Y` + (bbox2.max.y) + ` F` + feedrate + `\n
        $J=G90G20X` + (bbox2.min.x) + ` Y` + (bbox2.min.y) + ` F` + feedrate + `\n
        `;
      } else {
        var moves = `
        $J=G90G21X` + (bbox2.min.x) + ` Y` + (bbox2.min.y) + ` F` + feedrate + `\n
        $J=G90G21X` + (bbox2.max.x) + ` Y` + (bbox2.min.y) + ` F` + feedrate + `\n
        $J=G90G21X` + (bbox2.max.x) + ` Y` + (bbox2.max.y) + ` F` + feedrate + `\n
        $J=G90G21X` + (bbox2.min.x) + ` Y` + (bbox2.max.y) + ` F` + feedrate + `\n
        $J=G90G21X` + (bbox2.min.x) + ` Y` + (bbox2.min.y) + ` F` + feedrate + `\n
        `;
      }

    } else {
      var moves = `
       G90\n
       G0 X` + (bbox2.min.x) + ` Y` + (bbox2.min.y) + ` F` + feedrate + `\n
       G0 X` + (bbox2.max.x) + ` Y` + (bbox2.min.y) + ` F` + feedrate + `\n
       G0 X` + (bbox2.max.x) + ` Y` + (bbox2.max.y) + ` F` + feedrate + `\n
       G0 X` + (bbox2.min.x) + ` Y` + (bbox2.max.y) + ` F` + feedrate + `\n
       G0 X` + (bbox2.min.x) + ` Y` + (bbox2.min.y) + ` F` + feedrate + `\n
       G90\n`;
    }
    socket.emit('runJob', moves);
  });

});

function changeStepSize(dir) {
  if (jogdist == 0.1) {
    if (dir == 1) {
      jogdist = 1;
      $('.distbtn').removeClass('bd-openbuilds')
      $('#dist1').addClass('bd-openbuilds')
      $('.jogdist').removeClass('fg-openbuilds')
      $('.jogdist').addClass('fg-gray')
      $('#dist1label').removeClass('fg-gray')
      $('#dist1label').addClass('fg-openbuilds')
    }
    if (dir == -1) {
      // do nothing
    }
  } else if (jogdist == 1) {
    if (dir == 1) {
      jogdist = 10;
      $('.distbtn').removeClass('bd-openbuilds')
      $('#dist10').addClass('bd-openbuilds')
      $('.jogdist').removeClass('fg-openbuilds')
      $('.jogdist').addClass('fg-gray')
      $('#dist10label').removeClass('fg-gray')
      $('#dist10label').addClass('fg-openbuilds')
    }
    if (dir == -1) {
      jogdist = 0.1;
      $('.distbtn').removeClass('bd-openbuilds')
      $('#dist01').addClass('bd-openbuilds')
      $('.jogdist').removeClass('fg-openbuilds')
      $('.jogdist').addClass('fg-gray')
      $('#dist01label').removeClass('fg-gray')
      $('#dist01label').addClass('fg-openbuilds')
    }
  } else if (jogdist == 10) {
    if (dir == 1) {
      jogdist = 100;
      $('.distbtn').removeClass('bd-openbuilds')
      $('#dist100').addClass('bd-openbuilds')
      $('.jogdist').removeClass('fg-openbuilds')
      $('.jogdist').addClass('fg-gray')
      $('#dist100label').removeClass('fg-gray')
      $('#dist100label').addClass('fg-openbuilds')
    }
    if (dir == -1) {
      jogdist = 1;
      $('.distbtn').removeClass('bd-openbuilds')
      $('#dist1').addClass('bd-openbuilds')
      $('.jogdist').removeClass('fg-openbuilds')
      $('.jogdist').addClass('fg-gray')
      $('#dist1label').removeClass('fg-gray')
      $('#dist1label').addClass('fg-openbuilds')
    }
  } else if (jogdist == 100) {
    if (dir == 1) {
      // do nothing
    }
    if (dir == -1) {
      jogdist = 10;
      $('.distbtn').removeClass('bd-openbuilds')
      $('#dist10').addClass('bd-openbuilds')
      $('.jogdist').removeClass('fg-openbuilds')
      $('.jogdist').addClass('fg-gray')
      $('#dist10label').removeClass('fg-gray')
      $('#dist10label').addClass('fg-openbuilds')
    }
  }

}

function jog(dir, dist, feed = null) {
  if (feed) {
    socket.emit('jog', dir + ',' + dist + ',' + feed);
  } else {
    socket.emit('jog', dir + ',' + dist);
  }
}

function jogXY(xincrement, yincrement, feed = null) {
  var data = {
    x: xincrement,
    y: yincrement,
    feed: feed
  }
  socket.emit('jogXY', data);
}

function home() {
  if (laststatus != undefined && laststatus.machine.firmware.type == 'grbl') {
    sendGcode('$H')
  } else if (laststatus != undefined && laststatus.machine.firmware.type == 'smoothie') {
    sendGcode('G28')
  }
}