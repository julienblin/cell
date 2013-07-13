/**
 * Renderer for project profiles tab.
 */

var ProfilesRenderer = (function() {
    "use strict";

    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer('#profiles', engine);
        self.gridSelector = '#profilesInputGrid';

        var _cachedGrid = null;
        var _calculator = new ProjectCalculator();
        var _shadowData = {};

        // Event subscriptions
        self.on('render', function() {

            if(_cachedGrid) {
                _cachedGrid.render();
                return;
            }

            $(self.gridSelector).handsontable({
                data: self.engine.data.profiles,
                colHeaders: [ "Act.", "Title", "Junior", "Intermediary", "Senior", "$ / UT" ],
                colWidths:  [15, 600, 30, 30, 30, 30, 30, 30, 60],
                afterGetColHeader: function (col, TH) {
                    switch(col) {
                        case 2:
                        case 3:
                        case 4:
                            $(TH).attr('colspan', 2);
                            break;
                    }
                },
                stretchH: 'all',
                rowHeaders: true,
                minSpareRows: 1,
                columns: [
                    { data: 'isActive',                      type: 'cellCheckbox', readOnly: self.engine.isReadOnly },
                    { data: 'title',                         type: 'title',        readOnly: self.engine.isReadOnly },
                    { data: 'percentageJunior',              type: 'percent',      readOnly: self.engine.isReadOnly },
                    { data: 'priceJunior',                   type: 'price',        readOnly: self.engine.isReadOnly },
                    { data: 'percentageIntermediary',        type: 'percent',      readOnly: self.engine.isReadOnly },
                    { data: 'priceIntermediary',             type: 'price',        readOnly: self.engine.isReadOnly },
                    { data: 'percentageSenior',              type: 'percent',      readOnly: self.engine.isReadOnly },
                    { data: 'priceSenior',                   type: 'price',        readOnly: self.engine.isReadOnly },
                    { data: 'computed.profileAveragePrice',  type: 'price',        readOnly: true }
                ],
                contextMenu: self.engine.isReadOnly ? null : ['row_above', 'row_below', 'remove_row'],
                cells: function (row, col, prop) {
                    var cellProperties = {};
                    var profile = self.engine.data.profiles[row];
                    if(profile) {
                        switch(prop) {
                            case 'title':
                                if(profile.id) {
                                    cellProperties.invalid = !(profile.title);
                                }
                                break;
                            case 'percentageJunior':
                            case 'percentageIntermediary':
                            case 'percentageSenior':
                                if(profile.id) {
                                    var totalPercentage = _calculator.parseInt(profile.percentageJunior)
                                        + _calculator.parseInt(profile.percentageIntermediary)
                                        + _calculator.parseInt(profile.percentageSenior);
                                    cellProperties.invalid = (totalPercentage != 100);
                                }
                                break;
                            case 'computed.profileAveragePrice':
                                cellProperties.computed = true;
                                break;
                        }

                        cellProperties.muted = !profile.isActive;
                    }
                    return cellProperties;
                },
                beforeRender: function() {
                    _shadowData.profiles = _.clone(self.engine.data.profiles);
                },
                afterChange: function(changes, operation) {
                    switch(operation) {
                        case 'edit':
                        case 'autofill':
                        case 'paste':
                            var modifications = [];
                            _.each(changes, function(change) {
                                var profile = self.engine.data.profiles[change[0]];
                                if (profile.id) {
                                    modifications.push({
                                        model: 'Profile',
                                        id: profile.id,
                                        action: 'update',
                                        property: change[1],
                                        oldValue: change[2],
                                        newValue: change[3],
                                        localInfo: {
                                            alreadyApplied: true,
                                            target: profile
                                        }
                                    });
                                } else {
                                    var createModif = {
                                        model: 'Profile',
                                        action: 'create',
                                        values: {},
                                        localInfo: {
                                            alreadyApplied: true,
                                            target: profile
                                        }
                                    };
                                    createModif.values[change[1]] = change[3];
                                    if(change[1] === 'title') {
                                        profile.isActive = true;
                                        profile.percentageJunior = 25;
                                        profile.percentageIntermediary = 50;
                                        profile.percentageSenior = 25;
                                        createModif.values.isActive = true;
                                        createModif.values.percentageJunior = 25;
                                        createModif.values.percentageIntermediary = 50;
                                        createModif.values.percentageSenior = 25;
                                    }
                                    if(change[0] > 0) {
                                        createModif.insertAfter = self.engine.data.profiles[change[0] - 1].id;
                                    }
                                    modifications.push(createModif);
                                }
                            });
                            self.engine.applyModifications(modifications);
                        break;
                    }
                },
                afterRemoveRow: function(index, amount) {
                    var profilesToDelete = _shadowData.profiles.slice(index, index + amount);
                    var modifications = [];
                    _.each(profilesToDelete, function(profile, profileIndex) {
                        modifications.push({
                            model: 'Profile',
                            id: profile.id,
                            action: 'delete',
                            localInfo: {
                                alreadyApplied: true,
                                target: profile,
                                position: (index + profileIndex)
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
