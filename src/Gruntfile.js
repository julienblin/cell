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
            serverTest: {
                options: {
                    node:true,
                    predef: [ 'describe', 'it', 'beforeEach', 'afterEach' ],
                    '-W030': true // Expected an assignment or function call and instead saw an expression. (should.be.ok)
                },
                files: { src: ['test/server/**/*.js'] }
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
            },
            client: {
                src: ['test/client/**/*.js']
            }
        },

        cucumberjs: {
            files: 'features'
        }
    });

    grunt.registerTask('lint', 'jshint');

    grunt.registerTask('unit-test', 'mochaTest');
    grunt.registerTask('unit-test:client', 'mochaTest:client');
    grunt.registerTask('unit-test:server', 'mochaTest:server');

    grunt.registerTask('integration-test', 'cucumberjs');

    grunt.registerTask('default', ['lint', 'unit-test', 'integration-test']);
};