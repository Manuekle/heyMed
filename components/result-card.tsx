import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert01Icon, Cancel01Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'

type Verdict = 'correct' | 'partial' | 'incorrect'

const config: Record<Verdict, { label: string; color: string; icon: any }> = {
  correct: { label: 'Correcto', color: 'text-emerald-500/90', icon: CheckmarkCircle01Icon },
  partial: { label: 'Parcial', color: 'text-amber-500/90', icon: Alert01Icon },
  incorrect: { label: 'Incorrecto', color: 'text-rose-500/90', icon: Cancel01Icon },
}

interface ResultCardProps {
  result: Verdict
  explanation: string
  correctDiagnosis?: string
  score: number
  compact?: boolean
}

export function ResultCard({
  result = 'incorrect',
  explanation = '',
  correctDiagnosis,
  score = 0,
  compact = false
}: ResultCardProps) {
  const [count, setCount] = useState(0)
  const current = config[result]

  useEffect(() => {
    const t = setTimeout(() => setCount(score), 400)
    return () => clearTimeout(t)
  }, [score])

  return (
    <div className="w-full max-w-md mx-auto group">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-black/[0.05] dark:border-white/[0.05] bg-white/50 dark:bg-black/20 backdrop-blur-xl p-8 shadow-sm transition-all duration-500 hover:shadow-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-current/10 ${current.color}`}>
              <HugeiconsIcon icon={current.icon} size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs md:text-sm tracking-[-0.04em] text-muted-foreground/60 font-semibold">Análisis</p>
              <h3 className="text-sm font-medium text-foreground tracking-[-0.04em]">{current.label}</h3>
            </div>
          </div>

          <div className="text-right flex flex-col">
            <div className="flex items-baseline justify-end">
              <motion.span className={`text-3xl font-light tracking-[-0.04em] tabular-nums ${current.color}`}>
                {count}
              </motion.span>
              <span className="text-xs md:text-sm text-muted-foreground/40 ml-1 font-medium">/100</span>
            </div>
          </div>
        </div>

        {/* Barra de progreso quirúrgica */}
        <div className="mt-6 h-[1px] w-full bg-black/[0.05] dark:bg-white/[0.05] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full bg-current ${current.color}`}
          />
        </div>

        {/* Contenido */}
        {!compact && (
          <div className="mt-6 space-y-5">
            {/* Explicación principal */}
            {explanation && (
              <p className="text-xs md:text-sm leading-relaxed text-muted-foreground/80 font-light group-hover:text-muted-foreground transition-colors duration-300">
                {explanation}
              </p>
            )}

            {/* Diagnóstico de Referencia (Solo si existe y no es correcto) */}
            {correctDiagnosis && result !== 'correct' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-4 border-t border-black/[0.03] dark:border-white/[0.03]"
              >
                <span className="text-xs md:text-sm tracking-[-0.04em] text-muted-foreground/40 font-semibold block mb-1">
                  Referencia Clínica
                </span>
                <p className="text-xs md:text-sm text-foreground/60 italic font-light leading-snug">
                  {correctDiagnosis}
                </p>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}