/**
 * Middleware to push local variables to every view
 */

"use strict";

var moment = require('moment'),
    paginate = require('../views/helpers/paginate'),
    editors = require('../views/helpers/editors'),
    pkg = require('../../package.json');

module.exports = function(req, res, next) {
    res.locals.pkg = pkg;
    res.locals.req = req;
    res.locals.moment = moment;
    res.locals.paginate = paginate;
    res.locals.editors = editors;
    next();
};