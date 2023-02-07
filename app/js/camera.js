// IDs of the relevant HTML page elements.
CAMERA_DROPDOWN_ELEMENT = "cameraSelect";
CAMERA_IMAGE_ELEMENT = "cameraBox";


function streamSelectedCamera() {
  const deviceId = document.getElementById(CAMERA_DROPDOWN_ELEMENT).value;
  const cameraBox =  document.getElementById(CAMERA_IMAGE_ELEMENT);

  if (deviceId === "") {
    console.log('No camera selected.');
    cameraBox.srcObject = null;
    return;
  }

  navigator.mediaDevices.getUserMedia({video: {deviceId: {exact: deviceId}}})
      .then((device) => {
        cameraBox.srcObject = device;
      })
      .catch(function (err) {
        console.error(`${err.name}: ${err.message}`);
      });
}

function populateCameraDropDown() {
  navigator.mediaDevices.enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        const videoSelect = document.getElementById(CAMERA_DROPDOWN_ELEMENT);
        videoDevices.forEach((device) => {
          let option = new Option(device.label, device.deviceId);
          videoSelect.options.add(option);
        });
      })
      .catch((err) => {
        console.error(`${err.name}: ${err.message}`);
      });
}

window.addEventListener('load', function() {
    if (navigator.mediaDevices?.enumerateDevices) {
      populateCameraDropDown();
    } else {
      console.log("enumerateDevices() not supported. Cannot stream video.");
    }
})
