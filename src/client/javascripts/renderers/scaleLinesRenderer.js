/**
 * Renderer for project scale lines - nested under ScalesRenderer.
 */

var ScaleLinesRenderer = (function() {
    return function(scale, engine) {
        var self = {};

        self.__proto__ = BaseRenderer(engine);
        self.scale = scale;
        if(!self.scale.lines) self.scale.lines = [];
        if(!self.scale.columns) self.scale.columns = [];
        self.gridSelector = '#gridScale' + scale.id;
        var _cachedGrid = null;

        var _getProfiles = function() {
            return _.compact(_.pluck(self.engine.data.profiles, 'title'));
        };

        var _getColHeaders = function() {
            var headers = [ "Act.", "Complexity" ];
            _.each(self.scale.columns, function(column) { headers.push(column[0]); });
            headers.push("");
            headers.push("Total UT");
            headers.push("Total $");
            return headers;
        };

        var _getColumns = function() {
            var columns = [
                { data: 'isActive', type: 'cellCheckbox' },
                { data: 'complexity', type: 'title' }
            ];

            _.each(self.scale.columns, function(column, index) {
                columns.push({ data: 'values.' + column[0], type: column[1] ? 'ut' : 'percent' });
            });
            columns.push({ type: 'ut' });
            columns.push({ data: 'totalUT', type: 'ut', readOnly: true });
            columns.push({ data: 'totalPrice', type: 'price', readOnly: true });
            return columns;
        };

        var _getColWidths = function() {
            var colWidths = [15, 600];
            _.each(scale.columns, function(column) { colWidths.push(20); });
            colWidths.push(20);
            colWidths.push(30);
            colWidths.push(30);
            return colWidths;
        };

        self.on('render', function() {
            if(_cachedGrid) {
                $(self.gridSelector).handsontable("updateSettings", {
                    colHeaders: _getColHeaders(),
                    columns: _getColumns(),
                    colWidths: _getColWidths()
                });
                _cachedGrid.render();
                return;
            }

            $(self.gridSelector).handsontable({
                data: self.scale.lines,
                colHeaders: _getColHeaders(),
                columns: _getColumns(),
                colWidths: _getColWidths(),
                minSpareRows: 1,
                stretchH: 'all',
                afterGetColHeader: function(col, TH) {
                    if((col > 1) && (col < self.scale.columns.length + 3)) {
                        var th = $(TH);
                        baseline = false;
                        if(col != self.scale.columns.length + 2) {
                            baseline = scale.columns[col - 2][1];
                        }
                        var content = self.getTemplate('#scale-colheader-template')({ name: th.text(), profiles: _getProfiles(), column: col - 2, baseline: baseline });
                        th.html(content);
                        th.css('overflow','initial');
                        th.css('height', '150px');
                    }
                },
                cells: function (row, col, prop) {
                    var cellProperties = {};
                    var scaleLine = self.scale.lines[row];
                    switch(prop) {
                        case 'complexity':
                            if(scaleLine.id) {
                                cellProperties.invalid = !(scaleLine.complexity);
                            }
                            break;
                        case 'totalUT':
                        case 'totalPrice':
                            cellProperties.computed = true;
                            break;
                    }
                    cellProperties.muted = !scaleLine.isActive;
                    return cellProperties;
                },
                afterChange: function(changes, operation) {
                    switch(operation) {
                        case 'edit':
                        case 'autofill':
                        case 'paste':
                            var modifications = [];
                            _.each(changes, function(change) {
                                var scaleLine = self.scale.lines[change[0]];
                                if (scaleLine.id) {
                                    modifications.push({
                                        model: 'ScaleLine',
                                        id: scaleLine.id,
                                        parentId: self.scale.id,
                                        action: 'update',
                                        property: change[1],
                                        oldValue: change[2],
                                        newValue: change[3],
                                        localInfo: {
                                            alreadyApplied: true,
                                            target: scaleLine
                                        }
                                    });
                                } else {
                                    var createModif = {
                                        model: 'ScaleLine',
                                        action: 'create',
                                        parentId: self.scale.id,
                                        values: {},
                                        localInfo: {
                                            alreadyApplied: true,
                                            target: scaleLine
                                        }
                                    };
                                    createModif.values[change[1]] = change[3];
                                    if(change[1] !== 'isActive') {
                                        scaleLine.isActive = true;
                                        scaleLine.values = {};
                                        createModif.values.isActive = true;
                                    }
                                    if(change[0] > 0) {
                                        createModif.insertAfter = self.scale.lines[change[0] - 1].id;
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
        $(self.gridSelector).on('click', 'a.dropdown-toggle', function(e) {
            var dropDown = $(this).next();
            $('.wtHider', self.gridSelector).css('min-height', dropDown.height() + 200 + 'px');
            e.preventDefault();
        });

        $(self.gridSelector).on('click', 'a[data-behavior~="selectProfileColumn"]', function(e) {
            var profile = $(this).text();
            var column = $(this).data('column');
            var checked = $(this).prev().is(':checked');

            var oldColumns = _.clone(scale.columns);

            if(profile === "Remove") {
                scale.columns.splice(column, 1);
            } else {
                if(scale.columns.length < column)
                    scale.columns.length = column + 1;
                scale.columns[column] = [profile, checked];
            }

            var modifications = [{
                model: 'Scale',
                id: self.scale.id,
                action: 'update',
                property: 'columns',
                oldValue: oldColumns,
                newValue: scale.columns,
                localInfo: {
                    alreadyApplied: true,
                    target: scale
                }
            }];
            self.emit('applyModifications', modifications);

            e.preventDefault();
        });

        $(self.gridSelector).on('change', 'input[data-behavior~="checkBaseline"]', function(e) {
            var column = $(this).data('column');
            var checked = $(this).is(':checked');

            var oldColumns = JSON.parse(JSON.stringify(scale.columns));
            console.log(oldColumns);

            if(scale.columns.length < column)
                scale.columns.length = column + 1;
            scale.columns[column] = scale.columns[column] || [null, checked];
            scale.columns[column][1] = checked;

            console.log(oldColumns);
            var modifications = [{
                model: 'Scale',
                id: self.scale.id,
                action: 'update',
                property: 'columns',
                oldValue: oldColumns,
                newValue: scale.columns,
                localInfo: {
                    alreadyApplied: true,
                    target: scale
                }
            }];
            self.emit('applyModifications', modifications);

            e.preventDefault();
        });

        return self;
    }
})();
