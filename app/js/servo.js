var servo = false;
var penupval = 128;
var pendownval = 128;

if (localStorage.getItem("servo-calibration")) {
  servo = JSON.parse(localStorage.getItem("servo-calibration"));
  penupval = servo.up;
  pendownval = servo.down;
} else {
  servo = false;
  penupval = 128
  pendownval = 128
}

$(document).ready(function() {
  $('#pP').on('click', function(ev) {
    console.log('pen up')
    if (servo) {
      socket.emit('runCommand', "M3S" + servo.up + "\n");
    } else {
      servocalibrate()
    }
  })

  $('#pM').on('click', function(ev) {
    console.log('pen down')
    if (servo) {
      socket.emit('runCommand', "M3S" + servo.down + "\n");
    } else {
      servocalibrate()
    }
  })
});