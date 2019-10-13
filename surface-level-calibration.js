const fs = require('fs');
const {levelGcode} = require("./cncCoordinateAdjustment");

const median = arr => {
    const mid = Math.floor(arr.length / 2),
        nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

async function probeField({startX,startY,deltaX,deltaY,pointsX,pointsY}, probePoint){

    let rows = [];
    let y_point = 0;
    let dirX = 1;
    while (y_point < pointsY) {
        let row = [];
        let probe = async (x_point) => {
            let x = startX + deltaX*x_point;
            let y = startY + deltaY*y_point;
            let z = await probePoint(x,y);
            if (dirX === 1) row.push(z); else row.splice(0,0,z);
        };
        if (dirX === +1) for (let x_point = 0; x_point < pointsX; x_point++) await probe(x_point);
        if (dirX === -1) for (let x_point = pointsX-1; x_point >= 0; x_point--) await probe(x_point);
        rows.push(row);
        dirX = dirX * (-1); // reverse direction
        y_point++;
    }
    return rows;
}


async function surfaceLevelCalibration (params, parser, send, configPath) {

    let {
        movingSpeedXY,
        movingSpeedZ,
        probesPerPoint,
        zTravelProbeDistance
    } = params;

    async function waitFor(predicate) {
        return new Promise(resolve => {
            let listener = (code) => {
                let rawString = code.toString();
                let strings = rawString.trim().split("\r\n");
                for (let s of strings) {
                    //console.log(s);
                    let hit;
                    if (typeof predicate === "string" && s === predicate) hit = true;
                    if (typeof predicate === "function" && predicate(s)) hit = true;

                    if (hit) {
                        parser.removeListener('data', listener);
                        resolve(s);
                        break;
                    }
                }
            };
            parser.on('data',listener);
        })
    }

    async function sendCmd(cmd, waitPredicate) {
        let responsePromise = waitFor(waitPredicate);
        send(cmd);
        return await responsePromise;
    }

    let gInit = `
          G54; Work Coordinates
          G21; mm-mode
          G90; Absolute Positioning
          G0 Z0; Safe distance
        `.split("\n").map(s=>s.trim()).filter(Boolean);

    try {

        for (let cmd of gInit) await sendCmd(cmd,"ok");

        async function probePoint(x,y){

            let zValues = [];
            await sendCmd(`G0 F${movingSpeedXY} X${x} Y${y} Z${0}`,"ok");

            for (let probeNo=1; probeNo<=probesPerPoint; probeNo++) {
                // probe
                // wait for
                // [PRB:23.109,-30.000,-1.020:1]
                // ALARM
                let probeResponse = await sendCmd(`G38.2 F${movingSpeedZ} Z-${zTravelProbeDistance}`,s => /^\[PRB:/.test(s) || /ALARM/.test(s));
                if (/ALARM/.test(probeResponse)) throw new Error(probeResponse);
                let zValue = +probeResponse.replace(/^\[PRB:([-0-9.]+),([-0-9.]+),([-0-9.]+):[\d]\]$/,"$3"); // extract Z value
                console.log("Probe: "+probeResponse);
                console.log("Z: "+zValue);

                zValues.push(zValue);

                // retract
                await sendCmd(`G0 F${movingSpeedXY} Z0`,"ok");
            }
            return median(zValues);
        }

        const rows = await probeField({ ...params, startX: 0, startY: 0 }, probePoint);



        console.log("Calibration completed:");
        console.log(rows);

        let calibrationData = {
            params,
            surface: rows
        };

        fs.writeFileSync(configPath+"/calibration.json", JSON.stringify(calibrationData, null,2));

    } catch (e) {
        console.error(e);
    }finally {
    }

}

function adjustGCodeLevel(configPath, gcode){
    let calibrationData = JSON.parse(fs.readFileSync(configPath+"/calibration.json").toString());

    return levelGcode(gcode,calibrationData);
}

module.exports = {
    surfaceLevelCalibration,
    adjustGCodeLevel
};
