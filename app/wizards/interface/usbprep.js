function populateFlashDrivePrepForm() {

  var interfacePrepToolTemplate = `
  <div class="row">
    <div class="cell-md-4 mb-1">

      <img src="img/interface/interfacev1.png" width="150" class="mt-5" />
    </div>
    <div class="cell-md-8 mb-1">
      <ul>
        <li class="text-secondary">Insert the USB flashdrive into this computer</li>
        <li class="text-secondary">Enter the required options</li>
        <li class="text-secondary">Select the correct drive below</li>
        <li class="text-secondary">Click COPY to transfer the files</li>
        <li class="text-secondary">Eject the flashdrive </li>
        <li class="text-secondary">Insert it into the Interface</li>
      </ul>
    </div>
  </div>

  <hr>
  <div class="row">
    <div class="cell-md-12 mb-2 mt-2 text-small text-center">
      Select the type of controller the Interface is / will be attached to so we can ensure the correct supporting files are copied to the USB drive
    </div>
  </div>

  <div class="row">
    <div class="cell-md-5 mb-1">
      Target Controller
    </div>
    <div class="cell-md-7 mb-1">
      <select onchange="interfaceReadyToCopy()" data-prepend="&nbsp;<i class='fas fa-microchip'></i>" data-role="select" data-filter="false" id="profileTargetController" data-editable="true" data-to-top="true">
        <option value="" selected>Select a controller</option>
        <option value="blackbox4x">OpenBuilds BlackBox 4X</option>
        <option value="blackboxx32">OpenBuilds BlackBox X32</option>
        <option value="genericgrbl">Generic Grbl 1.1 Controller</option>
        <option value="genericgrblhal">Generic GrblHAL Controller</option>
      </select>
    </div>
  </div>

  <hr>
  <div class="row">
    <div class="cell-md-12 mb-2 mt-2 text-small text-center">
      You can also enter your Wifi details, if you'd like the Interface to connect to your Wifi Network<br>(Requires Interface Firmware V1.58 or later)
    </div>
  </div>


  <div class="row">
    <div class="cell-md-5 mb-1">
      Wifi Network Name (SSID)
    </div>
    <div class="cell-md-7 mb-1">
      <input id="interface-wifi-ssid" data-role="input" data-clear-button="false" data-append="SSID" type="text" >
    </div>
  </div>

  <div class="row">
    <div class="cell-md-5 mb-1">
      Wifi Network Password (PSK)
    </div>
    <div class="cell-md-7 mb-1">
      <input id="interface-wifi-psk" data-role="input" data-clear-button="false" data-append="PSK" type="text" >
    </div>
  </div>

  <hr>
  <div class="row">
    <div class="cell-md-12 mb-2 mt-2   text-small text-center">
      Select the USB drive you are going to use with the Interface
    </div>
  </div>


  <div class="row">
    <div class="cell-md-5 mb-1">
      Target USB Drive
    </div>
    <div class="cell-md-7 mb-1">
      <button style="width: 100%;" id="interfaceDriveLetterBtn" type="button" class="button" onclick="socket.emit('openInterfaceDir')"><i class='fab fa-usb'></i> Select USB Flashdrive</button>
    </div>
  </div>
  `
  //Metro.dialog.open("#usbPrepDialog");
  Metro.dialog.create({
    title: "Prepare USB drive for Interface",
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
      caption: "Copy Supporting Files and Wifi Configuration to Flashdrive",
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
    controller: $("#profileTargetController").val(),
    ssid: $("#interface-wifi-ssid").val(),
    psk: $("#interface-wifi-psk").val()
  }
  socket.emit("writeInterfaceUsbDrive", data)
  Metro.dialog.close("#usbPrepDialog");

}