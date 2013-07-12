/**
 * Specifications for profile model.
 */

"use strict";

var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../../config.js'),
    factory = require('../../../server/factory'),
    Project = require('../../../server/models/project'),
    Profile = require('../../../server/models/profile');

describe("Profiles", function(){
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
                        model: 'Profile',
                        action: 'create',
                        values: {
                            isActive: true,
                            title: 'Test profile',
                            percentageSenior: 25
                        }
                    },
                    {
                        model: 'Profile',
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
                Profile.findById(response.results[1].id, function(err, refProfile) {
                    should.not.exists(err);
                    refProfile.percentageSenior.should.equal(50);
                    Project.findById(project.id).populate('profiles').exec(function(err, refProject) {
                        refProject.profiles.should.have.length(2);
                        refProject.profiles[0].title.should.equal(refProfile.title);
                        refProject.profiles[1].title.should.equal('Test profile');

                        modificationLot.modifications = [
                            {
                                model: 'Profile',
                                action: 'create',
                                insertAfter: refProfile.id,
                                values: {
                                    title: 'Test profile insert after',
                                    priceJunior: 20
                                }
                            }
                        ];

                        Project.applyModifications(modificationLot, function(err, response) {
                            should.not.exists(err);
                            Project.findById(project.id).populate('profiles').exec(function(err, refProject) {
                                refProject.profiles.should.have.length(3);
                                refProject.profiles[0].title.should.equal('Test profile 2');
                                refProject.profiles[1].title.should.equal('Test profile insert after');
                                refProject.profiles[2].title.should.equal('Test profile');
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
            factory.makeAndSave('profile', { project: project.id }, function(err, profile) {
                should.not.exists(err);
                var modificationLot = {
                    projectId: project.id,
                    user: user,
                    modifications: [
                        {
                            model: 'Profile',
                            id: profile.id,
                            action: 'update',
                            property: 'isActive',
                            newValue: true,
                            oldValue: profile.isActive
                        },
                        {
                            model: 'Profile',
                            id: profile.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the first title',
                            oldValue: profile.title
                        },
                        {
                            model: 'Profile',
                            id: profile.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the last title',
                            oldValue: 'Here is the first title'
                        },
                        {
                            model: 'Profile',
                            id: profile.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the wrong title',
                            oldValue: profile.title
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
                    Profile.findById(profile.id, function(err, refProfile) {
                        should.not.exists(err);
                        refProfile.isActive.should.be.ok;
                        refProfile.title.should.equal('Here is the last title');
                        done();
                    });
                });
            });
        });
    });

    it("should integrate delete modifications", function(done) {
        var user = factory.make('user');
        var project = factory.make('project', { usersWrite: [user] });
        factory.makeAndSave('profile', { project: project }, function(err, profile1) {
            should.not.exists(err);
            factory.makeAndSave('profile', { project: project }, function(err, profile2) {
                should.not.exists(err);
                project.profiles = [ profile1, profile2 ];
                project.save(function(err) {
                    should.not.exists(err);

                    var modificationLot = {
                        projectId: project.id,
                        user: user,
                        modifications: [
                            {
                                model: 'Profile',
                                action: 'delete',
                                id: profile1.id
                            }
                        ]
                    };

                    Project.applyModifications(modificationLot, function(err, response) {
                        should.not.exists(err);
                        response.results.should.have.length(1);
                        response.results[0].status.should.equal('success');
                        Project.findById(project.id).populate('profiles').exec(function(err, refProject) {
                            refProject.profiles.should.have.length(1);
                            Profile.findById(profile1.id, function(err, refProfile) {
                                should.not.exists(err);
                                should.not.exists(refProfile);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it("should not serialize internal properties", function() {
        var profile = factory.make('profile').toObject();
        should.not.exists(profile._id);
        should.not.exists(profile.__v);
        should.not.exists(profile.project);
    });
});