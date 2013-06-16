/**
 * Middleware to push local variables to every view
 */

module.exports = function(req, res, next) {
    res.locals.config = require('../../config');
    res.locals.req = req;
    res.locals.paginate = require('../views/helpers/paginate');
    res.locals.editors = require('../views/helpers/editors');
    next();
}