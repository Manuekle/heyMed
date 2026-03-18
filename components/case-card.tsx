import { motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Flag01Icon,
  InformationCircleIcon
} from '@hugeicons/core-free-icons'
import { BlurFade } from './ui/blur-fade'

const difficultyConfig = {
  easy: {
    label: 'Básico',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  medium: {
    label: 'Moderado',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  hard: {
    label: 'Complejo',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10'
  },
}

interface CaseCardProps {
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  caseNumber?: number
  variant?: 'default' | 'compact'
}

export function CaseCard({ description, difficulty, caseNumber, variant = 'default' }: CaseCardProps) {
  const config = difficultyConfig[difficulty]
  const isCompact = variant === 'compact'

  return (
    <BlurFade delay={0.1} className="w-full">
      <motion.div
        whileHover={{
          y: -4,
          scale: 1.01
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20
        }}
        className="group relative"
      >
        <div
          className={`glass rounded-[2rem] p-8 md:p-10 relative overflow-hidden flex flex-col border border-white/[0.05] ${isCompact ? 'max-w-3xl mx-auto' : 'h-full'}`}
          style={!isCompact ? { aspectRatio: '1 / 1.1' } : {}}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${config.bg}`}>
              <HugeiconsIcon icon={Flag01Icon} size={14} className={config.color} />
              <span className={`text-[12px] font-semibold ${config.color}`}>
                {config.label}
              </span>
            </div>
            {caseNumber !== undefined && (
              <div className="flex items-center gap-2 text-foreground/20">
                <HugeiconsIcon icon={InformationCircleIcon} size={14} />
                <span className="text-[11px] font-medium tabular-nums">
                  Caso #{String(caseNumber).padStart(3, '0')}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            <h3 className="text-text2 font-semibold text-foreground/90 tracking-[-0.04em]">
              Instrucciones de caso
            </h3>
            <p className={`text-text2 md:text-text1 leading-relaxed text-foreground/50 font-medium tracking-[-0.04em] ${!isCompact ? 'line-clamp-6' : ''}`}>
              {description}
            </p>
          </div>

          {/* Dotted Separator */}
          <div className="my-8 border-t border-dashed border-white/[0.05]" />

          {/* Footer */}
          {!isCompact && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-foreground/20" />
                </div>
                <span className="text-[11px] font-semibold text-foreground/20  tracking-[-0.04em]">
                  Estudiante
                </span>
              </div>
              <div className="flex items-center gap-2 text-foreground/20 group-hover:text-primary transition-colors">
                <span className="text-[12px] font-semibold">0%</span>
                <div className="w-4 h-4 rounded-full border-2 border-foreground/10 group-hover:border-primary/40 transition-colors" />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </BlurFade>
  )
}
