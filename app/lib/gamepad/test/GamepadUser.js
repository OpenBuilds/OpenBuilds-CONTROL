(function() {
	'use strict';

	var nullFunction = function() {};

	var GamepadUser = function(events, api) {
		var that = this;

		function binder(event, handlerName) {
			api.bind(event, function() {
				that[handlerName].apply(that, arguments);
			});
		}

		binder(events.CONNECTED, 'onConnected');
		binder(events.DISCONNECTED, 'onDisconnected');
		binder(events.BUTTON_DOWN, 'onButtonDown');
		binder(events.BUTTON_UP, 'onButtonUp');
		binder(events.AXIS_CHANGED, 'onAxisChanged');
	};

	GamepadUser.prototype.onConnected = nullFunction;
	GamepadUser.prototype.onDisconnected = nullFunction;
	GamepadUser.prototype.onButtonDown = nullFunction;
	GamepadUser.prototype.onButtonUp = nullFunction;
	GamepadUser.prototype.onAxisChanged = nullFunction;


	module.exports = GamepadUser;
})();
