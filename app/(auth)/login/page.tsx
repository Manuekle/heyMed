'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { GoogleButton } from '@/components/google-button'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { BlurFade } from '@/components/ui/blur-fade'
import { ShinyButton } from '@/components/ui/shiny-button'

const inputClass =
  'w-full bg-transparent border-b border-white/[0.08] py-4 text-foreground placeholder:text-foreground/20 outline-none focus:border-primary/40 transition-all duration-500 font-medium text-text2 tracking-tight'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 transition-colors duration-500">
      <div
        className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-100"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, var(--color-primary-transparent) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm">
        {/* Back */}
        <BlurFade delay={0.1}>
          <div className="mb-20">
            <Link href="/" className="flex items-center gap-2 text-text4 tracking-widest font-bold text-foreground/20 hover:text-foreground transition-all duration-500 group uppercase">
              <HugeiconsIcon 
                icon={ArrowLeft01Icon} 
                size={14} 
                className="transition-transform duration-500 group-hover:-translate-x-1" 
              />
              <span>Página inicial</span>
            </Link>
          </div>
        </BlurFade>

        {/* Title */}
        <BlurFade delay={0.2}>
          <div className="mb-20 text-center md:text-left">
            <p className="text-text4 font-bold text-primary tracking-widest uppercase mb-4 opacity-50">Acceso</p>
            <h1 className="text-heading1 md:text-[3rem] text-foreground font-bold tracking-tight leading-none mb-6">Hola de nuevo</h1>
            <p className="text-text2 font-medium text-foreground/30 tracking-tight">
              Ingresa a tu cuenta para continuar
            </p>
          </div>
        </BlurFade>

        {/* Form */}
        <BlurFade delay={0.3}>
          <form onSubmit={handleSubmit} className="space-y-12">
            <div>
              <label className="block text-text4 tracking-widest font-bold text-foreground/40 mb-4 uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-text4 tracking-widest font-bold text-foreground/40 mb-4 uppercase">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-text4 font-bold text-destructive tracking-tight uppercase">{error}</p>
            )}

            <ShinyButton
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-[1.25rem]"
            >
              <span className="font-bold tracking-widest uppercase py-1">
                {loading ? 'Entrando...' : 'Entrar'}
              </span>
            </ShinyButton>

            {/* Divider */}
            <div className="flex items-center gap-10 opacity-20">
              <div className="flex-1 h-px bg-white" />
              <span className="text-text4 font-bold uppercase tracking-widest">o</span>
              <div className="flex-1 h-px bg-white" />
            </div>

            <GoogleButton />
          </form>
        </BlurFade>

        {/* Footer */}
        <BlurFade delay={0.4}>
          <p className="mt-20 text-center text-text4 tracking-tight font-medium text-foreground/20">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="inline-flex items-center gap-2 text-foreground/40 hover:text-primary transition-all duration-300 ml-3 group">
              <span className="font-bold uppercase tracking-widest">Registrarse</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </p>
        </BlurFade>
      </div>
    </div>
  )
}
