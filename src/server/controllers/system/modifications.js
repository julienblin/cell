/**
 * Modifications controller
 */

"use strict";

var Modification = require('../../models/modification'),
    Project = require('../../models/project'),
    User = require('../../models/user');

exports.index = function (req, res, next) {
    var searchCriteria = {};
    Modification.paginate(searchCriteria, { '_id': -1 }, { currentPage: req.query.page, pageSize: 10 }, function(err, pagination, results){
        if (err) return next(err);

        Project.populate(results, [{ path: 'project'}], function(err) {
            if (err) return next(err);
            User.populate(results, [{ path: 'user'}], function(err) {
                if (err) return next(err);
                res.render('system/modifications/index', {
                    title: 'Modifications',
                    pagination: pagination,
                    results: results
                });
            });
        });
    });
};
