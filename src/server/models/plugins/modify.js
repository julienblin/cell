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
            var obj = new Model(_.omit(modification.values, 'id', 'parent'));

            if(!options.parentProperty) {
                obj.save(function(err) {
                    if (err) return callback(null, { status: 'error', statusMessage: err.message });
                    return callback(null, { status: 'success', statusMessage: util.format("Successfully created %s(%s).", Model.modelName, obj.id), id: obj.id });
                });
            } else {
                var parentId = modificationLot.projectId;
                if (options.parentIdProperty) {
                    parentId = modification[options.parentIdProperty];
                }
                mongoose.model(options.parentModel).findById(parentId, function(err, parent) {
                    if (err) return callback(null, { status: 'error', statusMessage: err.message });
                    if (!parent) return callback(null, { status: 'error', statusMessage: 'Unable to find parent with id ' + modificationLot.parentId });

                    var parentReferences = parent.get(options.parentProperty);
                    if(modification.insertAfter) {
                        var indexOfPrevious = parentReferences.indexOf(modification.insertAfter);
                        if (indexOfPrevious == -1) return callback(null, { status: 'error', statusMessage: 'Unable to create because the insertAfterId was not found on the parent.' });
                        parentReferences.splice(indexOfPrevious + 1, 0, obj);
                    } else {
                        parentReferences.push(obj);
                    }
                    parent.set(options.parentProperty, parentReferences);
                    if (Model.modelName != 'Project') {
                        obj.set(options.parentIdProperty || 'project', parent.id);
                    }

                    parent.save(function(err) {
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
                    if(!options.parentProperty) {
                        obj.remove(function(err) {
                            if (err) return callback(null, { status: 'error', statusMessage: err.message });
                            return callback(null, { status: 'success', statusMessage: util.format("Successfully deleted %s(%s)", Model.modelName, obj.id) });
                        });
                    } else {
                        var parentId = modificationLot.projectId;
                        if (options.parentIdProperty) {
                            parentId = obj.get(options.parentIdProperty);
                        }
                        mongoose.model(options.parentModel).findById(parentId, function(err, parent) {
                            if (err) return callback(null, { status: 'error', statusMessage: err.message });
                            if (!parent) return callback(null, { status: 'error', statusMessage: 'Unable to find parent with id ' + modificationLot.parentId });
                            var parentReferences = parent.get(options.parentProperty);
                            parentReferences = _.filter(parentReferences, function(objId) { return objId != modification.id });
                            parent.set(options.parentProperty, parentReferences);
                            parent.save(function(err) {
                                if (err) return callback(null, { status: 'error', statusMessage: err.message });
                                obj.remove(function(err) {
                                    if (err) return callback(null, { status: 'error', statusMessage: err.message });
                                    return callback(null, { status: 'success', statusMessage: util.format("Successfully deleted %s(%s)", Model.modelName, obj.id) });
                                });
                            });
                        });
                    }
                } else {
                    if (modification.action === 'update') {
                        var oldValue = obj.get(modification.property);
                        if((oldValue instanceof Array) && (oldValue.length === 0)) oldValue = null;
                        var oldValueModif = modification.oldValue;
                        if((oldValueModif instanceof Array) && (oldValueModif.length === 0)) oldValueModif = null;

                        if((_.isEqual(oldValue, oldValueModif))
                        || (!oldValue && !oldValueModif)) {
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