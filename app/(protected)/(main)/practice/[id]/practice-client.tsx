'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CaseCard } from '@/components/case-card'
import { ResultCard } from '@/components/result-card'
import { Confetti, type ConfettiRef } from '@/components/ui/confetti'
import { createClient } from '@/lib/supabase/client'
import type { PracticeMode } from './page'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AiIdeaIcon,
  Cancel01Icon,
  SentIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon
} from '@hugeicons/core-free-icons'
import { ShinyButton } from '@/components/ui/shiny-button'
import { BlurFade } from '@/components/ui/blur-fade'
import { PageHeader } from '@/components/page-header'
import { Logout01Icon } from '@hugeicons/core-free-icons'

interface PracticeClientProps {
  caseData: {
    id: string
    description: string
    difficulty: 'easy' | 'medium' | 'hard'
    caseNumber: number
    correctDiagnosis: string
  }
  userId: string
  nextCaseId: string | null
  difficultyFilter: string
  attemptNumber: number
  mode: PracticeMode
}

type Verdict = 'correct' | 'partial' | 'incorrect'
type EvalResult = { result: Verdict; explanation: string; score: number }

interface SessionStats {
  done: number; correct: number; partial: number; incorrect: number
}

const SESSION_KEY = 'heymed_session'
const QUICK_SECONDS = 15

function getSession(): SessionStats {
  if (typeof window === 'undefined') return { done: 0, correct: 0, partial: 0, incorrect: 0 }
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : { done: 0, correct: 0, partial: 0, incorrect: 0 }
  } catch { return { done: 0, correct: 0, partial: 0, incorrect: 0 } }
}
function saveSession(s: SessionStats) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

// ── Quick Mode Timer ────────────────────────────────────────
function QuickTimer({ timeLeft }: { timeLeft: number }) {
  const pct = (timeLeft / QUICK_SECONDS) * 100
  const color = timeLeft > 8 ? 'rgba(59,130,246,0.5)' : timeLeft > 4 ? 'rgba(245,158,11,0.6)' : 'rgba(239,68,68,0.7)'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-text4 tracking-[-0.02em] font-medium text-muted-foreground">Tiempo</span>
        <span className={`text-text4 font-medium tabular-nums transition-colors duration-500 ${timeLeft <= 4 ? 'text-rose-500' : 'text-muted-foreground'}`}>
          {timeLeft}s
        </span>
      </div>
      <div className="h-0.5 w-full rounded-sm overflow-hidden" style={{ background: 'var(--border)' }}>
        <motion.div
          className="h-full rounded-sm"
          style={{ background: color }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'linear' }}
        />
      </div>
    </motion.div>
  )
}

// ── Differential Input ──────────────────────────────────────
function DifferentialInput({
  mainDiagnosis, setMainDiagnosis,
  differentials, setDifferentials,
  disabled,
}: {
  mainDiagnosis: string; setMainDiagnosis: (v: string) => void
  differentials: string[]; setDifferentials: (v: string[]) => void
  disabled: boolean
}) {
  const updateDiff = (i: number, val: string) => {
    const next = [...differentials]
    next[i] = val
    setDifferentials(next)
  }

  return (
    <div className="space-y-8">
      {/* Main diagnosis */}
      <motion.div
        transition={{ duration: 0.3 }}
        className="rounded-[2.5rem] overflow-hidden border border-white/[0.08] bg-white/[0.03] backdrop-blur-md focus-within:border-primary/30 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.05)] transition-all duration-500"
      >
        <div className="px-8 pt-6 pb-4 opacity-40">
          <span className="text-text4 font-semibold text-foreground tracking-[-0.04em] ">
            Sospecha principal
          </span>
        </div>
        <textarea
          value={mainDiagnosis}
          onChange={e => setMainDiagnosis(e.target.value)}
          disabled={disabled}
          placeholder="¿Cuál es tu diagnóstico más probable?"
          rows={3}
          className="w-full bg-transparent px-8 py-5 text-foreground placeholder:text-foreground/20 resize-none focus:outline-none leading-relaxed text-text2 disabled:opacity-40 font-medium tracking-[-0.04em]"
        />
      </motion.div>

      {/* Differentials */}
      <motion.div
        transition={{ duration: 0.3 }}
        className="rounded-[2.5rem] overflow-hidden border border-white/[0.08] bg-white/[0.03] backdrop-blur-md focus-within:border-primary/30 transition-all duration-500"
      >
        <div className="px-8 pt-6 pb-6 opacity-40">
          <span className="text-text4 font-semibold text-foreground tracking-[-0.04em] ">
            Diagnósticos diferenciales
          </span>
        </div>
        <div className="px-8 pb-10 space-y-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-text4 font-medium text-foreground/20 w-4 shrink-0 tabular-nums">{i + 1}.</span>
              <input
                type="text"
                value={differentials[i]}
                onChange={e => updateDiff(i, e.target.value)}
                disabled={disabled}
                placeholder={i === 0 ? 'Principal alternativa' : i === 1 ? 'Segunda opción' : 'Tercera opción'}
                className="flex-1 bg-transparent text-foreground placeholder:text-foreground/20 focus:outline-none font-medium text-text2 disabled:opacity-40 transition-colors border-b border-white/[0.05] focus:border-primary/30 pb-2"
              />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ── Mode pre-screen ────────────────────────────────────────
const MODES: Array<{ id: PracticeMode; label: string; desc: string; detail: string; accent: string }> = [
  {
    id: 'normal',
    label: 'Normal',
    desc: 'Diagnóstico libre',
    detail: 'Escribe tu diagnóstico sin restricciones. La IA lo evalúa semánticamente.',
    accent: 'rgba(59,130,246,0.08)',
  },
  {
    id: 'differential',
    label: 'Diferencial',
    desc: 'Razonamiento clínico',
    detail: 'Escribe tu sospecha principal y hasta tres diagnósticos diferenciales.',
    accent: 'rgba(139,92,246,0.08)',
  },
  {
    id: 'quick',
    label: 'Modo rápido',
    desc: '15 segundos',
    detail: 'Cuenta regresiva. Solo acertar o fallar. Perfecto para práctica diaria.',
    accent: 'rgba(245,158,11,0.08)',
  },
]

function ModePreScreen({ initialMode, onSelect }: { initialMode: PracticeMode; onSelect: (m: PracticeMode) => void }) {
  const [hovered, setHovered] = useState<PracticeMode | null>(null)

  // If mode was pre-set from URL (review, etc.), skip this screen
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-12"
    >
      <div>
        <p className="text-text4 tracking-[-0.02em] font-medium text-muted-foreground mb-3">
          Antes de empezar
        </p>
        <h2 className="text-heading1 text-foreground font-semibold tracking-[-0.04em]">
          ¿Cómo quieres practicar?
        </h2>
      </div>

      <div className="space-y-8">
        {MODES.map(m => (
          <motion.button
            key={m.id}
            onClick={() => onSelect(m.id)}
            onMouseEnter={() => setHovered(m.id)}
            onMouseLeave={() => setHovered(null)}
            className="w-full text-left rounded-[2rem] px-8 py-7 group relative overflow-hidden bg-white dark:bg-white border border-border/40 transition-all duration-500"
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            initial="initial"
            animate={hovered === m.id ? "hover" : "initial"}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <motion.p
                  variants={{
                    initial: { opacity: 0.8 },
                    hover: { opacity: 1 }
                  }}
                  className="font-semibold text-heading3 tracking-[-0.04em] text-muted-foreground"
                >
                  {m.label}
                </motion.p>
                <motion.p
                  variants={{
                    initial: { opacity: 0.4 },
                    hover: { opacity: 0.7 }
                  }}
                  className="text-text4 tracking-[-0.02em] text-muted-foreground"
                >
                  {m.desc}
                </motion.p>
              </div>
              <motion.span
                variants={{
                  initial: { opacity: 0.2, x: 0 },
                  hover: { opacity: 1, x: 4, color: 'var(--color-primary)' }
                }}
                className="text-muted-foreground"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
              </motion.span>
            </div>
            <AnimatePresence>
              {hovered === m.id && (
                <motion.p
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="text-zinc-500 dark:text-zinc-500 text-text2 leading-relaxed font-medium tracking-[-0.02em] overflow-hidden relative z-10 box-border"
                >
                  {m.detail}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ── Main component ──────────────────────────────────────────
export function PracticeClient({
  caseData, userId, nextCaseId, difficultyFilter, attemptNumber, mode,
}: PracticeClientProps) {
  const router = useRouter()
  const confettiRef = useRef<ConfettiRef>(null)
  const answerRef = useRef('')

  // Normal / review / quick answer
  const [answer, setAnswer] = useState('')
  // Differential mode
  const [mainDiagnosis, setMainDiagnosis] = useState('')
  const [differentials, setDifferentials] = useState(['', '', ''])
  // Shared state
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EvalResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localAttempt, setLocalAttempt] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null)
  const [hints, setHints] = useState<string[]>([])
  const [loadingHint, setLoadingHint] = useState(false)
  // Quick mode
  const [timeLeft, setTimeLeft] = useState(QUICK_SECONDS)
  const [autoAdvanceIn, setAutoAdvanceIn] = useState<number | null>(null)

  // Keep answer ref in sync for quick mode auto-submit
  answerRef.current = answer

  const words = answer.trim().split(/\s+/).filter(Boolean).length
  const completeness = Math.min((words / 8) * 100, 100)

  // ── Confetti on correct ──
  useEffect(() => {
    if (result?.result !== 'correct') return
    const t = setTimeout(() => {
      confettiRef.current?.fire({
        particleCount: 140, spread: 90,
        origin: { y: 0.55 },
        colors: ['#22C55E', '#3B82F6', '#F0EDE8', '#F59E0B'],
      })
    }, 700)
    return () => clearTimeout(t)
  }, [result])

  // Mode selection — show pre-screen only when coming in as 'normal' (no pre-set mode)
  const [activeMode, setActiveMode] = useState<PracticeMode | null>(
    mode === 'normal' ? null : mode
  )
  // Resolve the mode to use throughout (falls back to 'normal' when null — but activeMode null means pre-screen)
  const resolvedMode = activeMode ?? 'normal'

  // ── Quick mode timer ──
  useEffect(() => {
    if (resolvedMode !== 'quick' || result) return
    if (timeLeft <= 0) {
      handleSubmit(answerRef.current.trim() || 'Sin respuesta')
      return
    }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, resolvedMode, result])

  // ── Quick mode auto-advance ──
  useEffect(() => {
    if (resolvedMode !== 'quick' || !result) return
    setAutoAdvanceIn(3)
  }, [result, resolvedMode])

  useEffect(() => {
    if (autoAdvanceIn === null) return
    if (autoAdvanceIn <= 0) { handleNextCase(); return }
    const t = setTimeout(() => setAutoAdvanceIn(n => (n ?? 1) - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdvanceIn])

  // ── Build answer ──
  function buildAnswer(): string {
    if (resolvedMode === 'differential') {
      const diffs = differentials.filter(d => d.trim()).join(', ')
      return `Sospecha principal: ${mainDiagnosis.trim()}${diffs ? `\nDiferenciales: ${diffs}` : ''}`
    }
    return answer
  }

  async function handleSubmit(overrideAnswer?: string) {
    const submitAnswer = overrideAnswer ?? buildAnswer()
    if (!submitAnswer.trim() || loading) return
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: attempt, error: insertError } = await supabase
        .from('attempts')
        .insert({ user_id: userId, case_id: caseData.id, user_answer: submitAnswer.trim() })
        .select('id')
        .single()

      if (insertError) throw new Error(insertError.message)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/evaluate-diagnosis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ attempt_id: attempt.id }),
        }
      )

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const evalResult = data as EvalResult
      if (typeof evalResult.score !== 'number') {
        evalResult.score = evalResult.result === 'correct' ? 85 : evalResult.result === 'partial' ? 50 : 15
      }

      setResult(evalResult)
      const s = getSession()
      const updated = { ...s, done: s.done + 1, [evalResult.result]: s[evalResult.result] + 1 }
      saveSession(updated)
      setSessionStats(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al evaluar')
    } finally {
      setLoading(false)
    }
  }

  async function requestHint() {
    if (loadingHint || hints.length >= 3) return
    setLoadingHint(true)
    try {
      const res = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseDescription: caseData.description, hintsGiven: hints }),
      })
      const { hint } = await res.json()
      if (hint) setHints(h => [...h, hint])
    } catch { /* silent */ } finally {
      setLoadingHint(false)
    }
  }

  function handleRetry() {
    setResult(null)
    setAnswer('')
    setMainDiagnosis('')
    setDifferentials(['', '', ''])
    setError(null)
    setHints([])
    setLocalAttempt(n => n + 1)
    if (resolvedMode === 'quick') setTimeLeft(QUICK_SECONDS)
    setAutoAdvanceIn(null)
  }

  function handleNextCase() {
    if (!nextCaseId) { setShowSummary(true); return }
    const params = new URLSearchParams()
    if (difficultyFilter !== 'all') params.set('difficulty', difficultyFilter)
    if (resolvedMode !== 'normal') params.set('mode', resolvedMode)
    const qs = params.toString()
    router.push(`/practice/${nextCaseId}${qs ? '?' + qs : ''}`)
  }

  const currentAttempt = attemptNumber + localAttempt

  const canSubmit = resolvedMode === 'differential'
    ? mainDiagnosis.trim().length > 3 && !result
    : answer.trim().length > 3 && !result

  if (showSummary && sessionStats) {
    return <SessionSummary stats={sessionStats} difficultyFilter={difficultyFilter} mode={resolvedMode} onReturn={() => router.push('/dashboard')} />
  }

  // Show mode pre-screen before the case
  if (activeMode === null) {
    return <ModePreScreen initialMode={mode} onSelect={m => setActiveMode(m)} />
  }

  return (
    <div className="space-y-20">
      <PageHeader
        label={`CASO #${caseData.caseNumber}`}
        title="PRACTICAR"
        description="Evalúa este caso clínico y propón el diagnóstico más probable. La IA te dará retroalimentación detallada."
        backLink="/dashboard"
      />
      {/* Quick timer */}
      {resolvedMode === 'quick' && !result && (
        <QuickTimer timeLeft={timeLeft} />
      )}

      {/* Case card */}
      <div className="pt-2">
        <CaseCard variant="compact" description={caseData.description} difficulty={caseData.difficulty} caseNumber={caseData.caseNumber} />
      </div>

      {/* Attempt counter */}
      {currentAttempt > 1 && !result && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text4 font-medium tracking-[-0.04em] text-muted-foreground text-center pb-2">
          Intento #{currentAttempt}
        </motion.p>
      )}

      {/* Input area */}
      <AnimatePresence>
        {!result && (
          <BlurFade delay={0.4} direction="up" className="w-full">
            <motion.div exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} className="space-y-8">
              {resolvedMode === 'differential' ? (
                <DifferentialInput
                  mainDiagnosis={mainDiagnosis} setMainDiagnosis={setMainDiagnosis}
                  differentials={differentials} setDifferentials={setDifferentials}
                  disabled={loading}
                />
              ) : (
                <>
                  <motion.div
                    transition={{ duration: 0.3 }}
                    className="relative rounded-[2.5rem] overflow-hidden border border-white/[0.08] bg-white/[0.03] backdrop-blur-md focus-within:border-primary/30 focus-within:shadow-[0_0_30px_rgba(59,130,246,0.03)] transition-all duration-500"
                  >
                    <textarea
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      disabled={loading}
                      placeholder="Escribe tu diagnóstico..."
                      rows={5}
                      className="w-full bg-transparent px-10 py-9 text-foreground placeholder:text-foreground/20 resize-none focus:outline-none leading-relaxed text-heading3 font-medium tracking-[-0.04em] disabled:opacity-40"
                    />

                    {/* Inner footer for word count/metadata */}
                    {answer.length > 0 && resolvedMode !== 'quick' && (
                      <div className="px-10 pb-8 flex items-center justify-between gap-8">
                        <div className="flex-1 h-[2px] rounded-full overflow-hidden bg-white/[0.05]">
                          <motion.div
                            className="h-full rounded-full bg-primary/40"
                            animate={{ width: `${completeness}%` }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                        <span className="text-text4 font-semibold text-foreground/20 tabular-nums  tracking-[-0.04em]">
                          {words} {words === 1 ? 'palabra' : 'palabras'}
                        </span>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </motion.div>
          </BlurFade>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-text4 font-medium text-rose-500 tracking-[-0.01em] text-center">
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Unified Action Bar */}
      {!result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 pt-6"
        >
          {/* Left: Cancel */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-text4 lowercase font-medium text-zinc-300 hover:text-rose-400 transition-colors px-2 py-1"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
            <span>cancelar</span>
          </button>

          {/* Right: Hint + Submit */}
          <div className="flex items-center gap-3">
            {resolvedMode !== 'quick' && (
              <button
                onClick={requestHint}
                disabled={loadingHint || hints.length >= 3}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-text4 border border-border/40 font-medium text-muted-foreground hover:text-primary hover:border-primary/20 transition-all lowercase"
              >
                <HugeiconsIcon icon={AiIdeaIcon} size={14} />
                <span>{loadingHint ? '...' : hints.length > 0 ? `pista ${hints.length}/3` : 'pedir pista'}</span>
              </button>
            )}

            <ShinyButton
              onClick={() => handleSubmit()}
              disabled={!canSubmit || loading}
              className="rounded-2xl px-10 py-3 disabled:opacity-20"
            >
              <div className="flex items-center gap-3">
                <HugeiconsIcon icon={SentIcon} size={16} />
                <span>{loading ? 'Evaluando...' : 'Evaluar ahora'}</span>
              </div>
            </ShinyButton>
          </div>
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <div className="pt-8">
            <ResultCard
              result={result.result}
              explanation={result.explanation}
              correctDiagnosis={caseData.correctDiagnosis}
              score={result.score}
              compact={resolvedMode === 'quick'}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Post-result actions */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: resolvedMode === 'quick' ? 0.3 : 1.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-8 pt-12"
          >
            {resolvedMode === 'quick' && autoAdvanceIn !== null ? (
              <p className="text-text4 font-medium text-muted-foreground/30 tracking-[-0.02em] tabular-nums">
                Siguiente caso en {autoAdvanceIn}...
              </p>
            ) : (
              <>
                <button
                  onClick={handleNextCase}
                  className="flex items-center gap-3 rounded-2xl px-14 py-5 text-text1 tracking-[-0.01em] font-medium text-foreground glass hover:bg-foreground hover:text-background transition-all duration-700"
                >
                  <span>{nextCaseId ? 'Siguiente caso' : 'Ver resumen'}</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </button>
                <button
                  onClick={handleRetry}
                  className="text-text4 tracking-[-0.02em] font-medium text-muted-foreground hover:text-muted-foreground transition-all duration-500"
                >
                  Intentar de nuevo
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Session Summary ─────────────────────────────────────────
function SessionSummary({ stats, difficultyFilter, mode, onReturn }: {
  stats: SessionStats; difficultyFilter: string; mode: PracticeMode; onReturn: () => void
}) {
  const accuracy = stats.done > 0 ? Math.round((stats.correct / stats.done) * 100) : 0
  const filterLabel = ({ easy: 'Básico', medium: 'Moderado', hard: 'Complejo' } as Record<string, string>)[difficultyFilter]
  const modeLabel = ({ quick: 'Modo Rápido', differential: 'Modo Diferencial', review: 'Revisión', normal: '' } as Record<string, string>)[mode]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-16"
    >
      <div
        className="relative rounded-[2.5rem] p-12 md:p-16 overflow-hidden glass"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--color-primary-transparent) 0%, transparent 70%)' }} />
        <div className="relative">
          <p className="text-text4 tracking-[-0.02em] font-medium text-muted-foreground/30 mb-20 text-center  tracking-[-0.04em]">
            Sesión completada {modeLabel && `· ${modeLabel}`}
          </p>
          <div className="grid grid-cols-3 gap-12 mb-16 text-center">
            <div>
              <p className="text-heading1 text-foreground font-semibold tracking-[-0.04em] tabular-nums scale-[1.5] origin-center mb-6">{stats.done}</p>
              <p className="text-text4 tracking-[-0.02em] font-medium text-muted-foreground mt-3 ">Casos</p>
            </div>
            <div>
              <p className="text-heading1 text-primary font-semibold tracking-[-0.04em] tabular-nums scale-[1.5] origin-center mb-6">{accuracy}%</p>
              <p className="text-text4 tracking-[-0.02em] font-medium text-muted-foreground mt-3 ">Precisión</p>
            </div>
            <div>
              <p className="text-heading1 text-foreground font-semibold tracking-[-0.04em] tabular-nums scale-[1.5] origin-center mb-6">{stats.correct}</p>
              <p className="text-text4 tracking-[-0.02em] font-medium text-muted-foreground mt-3 ">Correctos</p>
            </div>
          </div>
          {filterLabel && (
            <p className="text-text4 tracking-[-0.01em] font-medium text-muted-foreground text-center">
              Filtro: {filterLabel}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-center">
        <button
          onClick={onReturn}
          className="flex items-center gap-2 text-text4 tracking-[-0.02em] font-medium text-muted-foreground/30 hover:text-foreground transition-all duration-700"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          <span>Volver al inicio</span>
        </button>
      </div>
    </motion.div>
  )
}
