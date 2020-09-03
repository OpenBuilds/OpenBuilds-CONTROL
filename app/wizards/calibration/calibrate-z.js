var zcaltemplate = `
   <div id="zcalstep1">
      <table class="table">
         <tr>
            <td>
            <img src="img/calibrate/z/pos1.png" style="border: 1px solid #f1f2f3;">
            </td>
            <td>
               Step 1:  Mark Initial Position<br>
               <small>This wizard, will allow you to fine-tune your steps-per-mm for the Z-Axis</small><hr>
               <small>To get started, jog your Z-Axis until its near the Z- position.</small><br>
               <center>
                  <button class="button" onclick="jog('Z', -10, 1000);"><i class="fas fa-arrow-down"></i> Z- 10</button>
                  <button class="button" onclick="jog('Z', 10, 1000);"><i class="fas fa-arrow-up"></i> Z+ 10</button>
              </center>
              <hr>
              <small>Then, place a physical mark
               on your machine to mark where the Z-Carriage currently is</small>
                  <hr>
                <center>
                  <button class="button success"  onclick="zcalslide2();"><i class="fas fa-check"></i> I've made my 1<sup>st</sup> mark, continue...</button>
               </center>
            </td>
         </tr>
      </table>
   </div>
   <div id="zcalstep2" style="display: none">
      <table class="table">
         <tr>
            <td>
              <img src="img/calibrate/z/pos2.png" alt="pos2" border="0">
            </td>
            <td>
               Step 2:  Mark Second Position<br>
               <small>Click the button below to jog your Z-Axis 50mm in the Y+ direction.  Note this will move the axis a theoretical 50mm (What the machine thinks it should be). Then, place a physical mark on your machine to mark where the Y-Carriage stops</small>
              <hr>
               <center>
                  <button id="zcal50mm" class="button alert" onclick="$('#zcal50mm').attr('disabled', true); $('#zcalcontinue2').attr('disabled', false); jog('Z', 50, 1000)"><i class="fas fa-arrow-up"></i> Move Z+50mm</button>
                  <hr>
                  <button class="button"  onclick="zcalslide1();"><i class="fas fa-chevron-left"></i> Back</button>
                  <button id="zcalcontinue2" class="button success"  onclick="zcalslide3();" disabled><i class="fas fa-check"></i> I've made my 2<sup>nd</sup> mark, continue...</button>
               </center>
            </td>
         </tr>
      </table>
   </div>
   <div id="zcalstep3" style="display: none">
      <table class="table">
         <tr>
            <td>
            <img src="img/calibrate/z/pos3.png" alt="pos3" border="0">
            </td>
            <td>
               Step 3:  Measure Actual Movement<br>
               <small>Measure the actual distance between your two marks, as accurately as possible, and enter the value the machine moved below.  This will be used to calculate a new actual steps-per-mm value</small><br>
               <hr>
               <input id="zcaltraveldist" type="number" value="50.0" data-role="input" data-append="mm" data-prepend="<i class='fas fa-arrows-alt-h'></i>" data-clear-button="false">
              <small class="text-muted">Enter the distance the machine moved</small>
               <hr>
               <center>
                  <button class="button"  onclick="zcalslide2();"><i class="fas fa-chevron-left"></i> Back</button>
                  <button class="button success js-dialog-close"  onclick="applycalibrationz();"><i class="fas fa-check"></i> Apply new value to Grbl Config</button>
               </center>
            </td>
         </tr>
      </table>
   </div>

`

function applycalibrationz() {
  var actualdist = $('#zcaltraveldist').val();
  var currentstepspermm = parseFloat(grblParams['$102']);
  // var currentstepspermm = 199.9;
  // newstepsval = currentsteps * (intended distance  / actual distance)
  var newsteps = currentstepspermm * (50 / actualdist);
  // alert("New Steps Per MM Value:  " + newsteps);
  // $('#val-102-input').val(newsteps)
  // checkifchanged();
  sendGcode("$102=" + newsteps.toFixed(3));
  setTimeout(function() {
    sendGcode(String.fromCharCode(0x18));
  }, 500);
}

function zstepscalibrate() {
  Metro.dialog.create({
    title: "<i class='fas fa-wrench fa-fw'></i> Calibrate Steps per mm for Z-Axis ($102)",
    content: zcaltemplate,
    width: 750,
    clsDialog: 'dark',
    actions: [{
      caption: "Cancel",
      cls: "js-dialog-close",
      onclick: function() {
        //
      }
    }]
  });
}


function zcalslide1() {
  $('#zcalstep1').show();
  $('#zcalstep2').hide();
  $('#zcalstep3').hide();
}

function zcalslide2() {
  $('#zcal50mm').attr('disabled', false);
  $('#zcalcontinue2').attr('disabled', true);
  $('#zcalstep1').hide();
  $('#zcalstep2').show();
  $('#zcalstep3').hide();
}

function zcalslide3() {
  $('#zcalstep1').hide();
  $('#zcalstep2').hide();
  $('#zcalstep3').show();
}