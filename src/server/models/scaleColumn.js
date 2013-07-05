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
ScaleColumnSchema.plugin(require('./plugins/serialize'), { additionalProperties: [ 'scale' ] });

module.exports = mongoose.model('ScaleColumn', ScaleColumnSchema);