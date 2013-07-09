/**
 * The project calculator - responsible for computing values on data.
 * Should not update user-updatable values because there is no tracking on those modifications.
 */

(function(exports) {
    exports.ProjectCalculator = function() {
        var self = {};

        var _averageProfiles = function(data) {
            _.each(data.profiles, function(profile) {
                if(!profile.computed) profile.computed = {};
                if (!profile.id) {
                    profile.computed.priceAverage = null;
                    return;
                }

                if((self.parseInt(profile.percentageJunior) + self.parseInt(profile.percentageIntermediary) + self.parseInt(profile.percentageSenior)) != 100) {
                    profile.computed.priceAverage = null;
                    profile.computed.percentPriceJunior = null;
                    profile.computed.percentPriceIntermediary = null;
                    profile.computed.percentPriceSenior = null;
                    return;
                }

                profile.computed.priceAverage =
                    (self.parseInt(profile.priceJunior) * (self.parseInt(profile.percentageJunior) / 100)) +
                        (self.parseInt(profile.priceIntermediary) * (self.parseInt(profile.percentageIntermediary) / 100)) +
                        (self.parseInt(profile.priceSenior) * (self.parseInt(profile.percentageSenior) / 100));

                profile.computed.percentPriceJunior = (self.parseInt(profile.priceJunior) * self.parseInt(profile.percentageJunior)) / profile.computed.priceAverage;
                profile.computed.percentPriceIntermediary = (self.parseInt(profile.priceIntermediary) * self.parseInt(profile.percentageIntermediary)) / profile.computed.priceAverage;
                profile.computed.percentPriceSenior = (self.parseInt(profile.priceSenior) * self.parseInt(profile.percentageSenior)) / profile.computed.priceAverage;
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
                    if(!scaleLine.computed) scaleLine.computed = {};

                    if(!scaleLine.values) scaleLine.values = {};

                    if(!scaleLine.id) {
                        scaleLine.computed.totalUT = null;
                        scaleLine.computed.totalPrice = null;
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

                    scaleLine.computed.totalUT = _.reduce(scaleLine.values, function(sum, value, key) {
                        var colInfo = _getScaleColumnInfo(scale, key);
                        if(!colInfo) return sum;

                        var profile = _getProfile(data, colInfo.profile);
                        if(!(profile && profile.isActive)) return sum;

                        if(colInfo.isBaseline) return sum;
                        return sum + (totalBaseline * (self.parseFloat(value) / 100));
                    }, totalBaseline);

                    scaleLine.computed.profiles = {};

                    scaleLine.computed.totalPrice = _.reduce(scaleLine.values, function(sum, value, key) {
                        var colInfo = _getScaleColumnInfo(scale, key);
                        if(!colInfo) return sum;

                        var profile = _getProfile(data, colInfo.profile);
                        if(!(profile && profile.isActive && profile.computed.priceAverage)) return sum;

                        var localUT = self.parseFloat(value);
                        if(!colInfo.isBaseline)
                            localUT = totalBaseline * (localUT / 100);

                        // Details per profiles
                        if(!scaleLine.computed.profiles[profile.id]) {
                            scaleLine.computed.profiles[profile.id] = {};
                            scaleLine.computed.profiles[profile.id].totalUT = 0;
                            scaleLine.computed.profiles[profile.id].totalPrice = 0;
                        }
                        scaleLine.computed.profiles[profile.id].totalUT = scaleLine.computed.profiles[profile.id].totalUT + localUT;
                        scaleLine.computed.profiles[profile.id].totalPrice = scaleLine.computed.profiles[profile.id].totalPrice + (profile.computed.priceAverage * localUT);

                        return sum + (profile.computed.priceAverage * localUT);
                    }, 0);

                    _.each(scaleLine.computed.profiles, function(values) {
                        values.percentUT = scaleLine.computed.totalUT == 0 ? 0 : (values.totalUT * 100) / scaleLine.computed.totalUT;
                        values.percentPrice = scaleLine.computed.totalPrice == 0 ? 0 : (values.totalPrice * 100) / scaleLine.computed.totalPrice;
                    });
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
                    title: 'Grand total',
                    computed: {}
                };
                data.estimationLines.splice(0, 0, headingTotalLine);
            } else {
                if(data.estimationLines.indexOf(headingTotalLine) !== 0) {
                    data.estimationLines.splice(data.estimationLines.indexOf(headingTotalLine), 0);
                    data.estimationLines.splice(0, 0, headingTotalLine);
                }
            }

            headingTotalLine.computed.totalUT = 0;
            headingTotalLine.computed.totalPrice = 0;
            headingTotalLine.computed.profiles = {};

            var currentHeading1 = {
                totalUT: 0,
                totalPrice: 0,
                profiles: {}
            };

            var currentHeading2 = {
                totalUT: 0,
                totalPrice: 0,
                profiles: {}
            };

            for(var lineIndex = data.estimationLines.length - 1; lineIndex >= 0; --lineIndex) {
                var line = data.estimationLines[lineIndex];
                if(!line.computed) line.computed = {};

                if(line.lineType === 'headingTotal') continue;

                if(line.lineType === 'heading1') {
                    line.computed.totalUT = currentHeading1.totalUT;
                    line.computed.totalPrice = currentHeading1.totalPrice;
                    line.computed.profiles = {};
                    _.each(currentHeading1.profiles, function(values, profileId) {
                        line.computed.profiles[profileId] = values;
                        line.computed.profiles[profileId].percentUT = line.computed.totalUT == 0 ? 0 : ((line.computed.profiles[profileId].totalUT * 100) / line.computed.totalUT);
                        line.computed.profiles[profileId].percentPrice = line.computed.totalPrice == 0 ? 0 : ((line.computed.profiles[profileId].totalPrice * 100) / line.computed.totalPrice);
                    });
                    currentHeading1 = {
                        totalUT: 0,
                        totalPrice: 0,
                        profiles: {}
                    };
                    continue;
                }

                if(line.lineType === 'heading2') {
                    line.computed.totalUT = currentHeading2.totalUT;
                    line.computed.totalPrice = currentHeading2.totalPrice;
                    line.computed.profiles = {};
                    _.each(currentHeading2.profiles, function(values, profileId) {
                        line.computed.profiles[profileId] = values;
                        line.computed.profiles[profileId].percentUT = line.computed.totalUT == 0 ? 0 : ((line.computed.profiles[profileId].totalUT * 100) / line.computed.totalUT);
                        line.computed.profiles[profileId].percentPrice = line.computed.totalPrice == 0 ? 0 : ((line.computed.profiles[profileId].totalPrice * 100) / line.computed.totalPrice);
                    });
                    currentHeading2 = {
                        totalUT: 0,
                        totalPrice: 0,
                        profiles: {}
                    };
                    continue;
                }

                var scaleLine = _getScaleLine(data, line.scale, line.complexity);
                if(!scaleLine) {
                    line.computed.totalUT = null;
                    line.computed.totalPrice = null;
                    line.computed.profiles = {};
                    continue;
                }

                if(!line.lineType) {
                    var coefficient = line.coefficient ? self.parseFloat(line.coefficient) : 1.0;
                    if(scaleLine.computed.totalUT) {
                        line.computed.totalUT = scaleLine.computed.totalUT * coefficient;
                        if(line.isActive) {
                            headingTotalLine.computed.totalUT = headingTotalLine.computed.totalUT + line.computed.totalUT;
                            currentHeading1.totalUT = currentHeading1.totalUT + line.computed.totalUT;
                            currentHeading2.totalUT = currentHeading2.totalUT + line.computed.totalUT;
                        }
                    }

                    if(scaleLine.computed.totalPrice) {
                        line.computed.totalPrice = scaleLine.computed.totalPrice * coefficient;
                        if(line.isActive) {
                            headingTotalLine.computed.totalPrice = headingTotalLine.computed.totalPrice + line.computed.totalPrice;
                            currentHeading1.totalPrice = currentHeading1.totalPrice + line.computed.totalPrice;
                            currentHeading2.totalPrice = currentHeading2.totalPrice + line.computed.totalPrice;
                        }
                    }

                    line.computed.profiles = {};

                    if(line.isActive) {
                        _.each(scaleLine.computed.profiles, function(values, profileId) {
                            line.computed.profiles[profileId] = {};
                            line.computed.profiles[profileId].percentUT = values.percentUT;
                            line.computed.profiles[profileId].percentPrice = values.percentPrice;
                            line.computed.profiles[profileId].totalUT =  line.computed.totalUT * (values.percentUT / 100);
                            line.computed.profiles[profileId].totalPrice = line.computed.totalPrice * (values.percentPrice / 100);

                            if(!headingTotalLine.computed.profiles[profileId]) {
                                headingTotalLine.computed.profiles[profileId] = {};
                                headingTotalLine.computed.profiles[profileId].totalUT = 0;
                                headingTotalLine.computed.profiles[profileId].totalPrice = 0;
                            }
                            headingTotalLine.computed.profiles[profileId].totalUT = headingTotalLine.computed.profiles[profileId].totalUT + line.computed.profiles[profileId].totalUT;
                            headingTotalLine.computed.profiles[profileId].totalPrice = headingTotalLine.computed.profiles[profileId].totalPrice + line.computed.profiles[profileId].totalPrice;

                            if(!currentHeading1.profiles[profileId]) {
                                currentHeading1.profiles[profileId] = {};
                                currentHeading1.profiles[profileId].totalUT = 0;
                                currentHeading1.profiles[profileId].totalPrice = 0;
                            }
                            currentHeading1.profiles[profileId].totalUT = currentHeading1.profiles[profileId].totalUT + line.computed.profiles[profileId].totalUT;
                            currentHeading1.profiles[profileId].totalPrice = currentHeading1.profiles[profileId].totalPrice + line.computed.profiles[profileId].totalPrice;

                            if(!currentHeading2.profiles[profileId]) {
                                currentHeading2.profiles[profileId] = {};
                                currentHeading2.profiles[profileId].totalUT = 0;
                                currentHeading2.profiles[profileId].totalPrice = 0;
                            }
                            currentHeading2.profiles[profileId].totalUT = currentHeading2.profiles[profileId].totalUT + line.computed.profiles[profileId].totalUT;
                            currentHeading2.profiles[profileId].totalPrice = currentHeading2.profiles[profileId].totalPrice + line.computed.profiles[profileId].totalPrice;
                        });
                    }
                }
            }

            _.each(headingTotalLine.computed.profiles, function(values, profileId) {
                headingTotalLine.computed.profiles[profileId].percentUT = headingTotalLine.computed.totalUT == 0 ? 0 : ((headingTotalLine.computed.profiles[profileId].totalUT * 100) / headingTotalLine.computed.totalUT);
                headingTotalLine.computed.profiles[profileId].percentPrice = headingTotalLine.computed.totalPrice == 0 ? 0 : ((headingTotalLine.computed.profiles[profileId].totalPrice * 100) / headingTotalLine.computed.totalPrice);
            });

            if(!data.computed) data.computed = {};
            data.computed.totalUT = headingTotalLine.computed.totalUT;
            data.computed.totalPrice = headingTotalLine.computed.totalPrice;
            data.computed.profiles = headingTotalLine.computed.profiles;
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