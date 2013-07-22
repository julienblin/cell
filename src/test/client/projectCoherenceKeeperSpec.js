/**
 * Specifications for the project coherence keeper
 */

var should = require('should'),
    _ = require('underscore'),
    factory = require('../../server/factory'),
    ProjectCoherenceKeeper = require('../../client/javascripts/projectCoherenceKeeper').ProjectCoherenceKeeper;

describe('ProjectCoherenceKeeper', function(){
    "use strict";

    var _keeper = new ProjectCoherenceKeeper();

    it('should nullify ProfileProject.profilePrice when ProfilePrice is deleted', function() {
        var profilePrice1 = factory.make('profilePrice').toObject();
        var profilePrice2 = factory.make('profilePrice').toObject();

        var profileProject1 = factory.make('profileProject', { profilePrice: profilePrice1.id });
        var profileProject2 = factory.make('profileProject', { profilePrice: profilePrice2.id });

        var project = factory.make('project').toObject();
        project.profilePrices = [ profilePrice2 ];
        project.profileProjects = [ profileProject1, profileProject2 ];

        var modifications = [
            {
                model: 'ProfilePrice',
                id: profilePrice1.id,
                action: 'delete',
                localInfo: {
                    alreadyApplied: true,
                    target: profilePrice1,
                    position: 0
                }
            }
        ];

        _keeper.maintainCoherence(modifications, project);

        modifications.should.have.lengthOf(2);
        modifications[1].model.should.equal('ProfileProject');
        modifications[1].id.should.equal(profileProject1.id);
        modifications[1].action.should.equal('update');
        modifications[1].values.profilePrice[0].should.equal(profilePrice1.id);
        should.not.exists(modifications[1].values.profilePrice[1]);
    });

    it('should nullify EstimationLine.complexity when ScaleLine is deleted', function() {
        var scaleLine1 = factory.make('scaleLine').toObject();
        var scaleLine2 = factory.make('scaleLine').toObject();
        var scale = factory.make('scale');
        scale.lines = [ scaleLine2 ];

        var estimationLine1 = factory.make('estimationLine', { scale: scale.id, complexity: scaleLine1.id });
        var estimationLine2 = factory.make('estimationLine', { scale: scale.id, complexity: scaleLine2.id });

        var project = factory.make('project').toObject();
        project.scales = [ scale ];
        project.estimationLines = [ estimationLine1, estimationLine2 ];

        var modifications = [
            {
                model: 'ScaleLine',
                id: scaleLine1.id,
                action: 'delete',
                localInfo: {
                    alreadyApplied: true,
                    target: scaleLine1,
                    position: 0
                }
            }
        ];

        _keeper.maintainCoherence(modifications, project);

        modifications.should.have.lengthOf(2);
        modifications[1].model.should.equal('EstimationLine');
        modifications[1].id.should.equal(estimationLine1.id);
        modifications[1].action.should.equal('update');
        modifications[1].values.complexity[0].should.equal(scaleLine1.id);
        should.not.exists(modifications[1].values.complexity[1]);
    });

    it('should nullify EstimationLine.scale and EstimationLine.complexity when ScaleLine is deleted', function() {
        var scaleLine1 = factory.make('scaleLine').toObject();
        var scaleLine2 = factory.make('scaleLine').toObject();
        var scale1 = factory.make('scale').toObject();
        scale1.lines = [ scaleLine1, scaleLine2 ];
        var scale2 = factory.make('scale').toObject();

        var estimationLine1 = factory.make('estimationLine', { scale: scale1.id, complexity: scaleLine1.id });
        var estimationLine2 = factory.make('estimationLine', { scale: scale2.id, complexity: scaleLine2.id });

        var project = factory.make('project').toObject();
        project.scales = [ scale2 ];
        project.estimationLines = [ estimationLine1, estimationLine2 ];

        var modifications = [
            {
                model: 'Scale',
                id: scale1.id,
                action: 'delete',
                localInfo: {
                    alreadyApplied: true,
                    target: scale1,
                    position: 0
                }
            }
        ];

        _keeper.maintainCoherence(modifications, project);

        modifications.should.have.lengthOf(2);
        modifications[1].model.should.equal('EstimationLine');
        modifications[1].id.should.equal(estimationLine1.id);
        modifications[1].action.should.equal('update');
        modifications[1].values.scale[0].should.equal(scale1.id);
        should.not.exists(modifications[1].values.scale[1]);
        modifications[1].values.complexity[0].should.equal(scaleLine1.id);
        should.not.exists(modifications[1].values.complexity[1]);
    });

    it('should nullify EstimationLine.complexity when Scale is changed and no equivalent complexity is found', function() {
        var scaleLine1 = factory.make('scaleLine').toObject();
        var scaleLine2 = factory.make('scaleLine').toObject();
        var scale1 = factory.make('scale').toObject();
        scale1.lines = [ scaleLine1, scaleLine2 ];
        var scale2 = factory.make('scale').toObject();

        var estimationLine1 = factory.make('estimationLine', { scale: scale1.id, complexity: scaleLine1.id });
        var estimationLine2 = factory.make('estimationLine', { scale: scale2.id });

        var project = factory.make('project').toObject();
        project.scales = [ scale1, scale2 ];
        project.estimationLines = [ estimationLine1, estimationLine2 ];

        var modifications = [
            {
                model: 'EstimationLine',
                id: estimationLine1.id,
                action: 'update',
                values: {
                    scale: [estimationLine1.scale, scale2.id]
                },
                localInfo: {
                    alreadyApplied: true,
                    target: estimationLine1
                }
            }
        ];

        _keeper.maintainCoherence(modifications, project);

        modifications.should.have.lengthOf(2);
        modifications[1].model.should.equal('EstimationLine');
        modifications[1].id.should.equal(estimationLine1.id);
        modifications[1].action.should.equal('update');
        modifications[1].values.complexity[0].should.equal(scaleLine1.id);
        should.not.exists(modifications[1].values.complexity[1]);
    });

    it('should set new EstimationLine.complexity when Scale is changed and equivalent complexity is found', function() {
        var scaleLine1 = factory.make('scaleLine').toObject();
        var scaleLine2 = factory.make('scaleLine').toObject();
        var scale1 = factory.make('scale').toObject();
        scale1.lines = [ scaleLine1, scaleLine2 ];
        var scaleLine3Eq1 = factory.make('scaleLine', { complexity: scaleLine1.complexity }).toObject();
        var scale2 = factory.make('scale').toObject();
        scale2.lines = [ scaleLine3Eq1 ];

        var estimationLine1 = factory.make('estimationLine', { scale: scale1.id, complexity: scaleLine1.id });
        var estimationLine2 = factory.make('estimationLine', { scale: scale2.id });

        var project = factory.make('project').toObject();
        project.scales = [ scale1, scale2 ];
        project.estimationLines = [ estimationLine1, estimationLine2 ];

        var modifications = [
            {
                model: 'EstimationLine',
                id: estimationLine1.id,
                action: 'update',
                values: {
                    scale: [estimationLine1.scale, scale2.id]
                },
                localInfo: {
                    alreadyApplied: true,
                    target: estimationLine1
                }
            }
        ];

        _keeper.maintainCoherence(modifications, project);

        modifications.should.have.lengthOf(2);
        modifications[1].model.should.equal('EstimationLine');
        modifications[1].id.should.equal(estimationLine1.id);
        modifications[1].action.should.equal('update');
        modifications[1].values.complexity[0].should.equal(scaleLine1.id);
        modifications[1].values.complexity[1].should.equal(scaleLine3Eq1.id);
    });

    it('should group create messages with the same local target', function() {
        var estimationLine1 = factory.make('estimationLine').toObject();
        var estimationLine2 = factory.make('estimationLine').toObject();
        var modifications = [
            {
                model: 'EstimationLine',
                action: 'create',
                values: {
                    isActive: true,
                    title: 'some title'
                },
                localInfo: {
                    alreadyApplied: true,
                    target: estimationLine1
                }
            },
            {
                model: 'EstimationLine',
                action: 'create',
                values: {
                    scale: 'someId'
                },
                localInfo: {
                    alreadyApplied: true,
                    target: estimationLine1
                }
            },
            {
                model: 'EstimationLine',
                action: 'create',
                values: {
                    title: 'some title 2'
                },
                localInfo: {
                    alreadyApplied: true,
                    target: estimationLine2
                }
            },
            {
                model: 'EstimationLine',
                action: 'create',
                values: {
                    title: 'some title 3'
                }
            }
        ];

        var project = factory.make('project').toObject();
        project.estimationLines = [ estimationLine1, estimationLine2 ];

        _keeper.maintainCoherence(modifications, project);

        modifications.should.have.lengthOf(3);
        modifications[0].values.isActive.should.equal(true);
        modifications[0].values.title.should.equal('some title');
        modifications[0].values.scale.should.equal('someId');
        modifications[1].values.title.should.equal('some title 2');
        modifications[2].values.title.should.equal('some title 3');
    });
});
