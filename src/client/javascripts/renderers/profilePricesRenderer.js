/**
 * Renderer for profile prices
 */

var ProfilePricesRenderer = (function() {
    "use strict";

    return function(engine) {
        var self = {};
        self.__proto__ = BaseRenderer(engine);
        self.gridSelector = '#profilePricesInputGrid';

        var _cachedGrid;
        var _shadowData = {};

        // Event subscriptions
        self.on('render', function() {
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
                beforeRender: function() {
                    _shadowData.profilePrices = _.clone(self.engine.data.profilePrices);
                },
                afterChange: function(changes, operation) {
                    switch(operation) {
                        case 'edit':
                        case 'autofill':
                        case 'paste':
                            var modifications = [];
                            _.each(changes, function(change) {
                                var profilePrice = self.engine.data.profilePrices[change[0]];
                                if (profilePrice.id) {
                                    modifications.push({
                                        model: 'ProfilePrice',
                                        id: profilePrice.id,
                                        action: 'update',
                                        property: change[1],
                                        oldValue: change[2],
                                        newValue: change[3],
                                        localInfo: {
                                            alreadyApplied: true,
                                            target: profilePrice
                                        }
                                    });
                                } else {
                                    var createModif = {
                                        model: 'ProfilePrice',
                                        action: 'create',
                                        values: {},
                                        localInfo: {
                                            alreadyApplied: true,
                                            target: profilePrice
                                        }
                                    };
                                    createModif.values[change[1]] = change[3];
                                    if(change[1] === 'title') {
                                        profilePrice.isActive = true;
                                        createModif.values.isActive = true;
                                    }
                                    if(change[0] > 0) {
                                        createModif.insertAfter = self.engine.data.profilePrices[change[0] - 1].id;
                                    }
                                    modifications.push(createModif);
                                }
                            });
                            self.engine.applyModifications(modifications);
                            break;
                    }
                },
                afterRemoveRow: function(index, amount) {
                    var profilePricesToDelete = _shadowData.profilePrices.slice(index, index + amount);
                    var modifications = [];
                    _.each(profilePricesToDelete, function(profilePrice, profilePriceIndex) {
                        modifications.push({
                            model: 'ProfilePrice',
                            id: profilePrice.id,
                            action: 'delete',
                            localInfo: {
                                alreadyApplied: true,
                                target: profilePrice,
                                position: (index + profilePriceIndex)
                            }
                        });
                    });
                    self.engine.applyModifications(modifications);
                }
            });
            _cachedGrid = $(self.gridSelector).data('handsontable');
        });

        return self;
    };
})();