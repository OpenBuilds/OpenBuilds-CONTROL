"use strict";

var isJogWidget = true;

$(document).ready(function() {

  const iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

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
          caption: "No",
          cls: "js-dialog-close",
          onclick: function() {}
        }
      ]
    });
  }

  $('#jro').data('slider').val(100);
});


/* View in fullscreen */
function openFullscreen() {
  const elem = document.documentElement;
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