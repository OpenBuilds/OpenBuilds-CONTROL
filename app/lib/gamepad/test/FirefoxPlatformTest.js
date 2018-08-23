/* global global */
(function() {
	'use strict';

	var buster = require('buster');
	var assert = buster.assert;

	var GamepadSimulator = require('./GamepadSimulator.js');

	buster.testCase('Firefox', {
		setUp: function() {
			var simulator = new GamepadSimulator();
			var nullFunction = function() {};

			this.simulator = simulator;
			global.window = {
				addEventListener: nullFunction,
				navigator: {
					userAgent: 'Firefox'
				}
			};

			this.listener = {
				_connect: nullFunction,
				_disconnect: nullFunction
			};

			this.Gamepad = require('../gamepad.js').Gamepad;
			this.platform = this.Gamepad.resolvePlatform(this.listener);
		},

		'should be supported': function() {
			assert(this.platform.isSupported());
		},

		'should have type "Firefox"': function() {
			var result = this.platform.getType();

			assert.equals(result, 'Firefox');
		}

	});
})();
