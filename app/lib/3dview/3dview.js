var object;
var draw, line, timefactor = 1,
  object, simRunning = false;

var loader = new THREE.ObjectLoader();



function parseGcodeInWebWorker(gcode) {
  simstop()
  scene.remove(object)
  object = false;

  // var worker = new Worker('lib/3dview/workers/gcodeparser.js');
  var worker = new Worker('lib/3dview/workers/litegcodeviewer.js');
  worker.addEventListener('message', function(e) {
    // console.log('webworker message')
    if (scene.getObjectByName('gcodeobject')) {
      scene.remove(scene.getObjectByName('gcodeobject'))
      object = false;
    }
    object = loader.parse(JSON.parse(e.data));
    if (object && object.userData.lines.length > 1) {
      worker.terminate();
      scene.add(object);
      if (object.userData.inch) {
        // console.log(scaling)
        object.scale.x = 25.4
        object.scale.y = 25.4
        object.scale.z = 25.4
      }
      redrawGrid(Math.floor(object.userData.bbbox2.min.x), Math.ceil(object.userData.bbbox2.max.x), Math.floor(object.userData.bbbox2.min.y), Math.ceil(object.userData.bbbox2.max.y), object.userData.inch)
      // animate();
      setTimeout(function() {
        if (webgl) {
          $('#gcodeviewertab').click();
        }
        clearSceneFlag = true;
        resetView();
        // animate();
        var timeremain = object.userData.lines[object.userData.lines.length - 1].p2.timeMinsSum;

        if (!isNaN(timeremain)) {
          var mins_num = parseFloat(timeremain, 10); // don't forget the second param
          var hours = Math.floor(mins_num / 60);
          var minutes = Math.floor((mins_num - ((hours * 3600)) / 60));
          var seconds = Math.floor((mins_num * 60) - (hours * 3600) - (minutes * 60));

          // Appends 0 when unit is less than 10
          if (hours < 10) {
            hours = "0" + hours;
          }
          if (minutes < 10) {
            minutes = "0" + minutes;
          }
          if (seconds < 10) {
            seconds = "0" + seconds;
          }
          var formattedTime = hours + ':' + minutes + ':' + seconds;
          console.log('Remaining time: ', formattedTime)
          // output formattedTime to UI here
          $('#timeRemaining').html(" / " + formattedTime);
          printLog("<span class='fg-red'>[ GCODE Parser ]</span><span class='fg-green'> GCODE Preview Rendered Succesfully: Estimated GCODE Run Time: </span><span class='badge inline bg-darkGreen fg-white'>" + formattedTime + "</span>")
        }
      }, 200);
      $('#3dviewicon').removeClass('fa-pulse')
      $('#3dviewlabel').html(' 3D View')
    }
  }, false);

  worker.postMessage({
    'data': gcode
  });
  $('#3dviewicon').addClass('fa-pulse')
  $('#3dviewlabel').html(' 3D View (rendering, please wait...)')
  // populateToolChanges(gcode)

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
    var arcIdx = 0;
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
    //console.log(object.userData.lines[simIdx])
    // not running arcs yet!
    arcIdx = 0;
    runSimArc()
    // lets move on
    // simIdx++;
    // if (simIdx < object.userData.lines.length) {
    //   runSim();
    // } else {
    //   simstop();
    // }
  } else {
    if (object.userData.inch) {
      var posx = object.userData.lines[simIdx].p2.x * 25.4; //- (sizexmax/2);
      var posy = object.userData.lines[simIdx].p2.y * 25.4; //- (sizeymax/2);
      var posz = object.userData.lines[simIdx].p2.z * 25.4;

    } else {
      var posx = object.userData.lines[simIdx].p2.x; //- (sizexmax/2);
      var posy = object.userData.lines[simIdx].p2.y; //- (sizeymax/2);
      var posz = object.userData.lines[simIdx].p2.z;

    }

    //console.log(posx, posy, posz, object.userData.lines[simIdx])

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

  //var object = object.userData.lines[simIdx].p2.threeObjArc.object.userData.points[arcIdx]

  // editor.gotoLine(simIdx + 1)
  $('#gcodesent').html(simIdx + 1);
  // $('#simgcode').html(object.userData.lines[simIdx].args.origtext);
  var posx = object.userData.lines[simIdx].p2.threeObjArc.object.userData.points[arcIdx].x; //- (sizexmax/2);
  var posy = object.userData.lines[simIdx].p2.threeObjArc.object.userData.points[arcIdx].y; //- (sizeymax/2);
  var posz = object.userData.lines[simIdx].p2.threeObjArc.object.userData.points[arcIdx].z;
  console.log(posx, posy, posz)
  if (object.userData.lines[simIdx].args.isFake) {
    if (object.userData.lines[simIdx].args.text.length < 1) {
      var text = "empty line"
    } else {
      var text = object.userData.lines[simIdx].args.text
    }
    var simTime = 0.01 / timefactor;
  } else {
    var text = object.userData.lines[simIdx].args.cmd
    var simTime = (object.userData.lines[simIdx].p2.timeMins / timefactor) / object.userData.lines[simIdx].p2.threeObjArc.object.userData.points.length;

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
          arcIdx++;
          if (simIdx < object.userData.lines[simIdx].p2.threeObjArc.object.userData.points.length) {
            runSimArc();
          } else {
            simIdx++;
            runSim();
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