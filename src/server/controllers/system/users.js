/**
 * Users controller for user management
 * User sessions are managed in the login controller.
 */

"use strict";

var User = require('../../models/user'),
    util = require('util'),
    _ = require('underscore');

exports.index = function(req, res, next) {
    var searchCriteria = {};
    var q = req.query.q;
    if (q) {
        searchCriteria = { $or: [{"username": new RegExp(q, 'i')}, {"email": new RegExp(q, 'i')}] };
    }
    User.paginate(searchCriteria, "username", { currentPage: req.query.page }, function(err, pagination, results){
        if (err) return next(err);
        res.render('system/users/index', {
            title: 'Users',
            pagination: pagination,
            results: results,
            q: q
        });
    });
};

/**
 * Load user based on :id
 */
exports.loadUser = function(req, res, next) {
    User.findById(req.params.id, function(err, user) {
        if (err) return next(err);
        if (!user) return res.status(404).send(util.format('User %s not found!', req.params.id));
        req.loadedUser = user;
        next();
    });
};

var mapUser = function(user, req) {
    user.username = req.body.username;
    user.email = req.body.email;
    user.isActive = req.body.isActive === undefined ? false : true;
    user.isAdmin = req.body.isAdmin === undefined ? false : true;

    if (req.body.password) {
        if (req.body.password === req.body.confirm) {
            user.password = req.body.password;
        }
    }
};

exports.new = function(req, res) {
    res.render('system/users/edit', {
        title: "New user",
        user: new User(),
        method: 'post',
        action: '/system/users'
    });
};

exports.create = function(req, res) {
    var user = new User();
    mapUser(user, req);
    user.save(function(err) {
        if (err) {
            res.render('system/users/edit', {
                title: "New user",
                user: user,
                method: 'post',
                action: '/system/users'
            });
        } else {
            req.flash('success', util.format('User %s has been created successfully!', user.username));
            res.redirect('/system/users');
        }
    });
};

exports.edit = function(req, res) {
    res.render('system/users/edit', {
        title: "Edit " + req.loadedUser.username,
        user: req.loadedUser,
        method: 'put',
        action: util.format('/system/users/%s', req.loadedUser.id)
    });
};

exports.update = function(req, res) {
    var user = req.loadedUser;
    mapUser(user, req);
    user.save(function(err) {
       if (err) {
           res.render('system/users/edit', {
               title: "Edit " + req.loadedUser.username,
               user: user,
               method: 'put',
               action: util.format('/system/users/%s', req.loadedUser.id)
           });
       } else {
           req.flash('success', util.format('User %s has been updated successfully!', user.username));
           res.redirect('/system/users');
       }
    });
};