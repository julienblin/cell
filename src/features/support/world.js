/**
 * World definition for cucumber
 */

var config = require('./config'),
    http = require('http'),
    mongoose = require('mongoose'),
    Browser = require('zombie'),
    server = require('../../server/server');

var World = function World(callback) {
    var that = this;

    this.dropDatabase = function(cb) {
        mongoose.connection.close(function() {
            mongoose.connect(config.db.url, function() {
                mongoose.connection.db.dropDatabase(function() {
                    cb();
                });
            });
        });
    };

    this.openBrowser = function() {
        that.browser = new Browser();
    };

    this.dispose = function(cb) {
        that.browser.close();
        cb();
    };

    this.getUrl = function(path) {
        return 'http://localhost:' + config.web.port + path;
    };

    this.visit = function(path, cb) {
        that.browser.visit(that.getUrl(path), function() {
            cb();
        });
    };

    if(GLOBAL.runningServer) {
        callback();
    } else {
        server(config, function(err, runningServer) {
            GLOBAL.runningServer = runningServer;
            callback();
        });
    }
};

exports.World = World;