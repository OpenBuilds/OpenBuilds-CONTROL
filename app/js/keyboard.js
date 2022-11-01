var keyboardShortcuts = false;

$(document).ready(function() {

  if (localStorage.getItem('keyboardShortcuts')) {
    keyboardShortcuts = JSON.parse(localStorage.getItem('keyboardShortcuts'));
    // fix incorrect key naming bug from an old version
    if (keyboardShortcuts.xP == "arrowright") {
      keyboardShortcuts.xP == "right"
    }
    // add new key defaults to existing allocations
    if (!keyboardShortcuts.incJogMode) {
      keyboardShortcuts.incJogMode = "/"
    }
    if (!keyboardShortcuts.conJogMode) {
      keyboardShortcuts.conJogMode = "*"
    }
    if (!keyboardShortcuts.gotozeroxyz) {
      keyboardShortcuts.gotozeroxyz = "del"
    }
    // add new key defaults to existing allocations (1.0.257 and older)
    if (!keyboardShortcuts.froInc) {
      keyboardShortcuts.froInc = "q"
    }
    if (!keyboardShortcuts.froDec) {
      keyboardShortcuts.froDec = "a"
    }
    if (!keyboardShortcuts.toInc) {
      keyboardShortcuts.toInc = "w"
    }
    if (!keyboardShortcuts.jogSpeedM) {
      keyboardShortcuts.jogSpeedM = "0"
    }
    if (!keyboardShortcuts.jogSpeedP) {
      keyboardShortcuts.jogSpeedP = "."
    }
    if (!keyboardShortcuts.aM) {
      keyboardShortcuts.aM = "1"
    }
    if (!keyboardShortcuts.aP) {
      keyboardShortcuts.aP = "2"
    }



  } else {
    keyboardShortcuts = {
      xP: "right", //X+
      xM: "left", //X-
      yP: "up", //Y+
      yM: "down", //Y-
      zP: "pageup", //Z+
      zM: "pagedown", //Z-
      aP: "2", //A+
      aM: "1", //A-
      stepP: "+", // Increase Step Size
      stepM: "-", // Decrease Step Size
      estop: "esc", // Abort / Emergency
      playpause: "space", // Start, Pause, Resume
      unlockAlarm: "end", // Clear Alarm
      home: "home", // Home All
      setzeroxyz: "insert", // Set ZERO XYZ
      gotozeroxyz: "del", // go to zero xyz
      incJogMode: "/", // Incremental Jog Mode
      conJogMode: "*", // Continuous Jog Mode
      froInc: "", // Increase Feedrate Override
      froDec: "", // Decrease Feedrate Override
      toInc: "", // Increase Tool Speed Override
      toDec: "", // Decrease Tool Speed Override
      jogSpeedM: "0", // Increase Step Size
      jogSpeedP: ".", // Decrease Step Size
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
    if (evt.which === 116) {
      // F5 - reload interface
      evt.preventDefault();
      location.reload();
    } else if (evt.which === 117) {
      // F6 - switch to serial console and focus on Console Input
      evt.preventDefault();
      $("#controlTab").click();
      $("#consoletab").click();
      $("#command").focus();
    } else if (evt.which === 112) {
      // F1 - troubleshooting
      evt.preventDefault();
      $("#troubleshootingTab").click();
    }
  });

  // Bind for Macro keys

  if (buttonsarray && buttonsarray.length > 0) {
    for (i = 0; i < buttonsarray.length; i++) {
      if (buttonsarray[i].macrokeyboardshortcut && buttonsarray[i].macrokeyboardshortcut.length) {
        $(document).bind('keydown', buttonsarray[i].macrokeyboardshortcut, function(e) {
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
          newVal += e.key
          newVal = newVal.toLowerCase();
          var macro = searchMacro("macrokeyboardshortcut", newVal, buttonsarray)
          console.log(macro)
          if (macro && macro.codetype == "gcode") {
            sendGcode(macro.gcode); // TODO change to runMacro with JS
          } else if (macro && macro.codetype == "javascript") {
            if (!macro.jsrunonstartup) {
              executeJS(macro.javascript)
            } else {
              var toast = Metro.toast.create;
              toast("Macro: <b>" + macro.title + "</b> is an autorun macro, it runs when CONTROL starts. You cannot run it using the button. You can edit or delete it using the <i class='fas fa-cogs'></i> Edit Macro tool", null, 3000, "bg-darkRed fg-white")
            }
          } else {
            printLog("<span class='fg-red'>[ ERROR ]</span>  <span class='fg-red'>Macro not found for " + newVal + "</span>")
          }
        });
      }
    }
  }

  // Bind for Jog and Control Buttons

  // JOG KEYS
  if (keyboardShortcuts) {
    if (keyboardShortcuts.xM.length) {
      $(document).bind('keydown', keyboardShortcuts.xM, function(event) {
        event.preventDefault();
        if (!event.originalEvent.repeat) {
          rippleEffect($('.xM'), "#e21b1b")
          $('#xM').mousedown();
        }
      });
      $(document).bind('keyup', keyboardShortcuts.xM, function(event) {
        event.preventDefault();
        $('#xM').mouseup();
      });
    }

    if (keyboardShortcuts.xP.length) {
      $(document).bind('keydown', keyboardShortcuts.xP, function(event) {
        event.preventDefault();
        if (!event.originalEvent.repeat) {
          rippleEffect($('.xP'), "#e21b1b")
          $('#xP').mousedown();
        }
      });

      $(document).bind('keyup', keyboardShortcuts.xP, function(event) {
        event.preventDefault();
        $('#xP').mouseup();
      });
    }
    if (keyboardShortcuts.yM.length) {
      $(document).bind('keydown', keyboardShortcuts.yM, function(event) {
        event.preventDefault();
        if (!event.originalEvent.repeat) {
          rippleEffect($('.yM'), "#5de21b")
          $('#yM').mousedown();
        }
      });

      $(document).bind('keyup', keyboardShortcuts.yM, function(event) {
        event.preventDefault();
        $('#yM').mouseup();
      });
    }
    if (keyboardShortcuts.yP.length) {
      $(document).bind('keydown', keyboardShortcuts.yP, function(event) {
        event.preventDefault();
        if (!event.originalEvent.repeat) {
          rippleEffect($('.yP'), "#5de21b")
          $('#yP').mousedown();
        }
      });
      $(document).bind('keyup', keyboardShortcuts.yP, function(event) {
        event.preventDefault();
        $('#yP').mouseup();

      });
    }
    if (keyboardShortcuts.zM.length) {
      $(document).bind('keydown', keyboardShortcuts.zM, function(event) {
        event.preventDefault();
        if (!event.originalEvent.repeat) {
          rippleEffect($('.zM'), "#1ba1e2")
          $('#zM').mousedown();
        }
      });
      $(document).bind('keyup', keyboardShortcuts.zM, function(event) {
        event.preventDefault();
        $('#zM').mouseup();
      });
    }
    if (keyboardShortcuts.zP.length) {
      $(document).bind('keydown', keyboardShortcuts.zP, function(event) {
        event.preventDefault();
        if (!event.originalEvent.repeat) {
          rippleEffect($('.zP'), "#1ba1e2")
          $('#zP').mousedown();
        }
      });
      $(document).bind('keyup', keyboardShortcuts.zP, function(event) {
        event.preventDefault();
        $('#zP').mouseup();
      });
    }

    if (keyboardShortcuts.aM.length) {
      $(document).bind('keydown', keyboardShortcuts.aM, function(event) {
        event.preventDefault();
        if (!event.originalEvent.repeat) {
          rippleEffect($('.aM'), "#fa6800")
          $('#aM').mousedown();
        }
      });
      $(document).bind('keyup', keyboardShortcuts.aM, function(event) {
        event.preventDefault();
        $('#aM').mouseup();
      });
    }
    if (keyboardShortcuts.aP.length) {
      $(document).bind('keydown', keyboardShortcuts.aP, function(event) {
        event.preventDefault();
        if (!event.originalEvent.repeat) {
          rippleEffect($('.aP'), "#fa6800")
          $('#aP').mousedown();
        }
      });
      $(document).bind('keyup', keyboardShortcuts.aP, function(event) {
        event.preventDefault();
        $('#aP').mouseup();
      });
    }
    // END JOG KEYS

    if (keyboardShortcuts.stepM.length) {
      $(document).bind('keydown', keyboardShortcuts.stepM, function(e) {
        e.preventDefault();
        $('#jogTypeContinuous').prop('checked', false)
        allowContinuousJog = false;
        $('.distbtn').show();
        changeStepSize(-1)
      });
    }
    if (keyboardShortcuts.stepP.length) {
      $(document).bind('keydown', keyboardShortcuts.stepP, function(e) {
        e.preventDefault();
        $('#jogTypeContinuous').prop('checked', false)
        allowContinuousJog = false;
        $('.distbtn').show();
        changeStepSize(1)
      });
    }
    if (keyboardShortcuts.estop.length) {
      $(document).bind('keydown', keyboardShortcuts.estop, function(e) {
        e.preventDefault();
        socket.emit('stop', {
          stop: false,
          jog: false,
          abort: true
        })
      });
    }
    if (keyboardShortcuts.playpause.length) {
      $(document).bind('keydown', keyboardShortcuts.playpause, function(e) {
        e.preventDefault();
        if (laststatus.comms.connectionStatus == 1 || laststatus.comms.connectionStatus == 2) {
          socket.emit('runJob', {
            data: editor.getValue(),
            isJob: true,
            fileName: ""
          });
        } else if (laststatus.comms.connectionStatus == 3) {
          socket.emit('pause', true);
        } else if (laststatus.comms.connectionStatus == 4) {
          socket.emit('resume', true);
        }
      });
    }
    if (keyboardShortcuts.unlockAlarm.length) {
      $(document).bind('keydown', keyboardShortcuts.unlockAlarm, function(e) {
        e.preventDefault();
        Metro.dialog.close($('.closeAlarmBtn').parent().parent());
        socket.emit('clearAlarm', 2);
      });
    }
    if (keyboardShortcuts.home.length) {
      $(document).bind('keydown', keyboardShortcuts.home, function(e) {
        e.preventDefault();
        home();
      });
    }
    if (keyboardShortcuts.setzeroxyz.length) {
      $(document).bind('keydown', keyboardShortcuts.setzeroxyz, function(e) {
        e.preventDefault();
        sendGcode('G10 P0 L20 X0 Y0 Z0')
      });
    }

    if (keyboardShortcuts.gotozeroxyz.length) {
      $(document).bind('keydown', keyboardShortcuts.gotozeroxyz, function(e) {
        e.preventDefault();
        sendGcode('G21 G90');
        sendGcode('G0 Z5');
        sendGcode('G0 X0 Y0');
        sendGcode('G0 Z0');
      });
    }

    if (keyboardShortcuts.incJogMode.length) {
      $(document).bind('keydown', keyboardShortcuts.incJogMode, function(e) {
        e.preventDefault();
        localStorage.setItem('continuousJog', false);
        $('#jogTypeContinuous').prop('checked', false)
        allowContinuousJog = false;
        $('.distbtn').show();
      });
    }

    if (keyboardShortcuts.conJogMode.length) {
      $(document).bind('keydown', keyboardShortcuts.conJogMode, function(e) {
        e.preventDefault();
        localStorage.setItem('continuousJog', true);
        $('#jogTypeContinuous').prop('checked', true)
        allowContinuousJog = true;
        $('.distbtn').hide()
      });
    }

    // froInc: "", // Increase Feedrate Override
    // froDec: "", // Decrease Feedrate Override
    // toInc: "", // Increase Tool Speed Override
    // toDec: "" // Decrease Tool Speed Override
    if (keyboardShortcuts.froInc.length) {
      $(document).bind('keydown', keyboardShortcuts.froInc, function(e) {
        e.preventDefault();
        var newfeed = laststatus.machine.overrides.feedOverride + 10
        feedOverride(newfeed)
      });
    }

    if (keyboardShortcuts.froDec.length) {
      $(document).bind('keydown', keyboardShortcuts.froDec, function(e) {
        e.preventDefault();
        var newfeed = laststatus.machine.overrides.feedOverride - 10
        feedOverride(newfeed)
      });
    }

    if (keyboardShortcuts.toInc.length) {
      $(document).bind('keydown', keyboardShortcuts.toInc, function(e) {
        e.preventDefault();
        var newspeed = laststatus.machine.overrides.spindleOverride + 10
        spindleOverride(newspeed)
      });
    }

    if (keyboardShortcuts.toDec.length) {
      $(document).bind('keydown', keyboardShortcuts.toDec, function(e) {
        e.preventDefault();
        var newspeed = laststatus.machine.overrides.spindleOverride - 10
        spindleOverride(newspeed)
      });
    }

    if (keyboardShortcuts.jogSpeedM.length) {
      $(document).bind('keydown', keyboardShortcuts.jogSpeedM, function(e) {
        e.preventDefault();
        var currentJogOverride = $('#jro').data('slider').val();
        var newVal = currentJogOverride - 10
        if (newVal < 10) {
          newVal = 10;
        }
        jogOverride(newVal)
      });
    }

    if (keyboardShortcuts.jogSpeedP.length) {
      $(document).bind('keydown', keyboardShortcuts.jogSpeedP, function(e) {
        e.preventDefault();
        var currentJogOverride = $('#jro').data('slider').val();
        var newVal = currentJogOverride + 10
        if (newVal > 100) {
          newVal = 100;
        }
        jogOverride(newVal)
        // spindleOverride(newspeed)
      });
    }


    localStorage.setItem('keyboardShortcuts', JSON.stringify(keyboardShortcuts));
  }

}

function keyboardShortcutsEditor() {

  var template = `
  <span class="text-small fg-red" id="alreadyAssignedWarnShortcut" style="display: none;"></span>
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
          <input type="text" class="keyboardshortcutinput" readonly id="stopnewKey" value="` + keyboardShortcuts.estop + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#stopnewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-play fg-openbuilds fa-fw"></i> Run / <i class="fas fa-pause fg-openbuilds fa-fw"></i> Pause</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="playPausenewKey" value="` + keyboardShortcuts.playpause + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#playPausenewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-crosshairs fg-openbuilds fa-fw"></i> Setzero XYZ</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="setzeroxyznewKey" value="` + keyboardShortcuts.setzeroxyz + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#setzeroxyznewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-chart-line fg-openbuilds fa-fw"></i> Goto XYZ Zero</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="gotozeroxyznewKey" value="` + keyboardShortcuts.gotozeroxyz + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#gotozeroxyznewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-bell fg-openbuilds fa-fw"></i> Unlock Alarm</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="unlocknewKey" value="` + keyboardShortcuts.unlockAlarm + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#unlocknewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-home fg-openbuilds fa-fw"></i> Home</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="homenewKey"  value="` + keyboardShortcuts.home + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#homenewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-arrow-left fg-red fa-fw"></i> Jog X-</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="xMnewKey"  value="` + keyboardShortcuts.xM + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#xMnewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-arrow-right fg-red fa-fw"></i> Jog X+</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="xPnewKey" value="` + keyboardShortcuts.xP + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#xPnewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-arrow-down fg-green fa-fw"></i> Jog Y-</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="yMnewKey" value="` + keyboardShortcuts.yM + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#yMnewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-arrow-up fg-green fa-fw"></i> Jog Y+</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="yPnewKey" value="` + keyboardShortcuts.yP + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#yPnewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-arrow-down fg-blue fa-fw"></i>Jog Z-</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="zMnewKey" value="` + keyboardShortcuts.zM + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#zMnewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-arrow-up fg-blue fa-fw"></i> Jog Z+</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="zPnewKey" value="` + keyboardShortcuts.zP + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#zPnewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-undo fg-orange fa-fw"></i> Jog A-</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="aMnewKey" value="` + keyboardShortcuts.aM + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#aMnewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-redo fg-orange fa-fw"></i> Jog A+</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="aPnewKey" value="` + keyboardShortcuts.aP + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#aPnewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-minus fg-openbuilds fa-fw"></i> Decrease Step Size<br><span class="text-small">For Incremental Jogging</span></label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="stepMnewKey" value="` + keyboardShortcuts.stepM + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#stepMnewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-plus fg-openbuilds fa-fw"></i> Increase Step Size<br><span class="text-small">For Incremental Jogging</span></label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="stepPnewKey" value="` + keyboardShortcuts.stepP + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#stepPnewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>

      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-fast-backward fg-openbuilds fa-fw"></i> Decrease Jog Speed</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="jogSpeedMnewKey" value="` + keyboardShortcuts.jogSpeedM + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#jogSpeedMnewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-fast-forward fg-openbuilds fa-fw"></i> Increase Jog Speed</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="jogSpeedPnewKey" value="` + keyboardShortcuts.jogSpeedP + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#jogSpeedPnewKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>

      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-step-forward fg-openbuilds fa-fw"></i> Incremental Jog Mode<br></label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="incJogModeKey" value="` + keyboardShortcuts.incJogMode + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#incJogModeKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>
      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-running fg-openbuilds fa-fw"></i> Continuous Jog Mode<br></label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="conJogModeKey" value="` + keyboardShortcuts.conJogMode + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#conJogModeKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>

      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-level-up-alt fg-openbuilds fa-fw"></i> Increase Feed Override<br></label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="froIncKey" value="` + keyboardShortcuts.froInc + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#froIncKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>

      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="fas fa-level-down-alt fg-openbuilds fa-fw"></i> Decrease Feed Override<br></label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="froDecKey" value="` + keyboardShortcuts.froDec + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#froDecKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>

      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="far fa-hand-point-up fg-openbuilds fa-fw"></i> Increase Tool Override<br></label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="toIncKey" value="` + keyboardShortcuts.toInc + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#toIncKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>

      <div class="row mb-1 ml-1 mr-1">
        <label class="cell-sm-6"><i class="far fa-hand-point-down fg-openbuilds fa-fw"></i>  Decrease Tool Override<br></label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly id="toDecKey" value="` + keyboardShortcuts.toDec + `" onclick="$('.keyboardshortcutinput').removeClass('primary').removeClass('newKeyAssignment'); $('#toDecKey').addClass('primary').addClass('newKeyAssignment')">
        </div>
      </div>


    </form>

  </div>`

  Metro.dialog.create({
    title: "<i class='far fa-keyboard fa-fw'></i> Customize Keyboard Shortcuts",
    toTop: true,
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
          keyboardShortcuts.aP = $('#aPnewKey').val()
          keyboardShortcuts.aM = $('#aMnewKey').val()
          keyboardShortcuts.stepP = $('#stepPnewKey').val()
          keyboardShortcuts.stepM = $('#stepMnewKey').val()

          keyboardShortcuts.jogSpeedP = $('#jogSpeedPnewKey').val()
          keyboardShortcuts.jogSpeedM = $('#jogSpeedMnewKey').val()

          keyboardShortcuts.estop = $('#stopnewKey').val()
          keyboardShortcuts.playpause = $('#playPausenewKey').val()
          keyboardShortcuts.unlockAlarm = $('#unlocknewKey').val()
          keyboardShortcuts.home = $('#homenewKey').val()
          keyboardShortcuts.setzeroxyz = $('#setzeroxyznewKey').val()
          keyboardShortcuts.incJogMode = $("#incJogModeKey").val()
          keyboardShortcuts.conJogMode = $("#conJogModeKey").val()
          keyboardShortcuts.gotozeroxyz = $("#gotozeroxyznewKey").val()


          keyboardShortcuts.froInc = $("#froIncKey").val()
          keyboardShortcuts.froDec = $("#froDecKey").val()
          keyboardShortcuts.toInc = $("#toIncKey").val()
          keyboardShortcuts.toDec = $("#toDecKey").val()
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
      } else if (e.key.toLowerCase() == 'delete') {
        newVal += 'del';
      } else {
        newVal += e.key.toLowerCase();
      }
      var inUse = keyInUse(newVal).inUse;
      if ($('.newKeyAssignment').val() == newVal) {
        $('#alreadyAssignedWarnShortcut').hide();
        $('.newKeyAssignment').removeClass('alert').addClass('primary')
      } else {
        if (inUse) {
          console.log(newVal + " is already in use")
          $('#alreadyAssignedWarnShortcut').show();
          $('#alreadyAssignedWarnShortcut').appendTo($('.newKeyAssignment').parent());
          $('.newKeyAssignment').removeClass('primary').addClass('alert')
          $('#alreadyAssignedWarnShortcut').html("\"" + newVal + "\" is already assigned to " + keyInUse(newVal).source);
        } else {
          $('#alreadyAssignedWarnShortcut').hide();
          $('.newKeyAssignment').removeClass('alert').addClass('primary')
          $('.newKeyAssignment').val(newVal)
        }
      }


    }

  });

}

function keyInUse(newVal) {
  var inUse = false;
  var usedBy = false;

  // Check currently saved Keyboard Shortcuts
  for (const prop in keyboardShortcuts) {
    if (`${keyboardShortcuts[prop]}` == newVal) {
      inUse = true;
      usedBy = "keyboard:" + prop
    }
  }

  // Check Internally hardcoded keys
  if (newVal == "f1") {
    inUse = true;
    usedBy = "internal:troubleshooting";
  }
  if (newVal == "f5") {
    inUse = true;
    usedBy = "internal:refresh";
  }
  if (newVal == "f6") {
    inUse = true;
    usedBy = "internal:console";
  }

  // Check currently assigned Macros
  for (i = 0; i < buttonsarray.length; i++) {
    if (newVal == buttonsarray[i].macrokeyboardshortcut) {
      inUse = true;
      usedBy = "macro:" + buttonsarray[i].title;
    }
  }

  // Check currently edited in keys, not saved yet
  for (i = 0; i < $(".keyboardshortcutinput").length; i++) {
    if ($(".keyboardshortcutinput")[i].value == newVal) {
      inUse = true;
      usedBy = "keyboard:" + $("#" + $(".keyboardshortcutinput")[i].id).parent().siblings().html().trim();
    }
  }

  return {
    inUse: inUse,
    source: usedBy
  };
}