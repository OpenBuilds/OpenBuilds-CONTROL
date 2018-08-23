/* global global */

(function() {
	'use strict';

	var buster = require('buster');
	var assert = buster.assert;
	var refute = buster.refute;

	buster.testCase('Platform', {
		setUp: function() {
			this.Gamepad = require('../gamepad.js').Gamepad;
			this.obj = new this.Gamepad(new this.Gamepad.UpdateStrategies.ManualUpdateStrategy());
		},

		'unsupported should cause init() to return false': function() {
			global.window = {
				navigator: {}
			};
			var result = this.obj.init();

			refute(result);
		},

		'Gamepad.getNullPlatform()': {
			setUp: function() {
				this.platform = this.Gamepad.getNullPlatform();
			},

			'should return an object': function() {
				assert.isObject(this.platform);
			},

			'should return false for isSupported()': function() {
				refute(this.platform.isSupported());
			},

			'should provide update method': function() {
				assert.isFunction(this.platform.update);
			},

			'should provide an immutable object': function() {
				this.platform.isSupported = function() {
					return true;
				};

				var newObject = this.Gamepad.getNullPlatform();

				refute.same(newObject, this.platform);
			}
		},

		'Gamepad.resolvePlatform()': {
			setUp: function() {
				this.PlatformFactories = this.Gamepad.PlatformFactories;
			},

			tearDown: function() {
				this.Gamepad.PlatformFactories = this.PlatformFactories;
				delete global.window;
			},

			'should provide unsupported platform when no factories available': function() {
				this.Gamepad.PlatformFactories = [];

				var platform = this.Gamepad.resolvePlatform();

				refute(platform.isSupported());
			},

			'should provide platform for polling window.navigator.webkitGamepads array': function() {
				global.window = {
					navigator: {
						webkitGamepads: [1, 2, 3]
					}
				};

				var platform = this.Gamepad.resolvePlatform();

				assert(platform.isSupported());
			},

			'should provide platform for polling window.navigator.getGamepads() function': function() {
				global.window = {
					navigator: {
						getGamepads: function() {
							return ['game1'];
						}
					}
				};

				var platform = this.Gamepad.resolvePlatform();

				assert(platform.isSupported());
				assert(platform.gamepadGetter()[0] === 'game1');
			},

			'should provide platform for polling window.navigator.webkitGamepads() function': function() {
				global.window = {
					navigator: {
						webkitGamepads: function() {
							return ['game1'];
						}
					}
				};

				var platform = this.Gamepad.resolvePlatform();

				assert(platform.isSupported());
				assert(platform.gamepadGetter()[0] === 'game1');
			},

			'should provide platform for polling window.navigator.webkitGetGamepads() function': function() {
				global.window = {
					navigator: {
						webkitGetGamepads: function() {
							return ['game1'];
						}
					}
				};

				var platform = this.Gamepad.resolvePlatform();

				assert(platform.isSupported());
				assert(platform.gamepadGetter()[0] === 'game1');
			},

			'should provide platform for Firefox': function() {
				global.window = {
					addEventListener: function() {},
					navigator: {
						userAgent: 'Firefox'
					}
				};

				var platform = this.Gamepad.resolvePlatform();

				assert(platform.isSupported());
			}

		}
	});
})();
