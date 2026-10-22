// Find Center
// Starting from approximately the center of a circle, probe in 4 directions and compute the center
// Works for any symmetrical convex hole - circle, square, rectangle

///////////////////////////////////////////
// Program sequence framework /////////////
//
// This framework helps with creating multi-step G-code execution sequences, where some code logic needs to run after each step.
//
// To use it, call RunProgramSequence with two functions.
//
// The first function is called for each step. It has a parameter "currentStep", which starts from 0 and auto-increments with each call.
// The function needs to return the G-code for the current step. If there are no more steps, return empty string or nothing.
//
// The second parameter is optional. It is a function that is called at the very end to clean up.

var g_OnStep;
var g_OnClose;
var g_CurrentStep;
var g_JobStarted;

function ExecuteNextStep()
{
	g_CurrentStep++;
	var gcode = g_OnStep(g_CurrentStep);
	if (gcode)
	{
		sendGcode(gcode);

		// Due to the async nature of the gcode sending, it is not possible to know when exactly the code starts executing.
		// Let's wait for 1000ms to ensure grbl has started, and then wait until it is idle
		setTimeout(() => g_JobStarted = true, 1000);
	}
	else
	{
		CloseProgramSequence();
	}
}

function HandleStatus(status)
{
	if (status.comms.connectionStatus == 5 || status.comms.runStatus == "Alarm")
	{
		// Alarm detected
		CloseProgramSequence();
		return;
	}

	if (status.comms.runStatus == "Idle")
	{
		// runStatus=="Idle" is not enough. During a G4 command the status is temporarily set to idle. Also check the connectionStatus
		if (g_JobStarted && status.comms.connectionStatus == 2)
		{
			// Idle reached
			g_JobStarted = false;
			ExecuteNextStep();
		}
	}
	else if (status.comms.runStatus != "Jog" && status.comms.runStatus != "Run" && status.comms.runStatus != "Running")
	{
		// some other unexpected state
		CloseProgramSequence();
	}
}

function RunProgramSequence(onStep, onClose)
{
	g_OnStep = onStep;
	g_OnClose = onClose;
	g_JobStarted = false;
	if (window.SequenceFrameworkHandleStatus) {
		socket.off('status', window.SequenceFrameworkHandleStatus);
	}
	window.SequenceFrameworkHandleStatus = HandleStatus;
	socket.on('status', HandleStatus);
	g_CurrentStep = -1;
	ExecuteNextStep();
}

function CloseProgramSequence()
{
	g_OnStep = undefined;
	socket.off('status', HandleStatus);
	window.SequenceFrameworkHandleStatus = undefined;
	if (g_OnClose)
	{
		g_OnClose();
	}
	g_OnClose = undefined;
}

///////////////////////////////////////////

var g_SeekDistance;
var g_ProbeFeed1;
var g_ProbeFeed2;

const c_CenterX = laststatus.machine.position.work.x;
const c_CenterY = laststatus.machine.position.work.y;

var g_SamplePoints = [];

function ExecuteStep(currentStep)
{
	if (currentStep > 0 && currentStep <= 4)
	{
		g_SamplePoints.push({x: Number(laststatus.machine.probe.x), y: Number(laststatus.machine.probe.y)});
	}

	var dx = 0;
	var dy = 0;
	switch (currentStep)
	{
		case 0: dx = -1; break;
		case 1: dx = 1; break;
		case 2: dy = -1; break;
		case 3: dy = 1; break;
		case 4:
			{
				const cx = (g_SamplePoints[0].x + g_SamplePoints[1].x) / 2;
				const cy = (g_SamplePoints[2].y + g_SamplePoints[3].y) / 2;
				return "G1 G53 G21 G90 X" + cx.toFixed(3) + " Y" + cy.toFixed(3) + " F1000";
			}
		case 5: return;
	}

	// first probe (relative)
	var gcode = "G38.2 G21 G91 X" + (dx*g_SeekDistance).toFixed(3) + " Y" + (dy*g_SeekDistance).toFixed(3) + " F" + g_ProbeFeed1 + "\n";

	// retract (2mm relative)
	gcode += "G1 G21 G91 X" + (-dx*2).toFixed(3) + " Y" + (-dy*2).toFixed(3) + "F1000\n";

	// second probe (5mm relative)
	gcode += "G38.2 G21 G91 X" + (dx*5).toFixed(3) + " Y" + (dy*5).toFixed(3) + " F" + g_ProbeFeed2 + "\n";

	// back to center (absolute)
	gcode += "G1 G21 G90 X" + c_CenterX.toFixed(3) + " Y" + c_CenterY.toFixed(3) + " F1000";

	return gcode;
}

Metro.dialog.create({
  title: `Center Finding Macro<br><span style="font-size:small;">For best results start the probe near the center of the hole</span>`,
  content: `
    <div class="row mb-0">
      <label class="cell-sm-6">Maximum Seek Distance</label>
      <div class="cell-sm-6">
      	<input id="centerProbeDistance" type="number" value="100" data-role="input" data-append="mm" data-prepend="<i class='fas fa-ruler-combined'></i>" data-clear-button="false">
      </div>
    </div>

    <small>This is the maximum seek distance from the starting position to the edges of the hole (approximately the expected radius)</small>
    <hr>
    <div class="row mb-0">
      <label class="cell-sm-6">First Pass Feedrate</label>
      <div class="cell-sm-6">
      	<input id="centerProbeFeedrate1" type="number" value="100" data-role="input" data-append="mm/min" data-prepend="<i class='fas fa-running'></i>" data-clear-button="false">
      </div>
    </div>
    <small>How fast the probe will move during the first pass</small>
    <hr>
    <div class="row mb-0">
      <label class="cell-sm-6">Second Pass Feedrate</label>
      <div class="cell-sm-6">
      	<input id="centerProbeFeedrate2" type="number" value="50" data-role="input" data-append="mm/min" data-prepend="<i class='fas fa-running'></i>" data-clear-button="false">
      </div>
    </div>
    <small>How fast the probe will move during the second pass</small>
    `,
  actions: [{
      caption: "Run center finding Probe",
      cls: "js-dialog-close success",
      onclick: function() {
        g_SeekDistance = parseFloat($("#centerProbeDistance").val());
        g_ProbeFeed1 = parseFloat($("#centerProbeFeedrate1").val());
        g_ProbeFeed2 = parseFloat($("#centerProbeFeedrate2").val());
        RunProgramSequence(ExecuteStep);
      }
    },
    {
      caption: "Cancel",
      cls: "js-dialog-close alert",
      onclick: function() {}
    }
  ]
});
