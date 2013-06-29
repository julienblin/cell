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
         * Performs calculations on data.
         */
        self.performCalculations = function(data) {
            _averageProfiles(data);
        };

        return self;
    };
})(typeof exports === 'undefined'? window : exports);