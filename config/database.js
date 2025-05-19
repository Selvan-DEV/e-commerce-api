const mysql = require('mysql2');

// const pool = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'e_commerce_db'
// });

// const pool = mysql.createPool({
//   host: 'turntable.proxy.rlwy.net',
//   user: 'root',
//   password: 'fPUkYJoRrenwmSlNRxCztTxVJOeSUTVC',
//   database: 'e-commerce-db',
//   port: 10244
// });

const pool = mysql.createPool({
  host: '89.116.21.79',
  user: 'root',
  password: 'Nilaash@2020',
  database: 'nilaa_foods_db',
  port: 3306
});

module.exports = pool.promise();