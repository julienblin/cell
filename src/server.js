
/**
 * Server
 */

var config = require('./config.js'),
    winston = require('winston'),
    http = require('http'),
    mongoose = require('mongoose'),
    seeds = require('./server/seeds.js');

mongoose.connect(config.db.url, {
    server: {
        socketOptions: {
            keepAlive: config.db.keepAlive
        }
    }
});

var passport = require('./server/passport.js');
var app = require('./server/express.js');
require('./server/routes.js')(app, passport);

if (config.env === 'development') {
    mongoose.set('debug', function(collectionName, method, query, doc) {
        winston.debug('mongoose', { collectionName: collectionName, method: method, query: query, doc: doc});
    });
}

seeds(function(err){
    if (err) winston.error(err);
});

http.createServer(app).listen(config.web.port, function(){
    winston.info('%s (%s) started on port %d.', config.app.name, config.app.version, config.web.port);
});
