var selectedControllerType = 'blackboxx32'

function flashToolBoard(device) {
  selectedControllerType = device
  if (device == "blackbox4x") {
    $("#grblAxesCount").data("select").val("3axes-grbl")
    $("#flash-tool-grbl-row").show();
    $("#flash-tool-grblhal-row").hide();
    $("#flash-tool-erase-row").hide();
    $("#flash-tool-interface-fw-row").hide();
    $("#flash-tool-custom-row").hide();
    $("#customFirmwareSet").html("Please select the Grbl Firmware hex file you want to flash");
  } else if (device == "blackboxx32") {
    $("#grblHalAxesCount").data("select").val("3axes-grblhal")
    $("#flash-tool-grbl-row").hide();
    $("#flash-tool-grblhal-row").show();
    $("#flash-tool-erase-row").show();
    $("#flash-tool-interface-fw-row").hide();
    $("#flash-tool-custom-row").hide();
    $("#customFirmwareSet").html("Please select the GrblHAL Firmware binary file you want to flash");
  } else if (device == "interfacev1") {
    $("#interfaceFirmwareVer").data("select").val("online")
    $("#flash-tool-grbl-row").hide();
    $("#flash-tool-grblhal-row").hide();
    $("#flash-tool-erase-row").hide();
    $("#flash-tool-interface-fw-row").show();
    $("#customFirmwareSet").html("Please select the Interface Firmware binary file you want to flash");
  }

}

function openFlashingTool() {
  var template = `
    <div id="FlashDialogMsg"></div>

    <p class="small mb-4">You can use this wizard to flash Firmware onto compatible controllers. Only use with care, or when instructed by Support</p>
    <ul data-role="tabs" data-expand="true">
      <li><a href="#" onclick="flashToolBoard('blackboxx32');"><img src="/wizards/flashingtool2/img/bbx32-icon.png"> BlackBox X32</a></li>
      <li><a href="#" onclick="flashToolBoard('blackbox4x');"><img src="/wizards/flashingtool2/img/bb4x-icon.png"> BlackBox 4X</a></li>
      <li><a href="#" onclick="flashToolBoard('interfacev1');"><img src="/wizards/flashingtool2/img/interfacev1-icon.png"> Interface</a></li>
    </ul>

    <div class="row mt-2">
      <div class="cell-md-3 mb-1">Port</div>
      <div class="cell-md-9 mb-1">
        <select data-prepend="&nbsp;<i class='fab fa-usb'></i>" data-role="select" data-filter="false" id="portUSB2" disabled data-editable="true">
          <option value="">Waiting for USB</option>
        </select>
      </div>
    </div>

    <div class="row" id="flash-tool-interface-fw-row" style="display: none;">
      <div class="cell-md-3 mb-1">Firmware Version</div>
      <div class="cell-md-9 mb-1">
        <select data-prepend="&nbsp;<i class='fas fa-cube'></i>" data-role="select" data-filter="false" id="interfaceFirmwareVer" data-editable="true">
          <option value="online">Latest available version</option>
          <option value="custom">Custom: firmware .BIN file</option>
        </select>
      </div>
    </div>

    <div class="row" id="flash-tool-grbl-row"   style="display: none;">
      <div class="cell-md-3 mb-1">Machine Style</div>
        <div class="cell-md-9 mb-1">
          <select data-prepend="&nbsp;<i class='fas fa-cube'></i>" data-role="select" data-filter="false" id="grblAxesCount" data-editable="true">
            <option value="3axes-grbl">3 Axes CNC/Laser: Dual-Y with XYZ Axis Homing</option>
            <option value="2axes-grbl">2 Axes CNC/Laser: Dual-Y with Z-Axis Homing Disabled</option>
            <option value="servo-grbl">2/3 Axes Plotter: Dual-Y with Servo Toolhead</option>
            <option value="custom">Custom: firmware .HEX file</option>
          </select>
        </div>
      </div>
    </div>

    <div class="row" id="flash-tool-grblhal-row">
      <div class="cell-md-3 mb-1">Machine Style</div>
        <div class="cell-md-9 mb-1">
          <select data-prepend="&nbsp;<i class='fas fa-cube'></i>" data-role="select" data-filter="false" id="grblHalAxesCount" data-editable="true">
            <option value="3axes-grblhal">2/3 Axes CNC/Laser: Dual-Y</option>
            <option value="3axes-grblhal-door">2/3 Axes CNC/Laser: Dual-Y with Door Switch</option>
            <option value="4axes-grblhal">4 Axes CNC/Laser (Y2 Motor as A, Z Limit shared for A)</option>
            <option value="custom">Custom: firmware .BIN file</option>
          </select>
        </div>
      </div>
    </div>

    <div class="row" id="flash-tool-erase-row" style="display: none;">
      <div class="cell-md-3 mb-1">Erase Settings</div>
        <div class="cell-md-9 mb-1">
          <select data-prepend="&nbsp;<i class='fas fa-eraser'></i>" data-role="select" data-filter="false" id="flashErase" data-editable="true">
            <option value="flashonly">Flash firmware, do not erase settings </option>
            <option value="flasherase">Flash firmware and erase settings</option>
          </select>
        </div>
      </div>
    </div>

    <div class="row" id="flash-tool-custom-row" style="display: none;">
      <div class="cell-md-3 mb-1">Firmware Image</div>
      <div class="cell-md-9 mb-1">
        <form id="customFirmwareForm" enctype="multipart/form-data">
          <button class="button alert shadow btn-file" action="#"><input class="btn-file" id="firmwareBin" type="file" accept=".bin, .hex" name="firmwareBin" /><i class="far fa-folder-open fa-fw"></i> Use custom firmware image</button>
          <br>
          <small id="customFirmwareSet"></small>
        </form>
      </div>
    </div>


`

  Metro.dialog.create({
    title: "<i class='fas fa-microchip fa-fw'></i> Firmware Flashing Tool",
    content: template,
    toTop: true,
    width: '75%',
    clsDialog: 'dark',
    actions: [{
      caption: "FLASH",
      cls: "js-dialog-close success",
      onclick: function() {
        flashFirmwarefromWizard();
      }
    }, {
      caption: "Cancel",
      cls: "js-dialog-close",
      onclick: function() {
        //
      }
    }]
  });

  $("#grblAxesCount").on("change", function() {
    if (this.value == "custom") {
      $("#flash-tool-custom-row").show();
    } else {
      $("#flash-tool-custom-row").hide();
    }
  });

  $("#grblHalAxesCount").on("change", function() {
    if (this.value == "custom") {
      $("#flash-tool-custom-row").show();
    } else {
      $("#flash-tool-custom-row").hide();
    }
  });

  $("#interfaceFirmwareVer").on("change", function() {
    if (this.value == "custom") {
      $("#flash-tool-custom-row").show();
    } else {
      $("#flash-tool-custom-row").hide();
    }
  });

  setTimeout(function() {

    var opts = `<option value="bundle">Bundled version</option>
    <option value="custom">Custom: firmware binary file</option>`;
    if (parseFloat(laststatus.interface.firmware.availVersion) > 0) {
      opts += `<option value="online" selected>Latest available v` + laststatus.interface.firmware.availVersion + `</option>`;
      var fwselect = $("#interfaceFirmwareVer").data("select");
      fwselect.data(opts);
    }
    populatePortsMenu();

  }, 200);

}

function readEspFirmwareFile() {
  console.log("Sending")
  var form = document.getElementById('customFirmwareForm');
  var formData = new FormData(form);
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    if (xhr.status == 200) {
      $("#customFirmwareSet").html(xhr.response)
    }
  };
  // Add any event handlers here...
  xhr.open('POST', '/uploadCustomFirmware', true);
  xhr.send(formData);
}

function flashFirmwarefromWizard() {
  if (selectedControllerType == "blackbox4x") {

    if ($("#grblAxesCount").val() == "3axes-grbl") {
      var filename = "grbl-3axes-nodoor.hex";
    } else if ($("#grblAxesCount").val() == "2axes-grbl") {
      var filename = "grbl-2axes-nodoor.hex";
    } else if ($("#grblAxesCount").val() == "servo-grbl") {
      var filename = "grbl-servo-nodoor.hex";
    }

    var data = {
      port: $("#portUSB2").val(),
      file: filename,
      board: $("#flashController").val(),
      customImg: false
    }

    if ($("#grblAxesCount").val() == "custom") {
      // Custom Firmware
      if ($("#firmwareBin").val().length > 0) {
        var form = document.getElementById('customFirmwareForm');
        var formData = new FormData(form);
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
          if (xhr.status == 200) {
            console.log(xhr.response);
            $("#customFirmwareSet").html(xhr.response);
            data.customImg = true;
            data.file = xhr.response;
            console.log(data);
            socket.emit('flashGrbl', data);
          }
        };
        // Add any event handlers here...
        xhr.open('POST', '/uploadCustomFirmware', true);
        xhr.send(formData);
      } else {
        $('#controlTab').click();
        $('#consoletab').click();
        printLog("<span class='fg-red'>[ Firmware Upgrade ] </span><span class='fg-red'><i class='fas fa-times fa-fw fg-red fa-fw'></i>You selected the option to use a custom firmware file, but failed to select a file to use for the operation. Please try again</span>")
      }


    } else {
      //  Precompiled Firmwares
      socket.emit('flashGrbl', data)

    }

  } else if (selectedControllerType == "blackboxx32") {

    if ($("#grblHalAxesCount").val() == "3axes-grblhal") {
      var filename = "grblhal-grbl3axis.bin";
    } else if ($("#grblHalAxesCount").val() == "3axes-grblhal-door") {
      var filename = "grblhal-grbl3axis-door.bin";
    } else if ($("#grblHalAxesCount").val() == "4axes-grblhal") {
      var filename = "grblhal-grbl4axis.bin";
    }

    var data = {
      port: $("#portUSB2").val(),
      file: filename,
      erase: false,
      customImg: false
    }

    if ($("#flashErase").val() == "flasherase") {
      data.erase = true;
    }

    if ($("#grblHalAxesCount").val() == "custom") {
      // Custom Firmware
      if ($("#firmwareBin").val().length > 0) {
        var form = document.getElementById('customFirmwareForm');
        var formData = new FormData(form);
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
          if (xhr.status == 200) {
            $("#customFirmwareSet").html(xhr.response);
            data.customImg = true;
            data.file = $("#firmwareBin").val();
            socket.emit('flashGrblHal', data);
          }
        };
        // Add any event handlers here...
        xhr.open('POST', '/uploadCustomFirmware', true);
        xhr.send(formData);
      } else {
        $('#controlTab').click();
        $('#consoletab').click();
        printLog("<span class='fg-red'>[ Firmware Upgrade ] </span><span class='fg-red'><i class='fas fa-times fa-fw fg-red fa-fw'></i>You selected the option to use a custom firmware file, but failed to select a file to use for the operation. Please try again</span>")
      }


    } else {
      //  Precompiled Firmwares
      socket.emit('flashGrblHal', data)

    }

  } else if (selectedControllerType == "interfacev1") {
    var data = {
      port: $("#portUSB2").val(),
      file: "firmware.bin", // version that ships with Interface
      board: $("#flashController").val()
    }

    if ($("#interfaceFirmwareVer").val() == "custom") {
      // custom image
      if ($("#firmwareBin").val().length > 0) {
        var form = document.getElementById('customFirmwareForm');
        var formData = new FormData(form);
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
          if (xhr.status == 200) {
            $("#customFirmwareSet").html(xhr.response);
            data.file = $("#firmwareBin").val();
            socket.emit('flashInterface', data);
          }
        };
        // Add any event handlers here...
        xhr.open('POST', '/uploadCustomFirmware', true);
        xhr.send(formData);
      } else {
        $('#controlTab').click();
        $('#consoletab').click();
        printLog("<span class='fg-red'>[ Firmware Upgrade ] </span><span class='fg-red'><i class='fas fa-times fa-fw fg-red fa-fw'></i>You selected the option to use a custom firmware file, but failed to select a file to use for the operation. Please try again</span>")
      }

    } else {
      // latest included firmware
      socket.emit('flashInterface', data)
    }


  } else {
    console.log("no controller selected")
  }
}