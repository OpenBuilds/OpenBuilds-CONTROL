"use strict";

var keyboardShortcuts = {};
var newKeyAssignment = undefined;

const keyboardActions = [
  { // X+
    name: "xP",
    label: `<i class="fas fa-arrow-right fg-red fa-fw"></i> Jog X+`,
    defaultKey: "right",
    keydown: (event) => { jogKeyDown(event, "xP") },
    keyup: (event) => { jogKeyUp(event, "xP") },
  },

  { // X-
    name: "xM",
    label: `<i class="fas fa-arrow-left fg-red fa-fw"></i> Jog X-`,
    defaultKey: "left",
    keydown: (event) => { jogKeyDown(event, "xM") },
    keyup: (event) => { jogKeyUp(event, "xM") },
  },

  { // Y+
    name: "yP",
    label: `<i class="fas fa-arrow-up fg-green fa-fw"></i> Jog Y+`,
    defaultKey: "up",
    keydown: (event) => { jogKeyDown(event, "yP") },
    keyup: (event) => { jogKeyUp(event, "yP") },
  },

  { // Y-
    name: "yM",
    label: `<i class="fas fa-arrow-down fg-green fa-fw"></i> Jog Y-`,
    defaultKey: "down",
    keydown: (event) => { jogKeyDown(event, "yM") },
    keyup: (event) => { jogKeyUp(event, "yM") },
  },

  { // Z+
    name: "zP",
    label: `<i class="fas fa-arrow-up fg-blue fa-fw"></i> Jog Z+`,
    defaultKey: "pageup",
    keydown: (event) => { jogKeyDown(event, "zP") },
    keyup: (event) => { jogKeyUp(event, "zP") },
  },

  { // Z-
    name: "zM",
    label: `<i class="fas fa-arrow-down fg-blue fa-fw"></i>Jog Z-`,
    defaultKey: "pagedown",
    keydown: (event) => { jogKeyDown(event, "zM") },
    keyup: (event) => { jogKeyUp(event, "zM") },
  },

  { // A+
    name: "aP",
    label: `<i class="fas fa-redo fg-orange fa-fw"></i> Jog A+`,
    defaultKey: "2",
    keydown: (event) => { jogKeyDown(event, "aP") },
    keyup: (event) => { jogKeyUp(event, "aP") },
  },

  { // A-
    name: "aM",
    label: `<i class="fas fa-undo fg-orange fa-fw"></i> Jog A-`,
    defaultKey: "1",
    keydown: (event) => { jogKeyDown(event, "aM") },
    keyup: (event) => { jogKeyUp(event, "aM") },
  },

  { // Increase Step Size
    name: "stepP",
    label: `<i class="fas fa-plus fg-openbuilds fa-fw"></i> Increase Step Size<br><span class="text-small">For Incremental Jogging</span>`,
    defaultKey: "+",
    keydown: (event) => { jogStepSize(event, 1); },
  },

  { // Decrease Step Size
    name: "stepM",
    label: `<i class="fas fa-minus fg-openbuilds fa-fw"></i> Decrease Step Size<br><span class="text-small">For Incremental Jogging</span>`,
    defaultKey: "-",
    keydown: (event) => { jogStepSize(event, -1); },
  },

  { // Increase Step Size
    name: "jogSpeedM",
    label: `<i class="fas fa-fast-forward fg-openbuilds fa-fw"></i> Increase Jog Speed`,
    defaultKey: "0",
    keydown: (event) => {
      event.preventDefault();
      const currentJogOverride = $('#jro').data('slider').val();
      jogOverride(Math.max(currentJogOverride - 10, 10));
    },
  },

  { // Decrease Step Size
    name: "jogSpeedP",
    label: `<i class="fas fa-fast-backward fg-openbuilds fa-fw"></i> Decrease Jog Speed`,
    defaultKey: ".",
    keydown: (event) => {
      event.preventDefault();
      const currentJogOverride = $('#jro').data('slider').val();
      jogOverride(Math.min(currentJogOverride + 10, 100))
    },
  },

  { // Incremental Jog Mode
    name: "incJogMode",
    label: `<i class="fas fa-step-forward fg-openbuilds fa-fw"></i> Incremental Jog Mode`,
    defaultKey: "/",
    keydown: (event) => { jogSetContinuous(event, false); },
  },

  { // Continuous Jog Mode
    name: "conJogMode",
    label: `<i class="fas fa-running fg-openbuilds fa-fw"></i> Continuous Jog Mode`,
    defaultKey: "*",
    keydown: (event) => { jogSetContinuous(event, true); },
  },

  { // Abort / Emergency
    name: "estop",
    label: `<i class="fas fa-stop fg-openbuilds fa-fw"></i> Stop / Abort`,
    defaultKey: "esc",
    keydown: (event) => {
      event.preventDefault();
      socket.emit('stop', {stop: false, jog: false, abort: true});
    },
  },

  { // Start, Pause, Resume
    name: "playpause",
    label: `<i class="fas fa-play fg-openbuilds fa-fw"></i> Run / <i class="fas fa-pause fg-openbuilds fa-fw"></i> Pause`,
    defaultKey: "space",
    keydown: (event) => {
      event.preventDefault();
      if (laststatus.comms.connectionStatus == 2) {
        runJobFile();
      } else if (laststatus.comms.connectionStatus == 3) {
        socket.emit('pause', true);
      } else if (laststatus.comms.connectionStatus == 4) {
        socket.emit('resume', true);
      }
    },
  },

  { // Clear Alarm
    name: "unlockAlarm",
    label: `<i class="fas fa-bell fg-openbuilds fa-fw"></i> Unlock Alarm`,
    defaultKey: "end",
    keydown: (event) => {
      event.preventDefault();
      Metro.dialog.close($('.closeAlarmBtn').parent().parent());
      socket.emit('clearAlarm', 2);
    },
  },

  { // Home All
    name: "home",
    label: `<i class="fas fa-home fg-openbuilds fa-fw"></i> Home`,
    defaultKey: "home",
    keydown: (event) => {
      event.preventDefault();
      home();
    },
  },

  { // Set zero XYZ
    name: "setzeroxyz",
    label: `<i class="fas fa-crosshairs fg-openbuilds fa-fw"></i> Setzero XYZ`,
    defaultKey: "insert",
    keydown: (event) => {
      event.preventDefault();
      captureWcsHistory('Before <b>Set Zero XYZ</b>');
      sendGcode('G10 P0 L20 X0 Y0 Z0');
    },
  },

  { // Go to zero XYZ
    name: "gotozeroxyz",
    label: `<i class="fas fa-chart-line fg-openbuilds fa-fw"></i> Goto XYZ Zero`,
    defaultKey: "del",
    keydown: (event) => {
      event.preventDefault();
      sendGcode('G0 G21 G90');
      sendGcode('G0 Z5');
      sendGcode('G0 X0 Y0');
      sendGcode('G0 Z0');
    },
  },

  { // Increase Feedrate Override
    name: "froInc",
    label: `<i class="fas fa-level-up-alt fg-openbuilds fa-fw"></i> Increase Feed Override`,
    defaultKey: "q",
    keydown: (event) => {
      event.preventDefault();
      feedOverride(laststatus.machine.overrides.feedOverride + 10);
    },
  },

  { // Decrease Feedrate Override
    name: "froDec",
    label: `<i class="fas fa-level-down-alt fg-openbuilds fa-fw"></i> Decrease Feed Override`,
    defaultKey: "a",
    keydown: (event) => {
      event.preventDefault();
      feedOverride(laststatus.machine.overrides.feedOverride - 10);
    },
  },

  { // Increase Tool Speed Override
    name: "toInc",
    label: `<i class="far fa-hand-point-up fg-openbuilds fa-fw"></i> Increase Tool Override`,
    defaultKey: "w",
    keydown: (event) => {
      event.preventDefault();
      spindleOverride(laststatus.machine.overrides.spindleOverride + 10);
    },
  },

  { // Decrease Tool Speed Override
    name: "toDec",
    label: `<i class="far fa-hand-point-down fg-openbuilds fa-fw"></i> Decrease Tool Override`,
    defaultKey: "s",
    keydown: (event) => {
      event.preventDefault();
      spindleOverride(laststatus.machine.overrides.spindleOverride - 10);
    },
  },

  { // Open File
    name: "openFile",
    label: `<i class="fas fa-folder-open fg-openbuilds fa-fw"></i> Open File`,
    defaultKey: "ctrl+o",
    keydown: (event) => {
      event.preventDefault();
      loadJobFile();
    },
  },
];

function keyboardDocReady() {
  for (const action of keyboardActions) {
    keyboardShortcuts[action.name] = action.defaultKey;
  }

  if (localStorage.getItem('keyboardShortcuts')) {
    let settings = JSON.parse(localStorage.getItem('keyboardShortcuts'));
    for (const action of keyboardActions) {
      if (settings[action.name] != undefined) {
        keyboardShortcuts[action.name] = settings[action.name];
      }
    }
  }

  bindKeys();
}

function jogKeyDown(event, name) {
  event.preventDefault();
  if (!event.originalEvent.repeat) {
    $('#' + name).mousedown();
  }
}

function jogKeyUp(event, name) {
  event.preventDefault();
  $('#' + name).mouseup();
}

function jogStepSize(event, dir) {
  event.preventDefault();
  $('#jogTypeContinuous').prop('checked', false);
  allowContinuousJog = false;
  $('.distbtn').show();
  changeStepSize(dir);
}

function jogSetContinuous(event, state) {
  event.preventDefault();
  localStorage.setItem('continuousJog', state);
  $('#jogTypeContinuous').prop('checked', state);
  allowContinuousJog = state;
  $('.distbtn').hide();
}


function bindKeys() {
  // Clear all current binds
  $(document).unbind('keydown');

  // Remove Keyboard Bindings from Override Sliders
  $("#jrocell").find(".marker").unbind(Metro.events.keydown);
  $("#trocell").find(".marker").unbind(Metro.events.keydown);
  $("#frocell").find(".marker").unbind(Metro.events.keydown);
  $("#jrocell").find(".marker").unbind(Metro.events.keyup);
  $("#trocell").find(".marker").unbind(Metro.events.keyup);
  $("#frocell").find(".marker").unbind(Metro.events.keyup);

  // Bind for Electron Devtools
  document.addEventListener('keydown', function(event) {

    // Remove focus from sliders before executing keyboard shortcuts
    $('#jrocell').focusout();
    $('#trocell').focusout();
    $('#frocell').focusout();

    if (event.which === 116) {
      // F5 - reload interface
      event.preventDefault();
      location.reload();
    } else if (event.which === 117) {
      // F6 - switch to serial console and focus on Console Input
      event.preventDefault();
      $("#controlTab").click();
      $("#consoletab").click();
      $("#command").focus();
    } else if (event.which === 112) {
      // F1 - troubleshooting
      event.preventDefault();
      $("#troubleshootingTab").click();
    }
  });

  // Bind for Action keys
  for (const action of keyboardActions) {
    const key = keyboardShortcuts[action.name];
    if (key && key != "") {
      if (action.keydown) {
        $(document).bind('keydown', key, action.keydown);
      }
      if (action.keyup) {
        $(document).bind('keyup', key, action.keyup);
      }
    }
  }

  // Bind for Macro keys
  for (const macro of buttonsarray) {
    if (macro.macrokeyboardshortcut && macro.macrokeyboardshortcut.length > 0) {
      $(document).bind('keydown', macro.macrokeyboardshortcut, function(event) {
        event.preventDefault();
        if (macro.codetype == "gcode") {
          sendGcode(macro.gcode);
        } else if (macro.codetype == "javascript") {
          if (!macro.jsrunonstartup) {
            executeJS(macro.javascript);
          } else {
            Metro.toast.create("Macro: <b>" + macro.title + "</b> is an autorun macro, it runs when CONTROL starts. You cannot run it using the button. You can edit or delete it using the <i class='fas fa-cogs'></i> Edit Macro tool", null, 3000, "bg-darkRed fg-white")
          }
        }
      });
    }
  }

  localStorage.setItem('keyboardShortcuts', JSON.stringify(keyboardShortcuts));
}

function onShortcutInputClick(id)
{
  const input = $('#' + id);
  if (newKeyAssignment == undefined || input[0] != newKeyAssignment[0]) {
    if (newKeyAssignment != undefined) {
      $('#alreadyAssignedWarnShortcut').hide();
      newKeyAssignment.removeClass('primary').removeClass('alert');
    }

    input.addClass('primary');
    newKeyAssignment = input;
  }
}

function onShortcutInputChange()
{
  if (newKeyAssignment != undefined && newKeyAssignment.val() == "") {
    $('#alreadyAssignedWarnShortcut').hide();
    newKeyAssignment.removeClass('alert');
  }
}

function keyNameFromDownEvent(event) {
  let keyName = "";
  if (event.altKey) {
    keyName += 'alt+'
  }
  if (event.ctrlKey) {
    keyName += 'ctrl+'
  }
  if (event.shiftKey) {
    keyName += 'shift+'
  }

  let keyLower = event.key.toLowerCase();
  if (keyLower != 'alt' && keyLower != 'control' && keyLower != 'shift') {
    // Handle MetroUI naming non-standards of some keys
    if (event.keyCode == 32) {
      keyName += 'space';
    } else if (keyLower == 'escape') {
      keyName += 'esc';
    } else if (keyLower == 'arrowleft') {
      keyName += 'left';
    } else if (keyLower == 'arrowright') {
      keyName += 'right';
    } else if (keyLower == 'arrowup') {
      keyName += 'up';
    } else if (keyLower == 'arrowdown') {
      keyName += 'down';
    } else if (keyLower == 'delete') {
      keyName += 'del';
    } else {
      keyName += keyLower;
    }
    return keyName;
  }

  return "";
}

function keyInUse(newVal, forMacro) {
  let inUse = false;
  let usedBy = false;

  // Check Internally hardcoded keys
  if (newVal == "f1") {
    inUse = true;
    usedBy = "internal:troubleshooting";
  }
  else if (newVal == "f5") {
    inUse = true;
    usedBy = "internal:refresh";
  }
  else if (newVal == "f6") {
    inUse = true;
    usedBy = "internal:console";
  }

  // Check currently assigned Macros
  for (const macro of buttonsarray) {
    if (newVal == macro.macrokeyboardshortcut) {
      inUse = true;
      usedBy = "macro:" + macro.title;
    }
  }

  if (forMacro) {
    // Check currently saved Keyboard Shortcuts
    for (const prop in keyboardShortcuts) {
      if (keyboardShortcuts[prop] == newVal) {
        inUse = true;
        usedBy = "keyboard:" + prop;
        break;
      }
    }
  }
  else {
  // Check currently edited in keys, not saved yet
    for (let input of $(".keyboardshortcutinput > input")) {
      if (input.value == newVal) {
        inUse = true;
        usedBy = "keyboard:" + $("#" + input.id).parent().parent().siblings().html().trim();
        break;
      }
    }
  }

  return {
    inUse: inUse,
    source: usedBy
  };
}

function keyboardShortcutsEditor() {

  newKeyAssignment = undefined;

  let template = `
  <span class="text-small fg-red" id="alreadyAssignedWarnShortcut" style="display: none;"></span>
  <span class="text-small">Click below to assign a new Keyboard Shortcut to each action.<br>Ctrl, Alt and Shift can be added to create combinations.</span>
  <div class="p-0 mt-2" style="overflow-y:auto; height:430px;">
    <form id="keyboardAssignmentForm" style="padding:2px 0px;">`;

  for (const action of keyboardActions) {
    template += `
      <div class="row mt-1 ml-1 mr-1">
        <label class="cell-sm-6" style="margin-top:4px">` + action.label + `</label>
        <div class="cell-sm-6">
          <input type="text" class="keyboardshortcutinput" readonly data-role="input" data-clear-button="true" data-editable="true" onchange="onShortcutInputChange()"
              id="` + action.name + `newKey" value="` + keyboardShortcuts[action.name] + `" onclick="onShortcutInputClick('` + action.name + `newKey')">
        </div>
      </div>`
  }

  template += `
    </form>
  </div>`;

  Metro.dialog.create({
    title: "<i class='far fa-keyboard fa-fw'></i> Customize Keyboard Shortcuts",
    content: template,
    width: 600,
    clsDialog: 'dark',
    actions: [{
        caption: "Save and apply",
        cls: "js-dialog-close success",
        onclick: function() {
          for (const action of keyboardActions) {
            keyboardShortcuts[action.name] = $('#' + action.name + 'newKey').val();
          }
          bindKeys()
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {}
      }
    ]
  });

  $('#keyboardAssignmentForm').bind('keydown', null, function(event) {
    event.preventDefault();
    if (newKeyAssignment != undefined) {
      let newVal = keyNameFromDownEvent(event);
      if (newVal != "") {
        const inUse = keyInUse(newVal, false).inUse;
        if (newKeyAssignment.val() == newVal) {
          $('#alreadyAssignedWarnShortcut').hide();
          newKeyAssignment.removeClass('alert').addClass('primary');
        } else {
          if (inUse) {
            $('#alreadyAssignedWarnShortcut').appendTo(newKeyAssignment.parent().parent());
            $('#alreadyAssignedWarnShortcut').show();
            $('#alreadyAssignedWarnShortcut').html("\"" + newVal + "\" is already assigned to " + keyInUse(newVal, false).source);
            newKeyAssignment.removeClass('primary').addClass('alert');
          } else {
            $('#alreadyAssignedWarnShortcut').hide();
            newKeyAssignment.removeClass('alert').addClass('primary');
            newKeyAssignment.val(newVal);
          }
        }
      }
    }
  });

}

