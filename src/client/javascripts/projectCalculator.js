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

            var column, columnId, value, profile;

            for(var indexScale in data.scales) {
                var scale = data.scales[indexScale];
                if (!scale.id) continue;

                data.nav.scales[scale.id] = scale;
                for(var indexScaleColumn in scale.columns) {
                    column = scale.columns[indexScaleColumn];
                    data.nav.scaleColumns[column.id] = column;
                }

                for(var indexScaleLine in scale.lines) {
                    var line = scale.lines[indexScaleLine];

                    line.computed = {
                        lineTotalUT: undefined,
                        lineTotalPrice: undefined,
                        profiles: {}
                    };
                    if (!line.id) continue;

                    data.nav.scaleLines[line.id] = line;

                    var totalBaseline = 0;
                    for(columnId in line.values) {
                        column = data.nav.scaleColumns[columnId];
                        if(!(column && column.profile)) continue;

                        profile = data.nav.profiles[column.profile];
                        if(!(profile && profile.isActive)) continue;

                        value = line.values[columnId];
                        if(column.isBaseline)
                            totalBaseline = totalBaseline + self.parseFloat(value);
                    }

                    line.computed = {
                        lineTotalUT: 0,
                        lineTotalPrice: 0,
                        profiles: {}
                    };

                    for(columnId in line.values) {
                        value = line.values[columnId];
                        column = data.nav.scaleColumns[columnId];
                        if(!(column && column.profile)) continue;

                        profile = data.nav.profiles[column.profile];
                        if(!(profile && profile.isActive)) continue;

                        var valueUT = column.isBaseline ? self.parseFloat(value) : ((totalBaseline * (self.parseFloat(value) / 100)).toFixed(2));
                        line.computed.lineTotalUT = +line.computed.lineTotalUT + +valueUT;
                        if(profile.computed.profileAveragePrice) {
                            line.computed.lineTotalPrice = +line.computed.lineTotalPrice + +(valueUT * profile.computed.profileAveragePrice);
                        }

                        if(!line.computed.profiles[profile.id]) {
                            line.computed.profiles[profile.id] = {
                                lineTotalUT: 0,
                                lineTotalPrice: 0
                            };
                        }

                        line.computed.profiles[profile.id].lineTotalUT = +line.computed.profiles[profile.id].lineTotalUT + +valueUT;
                        line.computed.profiles[profile.id].lineTotalPrice = +line.computed.profiles[profile.id].lineTotalPrice + +(valueUT * profile.computed.profileAveragePrice);
                    }
                }
            }
        };

        var _findHeadingTotalIndex = function(estimationLines) {
            for(var index in estimationLines) {
                if(estimationLines[index].lineType === 'headingTotal') {
                    return index;
                }
            }
            return -1;
        };

        var _processEstimationLines = function(data) {

            var indexHeading, headings = {
                headingTotal: {},
                heading1: {},
                heading2: {}
            };

            for(indexHeading in headings)
                headings[indexHeading] = {
                    lineTotalUT: 0,
                    lineTotalPrice: 0,
                    profiles: {}
                };

            // We process backwards for headings accumulation
            for(var lineIndex = data.estimationLines.length - 1; lineIndex >= 0; --lineIndex) {
                var profileId, line = data.estimationLines[lineIndex];
                line.computed = {
                    lineTotalUT: undefined,
                    lineTotalPrice: undefined,
                    profiles: {}
                };

                if(!line.id) continue;

                if(!line.lineType) {
                    if(!(line.scale && line.complexity)) continue;
                    var scaleLine = data.nav.scaleLines[line.complexity];
                    if(!(scaleLine && scaleLine.isActive)) continue;

                    var coefficient = line.coefficient ? self.parseFloat(line.coefficient) : 1;
                    line.computed.lineTotalUT = scaleLine.computed.lineTotalUT * coefficient;
                    line.computed.lineTotalPrice = scaleLine.computed.lineTotalPrice * coefficient;
                    for(profileId in scaleLine.computed.profiles) {
                        line.computed.profiles[profileId] = {
                            lineTotalUT: scaleLine.computed.profiles[profileId].lineTotalUT * coefficient,
                            lineTotalPrice: scaleLine.computed.profiles[profileId].lineTotalPrice * coefficient
                        };
                    }

                    if(line.isActive) {
                        for(indexHeading in headings) {
                            headings[indexHeading].lineTotalUT = headings[indexHeading].lineTotalUT + line.computed.lineTotalUT;
                            headings[indexHeading].lineTotalPrice = headings[indexHeading].lineTotalPrice + line.computed.lineTotalPrice;
                            for(profileId in line.computed.profiles) {
                                if(!headings[indexHeading].profiles[profileId])
                                    headings[indexHeading].profiles[profileId] = {
                                        lineTotalUT: 0,
                                        lineTotalPrice: 0
                                    };

                                headings[indexHeading].profiles[profileId].lineTotalUT = headings[indexHeading].profiles[profileId].lineTotalUT + line.computed.profiles[profileId].lineTotalUT;
                                headings[indexHeading].profiles[profileId].lineTotalPrice = headings[indexHeading].profiles[profileId].lineTotalPrice + line.computed.profiles[profileId].lineTotalPrice;
                            }
                        }
                    }

                } else {
                    line.computed.lineTotalUT = headings[line.lineType].lineTotalUT;
                    line.computed.lineTotalPrice = headings[line.lineType].lineTotalPrice;
                    for(profileId in headings[line.lineType].profiles) {
                        line.computed.profiles[profileId] = {
                            lineTotalUT: headings[line.lineType].profiles[profileId].lineTotalUT,
                            lineTotalPrice: headings[line.lineType].profiles[profileId].lineTotalPrice
                        };
                    }

                    headings[line.lineType] = {
                        lineTotalUT: 0,
                        lineTotalPrice: 0,
                        profiles: {}
                    };

                    if(line.lineType === 'heading1')
                        headings.heading2 = {
                            lineTotalUT: 0,
                            lineTotalPrice: 0,
                            profiles: {}
                        };
                }
            }

            if(data.estimationLines.length > 0) {
                var firstLine = data.estimationLines[0];
                if(firstLine.lineType !== 'headingTotal') {
                    var currentHeadingTotalIndex = _findHeadingTotalIndex(data.estimationLines);
                    if(currentHeadingTotalIndex !== -1) {
                        data.estimationLines.splice(currentHeadingTotalIndex, 1);
                    }
                    firstLine = {
                        title: 'Grand total',
                        lineType: 'headingTotal'
                    };
                    data.estimationLines.splice(0, 0, firstLine);
                }

                firstLine.computed = headings.headingTotal;
            }
        };

        var _processProject = function(data) {
            if(data.estimationLines.length > 0) {
                var grandTotal = data.estimationLines[0];
                data.computed = {
                    totalUT: grandTotal.computed.lineTotalUT,
                    totalPrice: grandTotal.computed.lineTotalPrice,
                    profiles: {}
                };
                for(var profileId in grandTotal.computed.profiles) {
                    data.computed.profiles[profileId] = {
                        totalUT: grandTotal.computed.profiles[profileId].lineTotalUT,
                        totalPrice: grandTotal.computed.profiles[profileId].lineTotalPrice
                    };
                }
            } else {
                data.computed = {
                    totalUT: 0,
                    totalPrice: 0,
                    profiles: {}
                };
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
            _processEstimationLines(data);
            _processProject(data);
        };

        return self;
    };
})(typeof exports === 'undefined'? window : exports);