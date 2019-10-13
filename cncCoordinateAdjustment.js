let parser = require("gcode-parser");

// just one point
function adjust(refDepths, pointX, pointY) {
	/* look for the bounding triangle using this rule:
	
	_______
	|\    |
	| \   |
	|  \  |
	|   \ |
	|____\|

	*/

	// get appropriate bounds for pointX and pointY
	let boundLowX = Math.floor((pointX/*-offX*/) / refDepths.params.deltaX);
	let boundLowY = Math.floor((pointY/*-offY*/) / refDepths.params.deltaY);

	if (boundLowX < 0) boundLowX++;
	if (boundLowY < 0) boundLowY++;

	if (boundLowX+1 >= refDepths.params.pointsX) boundLowX--;
	if (boundLowY+1 >= refDepths.params.pointsY) boundLowY--;

	// catching out of bounds
	{
		if (boundLowX < 0) {
			console.log("x lower bound negative: ", boundLowX);
			return NaN;
		}
		if (boundLowY < 0) {
			console.log("y lower bound negative: ", boundLowY);
			return NaN;
		}

		if (boundLowX + 1 >= refDepths.params.pointsX) {
			console.log("x upper bound too large: ", boundLowX + 1);
			return NaN;
		}
		if (boundLowY + 1 >= refDepths.params.pointsY) {
			console.log("y upper bound too large: ", boundLowY + 1);
			return NaN;
		}
	}

	let relX = ((pointX/*-offX*/)/refDepths.params.deltaX) % 1;
	let relY = ((pointY/*-offY*/)/refDepths.params.deltaY) % 1;

	// determine the appropriate triangle within the bounding rectangle
	let bottomLeftTriangle = relY/refDepths.params.deltaY > relX/refDepths.params.deltaX;

	// interpolation points
	let ip = [];

	if (bottomLeftTriangle) {
		ip.push([0, 0, refDepths.surface[boundLowX][boundLowY]]);
		ip.push([0, 1, refDepths.surface[boundLowX][boundLowY+1]]);
		ip.push([1, 1, refDepths.surface[boundLowX+1][boundLowY+1]]);
	} else {
		ip.push([0, 0, refDepths.surface[boundLowX][boundLowY]]);
		ip.push([1, 0, refDepths.surface[boundLowX+1][boundLowY]]);
		ip.push([1, 1, refDepths.surface[boundLowX+1][boundLowY+1]]);
	}

	let normal = cross(add(ip[1], ip[0], -1), add(ip[2], ip[0], -1));

	return ((normal[0]*(relX-ip[0][0]) + normal[1]*(relY-ip[0][1])) / (-normal[2])) + ip[0][2] - refDepths.surface[0][0];
}

// gonna assume 3D for this one

function add(p1, p2, subtract) {
	return [p1[0] + subtract*p2[0], p1[1] + subtract*p2[1], p1[2] + subtract*p2[2]];
}

function cross(a, b) {
	return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
}


function levelGcode(strGcode, refDepths) {

	let parsed = parser.parseStringSync(strGcode);

	let x;
	let y;
	let z;

	let processed = [];

	let zGiven = false;

	for (let command of parsed) {
		if (command.line.indexOf("G0") < 0 && command.line.indexOf("G1") < 0) {
			processed.push(command);
			continue;
		}

		let processedCommand = {
			line: "",
			words: [],
		};
		zGiven = false;

		for (let word of command.words) {
			if (word[0] === "X") x = word[1];
			if (word[0] === "Y") y = word[1];

			if (word[0] === "Z") z = word[1];
			else processedCommand.words.push(word);
		}

		let adjustment;
		let adjusted = false;

		if (typeof x !== "undefined" && typeof y !== "undefined") {
			adjustment = adjust(refDepths, x, y).toFixed(3);
			adjusted = true;
		} else adjustment = 0;

		processedCommand.words.push(["Z", z + (+adjustment)]);

		processedCommand.line = "";
		for (let word of processedCommand.words) {
			processedCommand.line += word[0] + word[1] + " ";
		}

		if (adjusted) processedCommand.line += "\t\t; Z" + (adjustment < 0 ? "" : "+") + adjustment;

		processedCommand.line.trim();
		processed.push(processedCommand);
	}

	processed.splice(0,0,{
		line: "; Surface leveling applied to this GCODE"
	});

	return processed
		.map(command => command.line)
		.join("\r\n");

}

module.exports = {levelGcode};
