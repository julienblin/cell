/**
 * Authorization rules connect middleware
 */

var Project = require('../models/project');

exports.LOGIN_ROUTE = "/login";

exports.requiresLogin = function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect(exports.LOGIN_ROUTE);
    }
    next();
};

exports.project = function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect(exports.LOGIN_ROUTE);
    }
    Project.findById(req.params.id, function(err, project) {
        if (err) throw err;
        if (!project) return res.send('Unknown project id', 404);
        if (!project.isAuth('read', req.user)) return res.send('Unauthorized', 403);
        req.project = project;
        next();
    });
}

exports.admin = function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect(exports.LOGIN_ROUTE);
    }

    if (!req.user.isAdmin) {
        return res.redirect(exports.LOGIN_ROUTE);
    }
    next();
};