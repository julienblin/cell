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
        var _cachedGrid;
        var _shadowData = {};

        var _profilePricesSource = function() {
            return _.pluck(_.filter(self.engine.data.profilePrices, function(value) { return value.id; }), 'title');
        };

        var _dataProfilePrice = function profilePrice(profileProject, value, options) {
            var targetProfilePrice;
            if (options) {
                if (options.inverseGet) {
                    targetProfilePrice = _.findWhere(self.engine.data.profilePrices, { title: value });
                    return targetProfilePrice ? targetProfilePrice.id : null;
                }
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
                beforeRender: function() {
                    _shadowData.profileProjects = _.clone(self.engine.data.profileProjects);
                },
                afterChange: function(changes, operation) {
                    switch(operation) {
                        case 'edit':
                        case 'autofill':
                        case 'paste':
                            var modifications = [];
                            _.each(changes, function(change) {
                                var profileProject = self.engine.data.profileProjects[change[0]];
                                var property = change[1];
                                var oldValue = change[2];
                                var newValue = change[3];
                                if(typeof change[1] === 'function') {
                                    property = change[1].name;
                                    oldValue = change[1](profileProject, change[2], { inverseGet: true });
                                    newValue = profileProject[property];
                                }
                                if (profileProject.id) {
                                    modifications.push({
                                        model: 'ProfileProject',
                                        id: profileProject.id,
                                        action: 'update',
                                        property: property,
                                        oldValue: oldValue,
                                        newValue: newValue,
                                        localInfo: {
                                            alreadyApplied: true,
                                            target: profileProject
                                        }
                                    });
                                } else {
                                    var createModif = {
                                        model: 'ProfileProject',
                                        action: 'create',
                                        values: {},
                                        localInfo: {
                                            alreadyApplied: true,
                                            target: profileProject
                                        }
                                    };
                                    createModif.values[property] = newValue;
                                    if(change[1] === 'title') {
                                        profileProject.isActive = true;
                                        profileProject.percentageJunior = 25;
                                        profileProject.percentageIntermediary = 50;
                                        profileProject.percentageSenior = 25;
                                        createModif.values.isActive = true;
                                        createModif.values.percentageJunior = 25;
                                        createModif.values.percentageIntermediary = 50;
                                        createModif.values.percentageSenior = 25;
                                    }
                                    if(change[0] > 0) {
                                        createModif.insertAfter = self.engine.data.profileProjects[change[0] - 1].id;
                                    }
                                    modifications.push(createModif);
                                }
                            });
                            self.engine.applyModifications(modifications);
                            break;
                    }
                },
                afterRemoveRow: function(index, amount) {
                    var profileProjectsToDelete = _shadowData.profileProjects.slice(index, index + amount);
                    var modifications = [];
                    _.each(profileProjectsToDelete, function(profileProject, profileProjectIndex) {
                        modifications.push({
                            model: 'ProfileProject',
                            id: profileProject.id,
                            action: 'delete',
                            localInfo: {
                                alreadyApplied: true,
                                target: profileProject,
                                position: (index + profileProjectIndex)
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