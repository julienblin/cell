/**
 * Global routes configuration
 */

var auth = require('./authorizations.js')
    index = require('./controllers/index.js'),
    login = require('./controllers/login.js'),
    users = require('./controllers/admin/users.js');

module.exports = function (app, passport) {
    app.get(auth.LOGIN_ROUTE, login.login);
    app.post(auth.LOGIN_ROUTE, passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: auth.LOGIN_ROUTE
    }));
    app.get('/logout', login.logout);


    // Admin
    app.get('/admin/users', auth.admin, users.index);
    app.get('/admin/users/new', auth.admin, users.new);
    app.post('/admin/users', auth.admin, users.create);
    app.get('/admin/users/:id/edit', auth.admin, users.loadUser, users.edit);
    app.put('/admin/users/:id', auth.admin, users.loadUser, users.update);

    app.get('/', auth.requiresLogin, index.index);
};