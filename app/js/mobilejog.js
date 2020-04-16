var isJogWidget = true;

$(document).ready(function() {

  var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

  if (!iOS) {
    Metro.dialog.create({
      title: "Fullscreen View",
      content: "<div>Would you like to view Jog in Fullscreen mode?</div>",
      actions: [{
          caption: "Yes",
          cls: "js-dialog-close success",
          onclick: function() {
            openFullscreen()
          }
        },
        {
          caption: "Cancel",
          cls: "js-dialog-close",
          onclick: function() {
            //
          }
        }
      ]
    });
  }

});

var elem = document.documentElement;

/* View in fullscreen */
function openFullscreen() {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    /* Firefox */
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) {
    /* Chrome, Safari and Opera */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    /* IE/Edge */
    elem.msRequestFullscreen();
  }
}