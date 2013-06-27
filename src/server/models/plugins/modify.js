/**
 * Plugin that knows how to apply modifications to a model.
 */

var util = require('util');

module.exports = function modifyPlugin (schema, options) {
    schema.statics.modify = function(modificationLot, modification, callback) {
        var Model = this;
        if(modification.action === 'create') {
            var obj = new Model(modification);
            if (obj.modelName != 'Project') {
                obj.project = modificationLot.projectId;
            }
            obj.save(function(err) {
                if (err) return callback(null, { status: 'error', statusMessage: err.message });
                return callback(null, { status: 'success', statusMessage: util.format("Successfully created %s(%s).", obj.modelName, obj.id) });
            });
        } else {
            Model.findById(modification.id, function(findByIdErr, obj) {
                if (findByIdErr) return callback(findByIdErr, null);
                if (!obj) return callback(null, { status: 'error', statusMessage: util.format("Unable to find %s(%s)", model.name, modification.id) });

                if (modification.action === 'delete') {
                    obj.remove(function(err) {
                        if (err) return callback(null, { status: 'error', statusMessage: err.message });
                        return callback(null, { status: 'success', statusMessage: util.format("Successfully deleted %s(%s)", obj.modelName, obj.id) });
                    });
                } else {
                    if (modification.action === 'update') {
                        if(obj.get(modification.property) === modification.oldValue) {
                            obj.set(modification.property, modification.newValue);
                            obj.save(function(err) {
                                if (err) return callback(null, { status: 'error', statusMessage: err.message });
                                return callback(null, { status: 'success', statusMessage: util.format("Successfully updated %s(%s)", Model.name, obj.id) });
                            });
                        } else {
                            return callback(null, { status: 'concurrencyError', statusMessage: util.format("Unable to update %s(%s) because the oldValue (%s) doesn't match the current value (%s)", obj.modelName, obj.id, modification.oldValue, obj.get(modification.property)) });
                        }
                    } else {
                        return callback(new Error('Internal error - should not be reached.'));
                    }
                }
            });
        }
    };
};