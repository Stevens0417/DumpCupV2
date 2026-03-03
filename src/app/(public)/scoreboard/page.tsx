import Link from 'next/link'

export default function ScoreboardPage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Page content */}
      <div className="flex-1 px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white mb-1">Scoreboard</h1>
        <p className="text-gray-400 text-sm mb-6">Season standings will appear here.</p>

        {/* Placeholder rows for scroll testing */}
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/5 border border-white/5" />
          ))}
        </div>
      </div>

      {/* Admin button — sticky at bottom of scroll area, always visible */}
      <div className="sticky bottom-0 flex justify-center px-4 py-3 bg-gradient-to-t from-gray-950/70 to-transparent">
        <Link
          href="/admin/login"
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-4 py-1"
        >
          Admin
        </Link>
      </div>
    </div>
  )
}
