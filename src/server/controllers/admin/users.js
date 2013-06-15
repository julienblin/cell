/**
 * Users controller
 */

var User = require('../../models/user'),
    util = require('util'),
    _ = require('underscore');

exports.index = function(req, res) {
    User.paginate({}, req.query.page, 25, function(err, pages, count, results){
        if (err) throw err;
        res.render('admin/users/index', {
            title: 'Users',
            page: req.query.page,
            pages: pages,
            count: count,
            results: results
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
    user.active = req.body.active == undefined ? false : true;
    user.isAdmin = req.body.isAdmin == undefined ? false : true;

    if (req.body.password) {
        if (req.body.password === req.body.confirm) {
            user.password = req.body.password;
        }
    }
};

exports.new = function(req, res) {
    res.render('admin/users/edit', {
        title: "New user",
        user: new User(),
        method: 'post',
        action: '/admin/users'
    });
};

exports.create = function(req, res) {
    var user = new User();
    mapUser(user, req);
    user.save(function(err) {
        if (err) {
            res.render('admin/users/edit', {
                title: "New user",
                user: user,
                method: 'post',
                action: '/admin/users'
            });
        } else {
            req.flash('success', util.format('User %s has been created successfully!', user.username));
            res.redirect('/admin/users');
        }
    });
};

exports.edit = function(req, res) {
    res.render('admin/users/edit', {
        title: "Edit " + req.loadedUser.username,
        user: req.loadedUser,
        method: 'put',
        action: util.format('/admin/users/%s', req.loadedUser.id)
    });
};

exports.update = function(req, res) {
    var user = req.loadedUser;
    mapUser(user, req);
    user.save(function(err) {
       if (err) {
           res.render('admin/users/edit', {
               title: "Edit " + req.loadedUser.username,
               user: user,
               method: 'put',
               action: util.format('/admin/users/%s', req.loadedUser.id)
           });
       } else {
           req.flash('success', util.format('User %s has been updated successfully!', user.username));
           res.redirect('/admin/users');
       }
    });
};