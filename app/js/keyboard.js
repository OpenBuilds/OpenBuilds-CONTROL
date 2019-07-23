var keyboardShortcuts = false;

function cancelJog() {
  socket.emit('stop', true)
}

$(document).ready(function() {
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

  $('#jogTypeContinuous').on('click', function() {
    if ($(this).is(':checked')) {
      localStorage.setItem('continuousJog', true);
      allowContinuousJog = true;
      $('.distbtn').hide();
    } else {
      localStorage.setItem('continuousJog', false);
      allowContinuousJog = false;
      $('.distbtn').show();
    }
    // console.log(document.activeElement)
    document.activeElement.blur();
  });


  if (localStorage.getItem('keyboardShortcuts')) {
    keyboardShortcuts = JSON.parse(localStorage.getItem('keyboardShortcuts'));
  } else {
    keyboardShortcuts = {
      xP: "right", //X+
      xM: "left", //X-
      yP: "up", //Y+
      yM: "down", //Y-
      zP: "pageup", //Z+
      zM: "pagedown", //Z-
      stepP: "+", // Increase Step Size
      stepM: "-", // Decrease Step Size
      estop: "esc", // Abort / Emergency
      playpause: "space", // Start, Pause, Resume
      unlockAlarm: "end", // Clear Alarm
      home: "home", // Home All
      setzeroxyz: "insert" // Set ZERO XYZ
    }
  }
  bindKeys()

});


function bindKeys() {
  // Clear all current binds
  $(document).unbind('keydown');
  // console.log("Refreshing Keybindings")

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
    $(document).bind('keydown', keyboardShortcuts.xM, function(event) {
      if (allowContinuousJog) {
        if (!event.originalEvent.repeat) {
          var direction = "X-";
          var feed = $('#jograte').val();
          socket.emit('runCommand', "$J=G91 G21 " + direction + "1000 F" + feed + "\n");
          $('#xM').click();
        }
      } else {
        $('#xM').click();
      }
    });
    $(document).bind('keyup', keyboardShortcuts.xM, function(event) {
      if (allowContinuousJog) {
        cancelJog()
      }
    });
  }
  if (keyboardShortcuts.xP.length) {
    $(document).bind('keydown', keyboardShortcuts.xP, function(event) {
      if (allowContinuousJog) {
        if (!event.originalEvent.repeat) {
          var direction = "X";
          var feed = $('#jograte').val();
          socket.emit('runCommand', "$J=G91 G21 " + direction + "1000 F" + feed + "\n");
          $('#xP').click();
        }
      } else {
        $('#xP').click();
      }

    });
    $(document).bind('keyup', keyboardShortcuts.xP, function(event) {
      if (allowContinuousJog) {
        cancelJog()
      }
    });
  }
  if (keyboardShortcuts.yM.length) {
    $(document).bind('keydown', keyboardShortcuts.yM, function(event) {
      if (allowContinuousJog) {
        if (!event.originalEvent.repeat) {
          var direction = "Y-";
          var feed = $('#jograte').val();
          socket.emit('runCommand', "$J=G91 G21 " + direction + "1000 F" + feed + "\n");
          $('#yM').click();
        }
      } else {
        $('#yM').click();
      }

    });
    $(document).bind('keyup', keyboardShortcuts.yM, function(event) {
      if (allowContinuousJog) {
        cancelJog()
      }
    });
  }
  if (keyboardShortcuts.yP.length) {
    $(document).bind('keydown', keyboardShortcuts.yP, function(event) {
      if (allowContinuousJog) {
        if (!event.originalEvent.repeat) {
          // startJog();
          var direction = "Y";
          var feed = $('#jograte').val();
          socket.emit('runCommand', "$J=G91 G21 " + direction + "1000 F" + feed + "\n");
          $('#yP').click();
        }
      } else {
        $('#yP').click();
      }
    });
    $(document).bind('keyup', keyboardShortcuts.yP, function(event) {
      if (allowContinuousJog) {
        cancelJog()
      }
    });
  }
  if (keyboardShortcuts.zM.length) {
    $(document).bind('keydown', keyboardShortcuts.zM, function(event) {
      if (allowContinuousJog) {
        if (!event.originalEvent.repeat) {
          // startJog();
          var direction = "Z-";
          var feed = $('#jograte').val();
          socket.emit('runCommand', "$J=G91 G21 " + direction + "1000 F" + feed + "\n");
          $('#zM').click();
        }
      } else {
        $('#zM').click();
      }
    });
    $(document).bind('keyup', keyboardShortcuts.zM, function(event) {
      if (allowContinuousJog) {
        cancelJog()
      }
    });
  }
  if (keyboardShortcuts.zP.length) {
    $(document).bind('keydown', keyboardShortcuts.zP, function(event) {
      if (allowContinuousJog) {
        if (!event.originalEvent.repeat) {
          // startJog();
          var direction = "Z";
          var feed = $('#jograte').val();
          socket.emit('runCommand', "$J=G91 G21 " + direction + "1000 F" + feed + "\n");
          $('#zP').click();
        }
      } else {
        $('#zP').click();
      }
    });
    $(document).bind('keyup', keyboardShortcuts.zP, function(event) {
      if (allowContinuousJog) {
        cancelJog()
      }
    });
  }
  if (keyboardShortcuts.stepM.length) {
    $(document).bind('keydown', keyboardShortcuts.stepM, function(e) {
      changeStepSize(-1)
    });
  }
  if (keyboardShortcuts.stepP.length) {
    $(document).bind('keydown', keyboardShortcuts.stepP, function(e) {
      changeStepSize(1)
    });
  }
  if (keyboardShortcuts.estop.length) {
    $(document).bind('keydown', keyboardShortcuts.estop, function(e) {
      socket.emit('stop', false)
    });
  }
  if (keyboardShortcuts.playpause.length) {
    $(document).bind('keydown', keyboardShortcuts.playpause, function(e) {
      if (laststatus.comms.connectionStatus == 1 || laststatus.comms.connectionStatus == 2) {
        socket.emit('runJob', editor.getValue());
      } else if (laststatus.comms.connectionStatus == 3) {
        socket.emit('pause', true);
      } else if (laststatus.comms.connectionStatus == 4) {
        socket.emit('resume', true);
      }
    });
  }
  if (keyboardShortcuts.unlockAlarm.length) {
    $(document).bind('keydown', keyboardShortcuts.unlockAlarm, function(e) {
      Metro.dialog.close($('.closeAlarmBtn').parent().parent());
      socket.emit('clearAlarm', 2);
    });
  }
  if (keyboardShortcuts.home.length) {
    $(document).bind('keydown', keyboardShortcuts.home, function(e) {
      home();
    });
  }
  if (keyboardShortcuts.setzeroxyz.length) {
    $(document).bind('keydown', keyboardShortcuts.setzeroxyz, function(e) {
      sendGcode('G10 P1 L20 X0 Y0 Z0')
    });
  }

  localStorage.setItem('keyboardShortcuts', JSON.stringify(keyboardShortcuts));
}

function keyboardShortcutsEditor() {

  var template = `
  <div class="p-0 m-0" style="overflow-y: auto; height: calc(100vh - 430px);">
    <form id="keyboardAssignmentForm">
      <div class="row mb-1 ml-1 mr-1">
        <div class="cell-sm-12">
          <span class="text-small">Click below to assign a new Keyboard Shortcut / combination to a function. Ctrl, Alt and Shift can be added to create combinations.</span>
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-stop fg-openbuilds fa-fw"></i> Stop / Abort</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="stopnewKey" value="` + keyboardShortcuts.estop + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#stopnewKey').addClass('alert').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-play fg-openbuilds fa-fw"></i> Run / <i class="fas fa-pause fg-openbuilds fa-fw"></i> Pause</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="playPausenewKey" value="` + keyboardShortcuts.playpause + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#playPausenewKey').addClass('alert').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-crosshairs fg-openbuilds fa-fw"></i> Setzero XYZ</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="setzeroxyznewKey" value="` + keyboardShortcuts.setzeroxyz + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#setzeroxyznewKey').addClass('alert').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-bell fg-openbuilds fa-fw"></i> Unlock Alarm</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="unlocknewKey" value="` + keyboardShortcuts.unlockAlarm + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#unlocknewKey').addClass('alert').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-home fg-openbuilds fa-fw"></i> Home</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="homenewKey" value="` + keyboardShortcuts.home + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#homenewKey').addClass('alert').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-arrow-left fg-red fa-fw"></i> Jog X-</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="xMnewKey" value="` + keyboardShortcuts.xM + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#xMnewKey').addClass('alert').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-arrow-right fg-red fa-fw"></i> Jog X+</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="xPnewKey" value="` + keyboardShortcuts.xP + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#xPnewKey').addClass('alert').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-arrow-down fg-green fa-fw"></i> Jog Y-</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="yMnewKey" value="` + keyboardShortcuts.yM + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#yMnewKey').addClass('alert').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-arrow-up fg-green fa-fw"></i> Jog Y+</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="yPnewKey" value="` + keyboardShortcuts.yP + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#yPnewKey').addClass('alert').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-arrow-down fg-blue fa-fw"></i>Jog Z-</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="zMnewKey" value="` + keyboardShortcuts.zM + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#zMnewKey').addClass('alert').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-arrow-up fg-blue fa-fw"></i> Jog Z+</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="zPnewKey" value="` + keyboardShortcuts.zP + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#zPnewKey').addClass('alert').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-minus fg-openbuilds fa-fw"></i> Decrease Step Size<br><span class="text-small">For Incremental Jogging</span></label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="stepMnewKey" value="` + keyboardShortcuts.stepM + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#stepMnewKey').addClass('alert').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-plus fg-openbuilds fa-fw"></i> Increase Step Size<br><span class="text-small">For Incremental Jogging</span></label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="stepPnewKey" value="` + keyboardShortcuts.stepP + `" onclick="$('.keyboardshortcutinput').removeClass('alert').removeClass('newKeyAssignment'); $('#stepPnewKey').addClass('alert').addClass('newKeyAssignment')">
        </div>
      </div>
    </form>
  </div>`

  Metro.dialog.create({
    title: "<i class='far fa-keyboard fa-fw'></i> Customize Keyboard Shortcuts",
    content: template,
    width: 600,
    clsDialog: 'dark',
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
          keyboardShortcuts.playpause = $('#playPausenewKey').val()
          keyboardShortcuts.unlockAlarm = $('#unlocknewKey').val()
          keyboardShortcuts.home = $('#homenewKey').val()
          keyboardShortcuts.setzeroxyz = $('#setzeroxyznewKey').val()
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
    e.preventDefault();
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
