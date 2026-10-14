"use strict";

// This is a simplified and updated version of http://gcode.joewalnes.com/
// Updated with code from http://chilipeppr.com/tinyg's 3D viewer to support more CNC type Gcode
// Simplified by Andrew Hodel in 2015
// Updated by PvdW in 2016 for S-Value lasers
// Updates by PvdW in 2017 - new arc code from http://chilipeppr.com
// Updates by PvdW in 2017 - AUTODETECT MAX S VALUE
// Updated by PvdW in 2017 - Parse GCODE to find starting temperatures (preheat machine)
// Updated by PvdW in 2018 - Webworker Version
// Updated by PvdW in 2019 - Improve Performance
// Updated by PvdW in 2021 - New Sim Data, Smaller footprint, more efficient "lines" userData
// Updated by Ivo in 2026 - Fixed arc maths, removed dependency on THREE, removed fake points

self.onmessage = function(e) {
  try {
    const object = createObjectFromGCode(e.data.data);

    // use transferrable arrays for the raw data, which avoids serializing across threads
    const gArray = new Int8Array(new ArrayBuffer(object.linePoints.length));
    const srcArray = new Int32Array(new ArrayBuffer(object.linePoints.length * 4));
    const offsetArray = new Int32Array(new ArrayBuffer(object.linePoints.length * 4));
    const startArray = new Float32Array(new ArrayBuffer(object.linePoints.length * 4));
    const durationArray = new Float32Array(new ArrayBuffer(object.linePoints.length * 4));
    const xArray = new Float32Array(new ArrayBuffer(object.linePoints.length * 4));
    const yArray = new Float32Array(new ArrayBuffer(object.linePoints.length * 4));
    const zArray = new Float32Array(new ArrayBuffer(object.linePoints.length * 4));

    for (let i = 0; i < object.linePoints.length; i++) {
      const point = object.linePoints[i];
      gArray[i] = point.g;
      srcArray[i] = point.src;
      offsetArray[i] = point.offset;
      startArray[i] = point.startTime;
      durationArray[i] = point.duration;
      xArray[i] = point.x;
      yArray[i] = point.y;
      zArray[i] = point.z;
    }

    const result = {
      pointCount: object.linePoints.length,
      totalTime: object.totalTime,
      toolRanges: object.toolRanges,
      gArray: gArray,
      srcArray: srcArray,
      offsetArray: offsetArray,
      startArray: startArray,
      durationArray: durationArray,
      xArray: xArray,
      yArray: yArray,
      zArray: zArray,
    };

    self.postMessage(result, [
      gArray.buffer,
      srcArray.buffer,
      offsetArray.buffer,
      startArray.buffer,
      durationArray.buffer,
      xArray.buffer,
      yArray.buffer,
      zArray.buffer]);
  } catch (ex) {
    self.postMessage({error: ex.toString()});
    throw ex;
  }
}

// Number of linear segments to use when approximating an arc.
// A better approach would be to make this depend on the total length.
const ARC_SEGMENT_COUNT = 20;

// A time multiplier to account for slowdowns due to acceleration.
// A better approach would be to take into account the sharpness of each turn.
// The specific machine settings can also be considered.
const TIME_FUDGE_FACTOR = 1.32;

const gcodeHandlers = {
  // G0: rapid move
  G0: function(parser, args) {
    args.g = 0;
    parser.handleLineCommand(args);
    return true;
  },

  // G1: feed move
  G1: function(parser, args) {
    args.g = 1;
    parser.handleLineCommand(args);
    return true;
  },

  // G2: CW arc
  G2: function(parser, args) {
    args.g = 2;
    parser.handleArcCommand(args);
    return true;
  },

  // G3: CCW arc
  G3: function(parser, args) {
    args.g = 3;
    parser.handleArcCommand(args);
    return true;
  },

  // G73: drill cycle
  G73: function(parser, args) {
    args.g = 1; // treat as G1
    parser.handleLineCommand(args);
    return true;
  },

  // G92: set temporary offset
  G92: function(parser, args) {
    if (args.x !== undefined && !isNaN(parser.lastPoint.x)) {
      parser.offsetG92.x = parser.lastPoint.x - args.x;
    }
    if (args.y !== undefined && !isNaN(parser.lastPoint.y)) {
      parser.offsetG92.y = parser.lastPoint.y - args.y;
    }
    if (args.z !== undefined && !isNaN(parser.lastPoint.z)) {
      parser.offsetG92.z = parser.lastPoint.z - args.z;
    }
    return false;
  },

  // M3: spindle forward
  M3: function(parser) {
    parser.addToolRange(parser.tool, 1);
    return false;
  },

  // M4: spindle reverse
  M4: function(parser) {
    parser.addToolRange(parser.tool, -1);
    return false;
  },

  // M5: spindle off
  M5: function(parser) {
    parser.addToolRange(-1);
    return false;
  },

  // M6: toolchange
  M6: function() {
    return false;
  },
};

// Mode-setting non-motion commands, of which many may appear on one line
// These take no arguments
const gcodeModalHandlers = {
  // G17: select XY arc plane
  G17: function(parser) {
    parser.arcPlane = "G17";
  },

  // G18: select ZX arc plane
  G18: function(parser) {
    parser.arcPlane = "G18";
  },

  // G19: select YZ arc plane
  G19: function(parser) {
    parser.arcPlane = "G19";
  },

  // G20: switch to inches
  G20: function(parser) {
    parser.isUnitsMm = false;
  },

  // G21: switch to mm
  G21: function(parser) {
    parser.isUnitsMm = true;
  },

  // G90: use absolute positions for XYZ (more accurately, relative to G92)
  G90: function(parser) {
    parser.relative = false;
  },

  // G90.1: use absolute positions for IJK (not supported by grbl or grblHAL)
  'G90.1': function(parser) {
    parser.ijkrelative = false;
  },

  // G91: use relative positions for XYZ
  G91: function(parser) {
    parser.relative = true;
  },

  // G91.1: use relative positions for IJK
  'G91.1': function(parser) {
    parser.ijkrelative = true;
  },

  // G92.1: clear temporary offset G92
  'G92.1': function(parser) {
    parser.offsetG92 = {x: 0, y: 0, z: 0};
  },
};

function calcPointDistance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

class GCodeParser {

constructor(handlers, modalHandlers) {
  this.handlers = handlers;
  this.modalHandlers = modalHandlers;
  this.src = 0;
  this.offset = 0;
  this.lastPoint = {x: NaN, y: NaN, z: NaN};
  this.offsetG92 = {x: 0, y: 0, z: 0};
  this.lastMove = "G1";
  this.feedrate = 0;
  this.speed = 0;
  this.tool = 0;
  this.relative = false;
  this.ijkrelative = true; // For Mach3 Arc IJK Absolute mode
  this.arcPlane = "G17";
  this.totalTime = 0;
  this.isUnitsMm = true;
  this.linePoints = [];
  this.toolRanges = [];
  this.currentToolRange = null;
}

createArcPoints(centerX, centerY, startZ, endZ, radius, startAngle, endAngle, plane) {
  const points = new Array(ARC_SEGMENT_COUNT + 1);
  for (let i = 0; i <= ARC_SEGMENT_COUNT; i++) {
    const angle = (startAngle * (ARC_SEGMENT_COUNT-i) + endAngle * i) / ARC_SEGMENT_COUNT;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const z = (startZ * (ARC_SEGMENT_COUNT-i) + endZ * i) / ARC_SEGMENT_COUNT;

    switch (plane) {
      case "G17": points[i] = {x: x, y: y, z: z}; break;
      case "G18": points[i] = {x: y, y: z, z: x}; break;
      case "G19": points[i] = {x: z, y: x, z: y}; break;
    }
  }

  return points;
}

createArcFrom2PtsAndCenter(vp1, vp2, center, clockwise) {
  const p1deltaX = vp1.x - center.x;
  const p1deltaY = vp1.y - center.y;
  const p1deltaZ = vp1.z - center.z;

  const p2deltaX = vp2.x - center.x;
  const p2deltaY = vp2.y - center.y;
  const p2deltaZ = vp2.z - center.z;

  switch (this.arcPlane) {
    case "G17": { // XY
      const radius = Math.sqrt(p1deltaX*p1deltaX + p1deltaY*p1deltaY);
      const radius2 = Math.sqrt(p2deltaX*p2deltaX + p2deltaY*p2deltaY);

      if (Math.abs(radius - radius2) > 0.01) {
        console.log("Line: ", this.src, "Radiuses not equal. r1:", radius, ", r2:", radius2, "difference:", Math.abs(radius - radius2));
      }

      // Find start and end angles
      let startAngle = Math.atan2(p1deltaY, p1deltaX);
      let endAngle = Math.atan2(p2deltaY, p2deltaX);
      if ((vp2.x-vp1.x)*(vp2.x-vp1.x) + (vp2.y-vp1.y)*(vp2.y-vp1.y) < 0.0001) {
        // start and end points are close together, draw a full circle
        endAngle = clockwise ? (startAngle - 2 * Math.PI) : (startAngle + 2 * Math.PI);
      } else {
        if (clockwise && startAngle < endAngle) { // order clockwise
          startAngle += 2*Math.PI;
        } else if (!clockwise && endAngle < startAngle) { // order counterclockwise
          endAngle += 2*Math.PI;
        }
      }
      return this.createArcPoints(center.x, center.y, vp1.z, vp2.z, radius, startAngle, endAngle, "G17");
    }

    case "G18": { // ZX
      const radius = Math.sqrt(p1deltaX*p1deltaX + p1deltaZ*p1deltaZ);
      const radius2 = Math.sqrt(p2deltaX*p2deltaX + p2deltaZ*p2deltaZ);

      if (Math.abs(radius - radius2) > 0.01) {
        console.log("Line: ", this.src, "Radiuses not equal. r1:", radius, ", r2:", radius2, "difference:", Math.abs(radius - radius2));
      }

      let startAngle = Math.atan2(p1deltaX, p1deltaZ);
      let endAngle = Math.atan2(p2deltaX, p2deltaZ);
      if ((vp2.z-vp1.z)*(vp2.z-vp1.z) + (vp2.x-vp1.x)*(vp2.x-vp1.x) < 0.0001) {
        endAngle = clockwise ? (startAngle - 2 * Math.PI) : (startAngle + 2 * Math.PI);
      } else {
        if (clockwise && startAngle < endAngle) {
          startAngle += 2*Math.PI;
        } else if (!clockwise && endAngle < startAngle) {
          endAngle += 2*Math.PI;
        }
      }
      return this.createArcPoints(center.z, center.x, vp1.y, vp2.y, radius, startAngle, endAngle, "G18");
    }

    case "G19": { // YZ
      const radius = Math.sqrt(p1deltaY*p1deltaY + p1deltaZ*p1deltaZ);
      const radius2 = Math.sqrt(p2deltaY*p2deltaY + p2deltaZ*p2deltaZ);

      if (Math.abs(radius - radius2) > 0.01) {
        console.log("Line: ", this.src, "Radiuses not equal. r1:", radius, ", r2:", radius2, "difference:", Math.abs(radius - radius2));
      }

      let startAngle = Math.atan2(p1deltaZ, p1deltaY);
      let endAngle = Math.atan2(p2deltaZ, p2deltaY);
      if ((vp2.y-vp1.y)*(vp2.y-vp1.y) + (vp2.z-vp1.z)*(vp2.z-vp1.z) < 0.0001) {
        endAngle = clockwise ? (startAngle - 2 * Math.PI) : (startAngle + 2 * Math.PI);
      } else {
        if (clockwise && startAngle < endAngle) {
          startAngle += 2*Math.PI;
        } else if (!clockwise && endAngle < startAngle) {
          endAngle += 2*Math.PI;
        }
      }
      return this.createArcPoints(center.y, center.z, vp1.x, vp2.x, radius, startAngle, endAngle, "G19");
    }
  }
}

addArcSegment(args, p1, p2, arcInfo) {
  // technically arcs are not well defined until the start position is known, but for viewer purposes replace NaN with sensible defaults
  const vp2 = {
    x: isNaN(p2.x) ? 0 : p2.x,
    y: isNaN(p2.y) ? 0 : p2.y,
    z: isNaN(p2.z) ? 0 : p2.z};
  const vp1 = {
    x: isNaN(p1.x) ? vp2.x : p1.x,
    y: isNaN(p1.y) ? vp2.y : p1.y,
    z: isNaN(p1.z) ? vp2.z : p1.z};

  // if this is an R arc gcode command, we're given the radius, so we
  // don't have to calculate it. however we need to determine center
  // of arc
  let center;
  if (args.r != null) {
    const radius = parseFloat(arcInfo.r);

    // First, find the point halfway between your two points.  We'll call it p3
    const x3 = (vp1.x + vp2.x) / 2;
    const y3 = (vp1.y + vp2.y) / 2;
    const z3 = (vp1.z + vp2.z) / 2;

    // Second, find the vector from p1 to p3
    const deltaX = x3 - vp1.x;
    const deltaY = y3 - vp1.y;
    const deltaZ = z3 - vp1.z;

    switch (this.arcPlane) {
      case "G17": { // XY
        const halfSq = deltaX*deltaX + deltaY*deltaY; // squared half distsance
        const distSq = radius*radius - halfSq; // squared distsance from p3 to the center
        if (distSq < 0) {
          // the points are further apart than twice the radius, which is invalid. pick the mid point
          console.log("Radius is too small:", radius, "Should be at least:", Math.sqrt(halfSq));
          center = {x: x3, y: y3, z: z3};
        }
        else {
          let scale = Math.sqrt(distSq / halfSq); // ratio between the half vector length and the distance from p3 to the center
          if ((arcInfo.clockwise ? -radius : radius) < 0) scale = -scale; // flip the sign if necessary
          center = {x: x3 - deltaY*scale, y: y3 + deltaX*scale, z: z3}; // the Z is irrelevant, so just pick the middle z3
        }
        break;
      }

      case "G18": { // ZX
        const halfSq = deltaZ*deltaZ + deltaX*deltaX;
        const distSq = radius*radius - halfSq;
        if (distSq < 0) {
          console.log("Radius is too small:", radius, "Should be at least:", Math.sqrt(halfSq));
          center = {x: x3, y: y3, z: z3};
        }
        else {
          let scale = Math.sqrt(distSq / halfSq);
          if ((arcInfo.clockwise ? -radius : radius) < 0) scale = -scale;
          center = {x: x3 + deltaZ*scale, y: y3, z: z3 - deltaX*scale};
        }
        break;
      }

      case "G19": { // YZ
        const halfSq = deltaY*deltaY + deltaZ*deltaZ;
        const distSq = radius*radius - halfSq;
        if (distSq < 0) {
          console.log("Radius is too small:", radius, "Should be at least:", Math.sqrt(halfSq));
          center = {x: x3, y: y3, z: z3};
        }
        else {
          let scale = Math.sqrt(distSq / halfSq);
          if ((arcInfo.clockwise ? -radius : radius) < 0) scale = -scale;
          center = {x: x3, y: y3 - deltaZ*scale, z: z3 + deltaY*scale};
        }
        break;
      }
    }

  } else {
    // this code deals with IJK gcode commands
    center = {x: arcInfo.i, y: arcInfo.j, z: arcInfo.k};
  }

  const arcPoints = this.createArcFrom2PtsAndCenter(vp1, vp2, center, arcInfo.clockwise);

  let duration = 0;
  // calc length of one segment of the arc, they should all be the same
  const segLength = calcPointDistance(arcPoints[0], arcPoints[1]);
  if (segLength > 0) {
    const fr = this.feedrate > 0 ? this.feedrate : 1000;
    duration = segLength / fr;
    duration = duration * TIME_FUDGE_FACTOR;
  }

  // The first point of the arc matches the starting position and should normally be skipped.
  // However if this is an edge case where the arc is the first command, add the first point with time 0
  if (this.linePoints.length == 0) {
    this.linePoints.push({
      src: this.src,
      offset: this.offset,
      x: arcPoints[0].x,
      y: arcPoints[0].y,
      z: arcPoints[0].z,
      g: 2,
      startTime: this.totalTime,
      duration: 0,
    });
  }
  for (let i = 1; i < arcPoints.length; i++) {
    this.linePoints.push({
      src: this.src,
      offset: this.offset,
      x: arcPoints[i].x,
      y: arcPoints[i].y,
      z: arcPoints[i].z,
      g: 2,
      startTime: this.totalTime,
      duration: duration,
    });
    this.totalTime += duration;
  }
}

addLineSegment(args, p1, p2) {
  // replace NaNs with sensible defaults
  const vp2 = {
    x: isNaN(p2.x) ? 0 : p2.x,
    y: isNaN(p2.y) ? 0 : p2.y,
    z: isNaN(p2.z) ? 0 : p2.z};
  const vp1 = {
    x: isNaN(p1.x) ? vp2.x : p1.x,
    y: isNaN(p1.y) ? vp2.y : p1.y,
    z: isNaN(p1.z) ? vp2.z : p1.z};

  const dist = calcPointDistance(vp1, vp2);

  let duration = 0;
  if (dist > 0) {
    // the "1000" for G0 will be replaced during simulation with the real rapid rate
    const fr = args.g == 0 ? 1000 : (this.feedrate ? this.feedrate : 100);
    duration = dist / fr;
    duration = duration * TIME_FUDGE_FACTOR;
  }

  this.linePoints.push({
    startTime: this.totalTime,
    duration: duration,
    src: this.src,
    offset: this.offset,
    x: p2.x,
    y: p2.y,
    z: p2.z,
    g: args.g,
  });

  this.totalTime += duration;
}

addToolRange(tool, direction) {
  if (this.currentToolRange) {
    if (this.currentToolRange.tool == tool && this.currentToolRange.direction == direction) return; // no change
    this.currentToolRange.endLine = this.src;
    this.currentToolRange.endPoint = this.linePoints.length;
    this.toolRanges.push(this.currentToolRange);
    this.currentToolRange = null;
  }
  if (tool != -1) {
    this.currentToolRange = {
      tool: tool,
      direction: direction,
      startLine: this.src,
      startPoint: this.linePoints.length};
  }
}

handleLineCommand(args) {
  if (args.x === undefined && args.y === undefined && args.z === undefined) {
    return; // needs a motion on at least one axis
  }

  const origin = this.relative ? this.lastPoint : this.offsetG92;
  const newPoint = {
    x: args.x !== undefined ? args.x + origin.x: this.lastPoint.x,
    y: args.y !== undefined ? args.y + origin.y: this.lastPoint.y,
    z: args.z !== undefined ? args.z + origin.z: this.lastPoint.z,
  };

  this.addLineSegment(args, this.lastPoint, newPoint);
  if (!isNaN(newPoint.x)) this.lastPoint.x = newPoint.x;
  if (!isNaN(newPoint.y)) this.lastPoint.y = newPoint.y;
  if (!isNaN(newPoint.z)) this.lastPoint.z = newPoint.z;
}

handleArcCommand(args) {
  if (args.x === undefined && args.y === undefined && args.z === undefined) {
    return; // needs a motion on at least one axis
  }

  let origin = this.relative ? this.lastPoint : this.offsetG92;
  const arcInfo = {};
  const newPoint = {
    x: args.x !== undefined ? args.x + origin.x: this.lastPoint.x,
    y: args.y !== undefined ? args.y + origin.y: this.lastPoint.y,
    z: args.z !== undefined ? args.z + origin.z: this.lastPoint.z,
  };
  if (args.r !== undefined) {
    arcInfo.r = args.r;
  } else {
    origin = this.ijkrelative ? this.lastPoint : this.offsetG92;
    arcInfo.i = args.i !== undefined ? origin.x + args.i : this.lastPoint.x;
    arcInfo.j = args.j !== undefined ? origin.y + args.j : this.lastPoint.y;
    arcInfo.k = args.k !== undefined ? origin.z + args.k : this.lastPoint.z;
    if (isNaN(arcInfo.i)) arcInfo.i = 0;
    if (isNaN(arcInfo.j)) arcInfo.j = 0;
    if (isNaN(arcInfo.k)) arcInfo.k = 0;
  }
  arcInfo.clockwise = (args.g == 2);

  this.addArcSegment(args, this.lastPoint, newPoint, arcInfo);
  if (!isNaN(newPoint.x)) this.lastPoint.x = newPoint.x;
  if (!isNaN(newPoint.y)) this.lastPoint.y = newPoint.y;
  if (!isNaN(newPoint.z)) this.lastPoint.z = newPoint.z;
}

parseLine(text, src, offset) {
  // remove comments
  text = text.replace(/\(.*?\)/g, "");
  text = text.replace(/;.*$/, "");

  // remove line numbers if exist
  if (text.match(/^N/i)) {
    // yes, there's a line num
    text = text.replace(/^N\d+\s*/ig, "");
  }

  // collapse leading zero g cmds to no leading zero
  text = text.replace(/G00/i, 'G0');
  text = text.replace(/G0(\d)/i, 'G$1');
  // add spaces before g cmds and xyzabcijkf params
  text = text.replace(/([gmtxyzabcijkfst])/ig, " $1");
  // remove spaces after xyzabcijkf params because a number should be directly after them
  text = text.replace(/([xyzabcijkfst])\s+/ig, "$1");
  // remove front and trailing space
  text = text.trim();

  if (text.length == 0) return;

  const tokens = [];
  // Execute any non-motion commands and T/F/S params on the line immediately
  // Add other commands to the tokens list for later handling
  text.split(/\s+/).forEach((token) => {
    if (token.length == 0) return;
    const modalHandler = this.modalHandlers[token.toUpperCase()];
    if (modalHandler) {
      modalHandler(this);
    } else if (token[0] == "T") {
      this.tool = parseInt(token.substring(1));
    } else if (token[0] == "F") {
      this.feedrate = this.isUnitsMm ? parseFloat(token.substring(1)) : (parseFloat(token.substring(1)) * 25.4);
    } else if (token[0] == "S") {
      this.speed = parseInt(token.substring(1));
    } else {
      tokens.push(token);
    }
  });

  if (tokens.length == 0) return;

  this.src = src;
  this.offset = offset;

  const args = {};
  tokens.forEach((token) => {
    const key = token[0].toLowerCase();
    const value = parseFloat(token.substring(1));
    if (!this.isUnitsMm && "xyz".indexOf(key) >= 0) {
      args[key] = value * 25.4;
    }else {
      args[key] = value;
    }
  });

  let command;
  if (args.g != undefined) {
    command = "G" + args.g;
  } else if (args.m != undefined) {
    command = "M" + args.m;
  } else {
    command = this.lastMove;
  }

  const handler = this.handlers[command];
  if (handler && handler(this, args)) {
    // if the handler returns true, then this is a move command that can be used as a default for future moves
    this.lastMove = command;
  }
}

parseGcode(gcode) {
  const regex = /\r?\n/g;
  let offset = 0;
  let progress = 0;
  let src = 0;
  while (true) {
    regex.lastIndex = offset;
    const end = regex.exec(gcode);
    const line = gcode.slice(offset, end ? end.index : undefined);

    if (src % 100 === 0) {
      const p = Math.floor((offset / gcode.length) * 100);
      if (p > progress) {
        self.postMessage({
          progress: p,
        });
        progress = p;
      }
    }

    this.parseLine(line, src, offset);

    if (!end) {
      break;
    }
    src++;
    offset = end.index + end[0].length;
  }
  this.addToolRange(-1);

  // replace XY=NaN with the first known coordinates
  // replace Z=NaN with the highest Z in the object
  const linePoints = this.linePoints;
  let firstX = undefined;
  let firstY = undefined;
  let maxZ = undefined;
  for (const point of linePoints) {
    const x = point.x;
    const y = point.y;
    const z = point.z;

    if (firstX == undefined && !isNaN(x)) {
      firstX = x;
    }
    if (firstY == undefined && !isNaN(y)) {
      firstY = y;
    }
    if (!isNaN(z) && (maxZ == undefined || maxZ < z)) {
      maxZ = z;
    }
  }

  for (let point of linePoints) {
    if (isNaN(point.x)) {
      point.x = firstX || 0;
    }
    if (isNaN(point.y)) {
      point.y = firstY || 0;
    }
    if (isNaN(point.z)) {
      point.z = maxZ || 0;
    }
  }

  self.postMessage({
    progress: 100,
  });
}

} // end of class GCodeParser

function createObjectFromGCode(gcode) {
  const parser = new GCodeParser(gcodeHandlers, gcodeModalHandlers);
  parser.parseGcode(gcode);

  const data = {
    linePoints: parser.linePoints,
    toolRanges: parser.toolRanges,
    totalTime: parser.totalTime,
  }

  return data;
}
