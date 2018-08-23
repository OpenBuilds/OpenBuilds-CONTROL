(function() {
	'use strict';

	var buster = require('buster');
	var assert = buster.assert;

	buster.testCase('Gamepad Interface', {
		setUp: function() {
			this.Gamepad = require('../gamepad.js').Gamepad;
		},

		'object': {
			setUp: function() {
				this.obj = new this.Gamepad(new this.Gamepad.UpdateStrategies.ManualUpdateStrategy());
			},

			'should be instantiable': function() {
				assert.isObject(this.obj);
			},

			'should provide init method': function() {
				assert.isFunction(this.obj.init);
			},

			'should provide bind method': function() {
				assert.isFunction(this.obj.bind);
			},

			'should provide unbind method': function() {
				assert.isFunction(this.obj.unbind);
			},

			'should provide count method': function() {
				assert.isFunction(this.obj.count);
			}
		}
	});
})();
