var toolchanges = [];

function setupToolChanges(gcode) {
  // scan gcode for tool change info
  var fileLines = gcode
  fileLines = fileLines.split("\n")
  // console.log("about to look for tool changes in gcode editor:", fileLines.length, "\n\n\n");

  var toolComments = {};
  var toolChanges = {};
  var toolChangesKeys = [];

  for (var i = 0; i < fileLines.length; i++) {
    var line = fileLines[i];

    // see if we have line where comment starts with
    // look for something like:
    // (T1 D=3.175 CR=0. - ZMIN=-4.2 - FLAT END MILL)
    // ;T1 1/4 inch flat bottom endmill
    // T0 ; 1/4 inch flat bottom endmill
    if (line.match(/\(T(\d+)\s+(.*)\)/i) || line.match(/\;T(\d+)\s+(.*)\)/i) || line.match(/\T(\d+)/i)) {
      var toolNum = parseInt(RegExp.$1);
      var toolComment = "T" + toolNum + " " + RegExp.$2;
      console.log("found tool comment. lineNum:", i, "toolNum:", toolNum, "comment:", toolComment, "line:", line);
      toolComments[toolNum] = {
        lineNum: i + 1,
        toolNum: toolNum,
        toolComment: toolComment,
      }
    }

    // look for M6 line
    if (line.match(/M6|M06|M006/i)) {
      var toolNum;
      if (line.match(/T(\d+)/i)) {
        toolNum = parseInt(RegExp.$1);
      }
      toolChanges[(i + 1)] = {
        lineNum: i + 1,
        toolNum: toolNum,
      };
      toolChangesKeys.push(i + 1);
      // console.log("found tool change. lineNum:", i, "line:", line);
    }
  }

  // console.log("this.toolComments:", toolComments);
  // console.log("this.toolChanges:", toolChanges);

  // now look for a comment up to 10 lines above the M6 tool change line to see if any comments are there
  var keys = toolChangesKeys; //Object.keys(this.toolChanges).sort();
  // console.log("looking for comments above m6 to get a label for this tool change. keys:", keys);
  for (var i = 0; i < keys.length; i++) {
    var toolChangeLineNum = keys[i];
    var lookBackToLineNum = toolChangeLineNum - 10;
    if (lookBackToLineNum < 1) lookBackToLineNum = 1; // first line

    // now look backwards until we've seen just 1 comment
    for (var lineNum = toolChangeLineNum; lineNum >= lookBackToLineNum; lineNum--) {
      var line = fileLines[lineNum - 1]; // index of array is 1 less than lineNum
      // console.log("looking at lineNum:", lineNum, "line:", line);
      // see if comment
      if (line.match(/\((.*?)\)/) || line.match(/;(.*)/)) {
        var comment = RegExp.$1;
        // console.log("found comment:", comment);

        // stick comment into toolChanges
        toolChanges[toolChangeLineNum].sectionComment = comment;

        // break since we found one
        break;
      }
    }
  }

  // console.log("after adding section comments. this.toolChanges:", toolChanges);
  // console.log("after adding section comments. this.toolComments:", toolComments);
  // console.log("after adding section comments. this.toolChangesKeys:", toolChangesKeys);

  var toolChangesArray = []

  for (var i = 0; i < keys.length; i++) {

    var toolChange = toolChanges[keys[i]];
    console.log(toolChange)
    var tool = toolComments[toolChange.toolNum];
    var newToolChange = {
      lineNum: false,
      toolNum: false,
      toolComment: false,
      sectionComment: false
    }

    newToolChange.toolNum = toolChange.toolNum
    newToolChange.lineNum = toolChange.lineNum

    if ('sectionComment' in toolChange) {
      newToolChange.sectionComment = toolChange.sectionComment
    }

    if (tool != null) {
      newToolChange.toolComment = tool.toolComment
    }

    toolChangesArray.push(newToolChange)
  }

  return toolChangesArray;

}