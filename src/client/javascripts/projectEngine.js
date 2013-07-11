/**
 * The project engine - coordinates everything related to a project in the page.
 */

var ProjectEngine = (function() {
    return function(projectId, userId) {
        var self = {};
        self.__proto__ = EventEmitter();
        self.projectId = projectId;
        self.userId = userId;
        self.renderers = {
            info: new InfoRenderer(self),
            profiles: new ProfilesRenderer(self),
            scales: new ScalesRenderer(self),
            estimationLines: new EstimationLinesRenderer(self),
            summary: new SummaryRenderer(self),
            users: new UsersRenderer(self)
        };

        self.stats = {
            state: 'disconnected',
            getTransport: function() {
                return self.socket ? self.socket.socket.transport.name : undefined;
            },
            latencies: [],
            numberOfSentUpdates: 0,
            numberOfReceivedUpdates: 0,
            numberOfDiscardedUpdates: 0
        };

        var _projectCalculator = new ProjectCalculator();

        /**
         * Find the target document in data using the model name and id; Can also retrieve the parent collection only
         * Returns an array containing : [the document, the parent collection]
         * Returns null if not found.
         */
        _findTargetDoc = function(model, id, parentId) {
            switch(model) {
                case 'Project':
                    return [self.data, null, null];
                case 'Profile':
                    if(!id) return [null, self.data.profiles];
                    var profile = _.findWhere(self.data.profiles, { id: id });
                    if(!profile) return null;
                    return [profile, self.data.profiles];
                case 'Scale':
                    if(!id) return [null, self.data.scales];
                    var scale = _.findWhere(self.data.scales, { id: id });
                    if(!scale) return null;
                    return [scale, self.data.scales];
                case 'ScaleColumn':
                    var parentScale = _.findWhere(self.data.scales, { id: parentId });
                    if (!parentScale) return null;
                    if (!parentScale.columns) parentScale.columns = [];
                    if(!id) return [null, parentScale.columns];
                    var scaleColumn = _.findWhere(parentScale.columns, { id: id });
                    if(!scaleColumn) return null;
                    return [scaleColumn, parentScale.columns];
                case 'ScaleLine':
                    var parentScale = _.findWhere(self.data.scales, { id: parentId });
                    if (!parentScale) return null;
                    if (!parentScale.lines) parentScale.lines = [];
                    if(!id) return [null, parentScale.lines];
                    var scaleLine = _.findWhere(parentScale.lines, { id: id });
                    if(!scaleLine) return null;
                    return [scaleLine, parentScale.lines];
                case 'EstimationLine':
                    if(!id) return [null, self.data.estimationLines];
                    var line = _.findWhere(self.data.estimationLines, { id: id });
                    if(!line) return null;
                    return [line, self.data.estimationLines];
            }
            return null;
        };

        /**
         * Checks equality of two values, considering that null, undefined, etc are equals, and matching arrays.
         */
        _valueEquals = function(value1, value2) {
            if (value1 == value2) return true;

            if((value1 instanceof Array) && (value1.length === 0)) value1 = null;
            if((value2 instanceof Array) && (value2.length === 0)) value2 = null;
            return (!value1 && !value2);
        };

        _getValueAtPath = function(obj, path) {
            if (path.indexOf('.') === -1) {
                return obj[path];
            } else {
                var firstLevelProperty = path.substring(0, path.indexOf('.'));
                var secondLevelProperty = path.substring(path.indexOf('.') + 1);
                var firstLevelValue = obj[firstLevelProperty];
                if (!firstLevelValue) return null;
                return firstLevelValue[secondLevelProperty];
            }
        };

        _setValueAtPath = function(obj, path, value) {
            if (path.indexOf('.') === -1) {
                obj[path] = value;
            } else {
                var firstLevelProperty = path.substring(0, path.indexOf('.'));
                var secondLevelProperty = path.substring(path.indexOf('.') + 1);
                var firstLevelValue = obj[firstLevelProperty];
                if (!firstLevelValue) firstLevelValue = {};
                firstLevelValue[secondLevelProperty] = value;
                obj[firstLevelProperty] = firstLevelValue;
            }
        };

        /**
         * Apply modifications to local data.
         * @param modifications
         * @private
         */
        var _apply = function(modifications) {
            _.each(modifications, function(modification) {
                if(!(modification.localInfo && modification.localInfo.alreadyApplied)) {
                    switch(modification.action) {
                        case 'create':
                            var newDoc = modification.values;
                            newDoc.id = modification.id;
                            if(modification.insertAfter) {
                                var previousDoc = _findTargetDoc(modification.model, modification.insertAfter, modification.parentId);
                                if(!previousDoc) {
                                    alerts.fatal("Unable to apply changes. Reason: unable to find previous document for model " + modification.model + " with id " + modification.insertAfter);
                                }
                                previousDoc[1].splice(previousDoc[1].indexOf(previousDoc[0]) + 1, 0, newDoc);
                            } else {
                                var parentCollection = _findTargetDoc(modification.model, null, modification.parentId);
                                if(!parentCollection) {
                                    alerts.fatal("Unable to apply changes. Reason: unable to find collection for model " + modification.model);
                                    return;
                                }
                                parentCollection[1].splice(0, 0, newDoc);
                            }
                            modification.localInfo = modification.localInfo || {};
                            modification.localInfo.target = newDoc;
                            break;
                        case 'update':
                            var targetDoc = _findTargetDoc(modification.model, modification.id, modification.parentId);
                            if(!targetDoc) {
                                alerts.fatal("Unable to apply changes. Reason: unable to find model " + modification.model + " with id " + modification.id);
                                return;
                            }
                            var currentValue = _getValueAtPath(targetDoc[0], modification.property);
                            if(!_valueEquals(currentValue, modification.oldValue)) {
                                ++self.stats.numberOfDiscardedUpdates;
                                console.log({ message: "Discarding update because of unmatched previous values", doc: targetDoc, modification: modification });
                                return;
                            }
                            _setValueAtPath(targetDoc[0], modification.property, modification.newValue);
                            break;
                        case 'delete':
                            var targetDoc = _findTargetDoc(modification.model, modification.id, modification.parentId);
                            if(!targetDoc) {
                                alerts.fatal("Unable to apply changes. Reason: unable to find model " + modification.model + " with id " + modification.id);
                                return;
                            }
                            modification.localInfo = modification.localInfo || {};
                            modification.localInfo.target = targetDoc[0];
                            modification.localInfo.position = targetDoc[1].indexOf(targetDoc[0]);
                            targetDoc[1].splice(modification.localInfo.position, 1);
                            break;
                        default:
                            alerts.fatal('Internal error - unrecognized action ' + modification.action);
                            break;
                    }
                }
            });
        };

        /**
         * Broadcast modifications - eventually revert changes in case of error.
         */
        var _broadcast = function(modifications) {
            if (self.socket) {
                ++self.stats.numberOfSentUpdates;
                var modificationsToSend = _.map(modifications, function(modification) {
                    return _.omit(modification, 'localInfo');
                });
                statusBar.changeIcon('loading');
                var startTime = new Date().getTime();
                self.socket.emit('modify', modificationsToSend, function(err, results) {
                    var endTime = new Date().getTime();
                    self.stats.latencies.push(endTime - startTime);
                    statusBar.changeIcon('ok');
                    if (err) {
                        alerts.fatal("Unable to send modifications to server. Reason:" + err.message);
                        statusBar.changeIcon('error');
                        return;
                    }

                    var mustNotifyAgain = false;
                    _.each(results, function(result, index) {
                        if(result.status === "success") {
                            if (result.id) {
                                modifications[index].localInfo.target.id = result.id;
                                mustNotifyAgain = true;
                            }
                        }
                    });

                    var failedModifications = _.compact(_.map(results, function(result, index) {
                        if(result.status != "success") {
                            mustNotifyAgain = true;
                            return {
                                modification: modifications[index],
                                result: result
                            };
                        };
                        return null;
                    }));

                    if(failedModifications.length > 0) {
                        _.each(failedModifications, function(failedModif) {
                            alerts.warning("Some changes have been reverted. Reason:" + failedModif.result.statusMessage, 5000);

                            var modification = failedModif.modification;
                            switch(modification.action) {
                                case 'create':
                                    var parentCollection = _findTargetDoc(modification.model, null, modification.parentId)[1];
                                    var indexOfTarget = parentCollection.indexOf(modification.localInfo.target);
                                    if(indexOfTarget != -1) {
                                        parentCollection.splice(indexOfTarget, 1);
                                    }
                                    break;
                                case 'update':
                                    var targetDoc = _findTargetDoc(modification.model, modification.id, modification.parentId);
                                    if(targetDoc) {
                                        if(_valueEquals(targetDoc[0][modification.property], modification.newValue)) {
                                            targetDoc[0][modification.property] = modification.oldValue;
                                        }
                                    }
                                    break;
                                case 'delete':
                                    var originalDoc = modification.localInfo.target;
                                    var parentCollection = _findTargetDoc(modification.model, null, modification.parentId)[1];
                                    parentCollection.splice(modification.localInfo.position, 0, originalDoc);
                                    break;
                            }

                        });
                    }

                    if(mustNotifyAgain) {
                        _projectCalculator.performCalculations(self.data);
                        self.emit('modified');
                    }
                });
            }
        };

        // Event subscriptions
        _.each(self.renderers, function(renderer) {
            renderer.on('applyModifications', function(modifications) {
                _apply(modifications);
                _projectCalculator.performCalculations(self.data);
                self.emit('modified');
                _broadcast(modifications);
            });
        });

        window.onerror = function(msg, url, line) {
            alerts.fatal('Execution error. Reason: ' + msg + '.');
            statusBar.changeIcon('error');
        };

        $(window).unload(function() {
            alerts.clear();
        });

        // Statistics popover on icon status bar
        $(statusBar.getStatusIconSelector()).popover({
            html: true,
            placement: 'top',
            title: 'Statistics',
            content: function() {
                return (Handlebars.compile($('#statistics-template').html()))({
                    stats: self.stats,
                    avgLatency: numeral(Math.average(self.stats.latencies)).format('0'),
                    stdDevLatency: numeral(Math.standardDeviation(self.stats.latencies)).format('0')
                });
            }
        });

        // Public functions
        self.init = function() {
            if (navigator.userAgent.indexOf('Zombie.js') != -1) {
                alerts.warning("Zombie.js navigator detected - socket.io disabled.");
                return;
            }

            var loadingAlert = alerts.info('Loading project...');
            statusBar.changeIcon('loading');

            var socketUrl = window.location.protocol + '//' + window.location.hostname;
            if (window.location.port) {
                socketUrl += ':' + window.location.port;
            }
            self.socket = io.connect(socketUrl + '/project');

            self.stats.state = 'connected';

            self.socket.on('disconnect', function() {
                alerts.fatal("You've been disconnected from the server.");
                statusBar.changeIcon('error');
                self.stats.state = 'disconnected';
            });

            self.socket.emit('getDataAndSubscribe', projectId, function(err, data) {
                loadingAlert.dismiss();
                statusBar.changeIcon('ok');
                if (err) {
                    statusBar.changeIcon('error');
                    alerts.fatal("There has been an error while loading project data. Reason: " + err.message);
                    return;
                }
                self.data = data;
                _projectCalculator.performCalculations(self.data);
                self.emit('modified');
                alerts.success('Project loaded - good to go!', 3000);
            });

            self.socket.on('receiveUpdates', function(modifications) {
                statusBar.changeIcon('loading');
                ++self.stats.numberOfReceivedUpdates;
                if(!self.data) {
                    alerts.fatal("There has been an concurrency error while loading project.");
                    statusBar.changeIcon('error');
                    return;
                }

                _apply(modifications);
                _projectCalculator.performCalculations(self.data);
                self.emit('modified');
                statusBar.changeIcon('ok');
            });
        };

        return self;
    };
})();