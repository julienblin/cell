
/**
 * Server
 */

var config = require('./config.js'),
    util = require('util'),
    http = require('http');

var app = require('./server/express.js');
require('./server/routes.js')(app);

http.createServer(app).listen(config.web.port, function(){
  console.log(util.format('%s (%s) started on port %d.', config.app.name, config.app.version, config.web.port));
});
