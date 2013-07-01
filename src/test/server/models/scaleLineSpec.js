var should = require('should'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.ObjectId,
    async = require('async'),
    _ = require('underscore'),
    config = require('../../config.js'),
    Project = require('../../../server/models/project'),
    Scale = require('../../../server/models/scale'),
    User = require('../../../server/models/user'),
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
                            model: 'ScaleLine',
                            scale: scale.id,
                            action: 'create',
                            values: {
                                isActive: true,
                                title: 'Test scale line',
                                values: [1.0]
                            }
                        },
                        {
                            model: 'ScaleLine',
                            scale: scale.id,
                            action: 'create',
                            values: {
                                isActive: false,
                                title: 'Test scale line 2',
                                values: [1.0, 2.0]
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
                    ScaleLine.findById(response.results[0].id, function(err, refScaleLine) {
                        should.not.exists(err);
                        _.difference(refScaleLine.values, [1.0]).should.have.length(0);
                        Scale.findById(scale.id).populate('lines').exec(function(err, refScale) {
                            refScale.lines.should.have.length(2);
                            refScale.lines[0].title.should.equal(refScaleLine.title);
                            refScale.lines[1].title.should.equal('Test scale line 2');

                            modificationLot.modifications = [
                                {
                                    model: 'ScaleLine',
                                    scale: scale.id,
                                    action: 'create',
                                    insertAfter: refScaleLine.id,
                                    values: {
                                        title: 'Test scale insert after',
                                        values: [2.0, 3.0]
                                    }
                                }
                            ];

                            Project.applyModifications(modificationLot, function(err, response) {
                                should.not.exists(err);
                                Scale.findById(scale.id).populate('lines').exec(function(err, refScale) {
                                    refScale.lines.should.have.length(3);
                                    refScale.lines[0].title.should.equal('Test scale line');
                                    refScale.lines[1].title.should.equal('Test scale insert after');
                                    refScale.lines[2].title.should.equal('Test scale line 2');
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
                ScaleLine.create({ scale: scale.id, title: 'Simple' }, function(err, scaleLine) {
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
                                newValue: true
                            },
                            {
                                model: 'ScaleLine',
                                id: scaleLine.id,
                                action: 'update',
                                property: 'values',
                                newValue: [1.0, 2.0]
                            },
                            {
                                model: 'ScaleLine',
                                id: scaleLine.id,
                                action: 'update',
                                property: 'values',
                                newValue: [1.5, 2.0],
                                oldValue: [1.0, 2.0]
                            },
                            {
                                model: 'ScaleLine',
                                id: scaleLine.id,
                                action: 'update',
                                property: 'values.Developer',
                                newValue: [1.0, 2.5],
                                oldValue: [1.0, 2.0]
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
                            _.difference(refScale.values, [1.5, 2.0]).should.have.length(0);
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
                            model: 'ScaleLine',
                            scale: scale.id,
                            action: 'create',
                            values: {
                                isActive: true,
                                title: 'Test scale line'
                            }
                        },
                        {
                            model: 'ScaleLine',
                            scale: scale.id,
                            action: 'create',
                            values: {
                                isActive: false,
                                title: 'Test scale line 2'
                            }
                        }
                    ]
                };
                Project.applyModifications(modificationLot, function(err, response) {
                    should.not.exists(err);
                    var scaleLineIdToDelete = response.results[1].id;
                    modificationLot.modifications = [
                        {
                            model: 'ScaleLine',
                            action: 'delete',
                            id: scaleLineIdToDelete
                        }
                    ];
                    Project.applyModifications(modificationLot, function(err, response) {
                        should.not.exists(err);
                        response.results.should.have.length(1);
                        response.results[0].status.should.equal('success');
                        Scale.findById(scale.id).populate('lines').exec(function(err, refScale) {
                            refScale.lines.should.have.length(1);
                            ScaleLine.findById(scaleLineIdToDelete, function(err, refScaleLine) {
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

    it("should not serialize internal properties", function() {
        var scaleLine = new ScaleLine({ title: "Scale title"});
        var scaleLineObj = scaleLine.toObject();
        should.not.exists(scaleLineObj._id);
        should.not.exists(scaleLineObj.__v);
        should.not.exists(scaleLineObj.scale);
    });
});