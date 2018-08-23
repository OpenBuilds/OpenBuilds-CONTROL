$(document).ready(function() {
  //nothing
});

function confirmQuit() {
  Metro.dialog.create({
    title: "Are you sure you want to Quit?",
    content: "<div>This will will close the connection to the machine, abort any running jobs, and shutdown the OpenBuilds Machine Driver</div>",
    actions: [{
        caption: "Yes, Quit!",
        cls: "js-dialog-close alert",
        onclick: function() {
          // alert("You clicked Agree action");
          socket.emit('quit')
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {
          // alert("You clicked Disagree action");
        }
      }
    ]
  });
}


function manualcontrolPanel() {
  $('#manualControlPanel').show()
  $('#grblPanel').hide()
  $('#updatePanel').hide()
  $('#troubleshootingPanel').hide()
  $('#gamepadPanel').hide()
}

function grblPanel() {
  grblPopulate();
  $('#manualControlPanel').hide()
  $('#grblPanel').show()
  $('#updatePanel').hide()
  $('#troubleshootingPanel').hide()
  $('#gamepadPanel').hide()
}

function updatePanel() {
  $('#manualControlPanel').hide()
  $('#grblPanel').hide()
  $('#updatePanel').show()
  $('#troubleshootingPanel').hide()
  $('#gamepadPanel').hide()
}

function troubleshootingPanel() {
  $('#manualControlPanel').hide()
  $('#grblPanel').hide()
  $('#updatePanel').hide()
  $('#troubleshootingPanel').show()
  $('#gamepadPanel').hide()
}

function gamepadPanel() {
  $('#manualControlPanel').hide()
  $('#grblPanel').hide()
  $('#updatePanel').hide()
  $('#troubleshootingPanel').hide()
  $('#gamepadPanel').show()
}