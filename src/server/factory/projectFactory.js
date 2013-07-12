/**
 * Factory for profiles.
 * Parameters Factory-Lady, but don't export anything
 */

"use strict";

var factory = require('mongoose-fakery'),
    Project = require('../models/project');

factory.fake('project', Project, {
    clientName: factory.g.name(),
    projectName: factory.g.name(),
    description: factory.g.lorem(),
    isLocked: false
});