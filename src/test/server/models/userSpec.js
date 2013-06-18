var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../../config.js');

mongoose.models = {};
mongoose.modelSchemas = {};

var User = require('../../../server/models/user');

var VALID_PASSWORD = '1234';
var saveValidUser = function(callback) {
    var user = new User({ email:'julien.blin@cgi.com', username:'Julien Blin', password: VALID_PASSWORD });
    user.save(function(err){
        should.not.exists(err);
        callback(user);
    });
};

describe("Users", function(){

    beforeEach(function(done){
        mongoose.connect(config.db.url, done);
    });

    afterEach(function(done){
        mongoose.connection.db.dropDatabase(function() {
            mongoose.disconnect(done);
        });
    });

    it('should encrypt passwords', function(done) {
        saveValidUser(function(user){
            user.password.should.not.equal(VALID_PASSWORD);
            done();
        });
    });

    it('should compare valid passwords', function(done) {
        saveValidUser(function(user){
            user.comparePassword(VALID_PASSWORD, function(err, isMatch) {
                should.not.exists(err);
                isMatch.should.be.ok;
                done();
            });
        });
    });

    it('should compare invalid passwords', function(done) {
        saveValidUser(function(user){
            user.comparePassword(VALID_PASSWORD + '1', function(err, isMatch) {
                should.not.exists(err);
                isMatch.should.not.be.ok;
                done();
            });
        });
    });

    it('should authenticate valid users', function(done) {
        saveValidUser(function(user){
            User.authenticate(user.username, VALID_PASSWORD, function(err, authenticatedUser) {
                authenticatedUser.username.should.be.equal(user.username);
                done();
            });
        });
    });

    it('should not authenticate valid users with wrong password', function(done) {
        saveValidUser(function(user){
            User.authenticate(user.username, VALID_PASSWORD + '1', function(err, authenticatedUser) {
                authenticatedUser.should.not.be.ok;
                done();
            });
        });
    });

    it('should not authenticate inactive users', function(done) {
        var user = new User({ email:'julien.blin@cgi.com', username:'Julien Blin', password: VALID_PASSWORD, isActive: false });
        user.save(function(err){
            User.authenticate(user.username, '1234', function(err, authenticatedUser) {
                authenticatedUser.should.not.be.ok;
                done();
            });
        });
    });

    it('should ensure default user', function(done) {
        User.ensureDefaultUser(function(err, user){
            should.not.exists(err);
            user.username.should.equal('Admin');
            done();
        });
    });

    it('should not ensure default user when a user already exists.', function(done) {
        saveValidUser(function(user){
            User.ensureDefaultUser(function(err, user){
                should.not.exists(err);
                should.not.exists(user);
                done();
            })
        });
    });
});