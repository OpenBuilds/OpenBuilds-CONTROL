/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.GridHelper = function(minX, maxX, minY, maxY, step, colorval) {

  var geometry = new THREE.Geometry();
  var material = new THREE.LineBasicMaterial({
    vertexColors: THREE.VertexColors
  });

  this.color = new THREE.Color(colorval);


  for (var i = minX; i <= (maxX); i += step) {
    geometry.vertices.push(
      new THREE.Vector3(i, minY, 0), new THREE.Vector3(i, maxY, 0)
    );
    geometry.colors.push(this.color, this.color, this.color, this.color);
  }

  for (var i = minY; i <= (maxY); i += step) {
    geometry.vertices.push(
      new THREE.Vector3(minX, i, 0), new THREE.Vector3(maxX, i, 0)

    );
    geometry.colors.push(this.color, this.color, this.color, this.color);
  }

  THREE.LineSegments.call(this, geometry, material);

};

THREE.GridHelper.prototype = Object.create(THREE.LineSegments.prototype);
THREE.GridHelper.prototype.constructor = THREE.GridHelper;

THREE.GridHelper.prototype.setColors = function(colorCenterLine, colorGrid) {

  this.geometry.colorsNeedUpdate = true;

};