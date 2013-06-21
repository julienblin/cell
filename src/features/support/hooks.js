/**
 * Hooks for scenario that re-init the database and setup phantom.
 */

var mongoose = require('mongoose'),
    config = require('./config');

var hooks = function() {
    this.Around(function(runScenario) {
        var world = this;
        world.dropDatabase(function() {
            world.openBrowser();
            runScenario(function(callback) {
                world.closeBrowser();
                callback();
            });
        });
    });
};

module.exports = hooks;