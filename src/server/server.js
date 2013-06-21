/**
 * The server application
 */

var winston = require('winston'),
    http = require('http'),
    mongoose = require('mongoose'),
    seeds = require('./seeds');

module.exports = function(config, callback) {
    mongoose.connect(config.db.url, {
        server: {
            socketOptions: {
                keepAlive: config.db.keepAlive
            }
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

    http.createServer(app).listen(config.web.port, function(err){
        if (err) {
            winston.error(err);
        } else {
            winston.info('%s (%s) started on port %d.', config.app.name, config.app.version, config.web.port);
        }

        callback(err);
    });
};