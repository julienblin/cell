/**
 * Renderer for project scale lines - nested under ScalesRenderer.
 */

var ScaleLinesRenderer = (function() {
    return function(scale, engine) {
        var self = {};

        self.__proto__ = BaseRenderer(engine);
        self.scale = scale;
        self.gridSelector = '#gridScale' + scale.id;
        var _cachedGrid = null;

        var _getProfiles = function() {
            return _.compact(_.pluck(self.engine.data.profiles, 'title'));
        };

        var _getColHeaders = function() {
            var headers = [ "Act.", "Complexity" ];
            _.each(scale.columns, function(column) { headers.push(column[0]); });
            headers.push("[choose]");
            headers.push("Total UT");
            headers.push("Total $");
            return headers;
        };

        var _getColumns = function() {
            var columns = [
                { data: 0, type: 'cellCheckbox' },
                { data: 1, type: 'title' }
            ];

            _.each(scale.columns, function(column) { columns.push({ type: 'text' }); });
            columns.push({ type: 'text' });
            columns.push({ type: 'text', readOnly: true });
            columns.push({ type: 'price', readOnly: true });
            return columns;
        };

        var _getColWidths = function() {
            var colWidths = [30, 600];
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
                colHeaders: _getColHeaders(),
                columns: _getColumns(),
                colWidths: _getColWidths(),
                minSpareRows: 1,
                stretchH: 'all',
                afterGetColHeader: function(col, TH) {
                    var numberOfDefinedColumns = 0;
                    if(scale.columns && (scale.columns.length > 0)) {
                        numberOfDefinedColumns += scale.columns.length;
                    }
                    if((col > 1) && (col < numberOfDefinedColumns + 3)) {
                        var th = $(TH);
                        baseline = false;
                        if(col != numberOfDefinedColumns + 2) {
                            baseline = scale.columns[col - 2][1];
                        }
                        var content = self.getTemplate('#scale-colheader-template')({ name: th.text(), profiles: _getProfiles(), column: col - 2, baseline: baseline });
                        th.html(content);
                        th.css('overflow','initial');
                        th.css('height', '150px');
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

            if(scale.columns.length < column)
                scale.columns.length = column + 1;
            scale.columns[column] = [profile, checked];

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
