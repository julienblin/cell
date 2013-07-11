/**
 * The ScaleColumn model.
 * A scale column points to a specific profile, and allow scale lines to attach numbers to them (in ScaleLine).
 * A column is either a baseline or over-baseline.
 * Baselines are defined in units of time (ut), over-baseline in percentages of the total of the baseline in the same
 * scale line.
 */

"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    util = require('util');

var ScaleColumnSchema = new Schema({
    scale: { type: Schema.Types.ObjectId, ref: 'Scale', index: true },
    isBaseline: { type: Boolean },
    profile: { type: Schema.Types.ObjectId, ref: 'Profile' }
});

ScaleColumnSchema.plugin(require('./plugins/paginate'));
ScaleColumnSchema.plugin(require('./plugins/modify'), { parentModel: 'Scale', parentProperty: 'columns', parentIdProperty: 'scale' });
ScaleColumnSchema.plugin(require('./plugins/serialize'), { remove: [ 'scale' ] });

module.exports = mongoose.model('ScaleColumn', ScaleColumnSchema);