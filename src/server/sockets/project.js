/**
 * All the socket.io actions related to projects.
 */

var Project = require('../models/project'),
    _ = require('underscore');

module.exports = function(io) {
    io.of('/project').on('connection', function (socket) {

        socket.on('getDataAndSubscribe', function(projectId, callback) {
            Project.findById(projectId).populate('profiles scales').exec(function(err, project) {
                if (err) return callback("internal error.", null);
                if (!project) return callback("unknown project id.", null);
                if (!project.isAuth('read', socket.handshake.user)) {
                    return callback("user is not authorized for this project.", null);
                }

                socket.set('projectId', project.id);
                socket.join('project/' + project.id);
                callback(null, project.toObject());
            });
        });

        socket.on('modify', function(modifications, callback) {
            socket.get('projectId', function(err, projectId) {
                if (err) return callback(err, null);

                var modificationLot = {
                    projectId: projectId,
                    user: socket.handshake.user,
                    modifications: modifications
                };

                Project.applyModifications(modificationLot, function(err, responses) {
                    if (err) return callback(err, null);
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
    });
};