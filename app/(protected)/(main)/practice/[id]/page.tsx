import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PracticeClient } from './practice-client'

export type PracticeMode = 'normal' | 'quick' | 'differential' | 'review'

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ difficulty?: string; mode?: string }>
}) {
  const { id } = await params
  const { difficulty, mode: modeParam } = await searchParams
  const mode: PracticeMode =
    modeParam === 'quick' ? 'quick' :
    modeParam === 'differential' ? 'differential' :
    modeParam === 'review' ? 'review' : 'normal'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: caseData } = await supabase
    .from('cases')
    .select('id, description, difficulty, correct_diagnosis, created_at')
    .eq('id', id)
    .single()

  if (!caseData) notFound()

  const { count: caseNumber } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .lte('created_at', caseData.created_at)

  const { count: prevAttempts } = await supabase
    .from('attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('case_id', id)

  let casesQuery = supabase.from('cases').select('id').neq('id', id)
  if (difficulty && difficulty !== 'all') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    casesQuery = (casesQuery as any).eq('difficulty', difficulty)
  }

  const [{ data: otherCases }, { data: userAttempts }] = await Promise.all([
    casesQuery,
    supabase
      .from('attempts')
      .select('case_id, ai_result')
      .eq('user_id', user.id)
      .not('ai_result', 'is', null),
  ])

  const resultScore = (r: string) =>
    r === 'correct' ? 3 : r === 'partial' ? 2 : 1

  const attemptMap = new Map<string, number>()
  for (const a of userAttempts ?? []) {
    const current = attemptMap.get(a.case_id)
    const score = resultScore(a.ai_result)
    if (current === undefined || score < current) {
      attemptMap.set(a.case_id, score)
    }
  }

  const available = (otherCases ?? []).filter(c => (attemptMap.get(c.id) ?? 0) < 3)
  const notAttempted = available.filter(c => !attemptMap.has(c.id))
  const incorrectCases = available.filter(c => attemptMap.get(c.id) === 1)
  const partialCases = available.filter(c => attemptMap.get(c.id) === 2)

  let pool: { id: string }[]
  if (mode === 'review') {
    pool = [...incorrectCases, ...partialCases]
    if (pool.length === 0) pool = available
  } else {
    pool =
      notAttempted.length > 0 ? notAttempted :
      incorrectCases.length > 0 ? incorrectCases :
      partialCases
  }

  const nextCaseId = pool.length > 0
    ? pool[Math.floor(Math.random() * pool.length)].id
    : null

  return (
    <PracticeClient
      caseData={{
        id: caseData.id,
        description: caseData.description,
        difficulty: caseData.difficulty as 'easy' | 'medium' | 'hard',
        caseNumber: caseNumber ?? 1,
        correctDiagnosis: caseData.correct_diagnosis,
      }}
      userId={user.id}
      nextCaseId={nextCaseId}
      difficultyFilter={difficulty ?? 'all'}
      attemptNumber={(prevAttempts ?? 0) + 1}
      mode={mode}
    />
  )
}
