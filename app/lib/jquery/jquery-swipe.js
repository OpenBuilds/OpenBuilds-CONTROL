//  From http://blog.blakesimpson.co.uk/read/51-swipe-js-detect-touch-direction-and-distance


// Usage:

// $("body").swipe(function( direction, offset ) {
//   console.log( "Moving", direction.x, "and", direction.y );
//   console.log( "Touch moved by", offset.x, "horizontally and", offset.y, "vertically" );
// });

$(function() {
  $.fn.swipe = function(callback) {
    var touchDown = false,
      originalPosition = null,
      $el = $(this);
    var info = {
      direction: false,
      offset: false,
      eventstate: false
    };

    function swipeInfo(event) {

      // console.log(event.originalEvent.touches[0])
      var x = event.originalEvent.touches[0].pageX,
        y = event.originalEvent.touches[0].pageY,
        dx, dy;

      dx = (x > originalPosition.x) ? "right" : "left";
      dy = (y > originalPosition.y) ? "down" : "up";

      return {
        direction: {
          x: dx,
          y: dy
        },
        offset: {
          x: x - originalPosition.x,
          y: originalPosition.y - y
        }
      };
    }

    $el.on("touchstart mousedown", function(event) {
      touchDown = true;
      info.eventstate = 'down';
      originalPosition = {
        x: event.originalEvent.touches[0].pageX,
        y: event.originalEvent.touches[0].pageY
      };
      callback(info.direction, info.offset, info.eventstate, originalPosition);
    });

    $el.on("touchend mouseup", function() {
      touchDown = false;
      info.eventstate = 'up';
      originalPosition = null;
      callback(info.direction, info.offset, info.eventstate, originalPosition);
    });

    $el.on("touchmove mousemove", function(event) {
      if (!touchDown) {
        return;
      }
      info = swipeInfo(event);
      info.eventstate = 'move';
      callback(info.direction, info.offset, info.eventstate, originalPosition);
    });

    return true;
  };
});