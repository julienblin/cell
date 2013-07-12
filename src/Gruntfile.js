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
                laxbreak: true,
                proto: true
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
                },
                files: { src: ['client/javascripts/**/*.js', '!client/javascripts/lib/**/*.js', '!client/javascripts/projectCalculator.js'] }
            }
        },

        mochaTest: {
            options: {
                reporter: 'spec',
                ui: 'bdd'
            },
            server: {
                src: ['test/server/**/*.js']
            }
        },

        cucumberjs: {
            files: 'features'
        }
    });

    grunt.registerTask('default', ['jshint', 'mochaTest', 'cucumberjs']);
};