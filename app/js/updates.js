"use strict";

var updateCountdown;

function versionCompare(v1, v2, options) {
  const lexicographical = options && options.lexicographical;
  const zeroExtend = options && options.zeroExtend;
  let v1parts = v1.split('.');
  let v2parts = v2.split('.');

  function isValidPart(x) {
    return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
  }

  if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
    return NaN;
  }

  if (zeroExtend) {
    while (v1parts.length < v2parts.length) v1parts.push("0");
    while (v2parts.length < v1parts.length) v2parts.push("0");
  }

  if (!lexicographical) {
    v1parts = v1parts.map(Number);
    v2parts = v2parts.map(Number);
  }

  for (let i = 0; i < v1parts.length; ++i) {
    if (v2parts.length == i) {
      return 1;
    }

    if (v1parts[i] == v2parts[i]) {
      continue;
    } else if (v1parts[i] > v2parts[i]) {
      return 1;
    } else {
      return -1;
    }
  }

  if (v1parts.length != v2parts.length) {
    return -1;
  }

  return 0;
}

function getReleaseStats() {
  const url = "https://api.github.com/repos/" + laststatus.misc.repoName + "/releases/latest";
  $.getJSON(url, function(data) {
    console.log(data)
    const assets = data.assets;
    let downloadCount = 0
    for (let i = 0; i < assets.length; i++) {
      if (assets[i].name.indexOf("exe") != -1) {
        downloadCount = downloadCount + assets[i].download_count;
      }
      if (assets[i].name.indexOf("dmg") != -1) {
        downloadCount = downloadCount + assets[i].download_count;
      }
      if (assets[i].name.indexOf("zip") != -1) {
        downloadCount = downloadCount + assets[i].download_count;
      }
      if (assets[i].name.indexOf("AppImage") != -1) {
        downloadCount = downloadCount + assets[i].download_count;
      }
    }
    console.log("Latest version has already been installed " + downloadCount + " times")
    $("#releaseStats").html(downloadCount)
    $("#releaseDate").html(data.published_at.split("T")[0])
  });
}

function getChangelog() {
  $("#changelog").empty();

  $.get("https://raw.githubusercontent.com/" + laststatus.misc.repoName + "/master/CHANGELOG.txt?date=" + new Date().getTime(), function(data) {
    const lines = data.split('\n', 12);

    let template = `<ul>`;
    for (let line = 0; line < lines.length; line++) {
      template += '<li>' + lines[line] + '</li>';
    }
    template += `</ul>`;

    $("#changelog").html(template);
    $("#changelogupdate").html("<h6>Changelog:</h6><hr>" + template);
  });
}

function handleNewVersion(currentVersion, latestVersion) {
  if (laststatus.driver.platform == "win32") {
    // Auto-update is only supported for Windows.
    // The original OpenBuilds disables it for Mac for some unknown reason.
    // On Linux it doesn't work for Deb files. Maybe in the future enable it for the AppImage case.
    updateCountdown = 10;
    printLog("<span class='fg-darkRed'>[ Update Available! ] </span><span class='fg-green'>OpenBuilds CONTROL <code>" + latestVersion + "</code>. is available now.</span>")
    printLog("<span class='fg-darkRed'>[ Update Available! ] </span><span class='fg-darkGray'>Download will start in <span class='tally' id='countdown'>10</span> seconds (<a href='#' onclick='cancelUpdateTimer();'>cancel</a>) </span>")
    printLog("<span class='fg-darkRed'>[ Update Available! ] </span><span class='fg-darkGray'>You will be prompted when its ready to be installed </span>")
    $('#consoletab').click();
    setTimeout(function() {
      updateTime();
    }, 1000);
  } else {
    let template = `
    <div class="dialog-content">
      OpenBuilds-CONTROL v` + latestVersion + ` is available to be downloaded.<br>
      <p id="changelogupdate" class="text-small"></p>
      This release has already been downloaded <span id="releaseStats">several</span> times since its release on <span id="releaseDate"></span>
    </div>`;

    Metro.dialog.create({
      toTop: true,
      title: "Update Available",
      content: template,
      width: 600,
      clsDialog: 'dark',
      actions: [{
          caption: "Open Download Page",
          cls: "js-dialog-close success",
          onclick: function() {
            socket.emit('openUpdatePage');
          }
        },
        {
          caption: "Skip this version",
          cls: "js-dialog-close",
          onclick: function() {
            localStorage.setItem('skipVersion', latestVersion);
          }
        },
        {
          caption: "Update later",
          cls: "js-dialog-close",
          onclick: function() {}
        }
      ]
    });

    getReleaseStats();
    getChangelog();
  }
}

// eslint-disable-next-line no-unused-vars
function checkUpdate() {
  setTimeout(function() {
    printLog("<span class='fg-darkRed'>[ update ] </span><span class='fg-darkGray'>Checking for Updates</span>")
    $.getJSON("https://api.github.com/repos/" + laststatus.misc.repoName + "/releases/latest", {
      crossDomain: true
    }).done(function(release) {
      let latestVersion;
      if (release.name.indexOf("v") == 0) {
        latestVersion = release.name.substr(1);
      } else {
        latestVersion = release.name;
      }

      const currentVersion = laststatus.driver.version;
      if (localStorage.getItem('skipVersion') == latestVersion) {
        printLog("<span class='fg-darkRed'>[ update ] </span><span class='fg-green'>Skipping upgrade to version " + latestVersion + "</span>")
      } else if (versionCompare(latestVersion, currentVersion) != 1) {
        printLog("<span class='fg-darkRed'>[ update ] </span><span class='fg-green'>You are already running OpenBuilds CONTROL " + currentVersion + "</span>")
      } else {
        handleNewVersion(currentVersion, latestVersion);
      }
    });
  }, 1000);
}


function updateTime() {
  updateCountdown--;
  if (updateCountdown > 0) {
    $('#countdown').html(updateCountdown);
    setTimeout(updateTime, 1000);
  } else if (updateCountdown == 0) {
    $('#countdown').html(updateCountdown);
    socket.emit('downloadUpdate', true);
  }
}

function cancelUpdateTimer() {
  updateCountdown = -1;
  $('#countdown').html('cancelled')
  printLog("<span class='fg-darkRed'>[ Update Deferred! ] </span><span class='fg-darkGray'>No problem, we will ask you again next time</span>")
}

function onUpdateReady(latestVersion) {
  if (laststatus.comms.connectionStatus > 2 || continuousJogRunning) {
    return;
  }

  let template = `
  <div class="dialog-content">
    OpenBuilds-CONTROL v` + latestVersion + ` has finished downloading and is ready to be installed.<br>
    <small>Note that proceeding will:
      <ul>
        <li>Stop any running jobs</li>
        <li>Shut down this instance of OpenBuilds CONTROL</li>
        <li>Launch the installer for the new version</li>
      </ul>
    </small>
    <small>You may want to wait until your machine is idle, and it it's a convenient time for you to do this, before continuing</small>
    <p id="changelogupdate" class="text-small"></p>
    This release has already been downloaded <span id="releaseStats">several</span> times since its release on <span id="releaseDate"></span>
  </div>`;

  Metro.dialog.create({
    toTop: true,
    title: "Update Ready",
    content: template,
    width: 600,
    clsDialog: 'dark',
    actions: [{
        caption: "OK, Proceed with Update",
        cls: "js-dialog-close success",
        onclick: function() {
          socket.emit('applyUpdate');
        }
      },
      {
        caption: "Skip this version",
        cls: "js-dialog-close",
        onclick: function() {
          localStorage.setItem('skipVersion', latestVersion);
        }
      },
      {
        caption: "Update later",
        cls: "js-dialog-close",
        onclick: function() {}
      }
    ]
  });

  getReleaseStats();
  getChangelog();
}

function updatesFirstStatus() {
// Ivo: disable update checks until there is a public version
//  checkUpdate();

  getChangelog();

  socket.on('updatedata', function(data) {
    const icon = '';
    const source = data.command;
    const string = data.response;
    const printLogCls = "fg-darkGreen";
    printLogModern(icon, source, string, printLogCls);
  });

  socket.on('updateready', onUpdateReady);

  socket.on('updateprogress', function(data) {
    $('#downloadprogress').html(data + "%");
  });
}
