/**
 * Pages related to login and logout of users.
 */

"use strict";

var auth = require('../middlewares/authorizations'),
    passport = require('passport');

exports.login = function(req, res){
    res.render('login');
};

exports.loginRedirect = function(req, res) {
    var redirectTo = req.session.loginRedirectTo ? req.session.loginRedirectTo : '/';
    delete req.session.loginRedirectTo;
    return res.redirect(redirectTo);
};

exports.logout = function (req, res) {
    req.logout();
    res.redirect('/');
};