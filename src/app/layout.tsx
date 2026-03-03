import type { Metadata, Viewport } from 'next'
import '@/styles/global.css'

export const metadata: Metadata = {
  title: 'Dump Cup',
  description: 'Ryder Cup-style golf tournament tracker',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  )
}
