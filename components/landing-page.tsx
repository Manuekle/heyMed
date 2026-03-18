'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Particles } from '@/components/ui/particles'
import { HugeiconsIcon } from '@hugeicons/react'
import { 
  AiIdeaIcon, 
  StarIcon, 
  ArrowRight01Icon, 
  BubbleChatIcon, 
  Calendar03Icon, 
  DoctorIcon, 
  NoteIcon, 
  Settings03Icon, 
  Tick01Icon,
  RecordIcon,
  CircleIcon,
  SquareLock01Icon,
  Sorting05Icon,
  ActivityIcon
} from '@hugeicons/core-free-icons'
import { BlurFade } from '@/components/ui/blur-fade'
import { ShinyButton } from '@/components/ui/shiny-button'
import { BorderBeam } from '@/components/ui/border-beam'

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.7, ease, delay },
})

const features = [
  {
    icon: NoteIcon,
    title: 'Sin opciones múltiples',
    body: 'Escribes tu diagnóstico en lenguaje natural. La IA interpreta sinónimos, terminología alternativa y niveles de especificidad.',
  },
  {
    icon: BubbleChatIcon,
    title: 'Evaluación semántica',
    body: 'No es un quiz con respuesta fija. La IA analiza tu razonamiento, no solo si escribiste la palabra exacta.',
  },
  {
    icon: Sorting05Icon,
    title: 'Modo diferencial',
    body: 'Escribe tu sospecha principal y hasta tres diagnósticos diferenciales. Entrenamiento para el razonamiento clínico avanzado.',
  },
  {
    icon: ActivityIcon,
    title: 'Modo rápido',
    body: '15 segundos por caso. Sin explicaciones largas. Solo acertar o fallar. Perfecto para calentar antes de una guardia.',
  },
  {
    icon: Calendar03Icon,
    title: 'Repetición inteligente',
    body: 'Los casos donde fallaste vuelven a aparecer. Practicas hasta dominarlos. Como el aprendizaje espaciado, pero clínico.',
  },
  {
    icon: DoctorIcon,
    title: 'Por especialidades',
    body: 'Cardio · Neuro · Gastro · Urgencias · Neumología. Filtra por área y enfócate en tu siguiente rotación.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Lee el caso',
    body: 'Un paciente real, síntomas, signos y laboratorio. Solo texto, sin distractores.',
    detail: 'Casos subidos por la comunidad médica y generados con IA. Cada uno con dificultad calibrada.',
  },
  {
    n: '02',
    title: 'Escribe tu diagnóstico',
    body: 'Campo libre. Como en la clínica real.',
    detail: 'Sin pistas, sin autocompletado. Puedes pedir hasta 3 pistas si te bloqueas.',
  },
  {
    n: '03',
    title: 'Aprende del error',
    body: 'La IA evalúa, explica y muestra el diagnóstico correcto.',
    detail: 'Recibes un score (0-100), una explicación contextual y el diagnóstico de referencia.',
  },
]

const modes = [
  {
    label: 'Normal',
    desc: 'Diagnóstico libre, sin límite de tiempo. La IA evalúa semánticamente.',
    accent: 'var(--color-primary-transparent)',
    border: 'var(--border)',
  },
  {
    label: 'Diferencial',
    desc: 'Sospecha principal + tres diagnósticos diferenciales. Nivel avanzado.',
    accent: 'var(--color-primary-transparent)',
    border: 'var(--border)',
  },
  {
    label: 'Rápido',
    desc: '15 segundos. Sin explicación larga. Solo acertar o fallar. Engancha.',
    accent: 'var(--color-primary-transparent)',
    border: 'var(--border)',
  },
]

const plans = [
  {
    name: 'Gratis',
    price: '$0',
    period: 'siempre',
    features: ['10 casos de práctica', 'Evaluación con IA', 'Feedback inmediato'],
    missing: ['Historial de intentos', 'Subir casos propios', 'Pistas IA'],
    cta: 'Comenzar gratis',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$21.000',
    period: 'COP / mes',
    usd: '≈ USD $5',
    features: ['Casos ilimitados', 'Historial completo', 'Subir tus propios casos', '3 pistas por caso', 'Estadísticas de precisión'],
    missing: [],
    cta: 'Empezar Pro',
    href: '/register',
    highlight: true,
  },
  {
    name: 'Max',
    price: '$63.000',
    period: 'COP / mes',
    usd: '≈ USD $15',
    features: ['Todo lo de Pro', 'Diagnóstico diferencial IA', 'Análisis avanzado de errores', 'Soporte prioritario'],
    missing: [],
    cta: 'Empezar Max',
    href: '/register',
    highlight: false,
  },
]

function Divider() {
  return (
    <div className="relative z-10 max-w-4xl mx-auto px-6">
      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="relative transition-colors duration-500">
      <Particles className="fixed inset-0 z-0 opacity-40 dark:opacity-100" quantity={40} staticity={60} ease={90} size={0.35} color="var(--foreground)" />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 md:px-16 py-8">
          <BlurFade delay={0.1}>
            <span className="text-text4 tracking-widest font-bold text-foreground/20 uppercase">heyMed!</span>
          </BlurFade>
          <BlurFade delay={0.1}>
            <Link href="/login" className="text-text4 tracking-widest font-bold text-foreground/20 hover:text-foreground transition-all duration-500 uppercase">
              Iniciar sesión
            </Link>
          </BlurFade>
        </nav>

        <div className="text-center space-y-12 max-w-2xl">
          <BlurFade delay={0.2}>
            <p className="text-text4 font-bold text-primary tracking-widest uppercase opacity-50">
              Diagnóstico clínico · IA
            </p>
          </BlurFade>

          <BlurFade delay={0.3}>
            <h1 className="text-heading1 md:text-[6rem] lg:text-[8rem] text-foreground font-bold tracking-tight leading-none mb-8">
              heyMed!
            </h1>
          </BlurFade>

          <BlurFade delay={0.4}>
            <p className="text-text2 md:text-heading3 text-foreground/40 leading-relaxed font-medium tracking-tight max-w-lg mx-auto">
              Practica diagnóstico clínico real.<br />
              Sin opciones múltiples. La IA evalúa tu respuesta libre.
            </p>
          </BlurFade>

          <BlurFade delay={0.5}>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/register">
                <ShinyButton className="px-12 py-4 rounded-full">
                  <span className="font-bold tracking-widest uppercase py-1">Comenzar gratis</span>
                </ShinyButton>
              </Link>
              <Link href="/login" className="text-text4 tracking-widest font-bold text-foreground/20 hover:text-foreground transition-all duration-500 group uppercase flex items-center gap-2">
                <span>Iniciar sesión</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </BlurFade>

          <BlurFade delay={0.6}>
            <p className="text-text4 tracking-widest font-bold text-foreground/10 uppercase">
              Sin tarjeta de crédito
            </p>
          </BlurFade>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="text-foreground/20">
            <span className="text-xs">↓</span>
          </motion.div>
        </motion.div>
      </section>

      <Divider />

      {/* ── Mock case preview ──────────────────────────────────── */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-2xl mx-auto">
          <BlurFade delay={0.2}>
            <div className="group relative">
              <BorderBeam size={250} duration={8} borderWidth={1.5} colorFrom="oklch(var(--color-primary))" colorTo="transparent" />
              
              {/* Folder Tab */}
              <div className="flex mb-[-2px] ml-6 relative z-0">
                <div className="h-9 px-6 rounded-t-2xl bg-amber-500/80 backdrop-blur-md flex items-center shadow-lg">
                  <span className="text-text4 tracking-widest font-bold text-white uppercase">
                    Moderado
                  </span>
                </div>
              </div>

              {/* Folder Body */}
              <div className="glass rounded-[3rem] overflow-hidden transition-all duration-700 p-10 md:p-16 space-y-10 group-hover:bg-white/[0.04]">
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.05] to-transparent" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-10">
                    <span className="text-text4 tracking-widest font-bold text-foreground/20 uppercase">#04 · Caso clínico</span>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-amber-500/20 text-amber-500">
                      <HugeiconsIcon icon={ActivityIcon} size={12} className="opacity-60" />
                      <span className="text-text4 font-bold tracking-widest uppercase">Cardio</span>
                    </div>
                  </div>
                  <p className="text-text1 leading-relaxed font-bold tracking-tight mb-12">
                    Mujer de 62 años con disnea progresiva de 3 semanas, ortopnea y edemas en miembros inferiores. Presión arterial 145/90 mmHg, frecuencia cardiaca 98 lpm. Crépitos bibasales. Radiografía: cardiomegalia y redistribución vascular.
                  </p>
                  <div className="pt-10 border-t border-white/[0.03]">
                    <p className="text-text4 tracking-widest font-bold text-foreground/20 mb-6 uppercase">Tu diagnóstico</p>
                    <div className="rounded-[1.5rem] px-8 py-5 flex items-center justify-between glass border border-white/[0.03] group-hover:border-primary/20 transition-all duration-700">
                      <p className="text-foreground/40 text-text2 font-bold tracking-tight">Insuficiencia cardíaca congestiva...</p>
                      <div className="flex items-center gap-2 text-emerald-500/60 transition-colors duration-700">
                        <HugeiconsIcon icon={StarIcon} size={16} />
                        <span className="text-text4 font-bold tracking-widest uppercase">91/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      <Divider />

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="relative z-10 py-40 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.p {...fadeUp()} className="text-[11px] tracking-[-0.02em] font-medium text-muted-foreground mb-6 text-center">
            Puntos clave
          </motion.p>
          <motion.p {...fadeUp(0.05)} className="text-center text-muted-foreground mb-24 max-w-lg mx-auto text-lg leading-relaxed font-medium tracking-[-0.02em]">
            Diseñado para estudiantes que buscan profundidad clínica, no puntajes vacíos.
          </motion.p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <BlurFade key={f.title} delay={0.1 + i * 0.05}>
                <div className="rounded-[2rem] p-12 glass hover:bg-white/[0.03] transition-all duration-500 group border border-white/[0.02]">
                  <div className="w-14 h-14 rounded-2xl glass border border-white/[0.05] flex items-center justify-center mb-10 group-hover:scale-110 group-hover:border-primary/20 transition-all duration-700">
                    <HugeiconsIcon icon={f.icon} size={24} className="text-primary opacity-60 group-hover:opacity-100 transition-all duration-700" />
                  </div>
                  <h3 className="text-text2 font-bold text-foreground mb-4 tracking-tight uppercase">{f.title}</h3>
                  <p className="text-foreground/30 text-text3 leading-relaxed font-medium tracking-tight group-hover:text-foreground/50 transition-colors duration-700">{f.body}</p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Cómo funciona ─────────────────────────────────────── */}
      <section className="relative z-10 py-40 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.p {...fadeUp()} className="text-[11px] tracking-[-0.02em] font-medium text-muted-foreground mb-16 text-center">
            Cómo funciona
          </motion.p>

          <div className="space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1, ease }}
                className="flex gap-12 items-start pb-16"
                style={{ borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none', paddingTop: i > 0 ? '64px' : 0 }}
              >
                <span className="text-[11px] font-medium text-muted-foreground/30 pt-1 shrink-0 w-8 tracking-[-0.01em]">
                  {step.n}
                </span>
                <div className="space-y-4">
                  <p className="text-foreground text-2xl font-semibold tracking-[-0.04em]">{step.title}</p>
                  <p className="text-muted-foreground leading-relaxed text-lg font-medium tracking-[-0.02em]">{step.body}</p>
                  <p className="text-[11px] font-medium text-muted-foreground tracking-[-0.01em]">{step.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Modos de práctica ─────────────────────────────────── */}
      <section className="relative z-10 py-56 px-6">
        <div className="max-w-4xl mx-auto">
          <BlurFade delay={0.1}>
            <p className="text-text4 font-bold text-primary tracking-widest uppercase mb-6 text-center opacity-50">
              Tres dimensiones
            </p>
          </BlurFade>
          <BlurFade delay={0.2}>
            <p className="text-center text-foreground/40 mb-32 max-w-lg mx-auto text-heading3 leading-tight font-bold tracking-tight">
              El aprendizaje clínico no es lineal. Elige tu enfoque.
            </p>
          </BlurFade>

          <div className="grid gap-8">
            {modes.map((m, i) => (
              <BlurFade key={m.label} delay={0.1 + i * 0.1}>
                <div className="rounded-[2.5rem] px-12 py-10 flex flex-col md:flex-row md:items-center gap-10 glass hover:bg-white/[0.03] transition-all duration-700 group border border-white/[0.02]">
                  <div className="flex-1">
                    <p className="text-text2 font-bold text-foreground mb-4 tracking-tight uppercase">{m.label}</p>
                    <p className="text-foreground/30 text-text3 leading-relaxed max-w-xl font-medium tracking-tight group-hover:text-foreground/50 transition-colors duration-700">{m.desc}</p>
                  </div>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={24} className="text-foreground/10 group-hover:text-primary group-hover:translate-x-2 transition-all duration-700" />
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section className="relative z-10 py-56 px-6">
        <div className="max-w-6xl mx-auto">
          <BlurFade delay={0.1}>
            <p className="text-text4 font-bold text-primary tracking-widest uppercase mb-6 text-center opacity-50">
              Membresía
            </p>
          </BlurFade>
          <BlurFade delay={0.2}>
            <p className="text-center text-foreground/40 mb-32 text-heading3 font-bold tracking-tight">
              Empieza hoy mismo. Sin barreras.
            </p>
          </BlurFade>

          <div className="grid md:grid-cols-3 gap-10">
            {plans.map((plan, i) => (
              <BlurFade key={plan.name} delay={0.1 + i * 0.08}>
                <div
                  className="relative rounded-[2.5rem] p-12 flex flex-col glass transition-all duration-700 hover:-translate-y-2 border border-white/[0.02]"
                  style={
                    plan.highlight
                      ? { background: 'oklch(var(--color-primary) / 4%)', borderColor: 'oklch(var(--color-primary) / 20%)' }
                      : {}
                  }
                >
                  {plan.highlight && (
                    <BorderBeam size={200} duration={12} borderWidth={1.5} colorFrom="oklch(var(--color-primary))" colorTo="transparent" />
                  )}
                  <div className="relative flex flex-col flex-1">
                    <p className="text-text4 tracking-widest font-bold text-foreground/20 mb-12 uppercase">{plan.name}</p>
                    <div className="mb-14">
                      <p className="text-[4rem] text-foreground font-bold tracking-tight leading-none">{plan.price}</p>
                      <p className="text-text4 font-bold text-foreground/20 mt-4 tracking-widest uppercase">{plan.period}</p>
                      {plan.usd && <p className="text-text4 font-bold text-foreground/10 mt-2 tracking-widest uppercase">{plan.usd}</p>}
                    </div>
                    <div className="w-full h-px mb-14 bg-white/[0.03]" />
                    <ul className="space-y-6 flex-1 mb-16">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-4 group">
                          <HugeiconsIcon icon={Tick01Icon} size={14} className="text-primary/40 mt-1 shrink-0 group-hover:text-primary transition-colors" />
                          <span className="text-foreground/40 text-text3 font-medium leading-relaxed tracking-tight group-hover:text-foreground/60 transition-colors">{f}</span>
                        </li>
                      ))}
                      {plan.missing.map(f => (
                        <li key={f} className="flex items-start gap-4 opacity-10">
                          <HugeiconsIcon icon={CircleIcon} size={14} className="text-foreground/40 mt-1 shrink-0" />
                          <span className="text-foreground/40 text-text3 font-medium leading-relaxed tracking-tight line-through">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={plan.href}>
                      <ShinyButton
                        className="w-full py-5 rounded-full"
                      >
                        <span className="font-bold tracking-widest uppercase transition-all duration-500">{plan.cta}</span>
                      </ShinyButton>
                    </Link>
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── CTA final ─────────────────────────────────────────── */}
      <section className="relative z-10 py-64 px-6 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-3xl mx-auto space-y-20 relative z-10">
          <BlurFade delay={0.1}>
            <h2 className="text-heading1 md:text-[5rem] text-foreground font-bold tracking-tight leading-none mb-10">
              Eleva tu pensamiento clínica ahora.
            </h2>
          </BlurFade>
          
          <BlurFade delay={0.2}>
            <p className="text-foreground/40 text-heading3 font-bold tracking-tight mb-16">
              Gratis. Sin compromiso. Claridad pura.
            </p>
          </BlurFade>

          <BlurFade delay={0.3}>
            <Link href="/register">
              <ShinyButton className="px-20 py-6 rounded-full inline-block">
                <span className="font-bold tracking-widest uppercase py-1 text-base">Crear cuenta hoy</span>
              </ShinyButton>
            </Link>
          </BlurFade>
        </div>
      </section>

      <footer className="relative z-10 py-32 px-6 text-center border-t border-white/[0.02]">
        <BlurFade delay={0.1}>
          <p className="text-text4 tracking-widest font-bold text-foreground/10 uppercase">
            heyMed! · IA para medicina zen · {new Date().getFullYear()}
          </p>
        </BlurFade>
      </footer>
    </div>
  )
}
