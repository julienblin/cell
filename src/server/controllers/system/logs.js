/**
 * Logs controller
 */

"use strict";

var Log = require('../../models/log');

exports.index = function (req, res, next) {
    var searchCriteria = {};
    var q = req.query.q;
    if (q) {
        searchCriteria = { $or: [{"level": new RegExp(q, 'i')}, {"message": new RegExp(q, 'i')}] };
    }
    Log.paginate(searchCriteria, { timestamp: -1 }, { currentPage: req.query.page }, function(err, pagination, results){
        if (err) return next(err);
        res.render('system/logs/index', {
            title: 'Logs',
            pagination: pagination,
            results: results,
            q: q
        });
    });
};