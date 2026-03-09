import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isUserAdmin } from '@/lib/auth/isUserAdmin'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Single getUser() call for the entire request — validates JWT server-side.
  // Passed to isUserAdmin() as preloadedUser to avoid a second getUser() call.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isLoginPath = pathname === '/admin/login'
  const isNotAuthorizedPath = pathname.startsWith('/admin/not-authorized')
  const isProtectedAdmin = pathname.startsWith('/admin') && !isLoginPath && !isNotAuthorizedPath

  // Not authenticated → redirect to login
  if (isProtectedAdmin && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Authenticated but not in app_admins → redirect to not-authorized
  if (isProtectedAdmin && user) {
    const admin = await isUserAdmin(supabase, user)
    if (!admin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/not-authorized'
      return NextResponse.redirect(url)
    }
  }

  // Already-authenticated admin visiting login → send to players
  if (isLoginPath && user) {
    const admin = await isUserAdmin(supabase, user)
    if (admin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/players'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
