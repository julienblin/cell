/**
 * The server application
 */

var winston = require('winston'),
    http = require('http'),
    mongoose = require('mongoose'),
    seeds = require('./seeds'),
    socket = require('./socket');

module.exports = function(config, callback) {
    mongoose.connect(config.db.url, {
        server: {
            socketOptions: {
                keepAlive: config.db.keepAlive
            },
            poolSize: config.db.poolSize
        }
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

    httpServer.listen(config.web.port, function(err){
        if (err) {
            winston.error(err);
        } else {
            winston.info('%s (%s) started on port %d.', config.app.name, config.app.version, config.web.port);
        }

        callback(err, {
            close: function(cb) {
                httpServer.close(function() {
                    mongoose.connection.close(cb);
                });
            }
        });
    });
};