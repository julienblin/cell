/**
 * Authorization rules connect middleware
 */

exports.LOGIN_ROUTE = "/login";

exports.requiresLogin = function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect(exports.LOGIN_ROUTE);
    }
    next();
};

exports.admin = function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect(exports.LOGIN_ROUTE);
    }

    if (!req.user.isAdmin) {
        return res.redirect(exports.LOGIN_ROUTE);
    }
    next();
};