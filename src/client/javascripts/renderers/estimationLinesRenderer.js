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
                stretchV: 'all',
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
                    { data: 'computed.totalUT',     type: 'ut', readOnly: true },
                    { data: 'computed.totalPrice',  type: 'price', readOnly: true }
                ],
                cells: function (row, col, prop) {
                    var cellProperties = {};
                    var line = self.engine.data.estimationLines[row] || {};

                    if((line.lineType === 'headingTotal')
                     ||(line.lineType === 'heading1')
                     ||(line.lineType === 'heading2')) {
                        cellProperties.grandHeading = true;
                        cellProperties.readOnly = true;
                    }


                    if(typeof prop === 'function')
                        prop = prop(null, null, { propertyName: true });

                    switch(prop) {
                        case 'isActive':
                            if((line.lineType === 'headingTotal')
                             ||(line.lineType === 'heading1')
                             ||(line.lineType === 'heading2')) {
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
                                    cellProperties.paddingLeft = '15px';
                                    break;
                                case 'heading2':
                                    cellProperties.paddingLeft = '30px';
                                    break;
                                default:
                                    cellProperties.paddingLeft = '45px';
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
                        case 'computed.totalUT':
                        case 'computed.totalPrice':
                            cellProperties.computed = (line.id) && true;
                            break;
                    }

                    cellProperties.muted = (line.id) && !line.isActive;

                    return cellProperties;
                },
                contextMenu: {
                    items: {
                        'row_above': {
                            disabled: function() {
                                var row = $(self.gridSelector).handsontable('getSelected');
                                if(!row) return true;
                                row = row[0];
                                return row < 1;
                            }
                        },
                        'row_below': {},
                        'hsep1': '---------',
                        'set_heading1': {
                            name: 'Set as heading 1'
                        },
                        'set_heading2': {
                            name: 'Set as heading 2'
                        },
                        'set_standard': {
                            name: 'Set as standard line'
                        },
                        'hsep2': '---------',
                        'remove_row': {
                            disabled: function() {
                                var row = $(self.gridSelector).handsontable('getSelected');
                                if(!row) return true;
                                row = row[0];
                                return row < 1;
                            }
                        }
                    },
                    callback: function (key, options) {
                        if ((key === 'set_heading1') || (key === 'set_heading2') || (key === 'set_standard')) {
                            var row = $(self.gridSelector).handsontable('getSelected');
                            if(!row) return true;
                            row = row[0];

                            var line = self.engine.data.estimationLines[row];
                            if(line.id) {
                                var modification = {
                                    model: 'EstimationLine',
                                    action: 'update',
                                    id: line.id,
                                    property: 'lineType',
                                    oldValue: line.lineType
                                };
                                switch(key) {
                                    case 'set_heading1':
                                        modification.newValue = 'heading1';
                                        break;
                                    case 'set_heading2':
                                        modification.newValue = 'heading2';
                                        break;
                                    case 'set_standard':
                                        modification.newValue = null;
                                        break;
                                }
                                self.emit('applyModifications', [modification]);
                            }
                        }
                    }
                },
                beforeRender: function() {
                    _shadowData.estimationLines = _.clone(self.engine.data.estimationLines);
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
                },
                afterRemoveRow: function(index, amount) {
                    var linesToDelete = _shadowData.estimationLines.slice(index, index + amount);
                    var modifications = [];
                    _.each(linesToDelete, function(line, lineIndex) {
                        modifications.push({
                            model: 'EstimationLine',
                            id: line.id,
                            action: 'delete',
                            localInfo: {
                                alreadyApplied: true,
                                target: line,
                                position: (index + lineIndex)
                            }
                        });
                    });
                    self.emit('applyModifications', modifications);
                }
            });
            _cachedGrid = $(self.gridSelector).data('handsontable');
        });

        return self;
    }
})();
