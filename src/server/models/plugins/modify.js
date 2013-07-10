/**
 * Plugin that knows how to apply modifications to a model.
 */

var mongoose = require('mongoose'),
    util = require('util'),
    _ = require('underscore'),
    async = require('async');

module.exports = function modifyPlugin (schema, options) {

    var _getValueAtPath = function(obj, path) {
        if(path.indexOf('.') === -1) {
            return obj.get(path);
        } else {
            var firstLevelProperty = path.substring(0, path.indexOf('.'));
            var secondLevelProperty = path.substring(path.indexOf('.') + 1);
            var firstLevelValue = obj.get(firstLevelProperty);
            if (!firstLevelValue) return null;
            return firstLevelValue[secondLevelProperty];
        }
    };

    var _setValueAtPath = function(obj, path, value) {
        if(path.indexOf('.') === -1) {
            obj.set(path, value);
        } else {
            var firstLevelProperty = path.substring(0, path.indexOf('.'));
            var secondLevelProperty = path.substring(path.indexOf('.') + 1);
            var firstLevelValue = obj.get(firstLevelProperty);
            if (!firstLevelValue) firstLevelValue = {};
            firstLevelValue[secondLevelProperty] = value;
            obj.set(firstLevelProperty, firstLevelValue);
            obj.markModified(firstLevelProperty);
        }
    };

    var _canModify = function(obj, path, valueComparison) {
        var currentValue = _getValueAtPath(obj, path);
        if((currentValue instanceof Array) && (currentValue.length === 0)) currentValue = null;
        if((valueComparison instanceof Array) && (valueComparison.length === 0)) valueComparison = null;
        return ((currentValue == valueComparison) || (!currentValue && !valueComparison));
    };

    var _create = function(Model, modificationLot, modification, callback) {
        var obj = new Model(_.omit(modification.values, 'id', 'parent'));
        if(!options.parentProperty) {
            obj.save(function(err) {
                if (err) return callback(null, { status: 'error', statusMessage: err.message });
                return callback(null, { status: 'success', statusMessage: util.format("Successfully created %s(%s).", Model.modelName, obj.id), id: obj.id });
            });
        } else {
            var parentId = modificationLot.projectId;
            if (options.parentIdProperty) {
                parentId = modification.parentId;
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
                    parentReferences.splice(0, 0, obj);
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
    };

    var _update = function(Model, modificationLot, modification, callback) {
        if(Model.modelName === 'Project')
            modification.id = modificationLot.projectId;

        Model.findById(modification.id, function(findByIdErr, obj) {
            if (findByIdErr) return callback(findByIdErr, null);
            if (!obj) return callback(null, { status: 'error', statusMessage: util.format("Unable to find %s(%s)", Model.modelName, modification.id) });

            var currentValue = _getValueAtPath(obj, modification.property);
            if(!_canModify(obj, modification.property, modification.oldValue)) {
                return callback(null, { status: 'concurrencyError', statusMessage: util.format("Unable to update %s(%s) because the oldValue (%s) doesn't match the current value (%s)", Model.modelName, obj.id, modification.oldValue, currentValue) });
            }

            _setValueAtPath(obj, modification.property, modification.newValue);
            obj.save(function(err) {
                if (err) return callback(null, { status: 'error', statusMessage: err.message });
                return callback(null, { status: 'success', statusMessage: util.format("Successfully updated %s(%s)", Model.modelName, obj.id) });
            });
        });
    };

    var _delete = function(Model, modificationLot, modification, callback) {
        if(Model.modelName === 'Project')
            modification.id = modificationLot.projectId;

        Model.findById(modification.id, function(findByIdErr, obj) {
            if (findByIdErr) return callback(findByIdErr, null);
            if (!obj) return callback(null, { status: 'error', statusMessage: util.format("Unable to find %s(%s)", Model.modelName, modification.id) });

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
        });
    };

    schema.statics.modify = function(modificationLot, modification, callback) {
        var Model = this;
        switch(modification.action) {
            case 'create':
                _create(Model, modificationLot, modification, callback);
                break;
            case 'update':
                _update(Model, modificationLot, modification, callback);
                break;
            case 'delete':
                _delete(Model, modificationLot, modification, callback);
                break;
            default:
                callback(new Error('Unrecognized action: ' + modification.action));
                break;
        }
    };
};