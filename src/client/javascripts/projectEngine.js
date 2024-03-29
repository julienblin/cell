/**
 * The project engine - coordinates everything related to a project in the page.
 */

var ProjectEngine = (function() {
    "use strict";

    return function(projectId, userId) {
        var self = {};
        self.__proto__ = EventEmitter();
        self.projectId = projectId;
        self.userId = userId;

        // Must be there before the renderes top make sure value is updated before they refresh.
        self.on('modified', function() {
            self.isUserReadOnly = self.isSnapshot || _.findWhere(self.data.usersRead, { id: self.userId }) ? true : false;
            self.isReadOnly = (self.isSnapshot || self.data.isLocked || self.isUserReadOnly);
        });

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

        var _projectCoherenceKeeper = new ProjectCoherenceKeeper();
        var _projectCalculator = new ProjectCalculator();

        /**
         * Find the target document in data using the model name and id; Can also retrieve the parent collection only
         * Returns an array containing : [the document, the parent collection]
         * Returns null if not found.
         */
        var _findTargetDoc = function(model, id, parentId) {
            var parentScale;
            switch(model) {
                case 'Project':
                    return [self.data, null, null];
                case 'ProfilePrice':
                    if(!id) return [null, self.data.profilePrices];
                    var profilePrice = _.findWhere(self.data.profilePrices, { id: id });
                    if(!profilePrice) return null;
                    return [profilePrice, self.data.profilePrices];
                case 'ProfileProject':
                    if(!id) return [null, self.data.profileProjects];
                    var profileProject = _.findWhere(self.data.profileProjects, { id: id });
                    if(!profileProject) return null;
                    return [profileProject, self.data.profileProjects];
                case 'Scale':
                    if(!id) return [null, self.data.scales];
                    var scale = _.findWhere(self.data.scales, { id: id });
                    if(!scale) return null;
                    return [scale, self.data.scales];
                case 'ScaleColumn':
                    parentScale = _.findWhere(self.data.scales, { id: parentId });
                    if (!parentScale) return null;
                    if (!parentScale.columns) parentScale.columns = [];
                    if(!id) return [null, parentScale.columns];
                    var scaleColumn = _.findWhere(parentScale.columns, { id: id });
                    if(!scaleColumn) return null;
                    return [scaleColumn, parentScale.columns];
                case 'ScaleLine':
                    parentScale = _.findWhere(self.data.scales, { id: parentId });
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
        var _valueEquals = function(value1, value2) {
            if (value1 == value2) return true;

            if((value1 instanceof Array) && (value1.length === 0)) value1 = null;
            if((value2 instanceof Array) && (value2.length === 0)) value2 = null;
            return (!value1 && !value2);
        };

        var _getValueAtPath = function(obj, path) {
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

        var _setValueAtPath = function(obj, path, value) {
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
                    var targetDoc;

                    switch(modification.action) {
                        case 'create':
                            var newDoc = modification.values;
                            newDoc.id = modification.id;
                            if(modification.insertAfter) {
                                var previousDoc = _findTargetDoc(modification.model, modification.insertAfter, modification.parentId);
                                if(!previousDoc) {
                                    notify.fatal("Unable to apply changes. Reason: unable to find previous document for model " + modification.model + " with id " + modification.insertAfter);
                                }
                                previousDoc[1].splice(previousDoc[1].indexOf(previousDoc[0]) + 1, 0, newDoc);
                            } else {
                                var parentCollection = _findTargetDoc(modification.model, null, modification.parentId);
                                if(!parentCollection) {
                                    notify.fatal("Unable to apply changes. Reason: unable to find collection for model " + modification.model);
                                    return;
                                }
                                parentCollection[1].splice(0, 0, newDoc);
                            }
                            modification.localInfo = modification.localInfo || {};
                            modification.localInfo.target = newDoc;
                            break;
                        case 'update':
                            targetDoc = _findTargetDoc(modification.model, modification.id, modification.parentId);
                            if(!targetDoc) {
                                notify.fatal("Unable to apply changes. Reason: unable to find model " + modification.model + " with id " + modification.id);
                                return;
                            }

                            for(var property in modification.values) {
                                var valuesArray =  modification.values[property];
                                if(!(valuesArray && valuesArray.length === 2)) return;
                                var oldValue = valuesArray[0];
                                var newValue = valuesArray[1];

                                var currentValue = _getValueAtPath(targetDoc[0], property);

                                if(!_valueEquals(currentValue, oldValue)) {
                                    ++self.stats.numberOfDiscardedUpdates;
                                    console.log({ message: "Discarding update because of unmatched previous values", doc: targetDoc, modification: modification });
                                    return;
                                }
                                _setValueAtPath(targetDoc[0], property, newValue);
                            }
                            break;
                        case 'delete':
                            targetDoc = _findTargetDoc(modification.model, modification.id, modification.parentId);
                            if(!targetDoc) {
                                notify.fatal("Unable to apply changes. Reason: unable to find model " + modification.model + " with id " + modification.id);
                                return;
                            }
                            modification.localInfo = modification.localInfo || {};
                            modification.localInfo.target = targetDoc[0];
                            modification.localInfo.position = targetDoc[1].indexOf(targetDoc[0]);
                            targetDoc[1].splice(modification.localInfo.position, 1);
                            break;
                        default:
                            notify.fatal('Internal error - unrecognized action ' + modification.action);
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
                        notify.fatal("Unable to send modifications to server. Reason:" + err.message);
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
                        }
                        return null;
                    }));

                    if(failedModifications.length > 0) {
                        _.each(failedModifications, function(failedModif) {
                            notify.warning("Some changes have been reverted. Reason:" + failedModif.result.statusMessage);

                            var modification = failedModif.modification,
                                parentCollection;
                            switch(modification.action) {
                                case 'create':
                                    parentCollection = _findTargetDoc(modification.model, null, modification.parentId)[1];
                                    var indexOfTarget = parentCollection.indexOf(modification.localInfo.target);
                                    if(indexOfTarget != -1) {
                                        parentCollection.splice(indexOfTarget, 1);
                                    }
                                    break;
                                case 'update':
                                    var targetDoc = _findTargetDoc(modification.model, modification.id, modification.parentId);
                                    if(targetDoc) {

                                        for(var property in modification.values) {
                                            var valuesArray =  modification.values[property];
                                            if(valuesArray && valuesArray.length === 2) {
                                                var oldValue = valuesArray[0];
                                                var newValue = valuesArray[1];
                                                if(_valueEquals(targetDoc[0][property], newValue)) {
                                                    targetDoc[0][property] = oldValue;
                                                }
                                            }
                                        }
                                    }
                                    break;
                                case 'delete':
                                    var originalDoc = modification.localInfo.target;
                                    parentCollection = _findTargetDoc(modification.model, null, modification.parentId)[1];
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

        var _integrateSetAuth = function(user, auth) {
            switch(auth) {
                case 'read':
                    self.data.usersRead.push(user);
                    break;
                case 'write':
                    self.data.usersWrite.push(user);
                    break;
                case 'none':
                    var foundUser = _.findWhere(self.data.usersRead, { id: user.id });
                    if(foundUser)
                        self.data.usersRead.splice(self.data.usersRead.indexOf(foundUser), 1);
                    foundUser = _.findWhere(self.data.usersWrite, { id: user.id });
                    if(foundUser)
                        self.data.usersWrite.splice(self.data.usersWrite.indexOf(foundUser), 1);
                    break;
            }
            self.emit('modified');
        };

        // Event subscriptions

        window.onerror = function(msg, url, line) {
            notify.fatal('Execution error. Reason: ' + msg + '.');
            statusBar.changeIcon('error');
        };

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
        self.init = function(snapshotData) {
            if (navigator.userAgent.indexOf('Zombie.js') != -1) {
                notify.warning("Zombie.js navigator detected - socket.io disabled.");
                return;
            }

            if(snapshotData) {
                self.isSnapshot = true;
                $('#tabUser').remove();
                self.data = JSON.parse(snapshotData.data);
                self.data.createdAt = snapshotData.createdAt;
                self.snapshotTitle = snapshotData.title;
                self.emit('modified');
            } else {
                self.isSnapshot = false;

                var loadingNotification = notify.info('Loading project...');
                statusBar.changeIcon('loading');

                var socketUrl = window.location.protocol + '//' + window.location.hostname;
                if (window.location.port) {
                    socketUrl += ':' + window.location.port;
                }
                self.socket = io.connect(socketUrl + '/project');

                self.stats.state = 'connected';

                self.socket.on('disconnect', function() {
                    notify.fatal("You've been disconnected from the server.");
                    statusBar.changeIcon('error');
                    self.stats.state = 'disconnected';
                });

                self.socket.emit('getDataAndSubscribe', projectId, function(err, data) {
                    statusBar.changeIcon('ok');
                    if (err) {
                        loadingNotification.dismiss();
                        statusBar.changeIcon('error');
                        notify.fatal("There has been an error while loading project data. Reason: " + err.message);
                        return;
                    }
                    self.data = data;
                    _projectCalculator.performCalculations(self.data);
                    self.emit('modified');
                    loadingNotification.transform({
                        text: 'Project loaded - good to go!',
                        type: 'success'
                    });
                });

                self.socket.on('receiveUpdates', function(modifications) {
                    statusBar.changeIcon('loading');
                    ++self.stats.numberOfReceivedUpdates;
                    if(!self.data) {
                        notify.fatal("There has been an concurrency error while loading project.");
                        statusBar.changeIcon('error');
                        return;
                    }

                    _apply(modifications);
                    _projectCalculator.performCalculations(self.data);
                    self.emit('modified');
                    statusBar.changeIcon('ok');
                });

                self.socket.on('setAuth', function(user, auth) {
                    ++self.stats.numberOfReceivedUpdates;
                    _integrateSetAuth(user, auth);
                });

                self.socket.on('userJoined', function(user) {
                    notify.info(user.username + ' just joined the conversation.');
                });
            }
        };

        self.applyModifications = function(modifications) {
            _projectCoherenceKeeper.maintainCoherence(modifications, self.data);
            _apply(modifications);
            _projectCalculator.performCalculations(self.data);
            self.emit('modified');
            _broadcast(modifications);
        };

        self.setAuth = function(userId, auth) {
            if(self.socket) {
                ++self.stats.numberOfSentUpdates;
                statusBar.changeIcon('loading');
                self.socket.emit('setAuth', userId, auth, function(err, newUser) {
                    if (err) {
                        statusBar.changeIcon('error');
                        notify.fatal("There has been an error while adding user. Reason: " + err.message);
                        return;
                    }
                    _integrateSetAuth(newUser, auth);
                    statusBar.changeIcon('ok');
                });
            }
        };

        return self;
    };
})();