/**
 * Based on https://github.com/mrdoob/three.js/blob/a72347515fa34e892f7a9bfa66a34fdc0df55954/examples/js/exporters/STLExporter.js
 * Tested on r68 and r70
 * @author jcarletto / https://github.com/jcarletto27
 * @author kjlubick / https://github.com/kjlubick
 * @author kovacsv / http://kovacsv.hu/
 * @author mrdoob / http://mrdoob.com/

 */
THREE.STLExporter = function () {};

THREE.STLExporter.prototype = {

	constructor : THREE.STLExporter,

	parse : (function () {

		var vector = new THREE.Vector3();
		var normalMatrixWorld = new THREE.Matrix3();

		return function (scene) {

			var output = '';

			output += 'solid exported\n';

			scene.traverse(function (object) {

				if (object instanceof THREE.Mesh) {

					var geometry = object.geometry;
					var matrixWorld = object.matrixWorld;
					var mesh = object;

					if (geometry instanceof THREE.Geometry) {

						var vertices = geometry.vertices;
						var faces = geometry.faces;

						normalMatrixWorld.getNormalMatrix(matrixWorld);

						for (var i = 0, l = faces.length; i < l; i++) {
							var face = faces[i];

							vector.copy(face.normal).applyMatrix3(normalMatrixWorld).normalize();

							output += '\tfacet normal ' + vector.x + ' ' + vector.y + ' ' + vector.z + '\n';
							output += '\t\touter loop\n';

							var indices = [face.a, face.b, face.c];

							for (var j = 0; j < 3; j++) {
								var vertexIndex = indices[j];
								if (mesh.geometry.skinIndices.length == 0) {
									vector.copy(vertices[vertexIndex]).applyMatrix4(matrixWorld);
									output += '\t\t\tvertex ' + vector.x + ' ' + vector.y + ' ' + vector.z + '\n';
								} else {
									vector.copy(vertices[vertexIndex]); //.applyMatrix4( matrixWorld );

									// see https://github.com/mrdoob/three.js/issues/3187
									boneIndices = [];
									boneIndices[0] = mesh.geometry.skinIndices[vertexIndex].x;
									boneIndices[1] = mesh.geometry.skinIndices[vertexIndex].y;
									boneIndices[2] = mesh.geometry.skinIndices[vertexIndex].z;
									boneIndices[3] = mesh.geometry.skinIndices[vertexIndex].w;

									weights = [];
									weights[0] = mesh.geometry.skinWeights[vertexIndex].x;
									weights[1] = mesh.geometry.skinWeights[vertexIndex].y;
									weights[2] = mesh.geometry.skinWeights[vertexIndex].z;
									weights[3] = mesh.geometry.skinWeights[vertexIndex].w;

									inverses = [];
									inverses[0] = mesh.skeleton.boneInverses[boneIndices[0]];
									inverses[1] = mesh.skeleton.boneInverses[boneIndices[1]];
									inverses[2] = mesh.skeleton.boneInverses[boneIndices[2]];
									inverses[3] = mesh.skeleton.boneInverses[boneIndices[3]];

									skinMatrices = [];
									skinMatrices[0] = mesh.skeleton.bones[boneIndices[0]].matrixWorld;
									skinMatrices[1] = mesh.skeleton.bones[boneIndices[1]].matrixWorld;
									skinMatrices[2] = mesh.skeleton.bones[boneIndices[2]].matrixWorld;
									skinMatrices[3] = mesh.skeleton.bones[boneIndices[3]].matrixWorld;


									//this checks to see if the mesh has any morphTargets - jc
									if (mesh.geometry.morphTargets !== 'undefined') {


										morphMatricesX = [];
										morphMatricesY = [];
										morphMatricesZ = [];
										morphMatricesInfluence = [];

										for (var mt = 0; mt < mesh.geometry.morphTargets.length; mt++) {
											//collect the needed vertex info - jc
											morphMatricesX[mt] = mesh.geometry.morphTargets[mt].vertices[vertexIndex].x;
											morphMatricesY[mt] = mesh.geometry.morphTargets[mt].vertices[vertexIndex].y;
											morphMatricesZ[mt] = mesh.geometry.morphTargets[mt].vertices[vertexIndex].z;
											morphMatricesInfluence[mt] = mesh.morphTargetInfluences[mt];
										}

									}
									var finalVector = new THREE.Vector4();

									if (mesh.geometry.morphTargets !== 'undefined') {

										var morphVector = new THREE.Vector4(vector.x, vector.y, vector.z);

										for (var mt = 0; mt < mesh.geometry.morphTargets.length; mt++) {
											//not pretty, but it gets the job done - jc
											morphVector.lerp(new THREE.Vector4(morphMatricesX[mt], morphMatricesY[mt], morphMatricesZ[mt], 1), morphMatricesInfluence[mt]);
										}

									}

									for (var k = 0; k < 4; k++) {
										if (mesh.geometry.morphTargets !== 'undefined') {
											var tempVector = new THREE.Vector4(morphVector.x, morphVector.y, morphVector.z);
										} else {
											var tempVector = new THREE.Vector4(vector.x, vector.y, vector.z);
										}
										tempVector.multiplyScalar(weights[k]);
										//the inverse takes the vector into local bone space
										//which is then transformed to the appropriate world space
										tempVector.applyMatrix4(inverses[k])
										.applyMatrix4(skinMatrices[k]);
										finalVector.add(tempVector);

									}

									output += '\t\t\tvertex ' + finalVector.x + ' ' + finalVector.y + ' ' + finalVector.z + '\n';
								}
							}
							output += '\t\tendloop\n';
							output += '\tendfacet\n';
						}
					}
				}

			});

			output += 'endsolid exported\n';

			return output;
		};
	}
		())
};

function saveSTL(scene, name) {
	var exporter = new THREE.STLExporter();
	var stlString = exporter.parse(scene);

	var blob = new Blob([stlString], {
			type : 'text/plain'
		});

	// saveAs(blob, name + '.stl');
	invokeSaveAsDialog(blob, name + '.stl');
}
var exporter = new THREE.STLExporter();
var exportString = function (output, filename) {

	var blob = new Blob([output], {
			type : 'text/plain'
		});
	var objectURL = URL.createObjectURL(blob);

	var link = document.createElement('a');
	link.href = objectURL;
	link.download = filename || 'data.json';
	link.target = '_blank';
	link.click();

};
