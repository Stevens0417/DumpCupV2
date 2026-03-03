import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/admin/LogoutButton'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-white/10">
        <header className="flex items-center justify-between px-4 h-14">
          <span className="font-semibold text-sm tracking-wide">Dump Cup Admin</span>
          <div className="flex items-center gap-3">
            {user && <LogoutButton />}
            <Link
              href="/scoreboard"
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              ← Public
            </Link>
          </div>
        </header>
        {user && <AdminNav />}
      </div>
      <main className="px-4 py-6">{children}</main>
    </div>
  )
}
