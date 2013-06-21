/**
 * Shared steps for Cucumber.
 */

var User = require('../../server/models/user'),
    mongoose = require('mongoose'),
    async = require('async');

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

    this.When(/^I visit the "([^"]*)" page$/, function(page, callback) {
        var world = this;
        var path = '';
        switch(page) {
            case 'users management':
                path = '/system/users';
                break;
            default:
                return callback.fail(new Error('Unknown page ' + page));
        }

        world.visit(path, function() {
            if(!world.browser.success) return callback.fail(new Error("Error while loading path " + path));
            callback();
        });
    });

    this.Then(/^I should see (\d+) lines in the table "([^"]*)"$/, function(numLines, tableSelector, callback) {
        var world = this;
        var count = world.browser.queryAll(tableSelector + " tbody tr").length;
        if(count != numLines) return callback.fail(new Error("Expected "+ numLines + " users, found: " + count));
        callback();
    });
};

module.exports = sharedSteps;