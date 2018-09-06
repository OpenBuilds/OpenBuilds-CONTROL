self.addEventListener('message', function(e) {
  importScripts("/lib/threejs/three.min.js");
  var data = e.data;
  var result = parseGcode(e.data.data);
  self.postMessage(result.toJSON());
}, false);

var object;
var lastpos = {
  x: 0,
  y: 0,
  z: 0
};

function parseGcode(input) {
  const lines = input
    .split('\n')
  // .filter(l => l.length > 0); // discard empty lines
  const commands = lines.map(parseLine);
  lastpos = {
    x: 0,
    y: 0,
    z: 0
  };
  var object = new THREE.Group();
  var cmdindex = 0;
  for (let cmd of commands) {
    var geometry = new THREE.Geometry();
    var oldVector = new THREE.Vector3(lastpos.x, lastpos.y, lastpos.z)
    var newVector = new THREE.Vector3(newx(cmd, lastpos), newy(cmd, lastpos), newz(cmd, lastpos))
    geometry.vertices.push(oldVector);
    geometry.vertices.push(newVector);
    var distance = distanceVector(oldVector, newVector);
    if (distance > 0) {
      var fr;
      if (cmd.f > 0) {
        fr = cmd.f;
      } else {
        fr = 5000;
      }
      var timeMinutes = distance / fr;
      // adjust for acceleration
      var timeSeconds = (timeMinutes * 1.32) * 60;
    }
    var line = false;
    if (cmd.g == 0) {
      var material = new THREE.LineBasicMaterial({
        color: 0x00cc00
      });
      line = new THREE.Line(geometry, material);
      line.userData.cmd = cmd
      line.userData.distance = distance
      line.userData.time = timeSeconds
      line.userData.index = cmdindex;
      object.add(line);
    } else if (cmd.g == 1) {
      var material = new THREE.LineBasicMaterial({
        color: 0xcc0000
      });
      line = new THREE.Line(geometry, material);
      line.userData.cmd = cmd
      line.userData.distance = distance
      line.userData.time = timeSeconds
      line.userData.index = cmdindex;
      object.add(line);
    } else {
      var dotGeometry = new THREE.Geometry();
      dotGeometry.vertices.push(new THREE.Vector3(lastpos.x, lastpos.y, lastpos.z));
      var dotMaterial = new THREE.PointsMaterial({
        size: 0,
        color: 0xdddddd,
        sizeAttenuation: false
      });
      var dot = new THREE.Points(dotGeometry, dotMaterial);
      dot.userData.cmd = cmd
      dot.userData.index = cmdindex;
      object.add(dot);
    }
    lastpos = {
      x: newx(cmd, lastpos),
      y: newy(cmd, lastpos),
      z: newz(cmd, lastpos),
    }
    cmdindex++
  }
  var helper = new THREE.BoxHelper(object);
  helper.update();
  var box3 = new THREE.Box3();
  box3.setFromObject(helper);
  // var size = {
  //   minx: box3.min.x;
  //   miny: box3.min.y;
  //   maxx: box3.max.x;
  //   maxy: box3.max.y;
  //   minz: box3.min.z;
  //   maxz: box3.max.z;
  // }
  object.userData.size = box3;
  return (object);
}

function parseLine(line, index) {
  const cmd = {};
  if (line.startsWith(';'))
    cmd.comment = line.slice(1);
  else {
    const values = line.split(' ');
    values.forEach(v => {
      cmd[v.slice(0, 1).toLowerCase()] = +v.slice(1);
    });
  };
  return cmd;
};

function newx(cmd, lastpos) {
  if (cmd.x) {
    return cmd.x
  } else {
    return lastpos.x
  };
}

function newy(cmd, lastpos) {
  if (cmd.y) {
    return cmd.y
  } else {
    return lastpos.y
  };
}

function newz(cmd, lastpos) {
  if (cmd.z) {
    return cmd.z
  } else {
    return lastpos.z
  };
}

function distanceVector(v1, v2) {
  var dx = v1.x - v2.x;
  var dy = v1.y - v2.y;
  var dz = v1.z - v2.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}