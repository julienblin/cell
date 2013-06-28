/**
 * Plugin that knows how to apply modifications to a model.
 */

var mongoose = require('mongoose'),
    util = require('util'),
    _ = require('underscore'),
    async = require('async');

module.exports = function modifyPlugin (schema, options) {
    schema.statics.modify = function(modificationLot, modification, callback) {
        var Model = this;
        if(modification.action === 'create') {
            var obj = new Model(_.omit(modification.values, 'id', 'project'));
            if (Model.modelName != 'Project') {
                obj.project = modificationLot.projectId;
            }

            if(!options.projectProperty) {
                obj.save(function(err) {
                    if (err) return callback(null, { status: 'error', statusMessage: err.message });
                    return callback(null, { status: 'success', statusMessage: util.format("Successfully created %s(%s).", Model.modelName, obj.id), id: obj.id });
                });
            } else {
                mongoose.model('Project').findById(modificationLot.projectId, function(err, project) {
                    if (err) return callback(null, { status: 'error', statusMessage: err.message });
                    if (!project) return callback(null, { status: 'error', statusMessage: 'Unable to find project with id ' + modificationLot.projectId });

                    var projectReferences = project.get(options.projectProperty);
                    if(modification.insertAfter) {
                        var indexOfPrevious = projectReferences.indexOf(modification.insertAfter);
                        if (indexOfPrevious == -1) return callback(null, { status: 'error', statusMessage: 'Unable to create because the insertAfterId was not found on the project.' });
                        projectReferences.splice(indexOfPrevious + 1, 0, obj);
                    } else {
                        projectReferences.push(obj);
                    }
                    project.set(options.projectProperty, projectReferences);

                    project.save(function(err) {
                        if (err) return callback(null, { status: 'error', statusMessage: err.message });
                        obj.save(function(err) {
                            if (err) return callback(null, { status: 'error', statusMessage: err.message });
                            modification.id = obj.id;
                            return callback(null, { status: 'success', statusMessage: util.format("Successfully created %s(%s).", Model.modelName, obj.id), id: obj.id });
                        })
                    });
                });
            }
        } else {
            Model.findById(modification.id, function(findByIdErr, obj) {
                if (findByIdErr) return callback(findByIdErr, null);
                if (!obj) return callback(null, { status: 'error', statusMessage: util.format("Unable to find %s(%s)", Model.modelName, modification.id) });

                if (modification.action === 'delete') {
                    obj.remove(function(err) {
                        if (err) return callback(null, { status: 'error', statusMessage: err.message });
                        return callback(null, { status: 'success', statusMessage: util.format("Successfully deleted %s(%s)", Model.modelName, obj.id) });
                    });
                } else {
                    if (modification.action === 'update') {
                        var oldValue = obj.get(modification.property);
                        if((oldValue === modification.oldValue)
                        || (!oldValue && !modification.oldValue)) {
                            obj.set(modification.property, modification.newValue);
                            obj.save(function(err) {
                                if (err) return callback(null, { status: 'error', statusMessage: err.message });
                                return callback(null, { status: 'success', statusMessage: util.format("Successfully updated %s(%s)", Model.modelName, obj.id) });
                            });
                        } else {
                            return callback(null, { status: 'concurrencyError', statusMessage: util.format("Unable to update %s(%s) because the oldValue (%s) doesn't match the current value (%s)", Model.modelName, obj.id, modification.oldValue, obj.get(modification.property)) });
                        }
                    } else {
                        return callback(new Error('Internal error - should not be reached.'));
                    }
                }
            });
        }
    };
};