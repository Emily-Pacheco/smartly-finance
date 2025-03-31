const mysql = require('mysql2');
require('dotenv').config();

// connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10
});

// Promisify for async/await usage
const promisePool = pool.promise();

module.exports = promisePool;