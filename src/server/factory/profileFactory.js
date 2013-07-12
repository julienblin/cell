/**
 * Factory for profiles.
 * Parameters Factory-Lady, but don't export anything
 */

"use strict";

var factory = require('mongoose-fakery'),
    Profile = require('../models/profile');

factory.fake('profile', Profile, {
    isActive: true,
    title: factory.g.name(),
    percentageJunior: 25,
    percentageIntermediary: 50,
    percentageSenior: 25,
    priceJunior: factory.g.rndint(300, 800),
    priceIntermediary: factory.g.rndint(800, 1000),
    priceSenior: factory.g.rndint(1000, 1500)
});