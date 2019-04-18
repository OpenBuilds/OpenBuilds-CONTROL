var realTimeJog

function cancelJog() {
  clearInterval(realTimeJog)
  socket.emit('stop', false)
  // console.log('stopped jog')
}