/**
 * Helper for grids - factorise some common patterns
 */

window.GridHelper = (function() {
    "use strict";

    return function(options) {
        var self = {};
        self.shadowData = [];

        if(!options.defaultValues) options.defaultValues = {};

        self.beforeRender = function() {
            self.shadowData = _.clone(options.dataCollection);
        };

        self.afterChange = function(changes, operation) {
            switch(operation) {
                case 'edit':
                case 'autofill':
                case 'paste':
                    var modifications = [];
                    _.each(changes, function(change) {
                        var target = options.dataCollection[change[0]];
                        var property = change[1];
                        var oldValue = change[2];
                        var newValue = change[3];
                        if(typeof change[1] === 'function') {
                            property = change[1].name;
                            oldValue = change[1](target, change[2], true);
                            newValue = target[property];
                        }
                        if (target.id) {
                            var modif = {
                                model: options.modelName,
                                id: target.id,
                                action: 'update',
                                values: {},
                                localInfo: {
                                    alreadyApplied: true,
                                    target: target
                                }
                            };
                            if(options.parentId)
                                modif.parentId = options.parentId;
                            modif.values[property] = [oldValue, newValue];
                            modifications.push(modif);
                        } else {
                            var createModif = {
                                model: options.modelName,
                                action: 'create',
                                values: {},
                                localInfo: {
                                    alreadyApplied: true,
                                    target: target
                                }
                            };
                            if(options.parentId)
                                createModif.parentId = options.parentId;
                            createModif.values[property] = newValue;

                            for(var defaultProperty in options.defaultValues) {
                                if(property != defaultProperty) {
                                    target[defaultProperty] = options.defaultValues[defaultProperty];
                                    createModif.values[defaultProperty] = options.defaultValues[defaultProperty];
                                }
                            }

                            if(change[0] > 0) {
                                createModif.insertAfter = options.dataCollection[change[0] - 1].id;
                            }
                            modifications.push(createModif);
                        }
                    });
                    options.engine.applyModifications(modifications);
                    break;
            }
        };

        self.afterRemoveRow = function(index, amount) {
            var targetsToDelete = self.shadowData.slice(index, index + amount);
            var modifications = [];
            _.each(targetsToDelete, function(target, targetIndex) {
                var modif = {
                    model: options.modelName,
                    id: target.id,
                    action: 'delete',
                    localInfo: {
                        alreadyApplied: true,
                        target: target,
                        position: (index + targetIndex)
                    }
                };
                if(options.parentId)
                    modif.parentId = options.parentId;
                modifications.push(modif);
            });
            options.engine.applyModifications(modifications);
        };

        return self;
    };
})();