import BottomNav from '@/components/layout/BottomNav'
import StandaloneDetector from '@/components/layout/StandaloneDetector'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Fixed full-screen background — does not scroll */}
      <div className="fixed inset-0 -z-10" style={{ backgroundColor: '#0E1A2B' }} />

      {/*
       * Adds `is-standalone` to <body> when running as an installed PWA.
       * This activates the body.is-standalone CSS fallback in global.css for
       * iOS Safari versions that don't support @media (display-mode: standalone).
       */}
      <StandaloneDetector />

      {/* App shell — fills dynamic viewport height, flex column */}
      <div className="flex flex-col h-[100dvh]">
        {/*
         * pwa-pt-safe: in standalone mode only, adds padding-top equal to
         * env(safe-area-inset-top) so content clears the Dynamic Island / notch.
         * Has no effect in normal browser Safari (env() returns 0 there because
         * the browser chrome already accounts for the status bar).
         */}
        <main className="flex-1 overflow-y-auto pwa-pt-safe">
          {children}
        </main>

        {/* Fixed bottom nav — does not scroll */}
        <BottomNav />
      </div>
    </>
  )
}
