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
import Image from 'next/image'

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
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/20 transition-colors duration-500 font-sans">

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-12 py-6 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <BlurFade delay={0.2}>
            <Link href="/login" className="px-4 py-1.5 rounded-full bg-foreground text-background text-[11px] font-semibold tracking-[-0.04em] hover:scale-105 transition-all duration-300">
              entrar
            </Link>
          </BlurFade>
        </div>

        <div className="hidden md:flex items-center gap-6 pointer-events-auto">
          <BlurFade delay={0.3}>
            <div className="flex gap-6 text-[11px] font-semibold text-foreground/20 tracking-tight">
              <span className="cursor-pointer hover:text-foreground transition-colors lowercase italic">instagram</span>
            </div>
          </BlurFade>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="pt-24 md:pt-32 pb-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card rounded-[2.5rem] md:rounded-[4.5rem] shadow-sm border border-foreground/[0.01] px-6 py-16 md:py-32 flex flex-col items-center text-center relative overflow-hidden">

            {/* Avatar Tag */}
            <BlurFade delay={0.4}>
              <div className='h-20 w-20 mb-10'>
                <Image
                  src="/icon.png"
                  alt="heyMed! logo"
                  className="w-full h-full object-contain"
                  width={712}
                  height={712}
                />
              </div>

            </BlurFade>

            {/* Heading */}
            <BlurFade delay={0.5}>
              <h1 className="text-[2.2rem] md:text-[4.5rem] lg:text-[5.5rem] font-semibold tracking-[-0.05em] leading-[0.95] text-foreground max-w-4xl mx-auto mb-10 lowercase">
                entrena tu razonamiento clínico con inteligencia artificial.
              </h1>
            </BlurFade>

            {/* Subheading */}
            <BlurFade delay={0.6}>
              <p className="text-foreground/40 text-lg md:text-xl font-medium tracking-[-0.03em] max-w-xl mx-auto mb-14 leading-relaxed lowercase">
                sin opciones múltiples. la ia evalúa tus diagnósticos en lenguaje natural tal como sucede en la clínica real.
              </p>
            </BlurFade>

            {/* CTA */}
            <BlurFade delay={0.7}>
              <Link href="/register">
                <button className="px-10 py-2 rounded-full bg-foreground text-background text-[13px] font-semibold tracking-[-0.04em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 group shadow-xl shadow-foreground/10">
                  <span>Comenzar gratis</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ── Specialty Cloud ─────────────────────────────────── */}
      <section className="py-8 px-6">
        <BlurFade delay={0.8}>
          <div className="max-w-6xl mx-auto flex flex-wrap justify-center items-center gap-x-10 gap-y-6 text-muted-foreground">
            {['cardiología', 'neurología', 'gastroenterología', 'neumología', 'urgencias', 'pediatría'].map((specialty) => (
              <span key={specialty} className="text-[15px] font-semibold tracking-[-0.04em] lowercase italic">
                {specialty}
              </span>
            ))}
          </div>
        </BlurFade>
      </section>

      {/* ── Mock Case Preview ─────────────────────────────────── */}
      <section className="py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-foreground/[0.01] px-6 md:px-20 py-12 md:py-24 relative overflow-hidden group">
            <div className="max-w-3xl mx-auto space-y-8 md:space-y-12">
              <BlurFade delay={0.2}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-foreground/20 tracking-[-0.04em] lowercase italic border-b border-foreground/5 pb-1">#04 · caso clínico</span>
                </div>
              </BlurFade>

              <BlurFade delay={0.3}>
                <h2 className="text-[1.8rem] md:text-[2.2rem] font-semibold tracking-[-0.04em] leading-tight text-foreground">
                  "mujer de 62 años con disnea progresiva de 3 semanas, ortopnea y edemas en miembros inferiores. radiografía: cardiomegalia y redistribución vascular."
                </h2>
              </BlurFade>

              <BlurFade delay={0.4}>
                <div className="space-y-6">
                  <p className="text-[10px] font-semibold text-foreground/20 tracking-[-0.04em] lowercase italic">tu diagnóstico libre</p>
                  <div className="p-6 md:p-8 rounded-[2rem] bg-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-muted/80 transition-colors duration-500">
                    <span className="text-foreground/60 font-semibold tracking-[-0.03em] lowercase">insuficiencia cardíaca congestiva...</span>
                    <div className="flex items-center gap-2 text-emerald-600">
                      <HugeiconsIcon icon={StarIcon} size={16} />
                      <span className="text-[13px] font-semibold tracking-[-0.04em]">91/100</span>
                    </div>
                  </div>
                </div>
              </BlurFade>
            </div>
          </div>
        </div>
      </section>      {/* ── Features Section ──────────────────────────────────── */}
      <section className="py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-foreground/[0.01] px-6 md:px-20 py-16 md:py-24">
            <div className="max-w-3xl mb-20">
              <BlurFade delay={0.1}>
                <div className="px-4 py-1.5 rounded-full bg-muted text-foreground/60 text-[10px] font-semibold tracking-[-0.04em] inline-block mb-8 lowercase">
                  características
                </div>
              </BlurFade>
              <BlurFade delay={0.2}>
                <h2 className="text-[2.5rem] md:text-[3.5rem] font-semibold tracking-[-0.05em] leading-[1.1] text-foreground mb-8 lowercase">
                  profundidad clínica,<br />sin opciones múltiples.
                </h2>
              </BlurFade>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
              {features.slice(0, 4).map((f, i) => (
                <BlurFade key={f.title} delay={0.1 + i * 0.1}>
                  <div className="space-y-6 group">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 text-foreground/20">
                      <HugeiconsIcon icon={f.icon} size={22} />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold tracking-[-0.03em] text-foreground lowercase">{f.title}</h3>
                      <p className="text-[14px] leading-relaxed font-medium text-foreground/30 tracking-[-0.02em] group-hover:text-foreground/50 transition-colors">
                        {f.body}
                      </p>
                    </div>
                  </div>
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Steps Section (Cómo funciona) ─────────────────────── */}
      <section className="py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-foreground/[0.01] px-6 md:px-20 py-16 md:py-24">
            <div className="flex flex-col items-center text-center mb-20">
              <BlurFade delay={0.1}>
                <div className="px-4 py-1.5 rounded-full bg-muted text-foreground/60 text-[10px] font-semibold tracking-[-0.04em] mb-8 lowercase">
                  método heymed!
                </div>
              </BlurFade>
              <BlurFade delay={0.2}>
                <h2 className="text-[2.2rem] md:text-[3rem] font-semibold tracking-[-0.04em] leading-tight text-foreground max-w-2xl px-4 lowercase">
                  aprendizaje basado en la evidencia y el razonamiento puro.
                </h2>
              </BlurFade>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {steps.map((step, i) => (
                <BlurFade key={step.n} delay={0.1 + i * 0.1}>
                  <div className="space-y-8 p-8 rounded-[2.5rem] bg-muted/50 group hover:bg-muted transition-all duration-500">
                    <span className="text-[10px] font-semibold text-foreground/20 tracking-[-0.04em]  italic">{step.n}</span>
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold tracking-[-0.03em] text-foreground lowercase">{step.title}</h3>
                      <p className="text-[14px] leading-relaxed font-medium text-foreground/40 tracking-[-0.02em]">{step.body}</p>
                      <p className="text-[10px] font-semibold text-foreground/20 tracking-tight leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Modos Section ─────────────────────────────────────── */}
      <section className="py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-foreground/[0.01] px-6 md:px-20 py-16 md:py-24">
            <div className="flex flex-col items-center text-center mb-20">
              <BlurFade delay={0.1}>
                <div className="px-4 py-1.5 rounded-full bg-muted text-foreground/60 text-[10px] font-semibold tracking-[-0.04em] mb-8 lowercase">
                  dimensiones
                </div>
              </BlurFade>
              <BlurFade delay={0.2}>
                <h2 className="text-[2.2rem] md:text-[3rem] font-semibold tracking-[-0.04em] leading-tight text-foreground max-w-2xl lowercase">
                  el aprendizaje clínico no es lineal. elige tu enfoque.
                </h2>
              </BlurFade>
            </div>

            <div className="grid gap-6">
              {modes.map((m, i) => (
                <BlurFade key={m.label} delay={0.1 + i * 0.1}>
                  <div className="rounded-[2.5rem] p-4 bg-muted hover:bg-muted/80 transition-all duration-500 group cursor-pointer">
                    <div className="rounded-[2rem] bg-card p-10 flex flex-col md:flex-row md:items-center gap-10">
                      <div className="flex-1">
                        <p className="text-xl font-semibold text-foreground mb-3 tracking-[-0.03em] lowercase">{m.label}</p>
                        <p className="text-foreground/40 text-[15px] leading-relaxed max-w-xl font-medium tracking-[-0.02em]">{m.desc}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center group-hover:translate-x-2 transition-transform duration-500 shrink-0">
                        <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
                      </div>
                    </div>
                  </div>
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ─────────────────────────────────── */}
      <section className="py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-foreground/[0.01] px-6 md:px-20 py-16 md:py-24">
            <div className="flex flex-col items-center text-center mb-20">
              <BlurFade delay={0.1}>
                <div className="px-4 py-1.5 rounded-full bg-muted text-foreground/60 text-[10px] font-semibold tracking-[-0.04em] mb-8 lowercase">
                  membresía
                </div>
              </BlurFade>
              <BlurFade delay={0.2}>
                <h2 className="text-[2.2rem] md:text-[3rem] font-semibold tracking-[-0.04em] leading-tight text-foreground max-w-2xl px-4 lowercase">
                  empieza hoy mismo.<br />sin barreras. claridad pura.
                </h2>
              </BlurFade>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, i) => (
                <BlurFade key={plan.name} delay={0.1 + i * 0.08}>
                  <div className={`relative rounded-[3rem] p-10 flex flex-col border transition-all duration-500 hover:scale-[1.02] ${plan.highlight ? 'bg-foreground text-background border-foreground shadow-2xl shadow-foreground/20' : 'bg-muted/50 text-foreground border-transparent hover:bg-muted'}`}>
                    <div className="relative flex flex-col flex-1">
                      <p className={`text-[10px] font-semibold tracking-[-0.04em]  mb-12 italic ${plan.highlight ? 'text-background/40' : 'text-foreground/20'}`}>{plan.name}</p>
                      <div className="mb-14">
                        <p className="text-[3rem] font-semibold tracking-[-0.04em] leading-none">{plan.price}</p>
                        <p className={`text-[11px] font-semibold mt-4 tracking-tight  ${plan.highlight ? 'text-background/40' : 'text-foreground/20'}`}>{plan.period}</p>
                      </div>
                      <div className={`w-full h-px mb-14 ${plan.highlight ? 'bg-background/10' : 'bg-foreground/5'}`} />
                      <ul className="space-y-5 flex-1 mb-16">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-start gap-4">
                            <HugeiconsIcon icon={Tick01Icon} size={14} className={plan.highlight ? 'text-primary' : 'text-foreground/20'} />
                            <span className={`text-[13px] font-medium tracking-tight leading-relaxed ${plan.highlight ? 'text-background/60' : 'text-foreground/60'}`}>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href={plan.href}>
                        <button className={`w-full py-2 rounded-full text-[12px] font-semibold tracking-[-0.04em] transition-all duration-300 ${plan.highlight ? 'bg-background text-foreground hover:bg-background/80' : 'bg-foreground text-background hover:bg-foreground/80'}`}>
                          {plan.cta}
                        </button>
                      </Link>
                    </div>
                  </div>
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA Section ────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 mb-8 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-foreground/[0.01] px-6 py-20 md:py-32 flex flex-col items-center">

            <BlurFade delay={0.1}>
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-10">
                <HugeiconsIcon icon={AiIdeaIcon} size={24} className="text-foreground/20" />
              </div>
            </BlurFade>

            <BlurFade delay={0.2}>
              <h2 className="text-[2.8rem] md:text-[4rem] font-semibold tracking-[-0.05em] leading-[0.95] text-foreground max-w-2xl mx-auto mb-12 lowercase">
                eleva tu razonamiento clínico hoy mismo.
              </h2>
            </BlurFade>

            <BlurFade delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <button className="px-12 py-2 rounded-full bg-foreground text-background text-[13px] font-semibold tracking-[-0.04em] hover:scale-105 transition-all shadow-xl shadow-foreground/10">
                    Comenzar gratis
                  </button>
                </Link>
                <Link href="/login">
                  <button className="px-12 py-2 rounded-full bg-muted text-foreground text-[13px] font-semibold tracking-[-0.04em] hover:bg-accent transition-all">
                    Iniciar sesión
                  </button>
                </Link>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ── Simple Footer ─────────────────────────────────────── */}
      <footer className="py-12 px-8 flex flex-col md:flex-row items-center justify-between gap-8 max-w-6xl mx-auto border-t border-foreground/5">
        <BlurFade delay={0.4}>
          <p className="text-[11px] font-semibold text-foreground/20 tracking-tight  italic whitespace-nowrap">
            © {new Date().getFullYear()} heyMed! · ia para medicina
          </p>
        </BlurFade>

        <div className="flex gap-8 text-[11px] font-semibold text-foreground/20 tracking-tight lowercase italic">
          <span className="cursor-pointer hover:text-foreground transition-colors">instagram</span>
        </div>
      </footer>
    </div>
  )
}
