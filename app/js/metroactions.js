"use strict";

function manualcontrolPanel() {
  $('#manualControlPanel').show()
  $('#grblPanel').hide()
  $('#troubleshootingPanel').hide()
}

function grblPanel() {
  grblPopulate();
  $('#manualControlPanel').hide()
  $('#grblPanel').show()
  $('#troubleshootingPanel').hide()
}

function troubleshootingPanel() {
  $('#manualControlPanel').hide()
  $('#grblPanel').hide()
  $('#troubleshootingPanel').show()
}