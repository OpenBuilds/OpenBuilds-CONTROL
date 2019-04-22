function z0probe() {

  if (localStorage.getItem('lastProbe')) {
    var data = JSON.parse(localStorage.getItem('lastProbe'));
  } else {
    var data = { // sane default
      dist: 25,
      plate: 20,
      feedrate: 100,
      direction: 'Z-'
    }
  }

  var z0probetemplate = `
  <div class="p-0 m-0" style="overflow-y: auto; height: calc(100vh - 280px);">
   <table class="table">
          <tr>`

  if (!window.matchMedia("only screen and (max-width: 760px)").matches) {
    z0probetemplate += `<td>
                              <img src="https://image.ibb.co/mPunnf/probe-info.png" alt="probe-info" height="300" style="border: 1px solid #f1f2f3;">
                            </td>
                            `
  }

  z0probetemplate += `<td style="max-width: 300px;">
              <label>Travel Distance</label>
              <input id="z0traveldist" type="number" value="` + data.dist + `" data-role="input" data-append="mm" data-prepend="<i class='fas fa-arrows-alt-v'></i>" data-clear-button="false">
              <small class="text-muted">This is how far (maximum) the Z-Probe will move downward</small>
              <hr>
              <label>Plate Thickness</label>
              <input id="z0platethickness" type="number" value="` + data.plate + `" data-role="input" data-append="mm" data-prepend="<i class='fas fa-ruler-vertical'></i>" data-clear-button="false">
              <small class="text-muted">The offset above Z0 to the top of the plate</small>
              <hr/>
              <label>Probe Feedrate</label>
              <input id="z0feedrate" type="number" value="` + data.feedrate + `" data-role="input" data-append="mm/min" data-prepend="<i class='fas fa-sort-numeric-down'></i>" data-clear-button="false">
  <!--             <small class="text-muted">The offset above Z0 to the top of the plate</small>  -->
            </td>
          </tr>
           <tr>
            <td colspan="2">
              <small class="text-muted">
                NB: First jog to above where you want the Z-Probe to be done, and test your Probe connectivity on the Troubleshooting tab.
              </small>
            </td>
          </tr>
        </table>
        </div>
  `


  Metro.dialog.create({
    title: "<i class='fas fa-podcast' data-fa-transform='rotate-180'></i> Z0 Probe",
    content: z0probetemplate,
    width: 750,
    actions: [{
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {
          //
        }
      },
      {
        caption: "Probe",
        cls: "js-dialog-close success",
        onclick: function() {
          var traveldist = $('#z0traveldist').val();
          var platethickness = $('#z0platethickness').val();
          var feedrate = $('#z0feedrate').val();
          // alert('Probing down to ' + traveldist + "mm at " + feedrate + "mm/min and then subtracting a plate of " + platethickness + "mm");
          // sendGcode('G38.2 Z-' + traveldist + ' F' + feedrate)
          data = {
            dist: traveldist,
            plate: platethickness,
            feedrate: feedrate,
            direction: 'Z-'
          }
          socket.emit("zProbe", data)
          localStorage.setItem('lastProbe', JSON.stringify(data));
        }
      }
    ]
  });
}

function z0proberesult(data) {
  if (data.machine.probe.state > 0) {
    Metro.dialog.create({
      title: "<i class='fas fa-check fa-fw fg-green'> </i> Probe completed Succesfully",
      content: "<div>Probe completed succesfully.  Z0 has been set.  Would you like to retract the probe?</div>",
      actions: [{
          caption: "Retract",
          cls: "js-dialog-close success",
          onclick: function() {
            sendGcode('$J=G91Z5F' + parseInt(data.machine.probe.request.feedrate));
          }
        },
        {
          caption: "Close",
          cls: "js-dialog-close",
          onclick: function() {
            // nothing
          }
        }
      ]
    });
  } else {
    Metro.dialog.create({
      title: "<i class='fas fa-times fa-fw fg-red'> </i> Probe Failed",
      content: "<div>Probe Failed.  Z0 has not been set.<br>The probe did not make contact with the base plate in the requested move.</div>",
      actions: [{
          caption: "Retry",
          cls: "js-dialog-close",
          onclick: function() {
            sendGcode('$X')
            z0probe()
          }
        },
        {
          caption: "Close",
          cls: "js-dialog-close",
          onclick: function() {
            // nothing
          }
        }
      ]
    });
  }
}