/**
 * Specifications for project model.
 */

"use strict";

var should = require('should'),
    mongoose = require('mongoose'),
    async = require('async'),
    config = require('../../config.js'),
    factory = require('../../../server/factory'),
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
        var user = factory.make('user');
        var project = factory.make('project');
        project.setAuth('read', user);
        project.isAuth('read', user).should.be.ok;
        project.isAuth('write', user).should.be.ko;
    });

    it('should authorize write', function() {
        var user = factory.make('user');
        var project = factory.make('project');
        project.setAuth('write', user);
        project.isAuth('read', user).should.be.ok;
        project.isAuth('write', user).should.be.ok;
    });

    it('should authorize none', function() {
        var user = factory.make('user');
        var project = factory.make('project');
        project.setAuth('write', user);
        project.setAuth('none', user);
        project.isAuth('read', user).should.be.ko;
        project.isAuth('write', user).should.be.ko;
    });

    it('should create a project with user set as write', function(done) {
        var user = factory.make('user');
        var project = factory.make('project');
        Project.create({ clientName: 'CGI', projectName: 'Cell' }, user, function(err, project) {
            should.not.exists(err);
            project.isAuth('write', user).should.be.ok;
            done();
        });
    });

    it('should not create a project with the same client and the same project name', function(done) {
        factory.makeAndSave('project', function(err, project) {
            should.not.exists(err);
            factory.makeAndSave('project', { clientName: project.clientName, projectName: project.projectName }, function(err, anotherProject) {
                should.exists(err.errors);
                should.not.exists(anotherProject);
                done();
            });
        });
    });

    it('should retrieve client names that are accessible by the user', function(done) {
        var user1 = factory.make('user');
        var user2 = factory.make('user');
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

    it('should find projects that are accessible by the user', function(done) {
        var user1 = factory.make('user');
        var user2 = factory.make('user');
        async.parallel([
            function(callback) {
                Project.create({ clientName: 'CGI', projectName: 'Cell' }, user1, function(err, project) { callback(err); });
            },
            function(callback) {
                Project.create({ clientName: 'Foo', projectName: 'Foo' }, user1, function(err, project) { callback(err); });
            },
            function(callback) {
                Project.create({ clientName: 'CGI', projectName: 'Foo' }, user2, function(err, project) { callback(err); });
            }
        ], function(err) {
            should.not.exists(err);
            Project.queries.findPaginate({ clientName: 'CGI' }, 'clientName', user1, {}, function(err, pagination, projects) {
                pagination.totalItems.should.equal(1);
                projects[0].projectName.should.equal('Cell');
                done();
            });
        });
    });

    it("should not serialize internal properties", function() {
        var project = factory.make('project').toObject();
        should.not.exists(project._id);
        should.not.exists(project.__v);
    });

    it('should not apply modifications when the project is locked, except for isLocked.', function(done) {
        var user = factory.make('user');
        Project.create({ clientName: 'CGI', projectName: 'Cell', isLocked: true }, user, function(err, project) {
            should.not.exists(err);
            var modificationLot = {
                projectId: project.id,
                user: user,
                modifications: [
                    {
                        model: 'Project',
                        action: 'update',
                        values: {
                            clientName: ['CGI', 'Logica']
                        }
                    }
                ]
            };
            Project.applyModifications(modificationLot, function(err, response) {
                should.not.exists(err);
                response.results[0].status.should.equal('error');
                Project.findById(project.id, function(err, project) {
                    should.not.exists(err);
                    project.clientName.should.equal('CGI');

                    modificationLot.modifications = [{
                        model: 'Project',
                        action: 'update',
                        values: {
                            isLocked: [true, false]
                        }
                    }];

                    Project.applyModifications(modificationLot, function(err, response) {
                        should.not.exists(err);
                        Project.findById(project.id, function(err, project) {
                            should.not.exists(err);
                            project.isLocked.should.not.be.ok;
                            done();
                        });
                    });
                });
            });
        });
    });

    var makeReferenceProject = function(callback) {
        var project = factory.make('project');
        var profilePrice = factory.makeAndSave('profilePrice', { project: project}, function() {
            project.profilePrices = [ profilePrice ];
            var profileProject = factory.makeAndSave('profileProject', { project: project, profilePrice: profilePrice }, function() {
                project.profileProjects = [ profileProject ];
                project.save(function(err) {
                    should.not.exists(err);
                    callback({
                        project: project,
                        profilePrice: profilePrice,
                        profileProject: profileProject
                    });
                });
            });
        });
    };

    it('should copy project', function(done) {
        var user = factory.make('user');
        makeReferenceProject(function(ref) {
            Project.copy({ clientName: 'CGI', projectName: 'Cell' }, user, ref.project, null, function(err, newProject) {
                should.not.exists(err);
                newProject.clientName.should.equal('CGI');
                newProject.projectName.should.equal('Cell');
                newProject.isAuth('read', user).should.be.ok;
                newProject.profilePrices.should.have.lengthOf(0);
                newProject.profileProjects.should.have.lengthOf(0);
                newProject.scales.should.have.lengthOf(0);
                newProject.estimationLines.should.have.lengthOf(0);
                done();
            });
        });
    });

    it('should copy prices profiles', function(done) {
        var user = factory.make('user');
        makeReferenceProject(function(ref) {
            Project.copy({ clientName: 'CGI', projectName: 'Cell' }, user, ref.project, Project.CopyParam.ProfilePrices, function(err, newProject) {
                should.not.exists(err);
                newProject.populate('profilePrices', function(err) {
                    should.not.exists(err);
                    newProject.profilePrices.should.have.lengthOf(1);
                    newProject.profilePrices[0].id.should.not.equal(ref.profilePrice);
                    newProject.profilePrices[0].isActive.should.equal(ref.profilePrice.isActive);
                    newProject.profilePrices[0].title.should.equal(ref.profilePrice.title);
                    newProject.profilePrices[0].priceJunior.should.equal(ref.profilePrice.priceJunior);
                    newProject.profilePrices[0].priceIntermediary.should.equal(ref.profilePrice.priceIntermediary);
                    newProject.profilePrices[0].priceSenior.should.equal(ref.profilePrice.priceSenior);

                    newProject.profileProjects.should.have.lengthOf(0);
                    newProject.scales.should.have.lengthOf(0);
                    newProject.estimationLines.should.have.lengthOf(0);
                    done();
                });
            });
        });
    });

    it('should copy project profiles', function(done) {
        var user = factory.make('user');
        makeReferenceProject(function(ref) {
            Project.copy({ clientName: 'CGI', projectName: 'Cell' }, user, ref.project, Project.CopyParam.ProfileProjects, function(err, newProject) {
                should.not.exists(err);
                newProject.populate('profileProjects', function(err) {
                    should.not.exists(err);
                    newProject.profilePrices.should.have.lengthOf(1);
                    newProject.profileProjects.should.have.lengthOf(1);
                    newProject.profileProjects[0].id.should.not.equal(ref.profileProject);
                    newProject.profileProjects[0].isActive.should.equal(ref.profileProject.isActive);
                    newProject.profileProjects[0].title.should.equal(ref.profileProject.title);
                    newProject.profileProjects[0].percentageJunior.should.equal(ref.profileProject.percentageJunior);
                    newProject.profileProjects[0].percentageIntermediary.should.equal(ref.profileProject.percentageIntermediary);
                    newProject.profileProjects[0].percentageSenior.should.equal(ref.profileProject.percentageSenior);
                    newProject.profileProjects[0].profilePrice.toString().should.equal(newProject.profilePrices[0].toString());

                    newProject.scales.should.have.lengthOf(0);
                    newProject.estimationLines.should.have.lengthOf(0);
                    done();
                });
            });
        });
    });
});