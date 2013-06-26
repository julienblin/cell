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

EstimationLineSchema.statics.modify = function(modificationLot, user, modification, callback) {
    if(modification.action === 'create') {
        var estimationLine = new mongoose.model('EstimationLine')(modification);
        estimationLine.project = modificationLot.projectId;
        estimationLine.save(function(err) {
            if (err) return callback(null, { status: 'error', statusMessage: err.message });
            return callback(null, { status: 'success', statusMessage: 'Successfully created EstimationLine with id ' + estimationLine.id });
        });
    } else {
        mongoose.model('EstimationLine').findById(modification.id, function(err, estimationLine) {
            if (err) return callback(err, null);
            if (!estimationLine) return callback(null, { status: 'error', statusMessage: 'Unable to find EstimationLine with id ' + modification.id });

            if (modification.action === 'delete') {
                estimationLine.remove(function(err) {
                    if (err) return callback(null, { status: 'error', statusMessage: err.message });
                    return callback(null, { status: 'success', statusMessage: 'Successfully deleted EstimationLine with id ' + modification.id });
                });
            }
            if(estimationLine[modification.property] === modification.oldValue) {
                estimationLine[modification.property] = modification.newValue;
                estimationLine.save(function(err) {
                    if (err) return callback(null, { status: 'error', statusMessage: err.message });
                    return callback(null, { status: 'success', statusMessage: 'Successfully updated EstimationLine with id ' + modification.id });
                });
            }
            return callback(null, { status: 'concurrencyError', statusMessage: util.format("Unable to update EstimationLine with id %s because the oldValue (%s) doesn't match the current value (%s)", modification.id, modification.oldValue, estimationLine[modification.property]) });
        });
    }
};

EstimationLineSchema.plugin(require('./plugins/paginate'));
EstimationLineSchema.plugin(require('./plugins/modify'));

module.exports = mongoose.model('EstimationLine', EstimationLineSchema);