"use client"

import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard'

  return (
    <main 
      className={`relative max-w-5xl mx-auto pt-12 pb-28 md:py-32 ${isDashboard ? 'px-0' : 'px-5'}`}
      style={{ 
        paddingTop: 'calc(4rem + env(safe-area-inset-top))',
        paddingBottom: 'calc(6.5rem + env(safe-area-inset-bottom))' 
      }}
    >
      {children}
      <BottomNav />
    </main>
  )
}
