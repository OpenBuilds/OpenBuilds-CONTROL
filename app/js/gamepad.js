var gamepad;
var gamepadInterval;

$(document).ready(function() {
  // $('#gamepadTab').show();

  gamepad = new Gamepad();

  gamepad.bind(Gamepad.Event.CONNECTED, function(device) {
    console.log(device)
  });

  gamepad.bind(Gamepad.Event.DISCONNECTED, function(device) {
    // gamepad disconnected
    console.log(device)
  });

  gamepad.bind(Gamepad.Event.UNSUPPORTED, function(device) {
    // an unsupported gamepad connected (add new mapping)
    console.log(device)
  });

  gamepad.bind(Gamepad.Event.BUTTON_DOWN, function(e) {
    console.log(e.control, e.gamepad.id);
  });

  gamepad.bind(Gamepad.Event.BUTTON_UP, function(e) {
    // e.control of gamepad e.gamepad released
    console.log(e.control, e.gamepad.id)
  });

  gamepad.bind(Gamepad.Event.AXIS_CHANGED, function(e) {
    // e.axis changed to value e.value for gamepad e.gamepad
    console.log(e.axis, e.value, e.gamepad.id)
  });

  // gamepad.bind(Gamepad.Event.TICK, function(gamepads) {
  //   // gamepads were updated (around 60 times a second)
  // });

  if (!gamepad.init()) {
    // Your browser does not support gamepads, get the latest Google Chrome or Firefox
  }

  gamepadInterval = setInterval(function() {
    // if (gamepad.gamepads.length > 0) {
    //   $('#gamepadTab').show();
    // } else {
    //   $('#gamepadTab').hide();
    // }
  }, 500)

});