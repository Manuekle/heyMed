import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingClient } from './onboarding-client'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded, username')
    .eq('id', user.id)
    .single()

  // Already onboarded → skip
  if (profile?.onboarded) redirect('/dashboard')

  return (
    <OnboardingClient
      userId={user.id}
      initialUsername={profile?.username ?? user.email?.split('@')[0] ?? ''}
    />
  )
}
