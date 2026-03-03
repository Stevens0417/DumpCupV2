'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NotAuthorizedPage() {
  useEffect(() => {
    // Force sign out — user is authenticated but not in app_admins
    createClient().auth.signOut()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 text-center">
      <h1 className="text-xl font-bold text-red-400 mb-2">Not Authorized</h1>
      <p className="text-gray-400 text-sm mb-6">
        Your account does not have admin access.
      </p>
      <Link
        href="/scoreboard"
        className="text-sm text-green-400 hover:text-green-300 transition-colors"
      >
        ← Back to Public Site
      </Link>
    </div>
  )
}
