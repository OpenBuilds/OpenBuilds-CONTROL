function drawRuler(xmin, xmax, ymin, ymax, inches) {

  if (inches) {
    xmin = Math.floor(xmin * 0.0393701);
    xmax = Math.ceil(xmax * 0.0393701);
    ymin = Math.floor(ymin * 0.0393701);
    ymax = Math.ceil(ymax * 0.0393701);
  }
  var ruler = new THREE.Group();
  var material = new THREE.LineBasicMaterial({
    color: 0x888888
  });
  material.opacity = 0.15;

  // x axis
  for (i = xmin; i <= xmax; i++) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(i, -1, 0));
    geometry.vertices.push(new THREE.Vector3(i, -4, 0));
    var line = new THREE.Line(geometry, material);
    // line.translateX(-xmax / 2)
    // line.translateY(-ymax / 2)
    ruler.add(line);
  }

  for (i = xmin; i <= xmax; i++) {
    if (i % 5 == 0) {
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(i, -1, 0));
      geometry.vertices.push(new THREE.Vector3(i, -6, 0));
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
      geometry.vertices.push(new THREE.Vector3(i, -7, 0));
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
      geometry.vertices.push(new THREE.Vector3(-6, i, 0));
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
      geometry.vertices.push(new THREE.Vector3(-7, i, 0));
      var line = new THREE.Line(geometry, material);
      // line.translateX(-ymax / 2)
      // line.translateY(-ymax / 2)
      ruler.add(line);
    }
  }

  for (i = ymin; i <= ymax; i++) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(-1, i, 0));
    geometry.vertices.push(new THREE.Vector3(-4, i, 0));
    var line = new THREE.Line(geometry, material);
    // line.translateX(-ymax / 2)
    // line.translateY(-ymax / 2)
    ruler.add(line);
  }

  var x = [];
  var y = [];
  for (var i = xmin; i <= xmax; i++) {
    if (i % 10 == 0) {
      x[i] = this.makeSprite(this.scene, "webgl", {
        x: i,
        y: -10,
        z: 0,
        text: i,
        color: "#cc0000",
        size: 4
      });
      ruler.add(x[i]);
    }
  }

  for (var i = ymin; i <= ymax; i++) {
    if (i % 10 == 0) {
      y[i] = this.makeSprite(this.scene, "webgl", {
        x: -10,
        y: i,
        z: 0,
        text: i,
        color: "#006600",
        size: 4
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

  if (inches) {
    ruler.scale.multiplyScalar(25.4);
  }

  return (ruler)
}