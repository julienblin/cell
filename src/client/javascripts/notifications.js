/**
 * Manages notifications messages on the window.
 */

var NotificationCenter = (function() {
    "use strict";

    return function() {
        var self = {};

        var _createNotification = function(options) {
            var notif = $.pnotify(options);
            notif.dismiss = notif.pnotify_remove;
            notif.transform = function(options) {
                notif.pnotify(options);
            };
            return notif;
        };

        self.info = function(message, options) {
            if(!options) options = {};
            _.defaults(options, {
                text: message,
                type: 'info',
                history: false,
                nonblock: true,
                nonblock_opacity: 0.2
            });
            return _createNotification(options);
        };

        self.success = function(message, options) {
            if(!options) options = {};
            _.defaults(options, {
                text: message,
                type: 'success',
                history: false,
                nonblock: true,
                nonblock_opacity: 0.2
            });
            return _createNotification(options);
        };

        self.warning = function(message, options) {
            if(!options) options = {};
            _.defaults(options, {
                text: message,
                type: 'warning',
                history: false
            });
            return _createNotification(options);
        };

        self.error = function(message, options) {
            if(!options) options = {};
            _.defaults(options, {
                text: message,
                title: 'Error',
                type: 'error',
                history: false,
                hide: false
            });
            return _createNotification(options);
        };

        self.fatal = function(message, options) {
            if(!options) options = {};
            _.defaults(options, {
                text: message + "<br/>Please try to <strong><a href='javascript: location.reload();'>reload the page</a></strong>.",
                title: 'Fatal error',
                type: 'error',
                history: false,
                hide: false
            });
            return _createNotification(options);
        };

        return self;
    };
})();

window.notify = new NotificationCenter();