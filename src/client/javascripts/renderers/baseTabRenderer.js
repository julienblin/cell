/**
 * Base class for project tabs renderers.
 * Subscribing to the 'render' event is essential, as well as emitting 'modified' when local data has been changed.
 */

var BaseTabRenderer = (function() {
    "use strict";

    return function(tabSelector, engine) {

        var self = {};
        self.__proto__ = BaseRenderer(engine);
        self.tabSelector = tabSelector;

        // Event subscriptions
        self.engine.on('modified', function() {
            if(self.isVisible()) {
                self.emit('render');
            }
        });

        $('a[data-toggle="tab"][href="' + tabSelector + '"]').on('shown', function() {
            self.emit('render');
        });

        // Public methods.
        self.isVisible = function() {
            return $(tabSelector).is(':visible');
        };

        return self;
    };
})();