function populateFlashDrivePrepForm() {
  Metro.dialog.open("#usbPrepDialog");

}

function copyFilesToUsb() {

  if ($("#profileTargetController").val() != "") {
    $('#controlTab').click();
    $('#consoletab').click();
    data = {
      drive: $("#UsbDriveList").val(),
      controller: $("#profileTargetController").val()
    }
    socket.emit("writeInterfaceUsbDrive", data)
    Metro.dialog.close("#usbPrepDialog");
  } else {
    Metro.dialog.create({
      title: "No controller selected",
      clsDialog: "dark",
      totop: "true",
      content: `
           Please tell us whether you intend using the OpenBuilds Interface with a BlackBox 4X controller, or a BlackBox X32 controller. This will ensure we copy the correct required files to the USB drive to enable your Interface to work with the controller
       `,
      actions: [{
        caption: "Try again",
        cls: "js-dialog-close alert",
        // onclick: function() {
        //   macro1repeat = false;
        //   printLog("Repeating Macro Exited")
        // }
      }]
    });
  }

}