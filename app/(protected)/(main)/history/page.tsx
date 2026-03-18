import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HistoryClient } from './history-client'

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: attempts } = await supabase
    .from('attempts')
    .select(`
      id,
      created_at,
      user_answer,
      ai_result,
      ai_explanation,
      cases (
        id,
        description,
        difficulty,
        correct_diagnosis
      )
    `)
    .eq('user_id', user.id)
    .not('ai_result', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  type CaseRow = {
    id: string
    description: string
    difficulty: string
    correct_diagnosis: string
  }

  return (
    <HistoryClient
      attempts={(attempts ?? []).map(a => {
        const c = a.cases as unknown as CaseRow | null
        return {
          id: a.id,
          createdAt: a.created_at,
          userAnswer: a.user_answer,
          aiResult: a.ai_result as 'correct' | 'partial' | 'incorrect',
          aiExplanation: a.ai_explanation,
          caseId: c?.id ?? '',
          caseDescription: c?.description ?? '',
          caseDifficulty: (c?.difficulty ?? 'medium') as 'easy' | 'medium' | 'hard',
          correctDiagnosis: c?.correct_diagnosis ?? '',
        }
      })}
      activeFilter={(filter ?? 'all') as 'all' | 'correct' | 'partial' | 'incorrect'}
    />
  )
}
