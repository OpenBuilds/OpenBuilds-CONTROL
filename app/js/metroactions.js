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