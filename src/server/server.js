/**
 * The server application
 */

"use strict";

var winston = require('winston'),
    fs = require('fs'),
    http = require('http'),
    mongoose = require('mongoose'),
    seeds = require('./seeds'),
    socket = require('./socket'),
    pkg = require('../package.json');

module.exports = function(config, callback) {
    mongoose.connect(config.db.url, {
        server: {
            socketOptions: {
                keepAlive: config.db.keepAlive
            },
            poolSize: config.db.poolSize
        }
    });

    // Preload all the models.
    fs.readdirSync(__dirname + '/models').forEach(function (file) {
        if (file != 'plugins')
            require(__dirname + '/models/' + file);
    });

    var passport = require('./passport');
    var app = require('./express')(config);
    require('./routes')(app, passport);

    if (config.env === 'development') {
        mongoose.set('debug', function(collectionName, method, query, doc) {
            winston.debug('mongoose', { collectionName: collectionName, method: method, query: query, doc: doc});
        });
    }

    if (config.db.seed) {
        seeds(function(err){
            if (err) winston.error(err);
        });
    }

    var httpServer = http.createServer(app);
    socket(config, app, httpServer);

    httpServer.on('close', function() {
        winston.info("Closing server.");
        mongoose.connection.close();
    });

    httpServer.listen(config.web.port, function(err){
        if (err) {
            winston.error(err);
        } else {
            winston.info('%s (%s) started on port %d.', pkg.name, pkg.version, config.web.port);
        }

        callback(err, httpServer);
    });
};