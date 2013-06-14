var should = require("should")
    , mongoose = require("mongoose")

mongoose.models = {};
mongoose.modelSchemas = {};

var User = require('../../app/models/user.js');

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
        mongoose.connect('mongodb://localhost/cell_test', done);
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
        var user = new User({ email:'julien.blin@cgi.com', username:'Julien Blin', password: VALID_PASSWORD, active: false });
        user.save(function(err){
            User.authenticate(user.username, '1234', function(err, authenticatedUser) {
                authenticatedUser.should.not.be.ok;
                done();
            });
        });
    });
});