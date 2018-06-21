var gcode;

$(document).ready(function() {
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
      gcode = this.result;
      printLog('GCODE Opened');
    };
    // }
  }
}