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
  modeFromUrl: boolean
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
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] tracking-[-0.02em] font-semibold text-muted-foreground  tracking-[-0.05em]">tiempo</span>
        <span className={`text-[12px] font-semibold tabular-nums tracking-[-0.04em] transition-colors duration-500 ${timeLeft <= 4 ? 'text-rose-500' : 'text-muted-foreground/40'}`}>
          {timeLeft}s
        </span>
      </div>
      <div className="h-[2px] w-full rounded-full overflow-hidden bg-white/[0.05]">
        <motion.div
          className="h-full rounded-full"
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
    <div className="space-y-12">
      {/* Main diagnosis */}
      <motion.div
        transition={{ duration: 0.3 }}
        className="rounded-[2rem] overflow-hidden border border-border/40 bg-card/30 focus-within:border-yellow-500/20 transition-all duration-700"
      >
        <div className="px-10 pt-8 pb-4">
          <span className="text-text3 font-semibold text-foreground lowercase">
            sospecha principal
          </span>
        </div>
        <textarea
          value={mainDiagnosis}
          onChange={e => setMainDiagnosis(e.target.value)}
          disabled={disabled}
          placeholder="¿Cuál es tu diagnóstico más probable?"
          rows={3}
          className="w-full bg-transparent px-10 py-6 text-foreground placeholder:text-foreground/20 resize-none focus:outline-none leading-relaxed text-text2 md:text-text1 font-medium tracking-[-0.04em] disabled:opacity-40"
        />
      </motion.div>

      {/* Differentials */}
      <motion.div
        transition={{ duration: 0.3 }}
        className="rounded-[2rem] overflow-hidden border border-border/40 bg-card/30 focus-within:border-yellow-500/20 transition-all duration-700"
      >
        <div className="px-10 pt-8 pb-6">
          <span className="text-text3 font-semibold text-foreground lowercase">
            diagnósticos diferenciales
          </span>
        </div>
        <div className="px-10 pb-12 space-y-8">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-6">
              <span className="text-[12px] font-semibold text-foreground/10 w-4 shrink-0 tabular-nums tracking-[-0.04em]">{i + 1}.</span>
              <input
                type="text"
                value={differentials[i]}
                onChange={e => updateDiff(i, e.target.value)}
                disabled={disabled}
                placeholder={i === 0 ? 'principal alternativa' : i === 1 ? 'segunda opción' : 'tercera opción'}
                className="flex-1 bg-transparent text-foreground placeholder:text-foreground/20 focus:outline-none font-medium text-text1 md:text-text1 tracking-[-0.04em] disabled:opacity-40 transition-colors border-b border-border/30 focus:border-yellow-500/20 pb-3"
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
    label: 'normal',
    desc: 'diagnóstico libre',
    detail: 'Escribe tu diagnóstico sin restricciones. La IA lo evalúa semánticamente.',
    accent: 'rgba(34,197,94,0.08)',
  },
  {
    id: 'differential',
    label: 'diferencial',
    desc: 'razonamiento clínico',
    detail: 'Escribe tu sospecha principal y hasta tres diagnósticos diferenciales.',
    accent: 'rgba(234,179,8,0.08)',
  },
  {
    id: 'quick',
    label: 'modo rápido',
    desc: '15 segundos',
    detail: 'Cuenta regresiva. Solo acertar o fallar. Perfecto para práctica diaria.',
    accent: 'rgba(239,68,68,0.08)',
  },
]

function ModePreScreen({ onSelect, onBack }: { onSelect: (m: PracticeMode) => void; onBack: () => void }) {
  const [hovered, setHovered] = useState<PracticeMode | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-16"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 md:space-y-4">
          <p className="text-[10px] md:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Antes de empezar
          </p>
          <h2 className="text-heading2 md:text-heading1 text-foreground font-semibold tracking-[-0.04em]">
            ¿Cómo quieres practicar?
          </h2>
        </div>
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-[12px] font-semibold text-foreground/20 hover:text-foreground transition-all duration-500 tracking-[-0.04em] self-start"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>atrás</span>
        </button>
      </div>

      <div className="space-y-8">
        {MODES.map(m => (
          <motion.button
            key={m.id}
            onClick={() => onSelect(m.id)}
            onMouseEnter={() => setHovered(m.id)}
            onMouseLeave={() => setHovered(null)}
            className={`w-full text-left rounded-[2rem] md:rounded-[2.5rem] px-6 md:px-10 py-6 md:py-8 group relative overflow-hidden bg-card/30 border transition-all duration-700 ${m.id === 'normal' ? 'border-border/40 hover:border-green-500/30' :
              m.id === 'differential' ? 'border-border/40 hover:border-yellow-500/30' :
                'border-border/40 hover:border-red-500/30'
              }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className={`font-semibold text-heading3 tracking-[-0.04em] text-foreground/90 transition-colors duration-500 ${m.id === 'normal' ? 'group-hover:text-green-500' :
                  m.id === 'differential' ? 'group-hover:text-yellow-500' :
                    'group-hover:text-red-500'
                  }`}>
                  {m.label}
                </p>
                <p className="text-[13px] tracking-[-0.02em] font-medium text-foreground/20 group-hover:text-foreground/40 transition-colors duration-500">
                  {m.desc}
                </p>
              </div>
              <motion.span
                animate={hovered === m.id ? { x: 4, scale: 1.1 } : { x: 0, scale: 1 }}
                className={`text-foreground/10 transition-colors duration-700 ${m.id === 'normal' ? 'group-hover:text-green-500' :
                  m.id === 'differential' ? 'group-hover:text-yellow-500' :
                    'group-hover:text-red-500'
                  }`}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
              </motion.span>
            </div>
            <AnimatePresence>
              {hovered === m.id && (
                <motion.p
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="text-foreground/40 text-text2 leading-relaxed font-medium tracking-[-0.04em] overflow-hidden"
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
  caseData, userId, nextCaseId, difficultyFilter, attemptNumber, mode, modeFromUrl,
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
  const [showConfirmExit, setShowConfirmExit] = useState(false)

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

  // Show pre-screen only on first visit (no explicit mode in URL)
  const [activeMode, setActiveMode] = useState<PracticeMode | null>(
    modeFromUrl ? mode : (mode === 'normal' ? null : mode)
  )
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
      return `sospecha principal: ${mainDiagnosis.trim()}${diffs ? `\ndiferenciales: ${diffs}` : ''}`
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

      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attempt.id,
          user_answer: submitAnswer.trim(),
          description: caseData.description,
          correct_diagnosis: caseData.correctDiagnosis,
        }),
      })

      if (!res.ok || !res.body) throw new Error('error al evaluar')

      // Stream response — format: "result|score\nexplanation..."
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let text = ''
      let evalResult: EvalResult | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += dec.decode(value, { stream: true })

        // As soon as first line is complete, show result immediately
        const nl = text.indexOf('\n')
        if (nl !== -1 && !evalResult) {
          const [verdict, scoreStr] = text.slice(0, nl).trim().split('|')
          if (['correct', 'partial', 'incorrect'].includes(verdict)) {
            const raw = parseInt(scoreStr) || 50
            const score =
              verdict === 'correct' ? Math.max(75, Math.min(100, raw))
                : verdict === 'partial' ? Math.max(30, Math.min(74, raw))
                  : Math.max(0, Math.min(29, raw))
            evalResult = { result: verdict as Verdict, score, explanation: text.slice(nl + 1).trim() }
            setResult(evalResult)
            setLoading(false)
            const s = getSession()
            const updated = { ...s, done: s.done + 1, [verdict]: s[verdict as keyof SessionStats] + 1 }
            saveSession(updated)
            setSessionStats(updated)
          }
        } else if (evalResult) {
          // Stream explanation progressively
          const nl2 = text.indexOf('\n')
          setResult(prev => prev ? { ...prev, explanation: text.slice(nl2 + 1).trim() } : prev)
        }
      }

      if (!evalResult) throw new Error('No se pudo evaluar la respuesta')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error al evaluar')
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
    params.set('mode', resolvedMode)
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
    return (
      <div className="space-y-16">
        <ModePreScreen onSelect={m => setActiveMode(m)} onBack={() => router.push('/dashboard')} />
      </div>
    )
  }

  return (
    <div className="space-y-8">


      <Confetti ref={confettiRef} manualstart={true} className="fixed inset-0 pointer-events-none z-[100]" />

      {/* Quick timer */}
      {resolvedMode === 'quick' && !result && (
        <QuickTimer timeLeft={timeLeft} />
      )}

      {/* Case card */}
      <div className="pt-2">
        <CaseCard variant="compact" description={caseData.description} difficulty={caseData.difficulty} caseNumber={caseData.caseNumber} />
      </div>




      {/* Input area */}
      <AnimatePresence>
        {!result && (
          <BlurFade delay={0.4} direction="up" className="w-full">
            <motion.div exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.6 }} className="space-y-12">
              {resolvedMode === 'differential' ? (
                <DifferentialInput
                  mainDiagnosis={mainDiagnosis} setMainDiagnosis={setMainDiagnosis}
                  differentials={differentials} setDifferentials={setDifferentials}
                  disabled={loading}
                />
              ) : (
                <motion.div
                  transition={{ duration: 0.3 }}
                  className={`relative rounded-[2.5rem] overflow-hidden border bg-card/10 transition-all duration-700 shadow-sm ${resolvedMode === 'quick' ? 'border-border/40 focus-within:border-red-500/20' :
                    'border-border/40 focus-within:border-green-500/20'
                    }`}
                >
                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    disabled={loading}
                    placeholder="¿cuál es tu diagnóstico?"
                    rows={6}
                    className="w-full bg-transparent px-6 md:px-12 py-8 md:py-12 text-foreground placeholder:text-foreground/30 resize-none focus:outline-none leading-relaxed text-[1.4rem] md:text-heading3 font-semibold tracking-[-0.04em]"
                  />

                  {/* Inner footer for word count/metadata */}
                  {answer.length > 0 && resolvedMode !== 'quick' && (
                    <div className="px-6 md:px-12 pb-8 md:pb-10 flex items-center justify-between gap-6 md:gap-10">
                      <div className="flex-1 h-[2px] rounded-full overflow-hidden bg-white/[0.05]">
                        <motion.div
                          className="h-full rounded-full bg-green-500/30"
                          animate={{ width: `${completeness}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-[10px] md:text-[11px] font-semibold text-foreground/20 tabular-nums tracking-[-0.04em]">
                        {words} {words === 1 ? 'palabra' : 'palabras'}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </BlurFade>
        )}
      </AnimatePresence>

      {/* Zen Hint Tray (Chips) */}
      <AnimatePresence mode="popLayout">
        {hints.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {hints.map((hint, i) => (
              <BlurFade key={i} delay={0.1 + i * 0.1}>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.4 }}
                  className={`px-5 py-2.5 rounded-full glass border transition-all duration-700 ${resolvedMode === 'quick' ? 'border-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.02)]' :
                    resolvedMode === 'differential' ? 'border-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.02)]' :
                      'border-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.02)]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <p className="text-[13px] font-medium text-foreground/50 leading-relaxed tracking-[-0.02em]">
                      {hint.toLowerCase()}
                    </p>
                  </div>
                </motion.div>
              </BlurFade>
            ))}
          </div>
        )}
      </AnimatePresence>
      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[12px] font-semibold text-rose-500/60 tracking-[-0.04em] text-center">
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Unified Action Bar */}
      {!result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pt-10 border-t border-border/20"
        >
          {/* Left: Exit */}
          <div className="flex items-center min-w-[140px]">
            <AnimatePresence mode="wait">
              {!showConfirmExit ? (
                <motion.button
                  key="exit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowConfirmExit(true)}
                  className="flex items-center gap-2 text-[12px] font-semibold text-destructive hover:text-destructive/60 transition-all duration-500 px-2 py-1 tracking-[-0.04em] rounded-full"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  <span>abandonar práctica</span>
                </motion.button>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-4 bg-destructive/[0.03] border border-destructive/10 px-4 py-2 rounded-full"
                >
                  <span className="text-[12px] font-semibold text-foreground/40 tracking-[-0.04em]">¿seguro?</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="text-[12px] font-semibold text-destructive hover:underline transition-all tracking-[-0.04em]"
                    >
                      sí, salir
                    </button>
                    <button
                      onClick={() => setShowConfirmExit(false)}
                      className="text-[12px] font-medium text-foreground/20 hover:text-foreground transition-all tracking-[-0.04em]"
                    >
                      no, seguir
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>



          {/* Right: Hint + Submit */}
          <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6 w-full sm:w-auto">
            {resolvedMode !== 'quick' && (
              <button
                onClick={requestHint}
                disabled={loadingHint || hints.length >= 3}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-2 rounded-full text-[12px] font-semibold transition-all duration-500 tracking-[-0.04em] ${hints.length >= 3 ? 'text-foreground/5 cursor-not-allowed' : 'text-foreground/30 hover:text-primary hover:bg-primary/5 bg-foreground/[0.02] sm:bg-transparent'}`}
              >
                <HugeiconsIcon icon={AiIdeaIcon} size={14} />
                <span>{loadingHint ? 'buscando...' : hints.length > 0 ? `${hints.length}/3` : 'pista'}</span>
              </button>
            )}

            <ShinyButton
              onClick={() => handleSubmit()}
              disabled={!canSubmit || loading}
              className={`flex-1 sm:flex-none rounded-full px-6 py-2.5 md:py-2 transition-all duration-500 ${resolvedMode === 'quick' ? 'hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]' :
                resolvedMode === 'differential' ? 'hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]' :
                  'hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold tracking-[-0.04em]">
                  {loading ? 'evaluando...' : 'evaluar ahora'}
                </span>
              </div>
            </ShinyButton>
          </div>
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <div className="pt-12">
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: resolvedMode === 'quick' ? 0.3 : 1.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-12 pt-16"
          >
            {resolvedMode === 'quick' && autoAdvanceIn !== null ? (
              <p className="text-[13px] font-semibold text-foreground/10 tracking-[-0.04em] tabular-nums">
                siguiente caso en {autoAdvanceIn}...
              </p>
            ) : (
              <>
                <div className="flex items-center gap-8">
                  <button
                    onClick={handleRetry}
                    className="text-[15px] font-semibold text-foreground/20 hover:text-foreground transition-all duration-700 tracking-[-0.04em] px-6 py-2 rounded-full hover:bg-foreground/[0.03]"
                  >
                    intentar de nuevo
                  </button>
                  <ShinyButton
                    onClick={handleNextCase}
                    className="px-6 py-2 rounded-full"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-[15px] tracking-[-0.04em]">
                        {nextCaseId ? 'siguiente caso' : 'ver resumen'}
                      </span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                    </div>
                  </ShinyButton>
                </div>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-[12px] font-semibold text-foreground/10 hover:text-foreground/40 transition-all duration-700 tracking-[-0.04em]"
                >
                  volver al inicio
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
  const filterLabel = ({ easy: 'básico', medium: 'moderado', hard: 'complejo' } as Record<string, string>)[difficultyFilter]
  const modeLabel = ({ quick: 'modo rápido', differential: 'modo diferencial', review: 'revisión', normal: '' } as Record<string, string>)[mode]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-24"
    >
      <div className="rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-24 overflow-hidden bg-card/20 border border-border/40 relative shadow-sm">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-primary/[0.03] to-transparent" />
        <div className="relative">
          <p className="text-[11px] font-semibold text-foreground/20 mb-12 md:mb-24 text-center tracking-[-0.04em]">
            sesión completada {modeLabel && `· ${modeLabel}`}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-12 md:mb-24 text-center">
            <div className="space-y-2 md:space-y-6">
              <p className="text-[3.5rem] md:text-[5rem] text-foreground font-semibold tracking-[-0.04em] tabular-nums leading-none">{stats.done}</p>
              <p className="text-[12px] md:text-[13px] font-semibold text-foreground/20 tracking-[-0.04em]">casos</p>
            </div>
            <div className="space-y-2 md:space-y-6">
              <p className="text-[3.5rem] md:text-[5rem] text-primary font-semibold tracking-[-0.04em] tabular-nums leading-none">{accuracy}%</p>
              <p className="text-[12px] md:text-[13px] font-semibold text-foreground/20 tracking-[-0.04em]">precisión</p>
            </div>
            <div className="space-y-2 md:space-y-6">
              <p className="text-[3.5rem] md:text-[5rem] text-foreground font-semibold tracking-[-0.04em] tabular-nums leading-none">{stats.correct}</p>
              <p className="text-[12px] md:text-[13px] font-semibold text-foreground/20 tracking-[-0.04em]">correctos</p>
            </div>
          </div>

          {filterLabel && (
            <div className="flex justify-center">
              <div className="px-5 py-1.5 rounded-full bg-foreground/[0.03] border border-border/40">
                <p className="text-[11px] font-semibold text-foreground/30 tracking-[-0.04em]">
                  filtro: {filterLabel}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <ShinyButton
          onClick={onReturn}
          className="px-6 py-2 rounded-full"
        >
          <div className="flex items-center gap-3 font-semibold text-[15px] tracking-[-0.04em]">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            <span>terminar sesión</span>
          </div>
        </ShinyButton>
      </div>
    </motion.div>
  )
}
