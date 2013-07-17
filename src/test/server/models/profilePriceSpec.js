/**
 * Specifications for profile price model.
 */

"use strict";

var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../../config.js'),
    factory = require('../../../server/factory'),
    Project = require('../../../server/models/project'),
    ProfilePrice = require('../../../server/models/profilePrice');

describe("ProfilePrices", function(){
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
                        model: 'ProfilePrice',
                        action: 'create',
                        values: {
                            isActive: true,
                            title: 'Test profile',
                            priceSenior: 25
                        }
                    },
                    {
                        model: 'ProfilePrice',
                        action: 'create',
                        values: {
                            isActive: false,
                            title: 'Test profile 2',
                            priceSenior: 50
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
                ProfilePrice.findById(response.results[1].id, function(err, refProfilePrice) {
                    should.not.exists(err);
                    refProfilePrice.priceSenior.should.equal(50);
                    Project.findById(project.id).populate('profilePrices').exec(function(err, refProject) {
                        refProject.profilePrices.should.have.length(2);
                        refProject.profilePrices[0].title.should.equal(refProfilePrice.title);
                        refProject.profilePrices[1].title.should.equal('Test profile');

                        modificationLot.modifications = [
                            {
                                model: 'ProfilePrice',
                                action: 'create',
                                insertAfter: refProfilePrice.id,
                                values: {
                                    title: 'Test profile insert after',
                                    priceJunior: 20
                                }
                            }
                        ];

                        Project.applyModifications(modificationLot, function(err, response) {
                            should.not.exists(err);
                            Project.findById(project.id).populate('profilePrices').exec(function(err, refProject) {
                                refProject.profilePrices.should.have.length(3);
                                refProject.profilePrices[0].title.should.equal('Test profile 2');
                                refProject.profilePrices[1].title.should.equal('Test profile insert after');
                                refProject.profilePrices[2].title.should.equal('Test profile');
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
            factory.makeAndSave('profilePrice', { project: project.id }, function(err, profilePrice) {
                should.not.exists(err);
                var modificationLot = {
                    projectId: project.id,
                    user: user,
                    modifications: [
                        {
                            model: 'ProfilePrice',
                            id: profilePrice.id,
                            action: 'update',
                            property: 'isActive',
                            newValue: true,
                            oldValue: profilePrice.isActive
                        },
                        {
                            model: 'ProfilePrice',
                            id: profilePrice.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the first title',
                            oldValue: profilePrice.title
                        },
                        {
                            model: 'ProfilePrice',
                            id: profilePrice.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the last title',
                            oldValue: 'Here is the first title'
                        },
                        {
                            model: 'ProfilePrice',
                            id: profilePrice.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the wrong title',
                            oldValue: profilePrice.title
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
                    ProfilePrice.findById(profilePrice.id, function(err, refProfilePrice) {
                        should.not.exists(err);
                        refProfilePrice.isActive.should.be.ok;
                        refProfilePrice.title.should.equal('Here is the last title');
                        done();
                    });
                });
            });
        });
    });

    it("should integrate delete modifications", function(done) {
        var user = factory.make('user');
        var project = factory.make('project', { usersWrite: [user] });
        factory.makeAndSave('profilePrice', { project: project }, function(err, profilePrice1) {
            should.not.exists(err);
            factory.makeAndSave('profilePrice', { project: project }, function(err, profilePrice2) {
                should.not.exists(err);
                project.profilePrices = [ profilePrice1, profilePrice2 ];
                project.save(function(err) {
                    should.not.exists(err);

                    var modificationLot = {
                        projectId: project.id,
                        user: user,
                        modifications: [
                            {
                                model: 'ProfilePrice',
                                action: 'delete',
                                id: profilePrice1.id
                            }
                        ]
                    };

                    Project.applyModifications(modificationLot, function(err, response) {
                        should.not.exists(err);
                        response.results.should.have.length(1);
                        response.results[0].status.should.equal('success');
                        Project.findById(project.id).populate('profilePrices').exec(function(err, refProject) {
                            refProject.profilePrices.should.have.length(1);
                            ProfilePrice.findById(profilePrice1.id, function(err, refProfilePrice) {
                                should.not.exists(err);
                                should.not.exists(refProfilePrice);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it("should not serialize internal properties", function() {
        var profile = factory.make('profilePrice').toObject();
        should.not.exists(profile._id);
        should.not.exists(profile.__v);
        should.not.exists(profile.project);
    });
});