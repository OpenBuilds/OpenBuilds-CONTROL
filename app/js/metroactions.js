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

function connectionPanel() {
  $('#connectionPanel').show()
  $('#manualControlPanel').hide()
  $('#grblPanel').hide()
  $('#updatePanel').hide()
}

function manualcontrolPanel() {
  $('#connectionPanel').hide()
  $('#manualControlPanel').show()
  $('#grblPanel').hide()
  $('#updatePanel').hide()
}

function grblPanel() {
  grblPopulate();
  $('#connectionPanel').hide()
  $('#manualControlPanel').hide()
  $('#grblPanel').show()
  $('#updatePanel').hide()
}

function updatePanel() {
  $('#connectionPanel').hide()
  $('#manualControlPanel').hide()
  $('#grblPanel').hide()
  $('#updatePanel').show()
}