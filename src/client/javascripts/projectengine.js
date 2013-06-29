window.ProjectEngine = function(id) {
    this.id = id;
    this.state = "init";
    this.data = {};
    this.shadowData = {}; // Used for delete detection - could not find a better way :-(
    this.grids = {};
    this.updatesReceivers = {};
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
                alerts.warning("The changes has been reverted. Reason: internal error.", 5000);
                that.data[$(this).data('property')] = valueBefore;
                target.text(valueBefore);
                that.updateTitle();
            } else {
                if ((data.length != 1) || (data[0].status != 'success')) {
                    alerts.warning("The changes has been reverted. Reason: " + data[0].statusMessage, 5000);
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

ProjectEngine.prototype.initProfiles = function() {
    var that = this;
    $('#profilesGrid').handsontable({
        data: that.data.profiles,
        colHeaders: [ "Act.", "Title", "Junior %", "Junior $", "Int. %", "Int. $", "Senior %", "Senior $", "Average $" ],
        colWidths:  [30,        600,   60,         60,         60,       60,       60,         60,         60],
        stretchH: 'all',
        rowHeaders: true,
        minSpareRows: 1,
        columns: [
            { data: 'isActive',               type: 'checkbox' },
            { data: 'title',                  type: 'title' },
            { data: 'percentageJunior',       type: 'percent' },
            { data: 'priceJunior',            type: 'price' },
            { data: 'percentageIntermediary', type: 'percent' },
            { data: 'priceIntermediary',      type: 'price' },
            { data: 'percentageSenior',       type: 'percent' },
            { data: 'priceSenior',            type: 'price' },
            { data: 'priceAverage',           type: 'price', readOnly: true }
        ],
        contextMenu: ['row_above', 'row_below', 'remove_row'],
        cells: function (row, col, prop) {
            var profile = that.data.profiles[row];
            var cellProperties = {};
            switch(prop) {
                case 'title':
                    if(profile.id) {
                        if(!profile.title) {
                            cellProperties.invalid = true;
                        }
                    }
                    break;
                case 'percentageJunior':
                case 'percentageIntermediary':
                case 'percentageSenior':
                    if(profile.id) {
                        var totalPercentage = that.projectCalculator.parseInt(profile.percentageJunior)
                            + that.projectCalculator.parseInt(profile.percentageIntermediary)
                            + that.projectCalculator.parseInt(profile.percentageSenior);
                        if(totalPercentage != 100) {
                            cellProperties.invalid = true;
                        }
                    }
                    break;
                case 'priceAverage':
                    cellProperties.computed = true;
                    break;
            }

            if (!profile.isActive) {
                cellProperties.muted = true;
            }

            return cellProperties;
        },
        beforeRender: function() {
            that.projectCalculator.performCalculations();
            that.shadowData.profiles = _.clone(that.data.profiles);
        },
        beforeChange: function(changes, operation) {
            if((that.data.profiles.length > 0) && !(_.last(that.data.profiles).id))
                that.data.profiles.pop();
        },
        afterChange: function(changes, operation) {
            if (!that.grids.profiles) that.grids.profiles = $('#profilesGrid').data('handsontable');
            switch(operation) {
                case 'edit':
                case 'autofill':
                case 'paste':
                    var modifications = [];
                    _.each(changes, function(change) {
                        var row = change[0];
                        var profileData = that.data.profiles[row];
                        if (!profileData.id) {
                            var createModif = {
                                model: 'Profile',
                                action: 'create',
                                values: {}
                            };
                            createModif.values[change[1]] = change[3];
                            if(change[1] != 'isActive') {
                                profileData.isActive = true;
                                createModif.values.isActive = true;
                            }
                            if(row > 0) {
                                createModif.insertAfter = that.data.profiles[row - 1].id;
                            }
                            modifications.push(createModif);
                        } else {
                            modifications.push({
                                model: 'Profile',
                                id: profileData.id,
                                action: 'update',
                                property: change[1],
                                oldValue: change[2],
                                newValue: change[3]
                            });
                        }
                    });

                    that.emitModify(modifications, function(err, data) {
                        if (err) {
                            alerts.warning("The changes has been reverted. Reason: internal error.", 5000);
                            _.each(changes, function(change) {
                                that.data.profiles[change[0]][change[1]] = change[2];
                            });
                        } else {
                            _.each(data, function(result, index) {
                                if (result.status != 'success') {
                                    alerts.warning("The changes has been reverted. Reason: " + result.statusMessage, 5000);
                                    that.data.profiles[changes[index][0]][changes[index][1]] = changes[index][2];
                                } else {
                                    if (result.id) {
                                        that.data.profiles[changes[index][0]].id = result.id;
                                    }
                                }
                            });
                        }
                        that.grids.profiles.render();
                    });

                    break;
            }
        },
        afterRemoveRow: function(index, amount) {
            var profilesToDelete = that.shadowData.profiles.slice(index, amount + 1);
            console.log(profilesToDelete);
        }
    });

    that.updatesReceivers["Profile"] = function(modification) {
        switch(modification.action) {
            case 'create':
                var newProfile = modification.values;
                newProfile.id = modification.id;
                if(modification.insertAfter) {
                    var previousProfile = _.findWhere(that.data.profiles, { id: modification.insertAfter });
                    if(!previousProfile) {
                        console.log({insertAfter:modification.insertAfter, currentProfiles: that.data.profiles});
                        alerts.error("Fatal error: an update could not be treated. Please try to <strong><a href='" + window.location.href + "'>reload the page</a></strong>.");
                    } else {
                        that.data.profiles.splice(that.data.profiles.indexOf(previousProfile) + 1, 0, newProfile);
                        that.grids.profiles.render();
                    }
                } else {
                    that.data.profiles.splice(that.data.profiles.length - 1, 0, newProfile); //Because of spare row.
                    that.grids.profiles.render();
                }
                break;
            case 'update':
                var profile = _.findWhere(that.data.profiles, { id: modification.id });
                if(!profile) {
                    console.log({id:modification.id, currentProfiles: that.data.profiles});
                    alerts.error("Fatal error: an update could not be treated. Please try to <strong><a href='" + window.location.href + "'>reload the page</a></strong>.");
                    return;
                }

                if((profile[modification.property] === modification.oldValue)
                    || (!profile[modification.property] && !modification.oldValue)) {
                    profile[modification.property] = modification.newValue;
                    that.grids.profiles.render();
                } else {
                    console.log('Discarding update:');
                    console.log(modification);
                }

                break
            case 'delete':
                alerts.warning('Deletes are not supported right now!');
                break;
        }
    };
};

/*ProjectEngine.prototype.initEstimationLines = function() {
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
};*/

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
            that.projectCalculator = new ProjectCalculator(that.data);
            //that.projectCalculator.performCalculations();
            that.initInfo();
            that.initProfiles();
            //that.initEstimationLines();

            // Forces the render of grids when switching tabs if it haven't happened.
            $('a[data-toggle="tab"]').on('shown', function(e) {
                switch($(e.target).attr('href')) {
                    case '#profiles':
                        that.grids.profiles.render();
                        break;
                    case '#estimations':
                        that.grids.estimationLines.render();
                        break;
                }
            });

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