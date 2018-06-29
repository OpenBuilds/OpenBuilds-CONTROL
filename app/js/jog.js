var jogdist = 10;
var safeToUpdateSliders = true;

$(document).ready(function() {

  $("#frocell").hover(function() {
    safeToUpdateSliders = false;
    // console.log(safeToUpdateSliders)
  }, function() {
    safeToUpdateSliders = true;
    // console.log(safeToUpdateSliders)
  });

  $("#trocell").hover(function() {
    safeToUpdateSliders = false;
    // console.log(safeToUpdateSliders)
  }, function() {
    safeToUpdateSliders = true;
    // console.log(safeToUpdateSliders)
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
    $('.jogdist').removeClass('fg-grayBlue')
    $('.jogdist').addClass('fg-gray')
    $('#dist01label').removeClass('fg-gray')
    $('#dist01label').addClass('fg-grayBlue')
  })

  $('#dist1').on('click', function(ev) {
    jogdist = 1;
    $('.jogdist').removeClass('fg-grayBlue')
    $('.jogdist').addClass('fg-gray')
    $('#dist1label').removeClass('fg-gray')
    $('#dist1label').addClass('fg-grayBlue')
  })

  $('#dist10').on('click', function(ev) {
    jogdist = 10;
    $('.jogdist').removeClass('fg-grayBlue')
    $('.jogdist').addClass('fg-gray')
    $('#dist10label').removeClass('fg-gray')
    $('#dist10label').addClass('fg-grayBlue')
  })

  $('#dist100').on('click', function(ev) {
    jogdist = 100;
    $('.jogdist').removeClass('fg-grayBlue')
    $('.jogdist').addClass('fg-gray')
    $('#dist100label').removeClass('fg-gray')
    $('#dist100label').addClass('fg-grayBlue')
  })

  $('#dist500').on('click', function(ev) {
    jogdist = 500;
    $('.jogdist').removeClass('fg-grayBlue')
    $('.jogdist').addClass('fg-gray')
    $('#dist500label').removeClass('fg-gray')
    $('#dist500label').addClass('fg-grayBlue')
  })

  $('#gotozero').on('click', function(ev) {
    sendGcode('G0 Z5');
    sendGcode('G0 X0 Y0');
    sendGcode('G0 Z0');
  });

  $('#xM').on('click', function(ev) {
    var dir = 'X-';
    var feedrate = $('#jograte').val();
    jog('X', '-' + jogdist, feedrate);
  })

  $('#xP').on('click', function(ev) {
    var dir = 'X-';
    var feedrate = $('#jograte').val();
    jog('X', jogdist, feedrate);
  })

  $('#yM').on('click', function(ev) {
    var dir = 'X-';
    var feedrate = $('#jograte').val();
    jog('Y', '-' + jogdist, feedrate);
  })

  $('#yP').on('click', function(ev) {
    var dir = 'X-';
    var feedrate = $('#jograte').val();
    jog('Y', jogdist, feedrate);
  })

  $('#zM').on('click', function(ev) {
    var dir = 'X-';
    var feedrate = $('#jograte').val();
    jog('Z', '-' + jogdist, feedrate);
  })

  $('#zP').on('click', function(ev) {
    var dir = 'X-';
    var feedrate = $('#jograte').val();
    jog('Z', jogdist, feedrate);
  })

});

function jog(dir, dist, feed = null) {
  if (feed) {
    socket.emit('jog', dir + ',' + dist + ',' + feed);
  } else {
    socket.emit('jog', dir + ',' + dist);
  }
}