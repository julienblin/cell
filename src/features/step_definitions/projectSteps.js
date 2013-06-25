/**
 * Project steps for Cucumber.
 */

var Project = require('../../server/models/project'),
    User = require('../../server/models/user'),
    async = require('async');

var projectSteps = function() {
    this.Given(/^the following Project (?:entities|entity|models|model|objects|object) owned by (")?([^"]*)\1?:$/, function(ignore, username, table, callback) {
        User.findOne({username: username}, function(err, user) {
            if (err) callback.fail(err);
            async.each(table.hashes(),
                function(definition, saved) {
                    Project.create(definition, user, saved);
                },
                function(err) {
                    if (err) callback.fail(err);
                    callback();
                }
            );
        });
    });
};

module.exports = projectSteps;