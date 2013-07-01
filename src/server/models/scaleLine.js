var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    util = require('util');

var ScaleLineSchema = new Schema({
    scale: { type: Schema.Types.ObjectId, ref: 'Scale', index: true },
    isActive: { type: Boolean },
    title: { type: String, validate: [validations.uniqueFieldInsensitive('ScaleLine', 'title', 'scale')], index: true },
    values: [{ type: Number }]
});

ScaleLineSchema.plugin(require('./plugins/paginate'));
ScaleLineSchema.plugin(require('./plugins/modify'), { parentModel: 'Scale', parentIdProperty: 'scale', parentProperty: 'lines' });

// Serialization settings
ScaleLineSchema.set('toObject', { transform: function (doc, scale, options) {
    scale.id = scale._id;
    delete scale._id;
    delete scale.__v;
    delete scale.scale;
}});

module.exports = mongoose.model('ScaleLine', ScaleLineSchema);