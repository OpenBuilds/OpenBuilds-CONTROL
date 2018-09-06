var gcode;
var editor;
var isJogWidget = false;

$(document).ready(function() {
  if (!isJogWidget) {
    init3D();
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
      if (scene.getObjectByName('gcodeobject')) {
        // console.log("Existing GCODE object: Cleaning up first")
        scene.remove(scene.getObjectByName('gcodeobject'))
        object = false;
      }
      resetView();
      parseGcodeInWebWorker(editor.getValue())
    });

  }

  // editor.container.addEventListener("contextmenu", function(e) {
  //   console.log("context")
  //   var template = `<h6 class="dropdown-header"><div class="float-left">Line <span id="linenumber"></span>: Options</div><div class="float-right"><button type="button" class="close" aria-label="Close" onclick="$('#editorContextMenu').hide()"><span aria-hidden="true">&times;</span></button></div></h6><a class="dropdown-item" href="#"><i class="fa fa-fw fa-list-ol" aria-hidden="true"></i>&nbsp;Run queue from here</a>
  //   <a class="dropdown-item" href="#" onclick="ContextLineRun();"><i class="fa fa-fw fa-play" aria-hidden="true"></i>&nbsp;Execute line: <code>` + editor.session.getLine(editor.getSelectionRange().start.row) + `</code></a>
  //   <a class="dropdown-item" href="#" onclick="sim(` + (editor.getSelectionRange().start.row + 1) + `)"><i class="fa fa-fw fa-fighter-jet" aria-hidden="true"></i>&nbsp;Simulate from here</a>`
  //   $("#dropdowncontent").html(template)
  //   // console.log(e);
  //   setposition(e);
  //   e.preventDefault();
  //   $('#linenumber').html((editor.getSelectionRange().start.row + 1));
  //   // alert('success! - rightclicked line ' + (editor.getSelectionRange().start.row + 1));
  // }, false);

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

  var fileOpen = document.getElementById('file');
  if (fileOpen) {
    fileOpen.addEventListener('change', readFile, false);
  }


  $.get("/gcode").done(function(data) {
    console.log(data.length)
    if (data.length > 2) {
      editor.session.setValue(data);
      $('#controlTab').click()
      if (webgl) {
        $('#gcodeviewertab').click();
      } else {
        $('#gcodeeditortab').click()
      }
    }

  });



});

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
}

// load file
function loadFile(f) {
  // Filereader
  if (f) {
    var r = new FileReader();
    // if (f.name.match(/.gcode$/i)) {
    r.readAsText(f);
    r.onload = function(event) {
      // cleanupThree();
      // gcode = this.result;
      editor.session.setValue(this.result);
      printLog('GCODE Opened: ');
    };
    // }
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

var webgl = (function() {
  try {
    return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
  } catch (e) {
    return false;
  }
})();