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

        var _getScaleColumnInfo = function(scale, columnId) {
            if(!scale.columns) return null;
            return _.findWhere(scale.columns, { id: columnId });
        };

        var _getProfile = function(data, profileId) {
            if(!data.profiles) return null;
            return _.findWhere(data.profiles, { id: profileId });
        };

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
                        var profile = _getProfile(data, colInfo.profile);
                        if(!(profile && profile.isActive)) return sum;
                        if(colInfo.isBaseline) return sum + self.parseFloat(value);
                        return sum;
                    }, 0);

                    scaleLine.totalUT = _.reduce(scaleLine.values, function(sum, value, key) {
                        var colInfo = _getScaleColumnInfo(scale, key);
                        if(!colInfo) return sum;
                        var profile = _getProfile(data, colInfo.profile);
                        if(!(profile && profile.isActive)) return sum;

                        if(colInfo.isBaseline) return sum;
                        return sum + (totalBaseline * (self.parseFloat(value) / 100));
                    }, totalBaseline);

                    scaleLine.totalPrice = _.reduce(scaleLine.values, function(sum, value, key) {
                        var colInfo = _getScaleColumnInfo(scale, key);
                        if(!colInfo) return sum;

                        var profile = _getProfile(data, colInfo.profile);
                        if(!(profile && profile.isActive && profile.priceAverage)) return sum;

                        var localUT = self.parseFloat(value);
                        if(!colInfo.isBaseline)
                            localUT = totalBaseline * (localUT / 100);

                        return sum + (profile.priceAverage * localUT);
                    }, 0);
                });
            });
        };

        var _getScale = function(data, scaleId) {
            if(!data.scales) return null;
            return _.findWhere(data.scales, { id: scaleId });
        };

        var _getScaleLine = function(data, scaleId, scaleLineId) {
            var scale = _getScale(data, scaleId);
            if(!scale) return null;
            return _.findWhere(scale.lines, { id: scaleLineId });
        };

        var _estimationLines = function(data) {
            var headingTotalLine = _.findWhere(data.estimationLines, { lineType: 'headingTotal' });
            if(!headingTotalLine) {
                headingTotalLine = {
                    lineType: 'headingTotal',
                    isActive: true,
                    title: 'Grand total'
                };
                data.estimationLines.splice(0, 0, headingTotalLine);
            } else {
                if(data.estimationLines.indexOf(headingTotalLine) !== 0) {
                    data.estimationLines.splice(data.estimationLines.indexOf(headingTotalLine), 0);
                    data.estimationLines.splice(0, 0, headingTotalLine);
                }
            }

            headingTotalLine.totalUT = 0;
            headingTotalLine.totalPrice = 0;

            for(var lineIndex = data.estimationLines.length - 1; lineIndex >= 0; --lineIndex) {
                var line = data.estimationLines[lineIndex];
                if(line.lineType === 'headingTotal') continue;

                var scaleLine = _getScaleLine(data, line.scale, line.complexity);
                if(!scaleLine) {
                    line.totalUT = null;
                    line.totalPrice = null;
                    continue;
                }

                if(!line.lineType) {
                    var coefficient = line.coefficient ? self.parseFloat(line.coefficient) : 1.0;
                    if(scaleLine.totalUT) {
                        line.totalUT = scaleLine.totalUT * coefficient;
                        if(line.isActive) {
                            headingTotalLine.totalUT = headingTotalLine.totalUT + line.totalUT;
                        }
                    }

                    if(scaleLine.totalPrice) {
                        line.totalPrice = scaleLine.totalPrice * coefficient;
                        if(line.isActive) {
                            headingTotalLine.totalPrice = headingTotalLine.totalPrice + line.totalPrice;
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
            _estimationLines(data);
        };

        return self;
    };
})(typeof exports === 'undefined'? window : exports);