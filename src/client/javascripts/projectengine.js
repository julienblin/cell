window.ProjectEngine = function(id) {
    this.id = id;
    this.state = "init";
    this.data = {};
    this.grids = {};
    this.updatesReceivers = {};
};

ProjectEngine.prototype.renderers = {
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

ProjectEngine.prototype.initSocket = function() {
    var that = this;
    if (navigator.userAgent.indexOf('Zombie.js') === -1) {
        var socketUrl = window.location.protocol + '//' + window.location.hostname;
        if (window.location.port) {
            socketUrl += ':' + window.location.port;
        }
        that.socket = io.connect(socketUrl + '/project');

        that.socket.on('disconnect', function() {
            that.state = "disconnected";
            alerts.error("You've been disconnected from the server. Please try to <strong><a href='" + window.location.href + "'>reload the page</a></strong>.");
        });

        that.socket.on('receiveUpdates', function(data) {
            if (that.state != 'ready') {
                alerts.error("An update has been received while client is not ready. Please try to <strong><a href='" + window.location.href + "'>reload the page</a></strong>.");
            } else {
                console.log(data);
                for(var modifIndex in data) {
                    var modification = data[modifIndex];
                    if(!that.updatesReceivers[modification.model]) {
                        alerts.error("An unknown message has been received. Please contact the administrator.");
                    } else {
                        that.updatesReceivers[modification.model](modification);
                    }
                };
            }
        });
    }
};

ProjectEngine.prototype.initInfo = function() {
    var that = this;

    $('[data-property="projectName"]').text(that.data.projectName);
    $('[data-property="clientName"]').text(that.data.clientName);
    $('#createdAt').text('Created:' + new Date(that.data.created).toLocaleString());

    $('#info [contenteditable]').on('change', function(e) {
        var target = $(this);
        that.data[$(this).data('property')] = $(this).text();
        that.updateTitle();
        var valueBefore = target.data('before');
        that.emitModify([{
            model: 'Project',
            id: that.id,
            action: 'update',
            property: target.data('property'),
            oldValue: valueBefore,
            newValue: target.text()
        }], function(err, data) {
            if (err) {
                that.data[$(this).data('property')] = valueBefore;
                target.text(valueBefore);
                that.updateTitle();
            } else {
                if ((data.length != 1) || (data[0].status != 'success')) {
                    alerts.warning("The change has been reverted. Reason: " + data[0].statusMessage, 5000);
                    that.data[$(this).data('property')] = valueBefore;
                    target.text(valueBefore);
                    that.updateTitle();
                }
            }
        });
    });

    that.updatesReceivers["Project"] = function(modification) {
        if(that.data[modification.property] === modification.oldValue) {
            that.data[modification.property] = modification.newValue;
            $('[data-property="' + modification.property + '"]').text(modification.newValue);
            that.updateTitle();
        } else {
            console.log('Discarding update:');
            console.log(modification);
        }
    };
};

ProjectEngine.prototype.initEstimationLines = function() {
    var that = this;
    $('#estimationsGrid').handsontable({
        data: that.data.estimationLines,
        colHeaders: [ "Act.", "Title", "Scale", "Complexity", "Coeff.", "Baseline", "Over-baseline", "Total", "Total $"  ],
        colWidths:  [30,        600,     80,     80,        40,       80,         80,              80,      80],
        stretchH: 'all',
        rowHeaders: true,
        minSpareRows: 1,
        columns: [
            { data: 'isActive',      type: 'checkbox', default: true },
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
        }
    });
    that.grids.estimationLines = $('#estimationsGrid').data('handsontable');

    // Forces the render of grids when switching tabs if it haven't happened.
    $('a[data-toggle="tab"]').on('shown', function(e) {
        switch($(e.target).attr('href')) {
            case '#estimations':
                that.grids.estimationLines.render();
                break;
        }
    });
};

ProjectEngine.prototype.init = function() {
    var that = this;
    that.loadingAlert = alerts.info('Loading project...');

    this.initSocket();

    if (that.socket) {
        that.socket.emit('getDataAndSubscribe', that.id, function(err, data) {
            if (err) {
                that.loadingAlert.dismiss();
                alerts.error("There has been an error while loading project data. Reason: " + err.message);
                return;
            }
            that.data = data;
            that.data.estimationLines = [
                { id: 123456, isActive: true, title: "Something" }
            ];

            that.initInfo();
            that.initEstimationLines();

            that.loadingAlert.dismiss();
            alerts.success('Project loaded - good to go!', 3000);
            that.state = "ready";
        });
    }
};

ProjectEngine.prototype.emitModify = function(values, callback) {
    var that = this;
    if (that.socket && (that.state = "ready")) {
        that.socket.emit('modify', values, function(err, data) {
            if (err) {
                console.log(err);
                alerts.error("There has been an error while sending the last change. Reason: " + err.message);
                callback(err, null);
            } else {
                callback(null, data);
            }
        });
    } else {
        alerts.warning("The last change hasn't been sent.");
        callback(new Error('Not ready'), null);
    }
};

ProjectEngine.prototype.updateTitle = function() {
    document.title = "Cell - " + this.data.clientName + ' - ' + this.data.projectName;
};