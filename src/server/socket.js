var io = require('socket.io'),
    winston = require('winston'),
    express = require('express'),
    passportSocketIo = require("passport.socketio"),
    Project = require('./models/project');

module.exports = function (config, app, server) {
    io = io.listen(server, {
        logger: {
            error: winston.error,
            warn: winston.warn,
            info: winston.info,
            debug: winston.debug
        },

        authorization: passportSocketIo.authorize({
            cookieParser: express.cookieParser,
            key: 'connect.sid',
            secret: config.web.sessionSecret,
            store: app.get('sessionStore')
        })
    });

    io.of('/project').on('connection', function (socket) {
        socket.on('getDataAndSubscribe', function(projectId, callback) {
            Project.findById(projectId, function(err, project) {
                if (err) return callback("internal error.", null);
                if (!project) return callback("unknown project id.", null);
                if (!project.isAuth('read', socket.handshake.user)) {
                    return callback("user is not authorized for this project.", null);
                }

                socket.join('project/' + project.id);
                callback(null, {
                    clientName: project.clientName,
                    projectName: project.projectName,
                    created: project.created
                });
            });
        })
    });

    return io;
};
