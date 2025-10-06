// lib/db-connection.ts
import mysql from 'mysql2/promise';

// Connection pool za boljšo performance
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Osnovna connection funkcija
export async function getConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Query funkcija za lažjo uporabo
export async function query(sql: string, params?: any[]) {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;