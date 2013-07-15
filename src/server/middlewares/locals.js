/**
 * Middleware to push local variables to every view
 */

"use strict";

var moment = require('moment'),
    paginate = require('../views/helpers/paginate'),
    editors = require('../views/helpers/editors');

module.exports = function(config) {
    return function(req, res, next) {
        res.locals.config = config;
        res.locals.req = req;
        res.locals.moment = moment;
        res.locals.paginate = paginate;
        res.locals.editors = editors;
        next();
    };
};