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

    this.Given(/^I am logged in as (")?([^"]*)\1 using (")?([^"]*)\1$/, function(ignore1, username, ignore2, password, callback) {
        var world = this;
        world.visit('/login', function() {
            if(!world.browser.success) return callback.fail(new Error('Unable to reach login page.'));

            world.browser.fill('username', username)
                         .fill('password', password)
                         .pressButton('Login', function() {
                    if(!world.browser.success) return callback.fail(new Error('Error while logging in.'));
                    callback();
                });
        });
    });

    this.Given(/^the following (")?([^"]*)\1 (?:entities|entity|models|model|objects|object)?:$/, function(ignore, model, table, callback) {
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

    this.When(/^I visit the (")?([^"]*)\1 page$/, function(ignore, page, callback) {
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

    this.When(/^I press the (")?([^"]*)\1 button$/, function(ignore, selector, callback) {
        var world = this;
        world.browser.pressButton(selector, function() {
            if(!world.browser.success) return callback.fail(new Error('Error while pressing button ' + selector));
            callback();
        });
    });

    this.When(/^I click the (")?([^"]*)\1 link/, function(ignore, selector, callback) {
        var world = this;
        world.browser.clickLink(selector, function() {
            if(!world.browser.success) return callback.fail(new Error('Error while clicking link ' + selector));
            callback();
        });
    });

    this.Then(/^I should be on the (")?([^"]*)\1 page$/, function(ignore, page, callback) {
        var world = this;
        var path = pages[page];
        if(!path) {
            return callback.fail(new Error('Unknown page ' + page));
        }

        if (path instanceof RegExp) {
            if(path.test(world.browser.location.toString())) {
                callback();
            } else {
                callback.fail(new Error('Expected page to match regex ' + path + ', but is ' + world.browser.location));
            }
        } else {
            if(world.browser.location.toString() === world.getUrl(path)) {
                callback();
            } else {
                callback.fail(new Error('Expected page to be ' + world.getUrl(path) + ', but is ' + world.browser.location));
            }
        }
    });

    this.Then(/^the flash message should contain (")?([^"]*)\1$/, function(ignore, text, callback) {
        var world = this;
        var alertElementText = world.browser.text('#flashes .alert');
        if(!alertElementText || alertElementText.length == 0) return callback.fail(new Error("Unable to find flash in page."));
        if (alertElementText.indexOf(text) == -1) return callback.fail(new Error("Expected flash text to contain " + text + " but got " + alertElementText));
        callback();
    });

    this.Then(/^the page should contain (")?([^"]*)\1$/, function(ignore, text, callback) {
        var world = this;
        var containerText = world.browser.text('#container');
        if(!containerText || containerText.length == 0) return callback.fail(new Error("Unable to find #container in page."));
        if (containerText.indexOf(text) == -1) return callback.fail(new Error("Expected page text to contain " + text));
        callback();
    });

    this.Then(/^the page title should contain (")?([^"]*)\1$/, function(ignore, title, callback) {
        var world = this;
        var pageTitle = world.browser.text('title');
        if(pageTitle.indexOf(pageTitle) == -1) return callback.fail(new Error("Expected page title to contain " + title + ', but got ' + pageTitle));
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