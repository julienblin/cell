/**
 * Specifications for scale line model.
 */

"use strict";

var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../../config.js'),
    factory = require('../../../server/factory'),
    Project = require('../../../server/models/project'),
    Scale = require('../../../server/models/scale'),
    ScaleLine = require('../../../server/models/scaleLine');

describe("ScaleLines", function(){
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
            factory.makeAndSave('scale', { project: project.id }, function(err, scale) {
                should.not.exists(err);
                var modificationLot = {
                    projectId: project.id,
                    user: user,
                    modifications: [
                        {
                            model: 'ScaleLine',
                            parentId: scale.id,
                            action: 'create',
                            values: {
                                isActive: true,
                                complexity: 'Test scale line',
                                values: {
                                    'Developer': 1.0,
                                    'Analyst' : 0.5
                                }
                            }
                        },
                        {
                            model: 'ScaleLine',
                            parentId: scale.id,
                            action: 'create',
                            values: {
                                isActive: false,
                                complexity: 'Test scale line 2',
                                values: {
                                    'Developer': 1.0,
                                    'Analyst' : 2.0
                                }
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
                    ScaleLine.findById(response.results[1].id, function(err, refScaleLine) {
                        should.not.exists(err);
                        refScaleLine.values.Developer.should.equal(1.0);
                        Scale.findById(scale.id).populate('lines').exec(function(err, refScale) {
                            refScale.lines.should.have.length(2);
                            refScale.lines[0].complexity.should.equal(refScaleLine.complexity);
                            refScale.lines[0].values.Analyst.should.equal(2.0);
                            refScale.lines[1].complexity.should.equal('Test scale line');
                            refScale.lines[1].values.Developer.should.equal(1.0);

                            modificationLot.modifications = [
                                {
                                    model: 'ScaleLine',
                                    parentId: scale.id,
                                    action: 'create',
                                    insertAfter: refScaleLine.id,
                                    values: {
                                        complexity: 'Test scale insert after',
                                        values: {
                                            'Developer': 1.0,
                                            'Analyst' : 2.0
                                        }
                                    }
                                }
                            ];

                            Project.applyModifications(modificationLot, function(err, response) {
                                should.not.exists(err);
                                Scale.findById(scale.id).populate('lines').exec(function(err, refScale) {
                                    refScale.lines.should.have.length(3);
                                    refScale.lines[0].complexity.should.equal('Test scale line 2');
                                    refScale.lines[1].complexity.should.equal('Test scale insert after');
                                    refScale.lines[2].complexity.should.equal('Test scale line');
                                    done();
                                });
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
                factory.makeAndSave('scaleLine', { scale: scale.id }, function(err, scaleLine) {
                    should.not.exists(err);
                    var modificationLot = {
                        projectId: project.id,
                        user: user,
                        modifications: [
                            {
                                model: 'ScaleLine',
                                id: scaleLine.id,
                                action: 'update',
                                property: 'isActive',
                                newValue: true,
                                oldValue: scaleLine.isActive
                            },
                            {
                                model: 'ScaleLine',
                                id: scaleLine.id,
                                action: 'update',
                                property: 'values.Developer',
                                newValue: 1.0
                            },
                            {
                                model: 'ScaleLine',
                                id: scaleLine.id,
                                action: 'update',
                                property: 'values.Developer',
                                newValue: 1.5,
                                oldValue: 1.0
                            },
                            {
                                model: 'ScaleLine',
                                id: scaleLine.id,
                                action: 'update',
                                property: 'values.Developer',
                                newValue: 2.5,
                                oldValue: 1.0
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
                        ScaleLine.findById(scaleLine.id, function(err, refScale) {
                            should.not.exists(err);
                            refScale.isActive.should.be.ok;
                            refScale.values.Developer.should.equal(1.5);
                            done();
                        });
                    });
                })
            });
        });
    });

    it("should integrate delete modifications", function(done) {
        var user = factory.make('user');
        factory.makeAndSave('project', { usersWrite: [user] }, function(err, project) {
            should.not.exists(err);

            var scale = factory.make('scale');
            factory.makeAndSave('scaleLine', { scale: scale.id }, function(err, scaleLine1) {
                should.not.exists(err);
                factory.makeAndSave('scaleLine', { scale: scale.id }, function(err, scaleLine2) {
                    should.not.exists(err);
                    scale.lines = [scaleLine1, scaleLine2];
                    scale.save(function(err) {
                        should.not.exists(err);
                        var modificationLot = {
                            projectId: project.id,
                            user: user,
                            modifications: [
                                {
                                    model: 'ScaleLine',
                                    action: 'delete',
                                    id: scaleLine1.id
                                }
                            ]
                        };

                        Project.applyModifications(modificationLot, function(err, response) {
                            should.not.exists(err);
                            response.results.should.have.length(1);
                            response.results[0].status.should.equal('success');
                            Scale.findById(scale.id).populate('lines').exec(function(err, refScale) {
                                refScale.lines.should.have.length(1);
                                ScaleLine.findById(scaleLine1.id, function(err, refScaleLine) {
                                    should.not.exists(err);
                                    should.not.exists(refScaleLine);
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it("should not serialize internal properties", function() {
        var scaleLine = factory.make('scaleLine').toObject();
        should.not.exists(scaleLine._id);
        should.not.exists(scaleLine.__v);
        should.not.exists(scaleLine.scale);
    });
});