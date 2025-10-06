// app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db-connection';

export async function GET() {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    connection.release();

    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully!',
      result: rows 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      env: {
        hasHost: !!process.env.DB_HOST,
        hasUser: !!process.env.DB_USER,
        hasPassword: !!process.env.DB_PASSWORD,
        hasDatabase: !!process.env.DB_NAME
      }
    }, { status: 500 });
  }
}