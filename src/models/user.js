var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , bcrypt = require('bcrypt')
    , SALT_WORK_FACTOR = 10;

var UserSchema = new Schema({
    username: { type: String, required: true, index: { unique: true } }
 ,  email:    { type: String, required: true, index: { unique: true } }
 ,  password: { type: String, required: true }
 ,  active:   { type: Boolean, required: true, default: true }
});

// mongoose plugins for hashing password on save.
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

UserSchema.methods.comparePassword = function(candidatePassword, callback) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return callback(err);
        callback(null, isMatch);
    })
};

UserSchema.statics.authenticate = function(username, password, callback) {
    this.findOne({ 'username' : username, 'active' : true }, function(err, user) {
        if (err) return callback(err, null);
        if (!user) return callback(null, false);

        user.comparePassword(password, function(err, isMatch) {
            if (err) return callback(err, null);
            if (!isMatch) return callback(null, false);
            return callback(null, user);
        });
    });
};

module.exports = mongoose.model('User', UserSchema);
