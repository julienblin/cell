/**
 * Pagination view helper
 */

"use strict";

var url = require('url'),
    qs = require('querystring'),
    util = require('util'),
    _ = require('underscore');

var generatePageLink = function(pathname, params, label, options) {
    return util.format('<a href="%s?%s"%s>%s</a>',
        pathname,
        qs.stringify(params),
        options.ajaxTarget ? ' data-behavior="ajax" data-ajax-target="' + options.ajaxTarget + '"' : '',
        label);
};

module.exports = function(req, pagination, opt) {
    if (pagination.pageCount < 2) {
        return '';
    }

    if(!opt) opt = {};
    var options = _.defaults(opt, {
        ajaxTarget: ''
    });

    var parsedUrl = url.parse(req.url),
        pathname = parsedUrl.pathname,
        params = qs.parse(parsedUrl.query),
        str = '<div class="pagination pagination-small pagination-centered"><ul>',
        i;

    if (pagination.pageCount < 8) {
        for(i = 1; i <= pagination.pageCount; ++i) {
            str += util.format('<li class="%s">', i == pagination.currentPage ? "active" : "");
            params.page = i;
            str += generatePageLink(pathname, params, i, options);
            str += '</li>';
        }
    } else {
        if (pagination.currentPage > 1) {
            params.page = 1;
            str += '<li>' + generatePageLink(pathname, params, '&lt;&lt;', options) + '</li>';
        } else {
            str += util.format('<li class="disabled"><a href="#">%s</a></li>', '&lt;&lt;');
        }

        if (pagination.currentPage > 1) {
            params.page = pagination.currentPage - 1;
            str += '<li>' + generatePageLink(pathname, params, '&lt;', options) + '</li>';
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

        for (i = firstPageNumber; i <= lastPageNumber; i++) {
            params.page = i;
            if (i == pagination.currentPage) {
                str += '<li class="active">' + generatePageLink(pathname, params, util.format('%d / %d', i, pagination.pageCount), options) + '</li>';
            } else {
                str += '<li>' + generatePageLink(pathname, params, i, options) + '</li>';
            }
        }

        if (pagination.currentPage < pagination.pageCount) {
            params.page = pagination.currentPage + 1;
            str += '<li>' + generatePageLink(pathname, params, '&gt;', options) + '</li>';
        } else {
            str += util.format('<li class="disabled"><a href="#">%s</a></li>', '&gt;');
        }

        if (pagination.currentPage < pagination.pageCount) {
            params.page = pagination.pageCount;
            str += '<li>' + generatePageLink(pathname, params, '&gt;&gt;', options) + '</li>';
        } else {
            str += util.format('<li class="disabled"><a href="#">%s</a></li>', '&gt;&gt;');
        }
    }

    str += '</ul></div>';
    return str;
};