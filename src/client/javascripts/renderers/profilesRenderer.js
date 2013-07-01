/**
 * Renderer for project profiles tab.
 */

var ProfilesRenderer = (function() {
    return function(engine) {
        var self = {};
        self.__proto__ = BaseRenderer('#profiles', engine);
        self.gridSelector = '#profilesGrid';

        var _cachedGrid = null;
        var _calculator = new ProjectCalculator();
        var _shadowData = {};

        // Event subscriptions
        self.on('render', function() {
            if(!_cachedGrid) {
                $(self.gridSelector).handsontable({
                    data: self.engine.data.profiles,
                    colHeaders: [ "Act.", "Title", "Junior %", "Junior $", "Int. %", "Int. $", "Senior %", "Senior $", "Average $" ],
                    colWidths:  [30,        600,   60,         60,         60,       60,       60,         60,         60],
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
                        { data: 'priceAverage',           type: 'price', readOnly: true }
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
                                case 'priceAverage':
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
                                        if(change[1] != 'isActive') {
                                            profile.isActive = true;
                                            createModif.values.isActive = true;
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
                            })
                        });
                        self.emit('applyModifications', modifications);
                    }
                });
                _cachedGrid = $(self.gridSelector).data('handsontable');
            } else {
                _cachedGrid.render();
            }
        });

        return self;
    }
})();
