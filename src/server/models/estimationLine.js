/**
 * The EstimationLine model.
 * A project is composed of many estimation lines, each one refers to a specific scale and complexity,
 * or a fixed price.
 */

"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    util = require('util');

var EstimationLineSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    lineType: { type: String, enum: [ null, undefined, 'heading1', 'heading2', 'fixedPrice' ] },
    isActive: { type: Boolean },
    title: { type: String },
    scale: { type: Schema.Types.ObjectId, ref: 'Scale' },
    complexity: { type: Schema.Types.ObjectId, ref: 'ScaleLine' },
    coefficient: { type: Number },
    fixedPriceScale: { type: String },
    fixedPrice:  { type: Number }
});

EstimationLineSchema.plugin(require('./plugins/paginate'));
EstimationLineSchema.plugin(require('./plugins/modify'), { parentModel: 'Project', parentProperty: 'estimationLines' });
EstimationLineSchema.plugin(require('./plugins/serialize'), { remove: [ 'project' ] });

module.exports = mongoose.model('EstimationLine', EstimationLineSchema);