/**
 * Renderer for project estimation tab.
 */

var EstimationLinesRenderer = (function() {
    "use strict";

    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer('#estimations', engine);
        self.gridSelector = '#estimationsGrid';

        var _cachedGrid, _currentPopoverCell;
        var _shadowData = {};

        var _scalesSource = function() {
            return _.pluck(_.filter(self.engine.data.scales, function(value) { return value.id; }), 'name');
        };

        var _complexitySource = function(scaleId) {
            if(!scaleId) return null;
            var scale = self.engine.data.nav.scales[scaleId];
            if(!scale) return null;
            return _.pluck(_.filter(scale.lines, function(value) { return value.id; }), 'complexity');
        };

        var _dataScale = function(line, value, options) {
            var scale;
            if (options) {
                if (options.propertyName) return 'scale';
                if (options.inverseGet) {
                    scale = _.findWhere(self.engine.data.scales, { name: value });
                    return scale ? scale.id : null;
                }
            }
            if(!line) line = {};
            if(typeof value === 'undefined') {
                scale = self.engine.data.nav.scales[line.scale];
                return scale ? scale.name : null;
            } else {
                scale = _.findWhere(self.engine.data.scales, { name: value });
                line.scale = scale ? scale.id : null;
            }
        };

        var _dataComplexity = function(line, value, options) {
            var scale, scaleLine;
            if (options) {
                if (options.propertyName) return 'complexity';
                if (options.inverseGet) {
                    scale = self.engine.data.nav.scales[line.scale];
                    if(!scale) return null;
                    scaleLine = _.findWhere(scale.lines, { complexity: value });
                    return scaleLine ? scaleLine.id : null;
                }
            }
            if(!line) line = {};
            if(typeof value === 'undefined') {
                scaleLine = self.engine.data.nav.scaleLines[line.complexity];
                return scaleLine ? scaleLine.complexity : null;
            } else {
                scale = self.engine.data.nav.scales[line.scale];
                if(!scale) return null;
                scaleLine = _.findWhere(scale.lines, { complexity: value });
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
                    { data: 'isActive',                 type: 'cellCheckbox',     readOnly: self.engine.isReadOnly },
                    { data: 'title',                    type: 'title',            readOnly: self.engine.isReadOnly },
                    { data: _dataScale,                 type: 'cellAutocomplete', readOnly: self.engine.isReadOnly},
                    { data: _dataComplexity,            type: 'cellAutocomplete', readOnly: self.engine.isReadOnly},
                    { data: 'coefficient',              type: 'cellNumeric',      readOnly: self.engine.isReadOnly },
                    { data: 'computed.lineTotalUT',     type: 'ut',               readOnly: true },
                    { data: 'computed.lineTotalPrice',  type: 'price',            readOnly: true }
                ],
                cells: function(row, col, prop) {
                    var cellProperties = {};
                    var line = self.engine.data.estimationLines[row] || {};

                    if((line.lineType === 'headingTotal')
                     ||(line.lineType === 'heading1')
                     ||(line.lineType === 'heading2')) {
                        cellProperties.grandHeading = true;
                    } else {
                        cellProperties.grandHeading = false;
                    }

                    if(typeof prop === 'function')
                        prop = prop(null, null, { propertyName: true });

                    switch(prop) {
                        case 'isActive':
                            if((line.lineType === 'headingTotal')
                             ||(line.lineType === 'heading1')
                             ||(line.lineType === 'heading2')) {
                                cellProperties.renderer = Handsontable.BlankRenderer;
                                cellProperties.readOnly = true;
                            } else {
                                cellProperties.renderer = Handsontable.cellTypes.cellCheckbox.renderer;
                                cellProperties.readOnly = self.engine.isReadOnly;
                            }
                            break;
                        case 'title':
                            cellProperties.invalid = (line.id) && !(line.title);
                            switch(line.lineType) {
                                case 'headingTotal':
                                    cellProperties.paddingLeft = '2px';
                                    cellProperties.readOnly = true;
                                    break;
                                case 'heading1':
                                    cellProperties.paddingLeft = '15px';
                                    cellProperties.readOnly = true;
                                    break;
                                case 'heading2':
                                    cellProperties.paddingLeft = '30px';
                                    cellProperties.readOnly = true;
                                    break;
                                default:
                                    cellProperties.paddingLeft = '45px';
                                    cellProperties.readOnly = self.engine.isReadOnly;
                                    break;
                            }
                            break;
                        case 'scale':
                            if(line.lineType) {
                                cellProperties.renderer = Handsontable.BlankRenderer;
                                cellProperties.readOnly = true;
                            } else {
                                cellProperties.renderer = Handsontable.cellTypes.cellAutocomplete.renderer;
                                cellProperties.readOnly = self.engine.isReadOnly;
                                cellProperties.source = _scalesSource();
                            }
                            break;
                        case 'complexity':
                            if(line.lineType) {
                                cellProperties.renderer = Handsontable.BlankRenderer;
                                cellProperties.readOnly = true;
                            } else {
                                cellProperties.renderer = Handsontable.cellTypes.cellAutocomplete.renderer;
                                cellProperties.readOnly = self.engine.isReadOnly;
                                cellProperties.source = _complexitySource(line.scale);
                            }
                            break;
                        case 'coefficient':
                            if(line.lineType) {
                                cellProperties.renderer = Handsontable.BlankRenderer;
                                cellProperties.readOnly = true;
                            } else {
                                cellProperties.renderer = Handsontable.cellTypes.cellNumeric.renderer;
                                cellProperties.readOnly = self.engine.isReadOnly;
                            }
                            break;
                        case 'computed.lineTotalUT':
                        case 'computed.lineTotalPrice':
                            cellProperties.computed = (line.id) && true;
                            break;
                    }

                    cellProperties.muted = (line.id) && !line.isActive;
                    return cellProperties;
                },
                contextMenu: self.engine.isReadOnly ? null : {
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
                                    values: {
                                        lineType: [line.lineType, null]
                                    }
                                };
                                switch(key) {
                                    case 'set_heading1':
                                        modification.values.lineType[1] = 'heading1';
                                        break;
                                    case 'set_heading2':
                                        modification.values.lineType[1] = 'heading2';
                                        break;
                                }
                                self.engine.applyModifications([modification]);
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
                                    var modif = {
                                        model: 'EstimationLine',
                                        id: line.id,
                                        action: 'update',
                                        values: {}
                                    };
                                    modif.values[property] = [oldValue, newValue];
                                    modifications.push(modif);
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
                            self.engine.applyModifications(modifications);
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
                    self.engine.applyModifications(modifications);
                },
                afterSelectionEnd: function(row, col, endRow, endCol) {
                    if(_currentPopoverCell) {
                        $(_currentPopoverCell).popover('destroy');
                        _currentPopoverCell = null;
                    }

                    if(((col === 5) || (col === 6)) && (col === endCol)) {
                        var cell = _cachedGrid.getCell(row, col);
                        var line = self.engine.data.estimationLines[row];
                        if(!line.id && !line.lineType) return;
                        var profileProjects = _.map(self.engine.data.profileProjects, function(profileProject) {
                            if(!(profileProject.id && profileProject.title)) return;
                            return {
                                title: profileProject.title,
                                lineTotalUT: line.computed.profileProjects[profileProject.id] ? numeral(line.computed.profileProjects[profileProject.id].lineTotalUT).format('0.0') : 0,
                                lineTotalPrice: line.computed.profileProjects[profileProject.id] ? numeral(line.computed.profileProjects[profileProject.id].lineTotalPrice).format('0,0.0') : 0
                            };
                        });
                        if(profileProjects.length === 0) return;

                        $(cell).popover({
                            title: line.title,
                            content: self.getTemplate('#estimationLines-details-template')({ profileProjects: profileProjects }),
                            placement: 'left',
                            container: self.tabSelector,
                            html: true
                        });
                        _currentPopoverCell = cell;
                    }
                },
                afterDeselect: function() {
                    if(_currentPopoverCell) {
                        $(_currentPopoverCell).popover('destroy');
                        _currentPopoverCell = null;
                    }
                }
            });
            _cachedGrid = $(self.gridSelector).data('handsontable');
        });

        return self;
    };
})();
