var ip = require("ip");
const net = require('net');
const Evilscan = require('evilscan');

var localNetwork = ip.address().split('.');
var network = localNetwork[0] + '.' + localNetwork[1] + '.' + localNetwork[2];
var range = network + ".1-" + network + ".254"

var networkDevices = []

const options = {
  target: range,
  port: '23',
  status: 'TROU', // Timeout, Refused, Open, Unreachable
  banner: true
};

new Evilscan(options, (err, scan) => {

  if (err) {
    //console.log(err);
    return;
  }

  scan.on('result', data => {
    // fired when item is matching options
    //console.log(data);
    if (data.status == "open") {
      var type = false
      if (data.banner.indexOf("GrblHAL") != -1) {
        type = "grblHAL"
      } else if (data.banner.indexOf("Grbl") != -1) {
        type = "grbl"
      }
      networkDevices.push({
        ip: data.ip,
        type: type,
        banner: data.banner
      })
    }

  });

  scan.on('error', err => {
    //throw new Error(data.toString());
  });

  scan.on('done', () => {
    // finished !
    console.log(networkDevices);
  });

  scan.run();
});