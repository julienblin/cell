/**
 * The snapshot model.
 * A snapshot allow the saving of any model (in fact, any kind of JSON document)
 *
 * Each snapshot has :
 *  - a model (such as Project, etc.)
 *  - a ref (which points to the initial model to which it is attached)
 *  - a title
 *  - and the data itself.
 */

"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validations = require('./plugins/validations');

var SnapshotSchema = new Schema({
    model: { type: String, required: true, index: true },
    ref: { type: String, required: true, index: true },
    title: { type: String, required: true, validate: [validations.uniqueFieldInsensitive('Snapshot', 'ref')] },
    data: { type: Schema.Types.Mixed }
});

SnapshotSchema.plugin(require('./plugins/paginate'));
SnapshotSchema.plugin(require('./plugins/serialize'));

module.exports = mongoose.model('Snapshot', SnapshotSchema);
