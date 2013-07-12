/**
 * Factory for users.
 * Parameters Factory-Lady, but don't export anything
 */

"use strict";

var factory = require('mongoose-fakery'),
    User = require('../models/user');

factory.fake('user', User, {
    username: factory.g.name(),
    email: factory.lazy(function(attrs) {
        return attrs.username + '@example.com';
    }),
    password: 'Valid12Password',
    isActive: true,
    isAdmin: false
});