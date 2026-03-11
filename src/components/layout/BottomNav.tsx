'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const LEFT_ITEMS = [
  { href: '/stats', label: 'Stats', src: '/images/nav-stats.png' },
  { href: '/tournaments', label: 'Events', src: '/images/nav-tournaments.png' },
]

const RIGHT_ITEMS = [
  { href: '/history', label: 'History', src: '/images/nav-history.png' },
  { href: '/gallery', label: 'Gallery', src: '/images/nav-gallery.png' },
]

export default function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/' || pathname === '/scoreboard'
    return pathname === href
  }

  return (
    <nav className="flex-shrink-0 bg-gray-950/95 backdrop-blur-md border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-20 px-1">
        {LEFT_ITEMS.map(({ href, label, src }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-2 py-1 transition-opacity ${
              isActive(href) ? 'opacity-100' : 'opacity-60 hover:opacity-85'
            }`}
          >
            <Image
              src={src}
              alt={label}
              width={46}
              height={46}
              className="object-contain drop-shadow"
            />
            <span className="text-[9px] font-medium text-white tracking-wide">{label}</span>
          </Link>
        ))}

        {/* Center — Scoreboard / Dump Cup home */}
        <Link
          href="/"
          className={`flex flex-col items-center px-2 py-1 transition-opacity ${
            isActive('/') ? 'opacity-100' : 'opacity-60 hover:opacity-85'
          }`}
        >
          <Image
            src="/images/nav-scoreboard.png"
            alt="Scoreboard"
            width={64}
            height={64}
            className="object-contain drop-shadow"
          />
        </Link>

        {RIGHT_ITEMS.map(({ href, label, src }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-2 py-1 transition-opacity ${
              isActive(href) ? 'opacity-100' : 'opacity-60 hover:opacity-85'
            }`}
          >
            <Image
              src={src}
              alt={label}
              width={46}
              height={46}
              className="object-contain drop-shadow"
            />
            <span className="text-[9px] font-medium text-white tracking-wide">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
