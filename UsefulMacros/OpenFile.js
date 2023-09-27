// Removes the dropdown menu from the Open G-Code button and adds a button for reloading the last file
// Also hides the splashscreen and the "new" badge from the ribbon
// Based on Thayne Co work here: https://thayneco.com/single-click-to-open-a-file-browser-in-openbuilds-control/
// Requires the "reopen last file" functionality from this fork: https://github.com/ivomirb/OpenBuilds-CONTROL 

$('#splash').hide();
$('#btnTheme > span.h6.badge.bg-green.fg-white').hide();

var openFileButtons = `
<button id="file" class="ribbon-button" onclick="socket.emit('openFile')">
	<span class="icon">
		<span class="fa-layers fa-fw">
			<i class="fas fa-folder-open fg-amber"></i>
		</span>
	</span>
	<span class="caption grblmode">Open<br>G-Code</span>
</button>
<button id="reloadFile" class="ribbon-button disabled" title="Reload last G-Code file" onclick="socket.emit('reopenFile');">
	<span class="icon">
		<span class="fas fa-undo-alt"></span>
	</span>
	<span class="caption">Reload<br>G-Code</span>
</button>`

$("#openGcodeBtn").attr('id', "old_openGcodeBtn");
$("#openGcodeBtnElectron19").attr('id', "old_openGcodeBtnElectron19");
$("#reloadFile").attr('id', "old_reloadFile");
$("#old_openGcodeBtn").hide();
$("#old_openGcodeBtnElectron19").parent().hide();
$("#old_openGcodeBtnElectron19").parent().after(openFileButtons);
