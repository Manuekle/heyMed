import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="relative max-w-5xl mx-auto px-5 py-20 md:py-32">
      {children}
    </main>
  )
}
