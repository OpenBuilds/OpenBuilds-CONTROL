var time = 10
$(document).ready(function() {
  checkUpdate()
});

function checkUpdate() {
  if (!isMac && webgl) {
    setTimeout(function() {
      // console.log('checking for update')
      printLog("<span class='fg-red'>[ update ] </span><span class='fg-green'>Checking for Updates</span>")
      $.getJSON("https://api.github.com/repos/OpenBuilds/OpenBuilds-CONTROL/releases/latest?client_id=fbbb80debc1197222169&client_secret=7dc6e463422e933448f9a3a4150c8d2bbdd0f87c").done(function(release) {
        var availVersion = release.name.substr(1)
        var currentVersion = laststatus.driver.version
        // console.log(versionCompare(availVersion, currentVersion), availVersion, currentVersion);
        if (versionCompare(availVersion, currentVersion) == 1) {
          console.log('outdated')
          time = 10
          printLog("<span class='fg-red'>[ Update Available! ] </span><span class='fg-green'>OpenBuilds CONTROL <code>" + availVersion + "</code>. is available now.</span>")
          printLog("<span class='fg-red'>[ Update Available! ] </span><span class='fg-green'>Download will start in <span class='tally' id='countdown'>10</span> seconds (<a href='#' onclick='cancelTimer();'>cancel</a>) </span>")
          printLog("<span class='fg-red'>[ Update Available! ] </span><span class='fg-green'>You will be prompted when its ready to be installed </span>")
          setTimeout(function() {
            updateTime();
          }, 1000);
        } else {
          printLog("<span class='fg-red'>[ update ] </span><span class='fg-green'>You are already running OpenBuilds CONTROL " + currentVersion + "</span>")
          setTimeout(function() {
            checkUpdate()
          }, 15 * 60 * 1000) // 15 mins
        }
      });
    }, 1000)
  }
}


function updateTime() {
  time--
  if (time > 0) {
    $('#countdown').html(time)
    setTimeout(function() {
      updateTime();
    }, 1000);
  } else if (time == 0) {
    $('#countdown').html(time)
    socket.emit('downloadUpdate', true)
  }
}

function cancelTimer() {
  time = -1
  $('#countdown').html('cancelled')
  printLog("<span class='fg-red'>[ Update Deferred! ] </span><span class='fg-green'>No problem, we will ask you again next time</span>")
}