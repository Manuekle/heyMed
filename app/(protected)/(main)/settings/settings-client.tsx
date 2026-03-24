'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
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
  Logout01Icon,
  ArrowRight01Icon,
  Camera01Icon,
  Alert01Icon,
  CodeIcon
} from '@hugeicons/core-free-icons'
import { PageHeader } from '@/components/page-header'

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
  onEdit,
  uploading = false
}: {
  url: string | null
  username: string
  size?: number
  onEdit?: () => void
  uploading?: boolean
}) {
  return (
    <div
      className={`relative group/avatar shrink-0 ${onEdit && !uploading ? 'cursor-pointer' : ''}`}
      style={{ width: size, height: size }}
      onClick={onEdit && !uploading ? onEdit : undefined}
    >
      <div
        className="relative rounded-full overflow-hidden flex items-center justify-center bg-foreground/[0.02] glass shadow-2xl transition-all duration-500"
        style={{ width: size, height: size }}
      >
        <div className={`w-full h-full transition-all duration-700 ease-out ${onEdit && !uploading ? 'group-hover/avatar:blur-sm group-hover/avatar:scale-110' : ''}`}>
          {url ? (
            <img
              src={url}
              alt={username || "Avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-foreground/[0.03]">
              <HugeiconsIcon
                icon={UserCircleIcon}
                size={size * 0.5}
                className="text-foreground/10"
              />
            </div>
          )}
        </div>

        {onEdit && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-500 bg-background/20 backdrop-blur-[2px] z-10">
            <HugeiconsIcon icon={Camera01Icon} size={size * 0.3} className="text-white scale-50 group-hover/avatar:scale-100 transition-transform duration-500 ease-out" />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-20">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </div>
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
  icon?: React.ReactNode
  label: string
  value?: string | React.ReactNode
  onClick?: () => void
  destructive?: boolean
  showChevron?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between py-5 px-6 md:px-8 group transition-all duration-500 ${onClick ? 'cursor-pointer hover:bg-foreground/[0.03]' : 'cursor-default'}`}
    >
      <div className="flex items-center gap-5">
        {icon && (
          <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center border border-foreground/[0.05] transition-all duration-500 bg-foreground/[0.03] ${destructive ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'text-foreground/20 group-hover:text-foreground/40 group-hover:border-foreground/10'}`}>
            {icon}
          </div>
        )}
        <span className={`text-xs md:text-sm font-semibold tracking-[-0.04em] transition-colors duration-500 ${destructive ? 'text-rose-500/80 hover:text-rose-500' : 'text-foreground/40 group-hover:text-foreground/70'}`}>
          {label.toLowerCase()}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {value && <span className="text-xs md:text-sm text-foreground/20 font-semibold tracking-[-0.02em]">{typeof value === 'string' ? value.toLowerCase() : value}</span>}
        {showChevron && (
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={14}
            className="text-foreground/5 transition-all duration-500 group-hover:translate-x-1 group-hover:text-foreground/20"
          />
        )}
      </div>
    </button>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="px-6 text-text3 font-semibold tracking-[-0.04em] text-foreground/20">
        {title.toLowerCase()}
      </p>
      <div className="glass rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
        <div className="divide-y divide-foreground/[0.02]">
          {children}
        </div>
      </div>
    </div>
  )
}

export function SettingsClient({ userId, email, username: initialUsername, avatarUrl: initialAvatar, score }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('heymed_theme') as 'dark' | 'light') || 'light'
  })

  const [avatarUrl, setAvatarUrl] = useState(initialAvatar)
  const [username, setUsername] = useState(initialUsername)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [tempUsername, setTempUsername] = useState(username)

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
      setIsEditingUsername(false)
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
    <div className="space-y-12">
      <PageHeader
        label="ajustes"
        title="Configuración"
        description="Gestiona tu información personal, preferencias de tema y seguridad de la cuenta."
        backLink="/dashboard"
      />

      <div className="flex flex-col items-center justify-center space-y-8 py-12">
        <div className="relative">
          <Avatar
            url={avatarUrl}
            username={username}
            size={100}
            onEdit={() => fileRef.current?.click()}
            uploading={uploadingAvatar}
          />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-text1 font-semibold tracking-[-0.04em] text-foreground">
            {username}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs md:text-sm font-semibold text-foreground/20 tracking-[-0.04em]">
              {email}
            </span>
            <div className="h-1 w-1 rounded-full bg-foreground/5" />
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-foreground/[0.02]">
              <HugeiconsIcon icon={StarIcon} size={10} className="text-primary/60" />
              <span className="text-xs md:text-sm font-semibold text-primary/60 tracking-[-0.04em]">
                {score} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-12"
      >
        {/* Group 1: Account Hub */}
        <SettingsSection title="Perfil y Cuenta">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <SettingsRow
            icon={<HugeiconsIcon icon={UserIcon} size={14} />}
            label="nombre de usuario"
            value={username}
            onClick={() => {
              setTempUsername(username)
              setIsEditingUsername(true)
            }}
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
          <div className="px-6 md:px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-5">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center border border-foreground/[0.05] transition-all duration-500 bg-foreground/[0.03] text-foreground/20">
                <HugeiconsIcon icon={theme === 'dark' ? Moon01Icon : Sun01Icon} size={14} />
              </div>
              <span className="text-xs md:text-sm font-semibold tracking-[-0.04em] text-foreground/40">tema</span>
            </div>

            <div className="inline-flex rounded-full p-1 bg-foreground/[0.02] border border-foreground/[0.05] relative">
              {(['light', 'dark'] as const).map(t => {
                const active = theme === t
                return (
                  <button
                    key={t}
                    onClick={() => toggleTheme(t)}
                    className={`relative px-6 py-2 rounded-full text-xs md:text-sm font-semibold tracking-[-0.04em] transition-colors duration-500 z-10 ${active ? 'text-background' : 'text-foreground/20 hover:text-foreground'}`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeTheme"
                        className="absolute inset-0 bg-foreground rounded-full -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {t === 'light' ? 'claro' : 'oscuro'}
                  </button>
                )
              })}
            </div>
          </div>
          <SettingsRow
            icon={<HugeiconsIcon icon={InformationCircleIcon} size={14} />}
            label="versión"
            value="1.0.0"
            showChevron={false}
          />
          <SettingsRow
            icon={<HugeiconsIcon icon={CodeIcon} size={14} />}
            label="creador"
            value="manudev"
            onClick={() => window.open('https://manudev.vercel.app', '_blank')}
          />
        </SettingsSection>

        {/* Group 3: Support & Actions */}
        <SettingsSection title="Soporte y Otros">
          <SettingsRow
            icon={<HugeiconsIcon icon={HelpCircleIcon} size={14} />}
            label="ayuda y feedback"
            onClick={() => window.open('https://github.com', '_blank')}
          />
          <SettingsRow
            icon={<HugeiconsIcon icon={Logout01Icon} size={14} />}
            label="cerrar sesión"
            onClick={handleLogout}
          />
        </SettingsSection>

        {/* Group 4: Danger */}
        <SettingsSection title="zona de peligro">
          <div className="p-6 md:p-10 flex flex-col items-center text-center space-y-8 md:space-y-10 bg-rose-500/[0.01]">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                <HugeiconsIcon icon={Alert01Icon} size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-xs md:text-sm font-semibold tracking-[-0.04em] text-rose-500/30 ">atención</p>
                <p className="text-xs md:text-sm text-rose-500/60 leading-relaxed tracking-[-0.04em] font-medium italic max-w-xs mx-auto">
                  eliminar tu cuenta borrará permanentemente tu perfil e historial.<br />esta acción es definitiva.
                </p>
              </div>
            </div>

            <div className="w-full max-w-sm space-y-8">
              <div className="space-y-3">
                <p className="text-xs md:text-sm font-semibold tracking-[-0.04em] text-rose-500/20">escribe "eliminar" para confirmar</p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="eliminar"
                  className="w-full bg-rose-500/[0.03] text-rose-500 font-semibold text-center text-xs md:text-sm focus:outline-none px-8 py-2 rounded-full border border-rose-500/10 focus:border-rose-500/30 transition-all duration-500 placeholder:text-rose-500/10 tracking-[-0.04em]"
                />
              </div>

              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'eliminar' || deleting}
                className={`w-full py-2 text-xs md:text-sm tracking-[-0.04em] font-semibold transition-all duration-700 rounded-full border border-rose-500/20 ${deleteConfirm === 'eliminar'
                  ? 'bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-rose-500/5 text-rose-500/40 opacity-50'
                  }`}
              >
                {deleting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    <span>procesando...</span>
                  </div>
                ) : 'eliminar cuenta definitivamente'}
              </button>
            </div>
          </div>
        </SettingsSection>
      </motion.div>

      {/* Edit Username Modal */}
      <AnimatePresence>
        {isEditingUsername && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 dark:bg-black/60"
            onClick={(e) => e.target === e.currentTarget && setIsEditingUsername(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="w-full max-w-[320px] rounded-[2.5rem] p-10 space-y-8 bg-white dark:bg-[#0f0f0f] border border-black/5 dark:border-white/5 shadow-2xl"
            >
              <div className="text-center">
                <p className="text-xs md:text-sm font-semibold tracking-[-0.04em] text-black/40 dark:text-white/40">editar perfil</p>
                <h3 className="text-text2 font-bold tracking-[-0.04em] text-black/80 dark:text-white/80 mt-1">cambiar nombre</h3>
              </div>

              <input
                autoFocus
                type="text"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                className="w-full bg-black/[0.03] dark:bg-foreground/[0.03] border border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-full px-6 py-2 text-center text-text2 font-medium focus:outline-none transition-colors duration-150 placeholder:text-black/30 dark:placeholder:text-white/30 text-black dark:text-white tracking-[-0.02em]"
                placeholder="nuevo username"
              />

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setUsername(tempUsername)
                    handleSaveProfile()
                  }}
                  disabled={savingProfile || !tempUsername.trim() || tempUsername === username}
                  className="w-full py-2 rounded-full bg-black dark:bg-white text-white dark:text-black text-text3 font-bold disabled:opacity-30 transition-transform active:scale-95 duration-150"
                >
                  {savingProfile ? 'guardando...' : 'guardar cambios'}
                </button>
                <button
                  onClick={() => setIsEditingUsername(false)}
                  className="w-full py-2 rounded-full text-xs md:text-sm font-semibold tracking-[-0.04em] text-destructive hover:opacity-70 transition-opacity duration-150"
                >
                  cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
  )
}
