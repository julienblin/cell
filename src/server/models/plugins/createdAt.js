/*
 = Mongoose plugin that returns the created date through a virtual createdAt attribute, inferred from the ObjectId.
 */

"use strict";

var mongoose = require('mongoose');

module.exports = function createdAtPlugin (schema, options) {
    schema.virtual('createdAt').get(function() {
        return this._id.getTimestamp();
    });
};