var should = require('should'),
    mongoose = require('mongoose'),
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
                    EstimationLine.findById(line.id, function(err, refLine) {
                        should.not.exists(err);
                        refLine.isActive.should.be.ok;
                        refLine.title.should.equal('Here is the last title');
                        done();
                    });
                });
            });
        });
    })
});