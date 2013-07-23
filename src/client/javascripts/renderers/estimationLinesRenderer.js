/**
 * Renderer for project estimation tab.
 */

var EstimationLinesRenderer = (function() {
    "use strict";

    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer('#estimations', engine);
        self.gridSelector = '#estimationsGrid';

        var _cachedGrid, _gridHelper, _currentPopoverCell;

        var _scalesSource = function() {
            return _.pluck(_.filter(self.engine.data.scales, function(value) { return value.id; }), 'name');
        };

        var _complexitySource = function(scaleId) {
            if(!scaleId) return null;
            var scale = self.engine.data.nav.scales[scaleId];
            if(!scale) return null;
            return _.pluck(_.filter(scale.lines, function(value) { return value.id; }), 'complexity');
        };

        var _dataScale = function scale(line, value, inverseGet) {
            var targetScale;
            if (inverseGet) {
                targetScale = _.findWhere(self.engine.data.scales, { name: value });
                return targetScale ? targetScale.id : null;
            }
            if(!line) line = {};
            if(typeof value === 'undefined') {
                targetScale = self.engine.data.nav.scales[line.scale];
                return targetScale ? targetScale.name : null;
            } else {
                targetScale = _.findWhere(self.engine.data.scales, { name: value });
                line.scale = targetScale ? targetScale.id : null;
            }
        };

        // Can bind to either complexity or fixedPrice, depending on the lineType.
        var _dataComplexity = function complexity(line, value, inverseGet) {
            var scale, scaleLine;
            if(!line) line = {};

            if (inverseGet) {
                if(line.lineType === 'fixedPrice') {
                    return value;
                } else {
                    scale = self.engine.data.nav.scales[line.scale];
                    if(!scale) return null;
                    scaleLine = _.findWhere(scale.lines, { complexity: value });
                    return scaleLine ? scaleLine.id : null;
                }
            }
            if(typeof value === 'undefined') {
                if(line.lineType === 'fixedPrice') {
                    return line.fixedPrice;
                } else {
                    scaleLine = self.engine.data.nav.scaleLines[line.complexity];
                    return scaleLine ? scaleLine.complexity : null;
                }
            } else {
                if(line.lineType === 'fixedPrice') {
                    line.fixedPrice = value;
                } else {
                    scale = self.engine.data.nav.scales[line.scale];
                    if(!scale) return null;
                    scaleLine = _.findWhere(scale.lines, { complexity: value });
                    line.complexity = scaleLine ? scaleLine.id : null;
                }
            }
        };

        // Event subscriptions
        self.on('render', function() {
            if(!_gridHelper) {
                _gridHelper = new GridHelper({
                    engine: self.engine,
                    modelName: 'EstimationLine',
                    dataCollection: self.engine.data.estimationLines,
                    defaultValues: {
                        isActive: true
                    },
                    beforeCreateModifications: function(change, target, property, oldValue, newValue) {
                        // We must alter the complexity property to bind to fixed price when needed.
                        if(!target) return [target, property, oldValue, newValue];
                        if(target.lineType !== 'fixedPrice') return [target, property, oldValue, newValue];
                        if(property !== 'complexity') return [target, property, oldValue, newValue];
                        return [
                            target,
                            'fixedPrice',
                            oldValue,
                            target.fixedPrice
                        ];
                    }
                });
            }

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
                        prop = prop.name;

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
                                cellProperties.grandHeading = true;
                                cellProperties.renderer = Handsontable.BlankRenderer;
                                cellProperties.readOnly = true;
                            } else {
                                cellProperties.grandHeading = false;
                                cellProperties.renderer = Handsontable.cellTypes.cellAutocomplete.renderer;
                                cellProperties.readOnly = self.engine.isReadOnly;
                                cellProperties.source = _scalesSource();
                            }
                            break;
                        case 'complexity':
                            if(line.lineType) {
                                if(line.lineType === 'fixedPrice') {
                                    cellProperties.renderer = Handsontable.cellTypes.price.renderer;
                                    cellProperties.readOnly = self.engine.isReadOnly;
                                } else {
                                    cellProperties.renderer = Handsontable.BlankRenderer;
                                    cellProperties.readOnly = true;
                                }
                            } else {
                                cellProperties.renderer = Handsontable.cellTypes.cellAutocomplete.renderer;
                                cellProperties.readOnly = self.engine.isReadOnly;
                                cellProperties.source = _complexitySource(line.scale);
                            }
                            break;
                        case 'coefficient':
                            if(line.lineType) {
                                if(line.lineType === 'fixedPrice') {
                                    cellProperties.renderer = Handsontable.cellTypes.cellNumeric.renderer;
                                    cellProperties.readOnly = self.engine.isReadOnly;
                                } else {
                                    cellProperties.renderer = Handsontable.BlankRenderer;
                                    cellProperties.readOnly = true;
                                }
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
                        'set_fixedPrice': {
                            name: 'Set as fixed price'
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
                        if ((key === 'set_heading1') || (key === 'set_heading2') || (key === 'set_fixedPrice') || (key === 'set_standard')) {
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
                                    case 'set_fixedPrice':
                                        modification.values.lineType[1] = 'fixedPrice';
                                        break;
                                }
                                self.engine.applyModifications([modification]);
                            }
                        }
                    }
                },
                beforeRender: _gridHelper.beforeRender,
                afterChange: _gridHelper.afterChange,
                afterRemoveRow: _gridHelper.afterRemoveRow,
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
