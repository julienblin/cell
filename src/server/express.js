/**
 * Express.js config
 */

var config = require('../config.js'),
    winston = require('winston'),
    express = require('express'),
    path = require('path'),
    bundle = require('bundle-up'),
    mongoStore = require('connect-mongo')(express),
    passport = require('passport');

var app = express();

// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.favicon());
app.use(express.compress());
app.use(express.logger('dev'));

bundle(app, __dirname + '/../client/assets', {
    staticRoot: __dirname + '/../public/',
    staticUrlRoot: '/',
    bundle: (config.env != 'development'),
    minifyCss: true,
    minifyJs: true
});

app.use(express.static(path.join(__dirname, '../public')));

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
    secret: config.web.sessionSecret,
    store: new mongoStore({
        url: config.db.url,
        collection : 'sessions'
    })
}));
app.use(require('connect-flash')());
app.use(passport.initialize());
app.use(passport.session());
app.use(require('./middlewares/locals'));
app.use(app.router);

if(config.env === 'development') {
    app.use(express.errorHandler());
}

module.exports = app;