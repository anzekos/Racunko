import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 3, // Manj na serverless!
      queueLimit: 0,
      connectTimeout: 30000, // 30 sekund
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    })
  }
  return pool
}

export async function getConnection() {
  return await getPool().getConnection()
}

export async function query(sql: string, params?: any[]) {
  const connection = await getPool().getConnection()
  try {
    const [results] = await connection.execute(sql, params)
    return results
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  } finally {
    connection.release()
  }
}
