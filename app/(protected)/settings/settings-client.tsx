'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HugeiconsIcon } from '@hugeicons/react'
import { 
  UserCircleIcon, 
  UserIcon, 
  StarIcon, 
  Mail01Icon, 
  Moon01Icon, 
  Sun01Icon, 
  InformationCircleIcon, 
  HelpCircleIcon, 
  Logout01Icon 
} from '@hugeicons/core-free-icons'

interface Props {
  userId: string
  email: string
  username: string
  avatarUrl: string | null
  score: number
}

function Avatar({
  url,
  username,
  size = 40,
}: {
  url: string | null
  username: string
  size?: number
}) {
  const initials = username.slice(0, 2).toLowerCase()
  return (
    <div
      className="rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-border bg-card"
      style={{
        width: size,
        height: size,
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={username} className="w-full h-full object-cover" />
      ) : (
        <HugeiconsIcon icon={UserCircleIcon} size={size * 0.5} className="text-muted-foreground/40" />
      )}
    </div>
  )
}

function SettingsRow({
  icon,
  label,
  value,
  onClick,
  destructive = false,
  showChevron = true
}: {
  icon?: string | React.ReactNode
  label: string
  value?: string | React.ReactNode
  onClick?: () => void
  destructive?: boolean
  showChevron?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between py-4 px-2 group transition-all duration-300 ${onClick ? 'cursor-pointer hover:bg-foreground/[0.02]' : 'cursor-default'}`}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${destructive ? 'bg-destructive/10 text-destructive' : 'bg-foreground/[0.05] text-muted-foreground'}`}>
            {typeof icon === 'string' ? icon : icon}
          </div>
        )}
        <span className={`text-[13px] font-medium tracking-[-0.01em] ${destructive ? 'text-destructive/80' : 'text-foreground/70'}`}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className="text-[12px] text-muted-foreground/50 font-medium">{value}</span>}
        {showChevron && (
          <span className="text-[10px] text-muted-foreground/30 transition-transform duration-300 group-hover:translate-x-0.5">
            →
          </span>
        )}
      </div>
    </button>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="px-2 text-text4 font-semibold text-muted-foreground/30 tracking-wider uppercase">
        {title}
      </p>
      <div className="bg-card border border-border rounded-2xl overflow-hidden px-2 divide-y divide-border/20">
        {children}
      </div>
    </div>
  )
}

export function SettingsClient({ userId, email, username: initialUsername, avatarUrl: initialAvatar, score }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark'
    return (localStorage.getItem('heymed_theme') as 'dark' | 'light') || 'dark'
  })

  const [avatarUrl, setAvatarUrl] = useState(initialAvatar)
  const [username, setUsername] = useState(initialUsername)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Avatar upload ────────────────────────────────────────────

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen supera 5 MB.')
      return
    }

    setUploadingAvatar(true)
    setError(null)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploadingAvatar(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = urlData.publicUrl + `?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
    } else {
      setAvatarUrl(publicUrl)
    }

    setUploadingAvatar(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Theme ────────────────────────────────────────────────────

  function toggleTheme(t: 'dark' | 'light') {
    setTheme(t)
    localStorage.setItem('heymed_theme', t)
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(t)
  }

  // ── Save username ────────────────────────────────────────────

  async function handleSaveProfile() {
    if (!username.trim() || savingProfile) return
    setSavingProfile(true)
    setError(null)

    const supabase = createClient()
    const { error: e } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', userId)

    if (e) {
      setError(e.message)
    } else {
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    }
    setSavingProfile(false)
  }

  // ── Delete account ───────────────────────────────────────────

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'ELIMINAR' || deleting) return
    setDeleting(true)
    setError(null)

    const res = await fetch('/api/delete-account', { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al eliminar la cuenta')
      setDeleting(false)
      return
    }

    router.push('/login')
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen transition-colors duration-500">
      <div
        className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 80% 40% at 50% -10%, var(--color-primary-transparent) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-xl mx-auto px-5 py-20 md:py-32 space-y-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-heading1 text-foreground font-bold tracking-[-0.04em]">Ajustes y Soporte</h1>
          </div>
          <Link
            href="/dashboard"
            className="text-text4 tracking-[-0.02em] font-medium text-muted-foreground hover:text-foreground transition-all duration-300 group"
          >
            <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">←</span> Inicio
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-12"
        >
          {/* Group 1: Account Hub */}
          <SettingsSection title="Perfil y Cuenta">
            <SettingsRow
              icon={<Avatar url={avatarUrl} username={username} size={24} />}
              label="Cambiar foto de perfil"
              onClick={() => fileRef.current?.click()}
              value={uploadingAvatar ? 'Subiendo...' : ''}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <SettingsRow
              icon={<HugeiconsIcon icon={UserIcon} size={14} />}
              label="Nombre de usuario"
              value={username}
              onClick={() => {}}
            />
            <SettingsRow
              icon={<HugeiconsIcon icon={StarIcon} size={14} />}
              label="Puntuación"
              value={`${score} pts`}
              showChevron={false}
            />
            <SettingsRow
              icon={<HugeiconsIcon icon={Mail01Icon} size={14} />}
              label="Email"
              value={email}
              showChevron={false}
            />
          </SettingsSection>

          {/* Group 2: Appearance */}
          <SettingsSection title="Personalización">
            <SettingsRow
              icon={theme === 'dark' ? <HugeiconsIcon icon={Moon01Icon} size={14} /> : <HugeiconsIcon icon={Sun01Icon} size={14} />}
              label="Tema"
              value={theme === 'dark' ? 'Oscuro' : 'Claro'}
              onClick={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
            />
            <SettingsRow
              icon={<HugeiconsIcon icon={InformationCircleIcon} size={14} />}
              label="Versión"
              value="1.0.0"
              showChevron={false}
            />
          </SettingsSection>

          {/* Group 3: Support & Actions */}
          <SettingsSection title="Soporte y Otros">
            <SettingsRow
              icon={<HugeiconsIcon icon={HelpCircleIcon} size={14} />}
              label="Ayuda y feedback"
              onClick={() => window.open('https://github.com', '_blank')}
            />
            <SettingsRow
              icon={<HugeiconsIcon icon={Logout01Icon} size={14} />}
              label="Cerrar sesión"
              onClick={handleLogout}
            />
          </SettingsSection>

          {/* Group 4: Danger */}
          <SettingsSection title="Gestión de Datos">
            <div className="p-6 space-y-6">
              <p className="text-text4 text-muted-foreground leading-relaxed tracking-[-0.01em]">
                Eliminar tu cuenta borrará permanentemente tu perfil e historial. Esta acción es definitiva. Escribe <span className="text-destructive/50">ELIMINAR</span> para confirmar.
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="CONFIRMAR"
                  className="w-full bg-transparent text-destructive/60 font-medium text-text2 focus:outline-none py-3 border-b border-destructive/10 focus:border-destructive/40 transition-all duration-300 placeholder:text-muted-foreground/20 tracking-[-0.01em]"
                />
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'ELIMINAR' || deleting}
                  className="w-full py-4 text-text4 tracking-[-0.01em] font-medium transition-all duration-500 bg-destructive/5 border border-destructive/10 text-destructive/60 hover:bg-destructive hover:text-white disabled:opacity-20 rounded-2xl"
                >
                  {deleting ? 'Procesando...' : 'Eliminar cuenta definitivamente'}
                </button>
              </div>
            </div>
          </SettingsSection>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-text4 font-medium text-destructive tracking-[-0.01em]"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
