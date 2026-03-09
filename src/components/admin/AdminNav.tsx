'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Players', href: '/admin/players' },
  { label: 'Teams', href: '/admin/teams' },
  { label: 'Draft', href: '/admin/draft' },
  { label: 'Trades', href: '/admin/trades' },
  { label: 'Match Types', href: '/admin/match-types' },
  { label: 'Matches', href: '/admin/matches' },
  { label: 'Awards', href: '/admin/awards' },
  { label: 'Tournaments', href: '/admin/tournaments' },
  { label: 'Gallery', href: '/admin/gallery' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex overflow-x-auto border-t border-white/5">
      {NAV_ITEMS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
            pathname.startsWith(href)
              ? 'border-white text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
