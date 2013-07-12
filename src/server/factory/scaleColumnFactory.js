/**
 * Factory for scales columns.
 * Parameters Factory-Lady, but don't export anything
 */

"use strict";

var factory = require('mongoose-fakery'),
    ScaleColumn = require('../models/scaleColumn');

factory.fake('scaleColumn', ScaleColumn, {
    isBaseline: true
});