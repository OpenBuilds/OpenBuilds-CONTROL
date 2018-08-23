(function() {
	'use strict';

	var buster = require('buster');
	var assert = buster.assert;
	var refute = buster.refute;

	var GamepadSimulator = require('./GamepadSimulator.js');
	var PlatformSimulator = require('./PlatformSimulator.js');
	var GamepadUser = require('./GamepadUser.js');

	buster.testCase('Resolve Mapping', {
		'envMatchesFilter()': {
			setUp: function() {
				this.Gamepad = require('../gamepad.js').Gamepad;

			},

			'should return true for empty filter': function() {
				var filter = {};
				var env = {
					type: 'someType'
				};
				var result = this.Gamepad.envMatchesFilter(filter, env);

				assert(result);
			},

			'should return false for a filter property not found in env': function() {
				var filter = {
					type: 'logitech'
				};
				var env = {};
				var result = this.Gamepad.envMatchesFilter(filter, env);

				refute(result);
			},

			'should return false for a non matching filter property': function() {
				var filter = {
					type: 'logitech'
				};
				var env = {
					type: 'playstation'
				};
				var result = this.Gamepad.envMatchesFilter(filter, env);

				refute(result);
			},

			'should return false for partially not matching type': function() {
				var filter = {
					platform: 'WebKit',
					type: 'logitech'
				};
				var env = {
					platform: 'WebKit',
					type: 'playstation'
				};
				var result = this.Gamepad.envMatchesFilter(filter, env);

				refute(result);
			},

			'should return false for partially not matching platform': function() {
				var filter = {
					platform: 'Firefox',
					type: 'playstation'
				};
				var env = {
					platform: 'WebKit',
					type: 'playstation'
				};
				var result = this.Gamepad.envMatchesFilter(filter, env);

				refute(result);
			},

			'should return true for matching both': function() {
				var filter = {
					platform: 'Firefox',
					type: 'playstation'
				};
				var env = {
					platform: 'Firefox',
					type: 'playstation'
				};
				var result = this.Gamepad.envMatchesFilter(filter, env);

				assert(result);
			}
		},
		'method ': {
			setUp: function() {
				var gamepadSimulator = new GamepadSimulator();
				var that = this;

				this.gamepadSimulator = gamepadSimulator;

				this.Gamepad = require('../gamepad.js').Gamepad;

				this.Mappings = this.Gamepad.Mappings;
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
				this.Gamepad.Mappings = this.Mappings;
			},

			'should return standard mapping if specials empty ': function() {
				var gamepad = this.gamepadSimulator.addGamepad(0, 'Logitech stuff ');
				this.Gamepad.Mappings = [];

				var result = this.obj._resolveMapping(gamepad);

				assert.equals(result, this.Gamepad.StandardMapping);
			},

			// found under Windows with an old Logitech gamepad
			'should return standard mapping if id empty ': function() {
				var gamepad = this.gamepadSimulator.addGamepad(0, '');
				this.Gamepad.Mappings = [{
					env: {
						type: this.Gamepad.Type.LOGITECH
					}
				}];

				var result = this.obj._resolveMapping(gamepad);

				assert.equals(result, this.Gamepad.StandardMapping);
			},

			'should return mapping for type if matching': function() {
				var gamepad = this.gamepadSimulator.addGamepad(0, 'Playstation stuff');
				var logitechMapping = {
					env: {
						type: this.Gamepad.Type.PLAYSTATION
					}
				};
				this.Gamepad.Mappings = [logitechMapping];

				var result = this.obj._resolveMapping(gamepad);

				assert.equals(result, logitechMapping);
			}
		}
	});

})();
