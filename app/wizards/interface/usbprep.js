function populateFlashDrivePrepForm() {

  var interfacePrepToolTemplate = `
  This wizard will help you add the supporting files to a USB flashdrive for use with OpenBuilds Interface
  <hr>
  <div class="row">
    <div class="cell-md-3 mb-1">

      <img src="img/interface/interfacev1.png" width="150" class="mt-5" />
    </div>
    <div class="cell-md-9 mb-1">
      <ul>
        <li class="text-secondary">Insert the USB flashdrive into this computer</li>
        <li class="text-secondary">Select the correct controller below</li>
        <li class="text-secondary">Select the correct drive below</li>
        <li class="text-secondary">Click COPY to transfer the files</li>
        <li class="text-secondary">Eject the flashdrive </li>
        <li class="text-secondary">Insert it into the Interface</li>
      </ul>
    </div>
  </div>
  <hr>

  <div class="row">
    <div class="cell-md-3 mb-1">
      Controller
    </div>
    <div class="cell-md-9 mb-1">
      <select onchange="interfaceReadyToCopy()" data-prepend="&nbsp;<i class='fas fa-microchip'></i>" data-role="select" data-filter="false" id="profileTargetController" data-editable="true" data-to-top="true">
        <option value="" selected>Select a controller</option>
        <option value="blackbox4x">OpenBuilds BlackBox 4X</option>
        <option value="blackboxx32">OpenBuilds BlackBox X32</option>
        <option value="genericgrbl">Generic Grbl 1.1 Controller</option>
        <option value="genericgrblhal">Generic GrblHAL Controller</option>
      </select>
    </div>
  </div>

  <div class="row">
    <div class="cell-md-3 mb-1">
      USB Drive
    </div>
    <div class="cell-md-9 mb-1">
      <button style="width: 100%;" id="interfaceDriveLetterBtn" type="button" class="button" onclick="socket.emit('openInterfaceDir')"><i class='fab fa-usb'></i> Select USB Flashdrive</button>
      <!-- <select data-prepend="&nbsp;<i class='fab fa-usb'></i>" data-role="select" data-filter="false" id="UsbDriveList" disabled data-editable="true" data-to-top="true">
        <option value="">Waiting for USB Flashdrive</option>
      </select> -->
    </div>
  </div>
  `
  //Metro.dialog.open("#usbPrepDialog");
  Metro.dialog.create({
    title: "No controller selected",
    clsDialog: "dark",
    totop: "true",
    width: "60%",
    content: interfacePrepToolTemplate,
    actions: [{
      caption: "Cancel",
      cls: "js-dialog-close alert",
      // onclick: function() {
      //   macro1repeat = false;
      //   printLog("Repeating Macro Exited")
      // }
    }, {
      caption: "Copy supporting files to Flashdrive",
      cls: "js-dialog-close success disabled interfaceCopyBtn",
      onclick: function() {
        copyFilesToUsb()
      }
    }]
  });

}

function interfaceReadyToCopy() {
  // drive: laststatus.interface.diskdrive,
  // controller: $("#profileTargetController").val()
  if ($("#interfaceDriveLetterBtn").html() == "<i class='fab fa-usb'></i> Select USB Flashdrive" && $("#profileTargetController").val() != "") {
    $(".interfaceCopyBtn").removeClass('disabled');
  }

}

function copyFilesToUsb() {

  $('#controlTab').click();
  $('#consoletab').click();
  data = {
    drive: laststatus.interface.diskdrive,
    controller: $("#profileTargetController").val()
  }
  socket.emit("writeInterfaceUsbDrive", data)
  Metro.dialog.close("#usbPrepDialog");

}