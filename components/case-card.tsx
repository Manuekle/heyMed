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
          className={`glass rounded-[2rem] p-6 md:p-10 relative overflow-hidden flex flex-col border border-white/[0.05] ${isCompact ? 'max-w-3xl mx-auto' : 'h-full'}`}
          style={!isCompact ? { aspectRatio: '1 / 1.1' } : {}}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${config.bg}`}>
              <HugeiconsIcon icon={Flag01Icon} size={14} className={config.color} />
              <span className={`text-[12px] font-semibold tracking-[-0.02em] ${config.color}`}>
                {config.label}
              </span>
            </div>
            {caseNumber !== undefined && (
              <div className="flex items-center gap-2 text-foreground/20">
                <HugeiconsIcon icon={InformationCircleIcon} size={14} />
                <span className="text-[11px] font-medium tabular-nums tracking-[-0.02em]">
                  caso #{String(caseNumber).padStart(3, '0')}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            <h3 className="text-text2 font-semibold text-foreground/90 tracking-[-0.04em]">
              instrucciones de caso
            </h3>
            <p className={`text-text2 md:text-text1 leading-relaxed text-foreground/50 font-medium tracking-[-0.04em] ${!isCompact ? 'line-clamp-6' : ''}`}>
              {description}
            </p>
          </div>
        </div>
      </motion.div>
    </BlurFade>
  )
}
