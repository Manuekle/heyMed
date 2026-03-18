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

type Verdict = 'correct' | 'partial' | 'incorrect'

const resultConfig: Record<Verdict, { icon: any; color: string; label: string }> = {
  correct: { icon: CheckmarkCircle01Icon, color: 'text-emerald-500', label: 'CORRECTO' },
  partial: { icon: CircleIcon, color: 'text-amber-500', label: 'PARCIAL' },
  incorrect: { icon: CircleIcon, color: 'text-rose-500', label: 'INCORRECTO' },
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
  all: 'TODOS',
  correct: 'CORRECTOS',
  partial: 'PARCIALES',
  incorrect: 'INCORRECTOS',
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
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header section could be here if needed, but assuming it's in the page layout */}
      
      {/* Filter tabs */}
      <BlurFade delay={0.1}>
        <div className="flex flex-wrap gap-3 mb-16">
          {(['all', 'correct', 'partial', 'incorrect'] as const).map(f => {
            const active = activeFilter === f
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-text4 font-bold tracking-widest uppercase px-8 py-3 rounded-full transition-all duration-700 border ${
                  active 
                    ? 'bg-foreground text-background border-foreground shadow-lg' 
                    : 'glass text-foreground/20 border-white/[0.03] hover:text-foreground/40'
                }`}
              >
                {filterLabels[f]}
              </button>
            )
          })}
        </div>
      </BlurFade>

      {attempts.length === 0 ? (
        <BlurFade delay={0.2}>
          <div className="text-center py-40 glass rounded-[3rem] border border-white/[0.03] space-y-6">
            <div className="w-16 h-16 rounded-full glass border border-white/[0.05] flex items-center justify-center mx-auto text-foreground/10">
              <HugeiconsIcon icon={Search01Icon} size={24} />
            </div>
            <p className="text-text2 font-bold text-foreground/20 tracking-tight uppercase italic">Sin intentos registrados</p>
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
                  className={`rounded-[2.5rem] overflow-hidden glass transition-all duration-700 group border ${
                    isOpen ? 'border-primary/20 bg-white/[0.02]' : 'border-white/[0.03] hover:bg-white/[0.01]'
                  }`}
                >
                  {/* Row header */}
                  <button
                    className="w-full flex items-center gap-8 px-10 py-8 text-left transition-all duration-500"
                    onClick={() => setExpanded(isOpen ? null : a.id)}
                  >
                    <div className={`w-12 h-12 rounded-2xl glass border border-white/[0.05] flex items-center justify-center shrink-0 ${res.color}`}>
                      <HugeiconsIcon icon={res.icon} size={20} />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                       <span className="text-text4 font-bold text-foreground/10 tracking-widest uppercase flex items-center gap-2">
                        {res.label}
                      </span>
                      <p className="text-text2 text-foreground/70 font-bold line-clamp-1 group-hover:text-foreground transition-colors tracking-tight">
                        {a.caseDescription}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-text4 font-bold text-foreground/10 tracking-widest uppercase">
                          {formatDate(a.createdAt)}
                        </span>
                        <div className="flex items-center gap-1.5 text-foreground/20">
                          <HugeiconsIcon icon={Calendar03Icon} size={10} />
                          <span className="text-[10px] font-bold tracking-widest uppercase">Fecha</span>
                        </div>
                      </div>
                      <HugeiconsIcon 
                        icon={ArrowDown01Icon} 
                        size={18} 
                        className={`text-foreground/10 transition-transform duration-700 ${isOpen ? 'rotate-180 text-primary' : ''}`} 
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
                        <div className="px-10 pb-12 border-t border-white/[0.03]">
                          <div className="pt-12 space-y-12">
                            <div className="grid md:grid-cols-2 gap-12">
                              <div className="space-y-6">
                                <p className="text-text4 tracking-widest font-bold text-foreground/10 uppercase">Tu respuesta</p>
                                <div className="glass p-8 rounded-[2rem] border border-white/[0.02]">
                                  <p className="text-foreground/70 text-text2 font-bold leading-relaxed tracking-tight">
                                    {a.userAnswer}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-6">
                                <p className="text-text4 tracking-widest font-bold text-foreground/10 uppercase">Diagnóstico real</p>
                                <div className="glass p-8 rounded-[2rem] border border-white/[0.02] bg-emerald-500/[0.01]">
                                  <p className="text-emerald-500/60 text-text2 font-bold leading-relaxed tracking-tight uppercase">
                                    {a.correctDiagnosis}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {a.aiExplanation && (
                              <div className="space-y-6">
                                <p className="text-text4 tracking-widest font-bold text-foreground/10 uppercase flex items-center gap-3">
                                  Análisis clínico IA
                                </p>
                                <p className="text-foreground/50 text-text2 font-medium leading-relaxed tracking-tight italic">
                                  "{a.aiExplanation}"
                                </p>
                              </div>
                            )}

                            <div className="pt-8 border-t border-white/[0.03]">
                              <Link
                                href={`/practice/${a.caseId}`}
                                className="inline-flex items-center gap-3 text-text4 font-bold text-primary/40 hover:text-primary tracking-widest uppercase transition-all duration-500 group"
                              >
                                <span>Practicar de nuevo</span>
                                <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="group-hover:translate-x-1 transition-transform" />
                              </Link>
                            </div>
                          </div>
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
