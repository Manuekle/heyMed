import { motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { BlurFade } from './ui/blur-fade'
import { BorderBeam } from './ui/border-beam'

const difficultyConfig = {
  easy: { label: 'Básico', color: 'bg-emerald-500', text: 'text-emerald-500' },
  medium: { label: 'Moderado', color: 'bg-amber-500', text: 'text-amber-500' },
  hard: { label: 'Complejo', color: 'bg-rose-500', text: 'text-rose-500' },
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
          stiffness: 400,
          damping: 25
        }}
        className="group relative"
      >
        {/* Main Glass Container */}
        <div
          className={`glass rounded-[2rem] p-8 md:p-10 relative overflow-hidden flex flex-col border border-white/[0.08] ${isCompact ? 'max-w-3xl mx-auto' : 'h-full'}`}
          style={!isCompact ? { aspectRatio: '1 / 1.2' } : {}}
        >
          {/* Subtle Border Glow */}
          <BorderBeam size={250} duration={12} delay={9} colorFrom="#3B82F6" colorTo="#A3A3A3" borderWidth={1.5} />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-8 opacity-40">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${config.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
              <span className="text-text4 font-bold text-foreground/60 tracking-widest uppercase">
                Anamnesis
              </span>
            </div>
            {caseNumber !== undefined && (
               <span className="text-text4 font-medium text-foreground/40 tabular-nums">
                Ref. {String(caseNumber).padStart(3, '0')}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="relative z-10 flex-1">
            <p className={`text-text1 md:text-heading3 leading-[1.6] text-foreground font-medium tracking-tight ${!isCompact ? 'line-clamp-8' : ''}`}>
              {description}
            </p>
          </div>

          {/* Footer / Status */}
          {!isCompact && (
            <div className="mt-12 pt-8 border-t border-white/[0.05] relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-text4 font-bold tracking-widest uppercase ${config.text}`}>
                  Nivel {config.label}
                </span>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, x: 2 }}
                className="text-foreground/20 group-hover:text-primary transition-colors"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </BlurFade>
  )
}
