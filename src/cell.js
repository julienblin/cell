/**
 * Main entry point for Cell node application.
 */

var config = require('./config'),
    server = require('./server/server');

server(config, function() {});