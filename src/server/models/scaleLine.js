/**
 * The ScaleLine model.
 * A scale line allows the input of specific numbers corresponding to scale columns and complexities.
 * Each scale line can they be pointed to by an estimation line.
 */

"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    util = require('util');

var ScaleLineSchema = new Schema({
    scale: { type: Schema.Types.ObjectId, ref: 'Scale', index: true },
    isActive: { type: Boolean },
    complexity: { type: String, validate: [validations.uniqueFieldInsensitive('ScaleLine', 'complexity', 'scale')], index: true },
    values: { type: Schema.Types.Mixed }
});

ScaleLineSchema.plugin(require('./plugins/paginate'));
ScaleLineSchema.plugin(require('./plugins/modify'), { parentModel: 'Scale', parentProperty: 'lines', parentIdProperty: 'scale' });
ScaleLineSchema.plugin(require('./plugins/serialize'), { remove: [ 'scale' ] });

module.exports = mongoose.model('ScaleLine', ScaleLineSchema);