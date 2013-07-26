/**
 * Main entry point for Cell node application.
 */

"use strict";

var config = require('./config'),
    winston = require('winston'),
    server = require('./server/server');

server(config, function (err, httpServer) {
    process.on('SIGTERM', function() {
        httpServer.close(function() {
            winston.info("Server closed.");
            process.exit();
        });

        setTimeout( function () {
            winston.warn("Could not close connections in time, forcing shut down.");
            process.exit();
        }, 30*1000);
    });
});