/**
 * Base class for event emitters
 */

var EventEmitter = (function() {
    "use strict";

    return function() {
        var _events = {};

        var self = {};

        /**
         * Subscribe to an event
         * @param event
         * @param callback
         */
        self.on = function(event, callback) {
            _events[event] = _events[event] || [];
            _events[event].push(callback);
        };

        /**
         * Un-subscribe to an event
         * @param event
         * @param callback
         */
        self.off = function(event, callback) {
            if (!_events[event]) return;
            _events[event].splice(_events[event].indexOf(callback), 1);
        };

        /**
         * Emit an event.
         * @param event
         */
        self.emit = function(event) {
            if (!_events[event]) return;

            var callbackArguments = Array.prototype.slice.call(arguments, 1);
            _.each(_events[event], function(callback) {
                callback.apply(this, callbackArguments);
            });
        };

        return self;
    };
})();