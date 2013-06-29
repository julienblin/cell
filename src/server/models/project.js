var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    _ = require('underscore'),
    async = require('async');

var ProjectSchema = new Schema({
    clientName: { type: String, required: true, index: true },
    projectName: { type: String, required: true, validate: [validations.uniqueFieldInsensitive('Project', 'projectName', 'clientName')], index: true },
    description: { type: String },
    created: { type: Date, required: true, default: Date.now },

    users: {
        read: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        write: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    },

    profiles: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
    estimationLines: [{ type: Schema.Types.ObjectId, ref: 'EstimationLine' }]
});

ProjectSchema.methods.isAuth = function(auth, user) {
    var readIndex = this.users.read.indexOf(user.id);
    var writeIndex = this.users.write.indexOf(user.id);
    switch(auth) {
        case 'read':
            if(readIndex != -1) return true;
            if(writeIndex != -1) return true;
            return false;
            break;
        case 'write':
            if(writeIndex != -1) return true;
            return false;
            break;
        default:
            throw new Error('unrecognized auth value: ' + auth);
            break;
    }
}

ProjectSchema.methods.setAuth = function(auth, user) {
    var readIndex = this.users.read.indexOf(user.id);
    var writeIndex = this.users.write.indexOf(user.id);
    switch(auth) {
        case 'none':
            if(readIndex != -1) this.users.read.splice(readIndex, 1);
            if(writeIndex != -1) this.users.write.splice(writeIndex, 1);
            break;
        case 'read':
            if(readIndex == -1) this.users.read.push(user.id);
            if(writeIndex != -1) this.users.write.splice(writeIndex, 1);
            break;
        case 'write':
            if(readIndex != -1) this.users.read.splice(readIndex, 1);
            if(writeIndex == -1) this.users.write.push(user.id);
            break;
    }
};

ProjectSchema.statics.create = function(values, user, callback) {
    var Project = mongoose.model('Project');
    var newProject = new Project(values);
    newProject.setAuth('write', user);
    newProject.save(function(err) {
        return callback(err, newProject);
    });
};

/**
 * Apply modifications by invoking the modify static methods on corresponding models.
 * @param modificationLot
 * @param user
 * @param callback
 */
ProjectSchema.statics.applyModifications = function(modificationLot, callback) {
    mongoose.model('Project').findById(modificationLot.projectId, function(err, project) {
        if (err) return callback(err, null);
        if (!project) return callback(new Error("Unable to find project with id " + modificationLot.projectId));
        if (!project.isAuth('write', modificationLot.user)) {
            return callback(new Error("User " + modificationLot.user.username + " is not authorized for project with id " + modificationLot.projectId));
        };

        var responses = _.clone(modificationLot);
        responses.results = [];
        async.eachSeries(
            modificationLot.modifications,
            function(modification, eachCallback) {
                try {
                    var Model = mongoose.model(modification.model);
                    Model.modify(modificationLot, modification, function(modifyErr, response) {
                        if (modifyErr) {
                            responses.results.push({ status: 'error', statusMessage: modifyErr.message });
                        } else {
                            response.userId = modificationLot.user.id;
                            responses.results.push(response);
                        }
                        eachCallback();
                    });
                } catch (eachErr) {
                    responses.results.push({ status: 'error', statusMessage: eachErr.message });
                    eachCallback();
                }
            },
            function(err) {
                if (err) return callback(err, null);
                callback(null, responses);
            }
        );
    });
};

/**
 * Queries on projects
 */
ProjectSchema.statics.queries = {};

ProjectSchema.statics.queries.getAccessibleClientNames = function(filter, user, callback) {
    var Project = mongoose.model('Project');
    Project.where('clientName').equals(new RegExp(filter, 'i'))
           .or([
                { 'users.read': user.id },
                { 'users.write': user.id }
            ])
            .sort('clientName')
            .distinct('clientName', callback);
};

ProjectSchema.statics.queries.findPaginate = function(q, sort, user, paginationOptions, callback) {
    var Project = mongoose.model('Project');
    var finalQuery = {
        $and: [
            q,
            {
                $or: [
                    { 'users.read': user.id },
                    { 'users.write': user.id }
                ]
            }
        ]
    };
    Project.paginate(finalQuery, sort, paginationOptions, callback);
};

ProjectSchema.plugin(require('./plugins/paginate'));
ProjectSchema.plugin(require('./plugins/modify'));

module.exports = mongoose.model('Project', ProjectSchema);