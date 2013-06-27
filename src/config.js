
/**
 * Configuration parameters
 */

var winston = require('winston');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { level: 'debug', colorize: true });


module.exports = {
    app: {
        name: 'Cell',
        version: '0.1.0',
        copyright: 'Copyright Julien Blin 2013'
    },

    env: 'development',

    web: {
        port : 3000,
        sessionSecret : 'spoc6lu7than'
    },

    db: {
        url: 'mongodb://localhost/cell',
        keepAlive: 1,
        poolSize: 10,
        seed: true
    }
};