/**
 * Gruntfile
 */

module.exports = function(grunt) {
    "use strict";

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-cucumber');

    grunt.initConfig({
        jshint: {
            options: {
                strict: true,
                laxbreak: true
            },
            server: {
                options: {
                    node:true
                },
                files: { src: ['Gruntfile.js', 'server/**/*.js'] }
            },
            client: {
                options: {
                    browser:true,
                    jquery: true,
                    '-W064': true, // Missing 'new' prefix when invoking a constructor
                    '-W103': true // The '__proto__' property is deprecated.
                },
                files: { src: ['client/javascripts/**/*.js', '!client/javascripts/lib/**/*.js', '!client/javascripts/projectCalculator.js'] }
            }
        },

        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    ui: 'bdd'
                },
                src: ['test/**/*.js']
            }
        },

        cucumberjs: {
            files: 'features'
        }
    });

    grunt.registerTask('default', ['jshint', 'mochaTest', 'cucumberjs']);
};