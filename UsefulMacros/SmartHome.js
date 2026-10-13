// This macro prevents accidental homing if the machine was recently homed by asking for confirmation.
// Also adds options to home single axis if the firmware supports it.
// Set it to run on startup.

const ENABLE_SINGLE_AXIS_HOMING = true; // set to false to disable the feature

const homeSingleMenu = `
<div style="display:none">
  <button id="homeSingleMenu" class="ribbon-button dropdown-toggle" style="padding-left:10px; height:78px; margin-left:-4px;" title="Home single axis">
  </button>
  <ul class="ribbon-dropdown grblmode" data-role="dropdown" data-duration="100">
    <li onclick="sendGcode('$HX');"><a href="#"><span class="fg-red" style="font-weight:900;padding-right:5px;">X</span> Home X axis</a></li>
    <li onclick="sendGcode('$HY');"><a href="#"><span class="fg-green" style="font-weight: 900; padding-right: 5px; ">Y</span> Home Y axis</a></li>
    <li onclick="sendGcode('$HZ');"><a href="#"><span class="fg-blue" style="font-weight: 900; padding-right: 5px; ">Z</span> Home Z axis</a></li>
    <li class="4thaxis-active" onclick="sendGcode('$HA');" style="display:none;"><a href="#"><span class="fg-orange" style="font-weight: 900; padding-right: 5px; ">A</span> Home A axis</a></li>
  </ul>
</div>`;

var homeSingleDisabled = "unknown";

function OnHomeDisabled(changes)
{
	var disabled = $("#homeBtn").attr('disabled');
	if (disabled !== homeSingleDisabled)
	{
		homeSingleDisabled = disabled;
		$("#homeSingleMenu").attr('disabled', !!disabled);
	}
}

// Cleans up old instance of the plugin. useful when iterating on the code
function CleanupOldVersion()
{
	var observer = $('#homeBtn').prop('Observer');
	if (observer)
		observer.disconnect();

	var onFeatures = $('#homeBtn').prop('OnFeatures');
	if (onFeatures)
		socket.off('features', onFeatures);

	$("#homeSingleMenu").parent().remove();
}

function OnFeatures(features)
{
	$("#homeSingleMenu").parent().toggle(features.contains('H'));
}

$(document).ready(function()
{
	CleanupOldVersion();

	if (ENABLE_SINGLE_AXIS_HOMING)
	{
		var observer = new MutationObserver(OnHomeDisabled); // monitor the disabled attribute
		observer.observe(document.getElementById('homeBtn'), { attributes: true, attributeFilter: ['disabled']});

		$("#homeBtn").after(homeSingleMenu);

		if (laststatus != undefined && laststatus.machine.firmware.features.contains('H'))
		{
			$("#homeSingleMenu").parent().show();
		}

		socket.on('features', OnFeatures);

		$("#homeBtn").prop('Observer', () => { return observer; });
		$("#homeBtn").prop('OnFeatures', () => { return OnFeatures; });
	}

	$("#homeBtn").off('click');
	$("#homeBtn").on('click',function()
	{
		if (laststatus.machine.modals.homedRecently)
		{
			Metro.dialog.create({
				title: "Home All",
				content: "The machine was recently homed. Do you want to home again?",
				clsDialog: 'dark',
				actions: [
					{
						caption: "Proceed",
						cls: "js-dialog-close success",
						onclick: home
					},
					{
						caption: "Cancel",
						cls: "js-dialog-close",
						onclick: function() {}
					}
				],
			});
		}
		else
		{
			home();
		}
	});
});
