'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  HealthIcon,
  Brain02Icon,
  StethoscopeIcon,
  CourseIcon,
  DoctorIcon,
  UserCircleIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  CircleIcon,
  AiIdeaIcon,
  CheckmarkCircle02Icon
} from '@hugeicons/core-free-icons'
import { BlurFade } from '@/components/ui/blur-fade'
import { ShinyButton } from '@/components/ui/shiny-button'

const SYSTEMS = [
  { id: 'cardio', label: 'cardiología', icon: HealthIcon },
  { id: 'neuro', label: 'neurología', icon: Brain02Icon },
  { id: 'gastro', label: 'gastroenterología', icon: StethoscopeIcon },
  { id: 'urgencias', label: 'urgencias', icon: AiIdeaIcon },
  { id: 'respiratorio', label: 'neumología', icon: CourseIcon },
  { id: 'otro', label: 'otras áreas', icon: DoctorIcon },
]

const LEVELS = [
  { id: 'estudiante', label: 'estudiante', desc: 'Pregrado o internado' },
  { id: 'residente', label: 'residente', desc: 'Posgrado en curso' },
  { id: 'medico', label: 'médico general', desc: 'Ejercicio profesional' },
  { id: 'especialista', label: 'especialista', desc: 'Subespecialidad' },
]

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

interface Props { userId: string; initialUsername: string }

export function OnboardingClient({ userId, initialUsername }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [username, setUsername] = useState(initialUsername)
  const [systems, setSystems] = useState<string[]>([])
  const [level, setLevel] = useState('')
  const [saving, setSaving] = useState(false)

  function toggleSystem(id: string) {
    setSystems(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  async function finish() {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({
        username: username.trim() || initialUsername,
        preferred_systems: systems,
        level: level || 'estudiante',
        onboarded: true,
      })
      .eq('id', userId)
    router.push('/dashboard')
  }

  const steps = [
    {
      key: 'welcome',
      title: 'bienvenido a heyMed!',
      subtitle: 'Practica diagnóstico clínico con IA. Antes de empezar, cuéntanos algo.',
      content: (
        <div className="space-y-6">
          <label className="block text-text3 font-semibold tracking-[-0.04em] text-foreground/20 ">
            ¿Cómo te llamamos?
          </label>
          <div className="relative group">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Tu nombre o alias"
              className="w-full bg-transparent text-foreground text-4xl md:text-5xl font-semibold focus:outline-none placeholder:text-muted-foreground/20 tracking-[-0.04em]"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '24px' }}
              autoFocus
            />
            <div className="absolute bottom-0 left-0 h-[1px] bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform duration-700 origin-left w-full" />
          </div>
        </div>
      ),
      canNext: username.trim().length > 1,
      nextLabel: 'continuar',
    },
    {
      key: 'systems',
      title: 'áreas de interés',
      subtitle: 'Selecciona las especialidades que quieres practicar.',
      content: (
        <div className="grid grid-cols-2 gap-4">
          {SYSTEMS.map(s => {
            const active = systems.includes(s.id)
            return (
              <button
                key={s.id}
                onClick={() => toggleSystem(s.id)}
                className={`flex flex-col items-start gap-6 rounded-[2rem] p-8 text-left transition-all duration-700 glass group relative overflow-hidden border ${active ? 'border-primary/40 bg-white/[0.04]' : 'border-white/[0.03] hover:bg-white/[0.01]'
                  }`}
              >
                <div className={`w-12 h-12 rounded-2xl glass border border-white/[0.05] flex items-center justify-center transition-all duration-700 ${active ? 'text-primary scale-110' : 'text-foreground/10 group-hover:text-foreground/30'}`}>
                  <HugeiconsIcon icon={s.icon} size={22} />
                </div>
                <span className={`text-text3 tracking-[-0.04em] font-semibold transition-all duration-700  ${active ? 'text-foreground' : 'text-foreground/20'}`}>
                  {s.label}
                </span>

              </button>
            )
          })}
        </div>
      ),
      canNext: true,
      nextLabel: systems.length > 0 ? 'continuar' : 'saltar',
    },
    {
      key: 'level',
      title: 'nivel académico',
      subtitle: 'Usamos esto para orientar tus casos de práctica.',
      content: (
        <div className="space-y-4">
          {LEVELS.map(l => {
            const active = level === l.id
            return (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={`w-full flex items-center justify-between rounded-[2rem] px-10 py-8 text-left transition-all duration-700 glass border ${active ? 'border-primary/40 bg-white/[0.04]' : 'border-white/[0.03] hover:bg-white/[0.01]'
                  }`}
              >
                <div className="space-y-1.5">
                  <p className={`font-semibold text-text2 tracking-[-0.04em] transition-all duration-700 ${active ? 'text-primary' : 'text-foreground/40'}`}>
                    {l.label}
                  </p>
                  <p className="text-text3 font-semibold text-foreground/50 tracking-[-0.04em] ">{l.desc}</p>
                </div>
                <div className={`w-8 h-8 rounded-full glass flex items-center justify-center transition-all duration-700 ${active ? 'bg-primary text-primary' : 'text-foreground/10'}`}>
                  <HugeiconsIcon icon={active ? CheckmarkCircle02Icon : CircleIcon} size={18} />
                </div>
              </button>
            )
          })}
        </div>
      ),
      canNext: true,
      nextLabel: level ? 'comenzar' : 'saltar',
    },
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >

      <div className="relative w-full max-w-xl">
        <BlurFade delay={0.1}>
          {/* Progress Indicator */}
          <div className="flex flex-col items-center gap-6 mb-20">
            <div className="flex items-center gap-3">
              {steps.map((_, i) => (
                <motion.div
                  key={i}
                  className="rounded-full h-1"
                  initial={false}
                  animate={{
                    width: i === step ? 40 : 8,
                    backgroundColor: i === step ? 'var(--foreground)' : i < step ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'
                  }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
              ))}
            </div>
            <span className="text-text4 font-semibold text-foreground tracking-[-0.04em] tabular-nums">
              Paso {step + 1} de {steps.length}
            </span>
          </div>
        </BlurFade>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-16"
          >
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl text-foreground font-semibold tracking-[-0.04em] leading-none">
                {current.title}
              </h1>
              <p className="text-foreground/40 leading-relaxed text-xl md:text-2xl font-semibold tracking-[-0.04em] italic">
                "{current.subtitle}"
              </p>
            </div>

            <div className="min-h-[300px]">
              {current.content}
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-white/[0.03]">
              {step > 0 ? (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-3 text-text4 font-semibold text-foreground/20 hover:text-foreground tracking-[-0.04em]  transition-all duration-500 group"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} className="group-hover:-translate-x-1 transition-transform" />
                  <span>atrás</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-4">
                <ShinyButton
                  onClick={isLast ? finish : () => setStep(s => s + 1)}
                  disabled={!current.canNext || saving}
                  className="group px-6 py-2 rounded-full"
                >
                  <span className="flex items-center gap-3">
                    {saving ? 'guardando...' : current.nextLabel}
                    {!saving && <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="group-hover:translate-x-1 transition-transform" />}
                  </span>
                </ShinyButton>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
