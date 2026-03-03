import BottomNav from '@/components/layout/BottomNav'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Fixed full-screen background — does not scroll */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-green-950 via-gray-900 to-gray-950" />

      {/* App shell — fills dynamic viewport height, flex column */}
      <div className="flex flex-col h-[100dvh]">
        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Fixed bottom nav — does not scroll */}
        <BottomNav />
      </div>
    </>
  )
}
