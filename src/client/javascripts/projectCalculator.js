/**
 * The project calculator - responsible for computing values on data.
 * Should not update user-updatable values because there is no tracking on those modifications.
 * All computed values are attached through the documents on a special 'computed' property.
 *
 * The project calculator also indexes various entities through the 'nav' property.
 *
 * This file can be used client-side or server-side (for unit-testing).
 */

(function(exports) {
    "use strict";

    exports.ProjectCalculator = function() {
        var self = {};

        var PROFILE_LEVELS = [ 'Junior', 'Intermediary', 'Senior' ];

        var _processProfiles = function(data) {
            data.nav.profiles = {};

            for(var indexProfile in data.profiles) {
                var profile = data.profiles[indexProfile];
                profile.computed = {
                    profileAveragePrice: undefined,
                    profilePercentPriceJunior: undefined,
                    profilePercentPriceIntermediary: undefined,
                    profilePercentPriceSenior: undefined
                };

                if (!profile.id) continue;

                data.nav.profiles[profile.id] = profile;

                if((self.parseInt(profile.percentageJunior) + self.parseInt(profile.percentageIntermediary) + self.parseInt(profile.percentageSenior)) != 100) continue;
                if(!(profile.priceJunior || profile.priceIntermediary || profile.priceSenior)) continue;


                profile.computed.profileAveragePrice =
                    (self.parseInt(profile.priceJunior) * self.parseInt(profile.percentageJunior) +
                        self.parseInt(profile.priceIntermediary) * self.parseInt(profile.percentageIntermediary) +
                        self.parseInt(profile.priceSenior) * self.parseInt(profile.percentageSenior)
                        ) / 100;

                for(var indexLevel in PROFILE_LEVELS) {
                    var level = PROFILE_LEVELS[indexLevel];
                    profile.computed['profilePercentPrice' + level] = (self.parseInt(profile['price' + level]) * self.parseInt(profile['percentage' + level])) / profile.computed.profileAveragePrice;
                }
            }
        };

        var _processScales = function(data) {
            data.nav.scales = {};
            data.nav.scaleColumns = {};
            data.nav.scaleLines = {};

            for(var indexScale in data.scales) {
                var scale = data.scales[indexScale];
                if (!scale.id) continue;

                data.nav.scales[scale.id] = scale;
                for(var indexScaleColumn in scale.columns) {
                    var column = scale.columns[indexScaleColumn];
                    data.nav.scaleColumns[column.id] = column;
                }

                for(var indexScaleLine in scale.lines) {
                    var line = scale.lines[indexScaleLine];

                    line.computed = {
                        lineTotalUT: undefined,
                        lineTotalPrice: undefined
                    };
                    if (!line.id) continue;

                    data.nav.scaleLines[line.id] = line;

                    var columnId, value;
                    var totalBaseline = 0;
                    for(columnId in line.values) {
                        var column = data.nav.scaleColumns[columnId];
                        if(!(column && column.profile)) continue;

                        var profile = data.nav.profiles[column.profile];
                        if(!(profile && profile.isActive)) continue;

                        value = line.values[columnId];
                        if(column.isBaseline)
                            totalBaseline = totalBaseline + self.parseFloat(value);
                    }

                    line.computed = {
                        lineTotalUT: 0,
                        lineTotalPrice: 0
                    };

                    for(var columnId in line.values) {
                        var value = line.values[columnId];
                        var column = data.nav.scaleColumns[columnId];
                        if(!(column && column.profile)) continue;

                        var profile = data.nav.profiles[column.profile];
                        if(!(profile && profile.isActive)) continue;

                        var valueUT = column.isBaseline ? self.parseFloat(value) : (totalBaseline * (self.parseFloat(value) / 100));
                        line.computed.lineTotalUT = line.computed.lineTotalUT + valueUT;
                        if(profile.computed.profileAveragePrice) {
                            line.computed.lineTotalPrice = line.computed.lineTotalPrice + (valueUT * profile.computed.profileAveragePrice);
                        }
                    }
                }
            }
        };

        // Public functions

        /**
         * parseInt() function that returns 0 when there is no value (instead of NaN).
         * @param value
         */
        self.parseInt = function(value) {
            if (!value) return 0;
            return parseInt(value, 10);
        };

        /**
         * parseFloat() function that returns 0.0 when there is no value (instead of NaN).
         * @param value
         */
        self.parseFloat = function(value) {
            if (!value) return 0.0;
            return parseFloat(value);
        };

        /**
         * Performs calculations on data.
         * @param data
         */
        self.performCalculations = function(data) {
            if(!data.nav) data.nav = {};
            _processProfiles(data);
            _processScales(data);
        };

        return self;
    };
})(typeof exports === 'undefined'? window : exports);