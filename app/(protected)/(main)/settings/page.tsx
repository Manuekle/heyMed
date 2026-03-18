import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, score, avatar_url')
    .eq('id', user.id)
    .single()

  const avatarUrl =
    profile?.avatar_url ??
    (user.user_metadata?.avatar_url as string | undefined) ??
    null

  return (
    <SettingsClient
      userId={user.id}
      email={user.email ?? ''}
      username={profile?.username ?? user.email?.split('@')[0] ?? ''}
      avatarUrl={avatarUrl}
      score={profile?.score ?? 0}
    />
  )
}
