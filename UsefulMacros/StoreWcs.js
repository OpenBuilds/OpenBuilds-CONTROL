// Stores the WCS offset after a job. It can later be restored by RestoreWCS.js

$(document).ready(function()
{
	window.LastWcs = undefined;

	socket.on('jobComplete', function(data)
	{
		if (data.jobStartTime)
		{
			window.LastWcs = {
				X : laststatus.machine.position.offset.x,
				Y : laststatus.machine.position.offset.y,
				Z : laststatus.machine.position.offset.z,
			};
			printLog("Storing WCS: X=" + window.LastWcs.X.toFixed(3) + ", Y=" + window.LastWcs.Y.toFixed(3) + ", Z=" + window.LastWcs.Z.toFixed(3));
		}
	});
});
