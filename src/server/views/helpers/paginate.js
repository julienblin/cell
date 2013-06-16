/**
 * Pagination view helper
 */

var url = require('url'),
    qs = require('querystring'),
    util = require('util');

var generatePageLink = function(url, label) {
    return util.format("<a href=?%s>%s</a>", url, label);
};

module.exports = function(req, pagination) {
    if (pagination.pageCount < 2) {
        return '';
    }

    var params = qs.parse(url.parse(req.url).query),
        str = '<div class="pagination pagination-small pagination-centered"><ul>';

    if (pagination.pageCount < 8) {
        for(var i = 1; i <= pagination.pageCount; ++i) {
            str += util.format('<li class="%s">', i == pagination.currentPage ? "active" : "");
            params.page = i;
            str += generatePageLink(qs.stringify(params), i);
            str += '</li>'
        }
    } else {
        if (pagination.currentPage > 1) {
            params.page = 1;
            str += '<li>' + generatePageLink(qs.stringify(params), '&lt;&lt;') + '</li>';
        } else {
            str += util.format('<li class="disabled"><a href="#">%s</a></li>', '&lt;&lt;');
        }

        if (pagination.currentPage > 1) {
            params.page = pagination.currentPage - 1;
            str += '<li>' + generatePageLink(qs.stringify(params), '&lt;') + '</li>';
        } else {
            str += util.format('<li class="disabled"><a href="#">%s</a></li>', '&lt;');
        }

        var firstPageNumber = 1;
        if (pagination.currentPage > 2) {
            firstPageNumber = pagination.currentPage - 1;
            if (pagination.currentPage == pagination.pageCount) firstPageNumber -= 1;
        }

        var lastPageNumber = pagination.pageCount;
        if (pagination.currentPage < (pagination.pageCount - 1)) {
            lastPageNumber = pagination.currentPage + 1;
            if (pagination.currentPage == 1) lastPageNumber += 1;
        }

        console.log(firstPageNumber + ' - ' + lastPageNumber);

        for (var i = firstPageNumber; i <= lastPageNumber; i++) {
            params.page = i;
            if (i == pagination.currentPage) {
                str += '<li class="active">' + generatePageLink(qs.stringify(params), util.format('%d / %d', i, pagination.pageCount)) + '</li>';
            } else {
                str += '<li>' + generatePageLink(qs.stringify(params), i) + '</li>';
            }
        }

        if (pagination.currentPage < pagination.pageCount) {
            params.page = pagination.currentPage + 1;
            str += '<li>' + generatePageLink(qs.stringify(params), '&gt;') + '</li>';
        } else {
            str += util.format('<li class="disabled"><a href="#">%s</a></li>', '&gt;');
        }

        if (pagination.currentPage < pagination.pageCount) {
            params.page = pagination.pageCount;
            str += '<li>' + generatePageLink(qs.stringify(params), '&gt;&gt;') + '</li>';
        } else {
            str += util.format('<li class="disabled"><a href="#">%s</a></li>', '&gt;&gt;');
        }
    }

    str += '</ul></div>';
    return str;
};