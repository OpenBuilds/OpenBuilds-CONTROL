(function() {
	'use strict';

	var Gamepad = function(index, id, buttonCount, axisCount) {
		this.index = index;
		this.id = id;

		this.buttons = [];
		while (this.buttons.length < (buttonCount || 16)) {
			this.buttons.push(0.0);
		}
		this.axes = [];
		while (this.axes.length < (axisCount || 4)) {
			this.axes.push(0.0);
		}
	};

	var GamepadSimulator = function() {
		this.gamepads = [];
	};

	GamepadSimulator.prototype.getGamepads = function() {
		return this.gamepads;
	};

	GamepadSimulator.prototype.addGamepad = function(index, id, buttonCount, axisCount) {
		var gamepad = new Gamepad(index, id, buttonCount, axisCount);

		while (index >= this.gamepads.length) {
			this.gamepads.push(null);
		}
		this.gamepads[index] = gamepad;

		return gamepad;
	};

	GamepadSimulator.prototype.removeGamepad = function(index) {
		this.gamepads[index] = null;
	};

	module.exports = GamepadSimulator;
})();
