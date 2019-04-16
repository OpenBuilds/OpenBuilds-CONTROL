var keyboardShortcuts;

$(document).ready(function() {
  if (localStorage.getItem('keyboardShortcuts')) {
    keyboardShortcuts = JSON.parse(localStorage.getItem('keyboardShortcuts'));
  } else {
    keyboardShortcuts = {
      xP: "arrowright", //X+
      xM: "left", //X-
      yP: "up", //Y+
      yM: "down", //Y-
      zP: "pageup", //Z+
      zM: "pagedown", //Z-
      stepP: "+",
      stepM: "-",
      estop: 'esc'
    }
  }
  bindKeys()
});

function bindKeys() {
  // Clear all current binds
  $(document).unbind('keydown');

  // Bind for Electron Devtools
  document.addEventListener('keydown', function(evt) {
    if (evt.which === 123) {
      try {
        var focusedWindow = require('electron').remote.getCurrentWindow();
        if (focusedWindow.isDevToolsOpened()) {
          focusedWindow.closeDevTools();
        } else {
          focusedWindow.openDevTools();
        }
      } catch (error) {
        console.warn(error);
      }
    } else if (evt.which === 116) {
      location.reload();
    }
  });

  // Bind for Jog and Control Buttons
  if (keyboardShortcuts.xM.length) {
    $(document).bind('keydown', keyboardShortcuts.xM, function() {
      $('#xM').click()
    });
  }
  if (keyboardShortcuts.xP.length) {
    $(document).bind('keydown', keyboardShortcuts.xP, function() {
      $('#xP').click()
    });
  }
  if (keyboardShortcuts.yM.length) {
    $(document).bind('keydown', keyboardShortcuts.yM, function() {
      $('#yM').click()
    });
  }
  if (keyboardShortcuts.yP.length) {
    $(document).bind('keydown', keyboardShortcuts.yP, function() {
      $('#yP').click()
    });
  }
  if (keyboardShortcuts.zM.length) {
    $(document).bind('keydown', keyboardShortcuts.zM, function() {
      $('#zM').click()
    });
  }
  if (keyboardShortcuts.zP.length) {
    $(document).bind('keydown', keyboardShortcuts.zP, function() {
      $('#zP').click()
    });
  }
  if (keyboardShortcuts.stepM.length) {
    $(document).bind('keydown', keyboardShortcuts.stepM, function() {
      changeStepSize(-1)
    });
  }
  if (keyboardShortcuts.stepP.length) {
    $(document).bind('keydown', keyboardShortcuts.stepP, function() {
      changeStepSize(1)
    });
  }
  if (keyboardShortcuts.estop.length) {
    $(document).bind('keydown', keyboardShortcuts.estop, function() {
      socket.emit('stop', true)
    });
  }
  localStorage.setItem('keyboardShortcuts', JSON.stringify(keyboardShortcuts));
}

function keyboardShortcutsEditor() {

  var template = `
  <form id="keyboardAssignmentForm">
    <div class="row mb-1">
      <label class="cell-sm-4">Instructions</label>
      <div class="cell-sm-8">
        Click below to assign a new Keyboard Shortcut / combination to a function. Ctrl, Alt and Shift can be added to create combinations.
      </div>
    </div>
    <div class="row mb-1">
      <label class="cell-sm-4">E-Stop / Abort</label>
      <div class="cell-sm-5">
        <input type="text" class="keyboardshortcutinput" readonly id="stopnewKey" value="` + keyboardShortcuts.estop + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#stopnewKey').addClass('alert').addClass('newKeyAssignment')">
      </div>
    </div>
    <div class="row mb-1">
      <label class="cell-sm-4">Jog X-</label>
      <div class="cell-sm-5">
        <input type="text" class="keyboardshortcutinput" readonly id="xMnewKey" value="` + keyboardShortcuts.xM + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#xMnewKey').addClass('alert').addClass('newKeyAssignment')">
      </div>
    </div>
    <div class="row mb-1">
      <label class="cell-sm-4">Jog X+</label>
      <div class="cell-sm-5">
        <input type="text" class="keyboardshortcutinput" readonly id="xPnewKey" value="` + keyboardShortcuts.xP + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#xPnewKey').addClass('alert').addClass('newKeyAssignment')">
      </div>
    </div>
    <div class="row mb-1">
      <label class="cell-sm-4">Jog Y-</label>
      <div class="cell-sm-5">
        <input type="text" class="keyboardshortcutinput" readonly id="yMnewKey" value="` + keyboardShortcuts.yM + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#yMnewKey').addClass('alert').addClass('newKeyAssignment')">
      </div>
    </div>
    <div class="row mb-1">
      <label class="cell-sm-4">Jog Y+</label>
      <div class="cell-sm-5">
        <input type="text" class="keyboardshortcutinput" readonly id="yPnewKey" value="` + keyboardShortcuts.yP + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#yPnewKey').addClass('alert').addClass('newKeyAssignment')">
      </div>
    </div>
    <div class="row mb-1">
      <label class="cell-sm-4">Jog Z-</label>
      <div class="cell-sm-5">
        <input type="text" class="keyboardshortcutinput" readonly id="zMnewKey" value="` + keyboardShortcuts.zM + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#zMnewKey').addClass('alert').addClass('newKeyAssignment')">
      </div>
    </div>
    <div class="row mb-1">
      <label class="cell-sm-4">Jog Z+</label>
      <div class="cell-sm-5">
        <input type="text" class="keyboardshortcutinput" readonly id="zPnewKey" value="` + keyboardShortcuts.zP + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#zPnewKey').addClass('alert').addClass('newKeyAssignment')">
      </div>
    </div>
    <div class="row mb-1">
      <label class="cell-sm-4">Decrease Step Size</label>
      <div class="cell-sm-5">
        <input type="text" class="keyboardshortcutinput" readonly id="stepMnewKey" value="` + keyboardShortcuts.stepM + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#stepMnewKey').addClass('alert').addClass('newKeyAssignment')">
      </div>
    </div>
    <div class="row mb-1">
      <label class="cell-sm-4">Increase Step Size</label>
      <div class="cell-sm-5">
        <input type="text" class="keyboardshortcutinput" readonly id="stepPnewKey" value="` + keyboardShortcuts.stepP + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#stepPnewKey').addClass('alert').addClass('newKeyAssignment')">
      </div>
    </div>
  </form>`

  Metro.dialog.create({
    title: "Customise Keyboard Shortcuts",
    content: template,
    width: 600,
    actions: [{
        caption: "Save and apply",
        cls: "js-dialog-close success",
        onclick: function() {
          // do something
          keyboardShortcuts.xP = $('#xPnewKey').val()
          keyboardShortcuts.xM = $('#xMnewKey').val()
          keyboardShortcuts.yP = $('#yPnewKey').val()
          keyboardShortcuts.yM = $('#yMnewKey').val()
          keyboardShortcuts.zP = $('#zPnewKey').val()
          keyboardShortcuts.zM = $('#zMnewKey').val()
          keyboardShortcuts.stepP = $('#stepPnewKey').val()
          keyboardShortcuts.stepM = $('#stepMnewKey').val()
          keyboardShortcuts.estop = $('#stopnewKey').val()
          bindKeys()
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {
          // do nothing
        }
      }
    ]
  });
  $('#keyboardAssignmentForm').bind('keydown', null, function(e) {
    console.log(e)
    var newVal = "";
    if (e.altKey) {
      newVal += 'alt+'
    }
    if (e.ctrlKey) {
      newVal += 'ctrl+'
    }
    if (e.shiftKey) {
      newVal += 'shift+'
    }

    if (e.key.toLowerCase() != 'alt' && e.key.toLowerCase() != 'control' && e.key.toLowerCase() != 'shift') {
      // Handle MetroUI naming non-standards of some keys
      if (e.keyCode == 32) {
        newVal += 'space';
      } else if (e.key.toLowerCase() == 'escape') {
        newVal += 'esc';
      } else if (e.key.toLowerCase() == 'arrowleft') {
        newVal += 'left';
      } else if (e.key.toLowerCase() == 'arrowright') {
        newVal += 'right';
      } else if (e.key.toLowerCase() == 'arrowup') {
        newVal += 'up';
      } else if (e.key.toLowerCase() == 'arrowdown') {
        newVal += 'down';
      } else {
        newVal += e.key.toLowerCase();
      }
      $('.newKeyAssignment').val(newVal)
    }

  });

}