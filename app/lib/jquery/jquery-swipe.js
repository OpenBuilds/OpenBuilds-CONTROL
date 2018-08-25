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
      console.log(event.originalEvent)
      if (event.originalEvent.touches) {
        var x = event.originalEvent.touches[0].pageX,
          y = event.originalEvent.touches[0].pageY,
          dx, dy;
      } else {
        var x = event.originalEvent.pageX,
          y = event.originalEvent.pageY,
          dx, dy;
      }


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
      if (event.originalEvent.touches) {
        originalPosition = {
          x: event.originalEvent.touches[0].pageX,
          y: event.originalEvent.touches[0].pageY
        };
      } else {
        originalPosition = {
          x: event.originalEvent.x,
          y: event.originalEvent.y
        };
      }

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