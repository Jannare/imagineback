const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost', // replace with your MySQL host
    user: 'root',      // replace with your MySQL username
    password: 'madcamp123', // replace with your MySQL password
    database: 'oauth_db'
});

module.exports = pool;
