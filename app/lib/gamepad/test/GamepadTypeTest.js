(function() {
	'use strict';

	var buster = require('buster');
	var assert = buster.assert;

	var GamepadSimulator = require('./GamepadSimulator.js');
	var PlatformSimulator = require('./PlatformSimulator.js');
	var GamepadUser = require('./GamepadUser.js');

	buster.testCase('Gamepad', {
		setUp: function() {
			var gamepadSimulator = new GamepadSimulator();
			var that = this;

			this.gamepadSimulator = gamepadSimulator;

			this.Gamepad = require('../gamepad.js').Gamepad;
			this.PlatformFactories = this.Gamepad.PlatformFactories;

			this.Gamepad.PlatformFactories = [
				function(listener) {
					var platform = that.platform = new PlatformSimulator(listener);

					return platform;
				}
			];

			this.updater = new this.Gamepad.UpdateStrategies.ManualUpdateStrategy();

			this.obj = new this.Gamepad(this.updater);
			this.user = new GamepadUser(this.Gamepad.Event, this.obj);
			this.obj.init();
		},

		tearDown: function() {
			this.Gamepad.PlatformFactories = this.PlatformFactories;
		},

		'should cause CONNECTED event when XBOX type added': function() {
			var spy = this.spy(this.user, 'onConnected');
			var gamepad = this.gamepadSimulator.addGamepad(0, 'xbox gamepad identificaiton');

			this.platform.listener._connect(gamepad);

			assert.calledWith(spy, gamepad);
		},

		'should cause CONNECTED event when platform resolves mapping': function() {
			var spy = this.spy(this.user, 'onConnected');
			var gamepad = this.gamepadSimulator.addGamepad(0, 'playstation thingie');

			this.platform.mapping = {};
			this.platform.listener._connect(gamepad);

			assert.calledWith(spy, gamepad);
		}
	});
})();
