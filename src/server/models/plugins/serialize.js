/**
 * Serialize mongoose plugin.
 * Alter the toObject function to filter internal variables.
 */

"use strict";

module.exports = function serializePlugin (schema, pluginOptions) {
    if (!pluginOptions) pluginOptions = {};
    if (!pluginOptions.remove) pluginOptions.remove = [];
    schema.set('toObject', { virtuals: true, transform: function (doc, ret , options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        for(var key in pluginOptions.remove)
            delete ret[pluginOptions.remove[key]];

        if (pluginOptions.callback) {
            pluginOptions.callback(doc, ret, options);
        }
    }});
};