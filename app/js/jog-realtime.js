var curvalue = 0; // set externally from websocket
var direction = 'X-'; // X-, X, Y-, Y, Z-, Z // set externally from websocket
var realTimeJog

function startJog(direction, feed) {
  realTimeJog = setInterval(function() {
    // socket.emit('realtimeCommand', "$J=G91 G21 " + direction + "1 F" + feed + "\n");
    socket.emit('runCommand', "$J=G91 G21 X+100 F10000\n");
  }, 20);
}

function cancelJog() {
  clearInterval(realTimeJog);
  socket.emit('realtimeJogCancel', true)
}