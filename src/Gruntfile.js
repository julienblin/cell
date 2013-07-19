/**
 * Gruntfile
 */

module.exports = function(grunt) {
    "use strict";

    grunt.loadNpmTasks('grunt-git-describe');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-cucumber');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        'git-describe': {
            options: {
                prop: 'git-version',
                dirtyMark: '',
                cwd: '..'
            },
            cell: {}
        },
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
                    '-W007': true // Confusing pluses
                },
                files: { src: ['client/javascripts/**/*.js', '!client/javascripts/lib/**/*.js'] }
            },
            clientTest: {
                options: {
                    browser:true,
                    predef: [ 'describe', 'it', 'beforeEach', 'afterEach' ]
                },
                files: { src: ['test/client/**/*.js'] }
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

    grunt.registerTask('write-package-version', function() {
        grunt.task.requires('git-describe:cell');
        var gitVersion = grunt.config('git-version');
        var pkg = grunt.config('pkg');
        var currentVersion = pkg.version;
        if(gitVersion !== currentVersion) {
            pkg.version = gitVersion;
            grunt.file.write('package.json', JSON.stringify(pkg, null, 2) + '\n');
            grunt.log.ok('Updated version to ' + gitVersion);
            grunt.config('pkg', pkg);
        }
    });

    grunt.registerTask('version', ['git-describe', 'write-package-version']);

    grunt.registerTask('lint', 'jshint');

    grunt.registerTask('unit-test', 'mochaTest');
    grunt.registerTask('unit-test:client', 'mochaTest:client');
    grunt.registerTask('unit-test:server', 'mochaTest:server');

    grunt.registerTask('integration-test', 'cucumberjs');

    grunt.registerTask('default', ['version', 'lint', 'unit-test', 'integration-test']);
};