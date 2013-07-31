/**
 * The Profile price model.
 * A profile is the basic unit for a calculating price in an estimate, by allowing the association between profile
 * prices and project profiles.
 * Profiles are divided in 3 tiers: Junior / Intermediary / Senior.
 */

"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    util = require('util');

var ProfilePriceSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    isActive: { type: Boolean },
    title: { type: String, validate: [validations.uniqueFieldInsensitive('ProfilePrice', 'title', 'project')], index: true },
    priceJunior: { type: Number },
    priceIntermediary: { type: Number },
    priceSenior: { type: Number }
});

ProfilePriceSchema.plugin(require('./plugins/paginate'));
ProfilePriceSchema.plugin(require('./plugins/modify'), { parentModel: 'Project', parentProperty: 'profilePrices' });
ProfilePriceSchema.plugin(require('./plugins/serialize'), { remove: [ 'project' ] });
ProfilePriceSchema.plugin(require('./plugins/duplicateInProject'), { model: 'ProfilePrice', projectCollection: 'profilePrices' });

module.exports = mongoose.model('ProfilePrice', ProfilePriceSchema);