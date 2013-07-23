/**
 * Various utilities such as version displaying and ping for monitoring
 */

"use strict";

var pkg = require('../../package.json'),
    Project = require('../models/project');

exports.version = function(req, res) {
    res.setHeader('Content-Type', 'text/plain');
    res.end(pkg.version);
};

exports.ping = function(req, res) {
    Project.find({}, { limit: 1 }, function(err) {
        if (err) {
            res.send(500, 'Connection to mongodb unsuccessfull.');
        } else {
            res.send(200, 'Everything ok.');
        }
    });
};