var grblcalctemplate = `<div>
      Use the wizard below to calculate theoretical steps-per-mm values for this axis. This will get you quite close and ready for initial testing. To fine tune final calibration, make use of the Calibration Wizards under Wizards and Tools.
      <hr>
      <table class="table striped compact">
        <tbody>
          <tr id="actuatorrow">
            <td>Actuator Type</td>
            <td>
              <select data-role="select" data-filter="false" id="actuatorselect"  data-on-change="actuatorselect();">
                <option value="belt">Belt Driven</option>
                <option value="lead" selected>Leadscrew Driven</option>
              </select>
            </td>
          </tr>
          <tr id="leadscrewrow">
            <td>Leadscrew Type</td>
            <td>
              <select data-role="select" data-filter="false" id="leadscrewselect" data-on-change="processpreset();">
                <option value="8" selected>Openbuilds ACME Screw (8mm pitch: 2mm x 4start)</option>
                <option value="4">Ballscrew 1204/1604/2004 (4mm pitch)</option>
                <option value="5">Ballscrew 1605/2005 (5mm pitch)</option>
                <option value="10">Ballscrew 1610 (10mm pitch)</option>
              </select>
            </td>
          </tr>
          <tr id="beltrow"  style="display: none;">
            <td>Belt Type</td>
            <td>
              <select data-role="select" data-filter="false" id="beltselect" data-on-change="processpreset();">
                <option value="3">GT3 (GT2-3M)</option>
                <option value="2">GT2 (GT2-2M)</option>
              </select>
            </td>
          </tr>
          <tr id="pulleyrow">
            <td>Pulley Type</td>
            <td>
              <select data-role="select" data-filter="false" id="pulleyselect" data-on-change="processpreset();">
                <option value="14">14 Teeth</option>
                <option value="16">16 Teeth</option>
                <option value="20" selected>20 Teeth</option>
                <option value="30">30 Teeth</option>
              </select>
            </td>
          </tr>
          <tr id="motorrow">
            <td style="width: 30%;">Motor Type</td>
            <td style="width: 70%;">
              <select data-role="select" data-filter="false" id="motorselect" data-on-change="processpreset();">
                <option value="200">1.8&deg; (200 steps per rotation)</option>
                <option value="400">0.9&deg; (400 steps per rotation)</option>
              </select>
            </td>
          </tr>
          <tr id="microsteprow">
            <td style="width: 30%;">Microstepping Type</td>
            <td style="width: 70%;">
              <select data-role="select" data-filter="false" id="microstepselect" data-on-change="processpreset();">
                <option value="32">1/32 Step</option>
                <option value="16">1/16 Step</option>
                <option value="8" selected>1/8 Step</option>
                <option value="4">1/4 Step</option>
                <option value="1">Full Step</option>
              </select>
            </td>
          </tr>
          <tr>
            <td><b>Calculated Value</b></td>
            <td><input data-role="input" data-clear-button="false" data-append="steps/mm" type="text" id="calculatedstepspermm" readonly></td>
          </tr>
        </tbody>
      </table>

</div>`

function xstepspermm() {
  console.log("x")
  Metro.dialog.create({
    width: 600,
    toTop: true,
    title: "Calculate Steps per mm for X-Axis  ($100)",
    content: grblcalctemplate,
    actions: [{
        caption: "Apply calculated value to Grbl Settings",
        cls: "js-dialog-close success",
        onclick: function() {
          $('#val-100-input').val($('#calculatedstepspermm').val());
          checkifchanged();
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {
          // alert("You clicked Disagree action");
        }
      }
    ]
  });
  setTimeout(function() {
    processpreset()
  }, 100)

}

function ystepspermm() {
  console.log("y")
  Metro.dialog.create({
    width: 600,
    toTop: true,
    title: "Calculate Steps per mm for Y-Axis ($101)",
    content: grblcalctemplate,
    actions: [{
        caption: "Apply calculated value to Grbl Settings",
        cls: "js-dialog-close success",
        onclick: function() {
          $('#val-101-input').val($('#calculatedstepspermm').val());
          checkifchanged();
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {
          // alert("You clicked Disagree action");
        }
      }
    ]
  });
  setTimeout(function() {
    processpreset()
  }, 100)
}

function zstepspermm() {
  console.log("z")
  Metro.dialog.create({
    width: 600,
    toTop: true,
    title: "Calculate Steps per mm for Z-Axis ($102)",
    content: grblcalctemplate,
    actions: [{
        caption: "Apply calculated value to Grbl Settings",
        cls: "js-dialog-close success",
        onclick: function() {
          $('#val-102-input').val($('#calculatedstepspermm').val());
          checkifchanged();
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {
          // alert("You clicked Disagree action");
        }
      }
    ]
  });
  setTimeout(function() {
    processpreset()
  }, 100)
}

// function motorselect() {
//   var select = $("#motorselect").data('select');
//   console.log("Current value: " + select.val());
// }

function actuatorselect() {
  var select = $("#actuatorselect").data('select');
  console.log("Current value: " + select.val());

  if (select.val() == "belt") {
    $('#beltrow').show();
    $('#pulleyrow').show();
    $('#leadscrewrow').hide();
  } else if (select.val() == "lead") {
    $('#beltrow').hide();
    $('#pulleyrow').hide();
    $('#leadscrewrow').show();
  }
  processpreset()
}

function processpreset() {
  var actuatorselect = $("#actuatorselect").data('select');
  // console.log("actuatorselect value: " + actuatorselect.val());

  var motorselect = $("#motorselect").data('select');
  // console.log("motorselect value: " + motorselect.val());

  var microstepselect = $("#microstepselect").data('select');
  // console.log("microstepselect value: " + microstepselect.val());

  var beltselect = $("#beltselect").data('select');
  // console.log("beltselect value: " + beltselect.val());

  var pulleyselect = $("#pulleyselect").data('select');
  // console.log("pulleyselect value: " + pulleyselect.val());

  var leadscrewselect = $("#leadscrewselect").data('select');
  // console.log("leadscrewselect value: " + leadscrewselect.val());

  if (actuatorselect.val() == "belt") {
    //step/mm = stepsperrev / beltpitch / pulleyteeth
    var stepsperrev = motorselect.val() * microstepselect.val();
    var beltpitch = beltselect.val();
    var pulleyteeth = pulleyselect.val();
    var calculatedstepspermm = stepsperrev / beltpitch / pulleyteeth
    // console.log(stepsperrev, beltpitch, pulleyteeth)
    $('#calculatedstepspermm').val(calculatedstepspermm.toFixed(3))
  } else if (actuatorselect.val() == "lead") {
    //steps/mm = stepsperrev / screwpitch
    var stepsperrev = motorselect.val() * microstepselect.val();
    var screwpitch = leadscrewselect.val()
    var calculatedstepspermm = stepsperrev / screwpitch
    // console.log(stepsperrev, screwpitch)
    $('#calculatedstepspermm').val(calculatedstepspermm.toFixed(3))
  }

}