import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Javne poti (brez prijave)
  const publicPaths = ['/login', '/api/auth/login', '/api/auth/verify']
  const { pathname } = request.nextUrl

  // Če je pot javna, dovoli dostop
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Preveri token v cookiju ALI authorization headerju
  const token = 
    request.cookies.get('token')?.value || 
    request.headers.get('authorization')?.replace('Bearer ', '')

  // Če ni tokena, preusmeri na login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}