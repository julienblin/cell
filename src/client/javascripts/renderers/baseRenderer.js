/**
 * Base class for project renderers.
 * Subscribing to the 'render' event is essential, as well as emitting 'modified' when local data has been changed.
 */

var BaseRenderer = (function() {
    return function(tabSelector, engine) {

        var self = {};
        self.__proto__ = EventEmitter();
        self.engine = engine;
        self.tabSelector = tabSelector;

        var _compiledTemplates = {};

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

        /**
         * Returns a handlebars compiled templates - templates are cached.
         */
        self.getTemplate = function(templateSelector) {
            if(!_compiledTemplates[templateSelector]) {
                _compiledTemplates[templateSelector] = Handlebars.compile($(templateSelector).html());
            }
            return _compiledTemplates[templateSelector];
        };

        return self;
    };
})();