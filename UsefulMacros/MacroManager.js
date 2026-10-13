// This JavaScript macro enables the creation of groups for the macro buttons. This improves the management
// of large number of macros.
// Set it to run on startup.
//
// You can right-click on a macro button and click on "Move To Group" to set which group it should belong to.
// Pick from existing groups or add a new one by typing its name.
// Right-click on the background behind the macro buttons to select if the group tabs should be displayed
// horizontally, vertically, or disabled. You also get options to back up all macros into a single file.
// Right-click on a group tab to rename it.
//
// The group named "Default" always exists and is always first.
// The rest of the groups are sorted alphabetically.
// To control the order, name the groups like "1. Setup", "2. Probing", etc.

var g_TabVisibility = 2; // 0 - hidden, 1 - horizontal, 2 - vertical
var g_CurrentGroupLower = ""; // empty when g_TabVisibility is 0

var g_Groups = [ "" ]; // first item is always empty string
var g_GroupsLower = [ "" ];
var g_SelectedGroup = undefined;
var g_ButtonCount;
var g_SelectedMacro = undefined;

// Cleans up old instance of the plugin. useful when iterating on the code
function CleanupOldVersion()
{
	$('#macroBackgroundContextToggle').remove();
	$('#macroBackgroundContextMenu').remove();
	$('#macroTabContextToggle').remove();
	$('#macroTabContextMenu').remove();
	$('#macroContextToggle').remove();
	$('#macroContextMenuNew').remove();

	$('#macroVerticalTabs').parent().remove();
	$('#macroHorizontalDiv').after($('#macros'));
	$('#macroHorizontalDiv').remove();

	$('#macros').off('contextmenu');
	$('#macrostab').off('contextmenu');
	$('#macrostab').children().off('contextmenu');

	if (window.populateMacroButtonsOld)
	{
		window.populateMacroButtons = window.populateMacroButtonsOld;
		window.populateMacroButtonsOld = undefined;
	}
	if (window.setMacroContextMenuPositionOld)
	{
		window.setMacroContextMenuPosition = window.setMacroContextMenuPositionOld;
		window.setMacroContextMenuPositionOld = undefined;
	}
}

function StoreSettings()
{
	localStorage.setItem("MacroManagerSettings", JSON.stringify({tabVisibility: g_TabVisibility, currentGroupLower: g_CurrentGroupLower}));
}

function StoreButtons()
{
	localStorage.setItem('macroButtons', JSON.stringify(buttonsarray));
}

function SetCurrentGroup(groupLower)
{
	if (g_CurrentGroupLower != groupLower)
	{
		g_CurrentGroupLower = groupLower;
		StoreSettings();
	}
}

function SanitizeGroupName(string)
{
	if (string == undefined)
	{
		return "";
	}
	return string.replaceAll(/[\&\<\>\"\']/g, ' ');;
}

function IsButtonVisible(button)
{
	if (g_TabVisibility == 0) return true;
	if (button.group == undefined)
	{
		return g_CurrentGroupLower == "";
	}
	else
	{
		return button.group.toLowerCase() === g_CurrentGroupLower;
	}
}

function RefreshButtonVisibility()
{
	for (var i = 0; i < buttonsarray.length; i++)
	{
		$('#macroBtn' + i).toggle(g_TabVisibility == 0 || IsButtonVisible(buttonsarray[i]));
	}
}

function RenameGroup(groupIdx, newName)
{
	var oldName = g_Groups[groupIdx];
	var oldNameLower = oldName.toLowerCase();
	newName = SanitizeGroupName(newName);
	if (g_CurrentGroupLower == oldNameLower)
	{
		SetCurrentGroup(newName.toLowerCase());
	}

	var saveRequired = false;
	for (var i = 0; i < buttonsarray.length; i++)
	{
		var button = buttonsarray[i];
		if (button.group != undefined && button.group.toLowerCase() == oldNameLower)
		{
			button.group = newName;
			saveRequired = true;
		}
	}

	if (saveRequired)
	{
		StoreButtons();
	}
	RebuildGroupUI();
}

window.RenameSelectedGroup = function()
{
	var dialogContent = `
<div class="row mb-2">
<label class="cell-sm-4 pt-1">Group Name:</label>
<div class="cell-sm-6">
<input id="MacroGroupRename" data-role="input" data-clear-button="false" data-editable="true" />
</div>
</div>
`;
	Metro.dialog.create({
		title: "Rename Macro Group",
		clsDialog: "dark",
		width: 600,
		content: dialogContent,
		dataToTop: true,
		actions: [{
				caption: "Apply",
				cls: "js-dialog-close success",
				onclick: function() {
					RenameGroup(g_SelectedGroup, $('#MacroGroupRename').val());
					g_SelectedGroup = undefined;
				}
			},
			{
				caption: "Cancel",
				cls: "js-dialog-close",
				onclick: function() {}
			}
		]
	});

	$('#MacroGroupRename').val(g_Groups[g_SelectedGroup]);
}

window.SelectMacroGroup = function(groupIdx)
{
	SetCurrentGroup(g_GroupsLower[groupIdx]);
	RefreshButtonVisibility();
}

window.MacroTabContextMenu = function(event, groupIdx)
{
	g_SelectedGroup = groupIdx;

	$("#macroTabContextMenu").css({
		left: event.clientX,
		top: event.clientY
	}).data('dropdown').close(true);
	$("#macroTabContextToggle").click();
}

function CreateTabContents(tabs, activeIdx)
{
	tabs.empty();
	const styleHtml = `
<style>
	#macroHorizontalTabs > li,
	#macroVerticalTabs > li
	{
		white-space: nowrap;
		line-height: 1;
		font-size: 14px;
	}

	#macroHorizontalTabs > li.active,
	#macroVerticalTabs > li.active
	{
		background-color: lightgray;
	}

	#macroVerticalTabs > li >a
	{
		justify-content: left;
	}
<style/>`;
	tabs.append(styleHtml);

	var lineHtml = `<li onclick="SelectMacroGroup(0);"` + (activeIdx == 0 ? `class="active"` : "") + `><a href="#">Default</a></li>`;
	tabs.append(lineHtml);
	for (var i = 1; i < g_Groups.length; i++)
	{
		lineHtml = `<li onclick="SelectMacroGroup(` + i + `);" oncontextmenu="MacroTabContextMenu(event, ` + i + `)"` +
		(activeIdx == i ? `class="active"` : "") + `><a href="#">` + g_Groups[i] + `</a></li>`;
		tabs.append(lineHtml);
	}
}

window.SetMacroTabsVisibility = function(vis)
{
	g_TabVisibility = vis;
	$('#macroHorGroups > a > .icon').toggle(vis == 1);
	$('#macroVertGroups > a > .icon').toggle(vis == 2);
	$('#macroHideGroups > a > .icon').toggle(vis == 0);
	$('#macroHorizontalTabs').parent().toggle(vis == 1);
	$('#macroVerticalTabs').parent().toggle(vis == 2);
	if (vis == 0)
	{
		SetCurrentGroup("");
		$('#macros').css('height', 'calc(100vh - 495px)');
	}
	else
	{
		var activeIdx = Math.max(0, g_GroupsLower.indexOf(g_CurrentGroupLower));
		SetCurrentGroup(g_GroupsLower[activeIdx]);
		CreateTabContents($(vis == 1 ? '#macroHorizontalTabs' : '#macroVerticalTabs'), activeIdx);
		$('#macros').css('height', vis == 1 ? 'calc(100vh - 537px)' : 'calc(100vh - 495px)');
	}

	RefreshButtonVisibility();
}

function RebuildGroupNames()
{
	g_Groups = [ "" ];
	g_GroupsLower = [ "" ];
	for (var i = 0; i < buttonsarray.length; i++)
	{
		var groupName = SanitizeGroupName(buttonsarray[i].group);
		var groupNameLower = groupName.toLowerCase();
		if (g_GroupsLower.indexOf(groupNameLower) == -1)
		{
			g_Groups.push(groupName);
			g_GroupsLower.push(groupNameLower);
		}
	}

	g_Groups.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
	g_GroupsLower = g_Groups.map((x) => x.toLowerCase());
}

function RebuildGroupUI()
{
	RebuildGroupNames();

	var activeIdx = g_TabVisibility == 0 ? 0 : Math.max(0, g_GroupsLower.indexOf(g_CurrentGroupLower));
	SetCurrentGroup(g_GroupsLower[activeIdx]);
	if (g_TabVisibility == 1)
	{
		CreateTabContents($('#macroHorizontalTabs'), activeIdx);
	}
	if (g_TabVisibility == 2)
	{
		CreateTabContents($('#macroVerticalTabs'), activeIdx);
	}

	RefreshButtonVisibility();
}

function ApplyMoveMacro(buttonIdx)
{
	var saveRequired = false;
	var groupIdx = Number($('#MacroGroup').val());
	if (groupIdx != -1)
	{
		buttonsarray[buttonIdx].group = g_Groups[groupIdx];
		saveRequired = true;
	}
	else
	{
		var groupName = $('#MacroGroupName').val();
		groupName = SanitizeGroupName(groupName);
		var groupNameLower = groupName.toLowerCase();
		var groupIdx = (groupNameLower == "default") ? 0 : g_GroupsLower.indexOf(groupNameLower);
		if (groupIdx == -1)
		{
			g_Groups.push(groupName);
			g_GroupsLower.push(groupNameLower);
			buttonsarray[buttonIdx].group = groupName;
			saveRequired = true;
		}
		else
		{
			buttonsarray[buttonIdx].group = g_Groups[groupIdx];
			saveRequired = true;
		}
	}

	if (saveRequired)
	{
		StoreButtons();
	}
	RebuildGroupUI();
}

window.MoveMacroToGroup = function()
{
	var dialogContent = `
<div class="row mb-2">
  <label class="cell-sm-4 pt-1" title="Move to existing group">Group:</label>
  <div class="cell-sm-6">
  <select id="MacroGroup" data-role="select" data-clear-button="true" data-filter="false" onchange="if (Number($('#MacroGroup').val()) == -1) $('#MacroGroupNameRow').show(); else $('#MacroGroupNameRow').hide()">
    <option value="0">Default</option>
`;
	for (var i = 1; i < g_Groups.length; i++)
	{
		dialogContent += `
<option value="` + i + `">` + g_Groups[i] + `</option>
`;
	}
	dialogContent += `
    <option value="-1">&amp;lt;New Group&amp;gt;</option>
  </select>
  </div>
</div>
<div id="MacroGroupNameRow" class="row mb-2">
  <label class="cell-sm-4 pt-1" title="Enter the name for the new group">Group Name:</label>
  <div class="cell-sm-6">
    <input id="MacroGroupName" data-role="input" data-clear-button="false" data-editable="true" />
  </div>
</div>
`;

	var buttonIdx = g_SelectedMacro;
	g_SelectedMacro = undefined;
	Metro.dialog.create({
		title: "Move Macro To Group",
		clsDialog: "dark",
		width: 600,
		content: dialogContent,
		dataToTop: true,
		actions: [{
				caption: "Apply",
				cls: "js-dialog-close success",
				onclick: function() {
					ApplyMoveMacro(buttonIdx);
				}
			},
			{
				caption: "Cancel",
				cls: "js-dialog-close",
				onclick: function() {}
			}
		]
	});

	var groupName = SanitizeGroupName(buttonsarray[buttonIdx].group);
	var groupNameLower = groupName.toLowerCase();
	var groupIdx = Math.max(0, g_GroupsLower.indexOf(groupNameLower));
	$('#MacroGroup').val(groupIdx);
}

function MacroBackgroundContextMenu(event)
{
	if (event.target.id == 'macros' || event.target.id == 'macrostab')
	{
		var menu = $("#macroBackgroundContextMenu");
		menu.css({
			visibility: "hidden",
			display: "block",
		});
		const menuRect = menu[0].getBoundingClientRect();
		const parentRect = document.body.getBoundingClientRect();
		const left = Math.max(Math.min(event.clientX, parentRect.right - menuRect.width - 4), 0);
		const top = Math.max(Math.min(event.clientY, parentRect.bottom - menuRect.height - 4), 0);

		menu.css({
			left: left,
			top: top,
			visibility: "visible",
		}).data('dropdown').close(true);
		$("#macroBackgroundContextToggle").click();
	}
}

window.ExportAll = function()
{
	var blob = new Blob([JSON.stringify(buttonsarray, null, 2)], {type: "plain/text"});
	var date = new Date();

	invokeSaveAsDialog(blob, 'macro-backup-' + date.yyyymmdd() + '.json');
}

function FileReadError(message)
{
	if (message == undefined)
	{
		message = "Unspecified Error";
	}
	Metro.dialog.create({
		title: "File read error",
		clsDialog: "dark",
		width: 600,
		content: escapeHTML(message),
		dataToTop: true,
		actions: [{
				caption: "OK",
				cls: "js-dialog-close alert",
				onclick: function() {}
			}
		]
	});
}

function ImportAll(event)
{
	var files = event.target.files || event.dataTransfer.files;
	var file = files[0];
	document.getElementById('macroImportAllFile').value = '';
	if (file)
	{
		var reader = new FileReader();
		reader.readAsText(file);
		reader.onload = function()
		{
			var newButtons = undefined;
			try
			{
				newButtons = JSON.parse(this.result);
			}
			catch (error)
			{
				FileReadError(error.message);
			}
			if (newButtons && Array.isArray(newButtons))
			{
				buttonsarray = newButtons;
				populateMacroButtons();
			}
			else
			{
				FileReadError("JSON error: Invalid list of macros.");
			}
		}
		reader.onerror = function()
		{
			FileReadError(reader.error.message);
		}
	}
}

window.MoveMacro = function(direction)
{
	var index = g_SelectedMacro;
	g_SelectedMacro = undefined;

	var button = buttonsarray[index];
	if (direction == -1) {
		// find the previous visible button and move before it. there must be one or the option won't be available
		for (var i = index - 1; i >= 0; i--) {
			if (IsButtonVisible(buttonsarray[i])) {
				buttonsarray.splice(index, 1);
				buttonsarray.splice(i, 0, button);
				populateMacroButtons();
				return;
			}
		}
	}
	if (direction == 1) {
		// find the next visible button and move after it. there must be one or the option won't be available
		for (var i = index + 1; i < buttonsarray.length; i++) {
			if (IsButtonVisible(buttonsarray[i])) {
				buttonsarray.splice(index, 1);
				buttonsarray.splice(i, 0, button);
				populateMacroButtons();
				return;
			}
		}
	}
}

window.EditMacro = function()
{
	edit(g_SelectedMacro);
	g_SelectedMacro = undefined;
}

window.BackupMacro = function()
{
	backupMacro(g_SelectedMacro);
	g_SelectedMacro = undefined;
}

window.ConfirmMacroDelete = function()
{
	confirmMacroDelete(g_SelectedMacro);
	g_SelectedMacro = undefined;
}

function populateMacroButtonsNew(firstRun)
{
	if (!firstRun)
	{
		// add new buttons to the current group
		var activeIdx = g_TabVisibility == 0 ? 0 : Math.max(0, g_GroupsLower.indexOf(g_CurrentGroupLower));
		for (var i = g_ButtonCount; i < buttonsarray.length; i++)
		{
			buttonsarray[i].group = g_Groups[activeIdx];
		}
	}
	g_ButtonCount = buttonsarray.length;

	populateMacroButtonsOld(firstRun);
	RebuildGroupUI();
}

function setMacroContextMenuPositionNew(buttonIdx)
{
	g_SelectedMacro = buttonIdx;

	// find where the button is in the visible order
	var visIdx = undefined;
	var visCount = 0;
	for (var i = 0; i < buttonsarray.length; i++)
	{
		if (IsButtonVisible(buttonsarray[i]))
		{
			if (i == buttonIdx)
			{
				visIdx = visCount;
			}
			visCount++;
		}
	}
	if (visIdx == undefined || visIdx == 0)
	{
		$('#moveMacroLeft').addClass('disabled');
	}
	else
	{
		$('#moveMacroLeft').removeClass('disabled');
	}

	if (visIdx == undefined || visIdx == visCount - 1)
	{
		$('#moveMacroRight').addClass('disabled');
	}
	else
	{
		$('#moveMacroRight').removeClass('disabled');
	}

	var menu = $("#macroContextMenuNew");
	menu.css({
		visibility: "hidden",
		display: "block",
	});
	const offset = $("#macroBtn" + buttonIdx).offset();
	const menuRect = menu[0].getBoundingClientRect();
	const parentRect = document.body.getBoundingClientRect();
	const left = Math.max(Math.min(offset.left + 20, parentRect.right - menuRect.width - 4), 0);
	const top = Math.max(Math.min(offset.top + 20, parentRect.bottom - menuRect.height - 4), 0);

	menu.css({
		left: left,
		top: top,
		visibility: "visible",
	}).data('dropdown').close(true);
	$("#macroContextToggle").click();
}

const contextMenusHtml = `
<div id="macroBackgroundContextToggle"/>
<ul class="d-menu context drop-shadow pos-fixed" id="macroBackgroundContextMenu" data-role="dropdown" data-toggle-element="#macroBackgroundContextToggle">
	<li id="macroHorGroups"  onclick="SetMacroTabsVisibility(1)"><a href="#"><i class="mif-checkmark mif-1g icon"></i> Horizontal Group Tabs</a></li>
	<li id="macroVertGroups" onclick="SetMacroTabsVisibility(2)"><a href="#"><i class="mif-checkmark mif-1g icon"></i> Vertical Group Tabs</a></li>
	<li id="macroHideGroups" onclick="SetMacroTabsVisibility(0)"><a href="#"><i class="mif-checkmark mif-1g icon"></i> Disable Groups</a></li>
	<li class="divider"></li>
	<li onclick="ExportAll()"><a href="#"><i class="fas fa-save icon"></i> Export All Macros</a></li>
	<li class="btn-file" title=""><a href="#"><input class="btn-file" id="macroImportAllFile" type="file" accept=".json" /><i class="fas fa-upload icon"></i> Import All Macros</a></li>
</ul>

<div id="macroTabContextToggle" />
<ul class="d-menu context drop-shadow pos-fixed" id="macroTabContextMenu" data-role="dropdown" data-duration="40" data-toggle-element="#macroTabContextToggle">
	<li onclick="RenameSelectedGroup()"><a href="#">Rename Group</a></li>
</ul>

<div id="macroContextToggle" />
<ul class="d-menu context drop-shadow pos-fixed" id="macroContextMenuNew" data-role="dropdown" data-toggle-element="#macroContextToggle">
	<li onclick="EditMacro()"><a href="#"><i class="fas fa-edit icon"></i> Edit Macro</span></a></li>
	<li class="divider"></li>
	<li id="moveMacroLeft" onclick="MoveMacro(-1)"><a href="#"><i class='fas fa-fw fa-arrow-left icon'></i> Sort: Move Left</a></li>
	<li id="moveMacroRight" onclick="MoveMacro(1)"><a href="#"><i class='fas fa-fw fa-arrow-right icon'></i> Sort: Move Right</a></li>
	<li class="divider"></li>
	<li onclick="BackupMacro()"><a href="#"><i class="fas fa-save icon"></i> Export Macro</span></a></li>
	<li class="divider"></li>
	<li onclick="ConfirmMacroDelete()" class="fg-red"><a href="#"><i class="fas fa-trash icon"></i> Delete Macro</span></a></li>
	<li class="divider"></li>
	<li onclick="MoveMacroToGroup()"><a href="#"><i class="mif-books mif-1g icon" style="margin-top:-8px;"></i> Move To Group</span></a></li>
</ul>
`;

$(document).ready(function()
{
	CleanupOldVersion();

	var macrosElement = document.getElementById('macros');

	// create context menu for the background
	$('body').append(contextMenusHtml);

	$('#macroImportAllFile').on('change', ImportAll);

	// set default group for all buttons that don't have one
	for (var i = 0; i < buttonsarray.length; i++)
	{
		if (buttonsarray[i].group == undefined)
		{
			buttonsarray[i].group = "";
		}
	}
	g_ButtonCount = buttonsarray.length;
	RebuildGroupNames();

	// read and validate settings
	if (localStorage.getItem("MacroManagerSettings"))
	{
		var settings = JSON.parse(localStorage.getItem("MacroManagerSettings"));
		g_TabVisibility = typeof(settings.tabVisibility) == "number" ? settings.tabVisibility : 2;
		if (g_TabVisibility != 0 && typeof(settings.currentGroupLower) == "string" && g_GroupsLower.indexOf(settings.currentGroupLower) != -1)
		{
			g_CurrentGroupLower = settings.currentGroupLower;
		}
		else
		{
			g_CurrentGroupLower = "";
		}
	}

	// create vertical tabs
	$('#macros').before(`<ul id="macroVerticalTabs" data-tabs-position="vertical" data-role="tabs" data-expand="true" vertical></ul>`);

	// create horizontal tabs
	$('#macros').after(`<div id="macroHorizontalDiv" style="flex:1;"><ul id="macroHorizontalTabs" data-role="tabs" data-expand="true"></ul></div>`);
	$('#macroHorizontalDiv').append($('#macros'));

	// register background menu
	$('#macros').on('contextmenu', MacroBackgroundContextMenu);
	$('#macrostab').on('contextmenu', MacroBackgroundContextMenu);
	$('#macrostab').children().on('contextmenu', MacroBackgroundContextMenu);

	window.populateMacroButtonsOld = window.populateMacroButtons;
	window.populateMacroButtons = populateMacroButtonsNew;
	window.setMacroContextMenuPositionOld = window.setMacroContextMenuPosition;
	window.setMacroContextMenuPosition = setMacroContextMenuPositionNew;

	setTimeout(function()
	{
		// allow time for Metro to generate the tab structure
		SetMacroTabsVisibility(g_TabVisibility);
	}, 0);
});
