/**
 * Middleware to push local variables to every view
 */

"use strict";

module.exports = function(config) {
    return function(req, res, next) {
        res.locals.config = config;
        res.locals.req = req;
        res.locals.paginate = require('../views/helpers/paginate');
        res.locals.editors = require('../views/helpers/editors');
        next();
    };
};