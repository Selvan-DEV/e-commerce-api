const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'e_commerce_db'
});

// const pool = mysql.createPool({
//   host: 'beghjv350jzcqpcapmlc-mysql.services.clever-cloud.com',
//   user: 'u6dumgcj4kmxwwmh',
//   password: 'BIugeiLMmKTuhCP1HieK',
//   database: 'beghjv350jzcqpcapmlc'
// });

module.exports = pool.promise();