/**
 * Pagination plugin
 */

"use strict";

var _ = require('underscore'),
    DEFAULT_PAGE_SIZE = 25;

module.exports = function paginatePlugin (schema, options) {
    schema.statics.paginate = function(q, sort, paginationOptions, callback) {
        var model = this;
        callback = callback || function(){};
        var pagination = _.defaults(paginationOptions, {
            currentPage: 1,
            pageSize: DEFAULT_PAGE_SIZE
        });
        pagination.currentPage = parseInt(pagination.currentPage, 10);
        pagination.pageSize = parseInt(pagination.pageSize, 10);
        
        if(pagination.currentPage <= 0) pagination.currentPage = 1;

        var skipFrom = (pagination.currentPage * pagination.pageSize) - pagination.pageSize;
        var query = model.find(q).sort(sort).skip(skipFrom).limit(pagination.pageSize);

        query.exec(function(err, results) {
            if (err) {
                callback(err, null, null);
            } else {
                model.count(q, function(err, totalItems) {
                    if (err) {
                        callback(err, null, null);
                    } else {
                        var pageCount = Math.floor(totalItems / pagination.pageSize) + 1;
                        callback(null, {
                            currentPage: pagination.currentPage,
                            pageSize: pagination.pageSize,
                            pageCount: pageCount,
                            totalItems: totalItems
                        }, results);
                    }
                });
            }
        });
    };
};