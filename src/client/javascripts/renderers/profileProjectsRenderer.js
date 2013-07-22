/**
 * Renderer for profile projects
 */

var ProfileProjectsRenderer = (function() {
    "use strict";

    return function(engine) {
        var self = {};
        self.__proto__ = BaseRenderer(engine);
        self.gridSelector = '#profileProjectsInputGrid';

        var _calculator = new ProjectCalculator();
        var _cachedGrid, _gridHelper;

        var _profilePricesSource = function() {
            return _.pluck(_.filter(self.engine.data.profilePrices, function(value) { return value.id; }), 'title');
        };

        var _dataProfilePrice = function profilePrice(profileProject, value, inverseGet) {
            var targetProfilePrice;
            if (inverseGet) {
                targetProfilePrice = _.findWhere(self.engine.data.profilePrices, { title: value });
                return targetProfilePrice ? targetProfilePrice.id : null;
            }
            if(!profileProject) profileProject = {};
            if(typeof value === 'undefined') {
                targetProfilePrice = self.engine.data.nav.profilePrices[profileProject.profilePrice];
                return targetProfilePrice ? targetProfilePrice.title : null;
            } else {
                targetProfilePrice = _.findWhere(self.engine.data.profilePrices, { title: value });
                profileProject.profilePrice = targetProfilePrice ? targetProfilePrice.id : null;
            }
        };

        // Event subscriptions
        self.on('render', function() {
            if(!_gridHelper) {
                _gridHelper = new GridHelper({
                    engine: self.engine,
                    modelName: 'ProfileProject',
                    dataCollection: self.engine.data.profileProjects,
                    defaultValues: {
                        isActive: true,
                        percentageJunior: 25,
                        percentageIntermediary: 50,
                        percentageSenior: 25
                    }
                });
            }

            if(_cachedGrid) {
                _cachedGrid.render();
                return;
            }

            $(self.gridSelector).handsontable({
                data: self.engine.data.profileProjects,
                colHeaders: [ "Act.", "Title", "Price profile", "Junior", "Intermediary", "Senior", "$ / UT" ],
                colWidths:  [15, 400, 90, 50, 50, 50, 50],
                stretchH: 'all',
                rowHeaders: true,
                minSpareRows: 1,
                columns: [
                    { data: 'isActive',                      type: 'cellCheckbox', readOnly: self.engine.isReadOnly },
                    { data: 'title',                         type: 'title',        readOnly: self.engine.isReadOnly },
                    { data: _dataProfilePrice,       type: {
                        renderer: function(instance, td, row, col, prop, value, cellProperties) {
                            Handsontable.AutocompleteCell.renderer.apply(this, arguments);
                            Handsontable.CustomCellPropertiesRenderer(instance, td, row, col, prop, value, cellProperties);
                        },
                        editor: Handsontable.AutocompleteEditor,
                        source: _profilePricesSource
                    }, readOnly: self.engine.isReadOnly},
                    { data: 'percentageJunior',              type: 'percent',      readOnly: self.engine.isReadOnly },
                    { data: 'percentageIntermediary',        type: 'percent',      readOnly: self.engine.isReadOnly },
                    { data: 'percentageSenior',              type: 'percent',      readOnly: self.engine.isReadOnly },
                    { data: 'computed.profileAveragePrice',  type: 'price',        readOnly: true }
                ],
                contextMenu: self.engine.isReadOnly ? null : ['row_above', 'row_below', 'remove_row'],
                cells: function (row, col, prop) {
                    var cellProperties = {};
                    var profileProject = self.engine.data.profileProjects[row];

                    if(typeof prop === 'function')
                        prop = prop.name;

                    if(profileProject) {
                        switch(prop) {
                            case 'title':
                                if(profileProject.id) {
                                    cellProperties.invalid = !(profileProject.title);
                                }
                                break;
                            case 'percentageJunior':
                            case 'percentageIntermediary':
                            case 'percentageSenior':
                                if(profileProject.id) {
                                    var totalPercentage = _calculator.parseInt(profileProject.percentageJunior)
                                        + _calculator.parseInt(profileProject.percentageIntermediary)
                                        + _calculator.parseInt(profileProject.percentageSenior);
                                    cellProperties.invalid = (totalPercentage != 100);
                                }
                                break;
                            case 'computed.profileAveragePrice':
                                cellProperties.computed = true;
                                break;
                        }

                        cellProperties.muted = !profileProject.isActive;
                    }
                    return cellProperties;
                },
                beforeRender: _gridHelper.beforeRender,
                afterChange: _gridHelper.afterChange,
                afterRemoveRow: _gridHelper.afterRemoveRow
            });
            _cachedGrid = $(self.gridSelector).data('handsontable');
        });

        return self;
    };
})();