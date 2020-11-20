function flashGrblfromTroubleshooting() {
  var data = {
    port: $("#portUSB").val(),
    file: $("#flashGrblHex").val(),
    board: $("#flashGrblController").val()
  }
  socket.emit('flashGrbl', data)
}

function populateGrblBuilderToolForm() {
  //$("#filetoflash").empty();
  Metro.dialog.open("#grblFlashDialog");
}

function flashGrblfromWizard() {
  var formdata = {
    axesCount: $("#grblAxesCount").val(),
    door: $("#grblDoorEnable").val(),
    flashGrblController: $("#flashGrblController").val(),
    port: $("#portUSB2").val()
  };

  $("#filetoflash").html('run file: ' + JSON.stringify(formdata));
  $("#filetoflash").append("<hr>grbl-" + formdata.axesCount + "-" + formdata.door + ".hex");

  var data = {
    port: $("#portUSB").val(),
    file: "grbl-" + formdata.axesCount + "-" + formdata.door + ".hex",
    board: $("#flashGrblController").val()
  }
  socket.emit('flashGrbl', data)
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