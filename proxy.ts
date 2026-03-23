import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase-server'

export async function proxy(req: NextRequest) {
  const { supabase, res } = createMiddlewareClient(req)

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage      = req.nextUrl.pathname === '/auth'
  const isProtectedPage = req.nextUrl.pathname.startsWith('/dashboard')

  if (!user && isProtectedPage) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth'],
}
