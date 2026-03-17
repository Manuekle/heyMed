import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-5xl font-bold tracking-tight">heyMed!</h1>
      <p className="text-muted text-lg text-center max-w-sm">
        Entrena tu diagnostico clinico con claridad.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          Iniciar sesion
        </Link>
        <Link
          href="/register"
          className="rounded-md border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card"
        >
          Registrarse
        </Link>
      </div>
    </main>
  )
}
