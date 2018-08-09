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

  setTimeout(function() {
    console.log('checking for update')
    printLog("<span class='fg-green'>Checking for Updates</span>")
    $.getJSON("https://api.github.com/repos/OpenBuilds/SW-Machine-Drivers/releases/latest?client_id=fbbb80debc1197222169&client_secret=7dc6e463422e933448f9a3a4150c8d2bbdd0f87c").done(function(release) {
      var availVersion = release.name.substr(1)
      var currentVersion = laststatus.driver.version
      console.log(versionCompare(availVersion, currentVersion), availVersion, currentVersion);
      if (versionCompare(availVersion, currentVersion) == 1) {
        console.log('outdated')
        printLog("<span class='fg-green'>Update Available! You are running OpenBuilds Machine Driver " + currentVersion + ", and can now update to OpenBuilds Machine Driver " + availVersion + ". Click <kbd>Update</kbd> -> <kbd>Download Updates</kbd>  to start the Download</span>")
        printUpdateLog("<span class='fg-green'>Update Available! You are running OpenBuilds Machine Driver " + currentVersion + ", and can now update to OpenBuilds Machine Driver " + availVersion + ". Click <kbd>Download Updates</kbd>  to start the Download</span>")
        $('#updateAvailable').show()
        $('#updateAvailable').html('to v' + availVersion)
        $('#updateIcon').addClass('ani-shake')
      } else {
        printLog("<span class='fg-green'>You are already running OpenBuilds Machine Driver " + currentVersion + "</span>")
        printUpdateLog("<span class='fg-green'>Update Available! You are already running OpenBuilds Machine Driver " + availVersion + "</span>")
        $('#updateAvailable').show()
        $('#updateAvailable').html('')
        $('#updateIcon').removeClass('ani-shake')
      }
    });
  }, 5000)


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