var haveEvents = 'ongamepadconnected' in window;
var controllers = {};

var gamepadButtons = [];
var oldGamepadButtons = [];
var gamepadAxes = [];
var oldGamepadAxes = [];


function connecthandler(e) {
  addgamepad(e.gamepad);
}

function addgamepad(gamepad) {
  controllers[gamepad.index] = gamepad;
  requestAnimationFrame(updateStatus);
}

function disconnecthandler(e) {
  removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
  delete controllers[gamepad.index];
}

function updateStatus() {
  if (!haveEvents) {
    scangamepads();
  }

  var i = 0;
  var j;

  for (j in controllers) {
    var controller = controllers[j];

    // Buttons
    for (i = 0; i < gamepadButtons.length; i++) {
      oldGamepadButtons[i] = gamepadButtons[i];
    }
    gamepadButtons.length = 0;
    for (i = 0; i < controller.buttons.length; i++) {
      var val = controller.buttons[i];
      var pressed = val == 1.0;
      if (typeof(val) == "object") {
        pressed = val.pressed;
        val = val.value;
      }
      gamepadButtons.push({
        id: i,
        pressed: pressed,
        val: val
      })
      if (oldGamepadButtons.length && oldGamepadButtons[i].pressed != gamepadButtons[i].pressed) {
        console.log("event on ", i, pressed, val)
      }
    }
    //  Axes
    for (i = 0; i < gamepadAxes.length; i++) {
      oldGamepadAxes[i] = gamepadAxes[i];
    }
    gamepadAxes.length = 0;
    for (i = 0; i < controller.axes.length; i++) {


      var val = parseFloat(controller.axes[i]).toFixed(2)
      if (val > 0.25) {
        val = 1
      } else if (val < -0.25) {
        val = -1
      } else {
        val = 0
      }

      gamepadAxes.push({
        id: i,
        val: val
      })
      if (oldGamepadAxes.length && oldGamepadAxes[i].val != gamepadAxes[i].val) {
        console.log("event on ", i, val)
      }
    }
  }

  requestAnimationFrame(updateStatus);
}

function scangamepads() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
  for (var i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      if (gamepads[i].index in controllers) {
        controllers[gamepads[i].index] = gamepads[i];
      } else {
        addgamepad(gamepads[i]);
      }
    }
  }
}

window.addEventListener("gamepadconnected", connecthandler);
window.addEventListener("gamepaddisconnected", disconnecthandler);

if (!haveEvents) {
  setInterval(scangamepads, 500);
}