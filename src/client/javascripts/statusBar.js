/**
 * Manages the status bar (bottom of the page).
 */

/*global $:false */

var StatusBar = (function() {
    "use strict";

    return function() {

        var self = {};
        self.__proto__ = EventEmitter();

        var _statusIconSelector = "#icon-status";

        $(_statusIconSelector).on('click', function(e) {
            self.emit('requestStatus', e);
            e.preventDefault();
        });

        /**
         * Changes the icon in the status bar.
         * Possible values: ok, loading, error
         * @param status
         */
        self.changeIcon = function(status) {
            $(_statusIconSelector).removeClass();
            switch(status) {
                case 'ok':
                    $(_statusIconSelector).addClass('icon-ok');
                    break;
                case 'loading':
                    $(_statusIconSelector).addClass('icon-cog');
                    break;
                case 'error':
                    $(_statusIconSelector).addClass('icon-remove');
                    break;
            }
        };

        self.getStatusIconSelector = function() {
            return _statusIconSelector;
        };

        return self;
    };
})();

window.statusBar = new StatusBar();