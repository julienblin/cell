/**
 * Renderer for profile prices
 */

var ProfilePricesRenderer = (function() {
    "use strict";

    return function(engine) {
        var self = {};
        self.__proto__ = BaseRenderer(engine);
        self.gridSelector = '#profilePricesInputGrid';

        var _cachedGrid, _gridHelper;

        // Event subscriptions
        self.on('render', function() {
            if(!_gridHelper) {
                _gridHelper = new GridHelper({
                    engine: self.engine,
                    modelName: 'ProfilePrice',
                    dataCollection: self.engine.data.profilePrices,
                    defaultValues: {
                        isActive: true
                    }
                });
            }

            if(_cachedGrid) {
                _cachedGrid.render();
                return;
            }

            $(self.gridSelector).handsontable({
                data: self.engine.data.profilePrices,
                colHeaders: [ "Act.", "Title", "Junior", "Intermediary", "Senior" ],
                colWidths:  [15, 500, 60, 60, 60],
                stretchH: 'all',
                rowHeaders: true,
                minSpareRows: 1,
                columns: [
                    { data: 'isActive',                      type: 'cellCheckbox', readOnly: self.engine.isReadOnly },
                    { data: 'title',                         type: 'title',        readOnly: self.engine.isReadOnly },
                    { data: 'priceJunior',                   type: 'price',        readOnly: self.engine.isReadOnly },
                    { data: 'priceIntermediary',             type: 'price',        readOnly: self.engine.isReadOnly },
                    { data: 'priceSenior',                   type: 'price',        readOnly: self.engine.isReadOnly }
                ],
                contextMenu: self.engine.isReadOnly ? null : ['row_above', 'row_below', 'remove_row'],
                cells: function (row, col, prop) {
                    var cellProperties = {};
                    var profilePrice = self.engine.data.profilePrices[row];
                    if(profilePrice) {
                        switch(prop) {
                            case 'title':
                                if(profilePrice.id) {
                                    cellProperties.invalid = !(profilePrice.title);
                                }
                                break;
                        }

                        cellProperties.muted = !profilePrice.isActive;
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