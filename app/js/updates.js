"use strict";

function getReleaseStats() {
  const url = "https://api.github.com/repos/" + laststatus.misc.repoName + "/releases/latest";
  $.getJSON(url, function(data) {

    let downloadCount = 0;
    for (const asset of data.assets) {
      let name = asset.name.toLowerCase();
      if (name.endsWith(".exe")) {
        downloadCount = downloadCount + asset.download_count;
      }
      else if (name.endsWith(".dmg")) {
        downloadCount = downloadCount + asset.download_count;
      }
      else if (name.endsWith(".zip")) {
        downloadCount = downloadCount + asset.download_count;
      }
      else if (name.endsWith(".deb")) {
        downloadCount = downloadCount + asset.download_count;
      }
      else if (name.endsWith(".appimage")) {
        downloadCount = downloadCount + asset.download_count;
      }
    }

    $("#releaseStats").html("The latest version has already been downloaded " + downloadCount +
      " times since its release on " + new Date(data.published_at).toLocaleDateString() + ".");
  });
}

function setChangelog(changelogText) {
  let template = `<ul>`;
  for (let line of changelogText.split('\n')) {
    template += '<li>' + line + '</li>';
  }
  template += `</ul>`;

  $("#changelog").html(template);
}

function downloadAndInstall() {
  let template = `
  <div class="dialog-content">
    <div id="installProgress" data-role="progress" data-value="0"></div>
  </div>`;

  Metro.dialog.create({
    title: "Download Update",
    content: template,
    width: 600,
    clsDialog: 'dark',
    actions: [{
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {
          socket.emit('cancelUpdate');
        }
      }
    ]
  });

  socket.emit('downloadAndInstall');
}

function onUpdateAvailable(info) {
  if (localStorage.getItem('skipVersion') == info.version) {
    const icon = '';
    const source = "autoupdate";
    const string = "Ignoring update to version " + info.version + " because of a request to skip it.";
    const printLogCls = "fg-darkRed";
    printLogModern(icon, source, string, printLogCls);
    return;
  }

  if (laststatus.comms.connectionStatus > 2 || continuousJogRunning) {
    const icon = '';
    const source = "autoupdate";
    const string = "Ignoring update to version " + info.version + " because the machine is busy.";
    const printLogCls = "fg-darkRed";
    printLogModern(icon, source, string, printLogCls);
    return; // for the unlikely event that the user manages to connect to a controller and starts using it
  }

  let template = `
  <div class="dialog-content">
    A new version ` + info.version + ` of OpenBuilds CONTROL is available for download.<br>
    <h6>What's new since v` + laststatus.driver.version + `</h6>
    <div class="text-small bd-openbuilds" style="max-height:300px; overflow-y:auto; padding:2px 10px; border:solid 1px;">
    <style>p { margin-top: 5px; }</style>
    `;

  for (const note of info.releaseNotes) {
    template += `<b> v` + note.version + `</b><div style="padding-left:10px">`;
    template += note.note;
    template += `</div>`;
  }

  template += `
    </div>
    <br><i><span id="releaseStats"></span></i>
  </div>`;

  Metro.dialog.create({
    title: "Update Available",
    content: template,
    width: 600,
    clsDialog: 'dark',
    actions: [{
        caption: info.canInstall ? "Download and Install" : "Download",
        cls: "js-dialog-close success",
        onclick: function() {
          if (info.canInstall) {
            downloadAndInstall();
          } else {
            socket.emit('openUpdatePage');
          }
        }
      },
      {
        caption: "Skip this version",
        cls: "js-dialog-close",
        onclick: function() {
          localStorage.setItem('skipVersion', info.version);
        }
      },
      {
        caption: "Ask Next Time",
        cls: "js-dialog-close",
        onclick: function() {}
      }
    ]
  });

  getReleaseStats();
}

function updatesFirstStatus() {
  socket.on('updatedata', function(data) {
    const icon = '';
    const source = data.command;
    const string = data.response;
    const printLogCls = "fg-darkGreen";
    printLogModern(icon, source, string, printLogCls);
  });

  socket.on('update-available', onUpdateAvailable);

  socket.on('download-progress', function(data) {
    if (data >= 0) {
      $('#installProgress').data('progress').val(data);
    } else {
      const icon = '';
      const source = "autoupdate";
      const string = "The download was canceled.";
      const printLogCls = "fg-darkRed";
      printLogModern(icon, source, string, printLogCls);
    }
  });

  if (!laststatus.misc.enableUpdates) {
    const icon = '';
    const source = "autoupdate";
    const string = "The check for software updates is disabled.";
    const printLogCls = "fg-darkRed";
    printLogModern(icon, source, string, printLogCls);
  }
}
