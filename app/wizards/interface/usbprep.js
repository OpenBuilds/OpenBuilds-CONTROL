function populateFlashDrivePrepForm() {
  Metro.dialog.open("#usbPrepDialog");

}

function copyFilesToUsb() {
  $('#controlTab').click();
  $('#consoletab').click();
  socket.emit("writeInterfaceUsbDrive", $("#UsbDriveList").val())
}