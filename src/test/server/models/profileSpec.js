var should = require('should'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.ObjectId,
    async = require('async'),
    config = require('../../config.js'),
    Project = require('../../../server/models/project'),
    User = require('../../../server/models/user'),
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
        var user = new User();
        Project.create({ clientName: 'CGI', projectName: 'Cell' }, user, function(err, project) {
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
                Profile.findById(response.results[0].id, function(err, refProfile) {
                    should.not.exists(err);
                    refProfile.percentageSenior.should.equal(25);
                    Project.findById(project.id).populate('profiles').exec(function(err, refProject) {
                        refProject.profiles.should.have.length(3);
                        refProject.profiles[1].title.should.equal(refProfile.title);
                        refProject.profiles[2].title.should.equal('Test profile 2');

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
                                refProject.profiles.should.have.length(4);
                                refProject.profiles[1].title.should.equal('Test profile');
                                refProject.profiles[2].title.should.equal('Test profile insert after');
                                refProject.profiles[3].title.should.equal('Test profile 2');
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
            Profile.create({ project: project.id }, function(err, line) {
                should.not.exists(err);
                var modificationLot = {
                    projectId: project.id,
                    user: user,
                    modifications: [
                        {
                            model: 'Profile',
                            id: line.id,
                            action: 'update',
                            property: 'isActive',
                            newValue: true
                        },
                        {
                            model: 'Profile',
                            id: line.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the first title'
                        },
                        {
                            model: 'Profile',
                            id: line.id,
                            action: 'update',
                            property: 'title',
                            newValue: 'Here is the last title',
                            oldValue: 'Here is the first title'
                        },
                        {
                            model: 'Profile',
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
                    Profile.findById(line.id, function(err, refProfile) {
                        should.not.exists(err);
                        refProfile.isActive.should.be.ok;
                        refProfile.title.should.equal('Here is the last title');
                        done();
                    });
                });
            });
        });
    })
});