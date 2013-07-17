/**
 * The Profile project model.
 * A profile project is the basic unit for calculating time in an estimate, by allowing the association between profiles
 * projects and scales at the scale lines/columns level.
 * To evaluate prices, each profile project can be associated with a profile price.
 * Profiles are divided in 3 tiers: Junior / Intermediary / Senior.
 */

"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    util = require('util');

var ProfileProjectSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    profilePrice: { type: Schema.Types.ObjectId, ref: 'ProfilePrice' },
    isActive: { type: Boolean },
    title: { type: String, validate: [validations.uniqueFieldInsensitive('ProfileProject', 'title', 'project')], index: true },
    percentageJunior: { type: Number },
    percentageIntermediary: { type: Number },
    percentageSenior: { type: Number }
});

ProfileProjectSchema.plugin(require('./plugins/paginate'));
ProfileProjectSchema.plugin(require('./plugins/modify'), { parentModel: 'Project', parentProperty: 'profileProjects' });
ProfileProjectSchema.plugin(require('./plugins/serialize'), { remove: [ 'project' ] });

module.exports = mongoose.model('ProfileProject', ProfileProjectSchema);