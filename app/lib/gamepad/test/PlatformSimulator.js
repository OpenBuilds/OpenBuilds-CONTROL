(function() {
	'use strict';

	var PlatformSimulator = function(listener) {
		this.listener = listener;
		this.type = 'Simulator';
		this.mapping = null;
	};

	PlatformSimulator.prototype.getType = function() {
		return this.type;
	};

	PlatformSimulator.prototype.isSupported = function() {
		return true;
	};

	PlatformSimulator.prototype.update = function() {

	};

	module.exports = PlatformSimulator;
})();
