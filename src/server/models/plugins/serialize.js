/**
 * Serialize mongoose plugin.
 * Alter the toObject function to filter internal variables.
 */

module.exports = function serializePlugin (schema, pluginOptions) {
    if(!pluginOptions) pluginOptions.additionalProperties = [];
    schema.set('toObject', { transform: function (doc, ret , options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        for(var key in pluginOptions.additionalProperties)
            delete ret[pluginOptions.additionalProperties[key]];
    }});
};