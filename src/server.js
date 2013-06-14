
/**
 * Server
 */

var config = require('./config.js'),
    util = require('util'),
    http = require('http'),
    mongoose = require('mongoose'),
    seeds = require('./server/seeds.js');

mongoose.connect(config.db.url);

var passport = require('./server/passport.js');
var app = require('./server/express.js');
require('./server/routes.js')(app, passport);

seeds(function(err){
    if (err) console.error(err);
});

http.createServer(app).listen(config.web.port, function(){
   console.log(util.format('%s (%s) started on port %d.', config.app.name, config.app.version, config.web.port));
});
