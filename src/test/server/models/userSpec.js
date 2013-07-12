/**
 * Specifications for user model.
 */

"use strict";

var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../../config.js'),
    factory = require('../../../server/factory'),
    User = require('../../../server/models/user');

describe("Users", function(){

    var VALID_PASSWORD = 'MyPassword123';

    beforeEach(function(done){
        mongoose.connect(config.db.url, function() {
            mongoose.connection.db.dropDatabase(done);
        });
    });

    afterEach(function(done){
        mongoose.disconnect(done);
    });

    it('should not create a user with the same username', function(done) {
        factory.makeAndSave('user', function(err, user) {
            should.not.exists(err);
            var user2 = factory.makeAndSave('user', { username: user.username}, function(err, user) {
                should.exists(err.errors);
                done();
            });
        });
    });

    it('should not create a user with the same email', function(done) {
        factory.makeAndSave('user', function(err, user) {
            should.not.exists(err);
            var user2 = factory.makeAndSave('user', { email: user.email}, function(err, user) {
                should.exists(err.errors);
                done();
            });
        });
    });

    it('should encrypt passwords', function(done) {
        factory.makeAndSave('user', { password: VALID_PASSWORD }, function(err, user) {
            should.not.exists(err);
            user.password.should.not.equal(VALID_PASSWORD);
            done();
        });
    });

    it('should compare valid passwords', function(done) {
        factory.makeAndSave('user', { password: VALID_PASSWORD }, function(err, user) {
            should.not.exists(err);
            user.comparePassword(VALID_PASSWORD, function(err, isMatch) {
                should.not.exists(err);
                isMatch.should.be.ok;
                done();
            });
        });
    });

    it('should compare invalid passwords', function(done) {
        factory.makeAndSave('user', { password: VALID_PASSWORD }, function(err, user) {
            should.not.exists(err);
            user.comparePassword(VALID_PASSWORD + '1', function(err, isMatch) {
                should.not.exists(err);
                isMatch.should.not.be.ok;
                done();
            });
        });
    });

    it('should authenticate valid users', function(done) {
        factory.makeAndSave('user', { password: VALID_PASSWORD }, function(err, user) {
            should.not.exists(err);
            User.authenticate(user.username, VALID_PASSWORD, function(err, authenticatedUser) {
                authenticatedUser.username.should.be.equal(user.username);
                done();
            });
        });
    });

    it('should not authenticate valid users with wrong password', function(done) {
        factory.makeAndSave('user', function(err, user) {
            should.not.exists(err);
            User.authenticate(user.username, 'wrongPassword', function(err, authenticatedUser) {
                authenticatedUser.should.not.be.ok;
                done();
            });
        });
    });

    it('should not authenticate inactive users', function(done) {
        factory.makeAndSave('user', { isActive: false, password: VALID_PASSWORD }, function(err, user) {
            should.not.exists(err);
            User.authenticate(user.username, VALID_PASSWORD, function(err, authenticatedUser) {
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
        factory.makeAndSave('user', function(err, user) {
            should.not.exists(err);
            User.ensureDefaultUser(function(err, user){
                should.not.exists(err);
                should.not.exists(user);
                done();
            });
        });
    });

    it("should not serialize internal properties", function() {
        var user = factory.make('user').toObject();
        should.not.exists(user._id);
        should.not.exists(user.__v);
        should.not.exists(user.password);
    });
});