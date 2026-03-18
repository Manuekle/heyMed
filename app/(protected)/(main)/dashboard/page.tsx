import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check onboarding
  const { data: onboardCheck } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .single()

  if (onboardCheck && !onboardCheck.onboarded) redirect('/onboarding')

  const [
    { data: cases },
    { data: profile },
    { data: accuracy },
    { data: recentAttempts },
    { data: attemptStats },
  ] = await Promise.all([
    supabase
      .from('cases')
      .select('id, description, difficulty, system, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('username, score, streak, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase.rpc('get_user_accuracy', { p_user_id: user.id }),
    supabase
      .from('attempts')
      .select('ai_result, created_at')
      .eq('user_id', user.id)
      .not('ai_result', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('attempts')
      .select('case_id, ai_result')
      .eq('user_id', user.id),
  ])

  const attemptMap = new Map<string, string>()
  if (attemptStats) {
    for (const a of attemptStats) {
      if (a.ai_result) attemptMap.set(a.case_id, a.ai_result)
    }
  }

  const avatarUrl =
    (profile as { avatar_url?: string | null } | null)?.avatar_url ??
    (user.user_metadata?.avatar_url as string | undefined) ??
    null

  return (
    <DashboardClient
      cases={(cases ?? []).map((c, i) => ({
        ...c,
        difficulty: c.difficulty as 'easy' | 'medium' | 'hard',
        system: c.system ?? 'otro',
        caseNumber: (cases ?? []).length - i,
        lastResult: attemptMap.get(c.id) ?? null,
      }))}
      profile={{
        username: profile?.username ?? user.email?.split('@')[0] ?? '—',
        score: profile?.score ?? 0,
        streak: (profile as { streak?: number } | null)?.streak ?? 0,
        avatar_url: avatarUrl,
      }}
      userEmail={user.email ?? ''}
      avatarUrl={avatarUrl}
      accuracy={accuracy as { total: number; correct: number; partial: number; incorrect: number; accuracy: number } | null}
      trend={(recentAttempts ?? []).map(a => a.ai_result as 'correct' | 'partial' | 'incorrect')}
    />
  )
}
