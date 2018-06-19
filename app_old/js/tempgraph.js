var hotend1 = [];
var hotend2 = [];
var heatbed = [];
var tempLoop;

$( document ).ready(function() {
  $.plot($("#monitor"), [hotend1, hotend2, heatbed], options);
  tempLoop = setInterval(function() {
      setTemp(laststatus.machine.temperature.actual.t0, laststatus.machine.temperature.actual.t1, laststatus.machine.temperature.actual.b)
  }, 1000);

  $('#T0CurTemp').click(function(){
    // alert();
    $('#T0CurTemp').hide();
    $('#T0SetTemp').show();
    $('#T0SetTempInput').focus();
    $('#T0SetTempInput').val(laststatus.machine.temperature.setpoint.t0.toFixed(1))
  });

  $('#T0Set').click(function(){
    // alert();
    $('#T0SetTemp').hide();
    $('#T0CurTemp').show();
    sendGcode("T0");
    sendGcode("M104 S" + $('#T0SetTempInput').val());
  });

  $('#T1CurTemp').click(function(){
    // alert();
    $('#T1CurTemp').hide();
    $('#T1SetTemp').show();
    $('#T1SetTempInput').focus();
    $('#T1SetTempInput').val(laststatus.machine.temperature.setpoint.t1.toFixed(1))
  });

  $('#T1Set').click(function(){
    // alert();
    $('#T1SetTemp').hide();
    $('#T1CurTemp').show();
    sendGcode("T1");
    sendGcode("M104 S" + $('#T1SetTempInput').val());
  });

  $('#B0CurTemp').click(function(){
    // alert();
    $('#B0CurTemp').hide();
    $('#B0SetTemp').show();
    $('#B0SetTempInput').focus();
    $('#B0SetTempInput').val(laststatus.machine.temperature.setpoint.b.toFixed(1))
  });

  $('#B0Set').click(function(){
    // alert();
    $('#B0SetTemp').hide();
    $('#B0CurTemp').show();
    sendGcode("M140 S" + $('#B0SetTempInput').val());
  });

});


  var options = {
    series: {
      lines: { show: true, fill: false },
      bars: { show: false },
      points: { show: false }
    },
    yaxis: {
      min: 0,
      max: 280,
      tickSize: 40,
      color: '#aaa',
      tickFormatter: function(val, axis) { return val < axis.max ? val.toFixed(0)+'&deg;C' : "&deg;C";}
    },
    xaxis: {
      tickSize: 5,
      tickFormatter: function(val, axis) { return ""}
      //tickLength: 0.1
      // mode: "time"
    },
    grid: {
        // backgroundColor:
        // {
        //     colors: ["#ccc", "#fff"]
        // },

    },
    colors: [ "#ff0000", "#00ff00", "#00a2ff" ]


  };


function setTemp(t0, t1, b) {

  var he1 = [];
  var he2 = [];
  var hb = [];


  hotend1 = hotend1.slice(-100)
  hotend1.push(t0);
  for (var i = 0; i < hotend1.length; ++i) {
    he1.push([i, hotend1[i]])
  }

  hotend2 = hotend2.slice(-100)
  hotend2.push(t1);
  for (var i = 0; i < hotend2.length; ++i) {
    he2.push([i, hotend2[i]])
  }

  heatbed = heatbed.slice(-100)
  heatbed.push(b)
  for (var i = 0; i < heatbed.length; ++i) {
    hb.push([i, heatbed[i]])
  }

  $.plot($("#monitor"), [he1, he2, hb], options);
}
