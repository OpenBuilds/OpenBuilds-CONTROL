"use strict";

// Global Vars
var scene = true;
var camera, renderer;
var gridsystem = new THREE.Group();
var cone;

var CONE_FACE_COUNT = 8;

var controls;

var sizexmin;
var sizeymin;
var sizexmax;
var sizeymax;
var clearSceneFlag = false;
var viewSettings = {grid: true, ruler: true, toolpath: true, tool: true, machine: true, heightmap: true};

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

// pause Animation when we lose webgl context focus
var pauseAnimation = false;

var workspace = new THREE.Group();
workspace.name = "Workspace"

var machineCoordinateSpace;

const defaultXmin = 0,
  defaultXmax = 307,
  defaultYmin = 0,
  defaultYmax = 207

function disposeGeometry(obj) {
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) {
    if (obj.material.map) obj.material.map.dispose();
    if (obj.material.normalMap) obj.material.normalMap.dispose();
    if (obj.material.roughnessMap) obj.material.roughnessMap.dispose();
    if (obj.material.displacementMap) obj.material.displacementMap.dispose();
    obj.material.dispose();
  }
  obj.children.forEach((child) => { disposeGeometry(child); });
}

function disposeGeometryAndRemove(obj) {
  disposeGeometry(obj);
  if (obj.parent != undefined)
    obj.parent.remove(obj);
}

function cleanupWorkspace() {
  simstop();

  let obj = workspace.getObjectByName("Scene Lights");
  if (obj) disposeGeometryAndRemove(obj);

  obj = workspace.getObjectByName("Skydome");
  if (obj) disposeGeometryAndRemove(obj);

  obj = workspace.getObjectByName("Simulation Marker");
  if (obj) disposeGeometryAndRemove(obj);

  obj = workspace.getObjectByName("Grid System");
  if (obj) disposeGeometryAndRemove(obj);

  obj = workspace.getObjectByName("Machine Extents");
  if (obj) disposeGeometryAndRemove(obj);
}

function drawWorkspace(xmin, xmax, ymin, ymax) {

  if (!xmin) xmin = defaultXmin;
  if (!ymin) ymin = defaultYmin;
  if (!xmax) xmax = defaultXmax;
  if (!ymax) ymax = defaultYmax;

  const sceneLights = new THREE.Group();

  const light = new THREE.DirectionalLight(0xffffff, 0.8);
  light.position.set(0, 2, 25).normalize();
  light.name = "Light1;"
  sceneLights.add(light);

  const light2 = new THREE.DirectionalLight(0xffffff);
  light2.name = "Light2"
  light2.position.set(-500, -500, 1).normalize();
  sceneLights.add(light2);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.color.setHSL(0.1, 1, 0.95);
  dirLight.position.set(-1, 1.75, 1);
  dirLight.position.multiplyScalar(30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  const d = 50;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.far = 3500;
  dirLight.shadow.bias = -0.0001;
  dirLight.name = "dirLight;"
  sceneLights.add(dirLight);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
  hemiLight.color.setHSL(Theme.HEMI_LIGHT_COLOR.H, Theme.HEMI_LIGHT_COLOR.S, Theme.HEMI_LIGHT_COLOR.L);
  hemiLight.groundColor.setHSL(0.095, 1, 0.75);
  hemiLight.position.set(0, 50, 0);
  hemiLight.visible = false;
  hemiLight.name = "hemiLight"
  sceneLights.add(hemiLight);

  sceneLights.name = "Scene Lights"
  workspace.add(sceneLights);

  scene.fog = new THREE.Fog(0xffffff, 1, 20000);

  // SKYDOME
  if (!disable3Dskybox) {
    const uniforms = {
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

    const vertexShader = document.getElementById('vertexShader').textContent;
    const fragmentShader = document.getElementById('fragmentShader').textContent;

    const skyGeo = new THREE.SphereGeometry(9900, 64, 15);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
      side: THREE.DoubleSide
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.name = "Skydome"
    workspace.add(sky);
  }

  if (!disable3Drealtimepos) {
    const coneGeo = new THREE.CylinderGeometry(0, 5, 40, CONE_FACE_COUNT, 1, false)
    coneGeo.applyMatrix(new THREE.Matrix4().makeTranslation(0, -20, 0));

    cone = new THREE.Mesh(coneGeo, new THREE.MeshLambertMaterial({
      color: 0x0000ff
    }));

    cone.overdraw = true;
    cone.rotation.x = -90 * Math.PI / 180;
    cone.position.x = 0;
    cone.position.y = 0;
    cone.position.z = 0;
    cone.material.opacity = 0.6;
    cone.material.transparent = true;
    cone.castShadow = false;
    cone.visible = viewSettings.tool;
    cone.name = "Simulation Marker"
    workspace.add(cone)
  }

  gridsystem.name = "Grid System"
  workspace.add(gridsystem);
  if (localStorage.getItem('unitsMode') == "in") {
    redrawGrid(xmin / 25.4, xmax / 25.4, ymin / 25.4, ymax / 25.4, true);
  } else {
    redrawGrid(xmin, xmax, ymin, ymax, false);
  }

  const machineBoxVerts = [ // unit cube
    0, 0, 0, 0, 0, 1,
    0, 0, 1, 0, 1, 1,
    0, 1, 1, 0, 1, 0,
    0, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 0, 0,
    0, 0, 1, 1, 0, 1,
    0, 1, 1, 1, 1, 1,
    0, 1, 0, 1, 1, 0,
    1, 0, 0, 1, 0, 1,
    1, 0, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 0,
    1, 1, 0, 1, 0, 0,
  ];

  const machineBoxMaterial = new THREE.LineBasicMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.3
  });
  const machineBoxGeo = new THREE.BufferGeometry();
  machineBoxGeo.setAttribute('position', new THREE.Float32BufferAttribute( machineBoxVerts, 3));
  machineCoordinateSpace = new THREE.LineSegments(machineBoxGeo, machineBoxMaterial);
  machineCoordinateSpace.name = "Machine Extents";
  machineCoordinateSpace.visible = viewSettings.machine;
  machineCoordinateSpace.material.visible = false; // make the material invisible until the box size is computed
  workspace.add(machineCoordinateSpace);
  updateMachineCoordinates();

  scene.add(workspace)
}

function redrawGrid(xmin, xmax, ymin, ymax, inches) {
  if (inches) {
    xmin = Math.floor(xmin * 25.4);
    xmax = Math.ceil(xmax * 25.4);
    ymin = Math.floor(ymin * 25.4);
    ymax = Math.ceil(ymax * 25.4);
  }

  sizexmin = xmin;
  sizexmax = xmax;
  sizeymin = ymin;
  sizeymax = ymax;

  if (xmax - xmin < 110) {
    const d = (110 - (xmax - xmin)) / 2;
    xmin -= d;
    xmax += d;
  }

  if (ymax - ymin < 110) {
    const d = (110 - (ymax - ymin)) / 2;
    ymin -= d;
    ymax += d;
  }

  while (gridsystem.children.length > 0) {
    disposeGeometryAndRemove(gridsystem.children[0]);
  }

  const axesgrp = new THREE.Object3D();
  axesgrp.name = "Axes Markers"

  const offset = 5
  const size = 5

  // add axes labels
  const xlbl = makeSprite("webgl", {
    x: xmax + offset,
    y: 0,
    z: 0,
    text: "X",
    color: Theme.X_RULER_LABEL_COLOR,
    size: size
  });
  const ylbl = makeSprite("webgl", {
    x: 0,
    y: ymax + offset,
    z: 0,
    text: "Y",
    color: Theme.Y_RULER_LABEL_COLOR,
    size: size
  });


  axesgrp.add(xlbl);
  axesgrp.add(ylbl);

  const materialX = new THREE.LineBasicMaterial({
    color: Theme.X_AXIS_LINE_COLOR
  });

  const materialY = new THREE.LineBasicMaterial({
    color: Theme.Y_AXIS_LINE_COLOR
  });

  const geometryX = new THREE.Geometry();
  geometryX.vertices.push(
    new THREE.Vector3(-0.1, 0, 0),
    new THREE.Vector3(-0.1, ymax, 0)
  );

  const geometryY = new THREE.Geometry();
  geometryY.vertices.push(
    new THREE.Vector3(0, -0.1, 0),
    new THREE.Vector3(xmax, -0.1, 0)
  );

  const line1 = new THREE.Line(geometryX, materialY);
  const line2 = new THREE.Line(geometryY, materialX);
  axesgrp.add(line1);
  axesgrp.add(line2);

  const vertices10 = [];
  const vertices100 = [];

  const scale = inches ? 25.4/5 : 10;
  const major = inches ? 5 : 10;
  const ixmin = Math.ceil(xmin / scale);
  const ixmax = Math.floor(xmax / scale);
  const iymin = Math.ceil(ymin / scale);
  const iymax = Math.floor(ymax / scale);

  for (let i = ixmin; i <= ixmax; i++) {
    const x = i * scale;
    if (i % major == 0) {
      vertices100.push(x, ymin, 0, x, ymax, 0);
    } else {
      vertices10.push(x, ymin, 0, x, ymax, 0);
    }
  }

  for (let i = iymin; i <= iymax; i++) {
    const y = i * scale;
    if (i % major == 0) {
      vertices100.push(xmin, y, 0, xmax, y, 0);
    } else {
      vertices10.push(xmin, y, 0, xmax, y, 0);
    }
  }

  const material10 = new THREE.LineBasicMaterial({
    color: Theme.GRID_STEP_10_COLOR,
    opacity: Theme.GRID_STEP_10_OPACITY,
    transparent: true
  });

  const geometry10 = new THREE.BufferGeometry();
  geometry10.setAttribute('position', new THREE.Float32BufferAttribute( vertices10, 3));

  const grid10 = new THREE.LineSegments(geometry10, material10);
  grid10.receiveShadow = false;
  grid10.name = "GridHelper10";

  const material100 = new THREE.LineBasicMaterial({
    color: Theme.GRID_STEP_100_COLOR,
    opacity: Theme.GRID_STEP_100_OPACITY,
    transparent: true
  });

  const geometry100 = new THREE.BufferGeometry();
  geometry100.setAttribute('position', new THREE.Float32BufferAttribute( vertices100, 3));

  const grid100 = new THREE.LineSegments(geometry100, material100);
  grid100.receiveShadow = false;
  grid100.name = "GridHelper100";

  const grid = new THREE.Group();
  grid.name = "Grid";
  grid.visible = viewSettings.grid;
  grid.add(grid10);
  grid.add(grid100);
  grid.add(axesgrp);
  gridsystem.add(grid);

  const ruler = drawRuler(xmin, xmax, ymin, ymax, inches);
  ruler.name = "Ruler";
  ruler.visible = viewSettings.ruler;
  gridsystem.add(ruler);
}

function init3D() {

  if (webgl) {
    printLog("<span class='fg-darkRed'>[ 3D Viewer ] </span><span class='fg-green'>WebGL Support found! success: this application will work optimally on this device!</span>")
    renderer = new THREE.WebGLRenderer({
      autoClearColor: true,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true
    });
    // ThreeJS Render/Control/Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.z = 295;
    camera.up = new THREE.Vector3(0, 0, 1);

    $('#renderArea').append(renderer.domElement);
    renderer.setClearColor(0xffffff, 1); // Background color of viewer = transparent
    renderer.clear();

    const sceneWidth = document.getElementById("renderArea").offsetWidth;
    const sceneHeight = document.getElementById("renderArea").offsetHeight;
    renderer.setSize(sceneWidth, sceneHeight);
    camera.aspect = sceneWidth / sceneHeight;
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

    drawWorkspace(defaultXmin, defaultXmax, defaultYmin, defaultYmax);

    readViewSettings();

    setTimeout(function() {
      resetView()
      animate();
    }, 200)

    // The viewport doesn't resize if it is hidden.
    // The observer forces an update when the viewport becomes visible.
    const observer = new IntersectionObserver(fixRenderSize, {root: document.documentElement});
    observer.observe(document.getElementById("renderArea"));

  } else {
    printLog("<span class='fg-darkRed'>[ ERROR ]</span>  <span class='fg-darkRed'>No WebGL Support found on this computer! Disabled 3D Viewer - Sorry!</span>")
    printLog("<span class='fg-darkRed'>[ ERROR ]</span>  <span class='fg-darkRed'>" + getWebGLErrorMessage() + "</span>")
  }
}

function animate() {
  if (!pauseAnimation) {
    camera.updateMatrixWorld();
    simAnimate()
    toolAnimate();

    if (clearSceneFlag) {
      while (scene.children.length > 1) {
        disposeGeometryAndRemove(scene.children[1]);
      }

      if (object) {
        scene.add(object)
      }

      clearSceneFlag = false;
    } // end clearSceneFlag

    // Limited FPS https://stackoverflow.com/questions/11285065/limiting-framerate-in-three-js-to-increase-performance-requestanimationframe
    setTimeout(function() {
      requestAnimationFrame(animate);
    }, 60);

    renderer.render(scene, camera);
  }
}

function viewExtents(objecttosee) {
  // lets override the bounding box with a newly
  // generated one
  // get its bounding box
  if (objecttosee) {
    // console.log(objecttosee)
    const helper = new THREE.BoxHelper(objecttosee);
    helper.update();
    const box3 = new THREE.Box3();
    box3.setFromObject(helper);
    const minx = box3.min.x;
    const miny = box3.min.y;
    const maxx = box3.max.x;
    const maxy = box3.max.y;
    const minz = box3.min.z;
    const maxz = box3.max.z;

    const lenx = maxx - minx;
    const leny = maxy - miny;
    const lenz = maxz - minz;
    const centerx = minx + (lenx / 2);
    const centery = miny + (leny / 2);
    const centerz = minz + (lenz / 2);

    const maxlen = Math.max(lenx, leny, lenz);
    const target = new THREE.Vector3(centerx, centery, centerz);

    // place the camera above the center, at twice the maxlen, looking straight down
    camera.position.set(centerx, centery, centerz + 2 * maxlen);
    camera.fov = 30; // degrees
    camera.lookAt(target);
    camera.rotation.set(0, 0, 0);
    camera.updateProjectionMatrix();

    if (!disable3Dcontrols) {
      controls.target = target;
      controls.update();
    }
  }
}

function makeSprite(rendererType, vals) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const textHeight = 100;
  let actualFontSize = 10;

  const txt = vals.text;
  if (vals.size) actualFontSize = vals.size;

  context.font = "normal " + textHeight + "px Impact";
  const metrics = context.measureText(txt);
  const textWidth = metrics.width;

  canvas.width = textWidth;
  canvas.height = textHeight;
  context.font = "normal " + textHeight + "px Impact";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = vals.color;

  context.fillText(txt, textWidth / 2, textHeight / 2);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;

  const material = new THREE.SpriteMaterial({
    map: texture,
    // useScreenCoordinates: false,
    transparent: true,
    opacity: Theme.SPRITE_OPACITY
  });
  material.transparent = true;
  const textObject = new THREE.Object3D();
  textObject.position.x = vals.x;
  textObject.position.y = vals.y;
  textObject.position.z = vals.z;
  const sprite = new THREE.Sprite(material);
  textObject.textHeight = actualFontSize;
  textObject.textWidth = (textWidth / textHeight) * textObject.textHeight;
  if (rendererType == "2d") {
    sprite.scale.set(textObject.textWidth / textWidth, textObject.textHeight / textHeight, 1);
  } else {
    sprite.scale.set(textWidth / textHeight * actualFontSize, actualFontSize, 1);
  }

  textObject.add(sprite);

  return textObject;
}


// Global Function to keep three fullscreen

function fixRenderSize() {
  if (renderer) {
    setTimeout(function() {
      const sceneWidth = document.getElementById("renderArea").offsetWidth;
      const sceneHeight = document.getElementById("renderArea").offsetHeight;
      if (sceneWidth > 0 && sceneHeight > 0) {
        renderer.setSize(sceneWidth, sceneHeight);
        camera.aspect = sceneWidth / sceneHeight;
        camera.updateProjectionMatrix();
      }
    }, 0);
  }
}

$(window).on('resize', fixRenderSize);

function resetView(object) {
  if (object && object.userData.pointCount > 1) {
    viewExtents(object);
  } else {
    viewExtents(gridsystem);
  }
}

function updateMachineCoordinates() {
  const limits = computeMachineLimits(0);
  const sizeX = limits.maxX - limits.minX;
  const sizeY = limits.maxY - limits.minY;
  const sizeZ = limits.maxZ - limits.minZ;

  if (laststatus == undefined || sizeX <= 0 || sizeY <= 0 || sizeZ <= 0) {
    // if the box is invalid, just make it default size and hide the material
    machineCoordinateSpace.position.set(0, 0, 0);
    machineCoordinateSpace.scale.set(1, 1, 1);
    machineCoordinateSpace.material.visible = false;
  } else {
    machineCoordinateSpace.position.set(
      limits.minX - laststatus.machine.position.offset.x,
      limits.minY - laststatus.machine.position.offset.y,
      limits.minZ - laststatus.machine.position.offset.z);
    machineCoordinateSpace.scale.set(sizeX, sizeY, sizeZ);
    machineCoordinateSpace.material.visible = true;
  }
}

function readViewSettings() {
/* decided to make the settings non-persistent
  if (localStorage.getItem('viewSettings')) {
    const settings = JSON.parse(localStorage.getItem('viewSettings'));
    if (settings != undefined) {
      for (let prop in settings) {
        if (prop in viewSettings && typeof(settings[prop]) == typeof(viewSettings[prop]))
          viewSettings[prop] = settings[prop];
      }
    }
  }
*/
  $('#viewGridSetting:checkbox').prop('checked', viewSettings.grid);
  $('#viewRulerSetting:checkbox').prop('checked', viewSettings.ruler);
  $('#viewToolpathSetting:checkbox').prop('checked', viewSettings.toolpath);
  $('#viewToolSetting:checkbox').prop('checked', viewSettings.tool);
  $('#viewMachineSetting:checkbox').prop('checked', viewSettings.machine);
  $('#viewHeighmtapSetting:checkbox').prop('checked', viewSettings.heightmap);

  updateViewSettings();
}

function saveViewSettings() {
/* decided to make the settings non-persistent
  localStorage.setItem('viewSettings', JSON.stringify(viewSettings));
*/
}

function changeViewSettings() {
  viewSettings.grid = $('#viewGridSetting').is(':checked');
  viewSettings.ruler = $('#viewRulerSetting').is(':checked');
  viewSettings.toolpath = $('#viewToolpathSetting').is(':checked');
  viewSettings.tool = $('#viewToolSetting').is(':checked');
  viewSettings.machine = $('#viewMachineSetting').is(':checked');
  viewSettings.heightmap = $('#viewHeighmtapSetting').is(':checked');
  saveViewSettings();
  updateViewSettings();
}

function updateViewSettings() {
  if (scene) {
    if (object)
      object.visible = viewSettings.toolpath;
    if (cone)
      cone.visible = viewSettings.tool;

    const grid = scene.getObjectByName("Grid");
    if (grid)
      grid.visible = viewSettings.grid;

    const ruler = scene.getObjectByName("Ruler");
    if (ruler)
      ruler.visible = viewSettings.ruler;

    if (machineCoordinateSpace)
      machineCoordinateSpace.visible = viewSettings.machine;

    const heightmap = scene.getObjectByName("Heightmap");
    if (heightmap)
      heightmap.visible = viewSettings.heightmap;
  }
}
