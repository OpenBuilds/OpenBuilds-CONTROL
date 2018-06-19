$(document).ready(function() {
  $('#xMotorSet').on('contextmenu', function(e) {
  console.log("context")
  var templatex = `
    <table style="margin: 0.4rem;">
      <tr>
        <td>
          <div class="input-group input-group-sm mb-3">
            <div class="input-group-prepend">
             <span class="input-group-text" id="basic-addon1" style="color: #fff;">Current</span>
            </div>
            <input type="number" class="form-control" id="xMotorCurrent" value="`+parseInt(laststatus.machine.drivers.x.currentSetting)+`">
            <div class="input-group-append">
             <span class="input-group-text" id="basic-addon1" style="color: #fff;">mA</span>
            </div>
          </div>
        </td>
      </tr>
      <!-- tr>
        <td>
          <div class="input-group input-group-sm mb-3">
            <span class="input-group-addon">MicroStep</span>
            <input type="text" class="form-control" value="`+laststatus.machine.drivers.x.microstep+`">
          </div>
        </td>
      </tr>
      <tr>
        <td>
          <div class="input-group input-group-sm mb-3">
            <span class="input-group-addon">StallGuard</span>
            <input readonly type="number" class="form-control" value="`+parseInt(laststatus.machine.drivers.x.stallGuard)+`">
          </div>
        </td>
      </tr -->
      <tr>
        <td colspan="2">
          <div class="btn-group btn-group-xs btn-group-justified btn-group-sm mr-2" role="group" aria-label="First group">
            <button data-toggle="tooltip" data-placement="bottom" title="Apply settings" class="btn btn-xs btn-success" onclick="setXCurrent()">Apply</button>
            <button data-toggle="tooltip" data-placement="bottom" title="Cancel" class="btn btn-xs btn-danger" onclick="$('#editorContextMenu').hide()">Cancel</button>
          </div>
        </td>
      </tr>
    </table>

    `
    $("#dropdowncontent").html(templatex)
    setposition(e);
    e.preventDefault();
  });
});

function setXCurrent() {
  var current = $('#xMotorCurrent').val()
  sendGcode('M906 X'+current);
  // sendGcode('M500')
  sendGcode('M911.1 PX')
  $('#editorContextMenu').hide()
}
