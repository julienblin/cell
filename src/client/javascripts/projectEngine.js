/**
 * The project engine - coordinates everything related to a project in the page.
 */

var ProjectEngine = (function() {
    return function(projectId) {
        var _socket, _projectCalculator;

        var self = {};
        self.__proto__ = EventEmitter();
        self.projectId = projectId;
        self.renderers = {
            info: new InfoRenderer(self),
            profiles: new ProfilesRenderer(self)
        };
        _projectCalculator = new ProjectCalculator();

        /**
         * Find the target document in data using the model name and id, and returns [it, parent];
         */
        _findTargetDoc = function(model, id) {
            switch(model) {
                case 'Project':
                    return [self.data, null];
                case 'Profile':
                    if(!id) return [null, self.data.profiles];
                    var profile = _.findWhere(self.data.profiles, { id: id });
                    if(!profile) return null;
                    return [profile, self.data.profiles];
            }
            return null;
        };

        /**
         * Checks equality of two values, considering that null, undefined, etc are equals.
         */
        _valueEquals = function(value1, value2) {
            if (value1 === value2) return true;
            return (!value1 && !value2);
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
                                var previousDoc = _findTargetDoc(modification.model, modification.insertAfter);
                                if(!previousDoc) {
                                    alerts.fatal("Unable to apply changes. Reason: unable to find previous document for model " + modification.model + " with id " + modification.insertAfter);
                                }
                                previousDoc[1].splice(previousDoc[1].indexOf(previousDoc[0]) + 1, 0, newDoc);
                            } else {
                                var parentCollection = _findTargetDoc(modification.model, null);
                                if(!parentCollection) {
                                    alerts.fatal("Unable to apply changes. Reason: unable to find collection for model " + modification.model);
                                    return;
                                }
                                parentCollection[1].splice(parentCollection[1].length, 0, newDoc);
                            }
                            modification.localInfo = modification.localInfo || {};
                            modification.localInfo.target = newDoc;
                            break;
                        case 'update':
                            var targetDoc = _findTargetDoc(modification.model, modification.id);
                            if(!targetDoc) {
                                alerts.fatal("Unable to apply changes. Reason: unable to find model " + modification.model + " with id " + modification.id);
                                return;
                            }
                            if(!_valueEquals(targetDoc[0][modification.property], modification.oldValue)) {
                                console.log({ message: "Discarding update because of unmatched previous values", doc: targetDoc, modification: modification });
                                return;
                            }
                            targetDoc[0][modification.property] = modification.newValue;
                            break;
                        case 'delete':
                            var targetDoc = _findTargetDoc(modification.model, modification.id);
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
            if (_socket) {
                var modificationsToSend = _.map(modifications, function(modification) {
                    return _.omit(modification, 'localInfo');
                });
                _socket.emit('modify', modificationsToSend, function(err, results) {
                    if (err) {
                        alerts.fatal("Unable to send modifications to server. Reason:" + err.message);
                        return;
                    }

                    var failedModifications = [];
                    _.each(results, function(result, index) {
                        if(result.status === "success") {
                            if (result.id) {
                                modifications[index].localInfo.target.id = result.id;
                            }
                        }
                    });

                    var failedModifications = _.compact(_.map(results, function(result, index) {
                        if(result.status != "success") {
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
                                    var parentCollection = _findTargetDoc(modification.model, null);
                                    var indexOfTarget = parentCollection.indexOf(modification.localInfo.target);
                                    if(indexOfTarget != -1) {
                                        parentCollection.splice(indexOfTarget, 1);
                                    }
                                case 'update':
                                    var targetDoc = _findTargetDoc(modification.model, modification.id);
                                    if(targetDoc) {
                                        if(_valueEquals(targetDoc[0][modification.property], modification.newValue)) {
                                            targetDoc[0][modification.property] = modification.oldValue;
                                        }
                                    }
                                    break;
                                case 'delete':
                                    var originalDoc = modification.localInfo.target;
                                    var parentCollection = _findTargetDoc(modification.model, null);
                                    parentCollection[1].splice(modification.localInfo.position, 0, originalDoc);
                            }

                        });
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
        };

        // Public functions
        self.init = function() {
            if (navigator.userAgent.indexOf('Zombie.js') != -1) {
                alerts.warning("Zombie.js navigator detected - socket.io disabled.");
                return;
            }

            var loadingAlert = alerts.info('Loading project...');
            var socketUrl = window.location.protocol + '//' + window.location.hostname;
            if (window.location.port) {
                socketUrl += ':' + window.location.port;
            }
            _socket = io.connect(socketUrl + '/project');

            _socket.on('disconnect', function() {
                alerts.fatal("You've been disconnected from the server.");
            });

            _socket.emit('getDataAndSubscribe', projectId, function(err, data) {
                loadingAlert.dismiss();
                if (err) {
                    alerts.fatal("There has been an error while loading project data. Reason: " + err.message);
                    return;
                }
                self.data = data;
                _projectCalculator.performCalculations(self.data);
                self.emit('modified');
                alerts.success('Project loaded - good to go!', 3000);
            });

            _socket.on('receiveUpdates', function(modifications) {
                if(!self.data) {
                    alerts.fatal("There has been an concurrency error while loading project.");
                    return;
                }

                _apply(modifications);
                _projectCalculator.performCalculations(self.data);
                self.emit('modified');
            });
        };

        return self;
    };
})();