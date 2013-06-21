/**
 * World definition for cucumber
 */

var config = require('./config'),
    server = require('../../server/server'),
    http = require('http'),
    mongoose = require('mongoose'),
    Browser = require('zombie');

var World = function World(callback) {
    var that = this;

    this.dropDatabase = function(cb) {
        mongoose.connection.close(function() {
            mongoose.connect(config.db.url, function() {
                mongoose.connection.db.dropDatabase(cb);
            });
        });
    };

    this.openBrowser = function(cb) {
        that.browser = new Browser();
    };

    this.closeBrowser = function(cb) {
        that.browser.close();
    };

    this.getUrl = function(path) {
        return 'http://localhost:' + config.web.port + path;
    }

    this.visit = function(path, cb) {
        that.browser.visit(that.getUrl(path), function() {
            cb();
        });
    };

    server(config, function() {
        callback();
    });
};

exports.World = World;