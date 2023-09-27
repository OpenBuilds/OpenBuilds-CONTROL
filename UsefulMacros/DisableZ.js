// Disable the Z jog buttons when 100mm is selected or continuous jog is enabled
// Based on the original script by sharmstr - https://github.com/sharmstr/OpenBuildsHacks/blob/main/Macros/HideZBtns.js
// But with a few improvements:
//   Instead of hiding the buttons it replaces them with blank ones, which preserves the UI layout
//   Intercepts and stops the keyboard shortcuts for Z jogging
//   Hooks more keyboard actions that might affect the step size
//   The code is streamlined and less stateful

$(document).ready(function()
{
	$('#zM').before('<button class="button light square xlarge m-0 ml-2" id="zM2" />');
	$('#zP').before('<button class="button light square xlarge m-0 ml-2" id="zP2" />');
	$('#zM2,#zP2').hide();

	var zHidden = false;

	function updateZBtns()
	{
		var jog100 = $('#dist100').hasClass('bd-openbuilds');
		var contiguous = $('#jogTypeContinuous').is(":checked");
		zHidden = jog100 || contiguous;

		if (zHidden)
		{
			$('#zM,#zP').hide();
			$('#zM2,#zP2').show();
		}
		else
		{
			$('#zM,#zP').show();
			$('#zM2,#zP2').hide();
		}
	}

	// list of shortcuts that might affect the step size
	var captureShortcuts = ["stepP", "stepM", "incJogMode", "conJogMode"];
	for (var i = 0; i < captureShortcuts.length; i++)
	{
		var shortcut = keyboardShortcuts[captureShortcuts[i]];
		if (shortcut.length)
		{
			$(document).bind('keydown', shortcut, function(e) { updateZBtns(); });
		}
	}

	// intercept the Z+ and Z- shortcut keys if necessary
	document.addEventListener('keydown', (event) => {
		if (zHidden)
		{
			var keyName = event.key.toLowerCase();
			if (keyName == keyboardShortcuts.zP || keyName == keyboardShortcuts.zM)
			{
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		}
	}, {capture : true});

	$('#dist01,#dist1,#dist10,#dist100,#jogTypeContinuous').on('click', updateZBtns);

	updateZBtns();
});
