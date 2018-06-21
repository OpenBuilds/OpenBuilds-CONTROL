var jogdist = 10;

$(document).ready(function() {

  // $('#homeX').on('click', function(ev) {
  //   var homecommand = document.getElementById('homingseq').value;
  //   sendGcode(homecommand + "X");
  // });

  $('#dist01').on('click', function(ev) {
    jogdist = 0.1;
    $('.jogdist').removeClass('fg-dark')
    $('.jogdist').addClass('fg-gray')
    $('#dist01label').removeClass('fg-gray')
    $('#dist01label').addClass('fg-dark')
  })

  $('#dist1').on('click', function(ev) {
    jogdist = 1;
    $('.jogdist').removeClass('fg-dark')
    $('.jogdist').addClass('fg-gray')
    $('#dist1label').removeClass('fg-gray')
    $('#dist1label').addClass('fg-dark')
  })

  $('#dist10').on('click', function(ev) {
    jogdist = 10;
    $('.jogdist').removeClass('fg-dark')
    $('.jogdist').addClass('fg-gray')
    $('#dist10label').removeClass('fg-gray')
    $('#dist10label').addClass('fg-dark')
  })

  $('#dist100').on('click', function(ev) {
    jogdist = 100;
    $('.jogdist').removeClass('fg-dark')
    $('.jogdist').addClass('fg-gray')
    $('#dist100label').removeClass('fg-gray')
    $('#dist100label').addClass('fg-dark')
  })

  $('#dist500').on('click', function(ev) {
    jogdist = 500;
    $('.jogdist').removeClass('fg-dark')
    $('.jogdist').addClass('fg-gray')
    $('#dist500label').removeClass('fg-gray')
    $('#dist500label').addClass('fg-dark')
  })

  $('#gotozero').on('click', function(ev) {
    sendGcode('G0 Z5');
    sendGcode('G0 X0 Y0');
    sendGcode('G0 Z0');
  });

  $('#xM').on('click', function(ev) {
    var dir = 'X-';
    var feedrate = 1000;
    jog('X', '-' + jogdist, feedrate);
  })

  $('#xP').on('click', function(ev) {
    var dir = 'X-';
    var feedrate = 1000;
    jog('X', jogdist, feedrate);
  })

  $('#yM').on('click', function(ev) {
    var dir = 'X-';
    var feedrate = 1000;
    jog('Y', '-' + jogdist, feedrate);
  })

  $('#yP').on('click', function(ev) {
    var dir = 'X-';
    var feedrate = 1000;
    jog('Y', jogdist, feedrate);
  })

  $('#zM').on('click', function(ev) {
    var dir = 'X-';
    var feedrate = 1000;
    jog('Z', '-' + jogdist, feedrate);
  })

  $('#zP').on('click', function(ev) {
    var dir = 'X-';
    var feedrate = 1000;
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