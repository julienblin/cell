var should = require('should'),
    mongoose = require('mongoose'),
    async = require('async'),
    _ = require('underscore'),
    config = require('../../config.js'),
    Project = require('../../../server/models/project'),
    Profile = require('../../../server/models/profile'),
    Scale = require('../../../server/models/scale'),
    User = require('../../../server/models/user'),
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
        var user = new User();
        Project.create({ clientName: 'CGI', projectName: 'Cell' }, user, function(err, project) {
            should.not.exists(err);
            Scale.create({ project: project.id, title: 'Test scale' }, function(err, scale) {
                should.not.exists(err);
                var objectId1 = new Profile().id;
                var objectId2 = new Profile().id;
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
                                profile: objectId1
                            }
                        },
                        {
                            model: 'ScaleColumn',
                            parentId: scale.id,
                            action: 'create',
                            values: {
                                isBaseline: false,
                                profile: objectId2
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
                    ScaleColumn.findById(response.results[0].id, function(err, refScaleColumn) {
                        should.not.exists(err);
                        refScaleColumn.profile.toString().should.equal(objectId1);
                        Scale.findById(scale.id).populate('columns').exec(function(err, refScale) {
                            refScale.columns.should.have.length(2);
                            refScale.columns[0].isBaseline.should.be.ok;
                            refScale.columns[1].isBaseline.should.not.be.ok;
                            var objectId3 = new Profile().id;

                            modificationLot.modifications = [
                                {
                                    model: 'ScaleColumn',
                                    parentId: scale.id,
                                    action: 'create',
                                    insertAfter: refScaleColumn.id,
                                    values: {
                                        isBaseline: false,
                                        profile: objectId3
                                    }
                                }
                            ];

                            Project.applyModifications(modificationLot, function(err, response) {
                                should.not.exists(err);
                                Scale.findById(scale.id).populate('columns').exec(function(err, refScale) {
                                    refScale.columns.should.have.length(3);
                                    refScale.columns[0].profile.toString().should.equal(objectId1);
                                    refScale.columns[1].profile.toString().should.equal(objectId3);
                                    refScale.columns[2].profile.toString().should.equal(objectId2);
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
        var user = new User();
        Project.create({ clientName: 'CGI', projectName: 'Cell' }, user, function(err, project) {
            should.not.exists(err);
            Scale.create({ project: project.id, title: 'Test scale' }, function(err, scale) {
                should.not.exists(err);
                ScaleColumn.create({ scale: scale.id, profileTitle: 'Developer' }, function(err, scaleColumn) {
                    should.not.exists(err);
                    var objectId1 = new Profile().id;
                    var objectId2 = new Profile().id;
                    var objectId3 = new Profile().id;
                    var modificationLot = {
                        projectId: project.id,
                        user: user,
                        modifications: [
                            {
                                model: 'ScaleColumn',
                                id: scaleColumn.id,
                                action: 'update',
                                property: 'isBaseline',
                                newValue: true
                            },
                            {
                                model: 'ScaleColumn',
                                id: scaleColumn.id,
                                action: 'update',
                                property: 'profile',
                                newValue: objectId1
                            },
                            {
                                model: 'ScaleColumn',
                                id: scaleColumn.id,
                                action: 'update',
                                property: 'profile',
                                newValue: objectId2,
                                oldValue: objectId1
                            },
                            {
                                model: 'ScaleColumn',
                                id: scaleColumn.id,
                                action: 'update',
                                property: 'profile',
                                newValue: objectId3,
                                oldValue: objectId1
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
                            refScaleColumn.profile.toString().should.equal(objectId2);
                            done();
                        });
                    });
                })
            });
        });
    });

    it("should integrate delete modifications", function(done) {
        var user = new User();
        Project.create({ clientName: 'CGI', projectName: 'Cell' }, user, function(err, project) {
            should.not.exists(err);
            Scale.create({ project: project.id, title: 'Test scale' }, function(err, scale) {
                should.not.exists(err);
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
                                profileTitle: 'Developer'
                            }
                        },
                        {
                            model: 'ScaleColumn',
                            parentId: scale.id,
                            action: 'create',
                            values: {
                                isBaseline: false,
                                profileTitle: 'Architect'
                            }
                        }
                    ]
                };
                Project.applyModifications(modificationLot, function(err, response) {
                    should.not.exists(err);
                    var scaleColumnIdToDelete = response.results[1].id;
                    modificationLot.modifications = [
                        {
                            model: 'ScaleColumn',
                            action: 'delete',
                            id: scaleColumnIdToDelete
                        }
                    ];
                    Project.applyModifications(modificationLot, function(err, response) {
                        should.not.exists(err);
                        response.results.should.have.length(1);
                        response.results[0].status.should.equal('success');
                        Scale.findById(scale.id).populate('columns').exec(function(err, refScale) {
                            refScale.columns.should.have.length(1);
                            ScaleColumn.findById(scaleColumnIdToDelete, function(err, refScaleColumn) {
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

    it("should not serialize internal properties", function() {
        var scaleColumn = new ScaleColumn({ profileTitle: "Developer"});
        var scaleColumnObj = scaleColumn.toObject();
        should.not.exists(scaleColumnObj._id);
        should.not.exists(scaleColumnObj.__v);
        should.not.exists(scaleColumnObj.scale);
    });
});