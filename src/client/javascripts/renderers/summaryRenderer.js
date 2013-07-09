/**
 * Renderer for project summary tab.
 */

var SummaryRenderer = (function() {
    return function(engine) {
        var self = {};
        self.__proto__ = BaseTabRenderer('#summary', engine);
        self.gridSelectorProfiles = '#profilesComputedGrid';

        var _cachedGridProfiles = null;

        var _computeProfilesData = function() {
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
            _.each(self.engine.data.profiles, function(profile) {
                if(profile.id) {
                    var line = {
                        isActive: profile.isActive,
                        title: profile.title
                    };

                    var computedProfile = self.engine.data.computed.profiles[profile.id];
                    if(computedProfile) {
                        // Junior
                        line.totalJuniorUT = computedProfile.totalUT * (profile.percentageJunior / 100);
                        totals.totalJuniorUT = totals.totalJuniorUT + line.totalJuniorUT;

                        line.percentageUTJunior = computedProfile.percentUT * (profile.percentageJunior / 100);
                        totals.percentageUTJunior = totals.percentageUTJunior + line.percentageUTJunior;

                        line.priceJunior = computedProfile.totalPrice * (profile.computed.percentPriceJunior / 100);
                        totals.priceJunior = totals.priceJunior + line.priceJunior;

                        // Intermediary
                        line.totalIntermediaryUT = computedProfile.totalUT * (profile.percentageIntermediary / 100);
                        totals.totalIntermediaryUT = totals.totalIntermediaryUT + line.totalIntermediaryUT;

                        line.percentageUTIntermediary = computedProfile.percentUT * (profile.percentageIntermediary / 100);
                        totals.percentageUTIntermediary = totals.percentageUTIntermediary + line.percentageUTIntermediary;

                        line.priceIntermediary = computedProfile.totalPrice * (profile.computed.percentPriceIntermediary / 100);
                        totals.priceUTIntermediary = totals.priceUTIntermediary + line.priceUTIntermediary;

                        // Senior
                        line.totalSeniorUT = computedProfile.totalUT * (profile.percentageSenior / 100);
                        totals.totalSeniorUT = totals.totalSeniorUT + line.totalSeniorUT;

                        line.percentageUTSenior = computedProfile.percentUT * (profile.percentageSenior / 100);
                        totals.percentageUTSenior = totals.percentageUTSenior + line.percentageUTSenior;

                        line.priceSenior = computedProfile.totalPrice * (profile.computed.percentPriceSenior / 100);
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
                }
            });
            result.push(totals);
            return result;
        };

        // Event subscriptions
        self.on('render', function() {

            $('[data-property="totalUT"]').text(numeral(self.engine.data.computed.totalUT).format('0,0') + ' UT');
            $('[data-property="totalPrice"]').text(numeral(self.engine.data.computed.totalPrice).format('0,0 $'));

            if(_cachedGridProfiles) {
                $(self.gridSelectorProfiles).handsontable("updateSettings", {
                    data: _computeProfilesData()
                });
                _cachedGridProfiles.render();
                return;
            }

            $(self.gridSelectorProfiles).handsontable({
                data: _computeProfilesData(),
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
                    { data: 'priceAggregate',         type: 'price', readOnly: true },
                ],
                cells: function (row, col, prop) {
                    var cellProperties = {};
                    if(row === self.engine.data.profiles.length)
                        cellProperties.grandHeading = true;
                    return cellProperties;
                }
            });
            _cachedGridProfiles = $(self.gridSelectorProfiles).data('handsontable');
        });

        return self;
    }
})();
