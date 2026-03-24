'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle01Icon,
  CircleIcon,
  Settings01Icon,
  ArrowDown01Icon,
  Calendar03Icon,
  Search01Icon,
  Tick01Icon,
  CircleArrowRightIcon,
  StarIcon,
  ArrowRight01Icon
} from '@hugeicons/core-free-icons'
import { BlurFade } from '@/components/ui/blur-fade'
import { PageHeader } from '@/components/page-header'

type Verdict = 'correct' | 'partial' | 'incorrect'

const resultConfig: Record<Verdict, { icon: any; color: string; label: string; glow: string; bg: string }> = {
  correct: {
    icon: CheckmarkCircle01Icon,
    color: 'text-emerald-500',
    label: 'correcto',
    glow: 'bg-emerald-500/40',
    bg: 'group-hover:bg-emerald-500/[0.03]'
  },
  partial: {
    icon: CircleIcon,
    color: 'text-amber-500',
    label: 'parcial',
    glow: 'bg-amber-500/40',
    bg: 'group-hover:bg-amber-500/[0.03]'
  },
  incorrect: {
    icon: CircleIcon,
    color: 'text-rose-500',
    label: 'incorrecto',
    glow: 'bg-rose-500/40',
    bg: 'group-hover:bg-rose-500/[0.03]'
  },
}

interface AttemptItem {
  id: string
  createdAt: string
  userAnswer: string
  aiResult: Verdict
  aiExplanation: string | null
  caseId: string
  caseDescription: string
  caseDifficulty: 'easy' | 'medium' | 'hard'
  correctDiagnosis: string
}

interface HistoryClientProps {
  attempts: AttemptItem[]
  activeFilter: 'all' | Verdict
}

const filterLabels = {
  all: 'todos',
  correct: 'correctos',
  partial: 'parciales',
  incorrect: 'incorrectos',
}

export function HistoryClient({ attempts, activeFilter }: HistoryClientProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)

  function setFilter(f: 'all' | Verdict) {
    if (f === 'all') router.push('/history')
    else router.push(`/history?filter=${f}`)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        label="registros"
        title="Mis registros"
        description="Revisa tus intentos previos y el análisis clínico detallado de cada caso."
        backLink="/dashboard"
      />

      {/* Filter tabs — Segmented Control */}
      <BlurFade delay={0.1}>
        <div className="flex justify-center mb-12 md:mb-16">
          <div className="w-full max-w-full overflow-x-auto scrollbar-none px-6 md:px-0">
            <div className="inline-flex rounded-full p-1 bg-foreground/[0.02] border border-foreground/[0.05] relative min-w-max md:min-w-0">
              {(['all', 'correct', 'partial', 'incorrect'] as const).map(f => {
                const active = activeFilter === f
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`relative px-5 md:px-8 py-2 md:py-2.5 rounded-full text-[12px] md:text-[13px] font-semibold tracking-[-0.04em] transition-colors duration-500 z-10 ${active ? 'text-background' : 'text-foreground/30 hover:text-foreground'}`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeFilter"
                        className="absolute inset-0 bg-foreground rounded-full -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {filterLabels[f]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </BlurFade>

      {attempts.length === 0 ? (
        <BlurFade delay={0.2}>
          <div className="text-center py-40 glass rounded-[3rem] border border-foreground/[0.03] space-y-8">
            <div className="relative w-20 h-20 mx-auto">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
              />
              <div className="relative w-full h-full rounded-full glass border border-foreground/[0.05] flex items-center justify-center text-foreground/10">
                <HugeiconsIcon icon={Search01Icon} size={28} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-text2 font-semibold text-foreground/20 tracking-[-0.04em]">todavía no hay registros</p>
              <p className="text-[12px] font-medium text-foreground/10 tracking-[-0.02em] italic">tus casos resueltos aparecerán aquí para tu revisión clínica.</p>
            </div>
          </div>
        </BlurFade>
      ) : (
        <div className="space-y-4">
          {attempts.map((a, i) => {
            const res = resultConfig[a.aiResult]
            const isOpen = expanded === a.id

            return (
              <BlurFade key={a.id} delay={0.1 + i * 0.04}>
                <div
                  className={`rounded-[2.5rem] overflow-hidden glass transition-all duration-700 group border ${isOpen ? 'border-primary/20 bg-foreground/[0.02]' : 'border-foreground/[0.03]'
                    } ${!isOpen ? a.aiResult === 'correct' ? 'hover:border-emerald-500/20' : a.aiResult === 'partial' ? 'hover:border-amber-500/20' : 'hover:border-rose-500/20' : ''}`}
                >
                  {/* Row header */}
                  <button
                    className={`w-full flex items-center gap-4 md:gap-8 px-6 md:px-10 py-6 md:py-8 text-left transition-all duration-500 ${!isOpen ? res.bg : ''}`}
                    onClick={() => setExpanded(isOpen ? null : a.id)}
                  >


                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className={`text-[11px] font-semibold tracking-[-0.04em] opacity-40 ${res.color}`}>
                          {res.label}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-foreground/5" />
                        <span className="text-[11px] font-semibold text-foreground/20 tabular-nums tracking-[-0.04em]">
                          {formatDate(a.createdAt)}
                        </span>
                      </div>
                      <p className="text-text2 text-foreground/70 font-semibold line-clamp-1 group-hover:text-foreground transition-colors tracking-[-0.04em]">
                        {a.caseDescription}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={18}
                        className={`text-foreground/10 transition-transform duration-700 ${isOpen ? 'rotate-180 text-primary' : 'group-hover:text-foreground/30'}`}
                      />
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 md:px-10 pb-8 md:pb-12 border-t border-foreground/[0.03]">
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
                              hidden: {}
                            }}
                            className="pt-8 md:pt-12 space-y-8 md:space-y-12"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                              {/* Your Answer */}
                              <motion.div
                                variants={{
                                  hidden: { opacity: 0, y: 10 },
                                  visible: { opacity: 1, y: 0 }
                                }}
                                className="space-y-4 md:space-y-6"
                              >
                                <p className="text-[11px] font-semibold tracking-[-0.04em] text-foreground/20">tu respuesta</p>
                                <div className="glass p-5 md:p-8 rounded-[1.8rem] md:rounded-[2.rem] border border-white/[0.02]">
                                  <p className="text-foreground/70 text-text2 font-semibold leading-relaxed tracking-[-0.04em]">
                                    {a.userAnswer}
                                  </p>
                                </div>
                              </motion.div>

                              {/* Real Diagnosis */}
                              <motion.div
                                variants={{
                                  hidden: { opacity: 0, y: 10 },
                                  visible: { opacity: 1, y: 0 }
                                }}
                                className="space-y-4 md:space-y-6"
                              >
                                <p className="text-[11px] font-semibold tracking-[-0.04em] text-foreground/20">diagnóstico real</p>
                                <div className="glass p-5 md:p-8 rounded-[1.8rem] md:rounded-[2.rem] border border-emerald-500/10 bg-emerald-500/[0.01]">
                                  <p className="text-emerald-500/60 text-text2 font-semibold leading-relaxed tracking-[-0.04em]">
                                    {a.correctDiagnosis}
                                  </p>
                                </div>
                              </motion.div>
                            </div>

                            {/* AI Analysis */}
                            {a.aiExplanation && (
                              <motion.div
                                variants={{
                                  hidden: { opacity: 0, y: 10 },
                                  visible: { opacity: 1, y: 0 }
                                }}
                                className="space-y-6"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-[1px] flex-1 bg-white/[0.03]" />
                                  <p className="text-[11px] font-semibold tracking-[-0.04em] text-foreground/20">análisis clínico ia</p>
                                  <div className="h-[1px] flex-1 bg-white/[0.03]" />
                                </div>
                                <div className="relative px-6 md:px-12 py-2">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                                  <p className="text-foreground/50 text-text2 font-medium leading-relaxed tracking-[-0.04em] italic">
                                    "{a.aiExplanation.toLowerCase()}"
                                  </p>
                                </div>
                              </motion.div>
                            )}

                            {/* Action */}
                            <motion.div
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                  visible: { opacity: 1, y: 0 }
                              }}
                              className="pt-8 border-t border-foreground/[0.03] flex justify-end"
                            >
                              <Link
                                href={`/practice/${a.caseId}`}
                                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 rounded-full glass border border-foreground/[0.05] text-[13px] font-semibold text-primary/60 hover:text-primary hover:border-primary/20 tracking-[-0.04em] transition-all duration-500 group"
                              >
                                <span>practicar de nuevo</span>
                                <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="group-hover:translate-x-1 transition-transform" />
                              </Link>
                            </motion.div>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </BlurFade>
            )
          })}
        </div>
      )}
    </div>
  )
}
