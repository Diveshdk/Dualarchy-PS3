import { createServerClient } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/auth/login', '/auth/sign-up', '/auth/sign-up-success', '/auth/callback', '/auth/error']
const SALES_BLOCKED = ['/dashboard/inventory', '/dashboard/analytics']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public routes pass through
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Root redirect
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protected routes - update session first
  if (pathname.startsWith('/dashboard')) {
    const response = await updateSession(request)
    console.log('[Middleware] updateSession returned status:', response?.status)

    // If redirect to login (307/308), pass through
    if (response && (response.status === 307 || response.status === 308)) {
      return response
    }

    // Check role-based route restrictions
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              // cookies are already handled by updateSession
            },
          },
        },
      )
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, branch_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      // Sales cannot access inventory or analytics
      if (profile.role === 'sales' && SALES_BLOCKED.some((r) => pathname.startsWith(r))) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Branch managers and sales without a branch → pending page
      if (
        profile.role !== 'owner' &&
        !profile.branch_id &&
        !pathname.startsWith('/dashboard/pending-assignment')
      ) {
        return NextResponse.redirect(new URL('/dashboard/pending-assignment', request.url))
      }

      // Don't let assigned users get stuck on pending page
      if (profile.branch_id && pathname.startsWith('/dashboard/pending-assignment')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      // If profile check fails, let supabase handle it
      console.error('[Middleware] Error in profile check:', error)
    }

    console.log('[Middleware] returning response with status:', (response || NextResponse.next()).status)
    return response || NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
