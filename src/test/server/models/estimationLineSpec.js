/**
 * Specifications for estimation line model.
 */

"use strict";

var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../../config.js'),
    factory = require('../../../server/factory'),
    Project = require('../../../server/models/project'),
    EstimationLine = require('../../../server/models/estimationLine');

describe("EstimationLines", function(){
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
                        model: 'EstimationLine',
                        action: 'create',
                        values: {
                            isActive: true,
                            title: 'Test estimation line'
                        }
                    },
                    {
                        model: 'EstimationLine',
                        action: 'create',
                        values: {
                            isActive: false,
                            title: 'Test el 2'
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
                EstimationLine.findById(response.results[1].id, function(err, refEstimationLine) {
                    should.not.exists(err);
                    refEstimationLine.title.should.equal('Test el 2');
                    Project.findById(project.id).populate('estimationLines').exec(function(err, refProject) {
                        refProject.estimationLines.should.have.length(2);
                        refProject.estimationLines[0].title.should.equal(refEstimationLine.title);
                        refProject.estimationLines[1].title.should.equal('Test estimation line');

                        modificationLot.modifications = [
                            {
                                model: 'EstimationLine',
                                action: 'create',
                                insertAfter: refEstimationLine.id,
                                values: {
                                    title: 'Test el insert after',
                                    priceJunior: 20
                                }
                            }
                        ];

                        Project.applyModifications(modificationLot, function(err, response) {
                            should.not.exists(err);
                            Project.findById(project.id).populate('estimationLines').exec(function(err, refProject) {
                                refProject.estimationLines.should.have.length(3);
                                refProject.estimationLines[0].title.should.equal('Test el 2');
                                refProject.estimationLines[1].title.should.equal('Test el insert after');
                                refProject.estimationLines[2].title.should.equal('Test estimation line');
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
            factory.makeAndSave('estimationLine', { project: project.id }, function(err, line) {
                should.not.exists(err);
                var modificationLot = {
                    projectId: project.id,
                    user: user,
                    modifications: [
                        {
                            model: 'EstimationLine',
                            id: line.id,
                            action: 'update',
                            property: 'isActive',
                            newValue: true,
                            oldValue: line.isActive
                        },
                        {
                            model: 'EstimationLine',
                            id: line.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the first title',
                            oldValue: line.title
                        },
                        {
                            model: 'EstimationLine',
                            id: line.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the last title',
                            oldValue: 'Here is the first title'
                        },
                        {
                            model: 'EstimationLine',
                            id: line.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the wrong title',
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
                    EstimationLine.findById(line.id, function(err, refEstimationLine) {
                        should.not.exists(err);
                        refEstimationLine.isActive.should.be.ok;
                        refEstimationLine.title.should.equal('Here is the last title');
                        done();
                    });
                });
            });
        });
    });

    it("should integrate delete modifications", function(done) {
        var user = factory.make('user');
        var project = factory.make('project', { usersWrite: [user] });
        factory.makeAndSave('estimationLine', { project: project }, function(err, estimationLine1) {
            should.not.exists(err);
            factory.makeAndSave('estimationLine', { project: project }, function(err, estimationLine2) {
                should.not.exists(err);
                project.estimationLines = [ estimationLine1, estimationLine2 ];
                project.save(function(err) {
                    should.not.exists(err);
                    var modificationLot = {
                        projectId: project.id,
                        user: user,
                        modifications: [
                            {
                                model: 'EstimationLine',
                                action: 'delete',
                                id: estimationLine1.id
                            }
                        ]
                    };

                    Project.applyModifications(modificationLot, function(err, response) {
                        should.not.exists(err);
                        response.results.should.have.length(1);
                        response.results[0].status.should.equal('success');
                        Project.findById(project.id).populate('estimationLines').exec(function(err, refProject) {
                            refProject.estimationLines.should.have.length(1);
                            EstimationLine.findById(estimationLine1.id, function(err, refEstimationLine) {
                                should.not.exists(err);
                                should.not.exists(refEstimationLine);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it("should not serialize internal properties", function() {
        var estimationLine = factory.make('estimationLine').toObject();
        should.not.exists(estimationLine._id);
        should.not.exists(estimationLine.__v);
        should.not.exists(estimationLine.project);
    });
});