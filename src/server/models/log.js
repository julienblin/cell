/**
 * The log model.
 * Used to retrieve logs written by the winston-mongodb transport.
 */

"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LogSchema = new Schema({
    timestamp : { type: Date },
    level:    { type: String, index: true },
    message: { type: String }
});

LogSchema.virtual('isCritical').get(function() {
    return (this.level === 'warn' || this.level === 'error');
});

LogSchema.plugin(require('./plugins/paginate'));

module.exports = mongoose.model('Log', LogSchema);