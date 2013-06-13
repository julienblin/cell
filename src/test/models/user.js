var should = require("should")
    , mongoose = require("mongoose")
    , User = require('../../models/user.js');

mongoose.connect('mongodb://localhost/cell_test');
describe("Users", function(){

    afterEach(function(done){
        User.remove({}, function() {
            done();
        });
    });

    it('should create a new user', function(done) {
        var user = new User({ email:'julien.blin@cgi.com', username:'Julien Blin', password: '1234' });
        user.save(function(err){
            should.not.exists(err);
            done();
        });
    });

    it('should not create user with the same name', function(done) {
        var user = new User({ email:'julien.blin@cgi.com', username:'Julien Blin', password: '1234' });
        user.save(function(err){
            should.not.exists(err);

            var newUser = new User({ email:'foo@cgi.com', username:'Julien Blin', password: '1234' });
            newUser.save(function(err){
                should.exists(err);
                done();
            });
        });
    });

    it('should not create user with the same email', function(done) {
        var user = new User({ email:'julien.blin@cgi.com', username:'Julien Blin', password: '1234' });
        user.save(function(err){
            should.not.exists(err);

            var newUser = new User({ email:'julien.blin@cgi.com', username:'Foo', password: '1234' });
            newUser.save(function(err){
                should.exists(err);
                done();
            });
        });
    });

    it('should encrypt passwords', function(done) {
        var user = new User({ email:'julien.blin@cgi.com', username:'Julien Blin', password: '1234' });
        user.save(function(err){
            should.not.exists(err);

            user.password.should.not.equal('1234');
            done();
        });
    });

    it('should compare passwords', function(done) {
        var user = new User({ email:'julien.blin@cgi.com', username:'Julien Blin', password: '1234' });
        user.save(function(err){
            should.not.exists(err);

            user.comparePassword('4321', function(err, isMatch) {
                should.not.exists(err);
                isMatch.should.not.be.ok;
                done();
            });

            user.comparePassword('1234', function(err, isMatch) {
                should.not.exists(err);
                isMatch.should.be.ok;
                done();
            });
        });
    });
});