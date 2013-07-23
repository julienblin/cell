/**
 * Renderer for scales tab in summary.
 */

var SummaryScalesRenderer = (function() {
    "use strict";

    return function(engine) {
        var self = {};
        self.__proto__ = BaseRenderer(engine);

        self.gridSelector = '#summaryScalesGrid';
        self.chartUTSelector = '#summaryScalesUTChart';
        self.chartPriceSelector = '#summaryScalesPriceChart';

        var _calculator = new ProjectCalculator();
        var _cachedGrid;

        var _computeScalesData = function() {
            var result = [];
            var totals = {
                name: 'Total',
                totalUT: 0,
                totalPrice: 0
            };
            _.each(self.engine.data.scales, function(scale) {
                if(!scale.id) return;

                var line = {
                    isActive: scale.isActive,
                    name: scale.name
                };

                var computedScale = self.engine.data.computed.scales[scale.id];
                if(computedScale) {
                    line.totalUT = computedScale.totalUT;
                    totals.totalUT = totals.totalUT + line.totalUT;
                    line.totalPrice = computedScale.totalPrice;
                    totals.totalPrice = totals.totalPrice + line.totalPrice;
                }

                result.push(line);
            });
            _.each(self.engine.data.computed.fixedScales, function(values, name) {
                var line = {
                    isActive: true,
                    name: (name && name !== 'undefined') ? name : '(Unassigned fixed price)',
                    totalPrice: values.totalPrice
                };

                totals.totalPrice = totals.totalPrice + line.totalPrice;

                result.push(line);
            });
            result.push(totals);
            return result;
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

            $(self.chartUTSelector).highcharts({
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

        var _renderChartsScalesPrices = function(data) {
            // Remove total line
            data = data.length > 0 ? data.slice(0, -1) : data;

            var colors = Highcharts.getOptions().colors;
            var scalesData = [];

            _.each(data, function(dataLine, index) {
                scalesData.push({
                    name: dataLine.name,
                    y: dataLine.totalPrice,
                    color: colors[index]
                });
            });

            $(self.chartPriceSelector).highcharts({
                chart: {
                    type: 'pie'
                },
                credits: {
                    enabled: false
                },
                plotOptions: {
                    pie: {
                        shadow: false,
                        animation: false
                    }
                },
                title: {
                    text: 'Repartition of price per scale'
                },
                series: [
                    {
                        name: 'Price',
                        data: scalesData,
                        dataLabels: {
                            formatter: function() {
                                return this.y > 5 ? this.point.name : null;
                            }
                        }
                    }
                ]
            });
        };

        // Event subscriptions
        self.on('render', function() {
            var scalesData = _computeScalesData();

            if(_cachedGrid) {
                $(self.gridSelector).handsontable("updateSettings", {
                    data: scalesData
                });
                _cachedGrid.render();
            } else {
                $(self.gridSelector).handsontable({
                    data: scalesData,
                    colHeaders: [ "Name", "Total UT", "Total $" ],
                    colWidths:  [600, 45, 45],
                    stretchH: 'all',
                    rowHeaders: true,
                    columns: [
                        { data: 'name',       type: 'title', readOnly: true },
                        { data: 'totalUT',     type: 'ut', readOnly: true },
                        { data: 'totalPrice',  type: 'price', readOnly: true }
                    ],
                    cells: function (row, col, prop) {
                        var cellProperties = {};
                        cellProperties.grandHeading = (row === (scalesData.length - 1));
                        return cellProperties;
                    }
                });
                _cachedGrid = $(self.gridSelector).data('handsontable');
            }

            _renderChartsScalesEfforts();
            _renderChartsScalesPrices(scalesData);
        });

        return self;
    };
})();