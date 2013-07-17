/**
 * Specifications for profile model.
 */

"use strict";

var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../../config.js'),
    factory = require('../../../server/factory'),
    Project = require('../../../server/models/project'),
    ProfileProject = require('../../../server/models/profileProject');

describe("ProfileProjects", function(){
    beforeEach(function(done){
        mongoose.connect(config.db.url, function() {
            mongoose.connection.db.dropDatabase(done);
        });
    });

    afterEach(function(done){
        mongoose.disconnect(done);
    });

    it("should integrate create modifications", function(done) {
        var user = factory.make('user');
        factory.makeAndSave('project', { usersWrite: [user] }, function(err, project) {
            should.not.exists(err);
            var modificationLot = {
                projectId: project.id,
                user: user,
                modifications: [
                    {
                        model: 'ProfileProject',
                        action: 'create',
                        values: {
                            isActive: true,
                            title: 'Test profile',
                            percentageSenior: 25
                        }
                    },
                    {
                        model: 'ProfileProject',
                        action: 'create',
                        values: {
                            isActive: false,
                            title: 'Test profile 2',
                            percentageSenior: 50
                        }
                    }
                ]
            };

            Project.applyModifications(modificationLot, function(err, response) {
                should.not.exists(err);
                response.results.should.have.length(2);
                response.results[0].status.should.equal('success');
                response.results[1].status.should.equal('success');
                should.exists(response.results[0].id);
                should.exists(response.results[1].id);
                ProfileProject.findById(response.results[1].id, function(err, refProfileProject) {
                    should.not.exists(err);
                    refProfileProject.percentageSenior.should.equal(50);
                    Project.findById(project.id).populate('profileProjects').exec(function(err, refProject) {
                        refProject.profileProjects.should.have.length(2);
                        refProject.profileProjects[0].title.should.equal(refProfileProject.title);
                        refProject.profileProjects[1].title.should.equal('Test profile');

                        modificationLot.modifications = [
                            {
                                model: 'ProfileProject',
                                action: 'create',
                                insertAfter: refProfileProject.id,
                                values: {
                                    title: 'Test profile insert after',
                                    priceJunior: 20
                                }
                            }
                        ];

                        Project.applyModifications(modificationLot, function(err, response) {
                            should.not.exists(err);
                            Project.findById(project.id).populate('profileProjects').exec(function(err, refProject) {
                                refProject.profileProjects.should.have.length(3);
                                refProject.profileProjects[0].title.should.equal('Test profile 2');
                                refProject.profileProjects[1].title.should.equal('Test profile insert after');
                                refProject.profileProjects[2].title.should.equal('Test profile');
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it("should integrate update modifications", function(done) {
        var user = factory.make('user');
        factory.makeAndSave('project', { usersWrite: [user] }, function(err, project) {
            should.not.exists(err);
            factory.makeAndSave('profileProject', { project: project.id }, function(err, profileProject) {
                should.not.exists(err);
                var modificationLot = {
                    projectId: project.id,
                    user: user,
                    modifications: [
                        {
                            model: 'ProfileProject',
                            id: profileProject.id,
                            action: 'update',
                            property: 'isActive',
                            newValue: true,
                            oldValue: profileProject.isActive
                        },
                        {
                            model: 'ProfileProject',
                            id: profileProject.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the first title',
                            oldValue: profileProject.title
                        },
                        {
                            model: 'ProfileProject',
                            id: profileProject.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the last title',
                            oldValue: 'Here is the first title'
                        },
                        {
                            model: 'ProfileProject',
                            id: profileProject.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the wrong title',
                            oldValue: profileProject.title
                        }
                    ]
                };
                Project.applyModifications(modificationLot, function(err, response) {
                    should.not.exists(err);
                    response.results.should.have.length(4);
                    response.results[0].status.should.equal('success');
                    response.results[1].status.should.equal('success');
                    response.results[2].status.should.equal('success');
                    response.results[3].status.should.equal('concurrencyError');
                    ProfileProject.findById(profileProject.id, function(err, refProfileProject) {
                        should.not.exists(err);
                        refProfileProject.isActive.should.be.ok;
                        refProfileProject.title.should.equal('Here is the last title');
                        done();
                    });
                });
            });
        });
    });

    it("should integrate delete modifications", function(done) {
        var user = factory.make('user');
        var project = factory.make('project', { usersWrite: [user] });
        factory.makeAndSave('profileProject', { project: project }, function(err, profileProject1) {
            should.not.exists(err);
            factory.makeAndSave('profileProject', { project: project }, function(err, profileProject2) {
                should.not.exists(err);
                project.profileProjects = [ profileProject1, profileProject2 ];
                project.save(function(err) {
                    should.not.exists(err);

                    var modificationLot = {
                        projectId: project.id,
                        user: user,
                        modifications: [
                            {
                                model: 'ProfileProject',
                                action: 'delete',
                                id: profileProject1.id
                            }
                        ]
                    };

                    Project.applyModifications(modificationLot, function(err, response) {
                        should.not.exists(err);
                        response.results.should.have.length(1);
                        response.results[0].status.should.equal('success');
                        Project.findById(project.id).populate('profileProjects').exec(function(err, refProject) {
                            refProject.profileProjects.should.have.length(1);
                            ProfileProject.findById(profileProject1.id, function(err, refProfileProject) {
                                should.not.exists(err);
                                should.not.exists(refProfileProject);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it("should not serialize internal properties", function() {
        var profileProject = factory.make('profileProject').toObject();
        should.not.exists(profileProject._id);
        should.not.exists(profileProject.__v);
        should.not.exists(profileProject.project);
    });
});