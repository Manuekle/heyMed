'use client'

import { motion } from 'framer-motion'
import { useRef } from 'react'

interface SubmitButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

export function SubmitButton({ onClick, disabled, loading }: SubmitButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex justify-center"
    >
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled || loading}
        className="group relative overflow-hidden rounded-full px-10 py-3.5 text-xs md:text-sm tracking-[-0.01em] font-medium transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed bg-card border border-border"
      >
        {/* Magic UI shimmer sweep */}
        <span
          className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, oklch(from var(--foreground) l c h / 6%) 50%, transparent 100%)',
          }}
        />

        {/* Glow on hover */}
        <span
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
          style={{
            background:
              'radial-gradient(ellipse at center, oklch(from var(--primary) l c h / 8%) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <span className="relative flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors duration-300">
          {loading ? (
            <>
              <LoadingDots />
              Evaluando
            </>
          ) : (
            'Evaluar diagnóstico'
          )}
        </span>
      </button>
    </motion.div>
  )
}

function LoadingDots() {
  return (
    <span className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-blue-400/60"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  )
}
