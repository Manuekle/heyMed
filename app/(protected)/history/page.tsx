import { redirect } from 'next/navigation'
import Link from 'next/link'
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

  let query = supabase
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

  if (filter && filter !== 'all') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (query as any).eq('ai_result', filter)
  }

  const { data: attempts } = await query

  type CaseRow = {
    id: string
    description: string
    difficulty: string
    correct_diagnosis: string
  }

  return (
    <div className="min-h-screen transition-colors duration-500">
      <div
        className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, var(--color-primary-transparent) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-5xl mx-auto px-8 py-20 md:py-32">
        <nav className="flex items-center justify-between mb-24">
          <Link
            href="/dashboard"
            className="text-[11px] tracking-[-0.02em] font-medium text-muted-foreground/30 hover:text-foreground transition-all duration-300 group"
          >
            <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">←</span> Inicio
          </Link>
        </nav>

        <h1 className="text-4xl md:text-5xl text-foreground font-semibold tracking-[-0.04em] mb-16">Historial</h1>

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
      </div>
    </div>
  )
}
