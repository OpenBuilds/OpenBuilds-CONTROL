var ycaltemplate = `

   <div id="ycalstep1">
      <table class="table">
         <tr>
            <td>
              <img src="img/calibrate/y/pos1.png" style="border: 1px solid #f1f2f3;">
            </td>
            <td>
               Step 1:  Mark Initial Position<br>
               <small>This wizard, will allow you to fine-tune your steps-per-mm for the Y-Axis</small><hr>
               <small>To get started, jog your Y-Axis until its near the Y- position.</small><br>
               <center>
                  <button class="button" onclick="jog('Y', -10, 1000);"><i class="fas fa-arrow-down"></i> Y- 10</button>
                  <button class="button" onclick="jog('Y', -10, 1000);"><i class="fas fa-arrow-up"></i> Y+ 10</button>
              </center>
              <hr>
              <small>Then, place a physical mark
               on your machine to mark where the Y-Carriage currently is</small>
                  <hr>
                <center>
                  <button class="button success"  onclick="ycalslide2();"><i class="fas fa-check"></i> I've made my 1<sup>st</sup> mark, continue...</button>
               </center>
            </td>
         </tr>
      </table>
   </div>
   <div id="ycalstep2" style="display: none">
      <table class="table">
         <tr>
            <td>
               <img src="img/calibrate/y/pos2.png" alt="pos2" border="0">
            </td>
            <td>
               Step 2:  Mark Second Position<br>
               <small>Click the button below to jog your Y-Axis 100mm in the Y+ direction.  Note this will move the axis a theoretical 100mm (What the machine thinks it should be). Then, place a physical mark on your machine to mark where the Y-Carriage stops</small>
              <hr>
               <center>
                  <button id="ycal100mm" class="button alert" onclick="$('#ycal100mm').attr('disabled', true); $('#ycalcontinue2').attr('disabled', false); jog('Y', 100, 1000);"><i class="fas fa-arrow-up"></i> Move Y+100mm</button>
                  <hr>
                  <button class="button"  onclick="ycalslide1();"><i class="fas fa-chevron-left"></i> Back</button>
                  <button id="ycalcontinue2" class="button success"  onclick="ycalslide3();" disabled><i class="fas fa-check"></i> I've made my 2<sup>nd</sup> mark, continue...</button>
               </center>
            </td>
         </tr>
      </table>
   </div>
   <div id="ycalstep3" style="display: none">
      <table class="table">
         <tr>
            <td>
             <img src="img/calibrate/y/pos3.png" alt="pos3" border="0">
            </td>
            <td>
               Step 3:  Measure Actual Movement<br>
               <small>Measure the actual distance between your two marks, as accurately as possible, and enter the value the machine moved below.  This will be used to calculate a new actual steps-per-mm value</small><br>
               <hr>
               <input id="ycaltraveldist" type="number" value="100.0" data-role="input" data-append="mm" data-prepend="<i class='fas fa-arrows-alt-h'></i>" data-clear-button="false">
              <small class="text-muted">Enter the distance the machine moved</small>
               <hr>
               <center>
                  <button class="button"  onclick="ycalslide2();"><i class="fas fa-chevron-left"></i> Back</button>
                  <button class="button success js-dialog-close"  onclick="applycalibrationy();"><i class="fas fa-check"></i> Apply new value to Grbl Config</button>
               </center>
            </td>
         </tr>
      </table>
   </div>

`

function applycalibrationy() {
  var actualdist = $('#ycaltraveldist').val();
  var currentstepspermm = parseFloat(grblParams['$101']);
  // var currentstepspermm = 199.9;
  // newstepsval = currentsteps * (intended distance  / actual distance)
  var newsteps = currentstepspermm * (100 / actualdist);
  // alert("New Steps Per MM Value:  " + newsteps);
  // $('#val-101-input').val(newsteps)
  // checkifchanged();
  sendGcode("$101=" + newsteps.toFixed(3));
  setTimeout(function() {
    sendGcode(String.fromCharCode(0x18));
  }, 500);
}



function ystepscalibrate() {
  Metro.dialog.create({
    title: "<i class='fas fa-wrench fa-fw'></i> Calibrate Steps per mm for Y-Axis ($101)",
    content: ycaltemplate,
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


function ycalslide1() {
  $('#ycalstep1').show();
  $('#ycalstep2').hide();
  $('#ycalstep3').hide();
}

function ycalslide2() {
  $('#ycal100mm').attr('disabled', false);
  $('#ycalcontinue2').attr('disabled', true);
  $('#ycalstep1').hide();
  $('#ycalstep2').show();
  $('#ycalstep3').hide();
}

function ycalslide3() {
  $('#ycalstep1').hide();
  $('#ycalstep2').hide();
  $('#ycalstep3').show();
}