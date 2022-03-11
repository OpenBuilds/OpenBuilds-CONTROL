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
}

// install bobscnc hex files
function installFirmware(){
 
  if ($("#flashController").val() =="E3") {
   var data = {
      port: $("#portUSB2").val(),
      file: "E3.hex",
      board: "uno",
      customImg: false
      }
  }else if($("#flashController").val() =="E4"){
   var data = {
      port: $("#portUSB2").val(),
      file: "E4.hex",
      board: "uno",
      customImg: false
      }
  }else if($("#flashController").val() =="E3SS"){
   var data = {
      port: $("#portUSB2").val(),
      file: "E3SS.hex",
      board: "uno",
      customImg: false
      }
  }else if($("#flashController").val() =="E4SS"){
   var data = {
      port: $("#portUSB2").val(),
      file: "E4SS.hex",
      board: "uno",
      customImg: false
      }
  }else if($("#flashController").val() =="Evo3"){
   var data = {
      port: $("#portUSB2").val(),
      file: "Evolution3.hex",
      board: "uno",
      customImg: false
      }
  }else if($("#flashController").val() =="Evo4"){
   var data = {
      port: $("#portUSB2").val(),
      file: "Evolution4.hex",
      board: "uno",
      customImg: false
      }
  }else if($("#flashController").val() =="Evo5"){
   var data = {
      port: $("#portUSB2").val(),
      file: "Evolution5.hex",
      board: "uno",
      customImg: false
      }
  }else if($("#flashController").val() =="Revo"){
        var data = {
           port: $("#portUSB2").val(),
           file: "Revolution.hex",
           board: "uno",
           customImg: false
           }
  }else if($("#flashController").val() =="KL733"){
   var data = {
      port: $("#portUSB2").val(),
      file: "KL733.hex",
      board: "uno",
      customImg: false
      }
  }else if($("#flashController").val() =="KL744"){
   var data = {
      port: $("#portUSB2").val(),
      file: "KL744.hex",
      board: "uno",
      customImg: false
      }
  }else if($("#flashController").val()=="KL744E"){
   var data = {
      port: $("#portUSB2").val(),
      file: "KL744E.hex",
      board: "uno",
      customImg: false
      }
  }



    socket.emit('flashGrbl', data)

      

    

  } if ($("#flashController").val() == "interface") {
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
        printLog("<span class='fg-red'>[ Flashing Firmware3 ] </span><span class='fg-red'><i class='fas fa-times fa-fw fg-red fa-fw'></i>You selected the option to use a custom firmware file, but failed to select a file to use for the operation. Please try again</span>")
      }

    } else {
      // latest included firmware
      socket.emit('flashInterface', data)
    }


  } else {
    console.log("no controller selected")
  }

// erase eeprom (eeprom.hex) on bobscnc controller before loading hex file
function startFlash(){
  if ($("#flashController").val() != "interface") {
  var data = {
    port: $("#portUSB2").val(),
    file: "eepromclear.hex",
    board: "uno",
    customImg: false
    }
  
    socket.emit('flashGrbl', data)
  } 


}


function sleep(num) {
  let now = new Date();
  let stop = now.getTime() + num;
  while(true) {
      now = new Date();
      if(now.getTime() > stop) return;
  }
}