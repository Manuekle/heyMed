'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
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
import { PageHeader } from '@/components/page-header'

const difficultyConfig = {
  easy: { label: 'básico', dot: 'bg-emerald-400/50', text: 'text-emerald-400/60' },
  medium: { label: 'moderado', dot: 'bg-amber-400/50', text: 'text-amber-400/60' },
  hard: { label: 'complejo', dot: 'bg-rose-400/50', text: 'text-rose-400/60' },
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
  all: 'todos', easy: 'básico', medium: 'moderado', hard: 'complejo',
}

const systemLabels: Record<SystemFilter, string> = {
  all: 'todos', cardio: 'cardio', neuro: 'neuro',
  gastro: 'gastro', urgencias: 'urgencias', respiratorio: 'resp.',
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
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const scrollX = useMotionValue(0)

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768)
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

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
    { id: 'easy' as const, title: 'básico', diff: 'easy' as const },
    { id: 'medium' as const, title: 'moderado', diff: 'medium' as const },
    { id: 'hard' as const, title: 'complejo', diff: 'hard' as const },
  ]

  return (
    <div className="space-y-2 md:space-y-12">
      <div className="px-5">
        <PageHeader
          label="inicio"
          title="Casos clínicos"
          showNav={true}
          avatarUrl={avatarUrl}
          username={profile.username}
          score={profile.score}
        />
      </div>

      {/* Metrics */}
      {hasMetrics && (
        <BlurFade delay={0.2}>
          <div className="px-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-8 md:gap-16 mb-12 md:mb-24 px-1 md:px-4">
              <div className="flex gap-12 md:gap-16">
                <div>
                  <p className="text-[2rem] md:text-[2.5rem] font-semibold tracking-[-0.04em] leading-none">{accuracy.accuracy}%</p>
                  <p className="text-xs md:text-sm tracking-[-0.04em] font-semibold text-foreground/30 mt-3 lowercase">precisión</p>
                </div>
                <div>
                  <p className="text-[2rem] md:text-[2.5rem] font-semibold tracking-[-0.04em] leading-none">{accuracy.total}</p>
                  <p className="text-xs md:text-sm tracking-[-0.04em] font-semibold text-foreground/30 mt-3 lowercase">intentos</p>
                </div>
              </div>
              {trend.length > 0 && (
                <div className="flex flex-col items-start sm:items-end gap-3 sm:ml-auto">
                  <div className="flex items-center gap-1.5 md:gap-2 opacity-40">
                    {[...trend].reverse().map((r, i) => (
                      <span key={i} className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-[3px] md:rounded-[4px] ${trendColors[r]}`} />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm font-semibold text-foreground/20 tracking-[-0.02em]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                      <span>correcto</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
                      <span>parcial</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400/50" />
                      <span>incorrecto</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </BlurFade>
      )}

      <div className="px-5">
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-px mb-8 md:mb-12"
          style={{ background: 'var(--border)', transformOrigin: 'left' }}
        />
      </div>

      {/* "Practicar errores" CTA */}
      {firstReviewCase && (
        <div className="px-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.21 }}
            className="mb-12"
          >
            <Link
              href={`/practice/${firstReviewCase.id}?mode=review`}
              className="inline-flex items-center gap-3 text-text4 tracking-[-0.01em] font-medium  py-2.5 rounded-xl transition-all duration-300 text-rose-500/80 hover:bg-rose-500/5 hover:text-rose-500"
              style={{ background: 'oklch(var(--color-destructive) / 5%)', border: '1px solid oklch(var(--color-destructive) / 10%)' }}
            >
              <span className="lowercase">revisar {reviewCases.length} caso{reviewCases.length !== 1 ? 's' : ''} pendientes</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </Link>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="px-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 md:mb-12 px-1">
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'cardio', 'neuro', 'gastro', 'urgencias', 'respiratorio'] as SystemFilter[]).map(s => {
              const active = sysFilter === s
              return (
                <button
                  key={s}
                  onClick={() => setSysFilter(s)}
                  className={`text-text4 tracking-[-0.02em] font-medium px-4 md: py-2 rounded-full transition-all duration-300 ${active ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-muted-foreground hover:bg-foreground/5'}`}
                >
                  {systemLabels[s]}
                </button>
              )
            })}
          </div>
          <span className="text-text4 font-medium text-muted-foreground tabular-nums">{filteredCases.length} casos</span>
        </div>
      </div>

      {/* Folders or Cases list */}
      <AnimatePresence mode="wait">
        {expandedDifficulty === null ? (
          <div className="relative">
            <motion.div
              key="folder-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              onScroll={(e) => {
                const target = e.currentTarget;
                const scrollLeft = target.scrollLeft;
                const itemWidth = isMobile ? 304 : 288; // 240 + gap (64 on mobile, 48 otherwise)
                const index = Math.round(scrollLeft / itemWidth);
                setActiveIndex(index);
              }}
              className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible gap-16 md:gap-24 py-12 md:py-16 md:py-24 mb-20 scrollbar-none snap-x snap-mandatory px-0 md:px-0 scroll-padding-x-12 sm:pb-0 pb-40"
            >
              {folderData.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="min-w-[240px] md:min-w-0 snap-center first:ml-12 md:first:ml-0 last:mr-12 md:last:mr-0"
                >
                  <CaseFolder
                    title={f.title}
                    difficulty={f.diff}
                    count={cases.filter(c => c.difficulty === f.diff).length}
                    previewCases={cases.filter(c => c.difficulty === f.diff).slice(0, 3)}
                    onOpen={() => setExpandedDifficulty(f.id)}
                    isFocused={isMobile && activeIndex === i}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        ) : (
          <motion.div
            key="grid-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="px-5">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-heading2 font-semibold tracking-[-0.04em]">{difficultyLabels[expandedDifficulty]}</h2>
                <button
                  onClick={() => setExpandedDifficulty(null)}
                  className="flex items-center gap-2 text-text4 font-medium text-muted hover:text-muted/80 transition-all px-5 py-2 rounded-full bg-foreground border border-border"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                  <span>volver a carpetas</span>
                </button>
              </div>
            </div>

            {filteredCases.length === 0 ? (
              <div className="">
                <div className="text-center py-20">
                  <p className="text-heading3 text-muted-foreground font-medium tracking-[-0.02em]">
                    {'No hay casos para este filtro.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-visible gap-4 md:gap-6 scrollbar-none snap-x snap-mandatory px-0 md:px-0 scroll-padding-x-8 sm:pb-0 pb-12">
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
                      className="min-w-[280px] w-[80vw] md:w-auto md:min-w-0 snap-center first:ml-8 md:first:ml-0 last:mr-8 md:last:mr-0"
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
  )
}
