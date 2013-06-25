/**
 * Global routes configuration
 */

var auth = require('./middlewares/authorizations')
    index = require('./controllers/index'),
    login = require('./controllers/login'),
    modals = require('./controllers/modals'),
    projects = require('./controllers/projects'),
    users = require('./controllers/system/users');

module.exports = function (app, passport) {
    app.get(auth.LOGIN_ROUTE, login.login);
    app.post(auth.LOGIN_ROUTE, passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: auth.LOGIN_ROUTE
    }));
    app.get('/logout', login.logout);

    // Modals
    app.get('/modals/new', modals.new);
    app.post('/modals/new', modals.createNew);
    app.get('/modals/open', modals.open);
    app.get('/modals/clientNames', modals.clientNames);

    // Projects
    app.get('/projects/:id', auth.project, projects.show);

    // Admin
    app.get('/system/users', auth.admin, users.index);
    app.get('/system/users/new', auth.admin, users.new);
    app.post('/system/users', auth.admin, users.create);
    app.get('/system/users/:id/edit', auth.admin, users.loadUser, users.edit);
    app.put('/system/users/:id', auth.admin, users.loadUser, users.update);

    app.get('/', auth.requiresLogin, index.index);
};