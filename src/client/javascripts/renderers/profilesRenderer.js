/**
 * Renderer for project profiles tab.
 */

var ProfilesRenderer = (function() {
    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer('#profiles', engine);
        self.gridSelectorInput = '#profilesInputGrid';
        self.gridSelectorComputed = '#profilesComputedGrid';

        var _cachedGridInput = null;
        var _cachedGridComputed = null;
        var _calculator = new ProjectCalculator();
        var _shadowData = {};

        var _computeData = function() {
            var result = [];
            _.each(self.engine.data.profiles, function(profile) {
                if(profile.id) {
                    var line = {
                        isActive: profile.isActive,
                        title: profile.title
                    };

                    var computedProfile = self.engine.data.computed.profiles[profile.id];
                    if(computedProfile) {
                        line.percentageJunior = computedProfile.percentUT * (profile.percentageJunior / 100);
                        line.priceJunior = computedProfile.totalPrice * (profile.computed.percentPriceJunior / 100);
                        line.percentageIntermediary = computedProfile.percentUT * (profile.percentageIntermediary / 100);
                        line.priceIntermediary = computedProfile.totalPrice * (profile.computed.percentPriceIntermediary / 100);
                        line.percentageSenior = computedProfile.percentUT * (profile.percentageSenior / 100);
                        line.priceSenior = computedProfile.totalPrice * (profile.computed.percentPriceSenior / 100);
                    }

                    result.push(line);
                }
            });
            return result;
        };

        // Event subscriptions
        self.on('render', function() {
            _computeData();

            if(_cachedGridInput && _cachedGridComputed) {
                _cachedGridInput.render();
                $(self.gridSelectorComputed).handsontable("updateSettings", {
                    data: _computeData()
                });
                _cachedGridComputed.render();
                return;
            }

            $(self.gridSelectorInput).handsontable({
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
                    { data: 'isActive',               type: 'cellCheckbox' },
                    { data: 'title',                  type: 'title' },
                    { data: 'percentageJunior',       type: 'percent' },
                    { data: 'priceJunior',            type: 'price' },
                    { data: 'percentageIntermediary', type: 'percent' },
                    { data: 'priceIntermediary',      type: 'price' },
                    { data: 'percentageSenior',       type: 'percent' },
                    { data: 'priceSenior',            type: 'price' },
                    { data: 'computed.priceAverage',  type: 'price', readOnly: true }
                ],
                contextMenu: ['row_above', 'row_below', 'remove_row'],
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
                            case 'computed.priceAverage':
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
                            self.emit('applyModifications', modifications);
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
                    self.emit('applyModifications', modifications);
                }
            });
            _cachedGridInput = $(self.gridSelectorInput).data('handsontable');

            $(self.gridSelectorComputed).handsontable({
                data: _computeData(),
                colHeaders: [ "Act.", "Title", "Junior", "Intermediary", "Senior", "Aggregate" ],
                colWidths:  [15, 600, 30, 30, 30, 30, 30, 30, 30, 30],
                afterGetColHeader: function (col, TH) {
                    switch(col) {
                        case 2:
                        case 3:
                        case 4:
                        case 5:
                            $(TH).attr('colspan', 2);
                            break;
                    }
                },
                stretchH: 'all',
                rowHeaders: true,
                columns: [
                    { data: 'isActive',               renderer: Handsontable.BlankRenderer, readOnly: true },
                    { data: 'title',                  type: 'title', readOnly: true },
                    { data: 'percentageJunior',       type: 'percent', readOnly: true },
                    { data: 'priceJunior',            type: 'price', readOnly: true },
                    { data: 'percentageIntermediary', type: 'percent', readOnly: true },
                    { data: 'priceIntermediary',      type: 'price', readOnly: true },
                    { data: 'percentageSenior',       type: 'percent', readOnly: true },
                    { data: 'priceSenior',            type: 'price', readOnly: true },
                    { data: 'percentageAggregate',    type: 'percent', readOnly: true },
                    { data: 'priceAggregate',         type: 'price', readOnly: true }
                ]
            });
            _cachedGridComputed = $(self.gridSelectorComputed).data('handsontable');
        });

        return self;
    }
})();
