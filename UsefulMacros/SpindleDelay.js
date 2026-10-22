// Adds a 5 second delay after each M3 or M4 command.
// Uses the pause/resume functionality instead of the G4 command.
// This is useful if G4 is not working for some reason.

// To install it:
//   * Go to the Macros tab in OpenBuilds
//   * Click the +Create button
//   * Set the Label to "Spindle Delay"
//   * Change the type from GCODE to Javascript
//   * Copy this entire file to the text box
//   * Select "Run Macro on startup"
//   * Close and restart OpenBuilds

const SPINDLE_DELAY_IN_SECONDS = 5.0; // change this number to change the delay duration

$(document).ready(function()
{
	socket.on('ok', (command) =>
	{
		if (typeof(command) == 'string' &&
			(command.indexOf('M3') != -1 || command.indexOf('M4') != -1 || command.indexOf('M03') != -1 || command.indexOf('M04') != -1) &&
			grblParams["$32"] == 0)
		{
			socket.emit('pause');
			printLog("PROGRAM PAUSED FOR SPINDLE DELAY");
			setTimeout(function()
			{
				socket.emit('resume');
				printLog("PROGRAM RESUMED");
			}, SPINDLE_DELAY_IN_SECONDS * 1000);
		}
	}
)});
