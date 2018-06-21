$(document).ready(function() {
  document.addEventListener('keydown', function(evt) {
    if (evt.which === 123) {
      try {
        var focusedWindow = require('electron').remote.getCurrentWindow();
        if (focusedWindow.isDevToolsOpened()) {
          focusedWindow.closeDevTools();
        } else {
          focusedWindow.openDevTools();
        }
      } catch (error) {
        console.warn(error);
      }
    } else if (evt.which === 116) {
      location.reload();
    }
  });
});