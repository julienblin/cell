window.ProjectEngine = function(id) {
    var that = this;
    this.id = id;
    this.data = {
        estimations: [
            {
                isActive: true,
                title: 'here is the first line',
                scale: 'Umbraco',
                complexity: 'Medium',
                coefficient: 1.0,
                baseline: 25,
                overBaseline: 20,
                total: 6,
                totalMoney: 3300
            }
        ]
    };
    this.gridContainers = {};
    this.renderers = {
        computed: function(instance, td, row, col, prop, value, cellProperties) {
            Handsontable.NumericCell.renderer.apply(this, arguments);
            if(!value) {
                td.style.background = '#f2dede';
            } else {
                td.style.background = '#dff0d8';
            }
            td.style.textAlign = 'right';
            return td;
        }
    };
};

ProjectEngine.prototype.init = function() {
    var that = this;
    var loadingAlert = alerts.info('Loading project...');

    this.gridContainers.estimations = $('#estimationsGrid');
    this.gridContainers.estimations.handsontable({
        data: that.data.estimations,
        colHeaders: [ "Act.", "Title", "Scale", "Complexity", "Coeff.", "Baseline", "Over-baseline", "Total", "Total $"  ],
        colWidths:  [30,        600,     80,     80,        40,       80,         80,              80,      80],
        stretchH: 'all',
        rowHeaders: true,
        minSpareRows: 1,
        columns: [
            { data: 'isActive',      type: 'checkbox' },
            { data: 'title',         type: 'text' },
            { data: 'scale',         type: 'text' },
            { data: 'complexity',    type: 'text' },
            { data: 'coefficient',   type: 'numeric', format: '0.0' },
            { data: 'baseline',      type: 'numeric', format: '0 h.', readOnly: true },
            { data: 'overBaseline', type: 'numeric', format: '0 h.', readOnly: true },
            { data: 'total',         type: 'numeric', format: '0 d.', readOnly: true },
            { data: 'totalMoney',   type: 'numeric', format: '0 $', readOnly: true }
        ],
        cells: function (row, col, prop) {
            var cellProperties = {};
            if(col > 4) {
                cellProperties.renderer = that.renderers.computed;
            };
            return cellProperties;
        },
        beforeChange: function (changes) {
            var instance = that.gridContainers.estimations.data('handsontable');
            for (var changesIndex = 0; changesIndex < changes.length; ++changesIndex) {
                console.log(changes[changesIndex]);
            }
        }
    });

    loadingAlert.dismiss();
    alerts.success('Project loaded - good to go!', 3000);
};