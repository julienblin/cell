var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt'),
    validations = require('./plugins/validations'),
    SALT_WORK_FACTOR = 10;

var UserSchema = new Schema({
    username: { type: String, required: true, validate: [validations.uniqueFieldInsensitive('User', 'username')], index: { unique: true } },
    email:    { type: String, required: true, validate: [validations.uniqueFieldInsensitive('User', 'email'), validations.email()], index: { unique: true } },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false }
});

/**
 * Hash the password using bcrypt on save.
 */
UserSchema.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password'))return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

/**
 * Compare candidatePassword against the hash password.
 */
UserSchema.methods.comparePassword = function(candidatePassword, callback) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return callback(err);
        callback(null, isMatch);
    })
};

/**
 * Verify that a user can authenticate (good username/password combination + active === true.
 */
UserSchema.statics.authenticate = function(username, password, callback) {
    this.findOne({ 'username' : username, 'isActive' : true }, function(err, user) {
        if (err) return callback(err, null);
        if (!user) return callback(null, false);

        user.comparePassword(password, function(err, isMatch) {
            if (err) return callback(err, null);
            if (!isMatch) return callback(null, false);
            return callback(null, user);
        });
    });
};

/**
 * Ensure that a default user Admin/admin is present is no user in database
 */
UserSchema.statics.ensureDefaultUser = function(callback) {
    this.count({}, function(err, count) {
        if (err) return callback(err, null);
        if (count === 0) {
            var User = mongoose.model('User');
            var defaultUser = new User({
                username : "Admin",
                email : "Admin@cell",
                password: "admin",
                isAdmin: true
            });
            defaultUser.save(function(err) {
                if (err) callback(err, null);
                return callback(null, defaultUser);
            });
        } else {
            return callback(null, null);
        }
    });
};

UserSchema.plugin(require('./plugins/paginate'));

module.exports = mongoose.model('User', UserSchema);
