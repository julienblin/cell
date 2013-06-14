/**
 * Passport authentication config
 */

var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = require('./models/user.js');

module.exports = function() {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findOne({ _id: id }, function (err, user) {
            done(err, user);
        })
    });

    passport.use(new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        },
        function(username, password, done) {
            User.authenticate(username, password, function (err, user) {
                if (err) return done(err);
                if (!user) return done(null, false, { message: 'Unknown username or invalid password.' });
                return done(null, user);
            });
        }
    ));

    return passport;
}();