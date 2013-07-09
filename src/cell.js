/**
 * Main entry point for Cell node application.
 */

/* jslint node: true */
"use strict";

var config = require('./config'),
    server = require('./server/server');

server(config, function () {});