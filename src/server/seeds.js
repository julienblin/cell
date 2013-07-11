/**
 * Data seeds
 * A seed allow the definition of default values / first-time values when the application starts.
 */

"use strict";

var winston = require('winston'),
    User = require('./models/user.js');

module.exports = function(callback){
    winston.profile('Database seeded');
    User.ensureDefaultUser(function(err, user) {
        if (err) return callback(err);

        winston.profile('Database seeded');
        callback();
    });
};