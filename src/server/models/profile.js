var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations'),
    util = require('util');

var ProfileSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    isActive: { type: Boolean },
    title: { type: String },
    percentageJunior: { type: Number },
    percentageIntermediary: { type: Number },
    percentageSenior: { type: Number },
    priceJunior: { type: Number },
    priceIntermediary: { type: Number },
    priceSenior: { type: Number }
});

ProfileSchema.plugin(require('./plugins/paginate'));
ProfileSchema.plugin(require('./plugins/modify'), { projectProperty: 'profiles' });

module.exports = mongoose.model('Profile', ProfileSchema);