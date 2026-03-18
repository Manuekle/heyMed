import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Global Background Decoration */}
      <div
        className="fixed inset-0 pointer-events-none opacity-50 dark:opacity-100 transition-opacity duration-1000"
        style={{ background: 'radial-gradient(ellipse 80% 40% at 50% -10%, var(--color-primary-transparent) 0%, transparent 60%)' }}
      />
      
      {children}
    </div>
  )
}
