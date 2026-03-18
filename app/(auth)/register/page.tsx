'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { GoogleButton } from '@/components/google-button'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'
import { BlurFade } from '@/components/ui/blur-fade'
import { ShinyButton } from '@/components/ui/shiny-button'

const inputClass =
  'w-full bg-transparent border-b border-white/[0.08] py-4 text-foreground placeholder:text-foreground/20 outline-none focus:border-primary/40 transition-all duration-500 font-medium text-text2 tracking-[-0.04em]'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 transition-colors duration-500">
      <div
        className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-100"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, var(--color-primary-transparent) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm">
        <BlurFade delay={0.1}>
          <div className="mb-20">
            <Link href="/" className="flex items-center gap-2 text-text4 tracking-[-0.04em] font-semibold text-foreground/20 hover:text-foreground transition-all duration-500 group ">
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={14}
                className="transition-transform duration-500 group-hover:-translate-x-1"
              />
              <span>Página inicial</span>
            </Link>
          </div>
        </BlurFade>

        <AnimatePresence mode="wait">
          {success ? (
            <BlurFade delay={0.2} key="success">
              <div className="text-center space-y-12 py-10">
                <div className="flex justify-center mb-12">
                  <div className="w-24 h-24 rounded-[2.5rem] glass border border-emerald-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} className="text-emerald-500/60" />
                  </div>
                </div>
                <div className="space-y-6">
                  <p className="text-text4 font-semibold text-primary tracking-[-0.04em]  opacity-50">Registro completo</p>
                  <h1 className="text-heading1 md:text-[3rem] text-foreground font-semibold tracking-[-0.04em] leading-none">Revisa tu email</h1>
                  <p className="text-text2 font-medium text-foreground/30 tracking-[-0.04em]">
                    Hemos enviado un enlace de confirmación a:
                  </p>
                  <p className="text-heading3 text-foreground/50 font-semibold tabular-nums tracking-[-0.04em] pt-4">{email}</p>
                </div>
                <div className="pt-16">
                  <Link href="/login"
                    className="inline-flex items-center gap-2 text-text4 tracking-[-0.04em] font-semibold text-foreground/20 hover:text-foreground transition-all duration-500 group ">
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      size={14}
                      className="transition-transform duration-300 group-hover:-translate-x-1"
                    />
                    <span>Volver al inicio de sesión</span>
                  </Link>
                </div>
              </div>
            </BlurFade>
          ) : (
            <BlurFade delay={0.2} key="form">
              <div className="mb-20 text-center md:text-left">
                <p className="text-text4 font-semibold text-primary tracking-[-0.04em]  mb-4 opacity-50">Registro</p>
                <h1 className="text-heading1 md:text-[3rem] text-foreground font-semibold tracking-[-0.04em] leading-none mb-6">Crear cuenta</h1>
                <p className="text-text2 font-medium text-foreground/30 tracking-[-0.04em]">
                  Comienza tu entrenamiento clínico hoy
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div>
                  <label className="block text-text4 tracking-[-0.04em] font-semibold text-foreground/40 mb-4 ">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    required placeholder="tu@email.com" className={inputClass} />
                </div>
                <div>
                  <label className="block text-text4 tracking-[-0.04em] font-semibold text-foreground/40 mb-4 ">Contraseña</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    required minLength={6} placeholder="••••••••" className={inputClass} />
                </div>
                <div>
                  <label className="block text-text4 tracking-[-0.04em] font-semibold text-foreground/40 mb-4 ">Confirmar contraseña</label>
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    required placeholder="••••••••" className={inputClass} />
                </div>

                {error && <p className="text-text4 font-semibold text-destructive tracking-[-0.04em] ">{error}</p>}

                <ShinyButton type="submit" disabled={loading}
                  className="w-full py-4 rounded-[1.25rem]">
                  <span className="font-semibold tracking-[-0.04em]  py-1">
                    {loading ? 'Procesando...' : 'Registrarse'}
                  </span>
                </ShinyButton>

                {/* Divider */}
                <div className="flex items-center gap-10 opacity-10">
                  <div className="flex-1 h-px bg-white" />
                  <span className="text-text4 font-semibold  tracking-[-0.04em]">o</span>
                  <div className="flex-1 h-px bg-white" />
                </div>

                <GoogleButton />
              </form>

              <p className="mt-20 text-center text-text4 tracking-[-0.04em] font-medium text-foreground/20">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="inline-flex items-center gap-2 text-foreground/40 hover:text-primary transition-all duration-300 ml-3 group">
                  <span className="font-semibold  tracking-[-0.04em]">Iniciar sesión</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </p>
            </BlurFade>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
