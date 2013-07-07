/**
 * Renderer for project estimation tab.
 */

var EstimationLinesRenderer = (function() {
    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer('#estimations', engine);
        self.gridSelector = '#estimationsGrid';

        var _cachedGrid = null;

        var _scalesSource = function() {
            return _.pluck(_.filter(self.engine.data.scales, function(value) { return value.id; }), 'name');
        };

        var _complexitySource = function(scaleId) {
            if(!scaleId) return null;
            var scale = _.findWhere(self.engine.data.scales, { id: scaleId });
            if(!scale) return null;
            return _.pluck(_.filter(scale.lines, function(value) { return value.id; }), 'complexity');
        };

        var _dataScale = function() {
            return function(line, value) {
                if(!line) line = {};
                if(typeof value === 'undefined') {
                    var scale = _.findWhere(self.engine.data.scales, { id: line.scale });
                    return scale ? scale.name : null;
                } else {
                    var scale = _.findWhere(self.engine.data.scales, { name: value });
                    line.scale = scale ? scale.id : null;
                }
            };
        };

        var _dataComplexity = function() {
            return function(line, value) {
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
                colWidths:  [15, 600, 50, 50, 30, 30, 30],
                stretchH: 'all',
                rowHeaders: true,
                minSpareRows: 1,
                columns: [
                    { data: 'isActive',    type: 'cellCheckbox' },
                    { data: 'title',       type: 'title' },
                    { data: _dataScale(),       type: {
                        renderer: function(instance, td, row, col, prop, value, cellProperties) {
                            Handsontable.AutocompleteCell.renderer.apply(this, arguments);
                            Handsontable.CustomCellPropertiesRenderer(instance, td, row, col, prop, value, cellProperties);
                        },
                        editor: Handsontable.AutocompleteEditor,
                        source: _scalesSource
                    }},
                    { data: _dataComplexity(),  type: {
                        renderer: function(instance, td, row, col, prop, value, cellProperties) {
                            Handsontable.AutocompleteCell.renderer.apply(this, arguments);
                            Handsontable.CustomCellPropertiesRenderer(instance, td, row, col, prop, value, cellProperties);
                        },
                        editor: Handsontable.AutocompleteEditor
                    }},
                    { data: 'coefficient', type: 'text' },
                    { data: 'totalUT',     type: 'ut', readOnly: true },
                    { data: 'totalPrice',  type: 'price', readOnly: true }
                ],
                cells: function (row, col, prop) {
                    var cellProperties = {};
                    var line = self.engine.data.estimationLines[row] || {};
                    if(col === 3) {
                        cellProperties.source = _complexitySource(line.scale);
                    }
                    return cellProperties;
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
