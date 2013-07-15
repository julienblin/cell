/**
 * Specifications for snapshot model.
 */

"use strict";

var should = require('should'),
    mongoose = require('mongoose'),
    config = require('../../config.js'),
    factory = require('../../../server/factory'),
    Snapshot = require('../../../server/models/snapshot');

describe("Snapshots", function(){

    beforeEach(function(done){
        mongoose.connect(config.db.url, function() {
            mongoose.connection.db.dropDatabase(done);
        });
    });

    afterEach(function(done){
        mongoose.disconnect(done);
    });

    it("should save snapshots", function(done) {
        var project = factory.make('project').toObject();
        Snapshot.create({
            model: 'Project',
            ref: project.id,
            title: 'test snapshot',
            data: project
        }, function(err, snapshot) {
            Snapshot.findById(snapshot.id, function(err, refSnapshot) {
                should.not.exists(err);
                refSnapshot.data.clientName.should.equal(project.clientName);
                done();
            });
        });
    });
});