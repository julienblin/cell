/**
 * Express.js config
 */

var winston = require('winston'),
    express = require('express'),
    path = require('path'),
    bundle = require('bundle-up'),
    MongoStore = require('connect-mongo')(express),
    passport = require('passport');

module.exports = function (config) {
    "use strict";
    
    var app = express(),
        sessionStore = new MongoStore({
            url: config.db.url,
            collection : 'sessions'
        });
    
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    app.use(express.favicon(__dirname + '/../public/images/favicon.ico'));
    app.use(express.compress());
    if (config.env === 'development') {
        var regex = /(?:\/generated\/|\/images\/)/;
        app.use(express.logger({
            format: 'dev',
            stream: {
                write: function(message){
                    if(!regex.test(message))
                        winston.debug(message);
                }
            }
        }));
    }

    bundle(app, __dirname + '/../client/assets', {
        staticRoot: __dirname + '/../public/',
        staticUrlRoot: '/',
        bundle: (config.env !== 'development'),
        minifyCss: true,
        minifyJs: true
    });

    app.use(require('./middlewares/staticExpiration'));
    app.use(express.static(path.join(__dirname, '../public')));

    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.set('sessionStore', sessionStore);

    app.use(express.session({
        secret: config.web.sessionSecret,
        store: sessionStore
    }));
    app.use(require('connect-flash')());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(require('./middlewares/locals')(config));
    app.use(require('./middlewares/helpers'));
    app.use(app.router);

    if (config.env === 'development') {
        app.use(express.errorHandler());
    }

    return app;
};