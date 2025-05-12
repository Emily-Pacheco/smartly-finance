
const mysql = require('mysql2/promise');
require('dotenv').config();

// connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit:0
});

//test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database Connection established successfully');
    connection.release();
    return true;
  }catch (err){
    console.error('Error connecting to database:', err);
    return false;
  }
}

//initialize database
async function initializeDatabase() {
  try{
    console.log('Checking database tables ');
    const connected = await testConnection();

    if(!connected){
      console.error('Failed to connect, not exeting for testing')
    }
  }catch(err){
    console.error('Failed to initialize database', err);
    //process.exit(1); testing
  }
}

//direct queries
async function query(sql, params){
  try{
    const [results] = await pool.execute(sql, params);
    return [results, null];
  }catch(error){
    console.error('SQL Error:', error);
    return [null, error]
  }
}


initializeDatabase();
module.exports = pool;