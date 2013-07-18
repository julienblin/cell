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

        var _processProfilePrices = function(data) {
            data.nav.profilePrices = {};

            for(var indexProfilePrice in data.profilePrices) {
                var profilePrice = data.profilePrices[indexProfilePrice];
                if (!profilePrice.id) continue;

                data.nav.profilePrices[profilePrice.id] = profilePrice;
            }
        };

        var _processProfileProjects = function(data) {
            data.nav.profileProjects = {};

            for(var indexProfileProject in data.profileProjects) {
                var profileProject = data.profileProjects[indexProfileProject];
                profileProject.computed = {
                    profileAveragePrice: undefined,
                    profilePercentPriceJunior: undefined,
                    profilePercentPriceIntermediary: undefined,
                    profilePercentPriceSenior: undefined
                };

                if (!profileProject.id) continue;

                data.nav.profileProjects[profileProject.id] = profileProject;

                if((self.parseInt(profileProject.percentageJunior) + self.parseInt(profileProject.percentageIntermediary) + self.parseInt(profileProject.percentageSenior)) != 100) continue;
                var profilePrice = profileProject.profilePrice ? data.nav.profilePrices[profileProject.profilePrice] : undefined;
                if(!(profilePrice && profilePrice.isActive)) continue;

                profileProject.computed.profileAveragePrice =
                    (self.parseInt(profilePrice.priceJunior) * self.parseInt(profileProject.percentageJunior) +
                        self.parseInt(profilePrice.priceIntermediary) * self.parseInt(profileProject.percentageIntermediary) +
                        self.parseInt(profilePrice.priceSenior) * self.parseInt(profileProject.percentageSenior)
                        ) / 100;

                for(var indexLevel in PROFILE_LEVELS) {
                    var level = PROFILE_LEVELS[indexLevel];
                    if(profileProject.computed.profileAveragePrice === 0)
                        profileProject.computed['profilePercentPrice' + level] = 0;
                    else
                        profileProject.computed['profilePercentPrice' + level] = (self.parseInt(profilePrice['price' + level]) * self.parseInt(profileProject['percentage' + level])) / profileProject.computed.profileAveragePrice;
                }
            }
        };

        var _processScales = function(data) {
            data.nav.scales = {};
            data.nav.scaleColumns = {};
            data.nav.scaleLines = {};

            var column, columnId, value, profileProject;

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
                    if(!line.values) line.values = {};

                    line.computed = {
                        lineTotalUT: undefined,
                        lineTotalPrice: undefined,
                        profileProjects: {}
                    };
                    if (!line.id) continue;

                    data.nav.scaleLines[line.id] = line;

                    var totalBaseline = 0;
                    for(columnId in line.values) {
                        column = data.nav.scaleColumns[columnId];
                        if(!(column && column.profileProject)) continue;

                        profileProject = data.nav.profileProjects[column.profileProject];
                        if(!(profileProject && profileProject.isActive)) continue;

                        value = line.values[columnId];
                        if(column.isBaseline)
                            totalBaseline = totalBaseline + self.parseFloat(value);
                    }

                    line.computed = {
                        lineTotalUT: 0,
                        lineTotalPrice: 0,
                        profileProjects: {}
                    };

                    for(columnId in line.values) {
                        value = line.values[columnId];
                        column = data.nav.scaleColumns[columnId];
                        if(!(column && column.profileProject)) continue;

                        profileProject = data.nav.profileProjects[column.profileProject];
                        if(!(profileProject && profileProject.isActive)) continue;

                        var valueUT = column.isBaseline ? self.parseFloat(value) : ((totalBaseline * (self.parseFloat(value) / 100)).toFixed(2));
                        line.computed.lineTotalUT = +line.computed.lineTotalUT + +valueUT;
                        if(profileProject.computed.profileAveragePrice) {
                            line.computed.lineTotalPrice = +line.computed.lineTotalPrice + +(valueUT * profileProject.computed.profileAveragePrice);
                        }

                        if(!line.computed.profileProjects[profileProject.id]) {
                            line.computed.profileProjects[profileProject.id] = {
                                lineTotalUT: 0,
                                lineTotalPrice: 0
                            };
                        }

                        line.computed.profileProjects[profileProject.id].lineTotalUT = +line.computed.profileProjects[profileProject.id].lineTotalUT + +valueUT;
                        line.computed.profileProjects[profileProject.id].lineTotalPrice = +line.computed.profileProjects[profileProject.id].lineTotalPrice + +(valueUT * profileProject.computed.profileAveragePrice);
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
                    profileProjects: {},
                    profilePrices: {},
                    scales: {},
                    scaleLines: {}
                };

            // We process backwards for headings accumulation
            for(var lineIndex = data.estimationLines.length - 1; lineIndex >= 0; --lineIndex) {
                var profileProjectId, profilePriceId, targetProfile, scaleId, scaleLineId;
                var line = data.estimationLines[lineIndex];
                line.computed = {
                    lineTotalUT: undefined,
                    lineTotalPrice: undefined,
                    profileProjects: {},
                    profilePrices: {},
                    scales: {},
                    scaleLines: {}
                };

                if(!line.id) continue;

                if(!line.lineType) {
                    if(!(line.scale && line.complexity)) continue;
                    var scaleLine = data.nav.scaleLines[line.complexity];
                    if(!(scaleLine && scaleLine.isActive)) continue;

                    var coefficient = line.coefficient ? self.parseFloat(line.coefficient) : 1;
                    line.computed.lineTotalUT = scaleLine.computed.lineTotalUT * coefficient;
                    line.computed.lineTotalPrice = scaleLine.computed.lineTotalPrice * coefficient;
                    for(profileProjectId in scaleLine.computed.profileProjects) {
                        line.computed.profileProjects[profileProjectId] = {
                            lineTotalUT: scaleLine.computed.profileProjects[profileProjectId].lineTotalUT * coefficient,
                            lineTotalPrice: scaleLine.computed.profileProjects[profileProjectId].lineTotalPrice * coefficient
                        };
                        targetProfile = data.nav.profileProjects[profileProjectId];
                        if(targetProfile && targetProfile.profilePrice) {
                            line.computed.profilePrices[targetProfile.profilePrice] = line.computed.profileProjects[profileProjectId];
                        }
                    }

                    if(line.isActive) {
                        for(indexHeading in headings) {
                            headings[indexHeading].lineTotalUT = headings[indexHeading].lineTotalUT + line.computed.lineTotalUT;
                            headings[indexHeading].lineTotalPrice = headings[indexHeading].lineTotalPrice + line.computed.lineTotalPrice;
                            for(profileProjectId in line.computed.profileProjects) {
                                if(!headings[indexHeading].profileProjects[profileProjectId])
                                    headings[indexHeading].profileProjects[profileProjectId] = {
                                        lineTotalUT: 0,
                                        lineTotalPrice: 0
                                    };

                                headings[indexHeading].profileProjects[profileProjectId].lineTotalUT = headings[indexHeading].profileProjects[profileProjectId].lineTotalUT + line.computed.profileProjects[profileProjectId].lineTotalUT;
                                headings[indexHeading].profileProjects[profileProjectId].lineTotalPrice = headings[indexHeading].profileProjects[profileProjectId].lineTotalPrice + line.computed.profileProjects[profileProjectId].lineTotalPrice;
                            }

                            for(profilePriceId in line.computed.profilePrices) {
                                if(!headings[indexHeading].profilePrices[profilePriceId])
                                    headings[indexHeading].profilePrices[profilePriceId] = {
                                        lineTotalUT: 0,
                                        lineTotalPrice: 0
                                    };

                                headings[indexHeading].profilePrices[profilePriceId].lineTotalUT = headings[indexHeading].profilePrices[profilePriceId].lineTotalUT + line.computed.profilePrices[profilePriceId].lineTotalUT;
                                headings[indexHeading].profilePrices[profilePriceId].lineTotalPrice = headings[indexHeading].profilePrices[profilePriceId].lineTotalPrice + line.computed.profilePrices[profilePriceId].lineTotalPrice;
                            }

                            if(!headings[indexHeading].scaleLines[scaleLine.id])
                                headings[indexHeading].scaleLines[scaleLine.id] = {
                                    lineTotalUT: 0,
                                    lineTotalPrice: 0
                                };

                            headings[indexHeading].scaleLines[scaleLine.id].lineTotalUT = headings[indexHeading].scaleLines[scaleLine.id].lineTotalUT + line.computed.lineTotalUT;
                            headings[indexHeading].scaleLines[scaleLine.id].lineTotalPrice = headings[indexHeading].scaleLines[scaleLine.id].lineTotalPrice + line.computed.lineTotalPrice;

                            var scale = data.nav.scales[line.scale];
                            if(scale) {
                                if(!headings[indexHeading].scales[scale.id])
                                    headings[indexHeading].scales[scale.id] = {
                                        lineTotalUT: 0,
                                        lineTotalPrice: 0
                                    };

                                headings[indexHeading].scales[scale.id].lineTotalUT = headings[indexHeading].scales[scale.id].lineTotalUT + line.computed.lineTotalUT;
                                headings[indexHeading].scales[scale.id].lineTotalPrice = headings[indexHeading].scales[scale.id].lineTotalPrice + line.computed.lineTotalPrice;
                            }
                        }
                    }

                } else {
                    line.computed.lineTotalUT = headings[line.lineType].lineTotalUT;
                    line.computed.lineTotalPrice = headings[line.lineType].lineTotalPrice;
                    for(profileProjectId in headings[line.lineType].profileProjects) {
                        line.computed.profileProjects[profileProjectId] = {
                            lineTotalUT: headings[line.lineType].profileProjects[profileProjectId].lineTotalUT,
                            lineTotalPrice: headings[line.lineType].profileProjects[profileProjectId].lineTotalPrice
                        };
                    }
                    for(profilePriceId in headings[line.lineType].profilePrices) {
                        line.computed.profilePrices[profilePriceId] = {
                            lineTotalUT: headings[line.lineType].profilePrices[profilePriceId].lineTotalUT,
                            lineTotalPrice: headings[line.lineType].profilePrices[profilePriceId].lineTotalPrice
                        };
                    }
                    for(scaleId in headings[line.lineType].scales) {
                        line.computed.scales[scaleId] = {
                            lineTotalUT: headings[line.lineType].scales[scaleId].lineTotalUT,
                            lineTotalPrice: headings[line.lineType].scales[scaleId].lineTotalPrice
                        };
                    }
                    for(scaleLineId in headings[line.lineType].scaleLines) {
                        line.computed.scaleLines[scaleLineId] = {
                            lineTotalUT: headings[line.lineType].scaleLines[scaleLineId].lineTotalUT,
                            lineTotalPrice: headings[line.lineType].scaleLines[scaleLineId].lineTotalPrice
                        };
                    }

                    headings[line.lineType] = {
                        lineTotalUT: 0,
                        lineTotalPrice: 0,
                        profileProjects: {},
                        profilePrices: {},
                        scales: {},
                        scaleLines: {}
                    };

                    if(line.lineType === 'heading1')
                        headings.heading2 = {
                            lineTotalUT: 0,
                            lineTotalPrice: 0,
                            profileProjects: {},
                            profilePrices: {},
                            scales: {},
                            scaleLines: {}
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
            data.computed = {
                totalUT: 0,
                totalPrice: 0,
                profileProjects: {},
                profilePrices: {},
                scales: {},
                scaleLines: {}
            };

            if(data.estimationLines.length > 0) {
                var grandTotal = data.estimationLines[0];
                data.computed.totalUT = grandTotal.computed.lineTotalUT;
                data.computed.totalPrice = grandTotal.computed.lineTotalPrice;
                for(var profileProjectId in grandTotal.computed.profileProjects) {
                    data.computed.profileProjects[profileProjectId] = {
                        totalUT: grandTotal.computed.profileProjects[profileProjectId].lineTotalUT,
                        totalPrice: grandTotal.computed.profileProjects[profileProjectId].lineTotalPrice
                    };
                }
                for(var profilePriceId in grandTotal.computed.profilePrices) {
                    data.computed.profilePrices[profilePriceId] = {
                        totalUT: grandTotal.computed.profilePrices[profilePriceId].lineTotalUT,
                        totalPrice: grandTotal.computed.profilePrices[profilePriceId].lineTotalPrice
                    };
                }
                for(var scaleId in grandTotal.computed.scales) {
                    data.computed.scales[scaleId] = {
                        totalUT: grandTotal.computed.scales[scaleId].lineTotalUT,
                        totalPrice: grandTotal.computed.scales[scaleId].lineTotalPrice
                    };
                }
                for(var scaleLineId in grandTotal.computed.scaleLines) {
                    data.computed.scaleLines[scaleLineId] = {
                        totalUT: grandTotal.computed.scaleLines[scaleLineId].lineTotalUT,
                        totalPrice: grandTotal.computed.scaleLines[scaleLineId].lineTotalPrice
                    };
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
            _processProfilePrices(data);
            _processProfileProjects(data);
            _processScales(data);
            _processEstimationLines(data);
            _processProject(data);
        };

        return self;
    };
})(typeof exports === 'undefined'? window : exports);