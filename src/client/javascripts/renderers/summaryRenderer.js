/**
 * Renderer for project summary tab.
 */

var SummaryRenderer = (function() {
    "use strict";

    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer('#summary', engine);
        self.gridSelectorProfileProjects = '#profileProjectsComputedGrid';
        self.chartsSelectorProfilesEfforts = '#profilesEffortsCharts';
        self.chartsSelectorScalesEfforts = '#scalesEffortsCharts';

        var _calculator = new ProjectCalculator();
        var _cachedGridProfileProjects = null;

        var _computeProfileProjectsData = function() {
            var result = [];
            var totals = {
                title: 'Total',
                totalJuniorUT: 0,
                percentageUTJunior: 0,
                priceJunior: 0,
                totalIntermediaryUT: 0,
                percentageUTIntermediary: 0,
                priceIntermediary: 0,
                totalSeniorUT: 0,
                percentageUTSenior: 0,
                priceSenior: 0,
                totalAggregateUT: 0,
                percentageUTAggregate: 0,
                priceAggregate: 0
            };
            _.each(self.engine.data.profileProjects, function(profileProject) {
                if(!profileProject.id) return;

                var line = {
                    isActive: profileProject.isActive,
                    title: profileProject.title
                };

                var computedProfile = self.engine.data.computed.profileProjects[profileProject.id];
                if(computedProfile) {
                    // Junior
                    line.totalJuniorUT = computedProfile.totalUT * (profileProject.percentageJunior / 100);
                    totals.totalJuniorUT = totals.totalJuniorUT + line.totalJuniorUT;

                    line.percentageUTJunior = computedProfile.percentUT * (profileProject.percentageJunior / 100);
                    totals.percentageUTJunior = totals.percentageUTJunior + line.percentageUTJunior;

                    line.priceJunior = computedProfile.totalPrice * (profileProject.computed.profilePercentPriceJunior / 100);
                    totals.priceJunior = totals.priceJunior + line.priceJunior;

                    // Intermediary
                    line.totalIntermediaryUT = computedProfile.totalUT * (profileProject.percentageIntermediary / 100);
                    totals.totalIntermediaryUT = totals.totalIntermediaryUT + line.totalIntermediaryUT;

                    line.percentageUTIntermediary = computedProfile.percentUT * (profileProject.percentageIntermediary / 100);
                    totals.percentageUTIntermediary = totals.percentageUTIntermediary + line.percentageUTIntermediary;

                    line.priceIntermediary = computedProfile.totalPrice * (profileProject.computed.profilePercentPriceIntermediary / 100);
                    totals.priceUTIntermediary = totals.priceUTIntermediary + line.priceUTIntermediary;

                    // Senior
                    line.totalSeniorUT = computedProfile.totalUT * (profileProject.percentageSenior / 100);
                    totals.totalSeniorUT = totals.totalSeniorUT + line.totalSeniorUT;

                    line.percentageUTSenior = computedProfile.percentUT * (profileProject.percentageSenior / 100);
                    totals.percentageUTSenior = totals.percentageUTSenior + line.percentageUTSenior;

                    line.priceSenior = computedProfile.totalPrice * (profileProject.computed.profilePercentPriceSenior / 100);
                    totals.priceSenior = totals.priceSenior + line.priceSenior;

                    // Aggregate
                    line.totalAggregateUT = line.totalJuniorUT + line.totalIntermediaryUT + line.totalSeniorUT;
                    totals.totalAggregateUT = totals.totalAggregateUT + line.totalAggregateUT;

                    line.percentageUTAggregate = line.percentageUTJunior + line.percentageUTIntermediary + line.percentageUTSenior;
                    totals.percentageUTAggregate = totals.percentageUTAggregate + line.percentageUTAggregate;

                    line.priceAggregate = line.priceJunior + line.priceIntermediary + line.priceSenior;
                    totals.priceAggregate = totals.priceAggregate + line.priceAggregate;
                }

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

            $(self.chartsSelectorProfilesEfforts).highcharts({
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
                    text: 'Repartition of UT per profile'
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

        var _renderChartsScalesEfforts = function() {
            var colors = Highcharts.getOptions().colors;

            var scalesData = [], scaleLinesData = [];

            _.each(self.engine.data.scales, function(scale, index) {
                _.each(scale.lines, function(scaleLine) {
                    var scaleLineValues = self.engine.data.computed.scaleLines[scaleLine.id];
                    if(scaleLineValues) {
                        scaleLinesData.push({
                            name: scaleLine.complexity,
                            y: _calculator.parseFloat(scaleLineValues.totalUT),
                            color: colors[index]
                        });
                    }
                });

                scalesData.push({
                    name: scale.name,
                    y: self.engine.data.computed.scales[scale.id] ? self.engine.data.computed.scales[scale.id].totalUT : 0.0,
                    color: colors[index]
                });
            });

            $(self.chartsSelectorScalesEfforts).highcharts({
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
                    text: 'Repartition of UT per scale'
                },
                series: [
                    {
                        name: 'UT',
                        data: scalesData,
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
                        data: scaleLinesData,
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
            $('[data-property="totalUT"]', self.tabSelector).text(numeral(self.engine.data.computed.totalUT).format('0,0') + ' UT');
            $('[data-property="totalPrice"]', self.tabSelector).text(numeral(self.engine.data.computed.totalPrice).format('0,0 $'));
            var optimalDuration = 1.3333333333333333 * Math.sqrt(self.engine.data.computed.totalUT / 20) * 20;
            $('[data-property="optimalDuration"]', self.tabSelector).text('Optimal duration: ' + numeral(optimalDuration).format('0,0') + ' UT');
            var optimalNumberOfResources = 0.75 * Math.sqrt(self.engine.data.computed.totalUT / 20);
            $('[data-property="optimalResources"]', self.tabSelector).text('Optimal resources: ' + numeral(optimalNumberOfResources).format('0,0') + ' UT');

            var profileProjectsData = _computeProfileProjectsData();

            if(_cachedGridProfileProjects) {
                $(self.gridSelectorProfileProjects).handsontable("updateSettings", {
                    data: profileProjectsData
                });
                _cachedGridProfileProjects.render();
            } else {
                $(self.gridSelectorProfileProjects).handsontable({
                    data: profileProjectsData,
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
                        if(row === self.engine.data.profileProjects.length)
                            cellProperties.grandHeading = true;
                        if(/Aggregate/.test(prop)) {
                            cellProperties.grandHeading = true;
                        }
                        return cellProperties;
                    }
                });
                _cachedGridProfileProjects = $(self.gridSelectorProfileProjects).data('handsontable');
            }

            if(profileProjectsData.length > 1) {
                _renderChartsProfilesEfforts(profileProjectsData);
                _renderChartsScalesEfforts();
            }
        });

        return self;
    };
})();
