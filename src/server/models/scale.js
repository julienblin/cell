var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    util = require('util');

var ScaleSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    isActive: { type: Boolean },
    title: { type: String, validate: [validations.uniqueFieldInsensitive('Scale', 'title', 'project')], index: true }
});

ScaleSchema.plugin(require('./plugins/paginate'));
ScaleSchema.plugin(require('./plugins/modify'), { projectProperty: 'scales' });

// Serialization settings
ScaleSchema.set('toObject', { transform: function (doc, scale, options) {
    scale.id = scale._id;
    delete scale._id;
    delete scale.__v;
    delete scale.project;
}});

module.exports = mongoose.model('Scale', ScaleSchema);