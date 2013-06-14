/**
 * Data seeds
 */

var User = require('./models/user.js');

module.exports = function(callback){
    console.log("Seeding database...");
    User.ensureDefaultUser(function(err, user) {
        if (err) return callback(err);

        console.log("Database seeded.");
        callback();
    });
};