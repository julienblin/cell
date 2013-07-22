/**
 * The modification model.
 * Used to archive all real-time messages for history and disgnosis purposes.
 */

"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    _ = require('underscore');

var ModificationSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    data: { type: Schema.Types.Mixed }
}, { capped: 10000 });

ModificationSchema.statics.createFromResponses = function(responses, callback) {
    var data = _.omit(responses, 'projectId', 'user');
    // properties cannot contain "." - replacing with "_".
    if(data.modifications) {
        for(var modificationIndex in data.modifications) {
            var modification = data.modifications[modificationIndex];
            if(modification.values) {
                for(var property in modification.values) {
                    if(property.indexOf('.') !== -1) {
                        modification.values[property.replace('.', '_')] = modification.values[property];
                        delete modification.values[property];
                    }
                }
            }
        }
    }

    mongoose.model('Modification').create({
        project: responses.projectId,
        user: responses.user,
        data: data
    }, callback);
};

ModificationSchema.plugin(require('./plugins/createdAt'));
ModificationSchema.plugin(require('./plugins/paginate'));

module.exports = mongoose.model('Modification', ModificationSchema);