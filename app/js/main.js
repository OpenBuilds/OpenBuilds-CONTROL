"use strict";

var currentGcode = ""; // this should always match what is in the 3d view, but the editor contents may be different
var loadedFileName = ""; // name for the contents of the editor, usually the last loaded file
var editor;
var useEditor = true; // if false, currentGcode is used instead of the contents of the editor
var isJogWidget = false;
var lastJobStartTime = false;

// Disable global Right-click menu, so we can implement UI right click menus
document.addEventListener("contextmenu", function(e) {
  e.preventDefault();
}, false);

function setWindowTitle(status) {

  let string = ""

  if (status) {
    string += " v" + status.driver.version;
  } else if (laststatus) {
    string += " v" + laststatus.driver.version;
  }


  if (loadedFileName.length > 0) {
    string += " / " + loadedFileName;
  }

  if (!nostatusyet && laststatus.comms.interfaces.activePort) {
    string += " / connected to " + laststatus.comms.interfaces.activePort;
  }

  $('#windowtitle').html(string)
  document.title = "OpenBuilds CONTROL" + string;
}

$(document).ready(function() {
  $('#openbuildslogosplash').fadeIn(100);
  setTimeout(function() {
    $('#splash').fadeOut(500);
  }, 1400)

  if (isJogWidget) {
    jogDocReady();
  }
  else {
    init3D();

    jogDocReady();
    keyboardDocReady();
    macrosDocReady();
    servoDocReady();
    themeDocReady();
    heightmapDocReady();

    $("#command").inputHistory({
      enter: function() {
        $("#sendCommand").click();
      }
    });

    $("form").submit(function() {
      return false;
    });

    if (typeof ace !== 'undefined') {
      editor = ace.edit("editor");
      editor.$blockScrolling = Infinity;
      editor.session.setMode("ace/mode/cncpro");
      editor.setTheme('ace/theme/sqlserver')
      editor.setAutoScrollEditorIntoView(true);
      editor.session.setValue('; No G-code yet - please Load a G-code file from the Open G-code button');
      editor.setShowPrintMargin(false);
      $('#editor').addClass("editorEnabled");

      // The editor doesn't update when its text changes, unless it is visible.
      // The observer forces an update when the editor becomes visible.
      const observer = new IntersectionObserver(
        () => { editor.resize(); },
        {root: document.documentElement});
      observer.observe(document.getElementById("editor"));

      editor.container.addEventListener("contextmenu", function(e) {

        $("#editorContextMenu").css({
          left: e.pageX,
          top: e.pageY
        }).data('dropdown').close(true);
        $("#editorContextToggle").click();

        $('.linenumber').html((editor.getSelectionRange().start.row + 1));
      }, false);
    } else {
    $('#gcodeeditortab').hide();
    }

    if (!webgl) {
      $('#gcodeviewertab').hide();
      $('#consoletab').click();
    }
  }

  setInterval(function() {
    setWindowTitle();
  }, 1000)

  initSocket();
  socket.emit('docReady', onDocReady);

/* This seems to be a broken attempt to show api help text when the dev tools are open, however it doesn't work.
If this is needed, it may be better triggered from the backend using jogWindow.webContents.on('devtools-opened' ...).
However it may be rude to show the full text every time. Maybe only print "for help type help()", which then will print the entire doc
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function() {
      socket.emit("maximize", true)
      console.log("%c                        ", "background-image: url('https://openbuilds.com/styles/uix/uix/OpenBuildsHeader_logo.png'); font-size: 41px; background-repeat: no-repeat; background-size: 183px 41px; ");
      console.log('%cOpenBuilds CONTROL Devtools', 'font-weight: bold; font-size: 20px;color: rgb(50,80,188); text-shadow: 1px 1px 0 rgb(0,00,39)');
      console.log('%c', 'font-weight: bold; font-size: 12px;color: black; ');
      console.log('%cGeneral: Check for any errors, messages as requested by our support team', 'font-weight: bold; font-size: 12px;color: black; ');
      console.log('%c', 'font-weight: bold; font-size: 12px;color: black; ');
      console.log('%cConsole Commands:', 'font-weight: bold; font-size: 12px;color: black; ');
      console.log('%cAccess the last received feedback data (positions', 'font-weight: bold; font-size: 12px;color: black; ');
      console.log('%coffsets, probes, comms, queues, etc )', 'font-weight: bold; font-size: 12px;color: black; ');
      console.log('%claststatus', 'font-weight: regular; font-size: 12px;color: black; ');
      console.log('%cAccess the Grbl Settings on the controller', 'font-weight: bold; font-size: 12px;color: black; ');
      console.log('%cgrblParams', 'font-weight: regular; font-size: 12px;color: black; ');
      console.log('%c; Clears the console screen', 'font-weight: bold; font-size: 12px;color: black; ');
      console.log('%cconsole.clear()', 'font-weight: regular; font-size: 12px;color: black; ');
      console.log('%c; Print a log entry/message to the Serial Log', 'font-weight: bold; font-size: 12px;color: black; ');
      console.log('%cprintLog("string")', 'font-weight: regular; font-size: 12px;color: black; ');
      console.log('%cAccess the running/last ran gcode via API', 'font-weight: bold; font-size: 12px;color: black; ');
      console.log('%c$.get("/gcode", function(data) { //do something with gcode data });', 'font-weight: regular; font-size: 12px;color: black; ');
      console.log('%c;  Send a job, ideal for macros, jobs. Can display a message when complete.', 'font-weight: bold; font-size: 12px;color: black; ');
      console.log('%c;  Set isJob to store for access via GET /gcode if needed', 'font-weight: bold; font-size: 12px;color: black; ');

      console.log('%csocket.emit("runJob", {', 'font-weight: regular; font-size: 12px;color: black; ');
      console.log('%c  data: gcode-commands,', 'font-weight: regular; font-size: 12px;color: black; ');
      console.log('%c  isJob: false,', 'font-weight: regular; font-size: 12px;color: black; ');
      console.log('%c  completedMsg: "message displayed upon completion ",', 'font-weight: regular; font-size: 12px;color: black; ');
      console.log('%c});', 'font-weight: regular; font-size: 12px;color: black; ');
      console.log('%c; Send the G-code string to the controller, ideal for single commands', 'font-weight: bold; font-size: 12px;color: black; ');
      console.log('%csendGcode("gcode-string")', 'font-weight: regular; font-size: 12px;color: black; ');
    }
  });
  console.log('%c', element);
*/
});

function onDocReady(data) {
  onGrbl(data.firmware);
  if (!isJogWidget) {
    if (data.gcode) {
     onGcodeUpload(data.gcode, data.filename);
    }
    onRecentFiles(data.recentFiles);
    onSysInfo(data.sysInfo);

    $('#disableAutoStartTick').toggle(data.platform == 'win32' || data.platform == 'linux');
    if (editor) {
      editor.session.setNewLineMode(data.platform == 'win32' ? "windows" : "unix");
    }

    if (data.platform == 'linux') {
      $('#disableAutoStartLabel').html("Disable Tray Icon"); // no autostart on linux
    }

    setChangelog(data.changelogText);
  }
}

function runJobFile() {
  const gcode = useEditor ? editor.getValue() : currentGcode;
  if (!jobNeedsHoming(gcode)) {
    runJobFileInternal(gcode);
  }
}

function runJobFileInternal(gcode) {
  const formData = new FormData();
  const blob = new Blob([gcode], {
    type: 'text/plain'
  });

  const fileOfBlob = new File([blob], 'upload.gcode');
  formData.append("file", fileOfBlob);
  const xhr = new XMLHttpRequest();

  captureWcsHistory("", "", true);
  xhr.open('POST', '/runjob', true);
  xhr.send(formData);
  if (useEditor) {
    printLog(`<span class="fg-red">[ g-code parser ]</span><span class='fg-darkGray'> G-code File (from gcode editor) sent to backend </span>`);
  } else {
    printLog(`<span class="fg-red">[ g-code parser ]</span><span class='fg-darkGray'> G-code File (from memory) sent to backend </span>`);
  }

  lastJobStartTime = new Date().getTime();
}

function jobNeedsHoming(gcode) {
  if (laststatus && laststatus.machine.modals.homedRecently) {
    return false;
  }

  if (localStorage.getItem('disableJobNeedsHoming') == "true") {
    return false;
  }

  let command;
  if (gcode.indexOf("G28") >= 0 || editor.getValue().indexOf("g28") >= 0) {
    command = "G28";
  } else if (gcode.indexOf("G30") >= 0 || editor.getValue().indexOf("g30") >= 0) {
    command = "G30";
  } else if (gcode.indexOf("G53") >= 0 || editor.getValue().indexOf("g53") >= 0) {
    command = "G53";
  } else {
    return false;
  }

  Metro.dialog.create({
    clsDialog: 'dark',
    title: "<i class='fas fa-exclamation-triangle'></i> Job uses Machine Coordinates",
    content: `<i class='fas fa-exclamation-triangle fg-darkRed'></i> Alert: The job you are about to run contains a ` + command + ` command, which uses machine coordinates and requires homing.<br><br>` +
`The homing state of the machine cannot be determined at the moment.<br>` +
`Please make sure to home the machine to establish the Machine Coordinate (G53) System and prevent crashes.<br><br>` +
`<input id="disableJobHomeCheck" type="checkbox" data-role="checkbox" data-style="2" data-caption="Don't show this again"/>`,
    actions: [{
      caption: "Run Job Anyway",
      cls: "js-dialog-close warning",
      onclick: function() {
        if ($('#disableJobHomeCheck').prop('checked')) {
          localStorage.setItem('disableJobNeedsHoming', "true");
        }
        runJobFileInternal(gcode);
      }
    },
    {
      caption: "Abort",
      cls: "js-dialog-close",
      onclick: function() {
        if ($('#disableJobHomeCheck').prop('checked')) {
          localStorage.setItem('disableJobNeedsHoming', "true");
        }
      }
    }]
  });

  return true;
}

function loadJobFile() {
  socket.emit('openFile');
}

function reloadJobFile(filePath) {
  socket.emit('reopenFile', filePath);
}


function isWebGLAvailable() {

  try {

    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));

  } catch {

    return false;

  }

}

function isWebGL2Available() {

  try {

    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));

  } catch {

    return false;

  }

}

function getWebGLErrorMessage() {

  if (window.WebGLRenderingContext) {
    return 'Your graphics card does not seem to support WebGL: See https://wikis.khronos.org/webgl/Main_Page to learn more';
  } else {
    return 'Your browser does not seem to support WebGL: See https://wikis.khronos.org/webgl/Main_Page to learn more';
  }
}

const webgl = (function() {
  if (disable3Dviewer) {
    return false;
  } else if (screen.availHeight < 650) {
    // On screens thats not tall enough, disable 3D view - it just doesn't fit
    return false;
  } else {
    try {
      if (isWebGLAvailable() || isWebGL2Available()) {
        return true
      };
    } catch {
      return false;
    }
  }

})();

function previewGcode() {
  parseGcodeInWebWorker(editor.getValue());
}

function saveGcode() {
  const saveFileParams = {
    id: "gcode",
    title: "Save G-code",
    filters: [
      {name: "G-code files", extensions: ["gcode", "gc", "tap", "nc", "cnc"]},
      {name: "All files", extensions: ["*"]},
    ],
    fileName: loadedFileName,
    updateLastFilePath: true,
  };

  socket.emit('saveFileDialog', saveFileParams, (filePath) => {
  const blob = new Blob([editor.getValue()], {
      type: 'text/plain'
    });
    saveBlobToDisk(blob, filePath, saveFileParams).then((err) => {
      if (!err) {
        loadedFileName = filePath.split(/[/\\]/).at(-1);
      }
    });
  });
}

function clearGcode() {
  editor.execCommand('selectall');
  editor.execCommand('del');
  parseGcodeInWebWorker("");
  loadedFileName = '';
  useEditor = true;
  enableViaClass('.editorEnabled', true);
  setWindowTitle();
}

function saveBlobToDisk(blob, filePath, params) {
  const formData = new FormData();
  const fileOfBlob = new File([blob], filePath);
  formData.append("showErrorDlg", params.showErrorDlg ? "true" : "false");
  formData.append("updateLastFilePath", params.updateLastFilePath ? "true" : "false");
  formData.append("file", fileOfBlob);
  const xhr = new XMLHttpRequest();
  let promise = new Promise((resolve) => {
    xhr.onload = function() {
      resolve(xhr.response);
    };
  });
  xhr.open('POST', '/saveFile', true);
  xhr.send(formData);

  return promise;
}

// params could be a suggested file name
// or params could be an object with optional fields
//   * id - dialog id, used to persist the default folder
//   * title - the dialog title
//   * filters - FileFilter[]
//   * fileName - a suggested file name
function invokeSaveAsDialogNew(blob, params) {
  if (!params) {
    params = {};
  } else if (typeof params == "string") {
    params = {
      fileName: params,
    };
  }

  socket.emit('saveFileDialog', params, (filePath) => {
    saveBlobToDisk(blob, filePath, params);
  });
}

// params is an object with the following fields (all optional)
//   * id - dialog id, used to persist the default folder
//   * title - the dialog title
//   * filters - FileFilter[]
//   * fileName - a suggested file name
function invokeOpenDialog(params) {
  return new Promise((resolve) => {
    socket.emit('openFileDialog', params, (filePath) => {
      resolve(filePath);
    });
  });
}

function invokeOpenDialogReadFile(params) {
  return new Promise((resolve) => {
    socket.emit('openFileDialog', params, (filePath) => {
      if (params.showErrorDlg) {
        socket.emit('readTextFile', filePath, params, (data) => {
          resolve({filePath, data});
        });
      } else {
        socket.emit('readTextFile', filePath, params, (err, data) => {
          resolve({err, filePath, data});
        });
      }
    });
  });
}

// This is unused, but preserved in case an old macro needs it
function invokeSaveAsDialog(file, fileName) {
  if (!file) {
    throw 'Blob object is required.';
  }

  if (!file.type) {
    file.type = 'text/plain';
  }

  let fileExtension = file.type.split('/')[1];

  if (fileName && fileName.indexOf('.') !== -1) {
    var splitted = fileName.split('.');
    fileName = splitted[0];
    fileExtension = splitted[1];
  }

  const fileFullName = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + fileExtension;

  if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
    return navigator.msSaveOrOpenBlob(file, fileFullName);
  } else if (typeof navigator.msSaveBlob !== 'undefined') {
    return navigator.msSaveBlob(file, fileFullName);
  }

  const hyperlink = document.createElement('a');
  hyperlink.href = URL.createObjectURL(file);
  // hyperlink.target = '_blank';
  hyperlink.download = fileFullName;

  if (navigator.mozGetUserMedia) {
    hyperlink.onclick = function() {
      (document.body || document.documentElement).removeChild(hyperlink);
    };
    (document.body || document.documentElement).appendChild(hyperlink);
  }

  const evt = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });

  hyperlink.dispatchEvent(evt);

  if (!navigator.mozGetUserMedia) {
    URL.revokeObjectURL(hyperlink.href);
  }
}

Date.prototype.yyyymmdd = function() {
  const mm = this.getMonth() + 1; // getMonth() is zero-based
  const dd = this.getDate();

  return [this.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd
  ].join('-');
};

function timeConvert(n) {
  const num = n;
  let hours = (num / 60);
  let rhours = Math.floor(hours);
  let minutes = (hours - rhours) * 60;
  let rminutes = Math.round(minutes);
  //return num + " minutes = " + rhours + " hour(s) and " + rminutes + " minute(s).";
  if (rhours < 10) {
    rhours = "0" + rhours
  }
  if (rminutes < 10) {
    rminutes = "0" + rminutes
  }
  return rhours + "h:" + rminutes + "m";
}

function toTitleCase(str) {
  return str.replace(/(?:^|\s)\w/g, function(match) {
    return match.toUpperCase();
  });
}
