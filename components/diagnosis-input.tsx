'use client'

import { motion } from 'framer-motion'
import { useRef, useState } from 'react'

interface DiagnosisInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function DiagnosisInput({ value, onChange, disabled }: DiagnosisInputProps) {
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
      onClick={() => ref.current?.focus()}
    >
      {/* Label */}
      <label
        className="block text-xs md:text-sm tracking-[-0.02em] font-medium mb-6 transition-colors duration-500"
        style={{ color: focused ? 'var(--foreground)' : 'var(--muted-foreground)' }}
      >
        Tu diagnóstico
      </label>

      {/* Input container */}
      <div className="relative">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          rows={4}
          placeholder="Escribe tu diagnóstico aquí..."
          className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-500 font-medium tracking-[-0.02em]"
          style={{
            fontSize: '1.25rem',
            lineHeight: '1.7',
          }}
        />

        {/* Bottom border — animated */}
        <div className="relative h-px mt-6">
          <div className="absolute inset-0 bg-border" />
          <motion.div
            className="absolute inset-0 bg-primary/40"
            animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'left' }}
          />
        </div>

        {/* Character count */}
        <div className="mt-3 text-right">
          <span className="text-xs md:text-sm font-medium text-muted-foreground tracking-[-0.01em]">
            {value.length} caracteres
          </span>
        </div>
      </div>
    </motion.div>
  )
}
