var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    util = require('util');

var ScaleSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    isActive: { type: Boolean },
    name: { type: String, validate: [validations.uniqueFieldInsensitive('Scale', 'name', 'project')], index: true },
    columns: [{ type: Schema.Types.ObjectId, ref: 'ScaleColumn' }],
    lines: [{ type: Schema.Types.ObjectId, ref: 'ScaleLine' }]
});

ScaleSchema.plugin(require('./plugins/paginate'));
ScaleSchema.plugin(require('./plugins/modify'), { parentModel: 'Project', parentProperty: 'scales' });
ScaleSchema.plugin(require('./plugins/serialize'), { additionalProperties: [ 'project' ] });

module.exports = mongoose.model('Scale', ScaleSchema);