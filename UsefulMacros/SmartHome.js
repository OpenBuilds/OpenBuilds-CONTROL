// Prevents accidental homing if the machine was recently homed

$(document).ready(function() {
	var homeButton = `
	<button id="homeBtn" class="ribbon-button">
		<span class="icon">
			<i class="fas fa-home"></i>
		</span>
		<span class="caption grblmode">Home<br>All</span>
	</button>`

	$("#homeBtn").attr('id', "oldHomeBtn");
	$("#oldHomeBtn").after(homeButton);
	$("#oldHomeBtn").remove();

	$("#homeBtn").on('click',function()
	{
		if (laststatus.machine.modals.homedRecently)
		{
			Metro.dialog.create({
				title: "Home All",
				content: "The machine was recently homed. Do you want to home again?",
				actions: [
					{
						caption: "Proceed",
						cls: "js-dialog-close success",
						onclick: home
					},
					{
						caption: "Cancel",
						cls: "js-dialog-close",
						onclick: function() {
							// do nothing
						}
					}
				],
				closeButton: true
			});
		}
		else
		{
			home();
		}
	});
});
