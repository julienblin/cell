
/**
 * Configuration parameters
 */

var winston = require('winston'),
    MongoDB = require('winston-mongodb').MongoDB;

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { level: 'debug', colorize: true });
winston.add(MongoDB, {
    level: 'info',
    host: 'localhost',
    db: 'cell',
    collection: 'logs',
    safe: false
});


module.exports = {
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