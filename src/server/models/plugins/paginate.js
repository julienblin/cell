/**
 * Pagination plugin
 */

module.exports = function paginatePlugin (schema, options) {
    schema.statics.paginate = function(q, pageNumber, resultsPerPage, callback) {
        var model = this;
        callback = callback || function(){};

        var skipFrom = (pageNumber * resultsPerPage) - resultsPerPage;
        var query = model.find(q).skip(skipFrom).limit(resultsPerPage);

        query.exec(function(error, results) {
            if (error) {
                callback(error, null, null, null);
            } else {
                model.count(q, function(error, count) {
                    if (error) {
                        callback(error, null, null, null);
                    } else {
                        var pageCount = Math.floor(count / resultsPerPage);
                        if (pageCount == 0) {
                            pageCount = 1;
                        };
                        callback(null, pageCount, count, results);
                    };
                });
            };
        });
    };
};