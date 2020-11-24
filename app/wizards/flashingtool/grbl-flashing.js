$(document).ready(function() {

  $("#flashController").on("change", function() {
    if (this.value == "interface") {
      $("#flash-tool-machine-row").hide();
      $("#flash-tool-door-row").hide();
      $("#flash-tool-interface-fw-row").show();
      if ($("#interfaceFirmwareVer").val() == "custom") {
        $("#flash-tool-custom-row").show();
      } else {
        $("#flash-tool-custom-row").hide();
      }
      $("#customFirmwareSet").html("Please select the Interface Firmware binary file you want to flash");
    } else {
      $("#flash-tool-machine-row").show();
      $("#flash-tool-door-row").show();
      $("#flash-tool-interface-fw-row").hide();
      $("#flash-tool-custom-row").hide();
      $("#customFirmwareSet").html("Please select the Grbl Firmware hex file you want to flash");
    }
  });

  $("#grblAxesCount").on("change", function() {
    if (this.value == "custom") {
      $("#flash-tool-door-row").hide();
      $("#flash-tool-custom-row").show();
      $("#customFirmwareSet").html("Please select the Grbl Firmware hex file you want to flash");
    } else {
      $("#flash-tool-door-row").show();
      $("#flash-tool-custom-row").hide();
    }
  });

  $("#interfaceFirmwareVer").on("change", function() {
    if (this.value == "custom") {
      $("#flash-tool-custom-row").show();
      $("#customFirmwareSet").html("Please select the Interface Firmware binary file you want to flash");
    } else {
      $("#flash-tool-custom-row").hide();
    }
  });



  // var fileOpen = document.getElementById('firmwareBin');
  // if (fileOpen) {
  //   fileOpen.addEventListener('change', readEspFirmwareFile, false);
  // }

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

});

function populateGrblBuilderToolForm() {
  Metro.dialog.open("#grblFlashDialog");
  var opts = `<option value="custom">Custom: firmware binary file</option>`;
  if (parseFloat(laststatus.interface.firmware.availVersion) > 0) {
    opts += `<option value="online" selected>Latest available v` + laststatus.interface.firmware.availVersion + `</option>`;
  }
  var select = $("#interfaceFirmwareVer").data("select");
  select.data(opts);
}

function flashFirmwarefromWizard() {
  if ($("#flashController").val() != "interface") {
    var data = {
      port: $("#portUSB2").val(),
      file: "grbl-" + $("#grblAxesCount").val() + "-" + $("#grblDoorEnable").val() + ".hex",
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
            $("#customFirmwareSet").html(xhr.response);
            data.customImg = true;
            data.file = $("#firmwareBin").val();
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

  } else if ($("#flashController").val() == "interface") {
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



// grbl-3axes-nodoor.hex
// grbl-3axes-opendoor.hex
// grbl-3axes-closeddoor.hex
// grbl-2axes-nodoor.hex
// grbl-2axes-opendoor.hex
// grbl-2axes-closeddoor.hex
// grbl-servo-nodoor.hex
// grbl-servo-opendoor.hex
// grbl-servo-closeddoor.hex