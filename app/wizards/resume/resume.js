// Courtesy of https://github.com/rlwoodjr/Basic-SENDER/commit/01f991b7b5171e5e60db59f6cbcba6a286794911#diff-e11dedd96127264342c2b083f0eeaa2e632fd0f9374c13aea861915577f949e8R602
// as per https://github.com/OpenBuilds/OpenBuilds-CONTROL/issues/96#issuecomment-1420150128
// Thanks @rlwoodjr

function recoverCrashedJob() {
  if (localStorage.getItem('gcodeLineNumber')) {
    var lineNumber = localStorage.getItem('gcodeLineNumber')
    if (lineNumber > editor.session.getLength()) { // Wrong file
      lineNumber = 1;
    }
  } else {
    var lineNumber = 1;
  }

  var resumeTemplate = `
  <form>
    Enter the starting line to recover the job from:
    <br>
    <span class="text-small">(Make sure you opened the GCODE first)</span>
    <hr>
    <input id="selectedLineNumber" data-prepend="<i class='fas fa-list-ol'></i> Start from line: " type="number" data-role="input"  data-clear-button="false" value="` + lineNumber + `" data-editable="true"></input>
    <hr>
    <input type="checkbox" data-role="checkbox" data-caption="Use Work Coordinates for Z-Safe Move:" data-caption-position="left" id="recoveryUseWpos">
  </form>
  <div class="remark success">
  Tip: You can pick the line from the GCODE Editor tab using the right-click context menu too</span>
  </div>
  <hr>
  <div class="remark warning">
    NOTE: Use this tool at your own risk. Recovering GCODE is a risky operation. You are also responsible for ensuring that work origin is correctly set.  Use at your own risk.
  </div>
  `
  Metro.dialog.create({
    title: "<i class='fas fa-fw fa-route'></i> Recover Job From Line Number",
    content: resumeTemplate,
    //toTop: true,
    //width: '75%',
    clsDialog: 'dark',
    actions: [{
        caption: "Proceed to next step",
        cls: "js-dialog-close alert",
        onclick: function() {
          startFromHere($("#selectedLineNumber").val());
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {}
      }
    ]
  });
};


function startFromHere(lineNumber) {
  console.log(lineNumber)
  var lineX = "";
  var lineY = "";
  var lineZ = "";
  var lineA = "";
  var lineZm = "";
  var lineF = "";
  var lineFmin = 0;
  var lineFmax = 0;
  var line = '';
  var spindle = null;


  var foundZUp = false;
  var foundZUpLine = 0;


  for (var i = 1; i < lineNumber; i++) {
    currentLine = editor.session.getLine(i);
    if (currentLine.length > 0) {
      currentLine = currentLine.split(/[;(]/); // Remove everything after ; or ( = comment
      line = currentLine[0]
      line = line.toUpperCase();

      var Xindex = line.indexOf("X")
      var Yindex = line.indexOf("Y")
      var Zindex = line.indexOf("Z")
      var Aindex = line.indexOf("A")
      var Zmindex = line.indexOf("Z-")
      var Findex = line.indexOf("F")

      if (Zindex >= 0 && !foundZUp) {
        if ($('#recoveryUseWpos').prop('checked')) {
          lineZ = line.slice(Zindex + 1)
          lineZ = "G0 Z" + parseFloat(lineZ)
          foundZUp = true
          foundZUpLine = i + 1;
        } else {
          lineZ = "G53 G0 Z-10"
          foundZUp = true // But not used
          foundZUpLine = i + 1;
        }

      }

      if (Xindex >= 0) {
        lineX = line.slice(Xindex + 1)
        lineX = "X" + parseFloat(lineX)
      }
      if (Yindex >= 0) {
        lineY = line.slice(Yindex + 1)
        lineY = "Y" + parseFloat(lineY)
      }
      if (Zmindex >= 0) {
        lineZm = line.slice(Zmindex + 1)
        lineZm = "Z" + parseFloat(lineZm)
      }
      if (Aindex >= 0) {
        lineA = line.slice(Aindex + 1)
        lineA = "A" + parseFloat(lineA)
      }
      if (Findex >= 0) {
        lineF = line.slice(Findex + 1)
        lineF = parseFloat(lineF)

        if (lineF > 0 && lineF >= lineFmin) {
          lineFmin = 'F' + lineF
        } else {
          lineFmax = 'F' + lineF
        }
      }
    }
  }

  var GcodeLineXYA = "G0" + lineX + lineY + lineA + lineFmax
  var GcodeLineZDown = "G1" + lineZm + lineFmin

  var resumeFileTemplate = `
    <form>
      <div>
        The Recovery strategy will modify the currently loaded GCODE accordingly:
        <hr>
          <ul>
            <li>Keep the first <span class="tally dark" id="resumeZUpLine"></span> lines of the file as header</li>
            <li>Raise Z with the GCODE: <span class="tally dark" id="resumeZUp"></span></li>
            <li><span id="spindleMsg" class="fg-darkRed">Spindle ON command not found! <span class="tally alert">Please start spindle before running job</span> </span></li>
            <li>Move to entry position with GCODE: <span class="tally dark" id="resumeXYA"></span></li>
            <li>Move to cutting height with GCODE: <span class="tally dark" id="resumeZm"></span></li>
            <li>Run GCODE starting at line <span class="tally dark" id="resumeLastLine"></span> and continue with the job</li>
          </ul>
        Review the recovery strategy and click 'Proceed' to update the loaded gcode to reflect the changes, and update the 3D view.
      </div>
    </form>
    <div class="remark warning">
      NOTE: Use this tool at your own risk. Recovering GCODE is a risky operation. You are also responsible for ensuring that work origin is correctly set</span>.  Use at your own risk.
    </div>
    `
  // Search backwards from start line to find last instance of spindle cmd
  for (var i = lineNumber - 1; i >= 0; i--) {
    currentLine = editor.session.getLine(i);
    if (currentLine.length > 0) {
      currentLine = currentLine.split(/[;(]/); // Remove everything after ; or ( = comment
      line = currentLine[0]
      line = line.toUpperCase();

      if (line.indexOf('M3') != -1 || line.indexOf('M4') != -1) {
        foundSpindle = true;
        spindle = line;
        // Search forward one line for pause cmd
        if (editor.session.getLine(i + 1).toUpperCase().indexOf('G4') != -1) {
          console.log('pause line? ' + editor.session.getLine(i + 1))
          spindle += '\n' + editor.session.getLine(i + 1).toUpperCase();
        }
        break;
      }
    }
  }

  Metro.dialog.create({
    title: "<i class='fas fa-fw fa-route'></i> Recover Job From Line Number",
    content: resumeFileTemplate,
    toTop: true,
    width: '75%',
    clsDialog: 'dark',
    actions: [{
        caption: "Proceed to next step",
        cls: "js-dialog-close alert",
        onclick: function() {
          redoJob();
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {}
      }
    ]
  });

  $('#resumeZUpLine').html(foundZUpLine);
  $('#resumeZUp').html(lineZ);
  $('#resumeLastLine').html(lineNumber);
  $('#resumeXYA').html(GcodeLineXYA);
  $('#resumeZm').html(GcodeLineZDown);

  if (spindle) {
    $('#spindleMsg').html("Turn spindle ON: <span class='tally dark' id='resumeSpindle'>" + spindle + "</span> ");
    $('#resumeSpindle').html(spindle);
  }

  //Metro.dialog.open("#ResumeFileDialog");
}

function redoJob() {
  var line = "";
  gcode = "; Recovered GCODE Use at your OWN RISK\n";

  var startLineNumber = $('#resumeZUpLine').html();
  var XYAGcode = $('#resumeXYA').html();
  var ZGcode = $('#resumeZm').html();
  var resumeLineNumber = $('#resumeLastLine').html();
  var resumeLastNumber = editor.session.getLength();
  if ($('#resumeSpindle').html() != undefined) {
    var spindleGcode = $('#resumeSpindle').html();
  } else {
    var spindleGcode = '';
  }



  for (var i = 0; i < startLineNumber; i++) {
    line = editor.session.getLine(i);
    gcode += line + '\n'
  }

  if (spindleGcode != '') {
    gcode += spindleGcode + '\n';
  }

  gcode += XYAGcode + '\n';
  gcode += ZGcode + '\n';

  for (var i = resumeLineNumber - 1; i < resumeLastNumber; i++) {
    line = editor.session.getLine(i);
    gcode += line + '\n'
  }

  editor.session.setValue("");
  editor.session.setValue(gcode);
  $('#controlTab').click();
  parseGcodeInWebWorker(gcode);
}