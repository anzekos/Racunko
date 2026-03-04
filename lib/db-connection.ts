import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

function getNumberEnv(name: string, fallback: number) {
  const raw = process.env[name]
  if (!raw) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

function getPool() {
  if (!pool) {
    const isServerless =
      !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.FUNCTIONS_WORKER_RUNTIME

    const connectionLimit = getNumberEnv('DB_CONNECTION_LIMIT', isServerless ? 3 : 10)
    const connectTimeout = getNumberEnv('DB_CONNECT_TIMEOUT_MS', 30_000)

    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit,
      queueLimit: getNumberEnv('DB_QUEUE_LIMIT', 0),
      connectTimeout,
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
  const queryTimeout = getNumberEnv('DB_QUERY_TIMEOUT_MS', 15_000)
  const slowQueryWarnMs = getNumberEnv('DB_SLOW_QUERY_WARN_MS', 1_500)

  const connection = await getPool().getConnection()
  const startedAt = Date.now()
  try {
    const [results] = await connection.execute(
      { sql, values: params ?? [], timeout: queryTimeout } as any
    )
    return results
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  } finally {
    const elapsedMs = Date.now() - startedAt
    if (elapsedMs >= slowQueryWarnMs) {
      console.warn(`Slow DB query (${elapsedMs}ms): ${sql}`)
    }
    connection.release()
  }
}
