var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    util = require('util');

var EstimationLineSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    lineType: { type: String },
    isActive: { type: Boolean },
    title: { type: String },
    scale: { type: Schema.Types.ObjectId, ref: 'Scale' },
    complexity: { type: Schema.Types.ObjectId, ref: 'ScaleLine' },
    coefficient: { type: Number }
});

EstimationLineSchema.plugin(require('./plugins/paginate'));
EstimationLineSchema.plugin(require('./plugins/modify'), { parentModel: 'Project', parentProperty: 'estimationLines' });
EstimationLineSchema.plugin(require('./plugins/serialize'), { additionalProperties: [ 'project' ] });

module.exports = mongoose.model('EstimationLine', EstimationLineSchema);