(function() {
	'use strict';

	var buster = require('buster');
	var assert = buster.assert;

	buster.testCase('ButtonGetter', {
		setUp: function() {
			this.Gamepad = require('../gamepad.js').Gamepad;

			this.updater = new this.Gamepad.UpdateStrategies.ManualUpdateStrategy();
			this.obj = new this.Gamepad(this.updater);
		},


		'value by button': {
			setUp: function() {
				var buttons = {
					byButton: [0]
				};

				this.gamepad = {
					buttons: ['uninitialized']
				};


				this.getter = this.obj._createButtonGetter(this.gamepad, buttons, 0);
			},

			'should be 0 if the raw value is 0': function() {
				this.gamepad.buttons[0] = 0;

				var result = this.getter();

				assert.equals(result, 0);
			},

			'should be 1 if the raw value is 1': function() {
				this.gamepad.buttons[0] = 1;

				var result = this.getter();

				assert.equals(result, 1);
			},

			'should be 0.25 if the raw value is 0.25': function() {
				this.gamepad.buttons[0] = 0.25;

				var result = this.getter();

				assert.equals(result, 0.25);
			},

			'should read GamepadButton objects if available': function() {
				function GamepadButton(value) {
					this.value = value;
				}
				this.gamepad.buttons[0] = new GamepadButton(1);

				var result = this.getter();

				assert.equals(result, 1);
			}
		},

		'value by axis': {
			setUp: function() {
				this.buttons = {
					byButton: [-1],
					byAxis: ['uninitialized']
				};

				this.gamepad = {
					axes: ['uninitialized']
				};
			},

			'should be 0 for range 0..1 with raw value 0': function() {
				this.buttons.byAxis[0] = [0, 0, 1];
				var getter = this.obj._createButtonGetter(this.gamepad, this.buttons, 0);

				this.gamepad.axes[0] = 0;

				var result = getter();

				assert.equals(result, 0);
			},

			'should be 1 for range 0..1 with raw value 1': function() {
				this.buttons.byAxis[0] = [0, 0, 1];
				var getter = this.obj._createButtonGetter(this.gamepad, this.buttons, 0);

				this.gamepad.axes[0] = 1;

				var result = getter();

				assert.equals(result, 1);
			},

			'should be 0.25 for range 0..1 with raw value 0.25': function() {
				this.buttons.byAxis[0] = [0, 0, 1];
				var getter = this.obj._createButtonGetter(this.gamepad, this.buttons, 0);

				this.gamepad.axes[0] = 0.25;

				var result = getter();

				assert.equals(result, 0.25);
			},

			'should be 0 for range 0..-1 with raw value 0': function() {
				this.buttons.byAxis[0] = [0, 0, -1];
				var getter = this.obj._createButtonGetter(this.gamepad, this.buttons, 0);

				this.gamepad.axes[0] = 0;

				var result = getter();

				assert.equals(result, 0);
			},

			'should be 1 for range 0..-1 with raw value -1': function() {
				this.buttons.byAxis[0] = [0, 0, -1];
				var getter = this.obj._createButtonGetter(this.gamepad, this.buttons, 0);

				this.gamepad.axes[0] = -1;

				var result = getter();

				assert.equals(result, 1);
			},

			'should be 0 for range 0..1 with raw value -0.25': function() {
				this.buttons.byAxis[0] = [0, 0, 1];
				var getter = this.obj._createButtonGetter(this.gamepad, this.buttons, 0);

				this.gamepad.axes[0] = -0.25;

				var result = getter();

				assert.equals(result, 0);
			},

			'should be 0 for range 0..-1 with raw value 0.25': function() {
				this.buttons.byAxis[0] = [0, 0, -1];
				var getter = this.obj._createButtonGetter(this.gamepad, this.buttons, 0);

				this.gamepad.axes[0] = 0.25;

				var result = getter();

				assert.equals(result, 0);
			},

			// seen with PS3 buttons (extra buttons)
			'should be 0 for range -1..1 with raw value -1': function() {
				this.buttons.byAxis[0] = [0, -1, 1];
				var getter = this.obj._createButtonGetter(this.gamepad, this.buttons, 0);

				this.gamepad.axes[0] = -1;

				var result = getter();

				assert.equals(result, 0);
			},

			// seen with PS3 buttons (extra buttons)
			'should be 0.75 for range -1..1 with raw value 0.5': function() {
				this.buttons.byAxis[0] = [0, -1, 1];
				var getter = this.obj._createButtonGetter(this.gamepad, this.buttons, 0);

				this.gamepad.axes[0] = 0.5;

				var result = getter();

				assert.equals(result, 0.75);
			}

		}
	});
})();
