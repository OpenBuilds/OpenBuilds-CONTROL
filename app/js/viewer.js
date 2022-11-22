// Global Vars
var scene = true;
var camera, renderer;
var projector, mouseVector, containerWidth, containerHeight;
var raycaster = new THREE.Raycaster();
var gridsystem = new THREE.Group();

var container, stats;
var camera, controls, control, scene, renderer, gridsystem, helper;
var clock = new THREE.Clock();

var marker;
var sizexmax;
var sizeymax;
var lineincrement = 50
var camvideo;
var objectsInScene = []; //array that holds all objects we added to the scene.
var clearSceneFlag = false;

var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
var canvas = !!window.CanvasRenderingContext2D;

// pause Animation when we loose webgl context focus
var pauseAnimation = false;

var size = new THREE.Vector3();

var sky;

var workspace = new THREE.Group();
workspace.name = "Workspace"

var ground;

containerWidth = window.innerWidth;
containerHeight = window.innerHeight;

var animationLoopTimeout;

var xmin = 0,
  xmax = 307,
  ymin = 0,
  ymax = 207

var machineCoordinateSpace = false;

function drawWorkspace(xmin, xmax, ymin, ymax) {

  if (!xmin) xmin = 0;
  if (!ymin) ymin = 0;
  if (!xmax) xmax = 307
  if (!ymax) ymax = 207

  var sceneLights = new THREE.Group();

  var light = new THREE.DirectionalLight(0xffffff, 0.8);
  light.position.set(0, 2, 25).normalize();
  light.name = "Light1;"
  sceneLights.add(light);

  var light2 = new THREE.DirectionalLight(0xffffff);
  light2.name = "Light2"
  light2.position.set(-500, -500, 1).normalize();
  sceneLights.add(light2);

  dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.color.setHSL(0.1, 1, 0.95);
  dirLight.position.set(-1, 1.75, 1);
  dirLight.position.multiplyScalar(30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  var d = 50;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.far = 3500;
  dirLight.shadow.bias = -0.0001;
  dirLight.name = "dirLight;"
  sceneLights.add(dirLight);

  hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
  hemiLight.color.setHSL(Theme.HEMI_LIGHT_COLOR.H, Theme.HEMI_LIGHT_COLOR.S, Theme.HEMI_LIGHT_COLOR.L);
  hemiLight.groundColor.setHSL(0.095, 1, 0.75);
  hemiLight.position.set(0, 50, 0);
  hemiLight.visible = false;
  hemiLight.name = "hemiLight"
  sceneLights.add(hemiLight);
  // if (helper) {
  //     workspace.remove(helper);
  // }
  sceneLights.name = "Scene Lights"
  workspace.add(sceneLights);

  scene.fog = new THREE.Fog(0xffffff, 1, 20000);

  // SKYDOME
  if (!disable3Dskybox) {
    var uniforms = {
      topColor: {
        value: new THREE.Color(Theme.SKY_TOP_COLOR)
      },
      bottomColor: {
        value: new THREE.Color(Theme.SKY_BOTTOM_COLOR)
      },
      offset: {
        value: -63
      },
      exponent: {
        value: 0.71
      }
    };
    uniforms.topColor.value.copy(hemiLight.color);

    scene.fog.color.copy(uniforms.bottomColor.value);

    var vertexShader = document.getElementById('vertexShader').textContent;
    var fragmentShader = document.getElementById('fragmentShader').textContent;

    var skyGeo = new THREE.SphereGeometry(9900, 64, 15);
    var skyMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
      side: THREE.DoubleSide
    });

    sky = new THREE.Mesh(skyGeo, skyMat);
    sky.name = "Skydome"
    workspace.add(sky);
  }

  if (!disable3Drealtimepos) {
    var coneGeo = new THREE.CylinderGeometry(0, 5, 40, 15, 1, false)
    coneGeo.applyMatrix(new THREE.Matrix4().makeTranslation(0, -20, 0));

    cone = new THREE.Mesh(coneGeo, new THREE.MeshPhongMaterial({
      color: 0x0000ff,
      specular: 0x0000ff,
      shininess: 00
    }));

    cone.overdraw = true;
    cone.rotation.x = -90 * Math.PI / 180;
    cone.position.x = 0;
    cone.position.y = 0;
    cone.position.z = 0;
    cone.material.opacity = 0.6;
    cone.material.transparent = true;
    cone.castShadow = false;
    cone.visible = true;
    cone.name = "Simulation Marker"
    workspace.add(cone)

  }
  gridsystem.name = "Grid System"
  workspace.add(gridsystem)
  if (localStorage.getItem('unitsMode')) {
    if (localStorage.getItem('unitsMode') == "in") {
      redrawGrid(xmin / 25.4, xmax / 25.4, ymin / 25.4, ymax / 25.4, true);
    } else {
      redrawGrid(xmin, xmax, ymin, ymax, false);
    }
  }
  scene.add(workspace)
}

function redrawGrid(xmin, xmax, ymin, ymax, inches) {
  // console.log(xmin, xmax, ymin, ymax, inches)
  if (inches) {
    xmin = Math.floor(xmin * 25.4);
    xmax = Math.ceil(xmax * 25.4);
    ymin = Math.floor(ymin * 25.4);
    ymax = Math.ceil(ymax * 25.4);
  } else {
    xmin = Math.floor(xmin);
    xmax = Math.ceil(xmax);
    ymin = Math.floor(ymin);
    ymax = Math.ceil(ymax);
  }
  // console.log(xmin, xmax, ymin, ymax, inches)

  sizexmax = xmax;
  sizeymax = ymax;

  if (!xmax) {
    xmax = 200;
  };

  if (!ymax) {
    ymax = 200;
  };

  var grid = new THREE.Group();

  var axesgrp = new THREE.Object3D();
  axesgrp.name = "Axes Markers"

  if (inches) {
    var unitsval = "in"
    var offset = 5 * 2.54
  } else {
    var unitsval = "mm"
    var offset = 5
    var size = 5
  }

  // add axes labels
  var xlbl = this.makeSprite(this.scene, "webgl", {
    x: parseInt(xmax) + offset,
    y: 0,
    z: 0,
    text: "X",
    color: Theme.X_RULER_LABEL_COLOR,
    size: size
  });
  var ylbl = this.makeSprite(this.scene, "webgl", {
    x: 0,
    y: parseInt(ymax) + offset,
    z: 0,
    text: "Y",
    color: Theme.Y_RULER_LABEL_COLOR,
    size: size
  });


  axesgrp.add(xlbl);
  axesgrp.add(ylbl);

  var materialX = new THREE.LineBasicMaterial({
    color: Theme.X_AXIS_LINE_COLOR
  });

  var materialY = new THREE.LineBasicMaterial({
    color: Theme.Y_AXIS_LINE_COLOR
  });

  var geometryX = new THREE.Geometry();
  geometryX.vertices.push(
    new THREE.Vector3(-0.1, 0, 0),
    new THREE.Vector3(-0.1, (ymax), 0)
  );

  var geometryY = new THREE.Geometry();
  geometryY.vertices.push(
    new THREE.Vector3(0, -0.1, 0),
    new THREE.Vector3((xmax), -0.1, 0)
  );

  var line1 = new THREE.Line(geometryX, materialY);
  var line2 = new THREE.Line(geometryY, materialX);
  axesgrp.add(line1);
  axesgrp.add(line2);

  // if (inches) {
  //   axesgrp.scale.multiplyScalar(2.5);
  // }

  grid.add(axesgrp);

  var step10 = 10;
  var step100 = 100;
  if (inches) {
    step10 = 2.54;
    step100 = 25.4;
  }
  helper = new THREE.GridHelper(xmin, xmax, ymin, ymax, step10, Theme.GRID_STEP_10_COLOR);
  helper.position.y = 0;
  helper.position.x = 0;
  helper.position.z = 0;
  helper.material.opacity = Theme.GRID_STEP_10_OPACITY;
  helper.material.transparent = true;
  helper.receiveShadow = false;
  helper.name = "GridHelper10mm"
  grid.add(helper);
  helper = new THREE.GridHelper(xmin, xmax, ymin, ymax, step100, Theme.GRID_STEP_100_COLOR);
  helper.position.y = 0;
  helper.position.x = 0;
  helper.position.z = 0;
  helper.material.opacity = Theme.GRID_STEP_100_OPACITY;
  helper.material.transparent = true;
  helper.receiveShadow = false;
  helper.name = "GridHelper50mm"
  grid.add(helper);
  grid.name = "Grid"

  gridsystem.children.length = 0
  if (inches) {
    var ruler = drawRulerInches(xmin, xmax, ymin, ymax, inches)
  } else {
    var ruler = drawRuler(xmin, xmax, ymin, ymax, inches)
  }
  gridsystem.add(grid);
  gridsystem.add(ruler);

}

function setBullseyePosition(x, y, z) {
  //console.log('Set Position: ', x, y, z)
  if (x) {
    bullseye.position.x = parseInt(x, 10);
  };
  if (y) {
    bullseye.position.y = parseInt(y, 10);
  };
  if (z) {
    bullseye.position.z = (parseInt(z, 10) + 0.1);
  };
}

function init3D() {

  if (webgl) {
    // console.log('WebGL Support found! success: this application will work optimally on this device!');
    printLog("<span class='fg-darkRed'>[ 3D Viewer ] </span><span class='fg-green'>WebGL Support found! success: this application will work optimally on this device!</span>")
    renderer = new THREE.WebGLRenderer({
      autoClearColor: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    // ThreeJS Render/Control/Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.z = 295;

    $('#renderArea').append(renderer.domElement);
    renderer.setClearColor(0xffffff, 1); // Background color of viewer = transparent
    // renderer.setSize(window.innerWidth - 10, window.innerHeight - 10);
    renderer.clear();

    sceneWidth = document.getElementById("renderArea").offsetWidth,
      sceneHeight = document.getElementById("renderArea").offsetHeight;
    camera.aspect = sceneWidth / sceneHeight;
    renderer.setSize(sceneWidth, sceneHeight)
    camera.updateProjectionMatrix();


    if (!disable3Dcontrols) {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0, 0); // view direction perpendicular to XY-plane

      if (!isMac) {
        controls.mouseButtons = {
          ORBIT: THREE.MOUSE.MIDDLE,
          ZOOM: false,
          PAN: THREE.MOUSE.RIGHT
        };
      }
      controls.enableRotate = true;
      controls.enableZoom = true; // optional
      controls.maxDistance = 8000; // limit max zoom out
      controls.enableKeys = false; // Disable Keyboard on canvas
    }


    //drawWorkspace(xmin, xmax, ymin, ymax)
    drawWorkspace(xmin, xmax, ymin, ymax);

    // Picking stuff
    projector = new THREE.Projector();
    mouseVector = new THREE.Vector3();
    raycaster.linePrecision = 1

    setTimeout(function() {
      resetView()
      animate();
    }, 200)

  } else {
    console.log('No WebGL Support found on this computer! Disabled 3D Viewer - Sorry!');
    printLog("<span class='fg-darkRed'>[ ERROR ]</span>  <span class='fg-darkRed'>No WebGL Support found on this computer! Disabled 3D Viewer - Sorry!</span>")
    printLog("<span class='fg-darkRed'>[ ERROR ]</span>  <span class='fg-darkRed'>" + getWebGLErrorMessage() + "</span>")
    $('#gcodeviewertab').hide()
    $('#consoletab').click()
    return false;
  };

}

function animate() {
  if (!pauseAnimation) {
    camera.updateMatrixWorld();
    simAnimate()
    toolAnimate();

    if (clearSceneFlag) {
      while (scene.children.length > 1) {
        scene.remove(scene.children[1])
      }

      if (object) {
        scene.add(object)
      }

      clearSceneFlag = false;
    } // end clearSceneFlag

    // Limited FPS https://stackoverflow.com/questions/11285065/limiting-framerate-in-three-js-to-increase-performance-requestanimationframe
    animationLoopTimeout = setTimeout(function() {
      requestAnimationFrame(animate);
    }, 60);

    renderer.render(scene, camera);
  }
}

function viewExtents(objecttosee) {
  if (!disable3Dcontrols) {
    // console.log("viewExtents. object:", objecttosee);
    // console.log("controls:", controls);
    //wakeAnimate();

    // lets override the bounding box with a newly
    // generated one
    // get its bounding box
    if (objecttosee) {
      // console.log(objecttosee)
      var helper = new THREE.BoxHelper(objecttosee);
      helper.update();
      var box3 = new THREE.Box3();
      box3.setFromObject(helper);
      var minx = box3.min.x;
      var miny = box3.min.y;
      var maxx = box3.max.x;
      var maxy = box3.max.y;
      var minz = box3.min.z;
      var maxz = box3.max.z;


      controls.reset();

      var lenx = maxx - minx;
      var leny = maxy - miny;
      var lenz = maxz - minz;
      var centerx = minx + (lenx / 2);
      var centery = miny + (leny / 2);
      var centerz = minz + (lenz / 2);

      // console.log("lenx:", lenx, "leny:", leny, "lenz:", lenz);
      var maxlen = Math.max(lenx, leny, lenz);
      var dist = 2 * maxlen;
      // center camera on gcode objects center pos, but twice the maxlen
      controls.object.position.x = centerx;
      controls.object.position.y = centery;
      controls.object.position.z = centerz + dist;
      controls.target.x = centerx;
      controls.target.y = centery;
      controls.target.z = centerz;
      // console.log("maxlen:", maxlen, "dist:", dist);
      var fov = 2.2 * Math.atan(maxlen / (2 * dist)) * (180 / Math.PI);
      // console.log("new fov:", fov, " old fov:", controls.object.fov);
      if (isNaN(fov)) {
        // console.log("giving up on viewing extents because fov could not be calculated");
        return;
      } else {
        // console.log("fov: ", fov);
        controls.object.fov = fov;
        var L = dist;
        var camera2 = controls.object;
        var vector = controls.target.clone();
        var l = (new THREE.Vector3()).subVectors(camera2.position, vector).length();
        var up = camera.up.clone();
        var quaternion = new THREE.Quaternion();

        // Zoom correction
        camera2.translateZ(L - l);
        // console.log("up:", up);
        up.y = 1;
        up.x = 0;
        up.z = 0;
        quaternion.setFromAxisAngle(up, 0);
        camera2.position.applyQuaternion(quaternion);
        up.y = 0;
        up.x = 1;
        up.z = 0;
        quaternion.setFromAxisAngle(up, 0);
        camera2.position.applyQuaternion(quaternion);
        up.y = 0;
        up.x = 0;
        up.z = 1;
        quaternion.setFromAxisAngle(up, 0);
        camera2.lookAt(vector);
        controls.object.updateProjectionMatrix();
      }
    }
  }
};

function makeSprite(scene, rendererType, vals) {
  var canvas = document.createElement('canvas'),
    context = canvas.getContext('2d'),
    metrics = null,
    textHeight = 100,
    textWidth = 0,
    actualFontSize = 10;
  var txt = vals.text;
  if (vals.size) actualFontSize = vals.size;

  context.font = "normal " + textHeight + "px Impact";
  metrics = context.measureText(txt);
  var textWidth = metrics.width;

  canvas.width = textWidth;
  canvas.height = textHeight;
  context.font = "normal " + textHeight + "px Impact";
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
    // useScreenCoordinates: false,
    transparent: true,
    opacity: Theme.SPRITE_OPACITY
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


// Global Function to keep three fullscreen

function fixRenderSize() {
  if (renderer) {
    setTimeout(function() {
      sceneWidth = document.getElementById("renderArea").offsetWidth;
      sceneHeight = document.getElementById("renderArea").offsetHeight;
      renderer.setSize(sceneWidth, sceneHeight);
      //renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = sceneWidth / sceneHeight;
      camera.updateProjectionMatrix();
      if (!disable3Dcontrols) {
        controls.reset();
      }
      setTimeout(function() {
        resetView();
      }, 10);
    }, 10)

  }

}

$(window).on('resize', function() {
  console.log("Window Resize")
  fixRenderSize();
});

function resetView(object) {
  // console.log(resetView.caller);
  if (!object) {
    if (objectsInScene.length > 0) {
      var insceneGrp = new THREE.Group()
      for (i = 0; i < objectsInScene.length; i++) {
        var object = objectsInScene[i].clone();
        insceneGrp.add(object)
      }
      // scene.add(insceneGrp)
      viewExtents(insceneGrp);
      // scene.remove(insceneGrp)
    } else {
      viewExtents(helper);
    }
  } else {
    if (object.userData.linePoints.length > 1) {
      viewExtents(object);
    }
  }
}

function drawMachineCoordinates(status) {

  if (laststatus != undefined && grblParams.$130 !== undefined && grblParams.$131 !== undefined && grblParams.$132 !== undefined) {
    var machineCoordinatesBoxMaxX = status.machine.position.work.x - status.machine.position.offset.x
    var machineCoordinatesBoxMaxY = status.machine.position.work.y - status.machine.position.offset.y
    var machineCoordinatesBoxMaxZ = status.machine.position.work.z - status.machine.position.offset.z

    var machineCoordinatesBoxMinX = machineCoordinatesBoxMaxX - grblParams.$130
    var machineCoordinatesBoxMinY = machineCoordinatesBoxMaxY - grblParams.$131
    var machineCoordinatesBoxMinZ = machineCoordinatesBoxMaxZ - grblParams.$132

    console.log("X", machineCoordinatesBoxMinX, machineCoordinatesBoxMaxX)
    console.log("Y", machineCoordinatesBoxMinY, machineCoordinatesBoxMaxY)
    console.log("Z", machineCoordinatesBoxMinZ, machineCoordinatesBoxMaxZ)


    workspace.remove(machineCoordinateSpace);
    machineCoordinateSpace = new THREE.Group();

    var material = new THREE.LineBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3
    });

    // Z min layer
    var points = [];
    points.push(new THREE.Vector3(machineCoordinatesBoxMinX, machineCoordinatesBoxMinY, machineCoordinatesBoxMinZ));
    points.push(new THREE.Vector3(machineCoordinatesBoxMaxX, machineCoordinatesBoxMinY, machineCoordinatesBoxMinZ));
    points.push(new THREE.Vector3(machineCoordinatesBoxMaxX, machineCoordinatesBoxMaxY, machineCoordinatesBoxMinZ));
    points.push(new THREE.Vector3(machineCoordinatesBoxMinX, machineCoordinatesBoxMaxY, machineCoordinatesBoxMinZ));
    points.push(new THREE.Vector3(machineCoordinatesBoxMinX, machineCoordinatesBoxMinY, machineCoordinatesBoxMinZ));
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    machineCoordinateSpace.add(new THREE.Line(geometry, material));

    // Z max layer
    var points = [];
    points.push(new THREE.Vector3(machineCoordinatesBoxMinX, machineCoordinatesBoxMinY, machineCoordinatesBoxMaxZ));
    points.push(new THREE.Vector3(machineCoordinatesBoxMaxX, machineCoordinatesBoxMinY, machineCoordinatesBoxMaxZ));
    points.push(new THREE.Vector3(machineCoordinatesBoxMaxX, machineCoordinatesBoxMaxY, machineCoordinatesBoxMaxZ));
    points.push(new THREE.Vector3(machineCoordinatesBoxMinX, machineCoordinatesBoxMaxY, machineCoordinatesBoxMaxZ));
    points.push(new THREE.Vector3(machineCoordinatesBoxMinX, machineCoordinatesBoxMinY, machineCoordinatesBoxMaxZ));
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    machineCoordinateSpace.add(new THREE.Line(geometry, material));

    // corner f/l
    var points = [];
    points.push(new THREE.Vector3(machineCoordinatesBoxMinX, machineCoordinatesBoxMinY, machineCoordinatesBoxMinZ));
    points.push(new THREE.Vector3(machineCoordinatesBoxMinX, machineCoordinatesBoxMinY, machineCoordinatesBoxMaxZ));
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    machineCoordinateSpace.add(new THREE.Line(geometry, material));

    // corner f/r
    var points = [];
    points.push(new THREE.Vector3(machineCoordinatesBoxMinX, machineCoordinatesBoxMaxY, machineCoordinatesBoxMinZ));
    points.push(new THREE.Vector3(machineCoordinatesBoxMinX, machineCoordinatesBoxMaxY, machineCoordinatesBoxMaxZ));
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    machineCoordinateSpace.add(new THREE.Line(geometry, material));

    // corner r/l
    var points = [];
    points.push(new THREE.Vector3(machineCoordinatesBoxMaxX, machineCoordinatesBoxMinY, machineCoordinatesBoxMinZ));
    points.push(new THREE.Vector3(machineCoordinatesBoxMaxX, machineCoordinatesBoxMinY, machineCoordinatesBoxMaxZ));
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    machineCoordinateSpace.add(new THREE.Line(geometry, material));

    // corner r/r
    var points = [];
    points.push(new THREE.Vector3(machineCoordinatesBoxMaxX, machineCoordinatesBoxMaxY, machineCoordinatesBoxMinZ));
    points.push(new THREE.Vector3(machineCoordinatesBoxMaxX, machineCoordinatesBoxMaxY, machineCoordinatesBoxMaxZ));
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    machineCoordinateSpace.add(new THREE.Line(geometry, material));

    workspace.add(machineCoordinateSpace);
  }



}