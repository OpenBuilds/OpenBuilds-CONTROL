var object
var draw, line, timefactor = 1,
  object, simRunning = false;

var loader = new THREE.ObjectLoader();

var worker = new Worker('lib/3dview/workers/gcodeparser.js');
worker.addEventListener('message', function(e) {
  // console.log('webworker message')
  if (scene.getObjectByName('gcodeobject')) {
    scene.remove(scene.getObjectByName('gcodeobject'))
    object = false;
  }
  object = loader.parse(JSON.parse(e.data));
  if (object) {
    scene.add(object);
    redrawGrid(parseInt(object.userData.bbbox2.min.x), parseInt(object.userData.bbbox2.max.x), parseInt(object.userData.bbbox2.min.y), parseInt(object.userData.bbbox2.max.y), object.userData.inch)
    // animate();
    setTimeout(function() {
      if (webgl) {
        $('#gcodeviewertab').click();
      }
      clearSceneFlag = true;
      resetView();
      // animate();
    }, 200);
  }
}, false);

function parseGcodeInWebWorker(gcode) {
  simstop()
  scene.remove(object)
  object = false;
  worker.postMessage({
    'data': gcode
  });
};

function simSpeed() {
  timefactor = timefactor * 10;
  if (timefactor > 1024) timefactor = 0.1;
  $('#simspeedval').text(timefactor);
}

function runSimFrom() {
  $('#gcodeviewertab').click()
  sim(editor.getSelectionRange().start.row + 1);
}

function sim(startindex) {
  if (typeof(object) == 'undefined' || !scene.getObjectByName('gcodeobject')) {
    console.log('No Gcode in Preview yet')
    var message = `No Gcode in Preview yet: Please setup toolpaths, and generate GCODE before running simulation`
    Metro.toast.create(message, null, 10000, 'bg-red');
    simstop()
  } else {
    lastLine = {
      x: 0,
      y: 0,
      z: 0,
      e: 0,
      f: 0,
      feedrate: null,
      extruding: false
    };
    $('#runSimBtn').hide()
    $('#stopSimBtn').show()
    clearSceneFlag = true;
    $("#conetext").show();
    cone.visible = true
    var posx = object.userData.lines[0].p2.x; //- (sizexmax/2);
    var posy = object.userData.lines[0].p2.y; //- (sizeymax/2);
    var posz = object.userData.lines[0].p2.z + 20;
    cone.position.x = posx;
    cone.position.y = posy;
    cone.position.z = posz;
    cone.material = new THREE.MeshPhongMaterial({
      color: 0x28a745,
      specular: 0x0000ff,
      shininess: 100,
      opacity: 0.9,
      transparent: true
    })

    simRunning = true;
    // timefactor = 1;
    $('#simspeedval').text(timefactor);
    var simIdx = startindex;
    $('#simstartbtn').attr('disabled', true);
    $('#simstopbtn').attr('disabled', false);
    $('#editorContextMenu').hide() // sometimes we launch sim(linenum) from the context menu... close it once running
    runSim(); //kick it off
  }
}

function runSim() {
  // editor.gotoLine(simIdx + 1)
  $('#gcodesent').html(simIdx + 1);
  // $('#simgcode').html(object.userData.lines[simIdx].args.origtext);

  if (object.userData.lines[simIdx].p2.arc) {
    console.log(object.userData.lines[simIdx])
  } else {

    var posx = object.userData.lines[simIdx].p2.x; //- (sizexmax/2);
    var posy = object.userData.lines[simIdx].p2.y; //- (sizeymax/2);
    var posz = object.userData.lines[simIdx].p2.z;

    if (object.userData.lines[simIdx].args.isFake) {
      if (object.userData.lines[simIdx].args.text.length < 1) {
        var text = "empty line"
      } else {
        var text = object.userData.lines[simIdx].args.text
      }
      var simTime = 0.01 / timefactor;
    } else {
      var text = object.userData.lines[simIdx].args.cmd
      var simTime = object.userData.lines[simIdx].p2.timeMins / timefactor;

    }
    if (object.userData.lines[simIdx].p2.feedrate == null) {
      var feedrate = 0.00
    } else {
      var feedrate = object.userData.lines[simIdx].p2.feedrate
    }

    $("#conetext").html(
      ` <table style="border: 1px solid #888">
          <tr class="stripe" style="border-bottom: 1px solid #888">
            <td><b>CMD</b></td><td align="right"><b>` + text + `</b></td>
          </tr>
          <tr class="stripe" style="border-bottom: 1px solid #888">
            <td><b>X:</b></td><td align="right"><b>` + posx.toFixed(2) + `mm</b></td>
          </tr>
          <tr class="stripe" style="border-bottom: 1px solid #888">
            <td><b>Y:</b></td><td align="right"><b>` + posy.toFixed(2) + `mm</b></td>
          </tr>
          <tr class="stripe" style="border-bottom: 1px solid #888">
            <td><b>Z:</b></td><td align="right"><b>` + posz.toFixed(2) + `mm</b></td>
          </tr>
          <tr class="stripe" style="border-bottom: 1px solid #888">
            <td><b>F:</b></td><td align="right"><b>` + feedrate + `mm/min</b></td>
          </tr>
        </table>
      `);
    var simTimeInSec = simTime * 60;
    // console.log(simTimeInSec)
    if (!object.userData.lines[simIdx].args.isFake) {
      TweenMax.to(cone.position, simTimeInSec, {
        x: posx,
        y: posy,
        z: posz + 20,
        onComplete: function() {
          if (simRunning == false) {
            //return
            simstop();
          } else {
            simIdx++;
            if (simIdx < object.userData.lines.length) {
              runSim();
            } else {
              simstop();
            }
          }
        }
      })
    } else {
      if (simRunning == false) {
        //return
        simstop();
      } else {
        simIdx++;
        if (simIdx < object.userData.lines.length) {
          runSim();
        } else {
          simstop();
        }
      }
    }

  }



};

function runSimArc() {
  // editor.gotoLine(simIdx + 1)
  $('#gcodesent').html(simIdx + 1);
  // $('#simgcode').html(object.userData.lines[simIdx].args.origtext);
  var posx = object.userData.lines[simIdx].p2.x; //- (sizexmax/2);
  var posy = object.userData.lines[simIdx].p2.y; //- (sizeymax/2);
  var posz = object.userData.lines[simIdx].p2.z;

  if (object.userData.lines[simIdx].args.isFake) {
    if (object.userData.lines[simIdx].args.text.length < 1) {
      var text = "empty line"
    } else {
      var text = object.userData.lines[simIdx].args.text
    }
    var simTime = 0.01 / timefactor;
  } else {
    var text = object.userData.lines[simIdx].args.cmd
    var simTime = object.userData.lines[simIdx].p2.timeMins / timefactor;

  }
  if (object.userData.lines[simIdx].p2.feedrate == null) {
    var feedrate = 0.00
  } else {
    var feedrate = object.userData.lines[simIdx].p2.feedrate
  }

  $("#conetext").html(
    ` <table style="border: 1px solid #888">
        <tr class="stripe" style="border-bottom: 1px solid #888">
          <td><b>CMD</b></td><td align="right"><b>` + text + `</b></td>
        </tr>
        <tr class="stripe" style="border-bottom: 1px solid #888">
          <td><b>X:</b></td><td align="right"><b>` + posx.toFixed(2) + `mm</b></td>
        </tr>
        <tr class="stripe" style="border-bottom: 1px solid #888">
          <td><b>Y:</b></td><td align="right"><b>` + posy.toFixed(2) + `mm</b></td>
        </tr>
        <tr class="stripe" style="border-bottom: 1px solid #888">
          <td><b>Z:</b></td><td align="right"><b>` + posz.toFixed(2) + `mm</b></td>
        </tr>
        <tr class="stripe" style="border-bottom: 1px solid #888">
          <td><b>F:</b></td><td align="right"><b>` + feedrate + `mm/min</b></td>
        </tr>
      </table>
    `);
  var simTimeInSec = simTime * 60;
  // console.log(simTimeInSec)
  if (!object.userData.lines[simIdx].args.isFake) {
    TweenMax.to(cone.position, simTimeInSec, {
      x: posx,
      y: posy,
      z: posz + 20,
      onComplete: function() {
        if (simRunning == false) {
          //return
          simstop();
        } else {
          simIdx++;
          if (simIdx < object.userData.lines.length) {
            runSim();
          } else {
            simstop();
          }
        }
      }
    })
  } else {
    if (simRunning == false) {
      //return
      simstop();
    } else {
      simIdx++;
      if (simIdx < object.userData.lines.length) {
        runSim();
      } else {
        simstop();
      }
    }
  }

};

function simstop() {
  simIdx = 0;
  simRunning = false;
  $('#runSimBtn').show()
  $('#stopSimBtn').hide()
  // timefactor = 1;
  $('#simspeedval').text(timefactor);
  editor.gotoLine(0)
  cone.visible = false;
  clearSceneFlag = true;
}