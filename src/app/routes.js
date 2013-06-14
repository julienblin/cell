/**
 * Global routes configuration
 */

module.exports = function (app) {
    var index = require('./controllers/index.js');
    app.get('/', index.index);

    var login = require('./controllers/login.js');
    app.get('/login', login.login);
};