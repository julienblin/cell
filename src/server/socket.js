/**
 * Socket.io configuration, especially the integration with passport for authentication.
 * Specific socket actions are in the sockets folder.
 */

"use strict";

var io = require('socket.io'),
    winston = require('winston'),
    express = require('express'),
    passportSocketIo = require("passport.socketio");

module.exports = function (config, app, server) {

    var filterInfo = /handshake|transport\send/;

    io = io.listen(server, {
        logger: {
            error: winston.error,
            warn: winston.warn,
            info: function(message) {
                if(filterInfo.test(message)) {
                    winston.debug(message);
                } else {
                    winston.info(message);
                }
            },
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
