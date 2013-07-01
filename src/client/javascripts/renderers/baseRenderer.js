/**
 * Base class renderers.
 */

var BaseRenderer = (function() {
    return function(engine) {

        var self = {};
        self.__proto__ = EventEmitter();
        self.engine = engine;

        var _compiledTemplates = {};

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