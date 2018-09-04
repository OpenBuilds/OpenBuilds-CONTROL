var object
var draw, line, t = 0,
  timefactor = 1,
  object, simRunning = false;

var loader = new THREE.ObjectLoader();

var worker = new Worker('lib/3dview/workers/gcodeparser.js');
worker.addEventListener('message', function(e) {
  object = loader.parse(e.data);
  scene.add(object);
  // redrawGrid(object.userData.size.minx, object.userData.size.maxx, object.userData.size.miny, object.userData.size.maxy)
  // animate();
  setTimeout(function() {
    console.log("Reset Camera");
    viewExtents(object);
    // animate();
  }, 200);
}, false);

function parseGcodeInWebWorker(gcode) {
  scene.remove(object)
  object = false;
  worker.postMessage({
    'data': gcode
  });
};

function update3Dprogress(position) {
  for (i = 0; i < object.children.length; i++) {
    if (object.children[i].userData.cmd.g == 0) {
      object.children[i].material.color.set(0xdddddd);
    };
    if (object.children[i].userData.cmd.g == 1) {
      object.children[i].material.color.set(0xdddddd);
    };
  };

  for (i = 0; i < position; i++) {
    if (object.children[i].userData.cmd.g == 0) {
      object.children[i].material.color.set(0x00cc00);
    };
    if (object.children[i].userData.cmd.g == 1) {
      object.children[i].material.color.set(0xcc0000);
    };
  }



}

function simSpeed() {
  timefactor = timefactor * 10;
  if (timefactor > 1024) timefactor = 0.1;
  $('#simspeedval').text(timefactor);
}

function simStart() {
  if (object) {
    simRunning = true;
    $('#runSimBtn').hide()
    $('#stopSimBtn').show()
    t = 0;
    cone.position.x = 0;
    cone.position.y = 0;
    cone.position.z = 20;
    cone.visible = true;
    for (i = 0; i < object.children.length; i++) {
      if (object.children[i].userData.cmd.g == 0) {
        object.children[i].material.color.set(0xdddddd);
      };
      if (object.children[i].userData.cmd.g == 1) {
        object.children[i].material.color.set(0xdddddd);
      };
    };
    playSim();
  }
}

function simStop() {
  if (object) {
    t = object.children.length;
    for (i = 0; i < object.children.length; i++) {
      if (object.children[i].userData.cmd.g == 0) {
        object.children[i].material.color.set(0x00cc00);
      };
      if (object.children[i].userData.cmd.g == 1) {
        object.children[i].material.color.set(0xcc0000);
      };
    };
    cone.visible = false;
    $('#runSimBtn').show()
    $('#stopSimBtn').hide()
    simRunning = false
    timefactor = 1;
    $('#simspeedval').text(timefactor);
  }

}

function playSim() {
  $('#simspeedval').text(timefactor);
  if (object.children[t]) {
    object.children[t].visible = true;
    if (object.children[t].userData.cmd.g == 0) {
      object.children[t].material.color.set(0x00cc00);
    };
    if (object.children[t].userData.cmd.g == 1) {
      object.children[t].material.color.set(0xcc0000);
    };

    TweenMax.to(cone.position, object.children[t].userData.time / timefactor, {
      x: object.children[t].userData.cmd.x,
      y: object.children[t].userData.cmd.y,
      z: object.children[t].userData.cmd.z + 20,
      onComplete: function() {
        t++
        if (t == object.children.length) {
          simStop();
        } else {
          playSim();
        };
      }
    });
  };
};