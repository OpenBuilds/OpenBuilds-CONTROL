// Global Vars
var scene, camera, renderer, controls, stock, cone;
var helper, axes, axesgrp, light, bullseye, light, light2, grid;
var raycaster = new THREE.Raycaster(), projector, mouseVector;
var laserxmax, laserymax, lineincrement = 50
var objectsInScene = []; //array that holds all objects we added to the scene.
var animpause = false; // if flag = true, animate does nothing

var timefactor = 1;
var simstopped = true;

var workspace = new THREE.Group();
workspace.name = "cncpro Workspace"

function init3D() {
    scene = new THREE.Scene();
    sceneWidth = document.getElementById("renderArea").offsetWidth,
    sceneHeight = document.getElementById("renderArea").offsetHeight;
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.zoom = 1.5;
    camera.updateProjectionMatrix();
    camera.castShadow = true
    camera.position.x = 10;
    camera.position.y = -100;
    camera.position.z = 300;

    var canvas = !!window.CanvasRenderingContext2D;
    var webgl = (function() {
        try {
            return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
        } catch (e) {
            return false;
        }
    })();

    if (webgl) {
        // printLog('<h5><i class="fa fa-search fa-fw" aria-hidden="true"></i>WebGL Support found!</h5><b>success:</b><br> Laserweb will work optimally on this device!<hr><p>', successcolor);
        renderer = new THREE.WebGLRenderer({
            autoClearColor: true,
            antialias: true,
            preserveDrawingBuffer: true
        });

    } else if (canvas) {
        // printLog('<h5><i class="fa fa-search fa-fw" aria-hidden="true"></i>No WebGL Support found!</h5><b>CRITICAL ERROR:</b><br> Laserweb may not work optimally on this device! <br>Try another device with WebGL support</p><br><u>Try the following:</u><br><ul><li>In the Chrome address bar, type: <b>chrome://flags</b> [Enter]</li><li>Enable the <b>Override software Rendering</b></li><li>Restart Chrome and try again</li></ul>Sorry! :(<hr><p>', errorcolor);
        renderer = new THREE.CanvasRenderer();
    };

    $('#renderArea').append(renderer.domElement);
    renderer.setClearColor(0xffffff, 1); // Background color of viewer = transparent
    // renderer.setSize(window.innerWidth - 10, window.innerHeight - 10);
    renderer.clear();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    sceneWidth = document.getElementById("renderArea").offsetWidth,
    sceneHeight = document.getElementById("renderArea").offsetHeight;
    renderer.setSize(sceneWidth, sceneHeight)
    camera.aspect = sceneWidth / sceneHeight;
    camera.updateProjectionMatrix();

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    controls.enableRotate = true;
    controls.enableZoom = true; // optional
    controls.enableKeys = false; // Disable Keyboard on canvas

    light = new THREE.DirectionalLight(0xcccccc, 0.5);
    light.name = "Light behind Camera"
    light.position.set(1, 0, 1).normalize();
    light.castShadow = true;
    light.target.x = -laserxmax;
    light.target.y = -laserymax;
    light.target.z = 0;
    workspace.add(light);

    light2 = new THREE.DirectionalLight(0xffffff);
    light2.name = "Light off to right front shining at center"
    light2.position.set(1, 0, 1).normalize();
    light2.castShadow = true;
    light2.target.x = -laserxmax;
    light2.target.y = -laserymax;
    light2.target.z = 0;
    workspace.add(light2);

    if (!laserxmax) {
        laserxmax = 200;
    };

    if (!laserymax) {
        laserymax = 200;
    };

    cone = new THREE.Mesh(new THREE.CylinderGeometry(0, 5, 40, 15, 1, false), new THREE.MeshPhongMaterial( {
        color: 0x007bff,
        specular: 0x0000ff,
        shininess: 100,
        opacity: 0.9,
        transparent: true
    } ) );
    cone.overdraw = true;
    cone.rotation.x = -90 * Math.PI / 180;
    cone.position.z = 20;
    //cylinder.position.z = 40;
    cone.castShadow = true;

    workspace.add(cone);

    grid = drawGrid(370, 230)
    workspace.add(grid);

    // Picking stuff
    scene.add(workspace)
    animate();
}

// var stats0 = new Stats();
// stats0.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
// stats0.dom.style.cssText = "position: absolute; bottom:5px; left: 5px; cursor:pointer;opacity:0.9;z-index:10000"
// $('#renderCard').append(stats0.dom);



function animate() {
  // stats0.begin();
    if (animpause) {
      // do nothing for now...
    } else {
      light.position.copy( camera.position );
      setTimeout( function() { // limit FPS according to MrDoob https://stackoverflow.com/questions/11285065/limiting-framerate-in-three-js-to-increase-performance-requestanimationframe
        requestAnimationFrame( animate );
      }, (40) );
      renderer.render(scene, camera);
      sceneWidth = document.getElementById("renderArea").offsetWidth,
      sceneHeight = document.getElementById("renderArea").offsetHeight;
      camera.aspect = sceneWidth / sceneHeight;
      if (cone.position) {
        var conepos = toScreenPosition(cone, camera)
        $("#conetext").css('left', conepos.x + "px").css('top', conepos.y + "px");
      }
    }
    // stats0.end();
}

function drawGrid(x, y) {
  var grid = new THREE.Object3D()

  // VERTICALS
  // VERTICALS top right
  for (i=0; i<=x; i+=10) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( i, 0, 0 ),
        new THREE.Vector3( i, y, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xeeeeee }) ));
  }

  for (i=0; i<=x; i+=100) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( i, 0, 0 ),
        new THREE.Vector3( i, y, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xcccccc }) ));
  }

  // VERTICALS top left
  for (i=0; i>=-x; i-=10) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( i, 0, 0 ),
        new THREE.Vector3( i, y, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xeeeeee }) ));
  }

  for (i=0; i>=-x; i-=100) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( i, 0, 0 ),
        new THREE.Vector3( i, y, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xcccccc }) ));
  }

  // VERTICALS bottom left
  for (i=0; i>=-x; i-=10) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( i, 0, 0 ),
        new THREE.Vector3( i, -y, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xeeeeee }) ));
  }

  for (i=0; i>=-x; i-=100) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( i, 0, 0 ),
        new THREE.Vector3( i, -y, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xcccccc }) ));
  }

  // VERTICALS bottom right
  for (i=0; i<=x; i+=10) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( i, 0, 0 ),
        new THREE.Vector3( i, -y, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xeeeeee }) ));
  }

  for (i=0; i<=x; i+=100) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( i, 0, 0 ),
        new THREE.Vector3( i, -y, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xcccccc }) ));
  }

  // HORISONTALS
  // HORISONTALS top right
  for (i=0; i<=y; i+=10) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( 0, i, 0 ),
        new THREE.Vector3( x, i, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xeeeeee }) ));
  }

  for (i=0; i<=y; i+=100) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( 0, i, 0 ),
        new THREE.Vector3( x, i, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xcccccc }) ));
  }

  // HORISONTALS bottom right
  for (i=0; i>=-y; i-=10) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( 0, i, 0 ),
        new THREE.Vector3( x, i, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xeeeeee }) ));
  }

  for (i=0; i>=-y; i-=100) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( 0, i, 0 ),
        new THREE.Vector3( x, i, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xcccccc }) ));
  }

  // HORISONTALS bottom left
  for (i=0; i>=-y; i-=10) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( 0, i, 0 ),
        new THREE.Vector3( -x, i, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xeeeeee }) ));
  }

  for (i=0; i>=-y; i-=100) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( 0, i, 0 ),
        new THREE.Vector3( -x, i, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xcccccc }) ));
  }

  // HORISONTALS top left
  for (i=0; i<=y; i+=10) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( 0, i, 0 ),
        new THREE.Vector3( -x, i, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xeeeeee }) ));
  }

  for (i=0; i<=y; i+=100) {
      var geometryx10 = new THREE.Geometry();
      geometryx10.vertices.push(
        new THREE.Vector3( 0, i, 0 ),
        new THREE.Vector3( -x, i, 0 ),
      );
      grid.add( new THREE.Line( geometryx10, new THREE.LineBasicMaterial({ color: 0xcccccc }) ));
  }

  // AXES LINES
  // green #5cb85c
  // red   #d9534f
  // blue  #0275d8
  var geometryx = new THREE.Geometry();
  geometryx.vertices.push(
    new THREE.Vector3( x, 0, 0 ),
    new THREE.Vector3( -x, 0, 0 ),
  );
  grid.add( new THREE.Line( geometryx, new THREE.LineBasicMaterial({ color: 0xd9534f }) ));

  var geometryy = new THREE.Geometry();
  geometryy.vertices.push(
    new THREE.Vector3( 0, -y, 0 ),
    new THREE.Vector3( 0, y, 0 ),
  );
  grid.add( new THREE.Line( geometryy, new THREE.LineBasicMaterial({ color: 0x5cb85c }) ));

  var geometryx = new THREE.Geometry();
  geometryx.vertices.push(
    new THREE.Vector3( 0, 0, 0 ),
    new THREE.Vector3( 0, 0, 100 ),
  );
  grid.add( new THREE.Line( geometryx, new THREE.LineBasicMaterial({ color: 0x0275d8 }) ));

  // TEXT LABELS
  // add axes labels
  var xlbl = this.makeSprite(this.scene, "webgl", {
          x: x+10,
          y: 0,
          z: 0,
          text: "X+",
          color: "#d9534f",
          size: 10
  });
  var ylbl = this.makeSprite(this.scene, "webgl", {
          x: 0,
          y: y+10,
          z: 0,
          text: "Y+",
          color: "#5cb85c",
          size: 10
  });
  var xlblmin = this.makeSprite(this.scene, "webgl", {
          x: -x-10,
          y: 0,
          z: 0,
          text: "X-",
          color: "#d9534f",
          size: 10
  });
  var ylblmin = this.makeSprite(this.scene, "webgl", {
          x: 0,
          y: -y-10,
          z: 0,
          text: "Y-",
          color: "#5cb85c",
          size: 10
  });
      var zlbl = this.makeSprite(this.scene, "webgl", {
          x: 0,
          y: 0,
          z: 125,
          text: "Z+",
          color: "#0275d8",
          size: 10
  });


  grid.add(xlbl);
  grid.add(ylbl);
  grid.add(xlblmin);
  grid.add(ylblmin);
  grid.add(zlbl);

  grid.name = "grid"
  return (grid)
}

function viewObject(){
  camera.position = object.userData.center2
  controls.target = object.userData.center2
  controls.update()
}


function clearViewer() {
  var selectedObject = scene.getObjectByName('gcodeobject');
  scene.remove( selectedObject );
  // simstop();
  animate();
}

function simstop() {
  simstopped = true;
  $('#simstartbtn').show();
  $('#simstopbtn').hide();
  timefactor = 1;
  $('#simspeedval').text(timefactor);
  $('#gcodesent').html('0');
  editor.gotoLine(0)
  cone.material = new THREE.MeshPhongMaterial( {
    color: 0x007bff,
    specular: 0x0000ff,
    shininess: 100,
    opacity: 0.9,
    transparent: true
  } )
  $("#conetext").hide();
}

function simSpeed() {
  timefactor = timefactor * 10;
  if (timefactor > 1024) timefactor = 1;
  $('#simspeedval').text(timefactor);
}

function sim(startindex) {
    $("#conetext").show();
    cone.material = new THREE.MeshPhongMaterial( {
        color: 0x28a745,
        specular: 0x0000ff,
        shininess: 100,
        opacity: 0.9,
        transparent: true
    } )
    if (typeof(object) == 'undefined') {
      console.log('No Gcode in Preview yet')
      simstop()
    } else {
      simstopped = false;
      // timefactor = 1;
      $('#simspeedval').text(timefactor);
      var simIdx = startindex;
      $('#simstartbtn').hide();
      $('#simstopbtn').show();
      $('#editorContextMenu').hide() // sometimes we launch sim(linenum) from the context menu... close it once running
      var runSim = function() {
          editor.gotoLine(simIdx + 1)
          $('#gcodesent').html(simIdx + 1);
          $('#simgcode').html(object.userData.lines[simIdx].args.origtext);
          var posx = object.userData.lines[simIdx].p2.x;
          var posy = object.userData.lines[simIdx].p2.y;
          var posz = object.userData.lines[simIdx].p2.z + 20;
          var simTime = object.userData.lines[simIdx].p2.timeMins / timefactor;
          // if (simTime < 0.1) { simTime = 0.1};
          TweenMax.to(cone.position, simTime, {
            x: posx,
            y: posy,
            z: posz,
            onComplete: function() {
                if (simstopped == true) {
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
      };
      runSim(); //kick it off
    }

}

function toScreenPosition(obj, camera)
{
    var vector = new THREE.Vector3();

    var widthHalf = 0.5*renderer.context.canvas.width;
    var heightHalf = 0.5*renderer.context.canvas.height;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);

    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;

    return {
        x: vector.x,
        y: vector.y
    };

};

// GENERATE GCODE PREVIEW
function doPreview() {
  var template = `<i class="fa fa-fw fa-spinner fa-spin"></i>please wait`
  $('#previewbtntext').html(template)
  setTimeout(function(){ openGCodeFromText(); }, 100);

}

function makeSprite(scene, rendererType, vals) {
    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        metrics = null,
        textHeight = 100,
        textWidth = 0,
        actualFontSize = 6;
    var txt = vals.text;
    if (vals.size) actualFontSize = vals.size;

    context.font = "normal " + textHeight + "px Arial";
    metrics = context.measureText(txt);
    var textWidth = metrics.width;

    canvas.width = textWidth;
    canvas.height = textHeight;
    context.font = "normal " + textHeight + "px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    //context.fillStyle = "#ff0000";
    context.fillStyle = vals.color;

    context.fillText(txt, textWidth / 2, textHeight / 2);

    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;

    var material = new THREE.SpriteMaterial({
        map: texture,
    });
    material.transparent = true;
    //var textObject = new THREE.Sprite(material);
    var textObject = new THREE.Object3D();
    textObject.position.x = vals.x;
    textObject.position.y = vals.y;
    textObject.position.z = vals.z;
    var sprite = new THREE.Sprite(material);
    textObject.textHeight = actualFontSize;
    textObject.textWidth = (textWidth / textHeight) * textObject.textHeight;
    if (rendererType == "2d") {
        sprite.scale.set(textObject.textWidth / textWidth, textObject.textHeight / textHeight, 1);
    } else {
        sprite.scale.set(textWidth / textHeight * actualFontSize, actualFontSize, 1);
    }

    textObject.add(sprite);

    //scene.add(textObject);
    return textObject;
}

$(window).on('resize', function () {
    sceneWidth = document.getElementById("renderArea").offsetWidth,
    sceneHeight = document.getElementById("renderArea").offsetHeight;
    //console.log("got resize event. resetting aspect ratio.");
    renderer.setSize(sceneWidth, sceneHeight);
    camera.aspect = sceneWidth / sceneHeight;
    camera.updateProjectionMatrix();
    // controls.screen.width = window.innerWidth;
    // controls.screen.height = window.innerHeight;
    // that.wakeAnimate();
    //render();
});
