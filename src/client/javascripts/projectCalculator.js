/**
 * The project calculator - responsible for computing values on data.
 * Should not update user-updatable values because there is no tracking on those modifications.
 */

(function(exports) {
    exports.ProjectCalculator = function() {
        var self = {};

        var _averageProfiles = function(data) {
            _.each(data.profiles, function(profile) {
                if (!profile.id) {
                    profile.priceAverage = null;
                    return;
                }

                if((self.parseInt(profile.percentageJunior) + self.parseInt(profile.percentageIntermediary) + self.parseInt(profile.percentageSenior)) != 100) {
                    profile.priceAverage = null;
                    return;
                }

                profile.priceAverage = Math.round(
                    (self.parseInt(profile.priceJunior) * (self.parseInt(profile.percentageJunior) / 100)) +
                        (self.parseInt(profile.priceIntermediary) * (self.parseInt(profile.percentageIntermediary) / 100)) +
                        (self.parseInt(profile.priceSenior) * (self.parseInt(profile.percentageSenior) / 100)));
            });
        };

        var _getScaleColumnInfo = function(scale, columnName) {
            if(!scale.columns) return null;
            return _.find(scale.columns, function(col) { return col[0] == columnName; });
        }

        var _scales = function(data) {
            _.each(data.scales, function(scale) {
                _.each(scale.lines, function(scaleLine) {
                    if(!scaleLine.values) scaleLine.values = {};

                    if(!scaleLine.id) {
                        scaleLine.totalUT = null;
                        scaleLine.totalPrice = null;
                        return;
                    }

                    var totalBaseline = _.reduce(scaleLine.values, function(sum, value, key) {
                        var colInfo = _getScaleColumnInfo(scale, key);
                        if(!colInfo) return sum;
                        var profile = _.findWhere(data.profiles, { title: colInfo[0] });
                        if(!(profile && profile.isActive)) return sum;
                        if(colInfo[1]) return sum + value;
                        return sum;
                    }, 0);

                    scaleLine.totalUT = _.reduce(scaleLine.values, function(sum, value, key) {
                        var colInfo = _getScaleColumnInfo(scale, key);
                        if(!colInfo) return sum;
                        var profile = _.findWhere(data.profiles, { title: colInfo[0] });
                        if(!(profile && profile.isActive)) return sum;

                        if(colInfo[1]) return sum;
                        return sum + (totalBaseline * (self.parseFloat(value) / 100));
                    }, totalBaseline);

                    scaleLine.totalPrice = _.reduce(scaleLine.values, function(sum, value, key) {
                        var colInfo = _getScaleColumnInfo(scale, key);
                        if(!colInfo) return sum;

                        var profile = _.findWhere(data.profiles, { title: colInfo[0] });
                        if(!(profile && profile.isActive && profile.priceAverage)) return sum;

                        var localUT = self.parseFloat(value);
                        if(!colInfo[1])
                            localUT = totalBaseline * (localUT / 100);

                        return sum + (profile.priceAverage * localUT);
                    }, 0);
                });
            });
        };

        // Public functions

        /**
         * parseInt() function that returns 0 when there is no value (instead of NaN).
         * @param value
         */
        self.parseInt = function(value) {
            if (!value) return 0;
            return parseInt(value);
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
         */
        self.performCalculations = function(data) {
            _averageProfiles(data);
            _scales(data);
        };

        return self;
    };
})(typeof exports === 'undefined'? window : exports);