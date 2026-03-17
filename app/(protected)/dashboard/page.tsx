import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/sign-out-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted text-sm">Bienvenido, {user?.email}</p>
        <SignOutButton />
      </div>
    </main>
  )
}
