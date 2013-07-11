/**
 * Gruntfile
 */
 
module.exports = function(grunt) {
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
                files: { src: ['server/**/*.js'] }
            },
            server: {
                options: {
                    node:true
                },
                files: { src: ['server/**/*.js'] }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-jshint');
};