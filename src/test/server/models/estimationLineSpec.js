var should = require('should'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.ObjectId,
    async = require('async'),
    config = require('../../config.js'),
    Project = require('../../../server/models/project'),
    User = require('../../../server/models/user'),
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
        var user = new User();
        Project.create({ clientName: 'CGI', projectName: 'Cell' }, user, function(err, project) {
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
        var user = new User();
        Project.create({ clientName: 'CGI', projectName: 'Cell' }, user, function(err, project) {
            should.not.exists(err);
            EstimationLine.create({ project: project.id }, function(err, line) {
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
                            newValue: true
                        },
                        {
                            model: 'EstimationLine',
                            id: line.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the first title'
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
        var user = new User();
        Project.create({ clientName: 'CGI', projectName: 'Cell' }, user, function(err, project) {
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
                            title: 'Test el'
                        }
                    },
                    {
                        model: 'EstimationLine',
                        action: 'create',
                        values: {
                            isActive: false,
                            title: 'Test el'
                        }
                    }
                ]
            };
            Project.applyModifications(modificationLot, function(err, response) {
                should.not.exists(err);
                var elIdToDelete = response.results[1].id;
                modificationLot.modifications = [
                    {
                        model: 'EstimationLine',
                        action: 'delete',
                        id: elIdToDelete
                    }
                ];
                Project.applyModifications(modificationLot, function(err, response) {
                    should.not.exists(err);
                    response.results.should.have.length(1);
                    response.results[0].status.should.equal('success');
                    Project.findById(project.id).populate('estimationLines').exec(function(err, refProject) {
                        refProject.estimationLines.should.have.length(1);
                        EstimationLine.findById(elIdToDelete, function(err, refEstimationLine) {
                            should.not.exists(err);
                            should.not.exists(refEstimationLine);
                            done();
                        });
                    });
                });
            });
        });
    });

    it("should not serialize internal properties", function() {
        var el = new EstimationLine({ title: "Scale title"});
        var elObj = el.toObject();
        should.not.exists(elObj._id);
        should.not.exists(elObj.__v);
        should.not.exists(elObj.project);
    });
});