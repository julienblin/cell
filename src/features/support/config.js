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
        copyright: 'Copyright Julien Blin 2013'
    },

    env: 'production',

    web: {
        port: 3200,
        sessionSecret : 'rho5deth6zij'
    },

    db: {
        url: 'mongodb://localhost/cell_features',
        keepAlive: 1,
        seed: false
    }
};
