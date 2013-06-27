var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    util = require('util');

var EstimationLineSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    isActive: { type: Boolean },
    title: { type: String },
    scale: { type: String },
    complexity: { type: String },
    coefficient: { type: Number }
});

EstimationLineSchema.plugin(require('./plugins/paginate'));
EstimationLineSchema.plugin(require('./plugins/modify'));

module.exports = mongoose.model('EstimationLine', EstimationLineSchema);