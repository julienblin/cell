/**
 * Duplicate in project mongoose plugin.
 * Allow the duplication of objetc inside Project.copy(...)
 */

"use strict";

var mongoose = require('mongoose'),
    _ = require('underscore');

module.exports = function duplicateInProjectPlugin (schema, pluginOptions) {
    if (!pluginOptions.mapPropertyIds) pluginOptions.mapPropertyIds = [];
    schema.methods.duplicateIn = function(newProject, idMap, callback) {
        var Model = mongoose.model(pluginOptions.model);
        var originId = this.id;
        var originDocument = this.toObject();
        delete(originDocument.id);
        delete(originDocument._id);
        delete(originDocument.__v);

        var newDocument = new Model(originDocument);
        newDocument.project = newProject;
        newProject[pluginOptions.projectCollection].push(newDocument);

        _.each(pluginOptions.mapPropertyIds, function(mapPropertyId) {
            var originTargetDoc = originDocument[mapPropertyId];
            if(originTargetDoc)
                newDocument[mapPropertyId] = idMap[originTargetDoc];
        });

        idMap[originId] = newDocument.id;
        newDocument.save(callback);
    };
};