/**
 * World definition for cucumber
 */

var config = require('./config'),
    http = require('http'),
    mongoose = require('mongoose'),
    phantom = require('phantom');

mongoose.connect(config.db.url);

var passport = require('../../server/passport.js');
var app = require('../../server/express.js');
require('../../server/routes.js')(app, passport);

var World = function World(callback) {
    var that = this;

    var _evaluate = function (cb, func) {
        var args = [].slice.call(arguments, 2);
        var fn = "function() { return (" + func.toString() + ").apply(this, " + JSON.stringify(args) + ");}";
        return that.page.evaluate(fn, cb);
    };

    this.dropDatabase = function(cb) {
        mongoose.connection.close(function() {
            mongoose.connect(config.db.url, function() {
                mongoose.connection.db.dropDatabase(cb);
            });
        });
    };

    this.createPhantomPage = function(cb) {
        phantom.create(function(ph) {
            that.ph = ph;
            that.ph.createPage(function(page) {
                that.page = page;
                cb();
            });
        });
    };

    this.getUrl = function(path) {
        return 'http://localhost:' + config.web.port + path;
    }

    this.visit = function(path, cb) {
        that.page.open(that.getUrl(path), function(status) {
            cb(status);
        });
    };

    this.getValue = function(selector, cb) {
        _evaluate(cb, function(selector) {
            return $(selector).val();
        }, selector);
    };

    this.setValue = function(selector, value, cb) {
        _evaluate(cb, function(selector, value) {
            return $(selector).val(value);
        }, selector, value);
    };

    this.fill = function(name, value, cb) {
        that.setValue("input[name='" + name + "']", value, cb);
    };

    this.click = function(selector, cb) {
        _evaluate(cb, function(selector) {
            $(selector).click();
        }, selector);
    };

    this.submit = function(selector, cb) {
        _evaluate(cb, function(selector) {
            $(selector).submit();
        }, selector);
    };

    this.pollForPathChange = function(path, cb, numRetries) {
        if(!numRetries) numRetries = 0;
        if (numRetries == 100) throw new Error("Poll for path changed exceeded max retries for path:" + path + ' current value: ' + that.page.url);
        that.page.get('url', function(result) {
            if(result === that.getUrl(path)) return cb();
            setTimeout(function() { that.pollForPathChange(path, cb, ++numRetries);  }, 100);
        });
    };

    this.count = function(selector, cb) {
        _evaluate(cb, function(selector) {
            return $(selector).length;
        }, selector);
    };

    this.exitPhantomPage = function(cb) {
        that.ph.exit();
        cb();
    };

    http.createServer(app).listen(config.web.port, function(){
        callback();
    });
};

exports.World = World;