function manualcontrolPanel() {
  $('#manualControlPanel').show()
  $('#grblPanel').hide()
  $('#fluidncPanel').hide()
  $('#updatePanel').hide()
  $('#troubleshootingPanel').hide()
}

function grblPanel() {
  grblPopulate();
  $('#manualControlPanel').hide()
  $('#grblPanel').show()
  $('#fluidncPanel').hide()
  $('#updatePanel').hide()
  $('#troubleshootingPanel').hide()
}

function fluidncPanel() {
  //grblPopulate();
  $('#manualControlPanel').hide()
  $('#grblPanel').hide()
  $('#fluidncPanel').show()
  $('#updatePanel').hide()
  $('#troubleshootingPanel').hide()
}

function updatePanel() {
  $('#manualControlPanel').hide()
  $('#grblPanel').hide()
  $('#fluidncPanel').hide()
  $('#updatePanel').show()
  $('#troubleshootingPanel').hide()
}

function troubleshootingPanel() {
  $('#manualControlPanel').hide()
  $('#grblPanel').hide()
  $('#fluidncPanel').hide()
  $('#updatePanel').hide()
  $('#troubleshootingPanel').show()
}