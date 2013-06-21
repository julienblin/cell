/**
 * Shared steps for Cucumber.
 */

var User = require('../../server/models/user'),
    mongoose = require('mongoose'),
    async = require('async'),
    _ = require('underscore'),
    pages = require('./pages');

var sharedSteps = function() {
    this.World = require("../support/world").World;

    this.Given(/^an administrator named "([^"]*)"$/, function(username, callback) {
        var user = new User({ username: username, email: username + '@cell', password: username, isActive: true, isAdmin: true  });
        user.save(function(err) {
            if (err) return callback.fail(err);
            callback();
        });
    });

    this.Given(/^I am logged in as "([^"]*)"$/, function(username, callback) {
        var world = this;
        world.visit('/login', function() {
            if(!world.browser.success) return callback.fail(new Error('Unable to reach login page.'));

            world.browser.fill('username', username)
                         .fill('password', username)
                         .pressButton('Login', function() {
                    if(!world.browser.success) return callback.fail(new Error('Error while logging in.'));
                    callback();
                });
        });
    });

    this.Given(/^the following "([^"]*)" (entities|entity):$/, function(model, ignore, table, callback) {
        async.each(table.hashes(),
            function(definition, saved) {
                var Model = mongoose.model(model);
                var obj = new Model(definition);
                obj.save(saved);
            },
            function(err) {
                if (err) callback.fail(err);
                callback();
            });
    });

    this.When(/^I fill the following values:$/, function(table, callback) {
        var world = this;
        _.each(table.hashes(), function(element) {
            world.browser.fill(element.name, element.value);
        });
        callback();
    });

    this.When(/^I visit the "([^"]*)" page$/, function(page, callback) {
        var world = this;
        var path = pages[page];

        if(!path) {
            return callback.fail(new Error('Unknown page ' + page));
        }

        world.visit(path, function() {
            if(!world.browser.success) return callback.fail(new Error("Error while loading path " + path));
            callback();
        });
    });

    this.When(/^I press the "([^"]*)" button$/, function(selector, callback) {
        var world = this;
        world.browser.pressButton(selector, function() {
            if(!world.browser.success) return callback.fail(new Error('Error while pressing button ' + selector));
            callback();
        });
    });

    this.When(/^I click the "([^"]*)" link/, function(selector, callback) {
        var world = this;
        world.browser.clickLink(selector, function() {
            if(!world.browser.success) return callback.fail(new Error('Error while clicking link ' + selector));
            callback();
        });
    });

    this.Then(/^I should be on the "([^"]*)" page$/, function(page, callback) {
        var world = this;
        var path = pages[page];
        if(!path) {
            return callback.fail(new Error('Unknown page ' + page));
        }

        if(world.browser.location.toString() === world.getUrl(path)) {
            callback();
        } else {
            callback.fail(new Error('Expected page to be ' + world.getUrl(path) + ', but is ' + world.browser.location));
        }
    });

    this.Then(/^The flash message should contain "([^"]*)"$/, function(text, callback) {
        var world = this;
        var alertElementText = world.browser.text('#flashes .alert');
        if(!alertElementText || alertElementText.length == 0) return callback.fail(new Error("Unable to find flash in page."));
        if (alertElementText.indexOf(text) == -1) return callback.fail(new Error("Expected flash text to contain " + text + " but got " + alertElementText));
        callback();
    });

    this.Then(/^I should see (\d+) lines in the table "([^"]*)"$/, function(numLines, tableSelector, callback) {
        var world = this;
        var count = world.browser.queryAll(tableSelector + " tbody tr").length;
        if(count != numLines) return callback.fail(new Error("Expected "+ numLines + " users, found: " + count));
        callback();
    });
};

module.exports = sharedSteps;