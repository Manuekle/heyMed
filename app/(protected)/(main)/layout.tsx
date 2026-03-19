import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { BottomNav } from '@/components/bottom-nav'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main 
      className="relative max-w-5xl mx-auto px-5 pt-12 pb-40 md:py-32"
      style={{ 
        paddingTop: 'calc(4rem + env(safe-area-inset-top))',
        paddingBottom: 'calc(10rem + env(safe-area-inset-bottom))' 
      }}
    >
      {children}
      <BottomNav />
    </main>
  )
}
