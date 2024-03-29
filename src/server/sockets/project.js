/**
 * All the socket.io actions related to projects.
 */

"use strict";

var Project = require('../models/project'),
    User = require('../models/user'),
    Scale = require('../models/scale'),
    Modification = require('../models/modification'),
    _ = require('underscore'),
    async = require('async'),
    winston = require('winston');

module.exports = function(io) {
    io.of('/project').on('connection', function (socket) {

        socket.on('getDataAndSubscribe', function(projectId, callback) {
            Project.findById(projectId).populate('profilePrices profileProjects scales estimationLines usersRead usersWrite').exec(function(err, project) {
                if (err) { winston.error(err.stack); return callback(new Error("internal error."), null); }
                if (!project) return callback(new Error("unknown project id."), null);
                if (!project.isAuth('read', socket.handshake.user)) {
                    return callback(new Error("user is not authorized for this project."), null);
                }

                socket.set('projectId', project.id);
                socket.join('project/' + project.id);

                socket.broadcast.to('project/' + projectId).emit('userJoined', socket.handshake.user.toObject());

                Scale.populate(project.scales, [{ path: 'lines'}, { path: 'columns' }], function(err) {
                    if (err) { winston.error(err.stack); return callback(new Error("internal error."), null); }
                    callback(null, project.toObject());
                });
            });
        });

        socket.on('modify', function(modifications, callback) {
            socket.get('projectId', function(err, projectId) {
                if (err) { winston.error(err.stack); return callback(new Error("internal error."), null); }

                var modificationLot = {
                    projectId: projectId,
                    user: socket.handshake.user,
                    modifications: modifications
                };

                Project.applyModifications(modificationLot, function(err, responses) {
                    if (err) { winston.error(err.stack); return callback(new Error("internal error."), null); }
                    Modification.createFromResponses(responses, function(logErr) {
                        if (logErr) winston.error(logErr.stack);
                    });
                    callback(null, responses.results);
                    var successfulModifications = [];
                    for(var i = 0; i < responses.modifications.length; ++i) {
                        if (responses.results[i].status === 'success') {
                            successfulModifications.push(responses.modifications[i]);
                        }
                    }
                    socket.broadcast.to('project/' + projectId).emit('receiveUpdates', successfulModifications);
                });
            });
        });

        socket.on('setAuth', function(userId, auth, callback) {
            socket.get('projectId', function(err, projectId) {
                if (err) return callback(err, null);

                Project.findById(projectId, function(err, project) {
                    if (err) return callback(new Error("internal error"), null);
                    if (!project) return callback(new Error("unknown project id."), null);
                    if (!project.isAuth('write', socket.handshake.user)) {
                        return callback(new Error("user is not authorized for this project."), null);
                    }

                    User.findById(userId, function(err, user) {
                        if (err) return callback(new Error("internal error"), null);
                        if (!user) return callback(new Error('Unknown userid ' + userId), null);

                        try {
                            project.setAuth(auth, user);
                            project.save(function(err) {
                                if (err) return callback("internal error", null);
                                callback(null, user.toObject());
                                socket.broadcast.to('project/' + projectId).emit('setAuth', user.toObject(), auth);
                                return;
                            });
                        } catch (err) {
                            return callback(err, null);
                        }
                    });
                });
            });
        });
    });

    // When a project is removed, eject clients in the room.
    Project.schema.post('remove', function(project) {
        async.each(io.of('/project').clients('project/' + project.id), function(client, callback) {
            client.disconnect();
            callback();
        });
    });
};