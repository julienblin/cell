/**
 * Middleware to add static expiration to generated content from bundle-up.
 */

"use strict";

module.exports = function(req, res, next) {
    if(req.url.indexOf("generated/bundle") != -1) {
        res.setHeader("Cache-Control", "public, max-age=345600"); // 4 days
        res.setHeader("Expires", new Date(Date.now() + 345600000).toUTCString());
    }
    next();
};