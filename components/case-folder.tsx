'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface CaseFolderProps {
  title: string
  count: number
  difficulty: 'easy' | 'medium' | 'hard'
  previewCases: { id: string; difficulty: 'easy' | 'medium' | 'hard' }[]
  onOpen: () => void
  isFocused?: boolean
}

const difficultyGlassColors = {
  easy: 'rgba(0, 200, 83, 0.48)',
  medium: 'rgba(255, 171, 0, 0.48)',
  hard: 'rgba(255, 23, 68, 0.48)',
}

const difficultyShadows = {
  easy: '0 15px 35px -10px rgba(0, 200, 83, 0.2)',
  medium: '0 15px 35px -10px rgba(255, 171, 0, 0.2)',
  hard: '0 15px 35px -10px rgba(255, 23, 68, 0.2)',
}

export function CaseFolder({ title, count, difficulty, previewCases, onOpen, isFocused = false }: CaseFolderProps) {
  const [isHovered, setIsHovered] = useState(false)
  const glassColor = difficultyGlassColors[difficulty]
  const bottomShadow = difficultyShadows[difficulty]

  const active = isHovered || isFocused

  return (
    <motion.div
      className="relative cursor-pointer group w-full max-w-[240px] mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => { setTimeout(() => setIsHovered(false), 600); onOpen(); }}
      onClick={onOpen}
      whileTap={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Perspective Wrapper */}
      <div style={{ perspective: '1200px' }} className="relative h-[180px]">
        {/* 1. Folder Back (Glass layer) */}
        <div
          className="absolute inset-0 z-0 rounded-[1.8rem] border border-white/10 overflow-hidden"
          style={{
            backgroundColor: glassColor,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: bottomShadow,
            transform: 'translateZ(0)'
          }}
        />

        {/* 2. Papers (Sandwiched) */}
        <div className="absolute inset-0 flex items-center justify-center -top-4 pointer-events-none z-10">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="absolute w-[85%] aspect-[4/3] bg-white dark:bg-zinc-100 rounded-[1.5rem] shadow-sm border border-black/5"
              style={{
                zIndex: i,
                transformOrigin: 'bottom center'
              }}
              animate={{
                rotate: active ? (i - 0.5) * 12 : (i - 0.5) * 6,
                y: active ? -45 : -10,
                scale: 0.9 - (i * 0.05)
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            />
          ))}
        </div>

        {/* 3. Folder Front (Opening Glass) */}
        <motion.div
          className="absolute inset-0 z-20 origin-bottom"
          animate={{
            rotateX: active ? -35 : 0,
            y: active ? 15 : 0,
          }}
          style={{ transformStyle: 'preserve-3d' }}
          transition={{ type: 'spring', stiffness: 150, damping: 20 }}
        >
          {/* Glass Shadow Internal */}
          <div
            className={`absolute inset-0 rounded-[1.8rem] transition-opacity duration-500 ${active ? "opacity-30" : "opacity-0"}`}
            style={{
              background: 'radial-gradient(circle at 50% 100%, white, transparent 70%)',
              zIndex: 1
            }}
          />
          <div
            className="w-full h-full rounded-[1.8rem] border border-white/20 p-6 flex flex-col justify-end relative overflow-hidden"
            style={{
              backgroundColor: glassColor, // Asegúrate que sea semi-transparente
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              transform: 'translateZ(0)', // <--- Añade esto para "despertar" a la GPU en móvil
              boxShadow: active ? bottomShadow : 'none',
              transition: 'box-shadow 0.5s ease'
            }}
          >
            {/* Content */}
            <div className="relative z-10">
              <h3 className="text-xl font-semibold tracking-[-0.04em] text-white mb-0.5">{title}</h3>
              <p className="text-[11px] font-semibold text-white/50 tracking-[-0.04em]">{count} casos</p>
            </div>

            <div className="absolute top-6 right-6 flex gap-1 group-hover:scale-110 transition-transform">
              <div className="w-1 h-1 rounded-full bg-white/30" />
              <div className="w-1 h-1 rounded-full bg-white/30" />
              <div className="w-1 h-1 rounded-full bg-white/30" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hover Bridge */}
      <div className="absolute inset-x-0 -top-16 -bottom-10 z-[30] pointer-events-auto" />
    </motion.div>
  )
}
