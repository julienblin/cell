var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../../config.js'),
    Project = require('../../../server/models/project'),
    User = require('../../../server/models/user');

describe("Projects", function(){
    beforeEach(function(done){
        mongoose.connect(config.db.url, done);
    });

    afterEach(function(done){
        mongoose.connection.db.dropDatabase(function() {
            mongoose.disconnect(done);
        });
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
                should.not.exists(anotherProject);
                done();
            });
        });
    });
});