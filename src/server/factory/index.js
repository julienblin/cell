/**
 * Configure all the factories for the models
 */

"use strict";

var fakery = require('mongoose-fakery'),
    fs = require('fs');

// Loading all factories
fs.readdirSync(__dirname).forEach(function (file) {
    if(file !== 'index.js')
        require(__dirname + '/' + file);
});

module.exports = fakery;