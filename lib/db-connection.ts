// lib/db-connection.ts
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // ✅ 10 sekund timeout za vzpostavitev povezave
  acquireTimeout: 10000, // ✅ 10 sekund za pridobitev povezave iz poola
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

export async function getConnection() {
  return await pool.getConnection()
}

export async function query(sql: string, params?: any[]) {
  let connection
  try {
    connection = await pool.getConnection()
    const [results] = await connection.execute(sql, params)
    return results
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  } finally {
    if (connection) connection.release()
  }
}

// Testiraj povezavo ob zagonu
pool.getConnection()
  .then(conn => {
    console.log('✅ Database pool connected successfully')
    conn.release()
  })
  .catch(err => {
    console.error('❌ Database pool connection failed:', err)
  })
