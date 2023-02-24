var xcalmovedistance = 100;

var xcaltemplate = `

   <div id="xcalstep1">
      <table class="table">
         <tr>
            <td>
              <img src="img/calibrate/x/pos1.png" border="0">
            </td>
            <td>
               Step 1:  Mark Initial Position<br>
               <small>This wizard, will allow you to fine-tune your steps-per-mm for the X-Axis</small><hr>
               <small>To get started, jog your X-Axis until its near the X- position.</small><br>
               <center>
                  <button class="button" onclick="jog('X', -10, 1000);"><i class="fas fa-arrow-left"></i> X- 10</button>
                  <button class="button"onclick="jog('X', 10, 1000);"><i class="fas fa-arrow-right"></i> X+ 10</button>
              </center>
              <hr>
              <small>Then, place a physical mark
               on your machine to mark where the X-Carriage currently is</small>
                  <hr>
                <center>
                  <button class="button success"  onclick="slide2();"><i class="fas fa-check"></i> I've made my 1<sup>st</sup> mark, continue...</button>
               </center>
            </td>
         </tr>
      </table>
   </div>
   <div id="xcalstep2" style="display: none">
      <table class="table">
         <tr>
            <td>
               <img src="img/calibrate/x/pos2.png" alt="pos2" border="0">
            </td>
            <td>
               Step 2:  Mark Second Position<br>
               <small>Click the button below to jog your X-Axis in the X+ direction.  Note this will move the axis a theoretical <span class="xcalmovedistanceval">100</span>mm (What the machine thinks it should be). Then, place a physical mark on your machine to mark where the X-Carriage stops</small>
              <hr>
               <center>

                  <input id="xcalmovedistance" type="number" min="10" max="10000" value="100" data-role="input" data-prepend="Custom Move Distance:" data-append="mm" data-clear-button="false" style="text-align: right;"
                    data-editable="true" />
                  <p>
                  <button id="xcal100mm" class="button alert" onclick="$('#xcal100mm').attr('disabled', true); $('#xcalcontinue2').attr('disabled', false); jog('X', xcalmovedistance, 1000);"><i class="fas fa-arrow-right"></i> Move X+<span class="xcalmovedistanceval">100</span>mm</button>

                  <hr>
                  <button class="button"  onclick="slide1();"><i class="fas fa-chevron-left"></i> Back</button>
                  <button id="xcalcontinue2" class="button success"  onclick="slide3();" disabled><i class="fas fa-check"></i> I've made my 2<sup>nd</sup> mark, continue...</button>
               </center>
            </td>
         </tr>
      </table>
   </div>
   <div id="xcalstep3" style="display: none">
      <table class="table">
         <tr>
            <td>
              <img src="img/calibrate/x/pos3.png" alt="pos3" border="0">
            </td>
            <td>
               Step 3:  Measure Actual Movement<br>
               <small>Measure the actual distance between your two marks, as accurately as possible, and enter the value the machine moved below.  This will be used to calculate a new actual steps-per-mm value</small><br>
               <hr>
               <input id="xcaltraveldist" type="number" value="100.0" data-role="input" data-append="mm" data-prepend="<i class='fas fa-arrows-alt-h'></i>" data-clear-button="false">
              <small>Enter the distance the machine moved</small>
               <hr>
               <small>current steps/mm * (requested dist / actual dist) = newsteps</small><br>
               <hr>
               <small id="showcalc"><span id="currentstepspermm">current steps per mm</span> * (<span id="reqdistance">requested distance</span> / <span id="actualdist">actual distance</span>) = <span id="newsteps">newsteps</span> </small>
               <hr>
               <center>
                  <button class="button"  onclick="slide2();"><i class="fas fa-chevron-left"></i> Back</button>
                  <button class="button success js-dialog-close"  onclick="applycalibrationx();"><i class="fas fa-check"></i> Apply new value to Grbl Config</button>
               </center>
            </td>
         </tr>
      </table>
   </div>

`

function applycalibrationx() {
  var actualdist = $('#xcaltraveldist').val();
  var currentstepspermm = parseFloat(grblParams['$100']);
  // var currentstepspermm = 199.9;
  // newstepsval = currentsteps * (intended distance  / actual distance)
  var newsteps = (currentstepspermm * (xcalmovedistance / actualdist)).toFixed(2);
  // alert("New Steps Per MM Value:  " + newsteps);
  // $('#val-100-input').val(newsteps)
  // checkifchanged();
  sendGcode("$100=" + newsteps);
  setTimeout(function() {
    sendGcode(String.fromCharCode(0x18));
  }, 500);
}


function xstepscalibrate() {
  Metro.dialog.create({
    title: "<i class='fas fa-wrench fa-fw'></i> Calibrate Steps per mm for X-Axis ($100)",
    content: xcaltemplate,
    toTop: true,
    width: 850,
    clsDialog: 'dark',
    actions: [{
      caption: "Cancel",
      cls: "js-dialog-close",
      onclick: function() {
        //
      }
    }]
  });

  $("#xcalmovedistance").keyup(function() {
    xcalmovedistance = $("#xcalmovedistance").val();
    $(".xcalmovedistanceval").html(xcalmovedistance);
    $("#xcaltraveldist").val(xcalmovedistance)
    var actualdist = $('#xcaltraveldist').val();
    var currentstepspermm = parseFloat(grblParams['$100']);
    // var currentstepspermm = 199.9;
    // newstepsval = currentsteps * (intended distance  / actual distance)
    var newsteps = (currentstepspermm * (xcalmovedistance / actualdist)).toFixed(2);
    $("#newsteps").html(newsteps)
    $("#currentstepspermm").html(currentstepspermm)
    $("#reqdistance").html(xcalmovedistance)
    $("#actualdist").html(xcalmovedistance)
  });

  $("#xcaltraveldist").keyup(function() {
    var actualdist = $('#xcaltraveldist').val();
    var currentstepspermm = parseFloat(grblParams['$100']);
    // var currentstepspermm = 199.9;
    // newstepsval = currentsteps * (intended distance  / actual distance)
    var newsteps = (currentstepspermm * (xcalmovedistance / actualdist)).toFixed(2);
    $("#showcalc").show()
    $("#newsteps").html(newsteps)
    $("#currentstepspermm").html(currentstepspermm)
    $("#reqdistance").html(xcalmovedistance)
    $("#actualdist").html(actualdist)
  });

}


function slide1() {
  $('#xcalstep1').show();
  $('#xcalstep2').hide();
  $('#xcalstep3').hide();
}

function slide2() {
  $('#xcal100mm').attr('disabled', false);
  $('#xcalcontinue2').attr('disabled', true);
  $('#xcalstep1').hide();
  $('#xcalstep2').show();
  $('#xcalstep3').hide();
}

function slide3() {
  $('#xcalstep1').hide();
  $('#xcalstep2').hide();
  $('#xcalstep3').show();
}