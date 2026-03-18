'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { CaseCard } from '@/components/case-card'
import { CaseFolder } from '@/components/case-folder'
import { BlurFade } from '@/components/ui/blur-fade'
import { HugeiconsIcon } from '@hugeicons/react'
import { 
  Upload01Icon, 
  Clock01Icon, 
  Settings01Icon, 
  Logout01Icon, 
  UserCircleIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon
} from '@hugeicons/core-free-icons'

const difficultyConfig = {
  easy: { label: 'Básico', dot: 'bg-emerald-400/50', text: 'text-emerald-400/60' },
  medium: { label: 'Moderado', dot: 'bg-amber-400/50', text: 'text-amber-400/60' },
  hard: { label: 'Complejo', dot: 'bg-rose-400/50', text: 'text-rose-400/60' },
}

const resultConfig = {
  correct: { icon: '◎', color: 'text-emerald-400/60' },
  partial: { icon: '◑', color: 'text-amber-400/60' },
  incorrect: { icon: '○', color: 'text-rose-400/60' },
}

const trendColors = {
  correct: 'bg-emerald-400/70',
  partial: 'bg-amber-400/70',
  incorrect: 'bg-rose-400/70',
}

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard'
type SystemFilter = 'all' | 'cardio' | 'neuro' | 'gastro' | 'urgencias' | 'respiratorio'

const difficultyLabels: Record<DifficultyFilter, string> = {
  all: 'Todos', easy: 'Básico', medium: 'Moderado', hard: 'Complejo',
}

const systemLabels: Record<SystemFilter, string> = {
  all: 'Todos', cardio: 'Cardio', neuro: 'Neuro',
  gastro: 'Gastro', urgencias: 'Urgencias', respiratorio: 'Resp.',
}

interface CaseItem {
  id: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  system: string
  caseNumber: number
  lastResult: string | null
}

interface AccuracyData {
  total: number; correct: number; partial: number; incorrect: number; accuracy: number
}

interface DashboardClientProps {
  cases: CaseItem[]
  profile: { username: string; score: number; streak: number; avatar_url?: string | null }
  userEmail: string
  avatarUrl: string | null
  accuracy: AccuracyData | null
  trend: Array<'correct' | 'partial' | 'incorrect'>
}

export function DashboardClient({ cases, profile, userEmail, avatarUrl, accuracy, trend }: DashboardClientProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<DifficultyFilter>('all')
  const [sysFilter, setSysFilter] = useState<SystemFilter>('all')
  const [expandedDifficulty, setExpandedDifficulty] = useState<DifficultyFilter | null>(null)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredCases = cases.filter(c => {
    // If a folder is expanded, enforce that difficulty
    const expandedDiffOk = expandedDifficulty === null || expandedDifficulty === 'all' || c.difficulty === expandedDifficulty
    const diffOk = filter === 'all' || c.difficulty === filter
    const sysOk = sysFilter === 'all' || c.system === sysFilter
    return expandedDiffOk && diffOk && sysOk
  })

  const reviewCases = cases.filter(c => c.lastResult === 'incorrect' || c.lastResult === 'partial')
  const firstReviewCase = reviewCases[0]

  const hasMetrics = accuracy && accuracy.total > 0

  const folderData = [
    { id: 'easy' as const, title: 'Básico', diff: 'easy' as const },
    { id: 'medium' as const, title: 'Moderado', diff: 'medium' as const },
    { id: 'hard' as const, title: 'Complejo', diff: 'hard' as const },
  ]

  return (
    <div className="min-h-screen transition-colors duration-500">
      <div
        className="fixed inset-0 pointer-events-none opacity-50 dark:opacity-100"
        style={{ background: 'radial-gradient(ellipse 80% 40% at 50% -10%, var(--color-primary-transparent) 0%, transparent 60%)' }}
      />

      <div className="relative max-w-5xl mx-auto px-5 py-20 md:py-32">

        {/* Header */}
        <BlurFade delay={0.1}>
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20">
            <div>
              <p className="text-text4 font-bold text-primary tracking-widest uppercase mb-4 opacity-50">Panel de control</p>
              <h1 className="text-heading1 md:text-[3rem] text-foreground font-bold tracking-tight leading-none">Inicio</h1>
            </div>

            <div className="flex flex-col items-end gap-6 group">
              {/* Avatar + score + streak */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-heading2 text-foreground font-bold tabular-nums">
                      {profile.score}
                    </span>
                    <span className="text-text4 text-muted-foreground font-medium tracking-widest uppercase opacity-40">pts</span>
                  </div>
                  {profile.streak > 0 && (
                    <p className="text-text4 font-bold text-primary/50 mt-1 tracking-widest uppercase">
                      {profile.streak} d racha
                    </p>
                  )}
                </div>
                <Link href="/settings" aria-label="Ajustes">
                  <div
                    className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-500 hover:scale-105 glass border border-white/[0.1] shadow-2xl"
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                    ) : (
                      <HugeiconsIcon icon={UserCircleIcon} size={24} className="text-muted-foreground/30" />
                    )}
                  </div>
                </Link>
              </div>
            {/* Nav */}
            <div className="flex items-center gap-8 pt-2">
              <Link href="/upload" className="flex items-center gap-2 text-text4 tracking-widest font-bold text-foreground/40 hover:text-foreground transition-all duration-500 uppercase">
                <HugeiconsIcon icon={Upload01Icon} size={14} />
                <span>Subir</span>
              </Link>
              <Link href="/history" className="flex items-center gap-2 text-text4 tracking-widest font-bold text-foreground/40 hover:text-foreground transition-all duration-500 uppercase">
                <HugeiconsIcon icon={Clock01Icon} size={14} />
                <span>Historial</span>
              </Link>
              <button 
                onClick={handleSignOut} 
                className="flex items-center gap-2 text-text4 tracking-widest font-bold text-foreground/20 hover:text-primary transition-all duration-500 uppercase"
              >
                <HugeiconsIcon icon={Logout01Icon} size={14} />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </header>
      </BlurFade>

        {/* Metrics */}
        {hasMetrics && (
          <BlurFade delay={0.2}>
            <div className="flex items-center gap-16 mb-24 px-4">
              <div>
                <p className="text-[2.5rem] text-foreground font-bold tracking-tighter leading-none">{accuracy.accuracy}%</p>
                <p className="text-text4 tracking-widest font-bold text-foreground/30 mt-3 uppercase">Precisión</p>
              </div>
              <div>
                <p className="text-[2.5rem] text-foreground font-bold tracking-tighter leading-none">{accuracy.total}</p>
                <p className="text-text4 tracking-widest font-bold text-foreground/30 mt-3 uppercase">Casos</p>
              </div>
              {trend.length > 0 && (
                <div className="flex items-center gap-2 ml-auto opacity-40">
                  {[...trend].reverse().map((r, i) => (
                    <span key={i} className={`w-3 h-3 rounded-[4px] ${trendColors[r]}`} />
                  ))}
                </div>
              )}
            </div>
          </BlurFade>
        )}

        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-px mb-12"
          style={{ background: 'var(--border)', transformOrigin: 'left' }}
        />

        {/* "Practicar errores" CTA */}
        {firstReviewCase && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.21 }}
            className="mb-12"
          >
            <Link
              href={`/practice/${firstReviewCase.id}?mode=review`}
              className="inline-flex items-center gap-3 text-text4 tracking-[-0.01em] font-medium px-5 py-2.5 rounded-xl transition-all duration-300 text-rose-500/80 hover:bg-rose-500/5 hover:text-rose-500"
              style={{ background: 'oklch(var(--color-destructive) / 5%)', border: '1px solid oklch(var(--color-destructive) / 10%)' }}
            >
              <span>Revisar {reviewCases.length} caso{reviewCases.length !== 1 ? 's' : ''} pendientes</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </Link>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-12 px-1">
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'cardio', 'neuro', 'gastro', 'urgencias', 'respiratorio'] as SystemFilter[]).map(s => {
              const active = sysFilter === s
              return (
                <button
                  key={s}
                  onClick={() => setSysFilter(s)}
                  className={`text-text4 tracking-[-0.02em] font-medium px-5 py-2 rounded-xl transition-all duration-300 ${active ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-muted-foreground hover:bg-foreground/5'}`}
                >
                  {systemLabels[s]}
                </button>
              )
            })}
          </div>
          <span className="ml-auto text-text4 font-medium text-muted-foreground tabular-nums">{filteredCases.length} casos</span>
        </div>

        {/* Folders or Cases list */}
        <AnimatePresence mode="wait">
          {expandedDifficulty === null ? (
            <motion.div
              key="folder-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 md:grid-cols-3 gap-24 py-24 mb-20"
            >
              {folderData.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <CaseFolder
                    title={f.title}
                    difficulty={f.diff}
                    count={cases.filter(c => c.difficulty === f.diff).length}
                    previewCases={cases.filter(c => c.difficulty === f.diff).slice(0, 3)}
                    onOpen={() => setExpandedDifficulty(f.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="grid-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-heading2 font-bold text-foreground tracking-[-0.04em]">{difficultyLabels[expandedDifficulty]}</h2>
                <button
                  onClick={() => setExpandedDifficulty(null)}
                  className="flex items-center gap-2 text-text4 font-semibold text-muted hover:text-muted/80 transition-all px-5 py-2 rounded-xl bg-foreground border border-border"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                  <span>Volver a carpetas</span>
                </button>
              </div>

              {filteredCases.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-heading3 text-muted-foreground font-medium tracking-[-0.02em]">
                    {'No hay casos para este filtro.'}
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {filteredCases.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.8,
                          delay: i * 0.08,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                      >
                        <Link href={`/practice/${c.id}`} className="block">
                          <CaseCard
                            description={c.description}
                            difficulty={c.difficulty}
                            caseNumber={c.caseNumber}
                          />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                  {filteredCases.length > 4 && <ProgressiveBlur position="bottom" height="100px" />}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>


      </div>
    </div>
  )
}
