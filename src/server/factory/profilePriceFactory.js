/**
 * Factory for profiles.
 * Parameters Factory-Lady, but don't export anything
 */

"use strict";

var factory = require('mongoose-fakery'),
    ProfilePrice = require('../models/profilePrice');

factory.fake('profilePrice', ProfilePrice, {
    isActive: true,
    title: factory.g.name(),
    priceJunior: factory.g.rndint(300, 800),
    priceIntermediary: factory.g.rndint(800, 1000),
    priceSenior: factory.g.rndint(1000, 1500)
});