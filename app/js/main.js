var gcode;
var loadedFileName = "";
var editor;
var isJogWidget = false;
var lastJobStartTime = false;

// Disable global Right-click menu, so we can implement UI right click menus
document.addEventListener("contextmenu", function(e) {
  e.preventDefault();
}, false);

function setWindowTitle(status) {

  var string = "OpenBuilds CONTROL"

  if (status) {
    string += " v" + status.driver.version
  } else if (laststatus) {
    string += " v" + laststatus.driver.version
  }


  if (loadedFileName.length > 0) {
    string += " / " + loadedFileName
  }

  if (!nostatusyet && laststatus.comms.interfaces.activePort) {
    string += " / connected to " + laststatus.comms.interfaces.activePort
  }

  $('#windowtitle').html(string)
  document.title = string

}


function getReleaseStats() {
  var url = "https://api.github.com/repos/OpenBuilds/OpenBuilds-CONTROL/releases/latest";
  $.getJSON(url, function(data) {
    console.log(data)
    var assets = data.assets;
    var downloadCount = 0
    for (i = 0; i < assets.length; i++) {
      if (assets[i].name.indexOf("exe") != -1) {
        downloadCount = downloadCount + assets[i].download_count;
      }
      if (assets[i].name.indexOf("dmg") != -1) {
        downloadCount = downloadCount + assets[i].download_count;
      }
      if (assets[i].name.indexOf("zip") != -1) {
        downloadCount = downloadCount + assets[i].download_count;
      }
      if (assets[i].name.indexOf("AppImage") != -1) {
        downloadCount = downloadCount + assets[i].download_count;
      }
    }
    console.log("Latest version has already been installed " + downloadCount + " times")
    $("#releaseStats").html(downloadCount)
    $("#releaseDate").html(data.published_at.split("T")[0])
  });

}


function getChangelog() {

  // Splash Screen Begin

  $("#changelog").empty()
  var template2 = `<ul>`
  $.get("https://raw.githubusercontent.com/OpenBuilds/OpenBuilds-CONTROL/master/CHANGELOG.txt?date=" + new Date().getTime(), function(data) {
    var lines = data.split('\n');
    if (lines.length < 12) {
      var count = lines.length - 1
    } else {
      var count = 12
    }
    for (var line = 0; line < count - 1; line++) {
      template2 += '<li>' + lines[line] + '</li>'
    }
    template2 += `</ul>`
    $("#changelog").html(template2);

    // Update Dialog
    var template3 = `<h6>Changelog:</h6> <hr> <ul>`
    for (var line = 0; line < 5; line++) {
      template3 += '<li>' + lines[line] + '</li>'
    }
    template3 += `</ul>`

    $("#changelogupdate").html(template3);


  });
}

$(document).ready(function() {

  initDiagnostics(); // run second time to ensure checkboxes are ticked

  if (!isJogWidget) {
    init3D();
  }

  // File Open Button compatible with Node 19+ dialogs
  if (!disableElectron19FileOpen) {
    console.log("Native Dialog not disabled in Troubleshooting")
    if (navigator.userAgent.indexOf('Electron') >= 0) {
      console.log("Native Dialog Button Enabled")
      $("#openGcodeBtn").hide()
      $("#openGcodeBtnElectron19").show()
    } else {
      console.log("Native Dialog Button Disabled")
      $("#openGcodeBtn").show()
      $("#openGcodeBtnElectron19").hide()
    }
  } else {
    console.log("Native Dialog is Disabled in Troubleshooting")
    $("#openGcodeBtn").show()
    $("#openGcodeBtnElectron19").hide()
  }


  if (typeof ace !== 'undefined') {
    editor = ace.edit("editor");
    editor.$blockScrolling = Infinity;
    editor.session.setMode("ace/mode/cncpro");
    editor.setTheme('ace/theme/sqlserver')
    // editor.setOption('printMarginColumn', 0)
    editor.setAutoScrollEditorIntoView(true);
    editor.session.setValue('; No GCODE yet - please Load a GCODE file from the Open GCODE button'); // from samplefile.js
    editor.setShowPrintMargin(false);
    editor.getSession().on('change', function() {
      // parseGcodeInWebWorker(editor.getValue())
    });

  }


  function setposition(e) {
    var bodyOffsets = document.body.getBoundingClientRect();
    tempX = e.pageX //- bodyOffsets.left;
    tempY = e.pageY;
    // console.log(tempX);
    var offset = $("#editorContextMenu").offset();
    $("#editorContextMenu").css({
      display: 'block',
      left: e.pageX,
      top: e.pageY
    });
  }

  if (editor) {
    editor.container.addEventListener("contextmenu", function(e) {
      setposition(e);
      e.preventDefault();
      $('.linenumber').html((editor.getSelectionRange().start.row + 1));
      // alert('success! - rightclicked line ' + (editor.getSelectionRange().start.row + 1));
    }, false);
  }


  var fileOpen = document.getElementById('file');
  if (fileOpen) {
    fileOpen.addEventListener('change', readFile, false);
  }


  $.get("/gcode").done(function(data) {
    // console.log(data.length)
    if (data.length > 2) {
      if (data.length > 10000000) {
        gcode = this.result
        editor.session.setValue("GCODE is too large (" + (data.length / 1024).toFixed(0) + "kB) to load into the GCODE Editor. \nIf you need to edit it inside CONTROL, please use a standalone text editing application and reload it ");
      } else {
        editor.session.setValue(data);
        gcode = false;
      }
      parseGcodeInWebWorker(data)
      $('#controlTab').click()
      if (!webgl) {
        $('#gcodeviewertab').click();
      } else {
        $('#gcodeeditortab').click()
      }
      jobNeedsHoming();
    }

  });

  getChangelog()

  setInterval(function() {
    setWindowTitle();
  }, 1000)

  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function() {
      /* Call callback function here */
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
      console.log('%c; Send the GCODE string to the controller, ideal for single commands', 'font-weight: bold; font-size: 12px;color: black; ');
      console.log('%csendGcode("gcode-string")', 'font-weight: regular; font-size: 12px;color: black; ');
    }
  });
  console.log('%c', element);

});

function runJobFile() {
  if (gcode) {
    var formData = new FormData();
    var blob = new Blob([gcode], {
      type: 'text/plain'
    });

    var fileOfBlob = new File([blob], 'upload.gcode');
    formData.append("file", fileOfBlob);
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status == 200) {
        console.log(xhr.response)
      }
    };
    // Add any event handlers here...
    xhr.open('POST', '/runjob', true);
    xhr.send(formData);
    printLog(`<span class="fg-red">[ GCODE Parser ]</span><span class='fg-darkGray'> GCODE File (from memory) sent to backend </span>`);

  } else {
    // v1.0.329 Removed as a test for random issue with Websocket Disconnects on some files, using http post for both
    // socket.emit('runJob', {
    //   data: editor.getValue(),
    //   isJob: true,
    //   fileName: loadedFileName
    // });
    var formData = new FormData();
    var blob = new Blob([editor.getValue()], {
      type: 'text/plain'
    });

    var fileOfBlob = new File([blob], 'upload.gcode');
    formData.append("file", fileOfBlob);
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status == 200) {
        console.log(xhr.response)
      }
    };
    // Add any event handlers here...
    xhr.open('POST', '/runjob', true);
    xhr.send(formData);
    printLog(`<span class="fg-red">[ GCODE Parser ]</span><span class='fg-darkGray'> GCODE File (from gcode editor) sent to backend </span>`);

  }

  lastJobStartTime = new Date().getTime()

}

function readFile(evt) {
  console.group("New FileOpen Event:");
  console.log(evt);
  console.groupEnd();
  // Close the menu
  $("#drop1").dropdown("toggle");

  // Files
  var files = evt.target.files || evt.dataTransfer.files;

  for (var i = 0; i < files.length; i++) {
    loadFile(files[i]);
  }
  document.getElementById('file').value = '';
}

// load file
function loadFile(f) {
  // Filereader
  if (f) {
    var r = new FileReader();
    // if (f.name.match(/.gcode$/i)) {
    r.readAsText(f);
    r.onload = function(event) {
      if (this.result.length > (20 * 1024 * 1024)) {
        gcode = this.result
        editor.session.setValue("File " + f.name + " is too large (" + (this.result.length / 1024).toFixed(0) + "kB) to load into the GCODE Editor. \nIf you need to edit it inside CONTROL, please use a standalone text editing application and reload it ");
      } else {
        editor.session.setValue(this.result);
        gcode = false;
      }
      loadedFileName = f.name;
      setWindowTitle()
      if (webgl) {
        printLog(`<span class="fg-red">[ GCODE Parser ]</span><span class='fg-darkGray'> GCODE File Loaded, please wait while we render a preview... </span>`);
      } else {
        printLog(`<span class="fg-red">[ GCODE Parser ]</span><span class='fg-darkGray'> GCODE File Loaded </span>`);
      }
      parseGcodeInWebWorker(this.result)
      jobNeedsHoming();
    };
    // }
  }
}

function jobNeedsHoming() {

  if (editor.getValue().lastIndexOf("G53") != -1 || editor.getValue().lastIndexOf("g53") != -1) {
    if (laststatus !== undefined) {
      if (laststatus.machine.modals.homedRecently == false) {
        var dialog = Metro.dialog.create({
          clsDialog: 'dark',
          title: "<i class='fas fa-exclamation-triangle'></i> Job uses Machine Coordinates:",
          content: "<i class='fas fa-exclamation-triangle fg-darkRed'></i> Tip: The GCODE file you loaded contains G53 commands. Please make sure to HOME the machine to establish the Machine Coordinate (G53) System properly to prevent crashes.",
          actions: [{
            caption: "Close",
            cls: "js-dialog-close",
            onclick: function() {
              //
            }
          }]
        });
      }
    }
  }
}

function versionCompare(v1, v2, options) {
  var lexicographical = options && options.lexicographical,
    zeroExtend = options && options.zeroExtend,
    v1parts = v1.split('.'),
    v2parts = v2.split('.');

  function isValidPart(x) {
    return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
  }

  if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
    return NaN;
  }

  if (zeroExtend) {
    while (v1parts.length < v2parts.length) v1parts.push("0");
    while (v2parts.length < v1parts.length) v2parts.push("0");
  }

  if (!lexicographical) {
    v1parts = v1parts.map(Number);
    v2parts = v2parts.map(Number);
  }

  for (var i = 0; i < v1parts.length; ++i) {
    if (v2parts.length == i) {
      return 1;
    }

    if (v1parts[i] == v2parts[i]) {
      continue;
    } else if (v1parts[i] > v2parts[i]) {
      return 1;
    } else {
      return -1;
    }
  }

  if (v1parts.length != v2parts.length) {
    return -1;
  }

  return 0;
}



function isWebGLAvailable() {

  try {

    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));

  } catch (e) {

    return false;

  }

}

function isWebGL2Available() {

  try {

    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));

  } catch (e) {

    return false;

  }

}

function getWebGLErrorMessage() {

  return getErrorMessage(1);

}

function getWebGL2ErrorMessage() {

  return getErrorMessage(2);

}

function getErrorMessage(version) {

  const names = {
    1: 'WebGL',
    2: 'WebGL 2'
  };

  const contexts = {
    1: window.WebGLRenderingContext,
    2: window.WebGL2RenderingContext
  };

  let message = 'Your $0 does not seem to support $1: See http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation to learn more';

  if (contexts[version]) {

    message = message.replace('$0', 'graphics card');

  } else {

    message = message.replace('$0', 'browser');

  }

  message = message.replace('$1', names[version]);



  return message;

}



var webgl = (function() {
  if (disable3Dviewer) {
    return false;
  } else if (screen.availHeight < 650) {
    // On screens thats not tall enough, disable 3D view - it just doesn't fit
    return false;
  } else {
    // console.log("Testing WebGL")
    try {
      if (isWebGLAvailable() || isWebGL2Available()) {
        return true
      };
    } catch (e) {
      return false;
    }
  }

})();

function saveGcode() {
  var blob = new Blob([editor.getValue()], {
    type: "plain/text"
  });
  invokeSaveAsDialog(blob, 'edited-gcode.gcode');
}

function invokeSaveAsDialog(file, fileName) {
  if (!file) {
    throw 'Blob object is required.';
  }

  if (!file.type) {
    file.type = 'text/plain';
  }

  var fileExtension = file.type.split('/')[1];

  if (fileName && fileName.indexOf('.') !== -1) {
    var splitted = fileName.split('.');
    fileName = splitted[0];
    fileExtension = splitted[1];
  }

  var fileFullName = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + fileExtension;

  if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
    return navigator.msSaveOrOpenBlob(file, fileFullName);
  } else if (typeof navigator.msSaveBlob !== 'undefined') {
    return navigator.msSaveBlob(file, fileFullName);
  }

  var hyperlink = document.createElement('a');
  hyperlink.href = URL.createObjectURL(file);
  // hyperlink.target = '_blank';
  hyperlink.download = fileFullName;

  if (!!navigator.mozGetUserMedia) {
    hyperlink.onclick = function() {
      (document.body || document.documentElement).removeChild(hyperlink);
    };
    (document.body || document.documentElement).appendChild(hyperlink);
  }

  var evt = new MouseEvent('click', {
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
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd
  ].join('-');
};

function timeConvert(n) {
  var num = n;
  var hours = (num / 60);
  var rhours = Math.floor(hours);
  var minutes = (hours - rhours) * 60;
  var rminutes = Math.round(minutes);
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