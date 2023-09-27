// Restores the WCS offset, previously stored by StoreWcs.js

var ShowPendantDialog = $('#pendant').prop('ShowDialog');

if (window.LastWcs != undefined)
{
	var gcode = "G10 G90 L2 P0 X" + window.LastWcs.X.toFixed(3) + " Y" + window.LastWcs.Y.toFixed(3) + " Z" +  + window.LastWcs.Z.toFixed(3);
	sendGcode(gcode);
	printLog("Restoring WCS: X=" + window.LastWcs.X.toFixed(3) + ", Y=" + window.LastWcs.Y.toFixed(3) + ", Z=" + window.LastWcs.Z.toFixed(3));
	if (ShowPendantDialog != undefined)
	{
		ShowPendantDialog({
			title: "Restoring WCS",
			text: [
				"^ X: " + (window.LastWcs.X > 0 ? " " : "") + window.LastWcs.X.toFixed(2),
				"^ Y: " + (window.LastWcs.Y > 0 ? " " : "") + window.LastWcs.Y.toFixed(2),
				"^ Z: " + (window.LastWcs.Z > 0 ? " " : "") + window.LastWcs.Z.toFixed(2),
				],
			rButton: ["OK"],
		});
	}
}
else
{
	printLog("No WCS has been previously stored.");
	if (ShowPendantDialog != undefined)
	{
		ShowPendantDialog({
			title: "Restoring WCS",
			text: [
				"No WCS has been",
				"previously stored.",
				],
			rButton: ["OK"],
		});
	}
}
