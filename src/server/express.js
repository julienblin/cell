/**
 * Express.js config
 */

var config = require('../config.js')
    express = require('express'),
    path = require('path'),
    bundle = require('bundle-up');

var app = express();

// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.favicon());
app.use(express.compress());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

bundle(app, __dirname + '/../client/assets', {
    staticRoot: __dirname + '/../public/',
    staticUrlRoot: '/',
    bundle: (config.env != 'development'),
    minifyCss: true,
    minifyJs: true
});

app.use(express.static(path.join(__dirname, '../public')));

if(config.env === 'development') {
    app.use(express.errorHandler());
}

app.locals({ config : config });

module.exports = app;