var draw;
var line;

SVG.on(document, 'DOMContentLoaded', function() {
  draw = SVG('svgview')
})

$(document).ready(function() {
  $("#svgview").swipe(function(direction, offset, eventstate) {
    event.preventDefault();
    draw.clear()
    console.log("Moving", direction.x, "and", direction.y);
    console.log("Touch moved by", offset.x, "horizontally and", offset.y, "vertically");
    console.log("Event state ", eventstate)
    var height = draw.node.clientHeight;
    var width = draw.node.clientWidth;
    line = draw.line(width / 2, height / 2, (width / 2) + offset.x, (height / 2) + offset.y * -1).stroke({
      width: 5
    })
    if (eventstate == 'up') {
      var feedrate = $('#jograte').val();
      jogXY((offset.x / 10).toFixed(2), (offset.y / 10).toFixed(2), feedrate)
      Metro.toast.create("Delta move: X: " + (offset.x / 10).toFixed(2) + " / Y: " + (offset.y / 10).toFixed(2), null, 1000);
      setTimeout(function() {
        draw.clear()
      }, 1000)

    }
  });
});