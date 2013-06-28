Handsontable.CustomCellPropertiesRenderer = function(instance, TD, row, col, prop, value, cellProperties) {
    if(cellProperties) {
        var td = $(TD);
        if(cellProperties.computed) {
            if(!value) {
                td.css('background', '#f2dede');
            } else {
                td.css('background', '#dff0d8');
            }
        } else {
            if(cellProperties.invalid) {
                td.css('background', '#fcf8e3');
            } else {
                td.css('background', 'inherit');
            }
        }

        if(cellProperties.muted) {
            $(TD).css('text-decoration', 'line-through');
        } else {
            $(TD).css('text-decoration', 'inherit');
        }
    }
};

Handsontable.cellTypes.title = {
    editor: Handsontable.TextEditor,
    renderer: function (instance, TD, row, col, prop, value, cellProperties) {
        Handsontable.TextRenderer(instance, TD, row, col, prop, value, cellProperties);
        Handsontable.CustomCellPropertiesRenderer(instance, TD, row, col, prop, value, cellProperties);
    }
};

Handsontable.cellTypes.price = {
    editor: Handsontable.TextEditor,
    renderer: function (instance, TD, row, col, prop, value, cellProperties) {
        if (Handsontable.helper.isNumeric(value)) {
            value = numeral(value).format('0,0 $');
            instance.view.wt.wtDom.addClass(TD, 'htNumeric');
        }
        Handsontable.TextRenderer(instance, TD, row, col, prop, value, cellProperties);
        Handsontable.CustomCellPropertiesRenderer(instance, TD, row, col, prop, value, cellProperties);
    },
    validator: function (value, callback) {
        if(!value) return callback(true);
        callback(/^-?\d*\.?\d*$/.test(value));
    },
    dataType: 'number'
};

Handsontable.cellTypes.percent = {
    editor: Handsontable.TextEditor,
    renderer: function (instance, TD, row, col, prop, value, cellProperties) {
        if (Handsontable.helper.isNumeric(value)) {
            value = numeral(value / 100).format('0 %');
            instance.view.wt.wtDom.addClass(TD, 'htNumeric');
        }
        Handsontable.TextRenderer(instance, TD, row, col, prop, value, cellProperties);
        Handsontable.CustomCellPropertiesRenderer(instance, TD, row, col, prop, value, cellProperties);
    },
    validator: function (value, callback) {
        if(!value) return callback(true);
        callback(/^-?\d*\.?\d*$/.test(value));
    },
    dataType: 'number'
};