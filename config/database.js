const mysql = require('mysql2');

// const pool = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'e_commerce_db'
// });

const pool = mysql.createPool({
  host: 'turntable.proxy.rlwy.net',
  user: 'root',
  password: 'fPUkYJoRrenwmSlNRxCztTxVJOeSUTVC',
  database: 'e-commerce-db',
  port: 10244
});

module.exports = pool.promise();