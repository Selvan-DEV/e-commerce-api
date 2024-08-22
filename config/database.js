const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1Apple1@123',
  database: 'shoppinAppDB'
});

module.exports = pool.promise();