/* global global */
(function() {
	'use strict';

	var buster = require('buster');
	var assert = buster.assert;
	var refute = buster.refute;

	var GamepadSimulator = require('./GamepadSimulator.js');

	buster.testCase('WebKit', {
		setUp: function() {
			var simulator = new GamepadSimulator();
			var nullFunction = function() {};

			this.simulator = simulator;
			global.window = {
				navigator: {
					webkitGetGamepads: function() {
						return simulator.getGamepads();
					}
				}
			};

			this.listener = {
				_connect: nullFunction,
				_disconnect: nullFunction
			};

			this.Gamepad = require('../gamepad.js').Gamepad;
			this.platform = this.Gamepad.resolvePlatform(this.listener);
		},

		'should be supported by polling webkitGetGamepads()': function() {
			assert(this.platform.isSupported());
		},

		'should call nothing if list of gamepads stays empty': function() {
			var spy = this.spy(this.listener, '_connect');

			this.platform.update();
			this.platform.update();

			refute.called(spy);
		},

		'should report a connected gamepad if added': function() {
			var spy = this.spy(this.listener, '_connect');
			var gamepad = this.simulator.addGamepad(0, 'Testpad1');

			this.platform.update();

			assert.calledWith(spy, gamepad);
		},

		'should call nothing if list of gamepads remains same': function() {
			var spy = this.spy(this.listener, '_connect');
			this.simulator.addGamepad(0, 'Testpad1');

			this.platform.update();
			this.platform.update();

			assert.calledOnce(spy);
		},

		'should report a disconnected gamepad if removed': function() {
			var spy = this.spy(this.listener, '_disconnect');
			var gamepad = this.simulator.addGamepad(0, 'Testpad1');
			this.platform.update();

			this.simulator.removeGamepad(0);
			this.platform.update();

			assert.calledWith(spy, gamepad);
		},

		'should report a second connected gamepad if added': function() {
			var spy = this.spy(this.listener, '_connect');
			var gamepad = this.simulator.addGamepad(1, 'Testpad2');

			this.platform.update();

			assert.calledWith(spy, gamepad);
		},

		'should handle connection of second gamepad in same slot': function() {
			var spy = this.spy(this.listener, '_connect');

			this.simulator.addGamepad(0, 'Testpad1');
			this.platform.update();

			this.simulator.addGamepad(0, 'Testpad2');
			this.platform.update();

			assert.calledTwice(spy);
		},

		'should have type "WebKit"': function() {
			var result = this.platform.getType();

			assert.equals(result, 'WebKit');
		}

	});
})();
