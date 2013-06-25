var should = require('should'),
    mongoose = require('mongoose'),
    async = require('async'),
    config = require('../../config.js'),
    Project = require('../../../server/models/project'),
    User = require('../../../server/models/user');

describe("Projects", function(){
    beforeEach(function(done){
        mongoose.connect(config.db.url, function() {
            mongoose.connection.db.dropDatabase(done);
        });
    });

    afterEach(function(done){
        mongoose.disconnect(done);
    });

    it('should authorize read', function() {
        var user = new User();
        var project = new Project();
        project.setAuth('read', user);
        project.isAuth('read', user).should.be.ok;
        project.isAuth('write', user).should.be.ko;
    });

    it('should authorize write', function() {
        var user = new User();
        var project = new Project();
        project.setAuth('write', user);
        project.isAuth('read', user).should.be.ok;
        project.isAuth('write', user).should.be.ok;
    });

    it('should authorize none', function() {
        var user = new User();
        var project = new Project();
        project.setAuth('write', user);
        project.setAuth('none', user);
        project.isAuth('read', user).should.be.ko;
        project.isAuth('write', user).should.be.ko;
    });

    it('should create a project with user set as write', function(done) {
        var user = new User();
        Project.create({ clientName: 'CGI', projectName: 'Cell' }, user, function(err, project) {
            should.not.exists(err);
            project.isAuth('write', user).should.be.ok;
            done();
        });
    });

    it('should not create a project with the same client and the same project name', function(done) {
        var user = new User();
        Project.create({ clientName: 'CGI', projectName: 'Cell' }, user, function(err, project) {
            should.not.exists(err);
            Project.create({ clientName: project.clientName, projectName: project.projectName }, user, function(anotherErr, anotherProject) {
                should.exists(anotherErr.errors);
                should.exists(anotherProject.errors.projectName);
                done();
            });
        });
    });

    it('should retrieve client names that are accessible by the user', function(done) {
        var user1 = new User();
        var user2 = new User();
        async.parallel([
            function(callback) {
                Project.create({ clientName: 'CGI', projectName: 'Cell' }, user1, function(err, project) { callback(err); });
            },
            function(callback) {
                Project.create({ clientName: 'Foo', projectName: 'Foo' }, user1, function(err, project) { callback(err); });
            },
            function(callback) {
                Project.create({ clientName: 'Bar', projectName: 'Foo' }, user2, function(err, project) { callback(err); });
            }
        ], function(err) {
            should.not.exists(err);
            Project.queries.getAccessibleClientNames('CGI', user1, function(err, clientNames) {
                clientNames.should.have.length(1);
                clientNames.should.include('CGI');
                clientNames.should.not.include('Foo');
                Project.queries.getAccessibleClientNames('B', user2, function(err, clientNames) {
                    clientNames.should.have.length(1);
                    clientNames.should.include('Bar');
                    Project.queries.getAccessibleClientNames('asdf', user2, function(err, clientNames) {
                        clientNames.should.have.length(0);
                        done();
                    });
                });
            });
        });
    });
});