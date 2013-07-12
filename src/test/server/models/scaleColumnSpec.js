/**
 * Specifications for scale column model.
 */

"use strict";

var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../../config.js'),
    factory = require('../../../server/factory'),
    Project = require('../../../server/models/project'),
    Scale = require('../../../server/models/scale'),
    ScaleColumn = require('../../../server/models/scaleColumn');

describe("ScaleColumns", function(){
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
                var profile1 = factory.make('profile');
                var profile2 = factory.make('profile');
                var modificationLot = {
                    projectId: project.id,
                    user: user,
                    modifications: [
                        {
                            model: 'ScaleColumn',
                            parentId: scale.id,
                            action: 'create',
                            values: {
                                isBaseline: true,
                                profile: profile1.id
                            }
                        },
                        {
                            model: 'ScaleColumn',
                            parentId: scale.id,
                            action: 'create',
                            values: {
                                isBaseline: false,
                                profile: profile2.id
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
                    ScaleColumn.findById(response.results[1].id, function(err, refScaleColumn) {
                        should.not.exists(err);
                        refScaleColumn.profile.toString().should.equal(profile2.id);
                        Scale.findById(scale.id).populate('columns').exec(function(err, refScale) {
                            refScale.columns.should.have.length(2);
                            refScale.columns[0].isBaseline.should.not.be.ok;
                            refScale.columns[1].isBaseline.should.be.ok;
                            var profile3 = factory.make('profile');

                            modificationLot.modifications = [
                                {
                                    model: 'ScaleColumn',
                                    parentId: scale.id,
                                    action: 'create',
                                    insertAfter: refScaleColumn.id,
                                    values: {
                                        isBaseline: false,
                                        profile: profile3.id
                                    }
                                }
                            ];

                            Project.applyModifications(modificationLot, function(err, response) {
                                should.not.exists(err);
                                Scale.findById(scale.id).populate('columns').exec(function(err, refScale) {
                                    refScale.columns.should.have.length(3);
                                    refScale.columns[0].profile.toString().should.equal(profile2.id);
                                    refScale.columns[1].profile.toString().should.equal(profile3.id);
                                    refScale.columns[2].profile.toString().should.equal(profile1.id);
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
                factory.makeAndSave('scaleColumn', { scale: scale.id }, function(err, scaleColumn) {
                    should.not.exists(err);
                    var profile1 = factory.make('profile');
                    var profile2 = factory.make('profile');
                    var profile3 = factory.make('profile');
                    var modificationLot = {
                        projectId: project.id,
                        user: user,
                        modifications: [
                            {
                                model: 'ScaleColumn',
                                id: scaleColumn.id,
                                action: 'update',
                                property: 'isBaseline',
                                newValue: true,
                                oldValue: scaleColumn.isBaseline
                            },
                            {
                                model: 'ScaleColumn',
                                id: scaleColumn.id,
                                action: 'update',
                                property: 'profile',
                                newValue: profile1.id
                            },
                            {
                                model: 'ScaleColumn',
                                id: scaleColumn.id,
                                action: 'update',
                                property: 'profile',
                                newValue: profile2.id,
                                oldValue: profile1.id
                            },
                            {
                                model: 'ScaleColumn',
                                id: scaleColumn.id,
                                action: 'update',
                                property: 'profile',
                                newValue: profile3.id,
                                oldValue: profile1.id
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
                        ScaleColumn.findById(scaleColumn.id, function(err, refScaleColumn) {
                            should.not.exists(err);
                            refScaleColumn.isBaseline.should.be.ok;
                            refScaleColumn.profile.toString().should.equal(profile2.id);
                            done();
                        });
                    });
                });
            });
        });
    });

    it("should integrate delete modifications", function(done) {
        var user = factory.make('user');
        factory.makeAndSave('project', { usersWrite: [user] }, function(err, project) {
            should.not.exists(err);

            var scale = factory.make('scale');
            factory.makeAndSave('scaleColumn', { scale: scale.id }, function(err, scaleColumn1) {
                should.not.exists(err);
                factory.makeAndSave('scaleColumn', { scale: scale.id }, function(err, scaleColumn2) {
                    should.not.exists(err);
                    scale.columns = [scaleColumn1, scaleColumn2];
                    scale.save(function(err) {
                        should.not.exists(err);
                        var modificationLot = {
                            projectId: project.id,
                            user: user,
                            modifications: [
                                {
                                    model: 'ScaleColumn',
                                    action: 'delete',
                                    id: scaleColumn1.id
                                }
                            ]
                        };

                        Project.applyModifications(modificationLot, function(err, response) {
                            should.not.exists(err);
                            response.results.should.have.length(1);
                            response.results[0].status.should.equal('success');
                            Scale.findById(scale.id).populate('columns').exec(function(err, refScale) {
                                refScale.columns.should.have.length(1);
                                ScaleColumn.findById(scaleColumn1.id, function(err, refScaleColumn) {
                                    should.not.exists(err);
                                    should.not.exists(refScaleColumn);
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
        var scaleColumn = factory.make('scaleColumn').toObject();
        should.not.exists(scaleColumn._id);
        should.not.exists(scaleColumn.__v);
        should.not.exists(scaleColumn.scale);
    });
});