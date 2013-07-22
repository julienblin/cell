/**
 * Renderer for project scale lines - nested under ScalesRenderer.
 */

var ScaleLinesRenderer = (function() {
    "use strict";

    return function(scale, engine) {
        var self = {};

        self.__proto__ = BaseRenderer(engine);
        self.scale = scale;
        if(!self.scale.lines) self.scale.lines = [];
        if(!self.scale.columns) self.scale.columns = [];
        self.gridSelector = '#gridScale' + scale.id;
        var _cachedGrid = null;
        var _shadowData = {};

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
                { data: 'isActive', type: 'cellCheckbox', readOnly: self.engine.isReadOnly },
                { data: 'complexity', type: 'title', readOnly: self.engine.isReadOnly }
            ];

            _.each(self.scale.columns, function(column, index) {
                columns.push({ data: 'values.' + column.id, type: column.isBaseline ? 'ut' : 'percent', readOnly: self.engine.isReadOnly });
            });
            columns.push({ type: 'ut', readOnly: self.engine.isReadOnly });
            columns.push({ data: 'computed.lineTotalUT', type: 'ut', readOnly: true });
            columns.push({ data: 'computed.lineTotalPrice', type: 'price', readOnly: true });
            return columns;
        };

        var _getColWidths = function() {
            var colWidths = [15, 300];
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
                contextMenu: self.engine.isReadOnly ? null : {
                    items: {
                        'row_above': {},
                        'row_below': {},
                        'remove_row': {},
                        'custom_col_left': {
                            name: 'Insert column on the left',
                            disabled: function() {
                                var col = $(self.gridSelector).handsontable('getSelected');
                                if(!col) return true;
                                col = col[1];
                                return !((col > 1) && (col < self.scale.columns.length + 2));
                            }
                        },
                        'custom_col_right': {
                            name: 'Insert column on the right',
                            disabled: function() {
                                var col = $(self.gridSelector).handsontable('getSelected');
                                if(!col) return true;
                                col = col[1];
                                return !((col > 0) && (col < self.scale.columns.length + 1));
                            }
                        }
                    },
                    callback: function (key, options) {
                        var insertAfterScaleColumns;
                        if ((key === 'custom_col_left') || (key === 'custom_col_right')) {
                            var col = $(self.gridSelector).handsontable('getSelected')[1];
                            if(key === 'custom_col_left') {
                                insertAfterScaleColumns = (col > 2) ? self.scale.columns[col - 3] : {};
                            }
                            if(key === 'custom_col_right') {
                                insertAfterScaleColumns = (col > 1) ? self.scale.columns[col - 2] : {};
                            }
                            var modifications = [];
                            modifications.push({
                                model: 'ScaleColumn',
                                parentId: self.scale.id,
                                action: 'create',
                                insertAfter: insertAfterScaleColumns.id,
                                values: {}
                            });
                            self.engine.applyModifications(modifications);
                        }
                    }
                },
                afterGetColHeader: function(col, TH) {
                    if((col > 1) && (col < self.scale.columns.length + 3)) {
                        var th = $(TH);
                        var scaleColumn = self.scale.columns[col - 2] || {};
                        var scaleColumnBefore = (col > 2) ? self.scale.columns[col - 3] : {};
                        var profileProject = self.engine.data.nav.profileProjects[scaleColumn.profileProject];
                        var content = self.getTemplate('#scale-colheader-template')({ column: scaleColumn, profileProject: profileProject, before: scaleColumnBefore, profileProjects: self.engine.data.profileProjects, readOnly: self.engine.isReadOnly });
                        th.html(content);
                        th.css('overflow','initial');
                        th.css('height', '150px');
                    }
                },
                cells: function (row, col, prop) {
                    var cellProperties = {};
                    var scaleLine = self.scale.lines[row];
                    if(scaleLine) {
                        switch(prop) {
                            case 'complexity':
                                if(scaleLine.id) {
                                    cellProperties.invalid = !(scaleLine.complexity);
                                }
                                break;
                            case 'computed.lineTotalUT':
                            case 'computed.lineTotalPrice':
                                cellProperties.computed = true;
                                break;
                        }
                        cellProperties.muted = !scaleLine.isActive;
                    }
                    return cellProperties;
                },
                beforeRender: function() {
                    _shadowData.lines = _.clone(self.scale.lines);
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
                                    var modif = {
                                        model: 'ScaleLine',
                                        id: scaleLine.id,
                                        parentId: self.scale.id,
                                        action: 'update',
                                        values: {},
                                        localInfo: {
                                            alreadyApplied: true,
                                            target: scaleLine
                                        }
                                    };
                                    modif.values[change[1]] = [change[2], change[3]];
                                    modifications.push(modif);
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
                            self.engine.applyModifications(modifications);
                            break;
                    }
                },
                afterRemoveRow: function(index, amount) {
                    var linesToDelete = _shadowData.lines.slice(index, index + amount);
                    var modifications = [];
                    _.each(linesToDelete, function(scale, scaleIndex) {
                        modifications.push({
                            model: 'ScaleLine',
                            id: scale.id,
                            parentId: self.scale.id,
                            action: 'delete',
                            localInfo: {
                                alreadyApplied: true,
                                target: scale,
                                position: (index + scaleIndex)
                            }
                        });
                    });
                    self.engine.applyModifications(modifications);
                }
            });
            _cachedGrid = $(self.gridSelector).data('handsontable');
        });

        $(self.gridSelector).on('click', 'a[data-behavior~="selectProfileProjectColumn"]', function(e) {
            var columnId = $(this).data('column-id');
            var columnBeforeId = $(this).data('column-before-id');
            var profileProjectId = $(this).data('profile-project-id');
            var modifications = [];

            if(columnId) {
                var column = self.engine.data.nav.scaleColumns[columnId];
                if(column) {
                    modifications.push({
                        model: 'ScaleColumn',
                        id: column.id,
                        parentId: self.scale.id,
                        action: 'update',
                        values: {
                            profileProject: [column.profileProject, profileProjectId]
                        },
                        localInfo: {
                            target: column
                        }
                    });
                }
            } else {
                modifications.push({
                    model: 'ScaleColumn',
                    parentId: self.scale.id,
                    action: 'create',
                    insertAfter: columnBeforeId,
                    values : {
                        profileProject: profileProjectId
                    }
                });
            }

            self.engine.applyModifications(modifications);
            e.preventDefault();
        });

        $(self.gridSelector).on('change', 'input[data-behavior~="checkBaseline"]', function(e) {
            var columnId = $(this).data('column-id');
            var checked = $(this).is(':checked');
            var modifications = [];

            if(columnId) {
                var column = self.engine.data.nav.scaleColumns[columnId];
                if(column) {
                    modifications.push({
                        model: 'ScaleColumn',
                        id: column.id,
                        parentId: self.scale.id,
                        action: 'update',
                        values: {
                            isBaseline: [column.isBaseline, checked]
                        },
                        localInfo: {
                            target: column
                        }
                    });
                }
            } else {
                modifications.push({
                    model: 'ScaleColumn',
                    parentId: self.scale.id,
                    action: 'create',
                    values : {
                        isBaseline: checked
                    }
                });
            }

            self.engine.applyModifications(modifications);
            e.preventDefault();
        });

        $(self.gridSelector).on('click', 'a[data-behavior~="removeColumn"]', function(e) {
            var columnId = $(this).data('column-id');
            var modifications = [];

            if(columnId) {
                var column = self.engine.data.nav.scaleColumns[columnId];
                if(column) {
                    modifications.push({
                        model: 'ScaleColumn',
                        id: column.id,
                        parentId: self.scale.id,
                        action: 'delete',
                        localInfo: {
                            target: column
                        }
                    });
                }
            }

            self.engine.applyModifications(modifications);
            e.preventDefault();
        });

        return self;
    };
})();
