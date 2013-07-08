/**
 * Renderer for project estimation tab.
 */

var EstimationLinesRenderer = (function() {
    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer('#estimations', engine);
        self.gridSelector = '#estimationsGrid';

        var _cachedGrid = null;
        var _shadowData = {};

        var _scalesSource = function() {
            return _.pluck(_.filter(self.engine.data.scales, function(value) { return value.id; }), 'name');
        };

        var _complexitySource = function(scaleId) {
            if(!scaleId) return null;
            var scale = _.findWhere(self.engine.data.scales, { id: scaleId });
            if(!scale) return null;
            return _.pluck(_.filter(scale.lines, function(value) { return value.id; }), 'complexity');
        };

        var _dataScale = function(line, value, options) {
            if (options) {
                if (options.propertyName) return 'scale';
                if (options.inverseGet) {
                    var scale = _.findWhere(self.engine.data.scales, { name: value });
                    return scale ? scale.id : null;
                }
            }
            if(!line) line = {};
            if(typeof value === 'undefined') {
                var scale = _.findWhere(self.engine.data.scales, { id: line.scale });
                return scale ? scale.name : null;
            } else {
                var scale = _.findWhere(self.engine.data.scales, { name: value });
                line.scale = scale ? scale.id : null;
            }
        };

        var _dataComplexity = function(line, value, options) {
            if (options) {
                if (options.propertyName) return 'complexity';
                if (options.inverseGet) {
                    var scale = _.findWhere(self.engine.data.scales, { id: line.scale });
                    if(!scale) return null;
                    var scaleLine = _.findWhere(scale.lines, { complexity: value });
                    return scaleLine ? scaleLine.id : null;
                }
            }
            if(!line) line = {};
            if(typeof value === 'undefined') {
                var scale = _.findWhere(self.engine.data.scales, { id: line.scale });
                if(!scale) return null;
                var scaleLine = _.findWhere(scale.lines, { id: line.complexity });
                return scaleLine ? scaleLine.complexity : null;
            } else {
                var scale = _.findWhere(self.engine.data.scales, { id: line.scale });
                if(!scale) return null;
                var scaleLine = _.findWhere(scale.lines, { complexity: value });
                line.complexity = scaleLine ? scaleLine.id : null;
            }
        };

        // Event subscriptions
        self.on('render', function() {
            if(_cachedGrid) {
                _cachedGrid.render();
                return;
            }

            $(self.gridSelector).handsontable({
                data: self.engine.data.estimationLines,
                colHeaders: [ "Act.", "Title", "Scale", "Complexity", "Coeff.", "Total UT", "Total $" ],
                colWidths:  [15, 600, 60, 60, 20, 30, 30],
                stretchH: 'all',
                rowHeaders: true,
                minSpareRows: 1,
                columns: [
                    { data: 'isActive',    type: 'cellCheckbox' },
                    { data: 'title',       type: 'title' },
                    { data: _dataScale,       type: {
                        renderer: function(instance, td, row, col, prop, value, cellProperties) {
                            Handsontable.AutocompleteCell.renderer.apply(this, arguments);
                            Handsontable.CustomCellPropertiesRenderer(instance, td, row, col, prop, value, cellProperties);
                        },
                        editor: Handsontable.AutocompleteEditor,
                        source: _scalesSource
                    }},
                    { data: _dataComplexity,  type: {
                        renderer: function(instance, td, row, col, prop, value, cellProperties) {
                            Handsontable.AutocompleteCell.renderer.apply(this, arguments);
                            Handsontable.CustomCellPropertiesRenderer(instance, td, row, col, prop, value, cellProperties);
                        },
                        editor: Handsontable.AutocompleteEditor
                    }},
                    { data: 'coefficient', type: 'cellNumeric' },
                    { data: 'totalUT',     type: 'ut', readOnly: true },
                    { data: 'totalPrice',  type: 'price', readOnly: true }
                ],
                cells: function (row, col, prop) {
                    var cellProperties = {};
                    var line = self.engine.data.estimationLines[row] || {};

                    if(line.lineType === 'headingTotal') {
                        cellProperties.grandHeading = true;
                        cellProperties.readOnly = true;
                    }

                    if(typeof prop === 'function')
                        prop = prop(null, null, { propertyName: true });

                    switch(prop) {
                        case 'isActive':
                            if(line.lineType === 'headingTotal') {
                                cellProperties.renderer = Handsontable.BlankRenderer;
                            }
                            break;
                        case 'title':
                            cellProperties.invalid = (line.id) && !(line.title);
                            switch(line.lineType) {
                                case 'headingTotal':
                                    cellProperties.paddingLeft = '2px';
                                    break;
                                case 'heading1':
                                    cellProperties.paddingLeft = '10px';
                                    break;
                                case 'heading2':
                                    cellProperties.paddingLeft = '20px';
                                    break;
                                default:
                                    cellProperties.paddingLeft = '30px';
                                    break;
                            }
                            break;
                        case 'scale':
                            if(line.lineType) {
                                cellProperties.renderer = Handsontable.BlankRenderer;
                                cellProperties.readOnly = true;
                            }
                            break;
                        case 'complexity':
                            if(line.lineType) {
                                cellProperties.renderer = Handsontable.BlankRenderer;
                                cellProperties.readOnly = true;
                            } else {
                                cellProperties.source = _complexitySource(line.scale);
                            }
                            break;
                        case 'coefficient':
                            if(line.lineType) {
                                cellProperties.renderer = Handsontable.BlankRenderer;
                                cellProperties.readOnly = true;
                            }
                            break;
                        case 'totalUT':
                        case 'totalPrice':
                            cellProperties.computed = (line.id) && true;
                            break;
                    }

                    cellProperties.muted = (line.id) && !line.isActive;

                    return cellProperties;
                },
                afterChange: function(changes, operation) {
                    switch(operation) {
                        case 'edit':
                        case 'autofill':
                        case 'paste':
                            var modifications = [];
                            _.each(changes, function(change) {
                                var line = self.engine.data.estimationLines[change[0]];
                                var property = change[1];
                                var oldValue = change[2];
                                var newValue = change[3];
                                if(typeof change[1] === 'function') {
                                    property = change[1](null, null, { propertyName: true });
                                    oldValue = change[1](line, change[2], { inverseGet: true });
                                    newValue = line[property];
                                }
                                if (line.id) {
                                    modifications.push({
                                        model: 'EstimationLine',
                                        id: line.id,
                                        action: 'update',
                                        property: property,
                                        oldValue: oldValue,
                                        newValue: newValue,
                                        localInfo: {
                                            alreadyApplied: true,
                                            target: line
                                        }
                                    });
                                    if (property === 'scale') {
                                        // We also nullify the complexity.
                                        modifications.push({
                                            model: 'EstimationLine',
                                            id: line.id,
                                            action: 'update',
                                            property: 'complexity',
                                            oldValue: line.complexity,
                                            newValue: null,
                                            localInfo: {
                                                target: line
                                            }
                                        });
                                    }
                                } else {
                                    var createModif = {
                                        model: 'EstimationLine',
                                        action: 'create',
                                        values: {},
                                        localInfo: {
                                            alreadyApplied: true,
                                            target: line
                                        }
                                    };
                                    createModif.values[property] = newValue;
                                    if(property !== 'isActive') {
                                        line.isActive = true;
                                        createModif.values.isActive = true;
                                    }
                                    if(change[0] > 0) {
                                        createModif.insertAfter = self.engine.data.estimationLines[change[0] - 1].id;
                                    }
                                    modifications.push(createModif);
                                }
                            });
                            self.emit('applyModifications', modifications);
                            break;
                    }
                }
            });
            _cachedGrid = $(self.gridSelector).data('handsontable');
        });

        // Prevents clipping of dropdowns inside the grid
        $(self.gridSelector).on('click', '.htAutocomplete', function(e) {
            var dropDown = $('.handsontableInputHolder');
            if(dropDown.length === 1) {
                $('.wtHider', self.gridSelector).css('min-height', $(dropDown[0]).height() + 200 + 'px');
                e.preventDefault();
            }
        });

        return self;
    }
})();
