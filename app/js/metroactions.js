$(document).ready(function() {
  //nothing
});

function confirmQuit() {
  Metro.dialog.create({
    title: "Are you sure you want to Quit?",
    content: "<div>This will will close the connection to the machine, abort any running jobs, and shutdown OpenBuilds CONTROL</div>",
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
}

function grblPanel() {
  grblPopulate();
  $('#manualControlPanel').hide()
  $('#grblPanel').show()
  $('#updatePanel').hide()
  $('#troubleshootingPanel').hide()
}

function updatePanel() {
  $('#manualControlPanel').hide()
  $('#grblPanel').hide()
  $('#updatePanel').show()
  $('#troubleshootingPanel').hide()
}

function troubleshootingPanel() {
  $('#manualControlPanel').hide()
  $('#grblPanel').hide()
  $('#updatePanel').hide()
  $('#troubleshootingPanel').show()
}