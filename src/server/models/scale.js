var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    util = require('util');

var ScaleSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    isActive: { type: Boolean },
    name: { type: String, validate: [validations.uniqueFieldInsensitive('Scale', 'name', 'project')], index: true },
    columns: [{ type: Schema.Types.Array }],
    lines: [{ type: Schema.Types.ObjectId, ref: 'ScaleLine' }]
});

ScaleSchema.plugin(require('./plugins/paginate'));
ScaleSchema.plugin(require('./plugins/modify'), { parentModel: 'Project', parentProperty: 'scales' });

// Serialization settings
ScaleSchema.set('toObject', { transform: function (doc, scale, options) {
    scale.id = scale._id;
    delete scale._id;
    delete scale.__v;
    delete scale.project;
}});

module.exports = mongoose.model('Scale', ScaleSchema);