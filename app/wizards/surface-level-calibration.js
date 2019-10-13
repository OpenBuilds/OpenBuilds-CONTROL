function surfaceLevelCalibrationWizard() {
  $("#gcode").empty();

  if (localStorage.getItem("lastSurfaceLevelCalibrationSettings")) {
    var data = JSON.parse(localStorage.getItem("lastSurfaceLevelCalibrationSettings"));

    $("#surfaceLevelCalibration input").each((idx,el) => {
      if (typeof data[el.name] !== 'undefined') $(el).val(data[el.name])
    });
  }

  Metro.dialog.open("#surfaceLevelCalibration");
}

function surfaceLevelCalibrationProceed() {

  var data = {};
  $("#surfaceLevelCalibration input").each((idx,el) => data[el.name] = $(el).val());

  console.log(data);

  localStorage.setItem("lastSurfaceLevelCalibrationSettings", JSON.stringify(data));
  socket.emit("surfaceLevelCalibration", data);

}
