var editor = ace.edit("editor");
var gcodeMonitor;
var safeToUpdateSliders = true;

$(document).ready(function() {

  $('#tempControls').hide();
  editor.$blockScrolling = Infinity;
  editor.session.setMode("ace/mode/cncpro");
  editor.setTheme('ace/theme/ambiance')
  editor.setOption('printMarginColumn', 0)
  editor.session.setValue(gcodesample); // from samplefile.js
  editor.container.addEventListener("contextmenu", function(e) {
    console.log("context")
    var template = `<h6 class="dropdown-header"><div class="float-left">Line <span id="linenumber"></span>: Options</div><div class="float-right"><button type="button" class="close" aria-label="Close" onclick="$('#editorContextMenu').hide()"><span aria-hidden="true">&times;</span></button></div></h6><a class="dropdown-item" href="#"><i class="fa fa-fw fa-list-ol" aria-hidden="true"></i>&nbsp;Run queue from here</a>
      <a class="dropdown-item" href="#" onclick="ContextLineRun();"><i class="fa fa-fw fa-play" aria-hidden="true"></i>&nbsp;Execute line: <code>` + editor.session.getLine(editor.getSelectionRange().start.row) + `</code></a>
      <a class="dropdown-item" href="#" onclick="sim(` + (editor.getSelectionRange().start.row + 1) + `)"><i class="fa fa-fw fa-fighter-jet" aria-hidden="true"></i>&nbsp;Simulate from here</a>`
    $("#dropdowncontent").html(template)
    // console.log(e);
    setposition(e);
    e.preventDefault();
    $('#linenumber').html((editor.getSelectionRange().start.row + 1));
    // alert('success! - rightclicked line ' + (editor.getSelectionRange().start.row + 1));
  }, false);




  $(function() {
    $('[data-toggle="tooltip"]').tooltip()
  })

  //File -> Open
  var fileOpen = document.getElementById('file');
  fileOpen.addEventListener('change', readFile, false);

  // Fix for opening same file from http://stackoverflow.com/questions/32916687/uploading-same-file-into-text-box-after-clearing-it-is-not-working-in-chrome?lq=1
  $('#file').bind('click', function() {
    $('#file').val(null);
  });

  $('#view-gcode').change(function() {
    if (this.checked) {
      object.visible = true;
    } else {
      object.visible = false;
    }
  });

  $('#view-grid').change(function() {
    if (this.checked) {
      grid.visible = true;
    } else {
      grid.visible = false;
    }
  });

  // Fix tooltips - as recommended by https://stackoverflow.com/questions/33584392/bootstraps-tooltip-doesnt-disappear-after-button-click-mouseleave
  $('[data-toggle="tooltip"]').tooltip({
    trigger: 'hover click focus'
  })

  $('.btn').click(function() {
    $('[data-toggle="tooltip"]').tooltip('hide');
  })

  $("input[name='jog']").change(function(e) {
    console.log("Jogging " + $("input[name='jog']:checked").val() + " by " + $("input[name='switch']:checked").val());
    var btn = $("input[name='jog']:checked").val()
    var dist = $("input[name='switch']:checked").val()
    var feedrate = $("#xyfeedrate").val();
    var zfeedrate = $("#zfeedrate").val();
    switch (btn) {
      case 'x+':
        jog('X', dist, feedrate);
        break;
      case 'x-':
        jog('X', -dist, feedrate);
        break;
      case 'y+':
        jog('Y', dist, feedrate);
        break;
      case 'y-':
        jog('Y', -dist, feedrate);
        break;
      case 'z+':
        jog('Z', dist, zfeedrate);
        break;
      case 'z-':
        jog('Z', -dist, zfeedrate);
        break;
      default:
        // code block
    }
    $('input[name=jog]').prop('checked', false);
  });

  // FeedOverride
  var handle = $("#handle");

  // Set safeToUpdateSliders flag used in status loop on websocket.js to avoid confict
  $("#FROslider").hover(function() {
    safeToUpdateSliders = false;
  }, function() {
    safeToUpdateSliders = true;
  });

  $('#FROslider').slider({
    orientation: "vertical",
    min: 0,
    max: 200,
    value: 100,
    range: "min",
    change: function(event, ui) {
      if (event.originalEvent) {
        console.log(ui.value);
        handle.text(ui.value + "%");
        socket.emit('feedOverride', ui.value);
      }
    },
    create: function() {
      handle.text($(this).slider("value") + "%");
    },
    slide: function(event, ui) {
      if (event.originalEvent) {
        handle.text(ui.value + "%");
      }
    }
  });

  var handle2 = $("#handle2");
  // Set safeToUpdateSliders flag used in status loop on websocket.js to avoid confict
  $("#SROslider").hover(function() {
    safeToUpdateSliders = false;
  }, function() {
    safeToUpdateSliders = true;
  });
  $('#SROslider').slider({
    orientation: "vertical",
    min: 0,
    max: 200,
    value: 100,
    range: "min",
    change: function(event, ui) {
      if (event.originalEvent) {
        handle2.text(ui.value + "%");
        console.log(ui.value);
        socket.emit('spindleOverride', ui.value);
      }
    },
    create: function() {
      handle2.text($(this).slider("value") + "%");
    },
    slide: function(event, ui) {
      if (event.originalEvent) {
        handle2.text(ui.value + "%");
      }
    }
  });

  gcodeMonitor = setTimeout(function() {
    $('#gcodetobesent').html(editor.session.getLength());
  }, (500));


  // // inputfield for rgb
  // $('#color').wheelColorPicker({
  //       format: "rgb",
  //       autoConvert: true,
  //       live: true,
  //       sliders: 'wb',
  //       autoResize: true
  // });
  // $('#color').on('sliderup', function() {
  //   var rgb = $(this).wheelColorPicker('getValue', 'rgb')
  //   // console.log("Color changed to ", getRGB(rgb));
  //   //   M150 Rnnn Unnn Bnnn override leds R G B disables autoset for leds
  //   var data = getRGB(rgb)
  //   sendGcode("M150 R" + data.red + " U" + data.green + " B" + data.blue );
  // });



  init3D();
  initSocket();
  initJog();

});

function getRGB(str) {
  var match = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
  return match ? {
    red: match[1],
    green: match[2],
    blue: match[3]
  } : {};
}

function printLog(string) {
  if (string.isString) {
    string = string.replace(/\n/g, "<br />");
  }
  if ($('#console p').length > 300) {
    // remove oldest if already at 300 lines
    $('#console p').first().remove();
  }
  var template = '<p class="pf">';
  var time = new Date();

  template += '<span class="text-info">[' + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + ']</span> ';
  template += string;
  $('#console').append(template);
  $('#console').scrollTop($("#console")[0].scrollHeight - $("#console").height());
}

function readFile(evt) {
  clearViewer()
  // console.log(evt);
  var f = evt.target.files[0];
  if (f) {
    var r = new FileReader();
    if (f.name.match(/.gcode$/i) || f.name.match(/.txt$/i)) {
      r.readAsText(evt.target.files[0]);
      r.onload = function(event) {
        // document.getElementById('gcodepreview').value = this.result;
        editor.session.setValue(this.result);
        doPreview();
      };
    }
  }
};

function saveFile() {
  var textToWrite = editor.getValue();
  var blob = new Blob([textToWrite], {
    type: "text/plain"
  });
  invokeSaveAsDialog(blob, 'file.gcode');
};

/**
 * @param {Blob} file - File or Blob object. This parameter is required.
 * @param {string} fileName - Optional file name e.g. "image.png"
 */
function invokeSaveAsDialog(file, fileName) {
  if (!file) {
    throw 'Blob object is required.';
  }

  if (!file.type) {
    file.type = 'text/plain';
  }

  var fileExtension = file.type.split('/')[1];

  if (fileName && fileName.indexOf('.') !== -1) {
    var splitted = fileName.split('.');
    fileName = splitted[0];
    fileExtension = splitted[1];
  }

  var fileFullName = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + fileExtension;

  if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
    return navigator.msSaveOrOpenBlob(file, fileFullName);
  } else if (typeof navigator.msSaveBlob !== 'undefined') {
    return navigator.msSaveBlob(file, fileFullName);
  }

  var hyperlink = document.createElement('a');
  hyperlink.href = URL.createObjectURL(file);
  hyperlink.target = '_blank';
  hyperlink.download = fileFullName;

  if (!!navigator.mozGetUserMedia) {
    hyperlink.onclick = function() {
      (document.body || document.documentElement).removeChild(hyperlink);
    };
    (document.body || document.documentElement).appendChild(hyperlink);
  }

  var evt = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });

  hyperlink.dispatchEvent(evt);

  if (!navigator.mozGetUserMedia) {
    URL.revokeObjectURL(hyperlink.href);
  }
}


function setposition(e) {
  var bodyOffsets = document.body.getBoundingClientRect();
  tempX = e.pageX //- bodyOffsets.left;
  tempY = e.pageY;
  // console.log(tempX);
  $("#editorContextMenu").show().css({
    display: "block",
    left: e.pageX,
    top: e.pageY
  });
}

$('#menuitems').on('click', function(e) {
  setposition(e);
});