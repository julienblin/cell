/**
 * The project coherence keeper - responsible for maintaining coherence between the various entities.
 * Useful when deleting an entity that is referenced in another entity (e.g. profile price <- profile project)
 *
 * This file can be used client-side or server-side (for unit-testing).
 */

(function(exports) {
    "use strict";

    exports.ProjectCoherenceKeeper = function() {
        var self = {};

        var _findFirstCreateWithSameLocalTarget = function(modifications, localTarget) {
            for(var modificationIndex in modifications) {
                var modif = modifications[modificationIndex];
                if(modif.action !== 'create') continue;
                if(!modif.localInfo) continue;
                if(modif.localInfo.target === localTarget) return modif;
            }
            return null;
        };

        /**
         * Regroups create modifications that points to the same localInfo.target
         */
        var _handleCreateModifications = function(modifications, data) {
            var modificationsLoop = modifications.slice(0);
            for(var modificationIndex in modificationsLoop) {
                var modif = modificationsLoop[modificationIndex];
                if(modif.action !== 'create') continue;
                if(!(modif.localInfo && modif.localInfo.target)) continue;

                var previousModif = _findFirstCreateWithSameLocalTarget(modifications, modif.localInfo.target);
                if(previousModif === modif) continue;

                // Copy new values
                for(var propKey in modif.values)
                    previousModif.values[propKey] = modif.values[propKey];

                // Remove modif
                modifications.splice(modifications.indexOf(modif), 1);
            }
        };

        var _handleUpdateModifications = function(modifications, data) {
            var affectedEstimationLine, currentScale, targetScale, scaleIndex, newValue, currentComplexityName, scaleLineIndex;
            var newModifications = [];

            for(var modificationIndex in modifications) {
                var modif = modifications[modificationIndex];
                if(modif.action !== 'update') continue;

                switch(modif.model) {
                    case 'EstimationLine':
                        if(modif.property !== 'scale') continue;
                        if(modif.newValue === modif.oldValue) continue;

                        affectedEstimationLine = null;
                        if(modif.localInfo && modif.localInfo.target) {
                            affectedEstimationLine = modif.localInfo.target;
                        } else {
                            for(var estimationLineIndex in data.estimationLines) {
                                if(data.estimationLines[estimationLineIndex].id === modif.id)
                                    affectedEstimationLine = data.estimationLines[estimationLineIndex];
                            }
                        }

                        if(!affectedEstimationLine) continue;

                        currentScale = null;
                        targetScale = null;
                        for(scaleIndex in data.scales) {
                            if(data.scales[scaleIndex].id === modif.oldValue)
                                currentScale = data.scales[scaleIndex];
                            if(data.scales[scaleIndex].id === modif.newValue)
                                targetScale = data.scales[scaleIndex];
                        }

                        newValue = null;
                        if(currentScale && targetScale) {
                            currentComplexityName = null;
                            for(scaleLineIndex in currentScale.lines) {
                                if(currentScale.lines[scaleLineIndex].id === affectedEstimationLine.complexity) {
                                    currentComplexityName = currentScale.lines[scaleLineIndex].complexity;
                                }
                            }

                            if(currentComplexityName) {
                                var equivalentLine = null;
                                for(scaleLineIndex in targetScale.lines) {
                                    if(targetScale.lines[scaleLineIndex].complexity === currentComplexityName) {
                                        equivalentLine = targetScale.lines[scaleLineIndex];
                                    }
                                }

                                if(equivalentLine)
                                    newValue = equivalentLine.id;
                            }
                        }

                        newModifications.push({
                            model: 'EstimationLine',
                            id: affectedEstimationLine.id,
                            action: 'update',
                            property: 'complexity',
                            oldValue: affectedEstimationLine.complexity,
                            newValue: newValue,
                            localInfo: {
                                target: affectedEstimationLine
                            }
                        });

                        break;
                }
            }

            for(var modifIndex in newModifications)
                modifications.push(newModifications[modifIndex]);
        };

        var _handleDeleteModifications = function(modifications, data) {
            var estimationLineIndex, affectedEstimationLine;
            var newModifications = [];

            for(var modificationIndex in modifications) {
                var modif = modifications[modificationIndex];
                if(modif.action !== 'delete') continue;

                switch(modif.model) {
                    case 'ProfilePrice':
                        for(var profileProjectIndex in data.profileProjects) {
                            var affectedProfileProject = data.profileProjects[profileProjectIndex];
                            if(!affectedProfileProject.id || (affectedProfileProject.profilePrice !== modif.id)) continue;

                            newModifications.push({
                                model: 'ProfileProject',
                                id: affectedProfileProject.id,
                                action: 'update',
                                property: 'profilePrice',
                                oldValue: affectedProfileProject.profilePrice,
                                newValue: null,
                                localInfo: {
                                    target: affectedProfileProject
                                }
                            });
                        }
                        break;

                    case 'Scale':
                        for(estimationLineIndex in data.estimationLines) {
                            affectedEstimationLine = data.estimationLines[estimationLineIndex];
                            if(!affectedEstimationLine.id || (affectedEstimationLine.scale !== modif.id)) continue;

                            newModifications.push({
                                model: 'EstimationLine',
                                id: affectedEstimationLine.id,
                                action: 'update',
                                property: 'scale',
                                oldValue: affectedEstimationLine.scale,
                                newValue: null,
                                localInfo: {
                                    target: affectedEstimationLine
                                }
                            });

                            newModifications.push({
                                model: 'EstimationLine',
                                id: affectedEstimationLine.id,
                                action: 'update',
                                property: 'complexity',
                                oldValue: affectedEstimationLine.complexity,
                                newValue: null,
                                localInfo: {
                                    target: affectedEstimationLine
                                }
                            });
                        }
                        break;

                    case 'ScaleLine':
                        for(estimationLineIndex in data.estimationLines) {
                            affectedEstimationLine = data.estimationLines[estimationLineIndex];
                            if(!affectedEstimationLine.id || (affectedEstimationLine.complexity !== modif.id)) continue;

                            newModifications.push({
                                model: 'EstimationLine',
                                id: affectedEstimationLine.id,
                                action: 'update',
                                property: 'complexity',
                                oldValue: affectedEstimationLine.complexity,
                                newValue: null,
                                localInfo: {
                                    target: affectedEstimationLine
                                }
                            });
                        }
                        break;
                }
            }

            for(var modifIndex in newModifications)
                modifications.push(newModifications[modifIndex]);
        };

        /**
         * Adds necessary modifications to maintain coherence in the data.
         * @param modifications
         * @param data
         */
        self.maintainCoherence = function(modifications, data) {
            _handleCreateModifications(modifications, data);
            _handleUpdateModifications(modifications, data);
            _handleDeleteModifications(modifications, data);
        };

        return self;
    };
})(typeof exports === 'undefined'? window : exports);