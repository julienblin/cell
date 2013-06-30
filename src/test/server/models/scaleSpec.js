var should = require('should'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.ObjectId,
    async = require('async'),
    config = require('../../config.js'),
    Project = require('../../../server/models/project'),
    User = require('../../../server/models/user'),
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
        var user = new User();
        Project.create({ clientName: 'CGI', projectName: 'Cell' }, user, function(err, project) {
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
                            title: 'Test scale'
                        }
                    },
                    {
                        model: 'Scale',
                        action: 'create',
                        values: {
                            isActive: false,
                            title: 'Test scale 2'
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
                Scale.findById(response.results[0].id, function(err, refScale) {
                    should.not.exists(err);
                    refScale.title.should.equal('Test scale');
                    Project.findById(project.id).populate('scales').exec(function(err, refProject) {
                        refProject.scales.should.have.length(2);
                        refProject.scales[0].title.should.equal(refScale.title);
                        refProject.scales[1].title.should.equal('Test scale 2');

                        modificationLot.modifications = [
                            {
                                model: 'Scale',
                                action: 'create',
                                insertAfter: refScale.id,
                                values: {
                                    title: 'Test scale insert after'
                                }
                            }
                        ];

                        Project.applyModifications(modificationLot, function(err, response) {
                            should.not.exists(err);
                            Project.findById(project.id).populate('scales').exec(function(err, refProject) {
                                refProject.scales.should.have.length(3);
                                refProject.scales[0].title.should.equal('Test scale');
                                refProject.scales[1].title.should.equal('Test scale insert after');
                                refProject.scales[2].title.should.equal('Test scale 2');
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
            Scale.create({ project: project.id }, function(err, line) {
                should.not.exists(err);
                var modificationLot = {
                    projectId: project.id,
                    user: user,
                    modifications: [
                        {
                            model: 'Scale',
                            id: line.id,
                            action: 'update',
                            property: 'isActive',
                            newValue: true
                        },
                        {
                            model: 'Scale',
                            id: line.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the first title'
                        },
                        {
                            model: 'Scale',
                            id: line.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the last title',
                            oldValue: 'Here is the first title'
                        },
                        {
                            model: 'Scale',
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
                    Scale.findById(line.id, function(err, refScale) {
                        should.not.exists(err);
                        refScale.isActive.should.be.ok;
                        refScale.title.should.equal('Here is the last title');
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
                        model: 'Scale',
                        action: 'create',
                        values: {
                            isActive: true,
                            title: 'Test profile',
                            percentageSenior: 25
                        }
                    },
                    {
                        model: 'Scale',
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
                var profileIdToDelete = response.results[1].id;
                modificationLot.modifications = [
                    {
                        model: 'Scale',
                        action: 'delete',
                        id: profileIdToDelete
                    }
                ];
                Project.applyModifications(modificationLot, function(err, response) {
                    should.not.exists(err);
                    response.results.should.have.length(1);
                    response.results[0].status.should.equal('success');
                    Project.findById(project.id).populate('scales').exec(function(err, refProject) {
                        refProject.scales.should.have.length(1);
                        Scale.findById(profileIdToDelete, function(err, refScale) {
                            should.not.exists(err);
                            should.not.exists(refScale);
                            done();
                        });
                    });
                });
            });
        });
    });

    it("should not serialize internal properties", function() {
        var scale = new Scale({ title: "Scale title"});
        var scaleObj = scale.toObject();
        should.not.exists(scaleObj._id);
        should.not.exists(scaleObj.__v);
        should.not.exists(scaleObj.project);
    });
});