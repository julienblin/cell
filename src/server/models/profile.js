var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    util = require('util');

var ProfileSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    isActive: { type: Boolean },
    title: { type: String, validate: [validations.uniqueFieldInsensitive('Profile', 'title', 'project')], index: true },
    percentageJunior: { type: Number },
    percentageIntermediary: { type: Number },
    percentageSenior: { type: Number },
    priceJunior: { type: Number },
    priceIntermediary: { type: Number },
    priceSenior: { type: Number }
});

ProfileSchema.plugin(require('./plugins/paginate'));
ProfileSchema.plugin(require('./plugins/modify'), { parentModel: 'Project', parentProperty: 'profiles' });
ProfileSchema.plugin(require('./plugins/serialize'), { remove: [ 'project' ] });

module.exports = mongoose.model('Profile', ProfileSchema);