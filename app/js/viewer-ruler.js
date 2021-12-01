function drawRuler(xmin, xmax, ymin, ymax) {

  var length1 = 4
  var length5 = 6
  var length10 = 7
  var unitsval = ""
  // console.log(xmin, xmax, ymin, ymax)
  var ruler = new THREE.Group();
  var material = new THREE.LineBasicMaterial({
    color: Theme.RULER_COLOR
  });

  material.opacity = Theme.RULER_OPACITY;

  // x axis
  for (i = xmin; i <= xmax; i++) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(i, -1, 0));
    geometry.vertices.push(new THREE.Vector3(i, -length1, 0));
    var line = new THREE.Line(geometry, material);
    // line.translateX(-xmax / 2)
    // line.translateY(-ymax / 2)
    ruler.add(line);
  }

  for (i = xmin; i <= xmax; i++) {
    if (i % 5 == 0) {
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(i, -1, 0));
      geometry.vertices.push(new THREE.Vector3(i, -length5, 0));
      var line = new THREE.Line(geometry, material);
      // line.translateX(-xmax / 2)
      // line.translateY(-ymax / 2)
      ruler.add(line);
    }
  }

  for (i = xmin; i <= xmax; i++) {
    if (i % 10 == 0) {
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(i, -1, 0));
      geometry.vertices.push(new THREE.Vector3(i, -length10, 0));
      var line = new THREE.Line(geometry, material);
      // line.translateX(-xmax / 2)
      // line.translateY(-ymax / 2)
      ruler.add(line);
    }
  }

  // y axis
  for (i = ymin; i <= ymax; i++) {
    if (i % 5 == 0) {
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(-1, i, 0));
      geometry.vertices.push(new THREE.Vector3(-length5, i, 0));
      var line = new THREE.Line(geometry, material);
      // line.translateX(-ymax / 2)
      // line.translateY(-ymax / 2)
      ruler.add(line);
    }
  }

  for (i = ymin; i <= ymax; i++) {
    if (i % 10 == 0) {
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(-1, i, 0));
      geometry.vertices.push(new THREE.Vector3(-length10, i, 0));
      var line = new THREE.Line(geometry, material);
      // line.translateX(-ymax / 2)
      // line.translateY(-ymax / 2)
      ruler.add(line);
    }
  }

  for (i = ymin; i <= ymax; i++) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(-1, i, 0));
    geometry.vertices.push(new THREE.Vector3(-length1, i, 0));
    var line = new THREE.Line(geometry, material);
    // line.translateX(-ymax / 2)
    // line.translateY(-ymax / 2)
    ruler.add(line);
  }

  var fontsize = 4
  var spacing = -10
  var x = [];
  var y = [];
  for (var i = xmin; i <= xmax; i++) {

    if (i % 10 == 0) {
      x[i] = this.makeSprite(this.scene, "webgl", {
        x: i,
        y: spacing,
        z: 0,
        text: i + unitsval,
        color: Theme.X_RULER_NUMBER_COLOR,
        size: fontsize
      });
      ruler.add(x[i]);
    }

  }

  for (var i = ymin; i <= ymax; i++) {

    if (i % 10 == 0) {
      y[i] = this.makeSprite(this.scene, "webgl", {
        x: spacing,
        y: i,
        z: 0,
        text: i + unitsval,
        color: Theme.Y_RULER_NUMBER_COLOR,
        size: fontsize
      });
      ruler.add(y[i]);
    }
  }
  ruler.name = "Rulers"

  // var material = new THREE.LineBasicMaterial({
  //   color: 0x666666
  // });
  // material.opacity = 0.15;
  // var geometry = new THREE.Geometry();
  // geometry.vertices.push(new THREE.Vector3(xmax, 0, 0));
  // geometry.vertices.push(new THREE.Vector3(xmax, ymax, 0));
  // geometry.vertices.push(new THREE.Vector3(0, ymax, 0));
  // var line = new THREE.Line(geometry, material);
  // ruler.add(line);

  return (ruler)
}

function drawRulerInches(xmin, xmax, ymin, ymax) {

  length1 = 1.4;
  length5 = 1.6;
  length10 = 1.7;
  var unitsval = "in"

  // console.log(xmin, xmax, ymin, ymax)

  var ruler = new THREE.Group();
  var material = new THREE.LineBasicMaterial({
    color: Theme.RULER_COLOR
  });

  material.opacity = Theme.RULER_OPACITY;

  // x axis
  for (i = xmin; i <= xmax; i++) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(i, -1, 0));
    geometry.vertices.push(new THREE.Vector3(i, -length1, 0));
    var line = new THREE.Line(geometry, material);
    // line.translateX(-xmax / 2)
    // line.translateY(-ymax / 2)
    ruler.add(line);
  }

  for (i = xmin; i <= xmax; i++) {
    if (i % 5 == 0) {
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(i, -1, 0));
      geometry.vertices.push(new THREE.Vector3(i, -length5, 0));
      var line = new THREE.Line(geometry, material);
      // line.translateX(-xmax / 2)
      // line.translateY(-ymax / 2)
      ruler.add(line);
    }
  }

  for (i = xmin; i <= xmax; i++) {
    if (i % 10 == 0) {
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(i, -1, 0));
      geometry.vertices.push(new THREE.Vector3(i, -length10, 0));
      var line = new THREE.Line(geometry, material);
      // line.translateX(-xmax / 2)
      // line.translateY(-ymax / 2)
      ruler.add(line);
    }
  }

  // y axis
  for (i = ymin; i <= ymax; i++) {
    if (i % 5 == 0) {
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(-1, i, 0));
      geometry.vertices.push(new THREE.Vector3(-length5, i, 0));
      var line = new THREE.Line(geometry, material);
      // line.translateX(-ymax / 2)
      // line.translateY(-ymax / 2)
      ruler.add(line);
    }
  }

  for (i = ymin; i <= ymax; i++) {
    if (i % 10 == 0) {
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(-1, i, 0));
      geometry.vertices.push(new THREE.Vector3(-length10, i, 0));
      var line = new THREE.Line(geometry, material);
      // line.translateX(-ymax / 2)
      // line.translateY(-ymax / 2)
      ruler.add(line);
    }
  }

  for (i = ymin; i <= ymax; i++) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(-1, i, 0));
    geometry.vertices.push(new THREE.Vector3(-length1, i, 0));
    var line = new THREE.Line(geometry, material);
    // line.translateX(-ymax / 2)
    // line.translateY(-ymax / 2)
    ruler.add(line);
  }

  fontsize = 10
  spacing = -10;
  xmin = Math.floor(xmin * 0.0393701);
  xmax = Math.ceil(xmax * 0.0393701);
  ymin = Math.floor(ymin * 0.0393701);
  ymax = Math.ceil(ymax * 0.0393701);

  // console.log(xmin, xmax, ymin, ymax)

  var x = [];
  var y = [];
  for (var i = xmin; i <= xmax; i++) {
    if (i % 1 == 0) {
      x[i] = this.makeSprite(this.scene, "webgl", {
        x: i * 25.4,
        y: spacing,
        z: 0,
        text: i + unitsval,
        color: Theme.X_RULER_NUMBER_COLOR,
        size: fontsize / 2.54
      });
      ruler.add(x[i]);
    }
  }

  for (var i = ymin; i <= ymax; i++) {
    if (i % 1 == 0) {
      y[i] = this.makeSprite(this.scene, "webgl", {
        x: spacing,
        y: i * 25.4,
        z: 0,
        text: i + unitsval,
        color: Theme.Y_RULER_NUMBER_COLOR,
        size: fontsize / 2.54
      });
      ruler.add(y[i]);
    }

  }
  ruler.name = "Rulers"

  // var material = new THREE.LineBasicMaterial({
  //   color: 0x666666
  // });
  // material.opacity = 0.15;
  // var geometry = new THREE.Geometry();
  // geometry.vertices.push(new THREE.Vector3(xmax, 0, 0));
  // geometry.vertices.push(new THREE.Vector3(xmax, ymax, 0));
  // geometry.vertices.push(new THREE.Vector3(0, ymax, 0));
  // var line = new THREE.Line(geometry, material);
  // ruler.add(line);

  // ruler.scale.multiplyScalar(25.4);

  return (ruler)
}