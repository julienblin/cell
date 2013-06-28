ProjectCalculator = function(data) {
    this.data = data;
};

ProjectCalculator.prototype.parseInt = function(value) {
    if (!value) return 0;
    return parseInt(value);
};

ProjectCalculator.prototype.computeAverageProfiles = function() {
    var that = this;
    _.each(that.data.profiles, function(profile) {
        if (!profile.id) {
            profile.priceAverage = null;
            return;
        }

        if((that.parseInt(profile.percentageJunior) + that.parseInt(profile.percentageIntermediary) + that.parseInt(profile.percentageSenior)) != 100) {
            profile.priceAverage = null;
            return;
        }

        profile.priceAverage = Math.round(
            (that.parseInt(profile.priceJunior) * (that.parseInt(profile.percentageJunior) / 100)) +
            (that.parseInt(profile.priceIntermediary) * (that.parseInt(profile.percentageIntermediary) / 100)) +
            (that.parseInt(profile.priceSenior) * (that.parseInt(profile.percentageSenior) / 100)));
    });
};

ProjectCalculator.prototype.performCalculations = function() {
    var that = this;
    try {
        that.computeAverageProfiles();
    } catch (e) {
        console.log(e);
    }
};