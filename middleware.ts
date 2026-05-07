import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PROTECTED_ROUTES = [
  '/dashboard',
  '/studio',
  '/library',
  '/review',
  '/doubts',
  '/commands',
  '/settings',
]

const AUTH_ROUTES = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Refresh the session on every request
  const { supabaseResponse, user } = await updateSession(request)

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route)

  // Unauthenticated user trying to access protected route → /login
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated user trying to access /login or /signup → /dashboard
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
