var io = require('socket.io'),
    winston = require('winston'),
    express = require('express'),
    passportSocketIo = require("passport.socketio");

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

    require('./sockets/project')(io);

    return io;
};
