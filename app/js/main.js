var gcode;
var editor = ace.edit("editor");


$(document).ready(function() {

  editor.$blockScrolling = Infinity;
  editor.session.setMode("ace/mode/cncpro");
  editor.setTheme('ace/theme/sqlserver')
  // editor.setOption('printMarginColumn', 0)
  editor.setAutoScrollEditorIntoView(true);
  editor.session.setValue('; No GCODE yet - please Load a GCODE file from the Open GCODE button'); // from samplefile.js
  editor.setShowPrintMargin(false);
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
  fileOpen.addEventListener('change', readFile, false);

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