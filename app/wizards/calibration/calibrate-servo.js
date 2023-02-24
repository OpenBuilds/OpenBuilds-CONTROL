// Calibration Wizard
function penUpSend(data) {
  console.log("Move to " + data)
  sendGcode("M3 S" + data);
}

function penDownSend(data) {
  console.log("Move to " + data)
  sendGcode("M3 S" + data);
}

var servocaltemplate = `

   <div id="servocalstep1">
      <table class="table">
         <tr>
            <td>
            <img src="img/calibrate/servo/up.png">
            </td>
            <td>
               Step 1:  Find the Pen Up Value<br>
               <small>This wizard, will allow you to find the S-values specific to your servo</small><hr>
               <small>To get started, use the slider below to find the position where the Pen is lifted all the way up</small><br>
               <center>
                  <input data-role="slider" data-hint-position="top" data-min="0" data-max="255" data-target="#penupval" data-on-change-value="penUpSend" id="penupslider">
                  <input type="text" data-role="input" data-prepend="Pen Up Value:" id="penupval" readonly data-clear-button="false">
              </center>
              <hr>
              <center>
              <small>Note: Do not push the servo into a hard-stop condition it may damage the servo. Just move it far enough to lift the pen up without straining</small>
              <hr>
                <button class="button success"  onclick="servocalslide2();"><i class="fas fa-check"></i> Pen is now in the UP position, continue...</button>
              </center>
            </td>
         </tr>
      </table>
   </div>
   <div id="servocalstep2" style="display: none">
      <table class="table">
         <tr>
            <td>
              <img src="img/calibrate/servo/down.png" alt="pos2" border="0">
            </td>
            <td>
               Step 2:  Find the Pen Down Value<br>
               <small>This wizard, will allow you to find the S-values specific to your servo</small><hr>
               <small>To get started, use the slider below to find the position where the Pen is dropped all the way down</small><br>
               <center>
                  <input data-role="slider" data-hint-position="top" data-min="0" data-max="255" data-target="#pendownval" id="pendownslider" data-on-change-value="penDownSend">
                  <input type="text" data-role="input" data-prepend="Pen Down Value:" id="pendownval" readonly data-clear-button="false">
              <hr>
              <small>Note: Do not push the servo into a hard-stop condition it may damage the servo. Just move it far enough to lift the pen up without straining</small>
                </center>
              <hr>
              <center>
                <button class="button success"  onclick="servocalslide3();"><i class="fas fa-check"></i> Pen is now in the DOWN position, continue...</button>
              </center>
            </td>
         </tr>
      </table>
   </div>
   <div id="servocalstep3" style="display: none">
      <table class="table">
         <tr>
            <td>
            <img src="img/calibrate/servo/center.png" alt="pos3" border="0">
            </td>
            <td>
               Step 3:  Note the values for future use<br>
               <small>You have now determined the two S-values to send to your controller to Lift the Pen Up, and drop the Pen Down</small><br>
               <hr>
               <center>
                <input type="text" data-role="input" data-prepend="Pen Up Value:" id="penupval2" readonly data-clear-button="false">
<hr>
                <input type="text" data-role="input" data-prepend="Pen Down Value:" id="pendownval2" readonly data-clear-button="false">
               </center>
<hr>
                <small>NB: Please <u>write down these values</u>, as you will likely need to add the values to a post processor, or your CAM software. </small><br>
                <small>Also take note of the manual commands you may need:</small><br>
                <small>Pen Up: <code>M3 S<span id="penupval3">0</span></code></small><br>
                <small>Pen Down: <code>M3 S<span id="pendownval3">0</span></code></small><hr>
                <center>
                  <button class="button success"  onclick="closeServoCal();"><i class="fas fa-check"></i> Save and Apply</button>
                </center>
            </td>
         </tr>
      </table>
   </div>

`



function servocalibrate() {
  Metro.dialog.create({
    clsDialog: 'dark',
    toTop: true,
    id: "servocalibratedialog",
    title: "<i class='fas fa-wrench'></i> Servo Calibration: Pen-Up/Pen-Down Positions",
    content: servocaltemplate,
    width: 750,
    actions: [{
      caption: "Cancel",
      cls: "js-dialog-close",
      onclick: function() {
        //
      }
    }],
    defaultAction: false
  });
  setTimeout(function() {
    $('#penupslider').data('slider').val(penupval)
  }, 500);

}


function servocalslide1() {
  $('#servocalstep1').show();
  $('#servocalstep2').hide();
  $('#servocalstep3').hide();
}

function servocalslide2() {
  $('#servocalstep1').hide();
  $('#servocalstep2').show();
  $('#servocalstep3').hide();
  setTimeout(function() {
    $('#pendownslider').data('slider').val(pendownval)
  }, 500);
}

function servocalslide3() {
  $('#servocalstep1').hide();
  $('#servocalstep2').hide();
  $('#servocalstep3').show();
  $('#penupval2').val($('#penupslider').data('slider').val());
  $('#pendownval2').val($('#pendownslider').data('slider').val());
  $('#penupval3').html($('#penupslider').data('slider').val());
  $('#pendownval3').html($('#pendownslider').data('slider').val());
}

function closeServoCal() {
  console.log("Saving calibration: up: " + $('#penupslider').data('slider').val() + ", down: " + $('#pendownslider').data('slider').val())
  servo = {
    up: $('#penupslider').data('slider').val(),
    down: $('#pendownslider').data('slider').val()
  }
  penupval = $('#penupslider').data('slider').val();
  pendownval = $('#pendownslider').data('slider').val();
  localStorage.setItem("servo-calibration", JSON.stringify(servo));
  Metro.dialog.close($('#servocalstep1').parent().parent());
  console.log(servo)
}