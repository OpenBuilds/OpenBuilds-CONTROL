window.macro1repeat = false;
window.macro1interval;
window.macro1interation = 0;

window.runRepeatingGcode = function() {
  macro1repeat = true; // set flag
  window.macro1interval = setInterval(function() {
    if (macro1repeat) {
      if (laststatus.comms.connectionStatus == 2) {
        macro1interation++;
        $("#macro1log").html("running: iteration: " + macro1interation)
        socket.emit("runJob", {
          data: editor.getValue(),
          isJob: false,
          completedMsg: false
        });
      }
    } else {
      $("#macro1log").html("Stopping...")
      socket.emit('stop', false)
      clearInterval(window.macro1interval);
    }
  }, 100)
}

// since we have metro, use Metro.dialog https://metroui.org.ua/dialog.html to make a UI
Metro.dialog.create({
  title: "My looping Macro",
  content: `
           <button class="button info" onclick="runRepeatingGcode()">Run</button>
           <button class="button info" onclick="macro1repeat = false;">Stop</button>
           <hr>
           <span id="macro1log">pending run...</span>
       `,
  actions: [{
    caption: "Stop and close this window",
    cls: "js-dialog-close alert",
    onclick: function() {
      macro1repeat = false;
      printLog("<span class='fg-red'>[ custom macro ]</span><span class='fg-darkGray'>Repeating Macro Exited</span>")
    }
  }]
});