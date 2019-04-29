function cancelJog() {
  socket.emit('stop', true)
}