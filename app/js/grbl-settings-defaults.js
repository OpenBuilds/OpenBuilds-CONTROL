var lastSelectedMachine = '';
var allowGrblSettingsViewScroll = true;

function fixGrblHALSettings(j) {
  if (laststatus.machine.firmware.platform == "grblHAL") { //  Workaround for HAL profiles required changes, without creating entirely new profiles for GrblHAL
    if (j == "10") {
      // Status Report Format
      $("#val-" + j + "-input").val(511)
    }
    if (j == "5") {
      // Fix NC vs NO switches
      $("#val-" + j + "-input").val(7)
    }
    if (j == "6") {
      // Fix Probe Inversion
      $("#val-" + j + "-input").val(1)
    }

    if (j == "4") {
      // Fix Enable Invert
      $("#val-" + j + "-input").val(0)
    }
  }
}

function selectMachine(type) {
  if (type == "sphinx55") {
    // Sphinx 55 - COMPLETE with homing switches
    var customFirmware = false;
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //"Step idle delay, milliseconds"
      $2: "0", //"Step pulse invert, mask"
      $3: "3", //"Step direction invert, mask"
      $4: "1", //"Invert step enable pin, boolean"
      $5: "0", //"Invert limit pins, boolean"
      $6: "0", //"Invert probe pin, boolean"
      $10: "1", //"Status report options, mask"
      $11: "0.010", //"Junction deviation, millimeters"
      $12: "0.002", //"Arc tolerance, millimeters"
      $13: "0", //"Report in inches, boolean"
      $20: "0", //"Soft limits enable, boolean"
      $21: "0", //"Hard limits enable, boolean"
      $22: "0", //"Homing cycle enable, boolean"
      $23: "3", //"Homing direction invert, mask"
      $24: "100.000", //"Homing locate feed rate, mm/min"
      $25: "1000.000", //"Homing search seek rate, mm/min"
      $26: "250", //"Homing switch debounce delay, milliseconds"
      $27: "5.000", //"Homing switch pull-off distance, millimeters"
      $30: "1000", //"Maximum spindle speed, RPM"
      $31: "0", //"Minimum spindle speed, RPM"
      $32: "0", //"Laser mode"
      $100: "199.100", //"X-axis steps per millimeter"
      $101: "199.100", //"Y-axis steps per millimeter"
      $102: "199.100", //"Z-axis steps per millimeter"
      $110: "2500.000", //"X-axis maximum rate, mm/min"
      $111: "2500.000", //"Y-axis maximum rate, mm/min"
      $112: "2500.000", //"Z-axis maximum rate, mm/min"
      $120: "150.000", //"X-axis acceleration, mm/sec^2"
      $121: "150.000", //"Y-axis acceleration, mm/sec^2"
      $122: "150.000", //"Z-axis acceleration, mm/sec^2"
      $130: "333.000", //"X-axis maximum travel, millimeters"
      $131: "325.000", //"Y-axis maximum travel, millimeters"
      $132: "85.000", //"Z-axis maximum travel, millimeters"
    }
  } else if (type == "sphinx1050") {
    // Sphinx 1050
    var customFirmware = false;
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //"Step idle delay, milliseconds"
      $2: "0", //"Step pulse invert, mask"
      $3: "3", //"Step direction invert, mask"
      $4: "1", //"Invert step enable pin, boolean"
      $5: "0", //"Invert limit pins, boolean"
      $6: "0", //"Invert probe pin, boolean"
      $10: "1", //"Status report options, mask"
      $11: "0.010", //"Junction deviation, millimeters"
      $12: "0.002", //"Arc tolerance, millimeters"
      $13: "0", //"Report in inches, boolean"
      $20: "0", //"Soft limits enable, boolean"
      $21: "0", //"Hard limits enable, boolean"
      $22: "0", //"Homing cycle enable, boolean"
      $23: "3", //"Homing direction invert, mask"
      $24: "100.000", //"Homing locate feed rate, mm/min"
      $25: "1000.000", //"Homing search seek rate, mm/min"
      $26: "250", //"Homing switch debounce delay, milliseconds"
      $27: "5.000", //"Homing switch pull-off distance, millimeters"
      $30: "1000", //"Maximum spindle speed, RPM"
      $31: "0", //"Minimum spindle speed, RPM"
      $32: "0", //"Laser mode"
      $100: "199.100", //"X-axis steps per millimeter"
      $101: "199.100", //"Y-axis steps per millimeter"
      $102: "199.100", //"Z-axis steps per millimeter"
      $110: "2500.000", //"X-axis maximum rate, mm/min"
      $111: "2500.000", //"Y-axis maximum rate, mm/min"
      $112: "2500.000", //"Z-axis maximum rate, mm/min"
      $120: "150.000", //"X-axis acceleration, mm/sec^2"
      $121: "150.000", //"Y-axis acceleration, mm/sec^2"
      $122: "150.000", //"Z-axis acceleration, mm/sec^2"
      $130: "833.5", //"X-axis maximum travel, millimeters"
      $131: "325", //"Y-axis maximum travel, millimeters"
      $132: "85", //"Z-axis maximum travel, millimeters"
    }
  } else if (type == "workbee1050") {
    //Workbee 1050 COMPLETE with homing switches
    var customFirmware = false;
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //"Step idle delay, milliseconds"
      $2: "0", //"Step pulse invert, mask"
      $3: "3", //"Step direction invert, mask"
      $4: "1", //"Invert step enable pin, boolean"
      $5: "0", //"Invert limit pins, boolean"
      $6: "0", //"Invert probe pin, boolean"
      $10: "1", //"Status report options, mask"
      $11: "0.010", //"Junction deviation, millimeters"
      $12: "0.002", //"Arc tolerance, millimeters"
      $13: "0", //"Report in inches, boolean"
      $20: "0", //"Soft limits enable, boolean"
      $21: "0", //"Hard limits enable, boolean"
      $22: "0", //"Homing cycle enable, boolean"
      $23: "3", //"Homing direction invert, mask"
      $24: "100.000", //"Homing locate feed rate, mm/min"
      $25: "1000.000", //"Homing search seek rate, mm/min"
      $26: "250", //"Homing switch debounce delay, milliseconds"
      $27: "5.000", //"Homing switch pull-off distance, millimeters"
      $30: "1000", //"Maximum spindle speed, RPM"
      $31: "0", //"Minimum spindle speed, RPM"
      $32: "0", //"Laser mode"
      $100: "199.100", //"X-axis steps per millimeter"
      $101: "199.100", //"Y-axis steps per millimeter"
      $102: "199.100", //"Z-axis steps per millimeter"
      $110: "2500.000", //"X-axis maximum rate, mm/min"
      $111: "2500.000", //"Y-axis maximum rate, mm/min"
      $112: "2500.000", //"Z-axis maximum rate, mm/min"
      $120: "150.000", //"X-axis acceleration, mm/sec^2"
      $121: "150.000", //"Y-axis acceleration, mm/sec^2"
      $122: "150.000", //"Z-axis acceleration, mm/sec^2"
      $130: "317.000", //"X-axis maximum travel, millimeters"
      $131: "762.000", //"Y-axis maximum travel, millimeters"
      $132: "122.000", //"Z-axis maximum travel, millimeters"
    }
  } else if (type == "workbee1010") {
    // Workbee 1010
    var customFirmware = false;
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //"Step idle delay, milliseconds"
      $2: "0", //"Step pulse invert, mask"
      $3: "3", //"Step direction invert, mask"
      $4: "1", //"Invert step enable pin, boolean"
      $5: "0", //"Invert limit pins, boolean"
      $6: "0", //"Invert probe pin, boolean"
      $10: "1", //"Status report options, mask"
      $11: "0.010", //"Junction deviation, millimeters"
      $12: "0.002", //"Arc tolerance, millimeters"
      $13: "0", //"Report in inches, boolean"
      $20: "0", //"Soft limits enable, boolean"
      $21: "0", //"Hard limits enable, boolean"
      $22: "0", //"Homing cycle enable, boolean"
      $23: "3", //"Homing direction invert, mask"
      $24: "100.000", //"Homing locate feed rate, mm/min"
      $25: "1000.000", //"Homing search seek rate, mm/min"
      $26: "250", //"Homing switch debounce delay, milliseconds"
      $27: "5.000", //"Homing switch pull-off distance, millimeters"
      $30: "1000", //"Maximum spindle speed, RPM"
      $31: "0", //"Minimum spindle speed, RPM"
      $32: "0", //"Laser mode"
      $100: "199.100", //"X-axis steps per millimeter"
      $101: "199.100", //"Y-axis steps per millimeter"
      $102: "199.100", //"Z-axis steps per millimeter"
      $110: "2500.000", //"X-axis maximum rate, mm/min"
      $111: "2500.000", //"Y-axis maximum rate, mm/min"
      $112: "2500.000", //"Z-axis maximum rate, mm/min"
      $120: "150.000", //"X-axis acceleration, mm/sec^2"
      $121: "150.000", //"Y-axis acceleration, mm/sec^2"
      $122: "150.000", //"Z-axis acceleration, mm/sec^2"
      $130: "824.000", //"X-axis maximum travel, millimeters"
      $131: "780.000", //"Y-axis maximum travel, millimeters"
      $132: "122.000", //"Z-axis maximum travel, millimeters"
    }
  } else if (type == "workbee1510") {
    // Workbee1510
    var customFirmware = false;
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //"Step idle delay, milliseconds"
      $2: "0", //"Step pulse invert, mask"
      $3: "1", //"Step direction invert, mask"
      $4: "1", //"Invert step enable pin, boolean"
      $5: "0", //"Invert limit pins, boolean"
      $6: "0", //"Invert probe pin, boolean"
      $10: "1", //"Status report options, mask"
      $11: "0.010", //"Junction deviation, millimeters"
      $12: "0.002", //"Arc tolerance, millimeters"
      $13: "0", //"Report in inches, boolean"
      $20: "0", //"Soft limits enable, boolean"
      $21: "0", //"Hard limits enable, boolean"
      $22: "0", //"Homing cycle enable, boolean"
      $23: "3", //"Homing direction invert, mask"
      $24: "100.000", //"Homing locate feed rate, mm/min"
      $25: "1000.000", //"Homing search seek rate, mm/min"
      $26: "250", //"Homing switch debounce delay, milliseconds"
      $27: "5.000", //"Homing switch pull-off distance, millimeters"
      $30: "1000", //"Maximum spindle speed, RPM"
      $31: "0", //"Minimum spindle speed, RPM"
      $32: "0", //"Laser mode"
      $100: "26.667", //"X-axis steps per millimeter"
      $101: "26.667", //"Y-axis steps per millimeter"
      $102: "199.100", //"Z-axis steps per millimeter"
      $110: "10000.000", //"X-axis maximum rate, mm/min"
      $111: "10000.000", //"Y-axis maximum rate, mm/min"
      $112: "2500.000", //"Z-axis maximum rate, mm/min"
      $120: "150.000", //"X-axis acceleration, mm/sec^2"
      $121: "150.000", //"Y-axis acceleration, mm/sec^2"
      $122: "150.000", //"Z-axis acceleration, mm/sec^2"
      $130: "824.000", //"X-axis maximum travel, millimeters"
      $131: "1280.000", //"Y-axis maximum travel, millimeters"
      $132: "122.000", //"Z-axis maximum travel, millimeters"
    }
  } else if (type == "acro55") {
    // Acro 55
    var customFirmware = 'acro';
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //Step idle delay, milliseconds
      $2: "0", //Step pulse invert, mask
      $3: "1", //Step direction invert, mask
      $4: "1", //Invert step enable pin, boolean
      $5: "0", //Invert limit pins, boolean
      $6: "0", //Invert probe pin, boolean
      $10: "1", //Status report options, mask
      $11: "0.010", //Junction deviation, millimeters
      $12: "0.002", //Arc tolerance, millimeters
      $13: "0", //Report in inches, boolean
      $20: "0", //Soft limits enable, boolean
      $21: "0", //Hard limits enable, boolean
      $22: "0", //Homing cycle enable, boolean
      $23: "7", //Homing direction invert, mask
      $24: "100.000", //Homing locate feed rate, mm/min
      $25: "1000.000", //Homing search seek rate, mm/min
      $26: "250", //Homing switch debounce delay, milliseconds
      $27: "5.000", //Homing switch pull-off distance, millimeters
      $30: "1000", //Maximum spindle speed, RPM
      $31: "0", //Minimum spindle speed, RPM
      $32: "1", //Laser-mode enable, boolean
      $100: "57.143", //X-axis steps per millimeter-1/16 step
      $101: "57.143", //Y-axis steps per millimeter-1/16 step
      $102: "57.143", //Z-axis steps per millimeter-1/16 step
      $110: "5000.000", //X-axis maximum rate, mm/min
      $111: "5000.000", //Y-axis maximum rate, mm/min
      $112: "5000.000", //Z-axis maximum rate, mm/min
      $120: "500.000", //X-axis acceleration, mm/sec^2
      $121: "500.000", //Y-axis acceleration, mm/sec^2
      $122: "500.000", //Z-axis acceleration, mm/sec^2
      $130: "300.000", //X-axis maximum travel, millimeters
      $131: "300.000", //Y-axis maximum travel, millimeters
      $132: "70.000", //Z-axis maximum travel, millimeters
    }
  } else if (type == "acro510") {
    // Acro 510
    var customFirmware = 'acro';
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //Step idle delay, milliseconds
      $2: "0", //Step pulse invert, mask
      $3: "1", //Step direction invert, mask
      $4: "1", //Invert step enable pin, boolean
      $5: "0", //Invert limit pins, boolean
      $6: "0", //Invert probe pin, boolean
      $10: "1", //Status report options, mask
      $11: "0.010", //Junction deviation, millimeters
      $12: "0.002", //Arc tolerance, millimeters
      $13: "0", //Report in inches, boolean
      $20: "0", //Soft limits enable, boolean
      $21: "0", //Hard limits enable, boolean
      $22: "0", //Homing cycle enable, boolean
      $23: "7", //Homing direction invert, mask
      $24: "100.000", //Homing locate feed rate, mm/min
      $25: "1000.000", //Homing search seek rate, mm/min
      $26: "250", //Homing switch debounce delay, milliseconds
      $27: "5.000", //Homing switch pull-off distance, millimeters
      $30: "1000", //Maximum spindle speed, RPM
      $31: "0", //Minimum spindle speed, RPM
      $32: "1", //Laser-mode enable, boolean
      $100: "57.143", //X-axis steps per millimeter-1/16 step
      $101: "57.143", //Y-axis steps per millimeter-1/16 step
      $102: "57.143", //Z-axis steps per millimeter-1/16 step
      $110: "5000.000", //X-axis maximum rate, mm/min
      $111: "5000.000", //Y-axis maximum rate, mm/min
      $112: "5000.000", //Z-axis maximum rate, mm/min
      $120: "500.000", //X-axis acceleration, mm/sec^2
      $121: "500.000", //Y-axis acceleration, mm/sec^2
      $122: "500.000", //Z-axis acceleration, mm/sec^2
      $130: "800.000", //X-axis maximum travel, millimeters
      $131: "300.000", //Y-axis maximum travel, millimeters
      $132: "70.000", //Z-axis maximum travel, millimeters
    }
  } else if (type == "acro1010") {
    // Acro 1010
    var customFirmware = 'acro';
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //Step idle delay, milliseconds
      $2: "0", //Step pulse invert, mask
      $3: "1", //Step direction invert, mask
      $4: "1", //Invert step enable pin, boolean
      $5: "0", //Invert limit pins, boolean
      $6: "0", //Invert probe pin, boolean
      $10: "1", //Status report options, mask
      $11: "0.010", //Junction deviation, millimeters
      $12: "0.002", //Arc tolerance, millimeters
      $13: "0", //Report in inches, boolean
      $20: "0", //Soft limits enable, boolean
      $21: "0", //Hard limits enable, boolean
      $22: "0", //Homing cycle enable, boolean
      $23: "7", //Homing direction invert, mask
      $24: "100.000", //Homing locate feed rate, mm/min
      $25: "1000.000", //Homing search seek rate, mm/min
      $26: "250", //Homing switch debounce delay, milliseconds
      $27: "5.000", //Homing switch pull-off distance, millimeters
      $30: "1000", //Maximum spindle speed, RPM
      $31: "0", //Minimum spindle speed, RPM
      $32: "1", //Laser-mode enable, boolean
      $100: "57.143", //X-axis steps per millimeter-1/16 step
      $101: "57.143", //Y-axis steps per millimeter-1/16 step
      $102: "57.143", //Z-axis steps per millimeter-1/16 step
      $110: "5000.000", //X-axis maximum rate, mm/min
      $111: "5000.000", //Y-axis maximum rate, mm/min
      $112: "5000.000", //Z-axis maximum rate, mm/min
      $120: "500.000", //X-axis acceleration, mm/sec^2
      $121: "500.000", //Y-axis acceleration, mm/sec^2
      $122: "500.000", //Z-axis acceleration, mm/sec^2
      $130: "800.000", //X-axis maximum travel, millimeters
      $131: "800.000", //Y-axis maximum travel, millimeters
      $132: "70.000", //Z-axis maximum travel, millimeters
    }
  } else if (type == "acro1510") {
    // Acro 1510
    var customFirmware = 'acro';
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //Step idle delay, milliseconds
      $2: "0", //Step pulse invert, mask
      $3: "1", //Step direction invert, mask
      $4: "1", //Invert step enable pin, boolean
      $5: "0", //Invert limit pins, boolean
      $6: "0", //Invert probe pin, boolean
      $10: "1", //Status report options, mask
      $11: "0.010", //Junction deviation, millimeters
      $12: "0.002", //Arc tolerance, millimeters
      $13: "0", //Report in inches, boolean
      $20: "0", //Soft limits enable, boolean
      $21: "0", //Hard limits enable, boolean
      $22: "0", //Homing cycle enable, boolean
      $23: "7", //Homing direction invert, mask
      $24: "100.000", //Homing locate feed rate, mm/min
      $25: "1000.000", //Homing search seek rate, mm/min
      $26: "250", //Homing switch debounce delay, milliseconds
      $27: "5.000", //Homing switch pull-off distance, millimeters
      $30: "1000", //Maximum spindle speed, RPM
      $31: "0", //Minimum spindle speed, RPM
      $32: "1", //Laser-mode enable, boolean
      $100: "57.143", //X-axis steps per millimeter-1/16 step
      $101: "57.143", //Y-axis steps per millimeter-1/16 step
      $102: "57.143", //Z-axis steps per millimeter-1/16 step
      $110: "5000.000", //X-axis maximum rate, mm/min
      $111: "5000.000", //Y-axis maximum rate, mm/min
      $112: "5000.000", //Z-axis maximum rate, mm/min
      $120: "500.000", //X-axis acceleration, mm/sec^2
      $121: "500.000", //Y-axis acceleration, mm/sec^2
      $122: "500.000", //Z-axis acceleration, mm/sec^2
      $130: "800.000", //X-axis maximum travel, millimeters
      $131: "1300.000", //Y-axis maximum travel, millimeters
      $132: "70.000", //Z-axis maximum travel, millimeters
    }
  } else if (type == "acro1515") {
    // Acro 1515
    var customFirmware = 'acro';
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //Step idle delay, milliseconds
      $2: "0", //Step pulse invert, mask
      $3: "1", //Step direction invert, mask
      $4: "1", //Invert step enable pin, boolean
      $5: "0", //Invert limit pins, boolean
      $6: "0", //Invert probe pin, boolean
      $10: "1", //Status report options, mask
      $11: "0.010", //Junction deviation, millimeters
      $12: "0.002", //Arc tolerance, millimeters
      $13: "0", //Report in inches, boolean
      $20: "0", //Soft limits enable, boolean
      $21: "0", //Hard limits enable, boolean
      $22: "0", //Homing cycle enable, boolean
      $23: "7", //Homing direction invert, mask
      $24: "100.000", //Homing locate feed rate, mm/min
      $25: "1000.000", //Homing search seek rate, mm/min
      $26: "250", //Homing switch debounce delay, milliseconds
      $27: "5.000", //Homing switch pull-off distance, millimeters
      $30: "1000", //Maximum spindle speed, RPM
      $31: "0", //Minimum spindle speed, RPM
      $32: "1", //Laser-mode enable, boolean
      $100: "57.143", //X-axis steps per millimeter-1/16 step
      $101: "57.143", //Y-axis steps per millimeter-1/16 step
      $102: "57.143", //Z-axis steps per millimeter-1/16 step
      $110: "5000.000", //X-axis maximum rate, mm/min
      $111: "5000.000", //Y-axis maximum rate, mm/min
      $112: "5000.000", //Z-axis maximum rate, mm/min
      $120: "500.000", //X-axis acceleration, mm/sec^2
      $121: "500.000", //Y-axis acceleration, mm/sec^2
      $122: "500.000", //Z-axis acceleration, mm/sec^2
      $130: "1300.000", //X-axis maximum travel, millimeters
      $131: "1300.000", //Y-axis maximum travel, millimeters
      $132: "70.000", //Z-axis maximum travel, millimeters
    }
  } else if (type == "acro55pen") {
    // Acro 55
    var customFirmware = 'acropen';
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //Step idle delay, milliseconds
      $2: "0", //Step pulse invert, mask
      $3: "1", //Step direction invert, mask
      $4: "1", //Invert step enable pin, boolean
      $5: "0", //Invert limit pins, boolean
      $6: "0", //Invert probe pin, boolean
      $10: "1", //Status report options, mask
      $11: "0.010", //Junction deviation, millimeters
      $12: "0.002", //Arc tolerance, millimeters
      $13: "0", //Report in inches, boolean
      $20: "0", //Soft limits enable, boolean
      $21: "0", //Hard limits enable, boolean
      $22: "0", //Homing cycle enable, boolean
      $23: "7", //Homing direction invert, mask
      $24: "100.000", //Homing locate feed rate, mm/min
      $25: "1000.000", //Homing search seek rate, mm/min
      $26: "250", //Homing switch debounce delay, milliseconds
      $27: "5.000", //Homing switch pull-off distance, millimeters
      $30: "255", //Maximum spindle speed, RPM
      $31: "0", //Minimum spindle speed, RPM
      $32: "0", //Laser-mode enable, boolean
      $100: "57.143", //X-axis steps per millimeter-1/16 step
      $101: "57.143", //Y-axis steps per millimeter-1/16 step
      $102: "57.143", //Z-axis steps per millimeter-1/16 step
      $110: "5000.000", //X-axis maximum rate, mm/min
      $111: "5000.000", //Y-axis maximum rate, mm/min
      $112: "5000.000", //Z-axis maximum rate, mm/min
      $120: "500.000", //X-axis acceleration, mm/sec^2
      $121: "500.000", //Y-axis acceleration, mm/sec^2
      $122: "500.000", //Z-axis acceleration, mm/sec^2
      $130: "300.000", //X-axis maximum travel, millimeters
      $131: "300.000", //Y-axis maximum travel, millimeters
      $132: "70.000", //Z-axis maximum travel, millimeters
    }
  } else if (type == "acro510pen") {
    // Acro 510
    var customFirmware = 'acropen';
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //Step idle delay, milliseconds
      $2: "0", //Step pulse invert, mask
      $3: "1", //Step direction invert, mask
      $4: "1", //Invert step enable pin, boolean
      $5: "0", //Invert limit pins, boolean
      $6: "0", //Invert probe pin, boolean
      $10: "1", //Status report options, mask
      $11: "0.010", //Junction deviation, millimeters
      $12: "0.002", //Arc tolerance, millimeters
      $13: "0", //Report in inches, boolean
      $20: "0", //Soft limits enable, boolean
      $21: "0", //Hard limits enable, boolean
      $22: "0", //Homing cycle enable, boolean
      $23: "7", //Homing direction invert, mask
      $24: "100.000", //Homing locate feed rate, mm/min
      $25: "1000.000", //Homing search seek rate, mm/min
      $26: "250", //Homing switch debounce delay, milliseconds
      $27: "5.000", //Homing switch pull-off distance, millimeters
      $30: "255", //Maximum spindle speed, RPM
      $31: "0", //Minimum spindle speed, RPM
      $32: "0", //Laser-mode enable, boolean
      $100: "57.143", //X-axis steps per millimeter-1/16 step
      $101: "57.143", //Y-axis steps per millimeter-1/16 step
      $102: "57.143", //Z-axis steps per millimeter-1/16 step
      $110: "5000.000", //X-axis maximum rate, mm/min
      $111: "5000.000", //Y-axis maximum rate, mm/min
      $112: "5000.000", //Z-axis maximum rate, mm/min
      $120: "500.000", //X-axis acceleration, mm/sec^2
      $121: "500.000", //Y-axis acceleration, mm/sec^2
      $122: "500.000", //Z-axis acceleration, mm/sec^2
      $130: "800.000", //X-axis maximum travel, millimeters
      $131: "300.000", //Y-axis maximum travel, millimeters
      $132: "70.000", //Z-axis maximum travel, millimeters
    }
  } else if (type == "acro1010pen") {
    // Acro 1010
    var customFirmware = 'acropen';
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //Step idle delay, milliseconds
      $2: "0", //Step pulse invert, mask
      $3: "1", //Step direction invert, mask
      $4: "1", //Invert step enable pin, boolean
      $5: "0", //Invert limit pins, boolean
      $6: "0", //Invert probe pin, boolean
      $10: "1", //Status report options, mask
      $11: "0.010", //Junction deviation, millimeters
      $12: "0.002", //Arc tolerance, millimeters
      $13: "0", //Report in inches, boolean
      $20: "0", //Soft limits enable, boolean
      $21: "0", //Hard limits enable, boolean
      $22: "0", //Homing cycle enable, boolean
      $23: "7", //Homing direction invert, mask
      $24: "100.000", //Homing locate feed rate, mm/min
      $25: "1000.000", //Homing search seek rate, mm/min
      $26: "250", //Homing switch debounce delay, milliseconds
      $27: "5.000", //Homing switch pull-off distance, millimeters
      $30: "255", //Maximum spindle speed, RPM
      $31: "0", //Minimum spindle speed, RPM
      $32: "0", //Laser-mode enable, boolean
      $100: "57.143", //X-axis steps per millimeter-1/16 step
      $101: "57.143", //Y-axis steps per millimeter-1/16 step
      $102: "57.143", //Z-axis steps per millimeter-1/16 step
      $110: "5000.000", //X-axis maximum rate, mm/min
      $111: "5000.000", //Y-axis maximum rate, mm/min
      $112: "5000.000", //Z-axis maximum rate, mm/min
      $120: "500.000", //X-axis acceleration, mm/sec^2
      $121: "500.000", //Y-axis acceleration, mm/sec^2
      $122: "500.000", //Z-axis acceleration, mm/sec^2
      $130: "800.000", //X-axis maximum travel, millimeters
      $131: "800.000", //Y-axis maximum travel, millimeters
      $132: "70.000", //Z-axis maximum travel, millimeters
    }
  } else if (type == "acro1510pen") {
    // Acro 1510
    var customFirmware = 'acropen';
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //Step idle delay, milliseconds
      $2: "0", //Step pulse invert, mask
      $3: "1", //Step direction invert, mask
      $4: "1", //Invert step enable pin, boolean
      $5: "0", //Invert limit pins, boolean
      $6: "0", //Invert probe pin, boolean
      $10: "1", //Status report options, mask
      $11: "0.010", //Junction deviation, millimeters
      $12: "0.002", //Arc tolerance, millimeters
      $13: "0", //Report in inches, boolean
      $20: "0", //Soft limits enable, boolean
      $21: "0", //Hard limits enable, boolean
      $22: "0", //Homing cycle enable, boolean
      $23: "7", //Homing direction invert, mask
      $24: "100.000", //Homing locate feed rate, mm/min
      $25: "1000.000", //Homing search seek rate, mm/min
      $26: "250", //Homing switch debounce delay, milliseconds
      $27: "5.000", //Homing switch pull-off distance, millimeters
      $30: "255", //Maximum spindle speed, RPM
      $31: "0", //Minimum spindle speed, RPM
      $32: "0", //Laser-mode enable, boolean
      $100: "57.143", //X-axis steps per millimeter-1/16 step
      $101: "57.143", //Y-axis steps per millimeter-1/16 step
      $102: "57.143", //Z-axis steps per millimeter-1/16 step
      $110: "5000.000", //X-axis maximum rate, mm/min
      $111: "5000.000", //Y-axis maximum rate, mm/min
      $112: "5000.000", //Z-axis maximum rate, mm/min
      $120: "500.000", //X-axis acceleration, mm/sec^2
      $121: "500.000", //Y-axis acceleration, mm/sec^2
      $122: "500.000", //Z-axis acceleration, mm/sec^2
      $130: "800.000", //X-axis maximum travel, millimeters
      $131: "1300.000", //Y-axis maximum travel, millimeters
      $132: "70.000", //Z-axis maximum travel, millimeters
    }
  } else if (type == "acro1515pen") {
    // Acro 1515
    var customFirmware = 'acropen';
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //Step idle delay, milliseconds
      $2: "0", //Step pulse invert, mask
      $3: "1", //Step direction invert, mask
      $4: "1", //Invert step enable pin, boolean
      $5: "0", //Invert limit pins, boolean
      $6: "0", //Invert probe pin, boolean
      $10: "1", //Status report options, mask
      $11: "0.010", //Junction deviation, millimeters
      $12: "0.002", //Arc tolerance, millimeters
      $13: "0", //Report in inches, boolean
      $20: "0", //Soft limits enable, boolean
      $21: "0", //Hard limits enable, boolean
      $22: "0", //Homing cycle enable, boolean
      $23: "7", //Homing direction invert, mask
      $24: "100.000", //Homing locate feed rate, mm/min
      $25: "1000.000", //Homing search seek rate, mm/min
      $26: "250", //Homing switch debounce delay, milliseconds
      $27: "5.000", //Homing switch pull-off distance, millimeters
      $30: "255", //Maximum spindle speed, RPM
      $31: "0", //Minimum spindle speed, RPM
      $32: "0", //Laser-mode enable, boolean
      $100: "57.143", //X-axis steps per millimeter-1/16 step
      $101: "57.143", //Y-axis steps per millimeter-1/16 step
      $102: "57.143", //Z-axis steps per millimeter-1/16 step
      $110: "5000.000", //X-axis maximum rate, mm/min
      $111: "5000.000", //Y-axis maximum rate, mm/min
      $112: "5000.000", //Z-axis maximum rate, mm/min
      $120: "500.000", //X-axis acceleration, mm/sec^2
      $121: "500.000", //Y-axis acceleration, mm/sec^2
      $122: "500.000", //Z-axis acceleration, mm/sec^2
      $130: "1300.000", //X-axis maximum travel, millimeters
      $131: "1300.000", //Y-axis maximum travel, millimeters
      $132: "70.000", //Z-axis maximum travel, millimeters
    }
  } else if (type == "minimill") {
    // minimill
    var customFirmware = false;
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //"Step idle delay, milliseconds"
      $2: "0", //"Step pulse invert, mask"
      $3: "3", //"Step direction invert, mask"
      $4: "1", //"Invert step enable pin, boolean"
      $5: "0", //"Invert limit pins, boolean"
      $6: "0", //"Invert probe pin, boolean"
      $10: "2", //"Status report options, mask"
      $11: "0.010", //"Junction deviation, millimeters"
      $12: "0.002", //"Arc tolerance, millimeters"
      $13: "0", //"Report in inches, boolean"
      $20: "0", //"Soft limits enable, boolean"
      $21: "0", //"Hard limits enable, boolean"
      $22: "0", //"Homing cycle enable, boolean"
      $23: "1", //"Homing direction invert, mask"
      $24: "100.000", //"Homing locate feed rate, mm/min"
      $25: "500.000", //"Homing search seek rate, mm/min"
      $26: "250", //"Homing switch debounce delay, milliseconds"
      $27: "5.000", //"Homing switch pull-off distance, millimeters"
      $30: "1000", //"Maximum spindle speed, RPM"
      $31: "0", //"Minimum spindle speed, RPM"
      $32: "0", //"Laser mode"
      $100: "199.100", //"X-axis steps per millimeter"
      $101: "199.100", //"Y-axis steps per millimeter"
      $102: "199.100", //"Z-axis steps per millimeter"
      $110: "1500.000", //"X-axis maximum rate, mm/min"
      $111: "1500.000", //"Y-axis maximum rate, mm/min"
      $112: "1500.000", //"Z-axis maximum rate, mm/min"
      $120: "50.000", //"X-axis acceleration, mm/sec^2"
      $121: "50.000", //"Y-axis acceleration, mm/sec^2"
      $122: "50.000", //"Z-axis acceleration, mm/sec^2"
      $130: "120.000", //"X-axis maximum travel, millimeters"
      $131: "120.000", //"Y-axis maximum travel, millimeters"
      $132: "60.000", //"Z-axis maximum travel, millimeters"
    }
  } else if (type == "cbeam") {
    // C-Beam Machine
    var customFirmware = false;
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //"Step idle delay, milliseconds"
      $2: "0", //"Step pulse invert, mask"
      $3: "5", //"Step direction invert, mask"
      $4: "1", //"Invert step enable pin, boolean"
      $5: "0", //"Invert limit pins, boolean"
      $6: "0", //"Invert probe pin, boolean"
      $10: "2", //"Status report options, mask"
      $11: "0.010", //"Junction deviation, millimeters"
      $12: "0.002", //"Arc tolerance, millimeters"
      $13: "0", //"Report in inches, boolean"
      $20: "0", //"Soft limits enable, boolean"
      $21: "0", //"Hard limits enable, boolean"
      $22: "0", //"Homing cycle enable, boolean"
      $23: "1", //"Homing direction invert, mask"
      $24: "2000.000", //"Homing locate feed rate, mm/min"
      $25: "1000.000", //"Homing search seek rate, mm/min"
      $26: "250", //"Homing switch debounce delay, milliseconds"
      $27: "5.000", //"Homing switch pull-off distance, millimeters"
      $30: "1000", //"Maximum spindle speed, RPM"
      $31: "0", //"Minimum spindle speed, RPM"
      $32: "0", //"Laser mode"
      $100: "199.100", //"X-axis steps per millimeter"
      $101: "199.100", //"Y-axis steps per millimeter"
      $102: "199.100", //"Z-axis steps per millimeter"
      $110: "1000.000", //"X-axis maximum rate, mm/min"
      $111: "1000.000", //"Y-axis maximum rate, mm/min"
      $112: "1000.000", //"Z-axis maximum rate, mm/min"
      $120: "100.000", //"X-axis acceleration, mm/sec^2"
      $121: "100.000", //"Y-axis acceleration, mm/sec^2"
      $122: "100.000", //"Z-axis acceleration, mm/sec^2"
      $130: "270.000", //"X-axis maximum travel, millimeters"
      $131: "270.000", //"Y-axis maximum travel, millimeters"
      $132: "80.000", //"Z-axis maximum travel, millimeters"
    }
  } else if (type == "cbeamxl") {
    // C-Beam XL:
    var customFirmware = false;
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //"Step idle delay, milliseconds"
      $2: "0", //"Step pulse invert, mask"
      $3: "6", //"Step direction invert, mask"
      $4: "1", //"Invert step enable pin, boolean"
      $5: "0", //"Invert limit pins, boolean"
      $6: "0", //"Invert probe pin, boolean"
      $10: "2", //"Status report options, mask"
      $11: "0.010", //"Junction deviation, millimeters"
      $12: "0.002", //"Arc tolerance, millimeters"
      $13: "0", //"Report in inches, boolean"
      $20: "0", //"Soft limits enable, boolean"
      $21: "0", //"Hard limits enable, boolean"
      $22: "0", //"Homing cycle enable, boolean"
      $23: "0", //"Homing direction invert, mask"
      $24: "2000.000", //"Homing locate feed rate, mm/min"
      $25: "1000.000", //"Homing search seek rate, mm/min"
      $26: "250", //"Homing switch debounce delay, milliseconds"
      $27: "5.000", //"Homing switch pull-off distance, millimeters"
      $30: "1000", //"Maximum spindle speed, RPM"
      $31: "0", //"Minimum spindle speed, RPM"
      $32: "0", //"Laser mode"
      $100: "199.100", //"X-axis steps per millimeter"
      $101: "199.100", //"Y-axis steps per millimeter"
      $102: "199.100", //"Z-axis steps per millimeter"
      $110: "1000.000", //"X-axis maximum rate, mm/min"
      $111: "1000.000", //"Y-axis maximum rate, mm/min"
      $112: "1000.000", //"Z-axis maximum rate, mm/min"
      $120: "100.000", //"X-axis acceleration, mm/sec^2"
      $121: "100.000", //"Y-axis acceleration, mm/sec^2"
      $122: "100.000", //"Z-axis acceleration, mm/sec^2"
      $130: "200.000", //"X-axis maximum travel, millimeters"
      $131: "200.000", //"Y-axis maximum travel, millimeters"
      $132: "200.000", //"Z-axis maximum travel, millimeters"
    }
  } else if (type == "leadmachine1010") {
    // Leadmachine 1010
    var customFirmware = false;
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //"Step idle delay, milliseconds"
      $2: "0", //"Step pulse invert, mask"
      $3: "4", //"Step direction invert, mask"
      $4: "1", //"Invert step enable pin, boolean"
      $5: "0", //"Invert limit pins, boolean"
      $6: "0", //"Invert probe pin, boolean"
      $10: "1", //"Status report options, mask"
      $11: "0.010", //"Junction deviation, millimeters"
      $12: "0.002", //"Arc tolerance, millimeters"
      $13: "0", //"Report in inches, boolean"
      $20: "0", //"Soft limits enable, boolean"
      $21: "0", //"Hard limits enable, boolean"
      $22: "0", //"Homing cycle enable, boolean"
      $23: "3", //"Homing direction invert, mask"
      $24: "100.000", //"Homing locate feed rate, mm/min"
      $25: "1000.000", //"Homing search seek rate, mm/min"
      $26: "250", //"Homing switch debounce delay, milliseconds"
      $27: "5.000", //"Homing switch pull-off distance, millimeters"
      $30: "1000", //"Maximum spindle speed, RPM"
      $31: "0", //"Minimum spindle speed, RPM"
      $32: "0", //"Laser mode"
      $100: "199.100", //"X-axis steps per millimeter"
      $101: "199.100", //"Y-axis steps per millimeter"
      $102: "199.100", //"Z-axis steps per millimeter"
      $110: "2500.000", //"X-axis maximum rate, mm/min"
      $111: "2500.000", //"Y-axis maximum rate, mm/min"
      $112: "2500.000", //"Z-axis maximum rate, mm/min"
      $120: "150.000", //"X-axis acceleration, mm/sec^2"
      $121: "150.000", //"Y-axis acceleration, mm/sec^2"
      $122: "150.000", //"Z-axis acceleration, mm/sec^2"
      $130: "810", //"X-axis maximum travel, millimeters"
      $131: "730", //"Y-axis maximum travel, millimeters"
      $132: "90", //"Z-axis maximum travel, millimeters"
    }
  } else if (type == "leadmachine1515") {
    // Leadmachine 1010
    var customFirmware = false;
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //"Step idle delay, milliseconds"
      $2: "0", //"Step pulse invert, mask"
      $3: "0", //"Step direction invert, mask"
      $4: "1", //"Invert step enable pin, boolean"
      $5: "0", //"Invert limit pins, boolean"
      $6: "0", //"Invert probe pin, boolean"
      $10: "1", //"Status report options, mask"
      $11: "0.010", //"Junction deviation, millimeters"
      $12: "0.002", //"Arc tolerance, millimeters"
      $13: "0", //"Report in inches, boolean"
      $20: "0", //"Soft limits enable, boolean"
      $21: "0", //"Hard limits enable, boolean"
      $22: "0", //"Homing cycle enable, boolean"
      $23: "3", //"Homing direction invert, mask"
      $24: "100.000", //"Homing locate feed rate, mm/min"
      $25: "2000.000", //"Homing search seek rate, mm/min"
      $26: "250", //"Homing switch debounce delay, milliseconds"
      $27: "5.000", //"Homing switch pull-off distance, millimeters"
      $30: "1000", //"Maximum spindle speed, RPM"
      $31: "0", //"Minimum spindle speed, RPM"
      $32: "0", //"Laser mode"
      $100: "198.109", //"X-axis steps per millimeter"
      $101: "198.109", //"Y-axis steps per millimeter"
      $102: "199.100", //"Z-axis steps per millimeter"
      $110: "3500.000", //"X-axis maximum rate, mm/min"
      $111: "3500.000", //"Y-axis maximum rate, mm/min"
      $112: "1000.000", //"Z-axis maximum rate, mm/min"
      $120: "350.000", //"X-axis acceleration, mm/sec^2"
      $121: "350.000", //"Y-axis acceleration, mm/sec^2"
      $122: "350.000", //"Z-axis acceleration, mm/sec^2"
      $130: "1180", //"X-axis maximum travel, millimeters"
      $131: "1270", //"Y-axis maximum travel, millimeters"
      $132: "90", //"Z-axis maximum travel, millimeters"
    }
  } else if (type == "leadmachine1010laser") {
    // Leadmachine 55
    var customFirmware = false;
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //"Step idle delay, milliseconds"
      $2: "0", //"Step pulse invert, mask"
      $3: "4", //"Step direction invert, mask"
      $4: "1", //"Invert step enable pin, boolean"
      $5: "0", //"Invert limit pins, boolean"
      $6: "0", //"Invert probe pin, boolean"
      $10: "1", //"Status report options, mask"
      $11: "0.010", //"Junction deviation, millimeters"
      $12: "0.002", //"Arc tolerance, millimeters"
      $13: "0", //"Report in inches, boolean"
      $20: "0", //"Soft limits enable, boolean"
      $21: "0", //"Hard limits enable, boolean"
      $22: "0", //"Homing cycle enable, boolean"
      $23: "3", //"Homing direction invert, mask"
      $24: "100.000", //"Homing locate feed rate, mm/min"
      $25: "1000.000", //"Homing search seek rate, mm/min"
      $26: "250", //"Homing switch debounce delay, milliseconds"
      $27: "5.000", //"Homing switch pull-off distance, millimeters"
      $30: "255", //"Maximum spindle speed, RPM"
      $31: "0", //"Minimum spindle speed, RPM"
      $32: "1", //"Maximum spindle speed, RPM"
      $100: "199.100", //"X-axis steps per millimeter"
      $101: "199.100", //"Y-axis steps per millimeter"
      $102: "199.100", //"Z-axis steps per millimeter"
      $110: "4000.000", //"X-axis maximum rate, mm/min"
      $111: "4000.000", //"Y-axis maximum rate, mm/min"
      $112: "4000.000", //"Z-axis maximum rate, mm/min"
      $120: "700.000", //"X-axis acceleration, mm/sec^2"
      $121: "700.000", //"Y-axis acceleration, mm/sec^2"
      $122: "700.000", //"Z-axis acceleration, mm/sec^2"
      $130: "810", //"X-axis maximum travel, millimeters"
      $131: "730", //"Y-axis maximum travel, millimeters"
      $132: "90", //"Z-axis maximum travel, millimeters"
    }
  } else if (type == "custom") {
    // Leadmachine 55
    var customFirmware = false;
    var grblParams_def = {
      $0: "10", //"Step pulse time, microseconds"
      $1: "255", //"Step idle delay, milliseconds"
      $2: "0", //"Step pulse invert, mask"
      $3: "4", //"Step direction invert, mask"
      $4: "1", //"Invert step enable pin, boolean"
      $5: "0", //"Invert limit pins, boolean"
      $6: "0", //"Invert probe pin, boolean"
      $10: "1", //"Status report options, mask"
      $11: "0.010", //"Junction deviation, millimeters"
      $12: "0.002", //"Arc tolerance, millimeters"
      $13: "0", //"Report in inches, boolean"
      $20: "0", //"Soft limits enable, boolean"
      $21: "0", //"Hard limits enable, boolean"
      $22: "0", //"Homing cycle enable, boolean"
      $23: "3", //"Homing direction invert, mask"
      $24: "100.000", //"Homing locate feed rate, mm/min"
      $25: "1000.000", //"Homing search seek rate, mm/min"
      $26: "250", //"Homing switch debounce delay, milliseconds"
      $27: "5.000", //"Homing switch pull-off distance, millimeters"
      $30: "1000", //"Maximum spindle speed, RPM"
      $31: "0", //"Minimum spindle speed, RPM"
      $32: "0", //"Laser mode"
      $100: "199.100", //"X-axis steps per millimeter"
      $101: "199.100", //"Y-axis steps per millimeter"
      $102: "199.100", //"Z-axis steps per millimeter"
      $110: "2500.000", //"X-axis maximum rate, mm/min"
      $111: "2500.000", //"Y-axis maximum rate, mm/min"
      $112: "2500.000", //"Z-axis maximum rate, mm/min"
      $120: "150.000", //"X-axis acceleration, mm/sec^2"
      $121: "150.000", //"Y-axis acceleration, mm/sec^2"
      $122: "150.000", //"Z-axis acceleration, mm/sec^2"
      $130: "1000", //"X-axis maximum travel, millimeters"
      $131: "1000", //"Y-axis maximum travel, millimeters"
      $132: "100", //"Z-axis maximum travel, millimeters"
    }
  }
  for (var key in grblParams_def) {
    if (grblParams_def.hasOwnProperty(key)) {
      var j = key.substring(1)
      var newVal = $("#val-" + j + "-input").val();
      $("#val-" + j + "-input").val(parseFloat(grblParams_def[key]))
      fixGrblHALSettings(j);
      // console.log("$" + j + " = " + newVal)
    }
  }

  allowGrblSettingsViewScroll = false;
  setTimeout(function() {
    allowGrblSettingsViewScroll = true;
  }, 500);

  checkifchanged();
  enableLimits(); // Enable or Disable
  displayDirInvert();
  setMachineButton(type);

  if (lastSelectedMachine != type) {
    //if (lastSelectedMachine.substr(0, 4) != type.substr(0, 4)) {

    if (customFirmware == "acro" && laststatus.machine.firmware.platform == "grblHAL") {
      // as per https://openbuilds.com/threads/blackbox-x32.19810/page-3#post-131285
      $("#val-44-input").val(3)
      $("#val-45-input").val(0)
    } else if (customFirmware == "acropen" && laststatus.machine.firmware.platform == "grblHAL") {
      // as per https://openbuilds.com/threads/blackbox-x32.19810/page-3#post-131285
      $("#val-44-input").val(3)
      $("#val-45-input").val(0)
      $("#val-33-input").val(50)

    } else if (customFirmware == "acro" && laststatus.machine.firmware.platform == "grbl") {
      Metro.dialog.create({
        title: "Custom Firmware Required",
        content: `<div>The machine type you selected, needs a custom firmware. Please use the Firmware Flashing Wizard to upload a custom firmware image to the controller to properly support this machine. </div>`,
        actions: [{
            caption: "No Thank you",
            cls: "js-dialog-close",
            onclick: function() {
              console.log("Do nothing")
            }
          },
          {
            caption: "Launch the Flashing Wizard",
            cls: "js-dialog-close success",
            onclick: function() {
              openFlashingTool();
              setTimeout(function() {
                // $('#grblAxesCount').data('select').val('2axes')
              }, 500)
            }
          },

        ]
      });

      console.log('This machine needs a custom firmware')
    } else if (customFirmware == "acropen" && laststatus.machine.firmware.platform == "grbl") {
      Metro.dialog.create({
        title: "Custom Firmware Required",
        content: `<div>The machine type you selected, needs a custom firmware. Please use the Firmware Flashing Wizard to upload a custom firmware image to the controller to properly support this machine. </div>`,
        actions: [{
            caption: "No Thank you",
            cls: "js-dialog-close",
            onclick: function() {
              console.log("Do nothing")
            }
          },
          {
            caption: "Launch the Flashing Wizard",
            cls: "js-dialog-close success",
            onclick: function() {
              openFlashingTool();
              setTimeout(function() {
                //$('#grblAxesCount').data('select').val('servo')
              }, 500)
            }
          },

        ]
      });

      console.log('This machine needs a custom firmware')
    }
    //}

  }

  lastSelectedMachine = type;
  sendGcode('$I=' + lastSelectedMachine)
  checkifchanged()
};

function setMachineButton(type) {
  var overlaytype = "custom";
  if (type == "sphinx55") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds Sphinx 55`
    overlaytype = type;
  } else if (type == "sphinx1050") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds Sphinx 1050`
    overlaytype = type;
  } else if (type == "workbee1050") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds Workbee 1050`
    overlaytype = type;
  } else if (type == "workbee1010") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds Workbee 1010`
    overlaytype = type;
  } else if (type == "workbee1510") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds Workbee 1510`
    overlaytype = type;
  } else if (type == "acro55") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds Acro 55`
    overlaytype = type;
  } else if (type == "acro510") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds Acro 510`
    overlaytype = type;
  } else if (type == "acro1010") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds Acro 1010`
    overlaytype = type;
  } else if (type == "acro1510") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds Acro 1510`
    overlaytype = type;
  } else if (type == "acro1515") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds Acro 1515`
    overlaytype = type;
  } else if (type == "minimill") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds MiniMill`
    overlaytype = type;
  } else if (type == "cbeam") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds C-Beam Machine`
    overlaytype = type;
  } else if (type == "cbeamxl") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds C-Beam XL`
    overlaytype = type;
  } else if (type == "leadmachine1010laser") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds LEAD 1010 with Laser Module`
    overlaytype = type;
  } else if (type == "leadmachine1010") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds LEAD 1010`
    overlaytype = type;
  } else if (type == "leadmachine1515") {
    template = `<img src="img/mch/` + type + `.png"/>  OpenBuilds LEAD 1515`
    overlaytype = type;
  } else if (type == "custom") {
    template = `<img src="img/mch/` + type + `.png"/>  Custom Machine`
    overlaytype = type;
  } else {
    template = `<img src="img/mch/sphinx55.png"/>  Select Machine`
    overlaytype = "custom"
  }
  $('#context_toggle2').html(template);
  $('#overlayimg').html(`<img src="img/mch/` + overlaytype + `.png" style="max-width:100%; max-height:100%;"/><span onclick="$('#grblTab').click()" style="position: absolute; top: 3px; right:3px; z-index: 1;" class="fas fa-cogs machineicon" style="text-shadow: 2px 2px 4px #cccccc;"></span>`)
};