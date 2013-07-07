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

var clonableINPUT = document.createElement('INPUT');
clonableINPUT.className = 'htCheckboxRendererInput';
clonableINPUT.type = 'checkbox';
clonableINPUT.setAttribute('autocomplete', 'off');

/**
 * Fix a problem in default Handsontable checkbox renderer that display #badvalue in case of undefined or null.
 */
Handsontable.CellCheckboxRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
    if (typeof cellProperties.checkedTemplate === "undefined") {
        cellProperties.checkedTemplate = true;
    }
    if (typeof cellProperties.uncheckedTemplate === "undefined") {
        cellProperties.uncheckedTemplate = false;
    }

    instance.view.wt.wtDom.empty(TD); //TODO identify under what circumstances this line can be removed

    var INPUT = clonableINPUT.cloneNode(false); //this is faster than createElement

    if (value === cellProperties.checkedTemplate || value === Handsontable.helper.stringify(cellProperties.checkedTemplate)) {
        INPUT.checked = true;
        TD.appendChild(INPUT);
    }
    else {
        TD.appendChild(INPUT);
    }

    var $input = $(INPUT);

    if (cellProperties.readOnly) {
        $input.on('click', function (event) {
            event.preventDefault();
        });
    }
    else {
        $input.on('mousedown', function (event) {
            if (!this.checked) {
                instance.setDataAtRowProp(row, prop, cellProperties.checkedTemplate);
            }
            else {
                instance.setDataAtRowProp(row, prop, cellProperties.uncheckedTemplate);
            }

            event.stopPropagation(); //otherwise can confuse cell mousedown handler
        });

        $input.on('mouseup', function (event) {
            event.stopPropagation(); //otherwise can confuse cell dblclick handler
        });
    }

    $(TD).css({ 'text-align': 'center' });

    return TD;
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

Handsontable.cellTypes.ut = {
    editor: Handsontable.TextEditor,
    renderer: function (instance, TD, row, col, prop, value, cellProperties) {
        if (Handsontable.helper.isNumeric(value)) {
            value = numeral(value).format('0.[00]') + ' ut';
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

Handsontable.cellTypes.cellCheckbox = {
    editor: Handsontable.CheckboxEditor,
    renderer: function (instance, TD, row, col, prop, value, cellProperties) {
        Handsontable.CellCheckboxRenderer(instance, TD, row, col, prop, value, cellProperties);
        Handsontable.CustomCellPropertiesRenderer(instance, TD, row, col, prop, value, cellProperties);
    }
};

