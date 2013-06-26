window.ProjectEngine = function(id) {
    var that = this;
    that.id = id;
    that.state = "init";
    that.data = {};
    that.gridContainers = {};
    that.renderers = {
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
    that.loadingAlert = alerts.info('Loading project...');

    if (navigator.userAgent.indexOf('Zombie.js') === -1) {
        var socketUrl = window.location.protocol + '//' + window.location.hostname;
        if (window.location.port) {
            socketUrl += ':' + window.location.port;
        }
        that.socket = window.socket = io.connect(socketUrl + '/project');
        that.socket.on('disconnect', function() {
            that.state = "disconnected";
            alerts.error("You've been disconnected from the server. Please try to <strong><a href='" + window.location.href + "'>reload the page</a></strong>.");
        });
    }

    this.gridContainers.estimations = $('#estimationsGrid');
    this.gridContainers.estimations.handsontable({
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

    if (navigator.userAgent.indexOf('Zombie.js') === -1) {
        that.socket.emit('getDataAndSubscribe', that.id, function(err, data) {
            if (err) {
                that.loadingAlert.dismiss();
                alerts.error("There has been an error while loading project data. Reason: " + err);
                return;
            }
            that.data = data;
            that.loadInitialData();
        });
    }
};

ProjectEngine.prototype.loadInitialData = function() {
    var that = this;

    $('#projectName').text(that.data.projectName);
    $('#clientName').text(that.data.clientName);
    $('#createdAt').text('Created:' + new Date(that.data.created).toLocaleString());

    that.loadingAlert.dismiss();
    alerts.success('Project loaded - good to go!', 3000);
    that.state = "ready";
};