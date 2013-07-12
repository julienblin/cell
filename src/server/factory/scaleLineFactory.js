/**
 * Factory for scales lines.
 * Parameters Factory-Lady, but don't export anything
 */

"use strict";

var factory = require('mongoose-fakery'),
    ScaleLine = require('../models/scaleLine');

factory.fake('scaleLine', ScaleLine, {
    isActive: true,
    complexity: factory.g.name()
});