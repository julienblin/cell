/**
 * Factory for profiles.
 * Parameters Factory-Lady, but don't export anything
 */

"use strict";

var factory = require('mongoose-fakery'),
    ProfileProject = require('../models/profileProject');

factory.fake('profileProject', ProfileProject, {
    isActive: true,
    title: factory.g.name(),
    percentageJunior: 25,
    percentageIntermediary: 50,
    percentageSenior: 25
});