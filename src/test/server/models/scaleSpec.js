/**
 * Specifications for scale model.
 */

"use strict";

var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../../config.js'),
    factory = require('../../../server/factory'),
    Project = require('../../../server/models/project'),
    Scale = require('../../../server/models/scale');

describe("Scales", function(){
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
                        model: 'Scale',
                        action: 'create',
                        values: {
                            isActive: true,
                            name: 'Test scale'
                        }
                    },
                    {
                        model: 'Scale',
                        action: 'create',
                        values: {
                            isActive: false,
                            name: 'Test scale 2'
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
                Scale.findById(response.results[1].id, function(err, refScale) {
                    should.not.exists(err);
                    refScale.name.should.equal('Test scale 2');
                    Project.findById(project.id).populate('scales').exec(function(err, refProject) {
                        refProject.scales.should.have.length(2);
                        refProject.scales[0].name.should.equal(refScale.name);
                        refProject.scales[1].name.should.equal('Test scale');

                        modificationLot.modifications = [
                            {
                                model: 'Scale',
                                action: 'create',
                                insertAfter: refScale.id,
                                values: {
                                    name: 'Test scale insert after'
                                }
                            }
                        ];

                        Project.applyModifications(modificationLot, function(err, response) {
                            should.not.exists(err);
                            Project.findById(project.id).populate('scales').exec(function(err, refProject) {
                                refProject.scales.should.have.length(3);
                                refProject.scales[0].name.should.equal('Test scale 2');
                                refProject.scales[1].name.should.equal('Test scale insert after');
                                refProject.scales[2].name.should.equal('Test scale');
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
            factory.makeAndSave('scale', { project: project.id }, function(err, scale) {
                should.not.exists(err);
                var modificationLot = {
                    projectId: project.id,
                    user: user,
                    modifications: [
                        {
                            model: 'Scale',
                            id: scale.id,
                            action: 'update',
                            property: 'isActive',
                            newValue: true,
                            oldValue: scale.isActive
                        },
                        {
                            model: 'Scale',
                            id: scale.id,
                            action: 'update',
                            property: 'name',
                            newValue: 'Here is the first name',
                            oldValue: scale.name
                        },
                        {
                            model: 'Scale',
                            id: scale.id,
                            action: 'update',
                            property: 'name',
                            newValue: 'Here is the last name',
                            oldValue: 'Here is the first name'
                        },
                        {
                            model: 'Scale',
                            id: scale.id,
                            action: 'update',
                            property: 'name',
                            newValue: 'Here is the wrong name',
                            oldValue: 'Foo'
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
                    Scale.findById(scale.id, function(err, refScale) {
                        should.not.exists(err);
                        refScale.isActive.should.be.ok;
                        refScale.name.should.equal('Here is the last name');
                        done();
                    });
                });
            });
        });
    });

    it("should integrate delete modifications", function(done) {
        var user = factory.make('user');
        var project = factory.make('project', { usersWrite: [user] });
        factory.makeAndSave('scale', { project: project }, function(err, scale1) {
            should.not.exists(err);
            factory.makeAndSave('scale', { project: project }, function(err, scale2) {
                should.not.exists(err);
                project.scales = [ scale1, scale2 ];
                project.save(function(err) {
                    should.not.exists(err);
                    var modificationLot = {
                        projectId: project.id,
                        user: user,
                        modifications: [
                            {
                                model: 'Scale',
                                action: 'delete',
                                id: scale1.id
                            }
                        ]
                    };

                    Project.applyModifications(modificationLot, function(err, response) {
                        should.not.exists(err);
                        response.results.should.have.length(1);
                        response.results[0].status.should.equal('success');
                        Project.findById(project.id).populate('scales').exec(function(err, refProject) {
                            refProject.scales.should.have.length(1);
                            Scale.findById(scale1.id, function(err, refScale) {
                                should.not.exists(err);
                                should.not.exists(refScale);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it("should not serialize internal properties", function() {
        var scale = factory.make('scale').toObject();
        should.not.exists(scale._id);
        should.not.exists(scale.__v);
        should.not.exists(scale.project);
    });
});