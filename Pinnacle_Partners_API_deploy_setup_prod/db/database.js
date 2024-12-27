const mysql2 = require('mysql2');

const db = mysql2.createPool({
    host: '10.0.5.5',
    port: '3306',
    user: 'console',
    password: 'fQtuJ)D>3216O&',
    database: 'ezeebot',
    connectionLimit: 500,
    waitForConnections: true,
    charset: 'utf8mb4_unicode_ci'
});

db.on('acquire', function (connection) {
    // console.log('Connection %d acquired', connection.threadId);
})

db.on('connection', function (connection) {
    // console.log('Database Connected');
    // connection.query('SET SESSION auto_increment_increment=1')
})

db.on('enqueue', function () {
    // console.log('Waiting for available connection slot');
})

db.on('release', function (connection) {
    // console.log('Connection %d released', connection.threadId);
});

module.exports = db.promise();