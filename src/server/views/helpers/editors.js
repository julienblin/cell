/**
 * Editors
 */

var util = require('util'),
    _ = require('underscore');

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

/**
 * Editor for text values, including validation support
 */
module.exports.text = function(obj, path, opt) {
    if(!opt) opt = {};
    var options = _.defaults(opt, {
        label: path.capitalize() + ':',
        type: 'text',
        value: obj[path] ? obj[path] : '',
        inputClass: '',
        placeholder: '',
        autocomplete: '',
        autofocus: false
    });

    var hasErrors = (obj.errors && obj.errors[path]);
    var str = util.format('<div class="control-group%s">', hasErrors ? ' error' : '');

    str += util.format('<label for="%s" class="control-label">%s</label>', path, options.label);
    str += '<div class="controls">';
    str += util.format('<input type="%s" name="%s" value="%s" class="%s" data-behavior="%s" %s placeholder="%s" %s>',
        options.type,
        path,
        options.value,
        options.inputClass,
        options.autocomplete ? 'autocomplete' : '',
        options.autocomplete ? ('data-autocomplete-source="' + options.autocomplete + '" autocomplete="off"') : '',
        options.placeholder,
        options.autofocus ? 'autofocus' : '');

    if (hasErrors) {
        str += util.format('<span class="help-inline">%s', obj.errors[path].message);
    }

    str += '</div>';
    str += '</div>';
    return str;
};

/**
 * Editor for boolean values
 */
module.exports.bool = function(obj, path, opt) {
    if(!opt) opt = {};
    var options = _.defaults(opt, {
        label: path.capitalize() + '?',
        labelClass: '',
        value: obj[path]
    });

    var hasErrors = (obj.errors && obj.errors[path]);
    var str = util.format('<div class="control-group%s">', hasErrors ? ' error' : '');
    str += '<div class="controls">';
    str += '<label class="checkbox">';

    str += util.format('<input type="checkbox" name="%s" %s>', path, options.value ? 'checked' : '');
    str += util.format('<span %s>%s</span>', options.labelClass ? util.format('class="%s"', options.labelClass) : '', options.label);

    if (hasErrors) {
        str += util.format('<span class="help-inline">%s', obj.errors[path].message);
    }

    str += '</label>';
    str += '</div>';
    str += '</div>';
    return str;
};

module.exports.submitCancel = function(returnUrl, opt) {
    if(!opt) opt = {};
    var options = _.defaults(opt, {
        submit: 'Submit',
        cancel: 'Cancel'
    });

    var str = '<div class="control-group"><div class="controls">';
    str += util.format('<button type="submit" class="btn btn-primary">%s</button>', options.submit);
    str += '&nbsp;&nbsp;';
    str += util.format('<a href="%s" class="btn btn-small">%s</a>', returnUrl, options.cancel);
    str += '</div></div>';

    return str;
};