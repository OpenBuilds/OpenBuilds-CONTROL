const HEIGHTMAP_GCODE_HEADER1a = "; This G-code was modified by the Heightmap tool. To restore the original state, select Heightmap -> Revert G-code changes";
const HEIGHTMAP_GCODE_HEADER1b = "; This G-code was modified by the Heightmap tool.";
const HEIGHTMAP_GCODE_HEADER2 = "; The original lines that were removed are prefixed with 'HM'. The new lines added in their place end with 'HM'";
const HEIGHTMAP_GCODE_END_MARKER = " ; HM";
const HEIGHTMAP_GCODE_START_MARKER = "; HM: ";

// Heightmap data
var heightmapStart = {x: -50, y: -50};
var heightmapSize = {x: 100, y: 100};
var heightmapPointCount = {x: 5, y: 5};
var heightmapAnchor = {x: 0, y: 0};
var heightmapSeek = 15;
var heigtmapFeed = 50;
var heightmapRetract = 5;
var heigtmapFeedXY = 1000;
var heightmapDataZ0 = undefined;
var heightmapData = undefined;
var heightmapPending = undefined;
var heightmapDataValid = false;
var heightmapGeo = undefined;

// Heightmap settings (persistent)
var heightmapSettings = {
  enabled: false, // if the heightmap tools are enabled
  minSegmentLength: 1, // minimum length for linear and arc segments
  zThreshold: 0.01, // maximum Z deviation between the toolpath and the heightmap
  arcThreshold: 0.005, // maximum deviation when converting arcs to lines
  modifyRapids: false, // modify the height of rapid moves (G0 commands)
  allowRevert: true, // preserve original lines as comments
};

const heightmapFilters = [
  {name: "Comma Separate Values files", extensions: ["csv"]},
  {name: "All files", extensions: ["*"]},
];

function clearHeightmapMesh() {
  if (heightmapGeo) {
    disposeGeometryAndRemove(heightmapGeo);
  }
  heightmapGeo = undefined;
}

function heightmapSettingChange() {
  var start = {x: Number($('#heightmapX').val()), y: Number($('#heightmapY').val())};
  var size = {x: Math.max(Number($('#heightmapW').val()), 1), y: Math.max(Number($('#heightmapL').val()), 1)};
  var pointCount = {x: Math.max(parseInt($('#heightmapNX').val()), 2), y: Math.max(parseInt($('#heightmapNY').val()), 2)};
  var anchor = {x: Number($('#heightmapAX').val()), y: $('#heightmapAY').val()};

  if (Math.abs(start.x-heightmapStart.x) > 0.01 || Math.abs(start.y-heightmapStart.y) > 0.01 ||
    Math.abs(size.x-heightmapSize.x) > 0.01 || Math.abs(size.y-heightmapSize.y) > 0.01 ||
    pointCount.x != heightmapPointCount.x || pointCount.y != heightmapPointCount.y ||
    Math.abs(anchor.x-heightmapAnchor.x) > 0.01 || Math.abs(anchor.y-heightmapAnchor.y) > 0.01) {
    $('#hightmapChangeWarning').css({color: "red"});
  } else {
    $('#hightmapChangeWarning').css({color: ""});
  }
}

const heightmapSettingsDlg = `
<div class="row mb-2 border-top bd-gray">
  <label class="cell-sm-3"><b>Grid Dimensions</b></label>
  <label class="cell-sm-9" id="hightmapChangeWarning" style="display:none; margin-left:-30px;"><small class="dark"><i>Changing these settings will clear the current heightmap data</i></small></label>
</div>

<div class="row mb-2">
  <label class="cell-sm-3 pt-1" style="padding-left:30px;" title="Starting corner of the heightmap grid">Start</label>
  <div class="cell-sm-4">
    <input id="heightmapX" type="number" style="text-align:right;" data-role="input" data-prepend="X" data-append="mm" data-clear-button="false" data-editable="true" onchange="heightmapSettingChange()"/>
  </div>
  <div class="cell-sm-4">
    <input id="heightmapY" type="number" style="text-align:right;" data-role="input" data-prepend="Y" data-append="mm" data-clear-button="false" data-editable="true"  onchange="heightmapSettingChange()"/>
  </div>
</div>

<div class="row mb-2">
  <label class="cell-sm-3 pt-1" style="padding-left:30px;" title="Total size of the heightmap grid">Size<button
    id="heightmapAutoSize" class="button" onclick="heightmapAutoSize();" title="Updates the grid dimensions from the bounding box of the G-code" style="margin-left:50px; margin-top:-5px; margin-bottom:-5px;">Auto Size</button>
  </label>
  <div class="cell-sm-4">
    <input id="heightmapW" type="number" style="text-align:right;" data-role="input" data-prepend="X (Width)" data-append="mm" data-clear-button="false" data-editable="true"  onchange="heightmapSettingChange()"/>
  </div>
  <div class="cell-sm-4">
    <input id="heightmapL" type="number" style="text-align:right;" data-role="input" data-prepend="Y (Length)" data-append="mm" data-clear-button="false" data-editable="true"  onchange="heightmapSettingChange()"/>
  </div>
</div>

<div class="row mb-2">
  <label class="cell-sm-3 pt-1" style="padding-left:30px;" title="Number of probe points along X and Y">Probe Point Count</label>
  <div class="cell-sm-4">
    <input id="heightmapNX" type="number" style="text-align:right;" data-role="input" data-prepend="X" data-append="points" data-clear-button="false" data-editable="true"  onchange="heightmapSettingChange()"/>
  </div>
  <div class="cell-sm-4">
    <input id="heightmapNY" type="number" style="text-align:right;" data-role="input" data-prepend="Y" data-append="points" data-clear-button="false" data-editable="true"  onchange="heightmapSettingChange()"/>
  </div>
</div>

<div class="row mb-3">
  <label class="cell-sm-3 pt-1" style="padding-left:30px;" title="The anchor point is the location where the initial Z0 measurement will be taken.
It has to match the Z0 of the G-code.">Anchor point</label>
  <div class="cell-sm-4">
    <input id="heightmapAX" type="number" style="text-align:right;" data-role="input" data-prepend="X" data-append="mm" data-clear-button="false" data-editable="true"  onchange="heightmapSettingChange()"/>
  </div>
  <div class="cell-sm-4">
    <input id="heightmapAY" type="number" style="text-align:right;" data-role="input" data-prepend="Y" data-append="mm" data-clear-button="false" data-editable="true"  onchange="heightmapSettingChange()"/>
  </div>
</div>

<div class="row mb-2 border-top bd-gray">
  <label class="cell-sm-6"><b>Z Probe Settings</b></label>
</div>

<div class="row mb-2">
  <label class="cell-sm-3 pt-1" style="padding-left:30px;" title="Downward distance and feed rate to use during probing.">Seek</label>
  <div class="cell-sm-4">
    <input id="heightmapSeek" type="number" style="text-align:right;" data-role="input" data-prepend="Travel" data-append="mm" data-clear-button="false" data-editable="true" />
  </div>
  <div class="cell-sm-4">
    <input id="heightmapFeed" type="number" style="text-align:right;" data-role="input" data-prepend="Feed" data-append="mm/min" data-clear-button="false" data-editable="true" />
  </div>
</div>

<div class="row mb-2">
  <label class="cell-sm-3 pt-1" style="padding-left:30px;" title="Retraction height after probing.
The height needs to be large enough to safely move above the material surface.
For flatter surfaces use smaller numbers to speed up the process.
This number should be smaller than the Seek distance.">Retract</label>
  <div class="cell-sm-4">
    <input id="heightmapRetract" type="number" style="text-align:right;" data-role="input" data-prepend="Travel" data-append="mm" data-clear-button="false" data-editable="true" />
  </div>
</div>

<div class="row mb-3">
  <label class="cell-sm-3 pt-1" style="padding-left:30px;" title="Horizontal speed for getting from point to point.
Higher speed will make the probing faster, but will make potential collisions with the material more serious.">Horizontal Move</label>
  <div class="cell-sm-4">
    <input id="heightmapFeedXY" type="number" style="text-align:right;" data-role="input" data-prepend="Feed" data-append="mm/min" data-clear-button="false" data-editable="true" />
  </div>
</div>

<div class="row mb-2 border-top bd-gray">
  <label class="cell-sm-3" title="The heightmap tool needs to subdivide the toolpaths into small linear segments to follow the surface.
Smaller numbers will produce more accurate results, but will generate larger and slower G-code."><b>Toolpath Settings</b></label>
  <label class="cell-sm-9" style="margin-left:-30px;"><small class="dark"><i>These settings are global, independent of the current heightmap</i></small></label>
</div>

<div class="row mb-2">
  <label class="cell-sm-3" style="padding-top:6px; padding-left:30px;" title="Minimum segment length for linear and arc segments">Min segment length</label>
  <div class="cell-sm-3">
    <input id="heightmapMinLength" type="number" style="text-align:right;" data-role="input" data-append="mm" data-clear-button="false" data-editable="true" />
  </div>
</div>

<div class="row mb-2">
  <label class="cell-sm-3" style="margin-bottom:0; padding-top:6px; padding-left:30px;" title="How closely the path will follow the surface">Z Threshold</label>
  <div class="cell-sm-3">
    <input id="heightmapZThreshold" type="number" style="text-align:right;" data-role="input" data-append="mm" data-clear-button="false" data-editable="true" />
  </div>
  <label style="-webkit-box-flex:0; -ms-flex:0 0 18%; flex:0 0 18%; max-width:18%; text-align:right; margin-bottom:0; padding-top:6px;" title="How closely the path will follow the arcs">Arc Threshold</label>
  <div class="cell-sm-3">
    <input id="heightmapArcThreshold" type="number" style="text-align:right; max-width:170px;" data-role="input" data-append="mm" data-clear-button="false" data-editable="true" />
  </div>
</div>

<div class="row mb-2">
  <label class="cell-sm-3" style="margin-bottom:0; padding-top:6px; padding-left:30px;" title="When this is checked, the rapid moves will also be modified to follow the surface.
This could be useful for very uneven heightmaps.">Apply To Rapids</label>
  <div class="cell-sm-4" style="margin-left:-3px; margin-right:3px;">
    <input id="heightmapRapids" type="checkbox" data-role="checkbox" data-style="2"/>
  </div>
  <label class="cell-sm-3" style="margin-bottom:0; padding-top:6px;" title="When this is checked, the original G-code lines will be preserved as comments and the changes can be undone.
You can uncheck it for large files to reduce the final size.">Preserve original lines</label>
  <div class="cell-sm-1" style="padding-left:30px;">
    <input id="heightmapAllowRevert" type="checkbox" data-role="checkbox" data-style="2"/>
  </div>
</div>`;

function readHeightmapSettings() {
  var start = {x: Number($('#heightmapX').val()), y: Number($('#heightmapY').val())};
  var size = {x: Math.max(Number($('#heightmapW').val()), 1), y: Math.max(Number($('#heightmapL').val()), 1)};
  var pointCount = {x: Math.max(parseInt($('#heightmapNX').val()), 2), y: Math.max(parseInt($('#heightmapNY').val()), 2)};
  var anchor = {x: Number($('#heightmapAX').val()), y: Number($('#heightmapAY').val())};

  if (Math.abs(start.x-heightmapStart.x) > 0.01 || Math.abs(start.y-heightmapStart.y) > 0.01 ||
    Math.abs(size.x-heightmapSize.x) > 0.01 || Math.abs(size.y-heightmapSize.y) > 0.01 ||
    pointCount.x != heightmapPointCount.x || pointCount.y != heightmapPointCount.y ||
    Math.abs(anchor.x-heightmapAnchor.x) > 0.01 || Math.abs(anchor.y-heightmapAnchor.y) > 0.01) {
    clearHeightmapData();
  }

  heightmapStart = start;
  heightmapSize = size;
  heightmapPointCount = pointCount;
  heightmapAnchor = anchor;

  heightmapSeek = Math.max(Number($('#heightmapSeek').val()), 0.1);
  heigtmapFeed = Math.max(Number($('#heightmapFeed').val()), 1);
  heightmapRetract = Math.max(Number($('#heightmapRetract').val()), 0.1);
  heigtmapFeedXY = Math.max(Number($('#heightmapFeedXY').val()), 1);

  heightmapSettings.minSegmentLength = Math.max(Number($('#heightmapMinLength').val()), 1);
  heightmapSettings.zThreshold = Math.max(Number($('#heightmapZThreshold').val()), 0.01);
  heightmapSettings.arcThreshold = Math.max(Number($('#heightmapArcThreshold').val()), 0.001);
  heightmapSettings.modifyRapids = $('#heightmapRapids').prop('checked');
  heightmapSettings.allowRevert = $('#heightmapAllowRevert').prop('checked');

  localStorage.setItem("heightmapSettings", JSON.stringify(heightmapSettings));
}

function heightmapAutoSize() {
  if (object) {
    var bbox2 = new THREE.Box3().setFromObject(object);
    $('#heightmapX').val(bbox2.min.x.toFixed(2));
    $('#heightmapY').val(bbox2.min.y.toFixed(2));
    $('#heightmapW').val((bbox2.max.x - bbox2.min.x).toFixed(2));
    $('#heightmapL').val((bbox2.max.y - bbox2.min.y).toFixed(2));
    heightmapSettingChange();
  }
}

function editHeightmapSettings() {
  Metro.dialog.create({
    clsDialog: 'dark',
    title: "<i class='mif-chart-bars'></i> Heightmap Settings",
    content: heightmapSettingsDlg,
    width: 850,
    actions: [
      {
        caption: "OK",
        cls: "js-dialog-close success",
        onclick: function() {
          readHeightmapSettings();
        }
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {}
      },
    ],
  });

  $('#heightmapX').val(heightmapStart.x);
  $('#heightmapY').val(heightmapStart.y);
  $('#heightmapW').val(heightmapSize.x);
  $('#heightmapL').val(heightmapSize.y);
  $('#heightmapNX').val(heightmapPointCount.x);
  $('#heightmapNY').val(heightmapPointCount.y);

  $('#heightmapAX').val(heightmapAnchor.x);
  $('#heightmapAY').val(heightmapAnchor.y);

  $('#heightmapSeek').val(heightmapSeek);
  $('#heightmapFeed').val(heigtmapFeed);
  $('#heightmapRetract').val(heightmapRetract);
  $('#heightmapFeedXY').val(heigtmapFeedXY);

  $('#heightmapMinLength').val(heightmapSettings.minSegmentLength);
  $('#heightmapZThreshold').val(heightmapSettings.zThreshold);
  $('#heightmapArcThreshold').val(heightmapSettings.arcThreshold);
  $('#heightmapRapids').prop('checked', heightmapSettings.modifyRapids);
  $('#heightmapAllowRevert').prop('checked', heightmapSettings.allowRevert);

  $('#heightmapAutoSize').prop('disabled', !object);
  if (heightmapDataValid) {
    $('#hightmapChangeWarning').show();
  }
}

function cubicInterpolation(z0, z1, z2, z3, d) {
  return z1 + 0.5*d * (z2 - z0 + d * (2*z0 - 5*z1 + 4*z2 - z3 + d * (3*(z1 - z2) + z3 - z0)));
}

function computeHeightmapZ(x, y) {
  if (heightmapData == undefined) return 1;

  x -= heightmapStart.x;
  y -= heightmapStart.y;
  x = Math.max(Math.min(x, heightmapSize.x), 0) * (heightmapPointCount.x-1) / heightmapSize.x; // [0..n-1]
  y = Math.max(Math.min(y, heightmapSize.y), 0) * (heightmapPointCount.y-1) / heightmapSize.y; // [0..n-1]

  var ix1 = Math.floor(x);
  var ix0 = Math.max(ix1-1, 0);
  var ix2 = Math.min(ix1+1, heightmapPointCount.x-1);
  var ix3 = Math.min(ix1+2, heightmapPointCount.x-1);

  var iy1 = Math.floor(y);
  var iy0 = Math.max(iy1-1, 0);
  var iy2 = Math.min(iy1+1, heightmapPointCount.y-1);
  var iy3 = Math.min(iy1+2, heightmapPointCount.y-1);

  var dx = x - ix1;
  var dy = y - iy1;

  var row = heightmapData[iy0];
  var z0 = cubicInterpolation(row[ix0], row[ix1], row[ix2], row[ix3], dx);
  row = heightmapData[iy1];
  var z1 = cubicInterpolation(row[ix0], row[ix1], row[ix2], row[ix3], dx);
  row = heightmapData[iy2];
  var z2 = cubicInterpolation(row[ix0], row[ix1], row[ix2], row[ix3], dx);
  row = heightmapData[iy3];
  var z3 = cubicInterpolation(row[ix0], row[ix1], row[ix2], row[ix3], dx);

  return cubicInterpolation(z0, z1, z2, z3, dy);
}

function generateHeightmapMesh() {
  heightmapGeo = new THREE.Object3D();
  heightmapGeo.name = "Heightmap";

  const subDivisionsX = 5;
  const subDivisionsY = 5;
  const subCellsX = (heightmapPointCount.x - 1) * subDivisionsX;
  const subCellsY = (heightmapPointCount.y - 1) * subDivisionsY;

  // create grid of vertices
  var dX = heightmapSize.x / subCellsX;
  var dY = heightmapSize.y / subCellsY;
  var grid = new Array(subCellsY + 1);
  for (let iy = 0; iy <= subCellsY; iy++) {
    const y = heightmapStart.y + iy*dY;
    grid[iy] = new Array(subCellsX + 1);
    for (let ix = 0; ix <= subCellsX; ix++) {
      const x = heightmapStart.x + ix*dX;
      grid[iy][ix] = {x: x, y: y, z: computeHeightmapZ(x, y)};
    }
  }

  // create the wireframe geometry
  var vertices1 = [];
  var vertices2 = [];
  for (let iy = 0; iy <= subCellsY; iy++) {
    const verts = (iy%subDivisionsY == 0) ? vertices1 : vertices2;
    for (let ix = 0; ix < subCellsX; ix++) {
      const g1 = grid[iy][ix];
      const g2 = grid[iy][ix+1];
      verts.push(g1.x, g1.y, g1.z, g2.x, g2.y, g2.z);
    }
  }

  for (let ix = 0; ix <= subCellsX; ix++) {
    const verts = (ix%subDivisionsX == 0) ? vertices1 : vertices2;
    for (let iy = 0; iy < subCellsY; iy++) {
      const g1 = grid[iy][ix];
      const g2 = grid[iy+1][ix];
      verts.push(g1.x, g1.y, g1.z, g2.x, g2.y, g2.z);
    }
  }

  var lineMtl1 = new THREE.LineBasicMaterial({color: Theme.HEIGHTMAP_GRID_COLOR1});
  var lineGeo1 = new THREE.BufferGeometry();
  lineGeo1.setAttribute('position', new THREE.Float32BufferAttribute( vertices1, 3));
  heightmapGeo.add(new THREE.LineSegments(lineGeo1, lineMtl1));

  var lineMtl2 = new THREE.LineBasicMaterial({color: Theme.HEIGHTMAP_GRID_COLOR2});
  var lineGeo2 = new THREE.BufferGeometry();
  lineGeo2.setAttribute('position', new THREE.Float32BufferAttribute( vertices2, 3));
  heightmapGeo.add(new THREE.LineSegments(lineGeo2, lineMtl2));

  // create the mesh geometry for the faces
  var vertices = new Float32Array((subCellsX+1) * (subCellsY+1) * 3);
  var idx = 0;
  for (let iy = 0; iy <= subCellsY; iy++) {
    for (let ix = 0; ix <= subCellsX; ix++) {
      var point = grid[iy][ix];
      vertices[idx] = point.x;
      vertices[idx+1] = point.y;
      vertices[idx+2] = point.z;
      idx += 3;
    }
  }

  var indices = new Array(subCellsX * subCellsY * 6);
  idx = 0;
  for (var iy = 0; iy < subCellsY; iy++) {
    for (var ix = 0; ix < subCellsX; ix++) {
      indices[idx] = iy*(subCellsX+1) + ix;
      indices[idx + 1] = indices[idx] + 1;
      indices[idx + 2] = indices[idx] + subCellsX + 2;
      indices[idx + 3] = indices[idx];
      indices[idx + 4] = indices[idx + 2];
      indices[idx + 5] = indices[idx + 2] - 1;
      idx += 6;
    }
  }

  var meshGeo = new THREE.BufferGeometry();
  meshGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  meshGeo.setIndex(indices);
  meshGeo.computeVertexNormals();

  const meshMtl = new THREE.MeshBasicMaterial({ color: Theme.HEIGHTMAP_FACE_COLOR, transparent: true, opacity: Theme.HEIGHTMAP_FACE_OPACITY });
  meshMtl.depthWrite = false;
  heightmapGeo.add(new THREE.Mesh(meshGeo, meshMtl));
  workspace.add(heightmapGeo);
}

function onHeightmapSuccess() {
  heightmapDataValid = true;
  clearHeightmapMesh();
  generateHeightmapMesh();

  Metro.dialog.create({
    clsDialog: 'dark',
    title: "<i class='mif-chart-bars'></i> Heightmap",
    content: "The heightmap probing is completed.<br>You can now apply it to the current G-code or save it to a file.",
    actions: [
      {
        caption: "OK",
        cls: "js-dialog-close success",
        onclick: function() {}
      }
    ],
  });
}

function clearHeightmapData() {
  heightmapData = undefined;
  heightmapDataZ0 = undefined;
  heightmapPending = undefined;
  heightmapDataValid = false;
  clearHeightmapMesh();
}

var heightmapProbeExpected;

function onHeightmapProbeResult(probe) {
  if (probe.state > 0) {
    if (heightmapProbeExpected == 0) {
      socket.off('prbResult');
      socket.emit('stop', {stop:true, jog: false, abort: false});
      showHeightmapError("The probe collided during horizontal travel.", true);
      return;
    }
    heightmapProbeExpected = 0;
    var wx = Number(probe.x) - laststatus.machine.position.offset.x;
    var wy = Number(probe.y) - laststatus.machine.position.offset.y;
    if (heightmapDataZ0 == undefined && Math.abs(wx - heightmapAnchor.x) < 0.1 && Math.abs(wy - heightmapAnchor.y) < 0.1) {
      heightmapDataZ0 = Number(probe.z);
      return;
    }

    var ix = Math.round((wx-heightmapStart.x) * (heightmapPointCount.x-1) / heightmapSize.x);
    var iy = Math.round((wy-heightmapStart.y) * (heightmapPointCount.y-1) / heightmapSize.y);

    if (heightmapDataZ0 != undefined &&
      ix >=0 && ix < heightmapPointCount.x &&
      iy >=0 && iy < heightmapPointCount.y &&
      heightmapData[iy][ix] == undefined) {
      heightmapData[iy][ix] = Number(probe.z) - heightmapDataZ0;
      heightmapPending--;
      if (heightmapPending == 0) {
        socket.off('prbResult');
        onHeightmapSuccess();
      }
    }
  } else {
    if (heightmapProbeExpected == 1) {
      socket.off('prbResult');
      showHeightmapError("The probe failed to touch the surface.", true);
      return;
    }
    heightmapProbeExpected = 1;
  }
}

function runHeightmapProbe() {
  clearHeightmapMesh();
  clearHeightmapData();
  heightmapData = [];
  heightmapPending = heightmapPointCount.x * heightmapPointCount.y;

  var gcode = "G0 G90 G21 X" + heightmapAnchor.x.toFixed(3) + " Y" + heightmapAnchor.y.toFixed(3) + "\n";
  gcode += "G38.2 G91 Z" + (-heightmapSeek).toFixed(3) + " F" + heigtmapFeed.toFixed(0) + "\n";
  gcode += "G0 Z" + heightmapRetract.toFixed(3) + "\n";

  var direction = 1;
  var dX = heightmapSize.x / (heightmapPointCount.x - 1);
  var dY = heightmapSize.y / (heightmapPointCount.y - 1);
  var startX = heightmapStart.x;
  var startY = heightmapStart.y;
  for (var iy = 0; iy < heightmapPointCount.y; iy++) {
    var y = startY + iy*dY;
    heightmapData.push([]);
    for (var ix = 0; ix < heightmapPointCount.x; ix++) {
      var x = startX + ix*dX*direction;

      gcode += "G38.3 G90 X" + x.toFixed(3) + " Y" + y.toFixed(3) + " F" + heigtmapFeedXY.toFixed(0) + "\n";
      gcode += "G38.2 G91 Z" + (-heightmapSeek).toFixed(3) + " F" + heigtmapFeed.toFixed(0) + "\n";
      gcode += "G0 Z" + heightmapRetract.toFixed(3) + "\n";
      heightmapData[iy].push(undefined);
    }
    direction = -direction;
    startX = 2*heightmapStart.x + heightmapSize.x - startX;
  }

  heightmapProbeExpected = 1;
  socket.off('prbResult');
  socket.on('prbResult', onHeightmapProbeResult);
  socket.emit('runJob', {data: gcode, isJob: false, fileName: ""});
}

function showHeightmapError(error, unlock) {
  Metro.dialog.create({
    clsDialog: 'dark',
    title: "<i class='mif-chart-bars fg-red'></i> Heightmap Error",
    content: error,
    actions: [{
        caption: "Close",
        cls: "js-dialog-close alert",
        onclick: function()
        {
          if (unlock)
          {
            socket.emit('clearAlarm', 1);
          }
        }
      },
    ]
  });
}

function generateHeightmap() {
  if (laststatus.comms.runStatus != "Idle" || laststatus.comms.connectionStatus != 2) {
    showHeightmapError("The machine needs to be connected and idle before creating a heightmap.");
    return;
  }
  if (Math.abs(heightmapAnchor.x - laststatus.machine.position.work.x) > 5 ||
    Math.abs(heightmapAnchor.y - laststatus.machine.position.work.y) > 5) {
    const error = `The probe is too far from the anchor point. Move the probe to the anchor position X=` +
      heightmapAnchor.x.toFixed(2) + `mm, Y=` + heightmapAnchor.y.toFixed(2) + `mm and up to ` +
      heightmapSeek.toFixed(2) + `mm above the material, then try again.`;
    showHeightmapError(error);
    return;
  }

  Metro.dialog.create({
    clsDialog: 'dark',
    title: "<i class='mif-chart-bars'></i> Generate Heightmap",
    content: "The measuring of the heightmap is about to begin.<br>Make sure the probe is connected and free to move above the surface.",
    actions: [
      {
        caption: "Continue",
        cls: "js-dialog-close success",
        onclick: runHeightmapProbe
      },
      {
        caption: "Cancel",
        cls: "js-dialog-close",
        onclick: function() {}
      },
    ]
  });
}

function heightmapReadError(message) {
  if (message == undefined)
  {
    message = "Unspecified Error";
  }
  Metro.dialog.create({
    clsDialog: "dark",
    title: "File read error",
    width: 600,
    content: escapeHTML(message),
    dataToTop: true,
    actions: [{
        caption: "OK",
        cls: "js-dialog-close alert",
        onclick: function() {}
      }
    ]
  });
}

function loadHeightmap() {
  var loadFileParams = {
    id: "heightmap",
    title: "Load Heightmap",
    filters: heightmapFilters,
    showErrorDlg: false,
  };

  // eslint-disable-next-line no-unused-vars
  invokeOpenDialogReadFile(loadFileParams).then(({err, filePath, data}) => {
    if (err)
      heightmapReadError(err);
    else {
      try {
        var lines = data.split('\n');
        var config = lines[0].split(',').map(Number);
        if (config.length != 12) {
          throw new Error("Line 1 doesn't have the correct number of values. Expecting 12 numbers.");
        }

        var start = {x: config[0], y: config[1]};
        var size = {x: Math.max(config[2], 1), y: Math.max(config[3], 1)};
        var pointCount = {x: Math.max(Math.floor(config[4]), 2), y: Math.max(Math.floor(config[5]), 2)};
        var anchor = {x: config[6], y: config[7]};
        var seek = Math.max(config[8], 0.1);
        var feed = Math.max(config[9], 1);
        var retract = Math.max(config[10], 0.1);
        var feedXY = Math.max(config[11], 1);

        if (lines.length < pointCount.y + 1) {
          throw new Error("The file doesn't have the correct number of lines. Expecting " + (pointCount.y+1) + " lines.");
        }
        var heightmap = [];
        for (var y = 0; y < pointCount.y; y++) {
          var row = lines[y+1].split(',').map(Number);
          row.splice(pointCount.x);
          if (row.length != pointCount.x) {
            throw new Error("Line " + (y+2) + " doesn't have the correct number of values. Expecting " + pointCount.x + " numbers.");
          }
          heightmap.push(row);
        }

        heightmapData = heightmap;
        heightmapStart = start;
        heightmapSize = size;
        heightmapPointCount = pointCount;
        heightmapAnchor = anchor;
        heightmapSeek = seek;
        heigtmapFeed = feed;
        heightmapRetract = retract;
        heigtmapFeedXY = feedXY;
        heightmapDataValid = true;
      } catch (error) {
        heightmapReadError(error.message);
        return;
      }

      clearHeightmapMesh();
      generateHeightmapMesh();
    }
  });
}

function saveHeightmap() {
  var heightmapTxt = heightmapStart.x.toFixed(2) + "," + heightmapStart.y.toFixed(2);
  heightmapTxt += "," + heightmapSize.x.toFixed(2) + "," + heightmapSize.y.toFixed(2);
  heightmapTxt += "," + heightmapPointCount.x.toFixed(0) + "," + heightmapPointCount.y.toFixed(0);
  heightmapTxt += "," + heightmapAnchor.x.toFixed(2) + "," + heightmapAnchor.y.toFixed(2);
  heightmapTxt += "," + heightmapSeek.toFixed(2) + "," + heigtmapFeed.toFixed(0) + "," +
    heightmapRetract.toFixed(0) + "," + heigtmapFeedXY.toFixed(0) + "\n";

  for (var y = 0; y < heightmapPointCount.y; y++) {
    for (var x = 0; x < heightmapPointCount.x-1; x++) {
      heightmapTxt += heightmapData[y][x].toFixed(2) + ",";
    }
    heightmapTxt += heightmapData[y][heightmapPointCount.x-1].toFixed(2) + "\n";
  }

  var blob = new Blob([heightmapTxt], {type: "plain/text"});
  var name = 'heightmap';
  if (loadedFileName != "") {
    name += '-' + loadedFileName.split('.')[0];
  }

  if (typeof invokeSaveAsDialogNew == 'function') {
    var saveFileParams = {
      id: "heightmap",
      title: "Save Heightmap",
      filters: heightmapFilters,
      fileName: name + '.csv'
    };
    invokeSaveAsDialogNew(blob, saveFileParams);
  }
  else {
    invokeSaveAsDialog(blob, name + '.csv');
  }
}

function clearGCodeMarkers() {
  var lineCount = editor.session.getLength();
  while (lineCount > 0 && editor.session.getLine(lineCount - 1).length == 0)
    lineCount--;

  var gcode = "";
  for (var lineIdx = 0; lineIdx < lineCount; lineIdx++) {
    var currentLine = editor.session.getLine(lineIdx);
    if (currentLine == HEIGHTMAP_GCODE_HEADER1a ||currentLine == HEIGHTMAP_GCODE_HEADER2 || currentLine.endsWith(HEIGHTMAP_GCODE_END_MARKER))
      continue;

    if (currentLine.startsWith(HEIGHTMAP_GCODE_START_MARKER))
      currentLine = currentLine.slice(HEIGHTMAP_GCODE_START_MARKER.length);

    gcode += currentLine + "\n";
  }

  return gcode;
}

function revertHeightmap() {
  const gcode = clearGCodeMarkers();
  editor.session.setValue("");
  editor.session.setValue(gcode);
  parseGcodeInWebWorker(gcode);
}

function heightmapParseGCode() {
  var moveType = 1; // 0 or 1 (start with 1 for safety)
  var arcPlane = undefined; // 17, 18 or 19
  var units = undefined; // 20 or 21
  var absolute = undefined; // 90 or 91
  var lastX = undefined;
  var lastY = undefined;
  var lastZ = undefined;
  var previousPos = undefined;
  var unitChangeLine = undefined;

  var lineCount = editor.session.getLength();
  while (lineCount > 0 && editor.session.getLine(lineCount - 1).length == 0)
    lineCount--;

  var lineInfos = Array(lineCount);

  for (var lineIdx = 0; lineIdx < lineCount; lineIdx++) {
    var line = editor.session.getLine(lineIdx);
    var lineInfo = {text: line};
    lineInfos[lineIdx] = lineInfo;
    line = line.replace(/\(.*?\)/g, ""); // remove block comments
    line = line.replace(/;.*$/g, ""); // remove line comments
    if (line.length == 0) continue;
    line = line.toUpperCase();

    const Xindex = line.indexOf("X");
    const Yindex = line.indexOf("Y");
    const Zindex = line.indexOf("Z");
    const Findex = line.indexOf("F");

    var isMove = Xindex >=0 || Yindex >=0 || Zindex >=0;

    // find G codes
    var gline = line;
    while (true) {
      var pos = gline.indexOf('G');
      if (pos == -1) break;
      gline = gline.slice(pos + 1);
      var g = parseInt(gline);
      if (g == 0) moveType = 0;
      if (g == 1 || g == 2 || g == 3) moveType = g;
      if (g == 90 || g == 91) absolute = g;
      if (g == 20 || g == 21) {
        if (units == undefined)
          units = g;
        else
          unitChangeLine = lineIdx; // record the second change to the units, complain if there is a move command later
      }
      if (g == 17 || g == 18 || g == 19) arcPlane = g;
      if (g == 28 || g == 30) isMove = false; // these commands contain coordinates but are not relevant moves

      if (g == 90 && parseFloat(gline) == 90.1) {
        showHeightmapError("The heightmapper does not support absolute IJK values " + (lineIdx+1) + ".");
        return;
      }
    }

    if (isMove) {
      if (units == undefined) {
        showHeightmapError("The heightmapper can't determine the units for line " + (lineIdx+1) + ". No G20 or G21 were found in the preceeding lines.");
        return;
      }
      if (unitChangeLine != undefined) {
        showHeightmapError("The heightmapper doesn't support changing units in the middle of the G-code. Line " + (unitChangeLine+1) + ".");
        return;
      }
      if (absolute == undefined || (absolute == 91 && ((Xindex >= 0 && lastX == undefined) || (Yindex >= 0 && lastY == undefined) || (Zindex >= 0 && lastZ == undefined)))) {
        showHeightmapError("The heightmapper can't determine the absolute coordinates for line " + (lineIdx+1) + ". No absolute move was found in the preceeding lines.");
        return;
      }
      if ((moveType == 2 || moveType == 3) && arcPlane == undefined) {
        showHeightmapError("The heightmapper can't determine the arc orientation for line " + (lineIdx+1) + ". No G17, G18 or G19 were found in the preceeding lines.");
        return;
      }

      if (Xindex >= 0) {
        const x = parseFloat(line.slice(Xindex + 1));
        if (absolute == 90)
          lastX = x;
        else
          lastX += x;
      }
      if (Yindex >= 0) {
        const y = parseFloat(line.slice(Yindex + 1));
        if (absolute == 90)
          lastY = y;
        else
          lastY += y;
      }

      if (Zindex >= 0) {
        const z = parseFloat(line.slice(Zindex + 1));
        if (absolute == 90)
          lastZ = z;
        else
          lastZ += z;
      }

      if (lastX != undefined && lastY != undefined && lastZ != undefined) {
        if (moveType == 2 || moveType == 3) {
          if (previousPos == undefined) {
            showHeightmapError("The heightmapper can't determine the arc start position for line " + (lineIdx+1) + ".");
            return;
          }
          const Rindex = line.indexOf("R");

          if (Rindex >= 0) {
            lineInfo.arc = {plane: arcPlane, r: parseFloat(line.slice(Rindex + 1))};
          }
          else
          {
            const Iindex = line.indexOf("I");
            const Jindex = line.indexOf("J");
            const Kindex = line.indexOf("K");
            if (arcPlane == 17) {
              if (Iindex == -1 || Jindex == -1) {
                showHeightmapError("The heightmapper requires XY arcs to have explicit I and J or R parameters. Line " + (lineIdx+1) + ".");
                return;
              }
              lineInfo.arc = {plane: arcPlane, i: parseFloat(line.slice(Iindex + 1)), j: parseFloat(line.slice(Jindex + 1))};
            }
            else if (arcPlane == 18) {
              if (Iindex == -1 || Kindex == -1) {
                showHeightmapError("The heightmapper requires XZ arcs to have explicit I and K or R parameters. Line " + (lineIdx+1) + ".");
                return;
              }
              lineInfo.arc = {plane: arcPlane, i: parseFloat(line.slice(Iindex + 1)), k: parseFloat(line.slice(Kindex + 1))};
            }
            else if (arcPlane == 19) {
              if (Jindex == -1 || Kindex == -1) {
                showHeightmapError("The heightmapper requires YZ arcs to have explicit J and K or R parameters. Line " + (lineIdx+1) + ".");
                return;
              }
              lineInfo.arc = {plane: arcPlane, j: parseFloat(line.slice(Jindex + 1)), k: parseFloat(line.slice(Kindex + 1))};
            }
          }
        }
        lineInfo.isMove = true;
        lineInfo.moveType = moveType;
        if (previousPos)
          lineInfo.start = {x: previousPos.x, y: previousPos.y, z: previousPos.z};
        lineInfo.end = {x: lastX, y: lastY, z: lastZ};
        previousPos = {x: lastX, y: lastY, z: lastZ};
      }

      if (Findex >= 0) {
        var Flen = 0;
        for (let i = Findex + 1; i < line.length; i++, Flen++) {
          const c = line[i];
          if (c != '.' && (c < '0' || c > '9'))
            break;
        }
        lineInfo.Frange = {start: Findex, end: Findex + Flen + 1};
      }
    }
  }

  return {lineInfos: lineInfos, units: units};
}

function computeHeightmapNewZ(x, y, z, units) {
  var scale = units == 20 ? 25.4 : 1;
  
  return z + computeHeightmapZ(x * scale, y * scale) / scale;
}

function subdivideLineSamples(samples, first, last, zThreshold) {
  // assumptions:
  //   * samples[first] and samples[last] have z0=0
  var maxdz = zThreshold;
  var maxi = undefined;
  for (let i = first + 1; i < last; i++) {
    const dz = Math.abs(samples[i].zt - samples[i].z);
    if (dz > maxdz) {
      maxdz = dz;
      maxi = i;
    }
  }

  if (maxi == undefined)
    return; // all less than zThreshold

  var stepz = (samples[maxi].zt - samples[maxi].z) / (maxi - first);
  for (let i = first + 1; i < maxi; i++)
    samples[i].z += stepz * (i - first);

  stepz = (samples[maxi].zt - samples[maxi].z) / (last - maxi);
  for (let i = last - 1; i > maxi; i--)
    samples[i].z += stepz * (last - i);

  samples[maxi].z = samples[maxi].zt;
  samples[maxi].used = true;

  subdivideLineSamples(samples, first, maxi, zThreshold);
  subdivideLineSamples(samples, maxi, last, zThreshold);
}

function generateLineSegments(x1, y1, z1, x2, y2, z2, minSegmentLength, zThreshold, units) {
  const z1h = computeHeightmapNewZ(x1, y1, z1, units);
  const z2h = computeHeightmapNewZ(x2, y2, z2, units);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx*dx + dy*dy);
  const count = Math.max(Math.ceil(length / minSegmentLength), 1);

  var gcode = "";

  if (count == 1) {
    // special case if splitting is not required
    let space = "";
    if (x2 != x1) {
      gcode += "X" + parseFloat(x2.toFixed(3));
      space = " ";
    }
    if (y2 != y1) {
      gcode += space + "Y" + parseFloat(y2.toFixed(3));
      space = " ";
    }
    if (z2h != z1h) {
      gcode += space + "Z" + parseFloat(z2h.toFixed(3));
    }

    gcode += heightmapSettings.allowRevert ? HEIGHTMAP_GCODE_END_MARKER + "\n" : "\n";
    return gcode;
  }

  const dz = z2 - z1;
  const dzh = z2h - z1h;
  var samples = new Array(count + 1);
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const x = x1 + dx * t;
    const y = y1 + dy * t;
    const z = z1h + dzh * t; // interpolated adjusted Z
    const zt = computeHeightmapNewZ(x, y, z1 + dz * t, units); // target Z
    samples[i] = {x: x, y: y, z: z, zt: zt, used: false};
  }

  samples[count].used = true;

  if (count > 1)
    subdivideLineSamples(samples, 0, count, zThreshold);

  var lastx = x1, lasty = y1, lastz = samples[0].z;
  for (let i = 1; i <= count; i++) {
    var sample = samples[i];
    if (!sample.used) continue;

    let space = "";
    if (sample.x != lastx) {
      gcode += "X" + parseFloat(sample.x.toFixed(3));
      space = " ";
      lastx = sample.x;
    }
    if (sample.y != lasty) {
      gcode += space + "Y" + parseFloat(sample.y.toFixed(3));
      space = " ";
      lasty = sample.y;
    }
    if (sample.z != lastz) {
      gcode += space + "Z" + parseFloat(sample.z.toFixed(3));
      lastz = sample.z;
    }

    gcode += heightmapSettings.allowRevert ? HEIGHTMAP_GCODE_END_MARKER + "\n" : "\n";
  }

  return gcode;
}

function decodeArc(x1, y1, x2, y2, moveType, r, i, j, units) {
  var arc = {};
  var delta = {x: x2 - x1, y: y2 - y1};
  if (r != undefined)
  {
    const halfSq = (delta.x*delta.x + delta.y*delta.y) / 4;
    arc.radius = r;
    const distSq = r * r - halfSq;
    if (distSq < 0)
    {
      arc.center = {x: (x1 + x2) / 2, y: (y1 + y2) / 2}; // invalid radius, try best guess
    }
    else
    {
      var scale = Math.sqrt(distSq / halfSq);
      if ((moveType == 3 ? arc.radius : -arc.radius) < 0) scale = -scale;
      arc.center = {x: (x1 + x2 - delta.y*scale) / 2, y: (y1 + y2 + delta.x*scale) / 2};
    }
  }
  else
  {
    arc.center = {x: x1 + i, y: y1 + j};
    arc.radius = Math.sqrt(i*i + j*j);
  }

  arc.angle1 = Math.atan2(y1 - arc.center.y, x1 - arc.center.x);
  arc.angle2 = Math.atan2(y2 - arc.center.y, x2 - arc.center.x);
  var distMM = Math.sqrt(delta.x*delta.x + delta.y*delta.y);
  if (units == 20) distMM *= 25.4;
  if (distMM < 0.01)
  {
    // the two points are very close, draw a full circle
    if (moveType == 2)
      arc.angle2 = arc.angle1 - 2*Math.PI;
    if (moveType == 3)
      arc.angle2 = arc.angle1 + 2*Math.PI;
  }
  else
  {
    // make sure angles are ordered
    if (moveType == 2 && arc.angle1 < arc.angle2)
      arc.angle1 += 2*Math.PI;
    if (moveType == 3 && arc.angle2 < arc.angle1)
      arc.angle2 += 2*Math.PI;
  }

  return arc;
}

function applyHeightmap() {
  const line0 = editor.session.getLine(0);
  if (line0 == HEIGHTMAP_GCODE_HEADER1b) {
    showHeightmapError("This file has already been modified by the heightmapper. You will need to reload the original and try again.");
    return;
  }

  var editorDirty = false;
  if (line0 == HEIGHTMAP_GCODE_HEADER1a) {
    const gcode = clearGCodeMarkers();
    editor.session.setValue("");
    editor.session.setValue(gcode);
    editorDirty = true;
  }

  // Parse existing G-code
  var parseResult = heightmapParseGCode();
  if (parseResult == undefined) {
    if (editorDirty) {
      parseGcodeInWebWorker(gcode);
    }
    return;
  }

  const lineInfos = parseResult.lineInfos;
  const units = parseResult.units;

  // Generate new G-code
  var gcode = heightmapSettings.allowRevert ? (HEIGHTMAP_GCODE_HEADER1a + "\n" + HEIGHTMAP_GCODE_HEADER2 + "\n") : (HEIGHTMAP_GCODE_HEADER1b + "\n");
  var moveType = undefined;
  var minSegmentLength = heightmapSettings.minSegmentLength;
  var zThreshold = heightmapSettings.zThreshold;
  var arcThreshold = heightmapSettings.arcThreshold;
  if (units == 20) {
    minSegmentLength /= 25.4;
    zThreshold /= 25.4;
    arcThreshold /= 25.4;
  }

  for (var infoIdx = 0; infoIdx < lineInfos.length; infoIdx++) {
    var lineInfo = lineInfos[infoIdx];
    if (!lineInfo.isMove || (lineInfo.moveType == 0 && !heightmapSettings.modifyRapids)) {
      moveType = undefined;
      gcode += lineInfo.text + "\n";
      continue;
    }

    if (heightmapSettings.allowRevert) {
      gcode += HEIGHTMAP_GCODE_START_MARKER + lineInfo.text + "\n";
    }
    if (lineInfo.Frange != undefined) {
      gcode += lineInfo.text.slice(lineInfo.Frange.start, lineInfo.Frange.end);
      gcode += heightmapSettings.allowRevert ? HEIGHTMAP_GCODE_END_MARKER + "\n" : "\n";
    }

    if (lineInfo.start == undefined) {
      // unknown start: just tweak Z (moveType must be 0 or 1)
      const z = computeHeightmapNewZ(lineInfo.end.x, lineInfo.end.y, lineInfo.end.z, units);
      gcode += "G" + lineInfo.moveType + " X" + parseFloat(lineInfo.end.x.toFixed(3)) +
        " Y" + parseFloat(lineInfo.end.y.toFixed(3)) +
        " Z" + parseFloat(z.toFixed(3));
      gcode += heightmapSettings.allowRevert ? HEIGHTMAP_GCODE_END_MARKER + "\n" : "\n";
      moveType = undefined;
      continue;
    }

    if (lineInfo.moveType == 0 || lineInfo.moveType == 1) {
      if (lineInfo.moveType != moveType) {
        moveType = lineInfo.moveType;
        gcode += "G" + moveType + " ";
      }

      // linear move: split into smaller segments if necessary
      gcode += generateLineSegments(
        lineInfo.start.x, lineInfo.start.y, lineInfo.start.z,
        lineInfo.end.x, lineInfo.end.y, lineInfo.end.z,
        minSegmentLength, zThreshold, units);
      continue;
    }

    if (lineInfo.moveType == 2 || lineInfo.moveType == 3) {
      // arc move: subdivide into straight segments, then treat as linear moves
      var arc;
      var az1, az2; // "Z" here means the third axis, perpendicular to the arc plane
      switch (lineInfo.arc.plane) {
        case 17: // XY
          arc = decodeArc(lineInfo.start.x, lineInfo.start.y,
            lineInfo.end.x, lineInfo.end.y, lineInfo.moveType,
            lineInfo.arc.r, lineInfo.arc.i, lineInfo.arc.j, units);
          az1 = lineInfo.start.z;
          az2 = lineInfo.end.z;
          break;
        case 18: // ZX
          arc = decodeArc(lineInfo.start.z, lineInfo.start.x,
            lineInfo.end.z, lineInfo.end.x, lineInfo.moveType,
            lineInfo.arc.r, lineInfo.arc.k, lineInfo.arc.i, units);
          az1 = lineInfo.start.y;
          az2 = lineInfo.end.y;
          break;
        case 19: // YZ
          arc = decodeArc(lineInfo.start.y, lineInfo.start.z,
            lineInfo.end.y, lineInfo.end.z, lineInfo.moveType,
            lineInfo.arc.r, lineInfo.arc.j, lineInfo.arc.k, units);
          az1 = lineInfo.start.x;
          az2 = lineInfo.end.x;
          break;
      }

      // optimization: preserve small arcs in the XY plane
      if (lineInfo.arc.plane == 17 && arc.radius * Math.abs(arc.angle2-arc.angle1) < minSegmentLength) {
        const z = computeHeightmapNewZ(lineInfo.end.x, lineInfo.end.y, lineInfo.end.z, units);
        var line = "G" + lineInfo.moveType + " G17 X" + Number(lineInfo.end.x.toFixed(3)) +
          " Y" + Number(lineInfo.end.y.toFixed(3)) +
          " Z" + Number(z.toFixed(3));
        if (lineInfo.arc.r != undefined)
          line += " R" + Number(lineInfo.arc.r.toFixed(3));
        else
          line += " I" + Number(lineInfo.arc.i.toFixed(3)) + " J" + Number(lineInfo.arc.j.toFixed(3));
        gcode += line;
        gcode += heightmapSettings.allowRevert ? HEIGHTMAP_GCODE_END_MARKER + "\n" : "\n";
        moveType = undefined;
        continue;
      }

      var angleSteps = 1;
      if (arc.radius > arcThreshold) {
        var maxAngle = 2 * Math.acos(1 - arcThreshold / arc.radius);
        angleSteps = Math.max(Math.ceil(Math.abs(arc.angle2-arc.angle1) / maxAngle), 1);
      }

      // generate arc gcode
      if (moveType != 1) {
        moveType = 1;
        gcode += "G1 ";
      }

      var x = lineInfo.start.x;
      var y = lineInfo.start.y;
      var z = lineInfo.start.z;
      for (let i = 1; i <= angleSteps; i++) {
        const angle = (arc.angle1 * (angleSteps-i) + arc.angle2 * i) / angleSteps;
        const ax = arc.center.x + Math.cos(angle) * arc.radius;
        const ay = arc.center.y + Math.sin(angle) * arc.radius;
        const az = (az1 * (angleSteps-i) + az2 * i) / angleSteps;

        switch (lineInfo.arc.plane) {
          case 17: // XY
            gcode += generateLineSegments(x, y, z, ax, ay, az,
              minSegmentLength, zThreshold, units);
            x = ax; y = ay; z = az;
            break;

          case 18: // ZX
            gcode += generateLineSegments(x, y, z, ay, az, ax,
              minSegmentLength, zThreshold, units);
            x = ay; y = az; z = ax;
            break;

          case 19: // YZ
            gcode += generateLineSegments(x, y, z, az, ax, ay,
              minSegmentLength, zThreshold, units);
            x = az; y = ax; z = ay;
            break;
        }
      }
    }
  }

  editor.session.setValue("");
  editor.session.setValue(gcode);
  parseGcodeInWebWorker(gcode);
}

function updateHeightmapMenu() {
  enableViaClass('#editHeightmapSettings', laststatus.comms.connectionStatus != 3);
  enableViaClass('#generateHeightmap', laststatus.comms.runStatus == "Idle" && laststatus.comms.connectionStatus == 2);

  enableViaClass('#saveHeightmap', heightmapDataValid);
  enableViaClass('#clearHeightmap', heightmapDataValid);

  enableViaClass('#applyHeightmap', heightmapDataValid && laststatus.comms.connectionStatus != 3);

  enableViaClass('#revertHeightmap', editor.session.getLine(0) == HEIGHTMAP_GCODE_HEADER1a && laststatus.comms.connectionStatus != 3);
}

function toggleHeightmapTools() {
  heightmapSettings.enabled = !heightmapSettings.enabled;
  localStorage.setItem("heightmapSettings", JSON.stringify(heightmapSettings));

  addRemoveClass('#toggleHeightmapTools', 'checked', heightmapSettings.enabled);
  $('.heightmap').toggle(heightmapSettings.enabled);
  if (heightmapGeo) {
    heightmapGeo.visible = heightmapSettings.enabled;
  }

  if (heightmapSettings.enabled) {
    viewSettings.heightmap = true;
    $('#viewHeighmtapSetting:checkbox').prop('checked', true);
    $('#gcodeviewertab').click();
  }
}

function heightmapDocReady() {
  // read settings
  const settings = JSON.parse(localStorage.getItem("heightmapSettings"));
  if (settings) {
    for (let prop in settings) {
      if (prop in heightmapSettings && typeof(settings[prop]) == typeof(heightmapSettings[prop])) {
        heightmapSettings[prop] = settings[prop];
      }
    }
  }

  addRemoveClass('#toggleHeightmapTools', 'checked', heightmapSettings.enabled);
  $('.heightmap').toggle(heightmapSettings.enabled);
}
