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
// Example

function ExecuteStep(currentStep)
{
	switch (currentStep)
	{
		case 0: return "G1 G91 X10 F200";
		case 1: return "G1 G91 Y10 F200";
		case 2: return "G1 G91 X-10 F200";
		case 3: return "G1 G91 Y-10 F200";
	}
}

function Cleanup()
{
	sendGcode("G54 G21 G90"); // restore global state
}

RunProgramSequence(ExecuteStep, Cleanup);
