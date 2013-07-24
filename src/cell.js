/**
 * Main entry point for Cell node application.
 */

"use strict";

var winston = require('winston'),
    MongoDB = require('winston-mongodb').MongoDB,
    server = require('./server/server');

var dbConfig = {
    host: process.env.MONGO_HOST || 'localhost',
    db: process.env.MONGO_DB || 'cell',
    url: function() {
        return 'mongodb://' + this.host + '/' + this.db;
    }
};

var config = {
    env: process.env.NODE_ENV || 'development',
    web: {
        port: process.env.PORT || 3000,
        sessionSecret: process.env.SESSION_SECRET || 'spoc6lu7than'
    },
    db:{
        url: dbConfig.url(),
        keepAlive: 1,
        poolSize: 10,
        seed: true
    }
};

winston.remove(winston.transports.Console);

if(config.env === 'development')
    winston.add(winston.transports.Console, { level: 'debug', colorize: true });
else
    winston.add(winston.transports.Console, { level: 'info', colorize: false });

winston.add(MongoDB, {
    level: 'info',
    host: dbConfig.host,
    db: dbConfig.db,
    collection: 'logs',
    safe: false
});

server(config, function () {});