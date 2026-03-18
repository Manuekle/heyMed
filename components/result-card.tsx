import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle01Icon, AlertCircleIcon, CancelCircleIcon } from '@hugeicons/core-free-icons'
import { BorderBeam } from './ui/border-beam'
import { BlurFade } from './ui/blur-fade'

type Verdict = 'correct' | 'partial' | 'incorrect'

const verdictConfig: Record<
  Verdict,
  { labelEs: string; glow: string; badge: string; bar: string; scoreColor: string; icon: any }
> = {
  correct: {
    labelEs: 'Correcto',
    glow: 'oklch(var(--color-success) / 10%)',
    badge: 'bg-success/5 text-success/80 border border-success/10',
    bar: 'bg-success/40',
    scoreColor: 'text-success/90',
    icon: CheckmarkCircle01Icon,
  },
  partial: {
    labelEs: 'Parcial',
    glow: 'oklch(var(--color-warning) / 10%)',
    badge: 'bg-warning/5 text-warning/80 border border-warning/10',
    bar: 'bg-warning/40',
    scoreColor: 'text-warning/90',
    icon: AlertCircleIcon,
  },
  incorrect: {
    labelEs: 'Incorrecto',
    glow: 'oklch(var(--color-destructive) / 10%)',
    badge: 'bg-destructive/5 text-destructive/80 border border-destructive/10',
    bar: 'bg-destructive/40',
    scoreColor: 'text-destructive/90',
    icon: CancelCircleIcon,
  },
}

function useCountUp(target: number, delay = 400): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    setCount(0)
    const t = setTimeout(() => {
      const duration = 900
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setCount(Math.round(eased * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [target, delay])
  return count
}

function getFirstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/)
  return match ? match[0] : text.slice(0, 100) + (text.length > 100 ? '…' : '')
}

interface ResultCardProps {
  result: Verdict
  explanation: string
  correctDiagnosis?: string
  score: number
  compact?: boolean // quick mode: no expand, no correct diagnosis
}

export function ResultCard({ result, explanation, correctDiagnosis, score, compact }: ResultCardProps) {
  const config = verdictConfig[result]
  const displayScore = useCountUp(score, 500)
  const [expanded, setExpanded] = useState(false)

  const firstSentence = getFirstSentence(explanation)
  const isLong = explanation.length > firstSentence.length + 15

  return (
    <BlurFade delay={0.2} className="w-full">
      <motion.div
        className="relative rounded-[2.5rem] overflow-hidden glass border border-white/[0.08] shadow-2xl"
      >
        {/* Border Beam highlight */}
        <BorderBeam size={300} duration={15} colorFrom={config.glow.includes('success') ? '#22C55E' : config.glow.includes('warning') ? '#EAB308' : '#EF4444'} colorTo="#FAFAFA" borderWidth={2} />
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${config.glow} 0%, transparent 65%)` }}
        />

        {/* Score bar */}
        <div className="relative h-1 w-full" style={{ background: 'var(--border)' }}>
          <motion.div
            className={`h-full ${config.bar}`}
            initial={{ width: '0%' }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <div className="relative p-8 md:p-10">
          {/* Score + verdict */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-12">
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-heading1 font-semibold tracking-[-0.05em] tabular-nums scale-[2.5] origin-left ${config.scoreColor}`}
                >
                  {displayScore}
                </span>
                <span className="text-text4 font-medium text-muted-foreground/30 tracking-[-0.01em]  ml-12">/100</span>
              </div>
              <p className="text-text4 tracking-[-0.02em] font-medium text-muted-foreground mt-3 ">
                Precisión clínica
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              <span className={`flex items-center gap-2 text-text4 tracking-[-0.01em] font-medium px-4 py-1.5 rounded-full crystal  ${config.badge}`}>
                <HugeiconsIcon icon={config.icon} size={14} />
                <span>{config.labelEs}</span>
              </span>
              <span className="text-text4 font-medium text-muted-foreground tracking-[-0.01em] ">
                Evaluación IA
              </span>
            </div>
          </div>

          {!compact && (
            <>
              <div className="w-full h-px mb-10" style={{ background: 'var(--border)' }} />

              {/* Explanation — layered */}
              <div className="space-y-4">
                <p className="text-foreground/70 leading-[1.8] text-text1 font-medium tracking-[-0.02em]">
                  {expanded || !isLong ? explanation : firstSentence}
                </p>
                {isLong && (
                  <button
                    onClick={() => setExpanded(v => !v)}
                    className="text-text4 tracking-[-0.01em] font-medium text-muted-foreground hover:text-muted-foreground transition-all duration-300 border-b border-muted-foreground/20 pb-0.5 "
                  >
                    {expanded ? 'Leer menos' : 'Leer análisis completo'}
                  </button>
                )}
              </div>

              {/* Correct diagnosis */}
              {correctDiagnosis && result !== 'correct' && (
                <div className="mt-10 pt-10" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-text4 tracking-[-0.01em] font-medium text-muted-foreground/30 mb-4 ">
                    Referencia diagnóstica
                  </p>
                  <p className="text-foreground/50 font-medium text-text2 leading-relaxed tracking-[-0.011em]">
                    {correctDiagnosis}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </BlurFade>
  )
}
