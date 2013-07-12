/**
 * Factory for estimation lines.
 * Parameters Factory-Lady, but don't export anything
 */

"use strict";

var factory = require('mongoose-fakery'),
    EstimationLine = require('../models/estimationLine');

factory.fake('estimationLine', EstimationLine, {
    isActive: true,
    title: factory.g.name()
});