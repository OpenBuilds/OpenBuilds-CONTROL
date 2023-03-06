var buttonsarray = []
var macroCodeType = "gcode"


function populateMacroButtons(firstRun) {

  $("#macros").empty();
  for (i = 0; i < buttonsarray.length; i++) {
    // Handle old created buttons that didnt have a tooltip
    if (!buttonsarray[i].tooltip) {
      buttonsarray[i].tooltip = ""
    };
    if (buttonsarray[i].macrokeyboardshortcut && buttonsarray[i].macrokeyboardshortcut.length) {
      var keyboardAssignment = buttonsarray[i].macrokeyboardshortcut
    } else {
      var keyboardAssignment = "none"
    }
    if (buttonsarray[i].codetype && buttonsarray[i].codetype.length) {
      var codetype = buttonsarray[i].codetype
      var codetypeDisplay = buttonsarray[i].codetype
    } else {
      buttonsarray[i].codetype = "gcode"
      var codetype = "gcode"
      var codetypeDisplay = "gcode"
    }
    if (buttonsarray[i].jsrunonstartup) {
      var codetypeDisplay = "js:autorun"
    }
    if (codetype == "gcode") {
      var button = `
      <button id="macroBtn` + i + `" class="macrobtn m-1 command-button command-button-macro drop-shadow outline ` + buttonsarray[i].class + `" title="` + buttonsarray[i].tooltip + `" oncontextmenu="macroContextMenu(` + i + `)" onclick="sendGcode('` + buttonsarray[i].gcode.replace(/(\r\n|\n|\r)/gm, "\\n") + `');">
        <span class="` + buttonsarray[i].icon + ` icon"></span>
        <span class="caption mt-2">
          ` + buttonsarray[i].title + `

        </span>
        <span title="Code Type: ` + codetype + `" class="macrotype">` + codetype + `</span>
        <span class="macrokbd"><i class="far fa-fw fa-keyboard"></i>: [` + keyboardAssignment + `]</span>
      </button>
      `
    } else if (codetype == "javascript") {
      // Future JS Macros here
      var button = `
      <button id="macroBtn` + i + `" class="macrobtn m-1 command-button command-button-macro drop-shadow outline ` + buttonsarray[i].class + `" title="` + buttonsarray[i].tooltip + `" oncontextmenu="macroContextMenu(` + i + `)" onclick="runJsMacro('` + i + `');">
        <span class="` + buttonsarray[i].icon + ` icon"></span>
        <span class="caption mt-2">
          ` + buttonsarray[i].title + `
        </span>
        <span title="Code Type: ` + codetype + `" class="macrotype">` + codetypeDisplay + `</span>
        <span class="macrokbd"><i class="far fa-fw fa-keyboard"></i>: [` + keyboardAssignment + `]</span>
      </button>
      `
    }
    $("#macros").append(button);


    if (buttonsarray[i].jsrunonstartup) {
      if (firstRun) {
        var icon = ""
        var source = "macros"
        var string = "Macro: <b>" + buttonsarray[i].title + "</b> executed on startup!"
        var printLogCls = "fg-blue"
        printLogModern(icon, source, string, printLogCls)
        executeJS(buttonsarray[i].javascript)
      }
    }
  }
  // append add button
  var button = `

  <button class="m-1 command-button command-button-macro drop-shadow outline rounded" onclick="edit(` + (buttonsarray.length + 1) + `, event)">
      <span class="fas fa-plus icon"></span>
      <span class="caption mt-2">
        Create <small>New Macro</small>
      </span>
  </button>


  <button class="m-1 command-button command-button-macro drop-shadow outline rounded btn-file">
    <input class="btn-file" id="macroBackupFile" type="file" accept=".json" />
    <span class="fas fa-upload icon"></span>
    <span class="caption mt-2">
      Import <small>JSON Macro</small>
    </span>
  </button>

  <hr>

  <small><i class="fas fa-info-circle"></i>  Right click your Macro buttons to edit/sort/delete/export</small>


  `
  $("#macros").append(button);

  var macroBackupFileOpen = document.getElementById('macroBackupFile');
  if (macroBackupFileOpen) {
    macroBackupFileOpen.addEventListener('change', readmacroBackupFileOpen, false);
  }

  localStorage.setItem('macroButtons', JSON.stringify(buttonsarray));
}

function edit(i, evt) {
  if (evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  // console.log("Editing " + i)

  if (buttonsarray[i]) {
    var icon = buttonsarray[i].icon;
    var title = buttonsarray[i].title;
    var codetype = buttonsarray[i].codetype
    var gcode = buttonsarray[i].gcode;
    var javascript = buttonsarray[i].javascript
    var cls = buttonsarray[i].class;
    var tooltip = buttonsarray[i].tooltip;
    if (buttonsarray[i].macrokeyboardshortcut && buttonsarray[i].macrokeyboardshortcut.length > 0) {
      var macrokeyboardshortcut = buttonsarray[i].macrokeyboardshortcut;
    } else {
      var macrokeyboardshortcut = "";
    }
    if (buttonsarray[i].jsrunonstartup) {
      var jsrunonstartup = "checked";
    } else {
      var jsrunonstartup = "";
    }

  } else {
    var icon = "far fa-question-circle";
    var title = "";
    var codetype = "gcode"
    var gcode = "";
    var javascript = "";
    var cls = "";
    var tooltip = "";
    var macrokeyboardshortcut = "";
  }

  var macroTemplate = `<form id="macroEditForm">
  <div class="p-1 m-0" style="overflow-y: auto; overflow-x: hidden; height: calc(100vh - 280px);">
      <div class="row mb-2">
          <label class="cell-sm-3">Icon</label>
          <div class="cell-sm-9">
            <form class="inline-form">
              <div class="inline-form">
                <button class="button outline dark " type="button" id="GetIconPicker" data-iconpicker-input="#macroicon" data-iconpicker-preview="#IconPreview">Select Icon</button>
                <div class="h2 m-2">
                  <i id="IconPreview" class="` + icon + `"></i>
                </div>
              </div>
              <input id="macroicon" type="hidden" value="` + icon + `" data-editable="true" />
            </form>
          </div>
      </div>
      <div class="row mb-2">
          <label class="cell-sm-3">Label</label>
          <div class="cell-sm-9">
              <input id="macrotitle" type="text" value="` + title + `" data-editable="true">
          </div>
      </div>
      <div class="row mb-2">
          <label class="cell-sm-3">Tooltip</label>
          <div class="cell-sm-9">
              <input id="macrotooltip" type="text" value="` + tooltip + `" data-editable="true">
          </div>
      </div>
      <div class="row mb-2">
          <div class="cell-sm-3">
            <ul data-tabs-position="vertical" data-role="tabs">
              <li id="editorGcodeModeTab" onclick="editorGcodeMode();"><a href="#">GCODE</a></li>
              <li id="editorJavascriptModeTab" onclick="editorJavascriptMode();"><a href="#">Javascript</a></li>
            </ul>
          </div>
          <div class="cell-sm-9">
            <div id="macroGcodeEditField">
              <textarea  wrap="off" id="macrogcode" type="text" value="` + gcode + `" style="overflow-y: auto; height: 200px; max-height: 200px; resize: none;" rows="4"  data-editable="true"></textarea>
              <span class="text-small">Enter GCODE to execute</span>
            </div>
            <div id="macroJavascriptEditField" style="display:none;" >
              <span class="text-small">Enter Javascript to execute</span><br>
              <span class="text-small">tip: Prototype your code using (Ctrl+Shift+i > Console)</span>
              <textarea  wrap="off" id="macrojs" type="text" value="" style="overflow-y: auto; height: 200px; max-height: 200px; resize: none;" rows="4"  data-editable="true"></textarea>
              <input type="checkbox" data-role="checkbox" data-caption="Run Macro on startup (use with caution, no serial comms)" data-caption-position="left" data-style="2" id="jsRunOnStartup" ` + jsrunonstartup + `>
            </div>
          </div>
      </div>
      <div class="row mb-2">
          <label class="cell-sm-3">Color</label>
          <div class="cell-sm-9">
            <select data-role="select" id="macrocls"  data-editable="true">
              <option value="" selected>Default</option>
              <option value="primary">Blue</option>
              <option value="info">Light Blue</option>
              <option value="secondary">Blue-Gray</option>
              <option value="success">Green</option>
              <option value="alert">Red</option>
              <option value="warning">Orange</option>
              <option value="yellow">Yellow</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
      </div>
      <div class="row mb-2">

          <label class="cell-sm-3">Keyboard Shortcut</label>
          <div class="cell-sm-9" >
            <input id="macrokeyboardshortcut" class="macrokeyboardshortcutinput" type="text" value="` + macrokeyboardshortcut + `" data-role="input" data-clear-button="true" data-editable="true" onclick="$('.macrokeyboardshortcutinput').removeClass('newMacroKeyAssignment'); $('#macrokeyboardshortcut').addClass('newMacroKeyAssignment')">
            <span class="text-small fg-red" id="alreadyAssignedWarnMacro" style="display: none;"></span>
            <span class="text-small">Click above to assign a new Keyboard Shortcut / combination to a function. Ctrl, Alt and Shift can be added to create combinations.</span>
          </div>
      </div>
      <input type="hidden" id="macroseq" value="` + i + `" />
      </div>
  </form>`

  Metro.dialog.create({
    title: "Edit Macro",
    clsDialog: "dark",
    width: 600,
    content: macroTemplate,
    dataToTop: true,
    actions: [{
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {
          //
        }
      },
      {
        caption: "Apply",
        cls: "js-dialog-close success",
        onclick: function() {
          var seq = $('#macroseq').val();
          if (buttonsarray[seq]) {
            buttonsarray[seq].icon = $('#macroicon').val();
            buttonsarray[seq].title = $('#macrotitle').val();
            buttonsarray[seq].codetype = macroCodeType; // TODO might not be jquery val in final version
            buttonsarray[seq].gcode = $('#macrogcode').val();
            buttonsarray[seq].javascript = $('#macrojs').val();
            buttonsarray[seq].class = $('#macrocls').val();
            buttonsarray[seq].tooltip = $('#macrotooltip').val();
            buttonsarray[seq].macrokeyboardshortcut = $('#macrokeyboardshortcut').val();
            buttonsarray[seq].jsrunonstartup = $('#jsRunOnStartup').is(':checked')
            populateMacroButtons();
            bindKeys()
          } else {
            buttonsarray.push({
              title: $('#macrotitle').val(),
              icon: $('#macroicon').val(),
              codetype: macroCodeType, // TODO might not be jquery val in final version
              gcode: $('#macrogcode').val(),
              javascript: $('#macrojs').val(),
              class: $('#macrocls').val(),
              tooltip: $('#macrotooltip').val(),
              macrokeyboardshortcut: $('#macrokeyboardshortcut').val(),
              jsrunonstartup: $('#jsRunOnStartup').is(':checked')
            })
            populateMacroButtons();
            bindKeys()
          }
        }
      }
    ]
  });

  $('#macrokeyboardshortcut').bind('keydown', null, function(e) {
    console.log(e)
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
      // $('.newMacroKeyAssignment').val(newVal)

      var alreadyAssigned = false;
      var assignedMacro = '';
      var alreadyAssigned = keyInUse(newVal).inUse;
      if (alreadyAssigned) {
        $('#alreadyAssignedWarnMacro').show();
        $('#alreadyAssignedWarnMacro').html("\"" + newVal + "\" is already assigned to " + keyInUse(newVal).source);
        $('#macrokeyboardshortcut').addClass("alert")
      } else {
        $('#alreadyAssignedWarnMacro').hide();
        $('#macrokeyboardshortcut').removeClass("alert")
        $('.newMacroKeyAssignment').val(newVal)
        $('#macrokeyboardshortcut').addClass("primary")
      }
    }

    $('#jsedit').val(javascript);

  });


  // var options = {
  //   placement: 'bottom',
  //   collision: 'none',
  //   animation: true,
  //   hideOnSelect: true,
  // };
  // // fa iconpicker https://github.com/farbelous/fontawesome-iconpicker
  // $('#macroicon').iconpicker(options);

  // setTimeout(function() {
  IconPicker.Init({
    // Required: You have to set the path of IconPicker JSON file to "jsonUrl" option. e.g. '/content/plugins/IconPicker/dist/iconpicker-1.5.0.json'
    jsonUrl: '/lib/furcanIconPicker/iconpicker-1.5.0.json',
    searchPlaceholder: 'Search Macro Icon',
    showAllButton: 'Show All',
    cancelButton: 'Cancel',
    noResultsFound: 'No results found.', // v1.5.0 and the next versions
    borderRadius: '0px', // v1.5.0 and the next versions
  });
  // Select your Button element (ID or Class)
  IconPicker.Run('#GetIconPicker');
  // }, 300)

  $("#macrocls").val(cls).trigger("change");
  $('#macrogcode').val(gcode);
  $('#macrojs').val(javascript);

  if (codetype == "gcode") {
    $("#editorJavascriptModeTab").removeClass("active");
    $("#editorGcodeModeTab").addClass("active");
    editorGcodeMode();
  } else if (codetype == "javascript") {
    $("#editorGcodeModeTab").removeClass("active");
    $("#editorJavascriptModeTab").addClass("active");
    editorJavascriptMode();
  }

}

function run(i, evt) {
  evt.preventDefault();
  evt.stopPropagation();
  console.log("Run " + i)
}


// run it to begin
if (localStorage.getItem('macroButtons')) {
  buttonsarray = JSON.parse(localStorage.getItem('macroButtons'));
}

$(document).ready(function() {
  populateMacroButtons(true)
  bindKeys()
});

function searchMacro(prop, nameKey, myArray) {
  console.log(nameKey, prop, myArray)
  for (var i = 0; i < myArray.length; i++) {
    if (myArray[i][prop] === nameKey) {
      return myArray[i];
    }
  }
}

function editorGcodeMode() {
  macroCodeType = "gcode";
  $("#macroGcodeEditField").show()
  $("#macroJavascriptEditField").hide()
}

function editorJavascriptMode() {
  macroCodeType = "javascript";
  $("#macroJavascriptEditField").show()
  $("#macroGcodeEditField").hide()
}

function runJsMacro(i) {
  console.log("Running: ", buttonsarray[i].javascript)
  if (!buttonsarray[i].jsrunonstartup) {
    executeJS(buttonsarray[i].javascript)
  } else {
    var toast = Metro.toast.create;
    toast("Macro: <b>" + buttonsarray[i].title + "</b> is an autorun macro, it runs when CONTROL starts. You cannot run it using the button. You can edit or delete it using the <i class='fas fa-cogs'></i> Edit Macro tool", null, 3000, "bg-darkRed fg-white")
  }
}

function executeJS(js) {
  Function(`
    "use strict";
    ` + js + `
  `)();
}


function macroContextMenu(e) {
  console.log(e)
  setMacroContextMenuPosition(e);
  //e.preventDefault();
  //$('.linenumber').html((editor.getSelectionRange().start.row + 1));
  // alert('success! - rightclicked line ' + (editor.getSelectionRange().start.row + 1));
}

function setMacroContextMenuPosition(e) {
  var offset = $("#macroBtn" + e).offset();

  var menuItems = `<li onclick="edit(` + e + `)"><a href="#"><i class="fas fa-edit icon"></i> Edit Macro</span></a></li>
  <li class="divider"></li>`;

  if (e == 0) {
    //
  } else {
    menuItems += `
      <li onclick="sortMacros(` + e + `, -1)"><a href="#"><i class='fas fa-fw fa-arrow-left icon'></i> Sort: Move Left</a></li>`;
  }

  if (e < buttonsarray.length - 1) {
    menuItems += `<li onclick="sortMacros(` + e + `, 1)"><a href="#"><i class='fas fa-fw fa-arrow-right icon'></i>  Sort: Move Right</a></li>`
  }

  menuItems += `
  <li class="divider"></li>
  <li onclick="backupMacro(` + e + `);"><a href="#"><i class="fas fa-save icon"></i> Export Macro</span></a></li>
  <li class="divider"></li>
  <li onclick="confirmMacroDelete(` + e + `);" class="fg-red"><a href="#"><i class="fas fa-trash icon"></i> Delete Macro</span></a></li>
  `

  $("#macroContextMenuItems").html(menuItems)

  $("#macroContextMenu").css({
    display: 'block',
    left: offset.left + 20,
    top: offset.top + 20
  });
}

function sortMacros(index, delta) {
  // var index = array.indexOf(element);
  var newIndex = index + delta;
  if (newIndex < 0 || newIndex == buttonsarray.length) return; //Already at the top or bottom.
  var indexes = [index, newIndex].sort(); //Sort the indixes
  buttonsarray.splice(indexes[0], 2, buttonsarray[indexes[1]], buttonsarray[indexes[0]]); //Replace from lowest index, two elements, reverting the order
  populateMacroButtons();
};

function confirmMacroDelete(i) {

  Metro.dialog.create({
    title: "<i class='fas fa-trash'></i> Delete Macro",
    content: `Are you sure you want to delete the Macro: ` + buttonsarray[i].title,
    toTop: false,
    //width: '60%',
    clsDialog: 'dark',
    actions: [{
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {
          //
        }
      },
      {
        caption: "Delete",
        cls: "js-dialog-close alert",
        onclick: function() {
          buttonsarray.splice(i, 1);
          populateMacroButtons();
        }
      }
    ]
  });
}

function backupMacro(index) {
  var blob = new Blob([JSON.stringify(buttonsarray[index])], {
    type: "plain/text"
  });
  invokeSaveAsDialog(blob, 'control-macro-backup-' + buttonsarray[index].title + '.json');

}

function readmacroBackupFileOpen(evt) {
  var files = evt.target.files || evt.dataTransfer.files;
  loadmacroBackupFileOpen(files[0]);
  document.getElementById('macroBackupFile').value = '';
}

function loadmacroBackupFileOpen(f) {
  if (f) { // Filereader
    var r = new FileReader();
    // if (f.name.match(/.gcode$/i)) {
    r.readAsText(f);
    r.onload = function(event) {
      //var grblsettingsfile = this.result
      console.log(this.result)
      var newMacro = JSON.parse(this.result);
      if (newMacro.title != undefined && newMacro.codetype != undefined) {
        buttonsarray.push(newMacro)
        populateMacroButtons();
      }

    }
  }
}