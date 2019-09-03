var gcode;
var editor;
var isJogWidget = false;

function getChangelog() {
  $("#changelog").empty()
  var template2 = `<ul>`
  $.get("https://raw.githubusercontent.com/OpenBuilds/OpenBuilds-CONTROL/master/CHANGELOG.txt?date=" + new Date().getTime(), function(data) {
    var lines = data.split('\n');
    if (lines.length < 7) {
      var count = lines.length - 1
    } else {
      var count = 7
    }
    for (var line = 0; line < count - 1; line++) {
      template2 += '<li>' + lines[line] + '</li>'
    }
    template2 += `</ul>`
    $("#changelog").html(template2);
  });
}

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
      // parseGcodeInWebWorker(editor.getValue())
    });

  }


  function setposition(e) {
    var bodyOffsets = document.body.getBoundingClientRect();
    tempX = e.pageX //- bodyOffsets.left;
    tempY = e.pageY;
    // console.log(tempX);
    var offset = $("#editorContextMenu").offset();
    console.log(offset)
    $("#editorContextMenu").css({
      display: 'block',
      left: e.pageX,
      top: e.pageY
    });
    console.log(e.pageX, e.pageY)
  }

  if (editor) {
    editor.container.addEventListener("contextmenu", function(e) {
      console.log("context", e)
      setposition(e);
      e.preventDefault();
      $('#linenumber').html((editor.getSelectionRange().start.row + 1));
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
      editor.session.setValue(data);
      parseGcodeInWebWorker(data)
      $('#controlTab').click()
      if (webgl) {
        $('#gcodeviewertab').click();
      } else {
        $('#gcodeeditortab').click()
      }
    }

  });

  getChangelog()

  setTimeout(function() {
    $('#splash').fadeOut(500);
  }, 100)


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
      editor.session.setValue(this.result);
      printLog('<span class="fg-red">[ GCODE Parser ]</span><span class="fg-green"> GCODE File Loaded, please wait while we render a preview... </span>');
      parseGcodeInWebWorker(this.result)

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