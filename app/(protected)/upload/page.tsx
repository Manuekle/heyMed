import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UploadClient } from './upload-client'

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen transition-colors duration-500">
      <div
        className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, var(--color-primary-transparent) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24">
        <nav className="flex items-center justify-between mb-16">
          <Link
            href="/dashboard"
            className="text-[11px] tracking-[-0.02em] font-medium text-muted-foreground/30 hover:text-foreground transition-all duration-300"
          >
            ← Casos
          </Link>
        </nav>

        <UploadClient userId={user.id} />
      </div>
    </div>
  )
}
