/**
 * The project model.
 * A project is a complete estimate.
 *                                                 1  +-----------+ 1
 *        +-----------------------+----------------->|  Project  |<----+-------------------------------------+
 *        |                       |                  +-----------+     |                                     |
 *        |                       |                                    | 1                                   |
 *        |                       |                                    |                                     |
 *        |                       |                                    | *                                   |
 *        |                       |                                +---+---+                                 |
 *        |                       |                                | Scale |                                 |
 *        |                       |                                +-------+                                 |
 *        |                       |                                    ^                                     |
 *        |                       |                                  1 | 1                                   |
 *        |                       |                       +------------+----------+                          |
 *        |*                      |*                     *|                       |*                         |*
 * +------+-------+ 1    *+-------+--------+ 1  * +-------+-------+ *     * +-----+-----+ 1       * +--------+-------+
 * | ProfilePrice |<------+ ProfileProject |<-----+  ScaleColumn  |<--------+ ScaleLine |<----------+ EstimationLine |
 * +--------------+       +----------------+      +---------------+         +-----------+           +----------------+
 *
 */

"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    _ = require('underscore'),
    async = require('async');

var ProjectSchema = new Schema({
    clientName: { type: String, required: true, index: true },
    projectName: { type: String, required: true, validate: [validations.uniqueFieldInsensitive('Project', 'projectName', 'clientName')], index: true },
    notes: { type: String },
    isLocked: { type: Boolean, default: false },
    contingency: { type: Number },

    usersRead: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    usersWrite: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    profilePrices: [{ type: Schema.Types.ObjectId, ref: 'ProfilePrice' }],
    profileProjects: [{ type: Schema.Types.ObjectId, ref: 'ProfileProject' }],
    scales: [{ type: Schema.Types.ObjectId, ref: 'Scale' }],
    estimationLines: [{ type: Schema.Types.ObjectId, ref: 'EstimationLine' }]
});

ProjectSchema.pre('remove', function(next) {
    var project = this;
    mongoose.model('ProfilePrice').remove({ project: project.id }).exec();
    mongoose.model('ProfileProject').remove({ project: project.id }).exec();
    mongoose.model('Scale').remove({ project: project.id }).exec();
    mongoose.model('EstimationLine').remove({ project: project.id }).exec();
    mongoose.model('Snapshot').remove({ model: 'Project', ref: project.id.toString() }).exec();
    next();
});

ProjectSchema.methods.isAuth = function(auth, user) {
    // users could be eagerly populated
    var isAuthorizedForRead =
        this.usersRead.indexOf(user.id) === -1 ?
            (_.findWhere(this.usersRead, { id: user.id }) ? true : false)
            : true;
    var isAuthorizedForWrite =
        this.usersWrite.indexOf(user.id) === -1 ?
            (_.findWhere(this.usersWrite, { id: user.id }) ? true : false)
            : true;

    switch(auth) {
        case 'read':
            return (isAuthorizedForRead || isAuthorizedForWrite);
        case 'write':
            return isAuthorizedForWrite;
        default:
            throw new Error('unrecognized auth value: ' + auth);
    }
};

ProjectSchema.methods.setAuth = function(auth, user) {
    var readIndex = this.usersRead.indexOf(user.id);
    var writeIndex = this.usersWrite.indexOf(user.id);
    switch(auth) {
        case 'none':
            if(readIndex != -1) this.usersRead.splice(readIndex, 1);
            if(writeIndex != -1) this.usersWrite.splice(writeIndex, 1);
            break;
        case 'read':
            if(readIndex == -1) this.usersRead.push(user.id);
            if(writeIndex != -1) this.usersWrite.splice(writeIndex, 1);
            break;
        case 'write':
            if(readIndex != -1) this.usersRead.splice(readIndex, 1);
            if(writeIndex == -1) this.usersWrite.push(user.id);
            break;
    }
};

ProjectSchema.statics.create = function(values, user, callback) {
    var Project = mongoose.model('Project');
    var newProject = new Project(values);
    newProject.setAuth('write', user);
    newProject.save(function(err) {
        if(err) return callback(err, null);
        return callback(null, newProject);
    });
};

ProjectSchema.statics.CopyParam = {
    ProfilePrices: 1,
    ProfileProjects: 2
};

ProjectSchema.statics.copy = function(values, user, origProject, copyParams, callback) {
    var Project = mongoose.model('Project');
    var newProject = new Project(values);
    newProject.setAuth('write', user);

    origProject.populate('profilePrices')
               .populate('profileProjects')
               .populate(function(err, origProject) {
        if(err) return callback(err, null);

        if(copyParams) {
            var idMap = {};
            if(copyParams >= Project.CopyParam.ProfilePrices) {
                async.eachSeries(
                origProject.profilePrices,
                function(origProfilePrice, cb) {
                    origProfilePrice.duplicateIn(newProject, idMap, cb);
                },
                function(err) {
                    if(err) return callback(err, null);

                    if(copyParams >= Project.CopyParam.ProfileProjects) {
                        async.eachSeries(
                        origProject.profileProjects,
                        function(origProfileProject, cb) {
                            origProfileProject.duplicateIn(newProject, idMap, cb);
                        },
                        function(err) {
                            if(err) return callback(err, null);
                            newProject.save(function(err) {
                                if(err) return callback(err, null);
                                return callback(null, newProject);
                            });
                        });
                    } else {
                        newProject.save(function(err) {
                            if(err) return callback(err, null);
                            return callback(null, newProject);
                        });
                    }
                });
            }
        } else {
            newProject.save(function(err) {
                if(err) return callback(err, null);
                return callback(null, newProject);
            });
        }
    });
};

/**
 * Only models listed here will be integrated by applyModifications.
 */
var MODIFICATIONS_MODELS_WHITE_LIST = [ 'Project', 'ProfilePrice', 'ProfileProject', 'Scale', 'ScaleColumn', 'ScaleLine', 'EstimationLine' ];

/**
 * Apply modifications by invoking the modify static methods on corresponding models.
 * @param modificationLot
 * @param user
 * @param callback
 */
ProjectSchema.statics.applyModifications = function(modificationLot, callback) {
    mongoose.model('Project').findById(modificationLot.projectId, 'isLocked usersRead usersWrite', function(err, project) {
        if (err)
            return callback(err, null);
        if (!project)
            return callback(new Error("Unable to find project with id " + modificationLot.projectId));
        if (!project.isAuth('write', modificationLot.user))
            return callback(new Error("User " + modificationLot.user.username + " is not authorized for project with id " + modificationLot.projectId));

        var responses = _.clone(modificationLot);
        responses.results = [];

        if(project.isLocked) {
            if(modificationLot.modifications
                && (modificationLot.modifications.length === 1)
                && (modificationLot.modifications[0].action === 'update')
                && (modificationLot.modifications[0].values)
                && (modificationLot.modifications[0].values.isLocked)
                && (modificationLot.modifications[0].values.isLocked.length === 2)) {

            } else {
                responses.results.push({ status: 'error', statusMessage: 'Project is locked.' });
                return callback(null, responses);
            }
        }

        async.eachSeries(
            modificationLot.modifications,
            function(modification, eachCallback) {
                if(MODIFICATIONS_MODELS_WHITE_LIST.indexOf(modification.model) == -1) {
                    responses.results.push({ status: 'error', statusMessage: 'Model is not in white list.' });
                    return eachCallback();
                }
                try {
                    var Model = mongoose.model(modification.model);
                    Model.modify(modificationLot, modification, function(modifyErr, response) {
                        if (modifyErr) {
                            responses.results.push({ status: 'error', statusMessage: modifyErr.message });
                        } else {
                            response.userId = modificationLot.user.id;
                            responses.results.push(response);
                        }
                        return eachCallback();
                    });
                } catch (eachErr) {
                    responses.results.push({ status: 'error', statusMessage: eachErr.message });
                    return eachCallback();
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
                { 'usersRead': user.id },
                { 'usersWrite': user.id }
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
                    { 'usersRead': user.id },
                    { 'usersWrite': user.id }
                ]
            }
        ]
    };
    Project.paginate(finalQuery, sort, paginationOptions, callback);
};

ProjectSchema.plugin(require('./plugins/createdAt'));
ProjectSchema.plugin(require('./plugins/paginate'));
ProjectSchema.plugin(require('./plugins/modify'));
ProjectSchema.plugin(require('./plugins/serialize'), { remove: [ 'usersRead', 'usersWrite'], callback: function(doc, ret, options) {
    // For an unknown reason mongoose doesn't seem to call toObject() on users by itself, so we bypass it!
    ret.usersRead = _.map(doc.usersRead, function(user) { return user.toObject ? user.toObject() : user; });
    ret.usersWrite = _.map(doc.usersWrite, function(user) { return user.toObject ? user.toObject() : user; });
}});

module.exports = mongoose.model('Project', ProjectSchema);