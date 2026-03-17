const mysql = require('mysql2/promise');
const logger = require('./logger');

let pool;

async function initDB() {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'notehub',
    password: process.env.DB_PASSWORD || 'notehub_pass',
    database: process.env.DB_NAME || 'notehub',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  logger.info('Notes DB initialised');
  return pool;
}

function getPool() {
  return pool;
}

module.exports = { initDB, getPool };
