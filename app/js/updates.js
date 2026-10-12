"use strict";

var updateCountdown = 10

function updatesDocReady() {
// Ivo: disable update checks until there is a public version
//  checkUpdate()
}

// eslint-disable-next-line no-unused-vars
function checkUpdate() {

  if (!isMac && webgl) {

    setTimeout(function() {
      printLog("<span class='fg-darkRed'>[ update ] </span><span class='fg-darkGray'>Checking for Updates</span>")
      $.getJSON("https://api.github.com/repos/OpenBuilds/OpenBuilds-CONTROL/releases/latest", {
        crossDomain: true
      }).done(function(release) {
        let availVersion;
        if (release.name.indexOf("v") == 0) {
          availVersion = release.name.substr(1)
        } else {
          availVersion = release.name
        }

        const currentVersion = laststatus.driver.version
        if (versionCompare(availVersion, currentVersion) == 1) {
          updateCountdown = 10
          printLog("<span class='fg-darkRed'>[ Update Available! ] </span><span class='fg-green'>OpenBuilds CONTROL <code>" + availVersion + "</code>. is available now.</span>")
          printLog("<span class='fg-darkRed'>[ Update Available! ] </span><span class='fg-darkGray'>Download will start in <span class='tally' id='countdown'>10</span> seconds (<a href='#' onclick='cancelUpdateTimer();'>cancel</a>) </span>")
          printLog("<span class='fg-darkRed'>[ Update Available! ] </span><span class='fg-darkGray'>You will be prompted when its ready to be installed </span>")
          setTimeout(function() {
            updateTime();
          }, 1000);
        } else {
          printLog("<span class='fg-darkRed'>[ update ] </span><span class='fg-green'>You are already running OpenBuilds CONTROL " + currentVersion + "</span>")
          // setTimeout(function() {
          //   checkUpdate()
          // }, 60 * 60 * 1000) // 60 mins
          // disable regular check - once on startup is enough
        }
      });
    }, 1000)
  }
}


function updateTime() {
  updateCountdown--
  if (updateCountdown > 0) {
    $('#countdown').html(updateCountdown)
    setTimeout(function() {
      updateTime();
    }, 1000);
  } else if (updateCountdown == 0) {
    $('#countdown').html(updateCountdown)
    socket.emit('downloadUpdate', true)
  }
}

function cancelUpdateTimer() {
  updateCountdown = -1
  $('#countdown').html('cancelled')
  printLog("<span class='fg-darkRed'>[ Update Deferred! ] </span><span class='fg-darkGray'>No problem, we will ask you again next time</span>")
}

function onProgStatus(data) {
  $('#controlTab').click();
  $('#consoletab').click();
  let string = data.string
  if (string) {
    if (string.indexOf('flash complete') != -1) {
      setTimeout(function() {
        populatePortsMenu();
      }, 400)
    }
    string = string.replace('[31mflash complete.[39m', "<span class='fg-darkRed'><i class='fas fa-times fa-fw fg-darkRed fa-fw'> </i> FLASH FAILED!</span> ");
    string = string.replace('[32m', "<span class='fg-darkGreen'><i class='fas fa-check fa-fw fg-darkGreen fa-fw'></i> ");
    string = string.replace('[39m', "</span>");
    if (string.indexOf("Hash of data verified") != -1) {
      string = "<span class='fg-darkGreen'><i class='fas fa-check fa-fw fg-darkGreen fa-fw'></i>" + string + "</span>"
    }
    if (string.indexOf("could not open port") != -1) {
      string = "<span class='fg-darkRed'><i class='fas fa-times fa-fw fg-darkRed fa-fw'></i>" + string + "</span>"
    }
    if (string.indexOf("something went wrong") != -1) {
      string = "<span class='fg-darkRed'><i class='fas fa-times fa-fw fg-darkRed fa-fw'></i>" + string + "</span>"
    }
    if (string.indexOf("fatal error occurred") != -1) {
      string = "<span class='fg-darkRed'><i class='fas fa-times fa-fw fg-darkRed fa-fw'></i>" + string + "</span>"
    }

    if (string.indexOf("A fatal error occurred: Failed to connect to ESP32: Timed out waiting for packet header") != -1) {
      string = "<span class='fg-darkRed'>" + string + ":  Make sure the device is in BOOTLOADER MODE. Your computer failed to put it into Bootloader mode automatically. You can enter bootloader mode by: Press and hold down MODE, then Press RESET while still holding MODE. Let go of RESET, then wait a second or two and let go of MODE.  Best performed right after starting the Firmware Flashing operation."
    }

    {
      const icon = ''
      const source = " Firmware Upgrade"
      //const string = string
      const printLogCls = "fg-dark"
      printLogModern(icon, source, string, printLogCls)
    }

    if (data.code != undefined) {
      const icon = ''
      const source = " Firmware Upgrade"
      let printLogCls;
      if (data.code == 0) {
        string = "<i class='fas fa-check fa-fw fg-darkGreen fa-fw'></i> <b>Firmware Update COMPLETED!</b>  Please click the Reset button on the device now, to reboot it with the new firmware. "
        printLogCls = "fg-darkGreen"
      } else {
        string = "<i class='fas fa-times fa-fw fg-darkRed fa-fw'></i> <b>Firmware Update FAILED!</b>  Please review the logs above, or try again"
        printLogCls = "fg-darkRed"
      }
      printLogModern(icon, source, string, printLogCls)
      populatePortsMenu()
    }
  }
}
