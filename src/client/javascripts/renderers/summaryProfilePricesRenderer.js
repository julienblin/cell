/**
 * Renderer for profile prices tab in summary.
 */

var SummaryProfilePricesRenderer = (function() {
    "use strict";

    return function(engine) {
        var self = {};
        self.__proto__ = BaseRenderer(engine);

        self.gridSelector = '#summaryProfilePricesGrid';
        self.chartSelector = '#summaryProfilesPricesChart';

        var _calculator = new ProjectCalculator();
        var _cachedGrid;

        var _computeProfilePricesData = function() {
            var result = [];
            var totals = {
                title: 'Total',
                totalJuniorUT: 0,
                priceJunior: 0,
                totalIntermediaryUT: 0,
                priceIntermediary: 0,
                totalSeniorUT: 0,
                priceSenior: 0,
                totalAggregateUT: 0,
                priceAggregate: 0
            };
            _.each(self.engine.data.profilePrices, function(profilePrice) {
                if(!profilePrice.id) return;

                var line = {
                    isActive: profilePrice.isActive,
                    title: profilePrice.title,
                    totalJuniorUT: 0,
                    priceJunior: 0,
                    totalIntermediaryUT: 0,
                    priceIntermediary: 0,
                    totalSeniorUT: 0,
                    priceSenior: 0,
                    totalAggregateUT: 0,
                    priceAggregate: 0
                };

                var attachedProfileProjects = _.where(self.engine.data.profileProjects, { profilePrice: profilePrice.id });
                _.each(attachedProfileProjects, function(profileProject) {
                    var computedProfile = self.engine.data.computed.profileProjects[profileProject.id];
                    if(computedProfile) {
                        // Junior
                        var currentProfileProjectTotalJuniorUT = (computedProfile.totalUT * (profileProject.percentageJunior / 100));
                        line.totalJuniorUT = line.totalJuniorUT + currentProfileProjectTotalJuniorUT;
                        totals.totalJuniorUT = totals.totalJuniorUT + currentProfileProjectTotalJuniorUT;

                        var currentProfileProjectPriceJunior = (computedProfile.totalPrice * (profileProject.computed.profilePercentPriceJunior / 100));
                        line.priceJunior = line.priceJunior + currentProfileProjectPriceJunior;
                        totals.priceJunior = totals.priceJunior + currentProfileProjectPriceJunior;

                        // Intermediary
                        var currentProfileProjectTotalIntermediaryUT = (computedProfile.totalUT * (profileProject.percentageIntermediary / 100));
                        line.totalIntermediaryUT = line.totalIntermediaryUT + currentProfileProjectTotalIntermediaryUT;
                        totals.totalIntermediaryUT = totals.totalIntermediaryUT + currentProfileProjectTotalIntermediaryUT;

                        var currentProfileProjectPriceIntermediary = (computedProfile.totalPrice * (profileProject.computed.profilePercentPriceIntermediary / 100));
                        line.priceIntermediary = line.priceIntermediary + currentProfileProjectPriceIntermediary;
                        totals.priceIntermediary = totals.priceIntermediary + currentProfileProjectPriceIntermediary;

                        // Senior
                        var currentProfileProjectTotalSeniorUT = (computedProfile.totalUT * (profileProject.percentageSenior / 100));
                        line.totalSeniorUT = line.totalSeniorUT + currentProfileProjectTotalSeniorUT;
                        totals.totalSeniorUT = totals.totalSeniorUT + currentProfileProjectTotalSeniorUT;

                        var currentProfileProjectPriceSenior = (computedProfile.totalPrice * (profileProject.computed.profilePercentPriceSenior / 100));
                        line.priceSenior = line.priceSenior + currentProfileProjectPriceSenior;
                        totals.priceSenior = totals.priceSenior + currentProfileProjectPriceSenior;

                        // Aggregate
                        line.totalAggregateUT = line.totalAggregateUT + currentProfileProjectTotalJuniorUT + currentProfileProjectTotalIntermediaryUT + currentProfileProjectTotalSeniorUT;
                        totals.totalAggregateUT = totals.totalAggregateUT + currentProfileProjectTotalJuniorUT + currentProfileProjectTotalIntermediaryUT + currentProfileProjectTotalSeniorUT;

                        line.priceAggregate = line.priceAggregate + currentProfileProjectPriceJunior + currentProfileProjectPriceIntermediary + currentProfileProjectPriceSenior;
                        totals.priceAggregate = totals.priceAggregate + currentProfileProjectPriceJunior + currentProfileProjectPriceIntermediary + currentProfileProjectPriceSenior;
                    }
                });

                result.push(line);
            });
            result.push(totals);
            return result;
        };

        var _renderChartsProfilesEfforts = function(data) {
            var colors = Highcharts.getOptions().colors;
            var profilesData =  _.map(data, function(line, index) {
                if(line.title !== 'Total') {
                    return {
                        name: line.title,
                        y: _calculator.parseFloat(line.totalAggregateUT),
                        color: colors[index]
                    };
                }
            });

            var levelData = _.flatten(_.map(data, function(line, index) {
                if(line.title !== 'Total') {
                    return [
                        {
                            name: 'Junior',
                            y: _calculator.parseFloat(line.totalJuniorUT),
                            color: colors[index]
                        },
                        {
                            name: 'Intermediary',
                            y: _calculator.parseFloat(line.totalIntermediaryUT),
                            color: colors[index]
                        },
                        {
                            name: 'Senior',
                            y: _calculator.parseFloat(line.totalSeniorUT),
                            color: colors[index]
                        }
                    ];
                }
            }));

            $(self.chartSelector).highcharts({
                chart: {
                    type: 'pie'
                },
                credits: {
                    enabled: false
                },
                plotOptions: {
                    pie: {
                        shadow: false,
                        center: ['50%', '50%'],
                        animation: false
                    }
                },
                title: {
                    text: 'Repartition of UT per price profile'
                },
                series: [
                    {
                        name: 'UT',
                        data: profilesData,
                        size: '60%',
                        dataLabels: {
                            formatter: function() {
                                return this.y > 5 ? this.point.name : null;
                            },
                            color: 'white',
                            distance: -30
                        }
                    },
                    {
                        name: 'UT',
                        data: levelData,
                        size: '80%',
                        innerSize: '60%',
                        dataLabels: {
                            formatter: function() {
                                return this.y > 1 ? '<b>'+ this.point.name +':</b> '+ numeral(this.y).format('0.[0]') +'%'  : null;
                            }
                        }
                    }
                ]
            });
        };

        // Event subscriptions
        self.on('render', function() {
            var profilePricesData = _computeProfilePricesData();

            if(_cachedGrid) {
                $(self.gridSelector).handsontable("updateSettings", {
                    data: profilePricesData
                });
                _cachedGrid.render();
            } else {
                $(self.gridSelector).handsontable({
                    data: profilePricesData,
                    colHeaders: [ "Title", "Junior", "Intermediary", "Senior", "Aggregate" ],
                    colWidths:  [600, 45, 45, 45, 45, 45, 45, 45, 45],
                    afterGetColHeader: function (col, TH) {
                        switch(col) {
                            case 1:
                            case 2:
                            case 3:
                            case 4:
                                $(TH).attr('colspan', 2);
                                break;
                        }
                    },
                    stretchH: 'all',
                    rowHeaders: true,
                    columns: [
                        { data: 'title',                  type: 'title', readOnly: true },
                        { data: 'totalJuniorUT',          type: 'ut', readOnly: true },
                        { data: 'priceJunior',            type: 'price', readOnly: true },
                        { data: 'totalIntermediaryUT',    type: 'ut', readOnly: true },
                        { data: 'priceIntermediary',      type: 'price', readOnly: true },
                        { data: 'totalSeniorUT',          type: 'ut', readOnly: true },
                        { data: 'priceSenior',            type: 'price', readOnly: true },
                        { data: 'totalAggregateUT',       type: 'ut', readOnly: true },
                        { data: 'priceAggregate',         type: 'price', readOnly: true }
                    ],
                    cells: function (row, col, prop) {
                        var cellProperties = {};
                        if(row === self.engine.data.profilePrices.length)
                            cellProperties.grandHeading = true;
                        if(/Aggregate/.test(prop)) {
                            cellProperties.grandHeading = true;
                        }
                        return cellProperties;
                    }
                });
                _cachedGrid = $(self.gridSelector).data('handsontable');
            }

            if(profilePricesData.length > 1) {
               _renderChartsProfilesEfforts(profilePricesData);
            }
        });

        return self;
    };
})();