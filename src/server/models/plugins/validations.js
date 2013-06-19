/**
 * Custom validators for mongoose
 * http://mongoosejs.com/docs/validation.html
 */

var mongoose = require('mongoose'),
    util = require('util'),
    check = require('validator').check;

/**
 * Validates the uniqueness of fields, the case-insensitive way.
 * Must be provided with the modelName and the path.
 * You can provide relatedToOtherPath to add another filtering criteria in the search.
 * @param modelName
 * @param path
 * @param relatedToOtherPath
 * @returns {Function}
 */
exports.uniqueFieldInsensitive = function(modelName, path, relatedToOtherPath) {
    return function(val, callback) {
        if (!(val && val.length)) return callback(true);

        var query = mongoose.model(modelName).where(path).equals(new RegExp('^' + val + '$', 'i'));

        if (!this.isNew) {
            query.where('_id').ne(this._id);
        }

        if (relatedToOtherPath) {
            query.where(relatedToOtherPath).equals(this[relatedToOtherPath]);
        }

        query.count(function(err, count) {
            if (err) throw err;
            callback(count == 0);
        });
    }
};

exports.email = function() {
    return function(val) {
        try {
            check(val).isEmail();
        } catch(err) {
            return false;
        }
        return true;
    };
};