function manualcontrolPanel() {
  $('#manualControlPanel').show()
  $('#troubleshootingPanel').hide()
}


function troubleshootingPanel() {
  $('#manualControlPanel').hide()
  $('#troubleshootingPanel').show()
}


  $('#XAxisDisplay').change(function() {
    axisDisplayChange()
  });

  $('#YAxisDisplay').change(function() {
    axisDisplayChange()
  });

  $('#ZAxisDisplay').change(function() {
    axisDisplayChange()
  });

  $('#AAxisDisplay').change(function() {
    axisDisplayChange()
  });



 //set which axis to display
$(document).ready(function() {
  var X = (localStorage.getItem('XaxisDRO')) 
  var Y = (localStorage.getItem('YaxisDRO')) 
  var Z =  (localStorage.getItem('ZaxisDRO'))
  var A = (localStorage.getItem('AaxisDRO')) 


if (X!='true'){
    $('#XAxisDisplay').prop('checked',false) 
  }else{
    $('#XAxisDisplay').prop('checked',true) 
  }

  if (Y!='true'){
    $('#YAxisDisplay').prop('checked',false) 
  }else{
    $('#YAxisDisplay').prop('checked',true) 
  }

  if (Z!='true'){
    $('#ZAxisDisplay').prop('checked',false) 
  }else{
    $('#ZAxisDisplay').prop('checked',true) 
  }
  
  if (A!='true'){
    $('#AAxisDisplay').prop('checked',false) 
  }else{
    $('#AAxisDisplay').prop('checked',true) 
  }
  


  
  axisDisplayChange()

 
});


 // show/hide axes jog displays
function axisDisplayChange(){

    if($("#XAxisDisplay").is(':checked')){
      localStorage.setItem('XaxisDRO', "true")
      $("#xPosSetZ").show();
      $("#xPosDro").show();
      $("#xPosGT").show();
      $("#xP").show();
      $("#xM").show();
     }else{
      localStorage.setItem('XaxisDRO', "false")
      $("#xPosSetZ").hide();
      $("#xPosDro").hide();
      $("#xPosGT").hide();
      $("#xP").hide();
      $("#xM").hide();
     }

    if($("#YAxisDisplay").is(':checked')){
      localStorage.setItem('YaxisDRO', "true")
      $("#yPosSetZ").show();
      $("#yPosDro").show();
      $("#yPosGT").show();
      $("#yP").show();
      $("#yM").show();
     }else{
      localStorage.setItem('YaxisDRO', "false")
      $("#yPosSetZ").hide();
      $("#yPosDro").hide();
      $("#yPosGT").hide();
      $("#yP").hide();
      $("#yM").hide();
     }

    if($("#ZAxisDisplay").is(':checked')){
      localStorage.setItem('ZaxisDRO', "true")
      $("#zPosSetZ").show();
      $("#zPosDro").show();
      $("#zPosGT").show();
      $("#zP").show();
      $("#zM").show();
     }else{
      localStorage.setItem('ZaxisDRO', "false")
      $("#zPosSetZ").hide();
      $("#zPosDro").hide();
      $("#zPosGT").hide();
      $("#zP").hide();
      $("#zM").hide();
     }

    if($("#AAxisDisplay").is(':checked')){
      localStorage.setItem('AaxisDRO', "true")
      $("#aPosSetZ").show();
      $("#aPosDro").show();
      $("#aPosGT").show();
      $("#aP").show();
      $("#aM").show();
     }else{
      localStorage.setItem('AaxisDRO', "false")
      $("#aPosSetZ").hide();
      $("#aPosDro").hide();
      $("#aPosGT").hide();
      $("#aP").hide();
      $("#aM").hide();
     }

}