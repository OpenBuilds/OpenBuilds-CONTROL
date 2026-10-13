"use strict";

var buttonsarray = [];
var macroCodeType = "gcode";

// eslint-disable-next-line no-unused-vars
var macroMenuIdx = undefined; // used in context menus

const JAVASCRIPT_LOAD_PREFIX = "// LOAD:"; // in dev mode (with the -devMode command line switch), javascript macros starting with this text will load from external text file

const fs = (typeof require == "function") ? require('fs') : undefined;

function saveMacroButtons() {
  localStorage.setItem('macroButtons', JSON.stringify(buttonsarray));
}

function populateMacroButtons(runStartups) {
  $("#macroToolsBtn").parent().nextAll().remove();

  for (let i = 0; i < buttonsarray.length; i++) {
    const button = buttonsarray[i];
    // Handle old created buttons that didnt have a tooltip
    if (!button.tooltip) {
      button.tooltip = "";
    }

    let keyboardAssignment = "none";
    if (button.macrokeyboardshortcut && button.macrokeyboardshortcut.length) {
      keyboardAssignment = button.macrokeyboardshortcut;
    }

    let codetype, codetypeDisplay;
    if (button.codetype && button.codetype.length) {
      codetype = button.codetype;
      codetypeDisplay = button.codetype;
    } else {
      button.codetype = "gcode";
      codetype = "gcode";
      codetypeDisplay = "gcode";
    }
    if (button.jsrunonstartup) {
      codetypeDisplay = "js:autorun";
    }
    let buttonHtml;
    if (codetype == "gcode") {
      buttonHtml = `
      <button id="macroBtn` + i + `" class="macrobtn m-1 command-button command-button-macro drop-shadow outline ` + button.class + `" title="` + button.tooltip + `" oncontextmenu="macroContextMenu(` + i + `)" onclick="sendGcode('` + button.gcode.replace(/(\r\n|\n|\r)/gm, "\\n") + `');">
        <span class="` + button.icon + ` icon"></span>
        <span class="caption mt-2">` + button.title + `</span>
        <span title="Code Type: ` + codetype + `" class="macrotype">` + codetype + `</span>
        <span class="macrokbd"><i class="far fa-fw fa-keyboard"></i>: [` + keyboardAssignment + `]</span>
      </button>
      `
    } else if (codetype == "javascript") {
      if (codetype == "javascript" && button.javascript && button.javascript.startsWith(JAVASCRIPT_LOAD_PREFIX)) {
        button.javascript = loadJavascriptFile(button.javascript);
      }

      buttonHtml = `
      <button id="macroBtn` + i + `" class="macrobtn m-1 command-button command-button-macro drop-shadow outline ` + button.class + `" title="` + button.tooltip + `" oncontextmenu="macroContextMenu(` + i + `)" onclick="runJsMacro('` + i + `');">
        <span class="` + button.icon + ` icon"></span>
        <span class="caption mt-2">
          ` + button.title + `
        </span>
        <span title="Code Type: ` + codetype + `" class="macrotype">` + codetypeDisplay + `</span>
        <span class="macrokbd"><i class="far fa-fw fa-keyboard"></i>: [` + keyboardAssignment + `]</span>
      </button>
      `
    }
    $("#macros").append(buttonHtml);


    if (button.jsrunonstartup && runStartups) {
      try {
        executeJS(button.javascript);
        const icon = "";
        const source = "macros";
        const string = "Macro: <b>" + button.title + "</b> executed on startup!";
        const printLogCls = "fg-blue";
        printLogModern(icon, source, string, printLogCls);
      } catch(ex) {
        const icon = "";
        const source = "macros";
        const string = "Macro: <b>" + button.title + "</b> failed on startup!";
        const printLogCls = "fg-red";
        printLogModern(icon, source, string, printLogCls);
        printLogModern(icon, source, escapeHTML(ex.toString()), printLogCls);
      }
    }
  }
  $("#macros").append(`<small style="flex-basis:100%"><i class="fas fa-info-circle"></i>  Right click your Macro buttons to edit/sort/delete/export</small>`);

  saveMacroButtons();
  rebuildMacroGroups();
}

// Blocking function to load external script file in dev mode
function loadJavascriptFile(text) {
  if (fs) {
    const firstLine = text.split('\n', 1)[0];
    const filePath = firstLine.slice(JAVASCRIPT_LOAD_PREFIX.length).trim();
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return firstLine + "\n" + data;
    }
    catch (ex) {
      console.log(ex.toString());
    }
  }
  return text;
}

function onMacroShortcutInputClick()
{
  $('#macrokeyboardshortcut').addClass('primary');
}

function onMacroShortcutInputChange()
{
  if ($('#macrokeyboardshortcut').val() == "") {
    $('#alreadyAssignedWarnMacro').hide();
    $('#macrokeyboardshortcut').removeClass('alert');
  }
}

function editMacro(buttonIdx, fileName, script) {
  let button = undefined;
  let icon = "far fa-question-circle";
  let title = "";
  let codetype = "gcode"
  let gcode = "";
  let javascript = "";
  let cls = "";
  let tooltip = "";
  let macrokeyboardshortcut = "";
  let jsrunonstartup = "";

  if (buttonIdx >= 0) {
    button = buttonsarray[buttonIdx];
    icon = button.icon;
    title = button.title;
    codetype = button.codetype;
    gcode = button.gcode;
    javascript = button.javascript;
    cls = button.class;
    tooltip = button.tooltip;
    if (button.macrokeyboardshortcut && button.macrokeyboardshortcut.length > 0) {
      macrokeyboardshortcut = button.macrokeyboardshortcut;
    } else {
      macrokeyboardshortcut = "";
    }
    jsrunonstartup = button.jsrunonstartup ? "checked" : "";
  } else {
    if (script) {
      const ext = fileName.split('.').at(-1).toLowerCase();
      if (ext == "js") {
        title = fileName.slice(0, -3);
        codetype = "javascript";
        javascript = script;
      } else if (["gcode", "gc", "tap", "nc", "cnc"].indexOf(ext) >= 0) {
        title = fileName.slice(0, -ext.length - 1);
        gcode = script;
      }
      else {
        title = fileName;
        gcode = script;
      }
    }
  }

  if (codetype == "javascript" && javascript && javascript.startsWith(JAVASCRIPT_LOAD_PREFIX)) {
    javascript = loadJavascriptFile(javascript);
  }

  const macroTemplate = `<form id="macroEditForm">
  <div class="p-1 m-0">
      <div class="row mb-2" style="align-items:center;">
          <label class="cell-sm-3">Icon</label>
          <div class="cell-sm-4">
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
          <label class="cell-sm-1" style="padding:0;">Color</label>
          <div class="cell-sm-4">
            <select data-role="select" id="macrocls" data-filter="false" data-drop-height="">
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
              <li id="editorGcodeModeTab" onclick="editorGcodeMode();"><a href="#">G-code</a></li>
              <li id="editorJavascriptModeTab" onclick="editorJavascriptMode();"><a href="#">JavaScript</a></li>
            </ul>
          </div>
          <div class="cell-sm-9">
            <div id="macroGcodeEditField">
              <span class="text-small">Enter G-code to execute</span>
              <textarea  wrap="off" id="macrogcode" type="text" value="` + gcode + `" style="overflow-y: auto; height: calc(100vh - 540px); resize: none;" rows="4"  data-editable="true"></textarea>
            </div>
            <div id="macroJavascriptEditField" style="display:none;" >
              <span class="text-small">Enter Javascript to execute</span><br>
              <span class="text-small">Tip: Prototype your code using (Ctrl+Shift+i > Console)</span>
              <textarea  wrap="off" id="macrojs" type="text" value="" style="overflow-y: auto; height: calc(100vh - 600px); resize: none; tab-size: 2;" rows="4"  data-editable="true"></textarea>
              <input type="checkbox" data-role="checkbox" data-caption="Run Macro on startup (use with caution, no serial comms)" data-caption-position="left" data-style="2" id="jsRunOnStartup" ` + jsrunonstartup + `>
            </div>
          </div>
      </div>
      <div class="row mb-2">

          <label class="cell-sm-3">Keyboard Shortcut</label>
          <div class="cell-sm-9" >
            <input id="macrokeyboardshortcut" readonly class="macrokeyboardshortcutinput" type="text" value="` + macrokeyboardshortcut + `" data-role="input" data-clear-button="true" data-editable="true" onclick="onMacroShortcutInputClick()" onchange="onMacroShortcutInputChange()">
            <span class="text-small fg-red" id="alreadyAssignedWarnMacro" style="display: none;"></span>
            <span class="text-small">Click above to assign a new Keyboard Shortcut to the action.<br>Ctrl, Alt and Shift can be added to create combinations.</span>
          </div>
      </div>
    </div>
  </form>`

  Metro.dialog.create({
    title: buttonIdx >= 0 ? "Edit Macro" : "New Macro",
    clsDialog: "dark",
    width: 600,
    content: macroTemplate,
    dataToTop: true,
    actions: [{
        caption: "Apply",
        cls: "js-dialog-close success",
        onclick: function() {
          if (buttonIdx < 0) {
            buttonsarray.push({});
            button = buttonsarray.at(-1);
            const activeGroup = macroGroupView == 0 ? 0 : Math.max(0, macroGroupsLower.indexOf(currentMacroGroupLower));
            button.group = macroGroups[activeGroup];
          }
          button.icon = $('#macroicon').val();
          button.title = $('#macrotitle').val();
          button.codetype = macroCodeType;
          button.gcode = $('#macrogcode').val();
          button.javascript = $('#macrojs').val();
          button.class = $('#macrocls').val();
          button.tooltip = $('#macrotooltip').val();
          button.macrokeyboardshortcut = $('#macrokeyboardshortcut').val();
          button.jsrunonstartup = $('#jsRunOnStartup').is(':checked')
          populateMacroButtons();
          bindKeys();
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {}
      }
    ]
  });

  $('#macrokeyboardshortcut').bind('keydown', null, function(event) {
    event.preventDefault();
    let newVal = keyNameFromDownEvent(event);
    if (newVal != "") {
      const alreadyAssigned = newVal != macrokeyboardshortcut && newVal.length > 0 && keyInUse(newVal, true).inUse;
      if (alreadyAssigned) {
        $('#alreadyAssignedWarnMacro').html("\"" + newVal + "\" is already assigned to " + keyInUse(newVal, true).source);
        $('#alreadyAssignedWarnMacro').show();
        $('#macrokeyboardshortcut').removeClass("primary").addClass("alert");
      } else {
        $('#alreadyAssignedWarnMacro').hide();
        $('#macrokeyboardshortcut').val(newVal);
        $('#macrokeyboardshortcut').removeClass("alert").addClass("primary");
      }
    }

    $('#jsedit').val(javascript);

  });


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

function createMacro() {
  editMacro(-1);
}

function createMacroFromFile() {
  const loadFileParams = {
    id: "scripts",
    title: "Import Script",
    filters: [
      {name: "JavaScript files", extensions: ["js"]},
      {name: "G-code files", extensions: ["gcode", "gc", "tap", "nc", "cnc"]},
      {name: "All files", extensions: ["*"]},
    ],
    showErrorDlg: true,
  };

  invokeOpenDialogReadFile(loadFileParams).then(({filePath, data}) => {
    editMacro(-1, filePath.split(/[/\\]/).at(-1), data);
  });
}

// run it to begin
if (localStorage.getItem('macroButtons')) {
  buttonsarray = JSON.parse(localStorage.getItem('macroButtons'));
}

function macrosDocReady() {
  const urlParams = new URLSearchParams(window.location.search);
  const safeMode = urlParams.get("safeMode") == "true";
  populateMacroButtons(!safeMode);
  setMacroGroupView(macroGroupView);
  bindKeys();
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

function runJsMacro(buttonIdx) {
  if (!buttonsarray[buttonIdx].jsrunonstartup) {
    executeJS(buttonsarray[buttonIdx].javascript)
  } else {
    Metro.toast.create("Macro: <b>" + buttonsarray[buttonIdx].title + "</b> is an autorun macro, it runs when CONTROL starts. You cannot run it using the button. You can edit or delete it using the <i class='fas fa-cogs'></i> Edit Macro tool", null, 3000, "bg-darkRed fg-white")
  }
}

function executeJS(js) {
  Function(`
    "use strict";
    ` + js + `
  `)();
}

function macroContextMenu(buttonIdx) {
  macroMenuIdx = buttonIdx;

  // find where the button is in the visible order
  let visIdx = undefined;
  let visCount = 0;
  for (let i = 0; i < buttonsarray.length; i++) {
    if (isMacroVisible(buttonsarray[i])) {
      if (i == buttonIdx) {
        visIdx = visCount;
      }
      visCount++;
    }
  }

  $('#moveMacroLeft').attr('disabled', visIdx == undefined || visIdx == 0);
  $('#moveMacroRight').attr('disabled', visIdx == undefined || visIdx == visCount - 1);

  const menu = $("#macroContextMenu");
  menu.css({
    visibility: "hidden",
    display: "block",
  });
  const offset = $("#macroBtn" + buttonIdx).offset();
  const menuRect = menu[0].getBoundingClientRect();
  const parentRect = document.body.getBoundingClientRect();
  const left = Math.max(Math.min(offset.left + 20, parentRect.right - menuRect.width - 4), 0);
  const top = Math.max(Math.min(offset.top + 20, parentRect.bottom - menuRect.height - 4), 0);

  menu.css({
    left: left,
    top: top,
    visibility: "visible",
  }).data('dropdown').close(true);
  $("#macroContextToggle").click();
}

function moveMacro(index, direction) {
  const button = buttonsarray[index];
  if (direction == -1) {
    // find the previous visible button and move before it. there must be one or the option won't be available
    for (let i = index - 1; i >= 0; i--) {
      if (isMacroVisible(buttonsarray[i])) {
        buttonsarray.splice(index, 1);
        buttonsarray.splice(i, 0, button);
        populateMacroButtons();
        return;
      }
    }
  }
  if (direction == 1) {
    // find the next visible button and move after it. there must be one or the option won't be available
    for (let i = index + 1; i < buttonsarray.length; i++) {
      if (isMacroVisible(buttonsarray[i])) {
        buttonsarray.splice(index, 1);
        buttonsarray.splice(i, 0, button);
        populateMacroButtons();
        return;
      }
    }
  }
}

function confirmMacroDelete(buttonIdx) {

  Metro.dialog.create({
    title: "<i class='fas fa-trash'></i> Delete Macro",
    content: `Are you sure you want to delete the Macro: ` + buttonsarray[buttonIdx].title,
    toTop: false,
    //width: '60%',
    clsDialog: 'dark',
    actions: [{
        caption: "Delete",
        cls: "js-dialog-close alert",
        onclick: function() {
          buttonsarray.splice(buttonIdx, 1);
          populateMacroButtons();
          bindKeys();
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {}
      }
    ]
  });
}

const macroFileFilters = [
  {name: "JSON files", extensions: ["json"]},
  {name: "All files", extensions: ["*"]},
];

function backupMacro(index) {
  const blob = new Blob([JSON.stringify(buttonsarray[index], null, 2)], {type: "plain/text"});

  const saveFileParams = {
    id: "macros",
    title: "Export Macro",
    filters: macroFileFilters,
    showErrorDlg: true,
    fileName: 'control-macro-backup-' + buttonsarray[index].title + '.json'
  };
  invokeSaveAsDialogNew(blob, saveFileParams);
}

function backupMacroAll() {
  const blob = new Blob([JSON.stringify(buttonsarray, null, 2)], {type: "plain/text"});
  const date = new Date();

  const saveFileParams = {
    id: "macros",
    title: "Backup Macros",
    filters: macroFileFilters,
    showErrorDlg: true,
    fileName: 'macro-backup-' + date.yyyymmdd() + '.json'
  };
  invokeSaveAsDialogNew(blob, saveFileParams);
}

function macroReadError(message) {
  Metro.dialog.create({
    title: "File read error",
    clsDialog: "dark",
    width: 600,
    content: escapeHTML(message || "Unspecified Error"),
    dataToTop: true,
    actions: [{
        caption: "OK",
        cls: "js-dialog-close alert",
        onclick: function() {}
      }
    ]
  });
}

function importMacroBackupFile() {
  const loadFileParams = {
    id: "macros",
    title: "Import Macro",
    filters: macroFileFilters,
    showErrorDlg: true,
  };

  // eslint-disable-next-line no-unused-vars
  invokeOpenDialogReadFile(loadFileParams).then(({filePath, data}) => {
    try {
      const newMacro = JSON.parse(data);
      if (!Array.isArray(newMacro) && newMacro.title != undefined && newMacro.codetype != undefined) {
        const activeIdx = macroGroupView == 0 ? 0 : Math.max(0, macroGroupsLower.indexOf(currentMacroGroupLower));
        newMacro.group = macroGroups[activeIdx];
        buttonsarray.push(newMacro);
        populateMacroButtons();
        bindKeys();
      } else {
        macroReadError("JSON error: Invalid macro backup.");
      }
    } catch (error) {
      macroReadError(error.message);
    }
  });
}

function importMacroAll() {
  const loadFileParams = {
    id: "macros",
    title: "Import All",
    filters: macroFileFilters,
    showErrorDlg: true,
  };

  // eslint-disable-next-line no-unused-vars
  invokeOpenDialogReadFile(loadFileParams).then(({filePath, data}) => {
    try {
      const newButtons = JSON.parse(data);
      if (newButtons && Array.isArray(newButtons)) {
        buttonsarray = newButtons;
        populateMacroButtons();
        bindKeys();
      } else {
        macroReadError("JSON error: Invalid list of macros.");
      }
    } catch (error) {
      macroReadError(error.message);
    }
  });
}

///////////////////////////////////////////////////////////////////////////////
// Group management

var macroGroupView = 2; // 0 - hidden, 1 - horizontal, 2 - vertical
var currentMacroGroupLower = ""; // empty when macroTabView is 0

var macroGroups = [""]; // first item is always empty string
var macroGroupsLower = [""];

// eslint-disable-next-line no-useless-assignment
var selectedMacroGroup = undefined; // used in context menus

function saveMacroGroupView() {
  localStorage.setItem("macroGroupView", JSON.stringify({tabVisibility: macroGroupView, currentGroupLower: currentMacroGroupLower}));
}

function setCurrentMacroGroup(groupLower)
{
  if (currentMacroGroupLower != groupLower) {
    currentMacroGroupLower = groupLower;
    saveMacroGroupView();
  }
}

function sanitizeGroupName(string) {
  return (string == undefined) ? "" : string.replaceAll(/[&<>"']/g, ' ');
}

function isMacroVisible(button) {
  if (macroGroupView == 0) return true;
  if (button.group == undefined) {
    return currentMacroGroupLower == "";
  } else {
    return button.group.toLowerCase() === currentMacroGroupLower;
  }
}

function refreshMacroVisibility() {
  for (let i = 0; i < buttonsarray.length; i++) {
    $('#macroBtn' + i).toggle(isMacroVisible(buttonsarray[i]));
  }
}

function renameMacroGroup(groupIdx) {
  const dialogContent = `
<div class="row mb-2">
<label class="cell-sm-4 pt-1">Group Name:</label>
<div class="cell-sm-6">
<input id="macroGroupRename" data-role="input" data-clear-button="false" data-editable="true" />
</div>
</div>
`;
  Metro.dialog.create({
    title: "Rename Macro Group",
    clsDialog: "dark",
    width: 600,
    content: dialogContent,
    dataToTop: true,
    actions: [{
        caption: "Apply",
        cls: "js-dialog-close success",
        onclick: function() {
          const oldName = macroGroups[groupIdx];
          const oldNameLower = oldName.toLowerCase();
          const newName = sanitizeGroupName($('#macroGroupRename').val());
          if (currentMacroGroupLower == oldNameLower) {
            setCurrentMacroGroup(newName.toLowerCase());
          }
          let saveRequired = false;
          for (let i = 0; i < buttonsarray.length; i++) {
            const button = buttonsarray[i];
            if (button.group != undefined && button.group.toLowerCase() == oldNameLower) {
              button.group = newName;
              saveRequired = true;
            }
          }

          if (saveRequired) {
            saveMacroButtons();
          }
          rebuildMacroGroups();
          selectedMacroGroup = undefined;
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {}
      }
    ]
  });

  $('#macroGroupRename').val(macroGroups[groupIdx]);}

function selectMacroTab(groupIdx) {
  setCurrentMacroGroup(macroGroupsLower[groupIdx]);
  refreshMacroVisibility();
}

function macroTabContextMenu(event, groupIdx) {
  selectedMacroGroup = groupIdx;

  $("#macroTabContextMenu").css({
    left: event.clientX,
    top: event.clientY
  }).data('dropdown').close(true);
  $("#macroTabContextToggle").click();
}

function createMacroTabs(tabs, activeIdx) {
  tabs.empty();
  let lineHtml = `<li onclick="selectMacroTab(0);"` + (activeIdx == 0 ? `class="active"` : "") + `><a href="#">Default</a></li>`;
  tabs.append(lineHtml);
  for (let i = 1; i < macroGroups.length; i++) {
    lineHtml = `<li onclick="selectMacroTab(` + i + `);" oncontextmenu="macroTabContextMenu(event, ` + i + `)"` +
    (activeIdx == i ? `class="active"` : "") + `><a href="#">` + macroGroups[i] + `</a></li>`;
    tabs.append(lineHtml);
  }
}

function setMacroGroupView(view) {
  $('#macroHorGroups > a > .icon').toggle(view == 1);
  $('#macroVertGroups > a > .icon').toggle(view == 2);
  $('#macroHideGroups > a > .icon').toggle(view == 0);
  $('#macroHorizontalTabs').parent().toggle(view == 1);
  $('#macroVerticalTabs').parent().toggle(view == 2);

  if (macroGroupView != view) {
    macroGroupView = view;
    saveMacroGroupView();
  }
  if (view == 0) {
    setCurrentMacroGroup("");
    $('#macros').css('height', 'calc(100vh - 495px)');
  } else {
    const activeIdx = Math.max(0, macroGroupsLower.indexOf(currentMacroGroupLower));
    setCurrentMacroGroup(macroGroupsLower[activeIdx]);
    createMacroTabs($(view == 1 ? '#macroHorizontalTabs' : '#macroVerticalTabs'), activeIdx);
    $('#macros').css('height', view == 1 ? 'calc(100vh - 537px)' : 'calc(100vh - 495px)');
  }

  refreshMacroVisibility();
}

// Rebuilds the group data from the group field of every button
function rebuildMacroGroupNames() {
  macroGroups = [""];
  macroGroupsLower = [""];
  for (const button of buttonsarray) {
    const groupName = sanitizeGroupName(button.group);
    const groupNameLower = groupName.toLowerCase();
    if (macroGroupsLower.indexOf(groupNameLower) == -1) {
      macroGroups.push(groupName);
      macroGroupsLower.push(groupNameLower);
    }
  }

  macroGroups.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  macroGroupsLower = macroGroups.map((x) => x.toLowerCase());
}

function rebuildMacroGroups() {
  rebuildMacroGroupNames();

  const activeIdx = macroGroupView == 0 ? 0 : Math.max(0, macroGroupsLower.indexOf(currentMacroGroupLower));
  setCurrentMacroGroup(macroGroupsLower[activeIdx]);
  if (macroGroupView == 1) {
    createMacroTabs($('#macroHorizontalTabs'), activeIdx);
  }
  if (macroGroupView == 2) {
    createMacroTabs($('#macroVerticalTabs'), activeIdx);
  }

  refreshMacroVisibility();
}

function moveMacroToGroup(buttonIdx) {
  let dialogContent = `
<div class="row mb-2">
  <label class="cell-sm-4 pt-1" title="Move to existing group">Group:</label>
  <div class="cell-sm-6">
  <select id="macroGroup" data-role="select" data-clear-button="true" data-filter="false" onchange="if (Number($('#macroGroup').val()) == -1) $('#macroGroupNameRow').show(); else $('#macroGroupNameRow').hide()">
    <option value="0">Default</option>
`;

  for (let i = 1; i < macroGroups.length; i++) {
    dialogContent += `
<option value="` + i + `">` + macroGroups[i] + `</option>
`;
  }

  dialogContent += `
    <option value="-1">&amp;lt;New Group&amp;gt;</option>
  </select>
  </div>
</div>
<div id="macroGroupNameRow" class="row mb-2">
  <label class="cell-sm-4 pt-1" title="Enter the name for the new group">Group Name:</label>
  <div class="cell-sm-6">
    <input id="macroGroupName" data-role="input" data-clear-button="false" data-editable="true" />
  </div>
</div>
`;

  Metro.dialog.create({
    title: "Move Macro To Group",
    clsDialog: "dark",
    width: 600,
    content: dialogContent,
    dataToTop: true,
    actions: [{
        caption: "Apply",
        cls: "js-dialog-close success",
        onclick: function() {
          let groupIdx = Number($('#macroGroup').val());
          if (groupIdx != -1) {
            buttonsarray[buttonIdx].group = macroGroups[groupIdx];
          } else {
            let groupName = $('#macroGroupName').val();
            groupName = sanitizeGroupName(groupName);
            const groupNameLower = groupName.toLowerCase();
            groupIdx = (groupNameLower == "default") ? 0 : macroGroupsLower.indexOf(groupNameLower);
            if (groupIdx == -1) {
              macroGroups.push(groupName);
              macroGroupsLower.push(groupNameLower);
              buttonsarray[buttonIdx].group = groupName;
            } else {
              buttonsarray[buttonIdx].group = macroGroups[groupIdx];
            }
          }

          saveMacroButtons();
          rebuildMacroGroups();
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {}
      }
    ]
  });

  const groupName = sanitizeGroupName(buttonsarray[buttonIdx].group);
  const groupNameLower = groupName.toLowerCase();
  const groupIdx = Math.max(0, macroGroupsLower.indexOf(groupNameLower));
  $('#macroGroup').val(groupIdx);
}

if (localStorage.getItem("macroGroupView")) {
  const settings = JSON.parse(localStorage.getItem("macroGroupView"));
  macroGroupView = typeof(settings.tabVisibility) == "number" ? settings.tabVisibility : 2;
  if (macroGroupView != 0 && typeof(settings.currentGroupLower) == "string" && macroGroupsLower.indexOf(settings.currentGroupLower) != -1) {
    macroGroupsLower = settings.currentGroupLower;
  } else {
    macroGroupsLower = "";
  }
}
