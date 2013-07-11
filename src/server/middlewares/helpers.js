/**
 * A couple of helpers function for res
 */

"use strict";

module.exports = function(req, res, next) {
    res.ajaxRedirect = function(url) {
        res.end('<script type="text/javascript">window.location.href="' + url + '";</script>');
    };
    next();
};