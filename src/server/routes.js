/**
 * Global routes configuration
 */

var auth = require('./authorizations.js')
    index = require('./controllers/index.js'),
    login = require('./controllers/login.js');

module.exports = function (app, passport) {
    app.get(auth.LOGIN_ROUTE, login.login);
    app.post(auth.LOGIN_ROUTE, passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: auth.LOGIN_ROUTE
    }));
    app.get('/logout', login.logout);

    app.get('/', auth.requiresLogin, index.index);
};