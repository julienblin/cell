/**
 * Specifications for the project calculator
 */

var should = require('should'),
    _ = require('underscore'),
    factory = require('../../server/factory'),
    ProjectCalculator = require('../../client/javascripts/projectCalculator').ProjectCalculator;

describe('ProjectCalculator', function(){
    "use strict";

    var _calc = new ProjectCalculator();

    var _makeProfile = function() {
        return factory.make('profile', {
            percentageJunior: arguments[0],
            priceJunior: arguments[1],
            percentageIntermediary: arguments[2],
            priceIntermediary: arguments[3],
            percentageSenior: arguments[4],
            priceSenior: arguments[5]
        }).toObject();
    };

    var _makeProfilePrice = function() {
        return factory.make('profilePrice', {
            priceJunior: arguments[0],
            priceIntermediary: arguments[1],
            priceSenior: arguments[2]
        }).toObject();
    };

    var _makeProfileProject = function(profilePrice) {
        return factory.make('profileProject', {
            profilePrice: profilePrice ? profilePrice.id : undefined,
            percentageJunior: arguments[1],
            percentageIntermediary: arguments[2],
            percentageSenior: arguments[3]
        }).toObject();
    };

    var _makeScaleColumn = function(profile, isBaseline) {
        return factory.make('scaleColumn', { profile: profile ? profile.id : undefined, isBaseline: isBaseline }).toObject();
    };

    var _makeScaleLine = function(columns, values) {
        var line = factory.make('scaleLine', { values: [] }).toObject();
        _.each(columns, function(column, index) {
            line.values[column.id] = values[index];
        });
        return line;
    };

    var _makeLine = function() {
        if(arguments.length === 0)
            return factory.make('estimationLine', {}).toObject();

        if(arguments.length === 1)
            return factory.make('estimationLine', { lineType: arguments[0] }).toObject();

        return factory.make('estimationLine', {
            scale: arguments[0].id,
            complexity: arguments[1].id,
            coefficient: arguments.length === 3 ? arguments[2] : undefined
        }).toObject();
    };

    var _profilePriceDeveloper, _profilePriceArchitect, _profilePriceAnalyst, _profilePricePM, _profilePriceNoPrice;

    var _profileProjectDeveloperValid, _profileProjectArchitectValid, _profileProjectAnalystValid, _profileProjectPMValid,
        _profileProjectSpecialistDisabled, _profileProjectNoPrice,
        _profileProjectInvalid1, _profileProjectInvalid2;

    var _profileDeveloperValid, _profileArchitectValid, _profileAnalystValid, _profilePMValid,
        _profileSpecialistDisabled,
        _profileInvalid1, _profileInvalid2, _profileInvalid3;

    var _scaleSharepoint;
    var _scaleColumnSharepointDeveloper, _scaleColumnSharepointAnalyst, _scaleColumnSharepointArchitect, _scaleColumnSharepointPM;
    var _scaleLineSharepointSimple, _scaleLineSharepointMedium, _scaleLineSharepointComplex;

    var _scaleJava;
    var _scaleColumnJavaDeveloper, _scaleColumnJavaSpecialist, _scaleColumnJavaPM, _scaleColumnJavaNoProfile;
    var _scaleLineJavaSimple, _scaleLineJavaMediumDisabled, _scaleLineJavaComplex;

    var _lineHeading1Doc, _lineHeading2DocDoc, _lineHeading2DocWorkflows,
        _lineDocHomepage, _lineDocContentPages, _lineDocUserWorkflow;

    var _lineHeading1Web, _lineHeading2WebFront, _lineHeading2WebBack,
        _lineWebFrontUIDesign, _lineWebFrontMainPage, _lineWebBackUserMgtNoScale, _lineWebBackCompute, _lineWebBackDisabled;

    var _project;

    // We rebuild the sample project for every test using the previous references.
    beforeEach(function() {
        // Profile prices
        _profilePriceDeveloper = _makeProfilePrice(450, 650, 850);
        _profilePriceArchitect = _makeProfilePrice(800, 1000, 1200);
        _profilePriceAnalyst = _makeProfilePrice(undefined, 300, undefined);
        _profilePricePM = _makeProfilePrice(undefined, undefined, 1500);
        _profilePriceNoPrice = _makeProfilePrice(undefined, undefined, undefined);

        // Profile projects
        _profileProjectDeveloperValid = _makeProfileProject(_profilePriceDeveloper, 25, 50, 25); // average$: 650
        _profileProjectArchitectValid = _makeProfileProject(_profilePriceArchitect, 25, 50, 25); // average$: 1000
        _profileProjectAnalystValid = _makeProfileProject(_profilePriceAnalyst, undefined, 100, undefined); // average$: 300
        _profileProjectSpecialistDisabled = _makeProfileProject(_profilePriceArchitect, 25, 50, 25); // average$: 1000
        _profileProjectSpecialistDisabled.isActive = false;
        _profileProjectPMValid = _makeProfileProject(_profilePricePM, undefined, undefined, 100); // average$: 1500
        _profileProjectInvalid1 = _makeProfileProject(_profilePriceDeveloper, 25, 100, 25);
        _profileProjectNoPrice = _makeProfileProject(_profilePriceNoPrice, undefined, 100, undefined);
        _profileProjectInvalid2 = _makeProfileProject();

        // Profiles
        _profileDeveloperValid = _makeProfile(25, 450, 50, 650, 25, 850); // average$: 650
        _profileArchitectValid = _makeProfile(25, 800, 50, 1000, 25, 1200); // average$: 1000
        _profileAnalystValid = _makeProfile(undefined, undefined, 100, 300, undefined, undefined); // average$: 300
        _profileSpecialistDisabled = _makeProfile(25, 800, 50, 1000, 25, 1200); // average$: 1000
        _profileSpecialistDisabled.isActive = false;
        _profilePMValid = _makeProfile(undefined, undefined, undefined, undefined, 100, 1500); // average$: 1500
        _profileInvalid1 = _makeProfile(25, 450, 100, 650, 25, 850);
        _profileInvalid2 = _makeProfile(undefined, undefined, 100, undefined, undefined, undefined);
        _profileInvalid3 = _makeProfile();

        // Scales - Sharepoint
        _scaleSharepoint = factory.make('scale').toObject();
        _scaleColumnSharepointDeveloper = _makeScaleColumn(_profileDeveloperValid, true);
        _scaleColumnSharepointAnalyst = _makeScaleColumn(_profileAnalystValid, true);
        _scaleColumnSharepointArchitect = _makeScaleColumn(_profileArchitectValid, false);
        _scaleColumnSharepointPM =_makeScaleColumn(_profilePMValid, false);
        _scaleSharepoint.columns = [_scaleColumnSharepointDeveloper, _scaleColumnSharepointAnalyst, _scaleColumnSharepointArchitect, _scaleColumnSharepointPM];

        _scaleLineSharepointSimple = _makeScaleLine(_scaleSharepoint.columns, [1, 0.5, 10, 20]); // totalUT: 1.95, total$: 1,400
        _scaleLineSharepointMedium = _makeScaleLine(_scaleSharepoint.columns, [5, 3, 10, 20]); // totalUT: 10.4, total$: 7,350
        _scaleLineSharepointComplex = _makeScaleLine(_scaleSharepoint.columns, [10, 5, 15, 20]); // totalUT: 20.25, total$: 14,750
        _scaleSharepoint.lines = [_scaleLineSharepointSimple, _scaleLineSharepointMedium, _scaleLineSharepointComplex];

        // Scales - Java
        _scaleJava = factory.make('scale').toObject();
        _scaleColumnJavaDeveloper = _makeScaleColumn(_profileDeveloperValid, true);
        _scaleColumnJavaSpecialist = _makeScaleColumn(_profileSpecialistDisabled, true);
        _scaleColumnJavaPM = _makeScaleColumn(_profilePMValid, false);
        _scaleColumnJavaNoProfile = _makeScaleColumn(undefined, true);
        _scaleJava.columns = [_scaleColumnJavaDeveloper, _scaleColumnJavaSpecialist, _scaleColumnJavaPM, _scaleColumnJavaNoProfile];

        _scaleLineJavaSimple = _makeScaleLine(_scaleJava.columns, [5, 2, 20, 10]); // totalUT: 6, total$: 4,750
        _scaleLineJavaMediumDisabled = _makeScaleLine(_scaleJava.columns, [10, 3, 20, 10]); // totalUT: 12, total$: 9,500
        _scaleLineJavaMediumDisabled.isActive = false;
        _scaleLineJavaComplex = _makeScaleLine(_scaleJava.columns, [20, 20, 20, 10]); // totalUT: 24, total$: 19,000
        _scaleJava.lines = [_scaleLineJavaSimple, _scaleLineJavaMediumDisabled, _scaleLineJavaComplex];

        // Estimation lines
        _lineHeading1Doc = _makeLine('heading1');
        _lineHeading2DocDoc = _makeLine('heading2');
        _lineDocHomepage = _makeLine(_scaleSharepoint, _scaleLineSharepointMedium);
        _lineDocContentPages = _makeLine(_scaleSharepoint, _scaleLineSharepointSimple, 5);
        _lineHeading2DocWorkflows = _makeLine('heading2');
        _lineDocUserWorkflow = _makeLine(_scaleSharepoint, _scaleLineSharepointComplex);

        _lineHeading1Web = _makeLine('heading1');
        _lineHeading2WebFront = _makeLine('heading2');
        _lineWebFrontUIDesign = _makeLine(_scaleJava, _scaleLineJavaSimple, 10);
        _lineWebFrontMainPage = _makeLine(_scaleJava, _scaleLineJavaMediumDisabled);
        _lineHeading2WebBack = _makeLine('heading2');
        _lineWebBackUserMgtNoScale = _makeLine();
        _lineWebBackCompute = _makeLine(_scaleJava, _scaleLineJavaComplex);
        _lineWebBackDisabled = _makeLine(_scaleJava, _scaleLineJavaComplex);
        _lineWebBackDisabled.isActive = false;

        // Project
        _project = factory.make('project').toObject();
        _project.profilePrices = [ _profilePriceDeveloper, _profilePriceAnalyst, _profilePriceArchitect, _profilePricePM, _profilePriceNoPrice ];
        _project.profileProjects = [_profileProjectDeveloperValid, _profileProjectArchitectValid, _profileProjectAnalystValid, _profileProjectPMValid,
            _profileProjectSpecialistDisabled,
            _profileProjectInvalid1, _profileProjectNoPrice, _profileProjectInvalid2];
        _project.profiles = [_profileDeveloperValid, _profileArchitectValid, _profileAnalystValid, _profilePMValid,
                             _profileSpecialistDisabled,
                             _profileInvalid1, _profileInvalid2, _profileInvalid3];
        _project.scales = [_scaleSharepoint, _scaleJava];
        _project.estimationLines = [
            _lineHeading1Doc,
                _lineHeading2DocDoc,
                    _lineDocHomepage,
                    _lineDocContentPages,
                _lineHeading2DocWorkflows,
                    _lineDocUserWorkflow,

            _lineHeading1Web,
                _lineHeading2WebFront,
                    _lineWebFrontUIDesign,
                    _lineWebFrontMainPage,
                _lineHeading2WebBack,
                    _lineWebBackUserMgtNoScale,
                    _lineWebBackCompute,
                    _lineWebBackDisabled
        ];
    });

    it('should process profile prices', function() {
        _calc.performCalculations(_project);

        _project.nav.profilePrices[_profilePriceDeveloper.id].should.equal(_profilePriceDeveloper);
        _project.nav.profilePrices[_profilePriceNoPrice.id].should.equal(_profilePriceNoPrice);
    });

    it('should process profile projects', function() {
        _calc.performCalculations(_project);

        _project.nav.profileProjects[_profileProjectDeveloperValid.id].should.equal(_profileProjectDeveloperValid);
        _project.nav.profileProjects[_profileProjectInvalid1.id].should.equal(_profileProjectInvalid1);

        _profileProjectDeveloperValid.computed.profileAveragePrice.should.equal(650);
        _profileProjectAnalystValid.computed.profileAveragePrice.should.equal(300);
        _profileProjectNoPrice.computed.profileAveragePrice.should.equal(0);
        should.not.exists(_profileProjectInvalid1.computed.profileAveragePrice);
        should.not.exists(_profileProjectInvalid2.computed.profileAveragePrice);

        _profileProjectDeveloperValid.computed.profilePercentPriceJunior.should.equal(((25*450) / 65000) * 100);
        _profileProjectAnalystValid.computed.profilePercentPriceJunior.should.equal(0);
        _profileProjectNoPrice.computed.profilePercentPriceJunior.should.equal(0);
        should.not.exists(_profileProjectInvalid1.computed.profilePercentPriceJunior);
        should.not.exists(_profileProjectInvalid2.computed.profilePercentPriceJunior);

        _profileProjectDeveloperValid.computed.profilePercentPriceIntermediary.should.equal(((50*650) / 65000) * 100);
        _profileProjectAnalystValid.computed.profilePercentPriceIntermediary.should.equal(100);
        _profileProjectNoPrice.computed.profilePercentPriceIntermediary.should.equal(0);
        should.not.exists(_profileProjectInvalid1.computed.profilePercentPriceIntermediary);
        should.not.exists(_profileProjectInvalid2.computed.profilePercentPriceIntermediary);

        _profileProjectDeveloperValid.computed.profilePercentPriceSenior.should.equal(((25*850) / 65000) * 100);
        _profileProjectAnalystValid.computed.profilePercentPriceSenior.should.equal(0);
        _profileProjectNoPrice.computed.profilePercentPriceSenior.should.equal(0);
        should.not.exists(_profileProjectInvalid1.computed.profilePercentPriceSenior);
        should.not.exists(_profileProjectInvalid2.computed.profilePercentPriceSenior);
    });

    it('should process scales', function() {
        _calc.performCalculations(_project);

        // Nav
        _project.nav.scales[_scaleSharepoint.id].should.equal(_scaleSharepoint);
        _project.nav.scales[_scaleJava.id].should.equal(_scaleJava);
        _project.nav.scaleColumns[_scaleColumnSharepointAnalyst.id].should.equal(_scaleColumnSharepointAnalyst);
        _project.nav.scaleColumns[_scaleColumnJavaPM.id].should.equal(_scaleColumnJavaPM);
        _project.nav.scaleLines[_scaleLineSharepointComplex.id].should.equal(_scaleLineSharepointComplex);
        _project.nav.scaleLines[_scaleLineJavaMediumDisabled.id].should.equal(_scaleLineJavaMediumDisabled);

        // Sharepoint
        _scaleLineSharepointSimple.computed.lineTotalUT.should.equal(1.95);
        _scaleLineSharepointSimple.computed.lineTotalPrice.should.equal(1400);
        _scaleLineSharepointSimple.computed.profiles[_profileDeveloperValid.id].lineTotalUT.should.equal(1);
        _scaleLineSharepointSimple.computed.profiles[_profileDeveloperValid.id].lineTotalPrice.should.equal(650);
        _scaleLineSharepointSimple.computed.profiles[_profileAnalystValid.id].lineTotalUT.should.equal(0.5);
        _scaleLineSharepointSimple.computed.profiles[_profileAnalystValid.id].lineTotalPrice.should.equal(150);
        _scaleLineSharepointSimple.computed.profiles[_profileArchitectValid.id].lineTotalUT.should.equal(0.15);
        _scaleLineSharepointSimple.computed.profiles[_profileArchitectValid.id].lineTotalPrice.should.equal(150);
        _scaleLineSharepointSimple.computed.profiles[_profilePMValid.id].lineTotalUT.should.equal(0.3);
        _scaleLineSharepointSimple.computed.profiles[_profilePMValid.id].lineTotalPrice.should.equal(450);

        _scaleLineSharepointMedium.computed.lineTotalUT.should.equal(10.4);
        _scaleLineSharepointMedium.computed.lineTotalPrice.should.equal(7350);
        _scaleLineSharepointMedium.computed.profiles[_profileDeveloperValid.id].lineTotalUT.should.equal(5);
        _scaleLineSharepointMedium.computed.profiles[_profileDeveloperValid.id].lineTotalPrice.should.equal(3250);
        _scaleLineSharepointMedium.computed.profiles[_profileAnalystValid.id].lineTotalUT.should.equal(3);
        _scaleLineSharepointMedium.computed.profiles[_profileAnalystValid.id].lineTotalPrice.should.equal(900);
        _scaleLineSharepointMedium.computed.profiles[_profileArchitectValid.id].lineTotalUT.should.equal(0.8);
        _scaleLineSharepointMedium.computed.profiles[_profileArchitectValid.id].lineTotalPrice.should.equal(800);
        _scaleLineSharepointMedium.computed.profiles[_profilePMValid.id].lineTotalUT.should.equal(1.6);
        _scaleLineSharepointMedium.computed.profiles[_profilePMValid.id].lineTotalPrice.should.equal(2400);

        _scaleLineSharepointComplex.computed.lineTotalUT.should.equal(20.25);
        _scaleLineSharepointComplex.computed.lineTotalPrice.should.equal(14750);
        _scaleLineSharepointComplex.computed.profiles[_profileDeveloperValid.id].lineTotalUT.should.equal(10);
        _scaleLineSharepointComplex.computed.profiles[_profileDeveloperValid.id].lineTotalPrice.should.equal(6500);
        _scaleLineSharepointComplex.computed.profiles[_profileAnalystValid.id].lineTotalUT.should.equal(5);
        _scaleLineSharepointComplex.computed.profiles[_profileAnalystValid.id].lineTotalPrice.should.equal(1500);
        _scaleLineSharepointComplex.computed.profiles[_profileArchitectValid.id].lineTotalUT.should.equal(2.25);
        _scaleLineSharepointComplex.computed.profiles[_profileArchitectValid.id].lineTotalPrice.should.equal(2250);
        _scaleLineSharepointComplex.computed.profiles[_profilePMValid.id].lineTotalUT.should.equal(3);
        _scaleLineSharepointComplex.computed.profiles[_profilePMValid.id].lineTotalPrice.should.equal(4500);

        // Java
        _scaleLineJavaSimple.computed.lineTotalUT.should.equal(6);
        _scaleLineJavaSimple.computed.lineTotalPrice.should.equal(4750);
        _scaleLineJavaSimple.computed.profiles[_profileDeveloperValid.id].lineTotalUT.should.equal(5);
        _scaleLineJavaSimple.computed.profiles[_profileDeveloperValid.id].lineTotalPrice.should.equal(3250);
        _scaleLineJavaSimple.computed.profiles[_profilePMValid.id].lineTotalUT.should.equal(1);
        _scaleLineJavaSimple.computed.profiles[_profilePMValid.id].lineTotalPrice.should.equal(1500);
        should.not.exists(_scaleLineJavaSimple.computed.profiles[_profileSpecialistDisabled.id]);

        _scaleLineJavaMediumDisabled.computed.lineTotalUT.should.equal(12);
        _scaleLineJavaMediumDisabled.computed.lineTotalPrice.should.equal(9500);
        _scaleLineJavaMediumDisabled.computed.profiles[_profileDeveloperValid.id].lineTotalUT.should.equal(10);
        _scaleLineJavaMediumDisabled.computed.profiles[_profileDeveloperValid.id].lineTotalPrice.should.equal(6500);
        _scaleLineJavaMediumDisabled.computed.profiles[_profilePMValid.id].lineTotalUT.should.equal(2);
        _scaleLineJavaMediumDisabled.computed.profiles[_profilePMValid.id].lineTotalPrice.should.equal(3000);
        should.not.exists(_scaleLineJavaMediumDisabled.computed.profiles[_profileSpecialistDisabled.id]);

        _scaleLineJavaComplex.computed.lineTotalUT.should.equal(24);
        _scaleLineJavaComplex.computed.lineTotalPrice.should.equal(19000);
        _scaleLineJavaComplex.computed.profiles[_profileDeveloperValid.id].lineTotalUT.should.equal(20);
        _scaleLineJavaComplex.computed.profiles[_profileDeveloperValid.id].lineTotalPrice.should.equal(13000);
        _scaleLineJavaComplex.computed.profiles[_profilePMValid.id].lineTotalUT.should.equal(4);
        _scaleLineJavaComplex.computed.profiles[_profilePMValid.id].lineTotalPrice.should.equal(6000);
        should.not.exists(_scaleLineJavaComplex.computed.profiles[_profileSpecialistDisabled.id]);
    });

    it('should process estimation lines', function() {
        _calc.performCalculations(_project);

        _lineDocHomepage.computed.lineTotalUT.should.equal(10.4);
        _lineDocHomepage.computed.lineTotalPrice.should.equal(7350);
        _lineDocHomepage.computed.profiles[_profileAnalystValid.id].lineTotalUT.should.equal(3);
        _lineDocHomepage.computed.profiles[_profileAnalystValid.id].lineTotalPrice.should.equal(900);

        _lineDocContentPages.computed.lineTotalUT.should.equal(9.75);
        _lineDocContentPages.computed.lineTotalPrice.should.equal(7000);
        _lineDocContentPages.computed.profiles[_profilePMValid.id].lineTotalUT.should.equal(1.5);
        _lineDocContentPages.computed.profiles[_profilePMValid.id].lineTotalPrice.should.equal(2250);

        should.not.exists(_lineWebFrontMainPage.computed.lineTotalUT);
        should.not.exists(_lineWebFrontMainPage.computed.lineTotalPrice);
        should.exists(_lineWebFrontMainPage.computed.profiles);

        should.not.exists(_lineWebBackUserMgtNoScale.computed.lineTotalUT);
        should.not.exists(_lineWebBackUserMgtNoScale.computed.lineTotalPrice);
        should.exists(_lineWebBackUserMgtNoScale.computed.profiles);

        _lineWebBackDisabled.computed.lineTotalUT.should.equal(24);
        _lineWebBackDisabled.computed.lineTotalPrice.should.equal(19000);
        _lineWebBackDisabled.computed.profiles[_profileDeveloperValid.id].lineTotalPrice.should.equal(13000);

        _lineHeading2DocWorkflows.computed.lineTotalUT.should.equal(20.25);
        _lineHeading2DocWorkflows.computed.lineTotalPrice.should.equal(14750);
        _lineHeading2DocWorkflows.computed.profiles[_profileArchitectValid.id].lineTotalUT.should.equal(2.25);
        _lineHeading2DocWorkflows.computed.profiles[_profileArchitectValid.id].lineTotalPrice.should.equal(2250);

        _lineHeading2DocDoc.computed.lineTotalUT.should.equal(20.15);
        _lineHeading2DocDoc.computed.lineTotalPrice.should.equal(14350);
        _lineHeading2DocDoc.computed.profiles[_profileDeveloperValid.id].lineTotalUT.should.equal(10);
        _lineHeading2DocDoc.computed.profiles[_profileDeveloperValid.id].lineTotalPrice.should.equal(6500);

        _lineHeading1Doc.computed.lineTotalUT.should.equal(40.4);
        _lineHeading1Doc.computed.lineTotalPrice.should.equal(29100);
        _lineHeading1Doc.computed.profiles[_profileDeveloperValid.id].lineTotalUT.should.equal(20);
        _lineHeading1Doc.computed.profiles[_profileDeveloperValid.id].lineTotalPrice.should.equal(13000);

        _lineHeading2WebBack.computed.lineTotalUT.should.equal(24);
        _lineHeading2WebBack.computed.lineTotalPrice.should.equal(19000);
        _lineHeading2WebBack.computed.profiles[_profileDeveloperValid.id].lineTotalUT.should.equal(20);
        _lineHeading2WebBack.computed.profiles[_profileDeveloperValid.id].lineTotalPrice.should.equal(13000);

        _lineHeading2WebFront.computed.lineTotalUT.should.equal(60);
        _lineHeading2WebFront.computed.lineTotalPrice.should.equal(47500);
        _lineHeading2WebFront.computed.profiles[_profilePMValid.id].lineTotalUT.should.equal(10);
        _lineHeading2WebFront.computed.profiles[_profilePMValid.id].lineTotalPrice.should.equal(15000);

        _lineHeading1Web.computed.lineTotalUT.should.equal(84);
        _lineHeading1Web.computed.lineTotalPrice.should.equal(66500);
        _lineHeading1Web.computed.profiles[_profileDeveloperValid.id].lineTotalUT.should.equal(70);
        _lineHeading1Web.computed.profiles[_profileDeveloperValid.id].lineTotalPrice.should.equal(45500);

        var headingTotal = _project.estimationLines[0];
        headingTotal.lineType.should.equal('headingTotal');
        headingTotal.computed.lineTotalUT.should.equal(124.4);
        headingTotal.computed.lineTotalPrice.should.equal(95600);
        headingTotal.computed.profiles[_profileDeveloperValid.id].lineTotalUT.should.equal(90);
        headingTotal.computed.profiles[_profileDeveloperValid.id].lineTotalPrice.should.equal(58500);
    });

    it('should create and reposition grand total', function() {
        var numberOfEstimationLines = _project.estimationLines.length;
        _calc.performCalculations(_project);
        _project.estimationLines.length.should.equal(numberOfEstimationLines + 1);
        _calc.performCalculations(_project);
        _project.estimationLines.length.should.equal(numberOfEstimationLines + 1);
        var headingLine = _project.estimationLines.splice(0, 1);
        _project.estimationLines.splice(3, 0, headingLine[0]);
        _calc.performCalculations(_project);
        _project.estimationLines.length.should.equal(numberOfEstimationLines + 1);
        _project.estimationLines[0].lineType.should.equal('headingTotal');
    });

    it('should report results on project', function() {
        _calc.performCalculations(_project);
        _project.computed.totalUT.should.equal(124.4);
        _project.computed.totalPrice.should.equal(95600);
        _project.computed.profiles[_profileDeveloperValid.id].totalUT.should.equal(90);
        _project.computed.profiles[_profileDeveloperValid.id].totalPrice.should.equal(58500);

        _project.computed.scaleLines[_scaleLineSharepointSimple.id].totalUT.should.equal(9.75);
        _project.computed.scaleLines[_scaleLineSharepointSimple.id].totalPrice.should.equal(7000);
        _project.computed.scaleLines[_scaleLineSharepointMedium.id].totalUT.should.equal(10.4);
        _project.computed.scaleLines[_scaleLineSharepointMedium.id].totalPrice.should.equal(7350);
        _project.computed.scaleLines[_scaleLineSharepointComplex.id].totalUT.should.equal(20.25);
        _project.computed.scaleLines[_scaleLineSharepointComplex.id].totalPrice.should.equal(14750);

        _project.computed.scales[_scaleSharepoint.id].totalUT.should.equal(40.4);
        _project.computed.scales[_scaleSharepoint.id].totalPrice.should.equal(29100);

        _project.computed.scales[_scaleJava.id].totalUT.should.equal(84);
        _project.computed.scales[_scaleJava.id].totalPrice.should.equal(66500);
    });
});
