/**
 * Configuration parameters for tests
 */

var winston = require('winston');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { level: 'info', colorize: true });

module.exports = {
    app: {
        name: 'Cell',
        version: 'latest',
        copyright: '© CGI 2013'
    },

    env: 'production',

    web: {
        port: 3200,
        sessionSecret : 'rho5deth6zij'
    },

    db: {
        url: 'mongodb://localhost/cell_test',
        keepAlive: 0,
        poolSize: 1,
        seed: false
    }
};
