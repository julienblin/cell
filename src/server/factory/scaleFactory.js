/**
 * Factory for scales.
 * Parameters Factory-Lady, but don't export anything
 */

"use strict";

var factory = require('mongoose-fakery'),
    Scale = require('../models/scale');

factory.fake('scale', Scale, {
    isActive: true,
    name: factory.g.name()
});