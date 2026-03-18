'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { ProcessedCase } from '@/app/api/process-case/route'
import { HugeiconsIcon } from '@hugeicons/react'
import { 
  Upload01Icon, 
  Image01Icon, 
  File01Icon, 
  Delete01Icon, 
  CheckmarkCircle01Icon, 
  ArrowLeft01Icon,
  StarIcon,
  Tick01Icon,
  AiIdeaIcon
} from '@hugeicons/core-free-icons'
import { BlurFade } from '@/components/ui/blur-fade'
import { ShinyButton } from '@/components/ui/shiny-button'

type Difficulty = 'easy' | 'medium' | 'hard'
type InputMode = 'text' | 'image'

const difficultyConfig: Record<Difficulty, { label: string; dot: string; text: string }> = {
  easy: { label: 'BÁSICO', dot: 'bg-emerald-500/50', text: 'text-emerald-500' },
  medium: { label: 'MODERADO', dot: 'bg-amber-500/50', text: 'text-amber-500' },
  hard: { label: 'COMPLEJO', dot: 'bg-rose-500/50', text: 'text-rose-500' },
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 5

export function UploadClient({ userId }: { userId: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<InputMode>('text')
  const [raw, setRaw] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [preview, setPreview] = useState<ProcessedCase | null>(null)
  const [diagnosisRevealed, setDiagnosisRevealed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // ── image helpers ──────────────────────────────────────────────────────────

  function acceptImage(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Formato no soportado. Usa JPEG, PNG, WEBP o GIF.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`La imagen supera el límite de ${MAX_SIZE_MB} MB.`)
      return
    }
    setError(null)
    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) acceptImage(file)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) acceptImage(file)
  }

  function clearImage() {
    setImageFile(null)
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImagePreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── processing ─────────────────────────────────────────────────────────────

  async function handleProcess() {
    if (processing) return
    setProcessing(true)
    setError(null)
    setPreview(null)

    try {
      let body: Record<string, unknown>

      if (mode === 'image' && imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer()
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((s, b) => s + String.fromCharCode(b), '')
        )
        body = { imageBase64: base64, imageType: imageFile.type }
      } else {
        if (!raw.trim()) return
        body = { rawCase: raw }
      }

      const res = await fetch('/api/process-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPreview(data as ProcessedCase)
      setDiagnosisRevealed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando el caso')
    } finally {
      setProcessing(false)
    }
  }

  async function handleSave() {
    if (!preview || saving) return
    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('cases')
        .insert({
          description: preview.description,
          correct_diagnosis: preview.correct_diagnosis,
          difficulty: preview.difficulty,
          system: (preview as typeof preview & { system?: string }).system ?? 'otro',
        })

      if (insertError) throw new Error(insertError.message)
      setSaved(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando el caso')
    } finally {
      setSaving(false)
    }
  }

  const canProcess = mode === 'text' ? raw.trim().length >= 50 : !!imageFile

  // ── saved state ────────────────────────────────────────────────────────────

  if (saved) {
    return (
      <BlurFade>
        <div className="text-center py-40 glass rounded-[3rem] border border-white/[0.03] space-y-8">
          <div className="w-20 h-20 rounded-full glass border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} />
          </div>
          <div>
            <p className="text-heading2 text-foreground font-bold tracking-tight mb-4 uppercase">Caso guardado</p>
            <p className="text-text4 tracking-widest font-bold text-foreground/20 uppercase">
              Volviendo al dashboard...
            </p>
          </div>
        </div>
      </BlurFade>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-20 pb-20">
      {/* Header */}
      <BlurFade>
        <div className="space-y-6">
          <h1 className="text-heading1 text-foreground font-bold tracking-tight uppercase">Subir caso clínico</h1>
          <p className="text-foreground/40 leading-relaxed max-w-2xl text-text2 font-bold tracking-tight">
            Pega el texto de un caso clínico o sube una imagen — notas de clase, artículo, caso real
            anonimizado. La IA lo estructurará y generará el diagnóstico correcto.
          </p>
        </div>
      </BlurFade>

      <AnimatePresence mode="wait">
        {!preview && (
          <div key="upload-controls">
            {/* Mode toggle */}
            <BlurFade delay={0.1}>
              <div className="inline-flex rounded-full p-1.5 mb-16 glass border border-white/[0.03]">
                {(['text', 'image'] as InputMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(null) }}
                    className={`relative px-10 py-3 rounded-full text-text4 font-bold tracking-widest uppercase transition-all duration-700 ${
                      mode === m ? 'bg-foreground text-background shadow-lg' : 'text-foreground/20 hover:text-foreground/40'
                    }`}
                  >
                    {m === 'text' ? 'Texto' : 'Imagen'}
                  </button>
                ))}
              </div>
            </BlurFade>

            {/* ── TEXT INPUT ── */}
            {mode === 'text' && (
              <BlurFade delay={0.2} key="text-input">
                <div className="space-y-8">
                  <div className="relative rounded-[3rem] overflow-hidden glass border border-white/[0.03] focus-within:border-primary/20 transition-all duration-700 bg-white/[0.01]">
                    <textarea
                      value={raw}
                      onChange={e => setRaw(e.target.value)}
                      placeholder="Paciente de 45 años que acude por dolor torácico opresivo de 2 horas de evolución..."
                      rows={12}
                      className="w-full bg-transparent px-10 py-10 text-foreground placeholder:text-foreground/10 resize-none focus:outline-none leading-relaxed text-text1 font-bold tracking-tight"
                    />
                    <div className="px-10 py-5 border-t border-white/[0.03] flex justify-between items-center bg-white/[0.01]">
                      <span className="text-text4 font-bold text-foreground/10 tracking-widest uppercase tabular-nums">
                        {raw.length} caracteres
                      </span>
                    </div>
                  </div>
                </div>
              </BlurFade>
            )}

            {/* ── IMAGE INPUT ── */}
            {mode === 'image' && (
              <BlurFade delay={0.2} key="image-input">
                <div className="space-y-8">
                  {!imageFile ? (
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative rounded-[3rem] overflow-hidden cursor-pointer transition-all duration-700 select-none group glass flex flex-col items-center justify-center gap-8 ${
                        dragOver ? 'border-primary/40 bg-primary/5' : 'border-white/[0.05] hover:bg-white/[0.02]'
                      }`}
                      style={{ minHeight: '400px', borderStyle: 'dashed', borderWidth: '2px' }}
                    >
                      <div className="w-20 h-20 rounded-[2rem] glass border border-white/[0.05] flex items-center justify-center group-hover:scale-110 group-hover:border-primary/20 transition-all duration-700">
                        <HugeiconsIcon icon={Image01Icon} size={32} className="text-primary/40 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="text-center space-y-3">
                        <p className="text-text2 font-bold text-foreground/40 tracking-tight group-hover:text-foreground/60 transition-colors">
                          Arrastra una imagen o{' '}
                          <span className="text-primary/60 underline underline-offset-4">selecciona un archivo</span>
                        </p>
                        <p className="text-text4 font-bold text-foreground/10 tracking-widest uppercase">
                          JPEG · PNG · WEBP · GIF · MÁX {MAX_SIZE_MB} MB
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_TYPES.join(',')}
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-[3rem] overflow-hidden glass border border-white/[0.03] p-10 group">
                      <div className="relative rounded-[2rem] overflow-hidden border border-white/[0.03]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreviewUrl!}
                          alt="Vista previa"
                          className="w-full max-h-[500px] object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-8">
                        <div className="flex items-center gap-4">
                          <HugeiconsIcon icon={File01Icon} size={18} className="text-foreground/20" />
                          <span className="text-text4 font-bold text-foreground/40 tracking-widest uppercase truncate max-w-[300px]">
                            {imageFile.name}
                          </span>
                        </div>
                        <button
                          onClick={clearImage}
                          className="flex items-center gap-2 text-text4 font-bold text-rose-500/40 hover:text-rose-500 tracking-widest uppercase transition-all duration-500"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={14} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </BlurFade>
            )}

            {/* Process button */}
            <BlurFade delay={0.4}>
              <div className="flex justify-center mt-12">
                <ShinyButton
                  onClick={handleProcess}
                  disabled={!canProcess || processing}
                  className="px-16 py-5 rounded-full"
                >
                  <span className="font-bold tracking-widest uppercase py-1">
                    {processing ? 'Procesando...' : 'Analizar con IA'}
                  </span>
                </ShinyButton>
              </div>
            </BlurFade>
          </div>
        )}
      </AnimatePresence>

      {/* Preview */}
      <AnimatePresence>
        {preview && (
          <BlurFade delay={0.1} key="preview">
            <div className="space-y-12">
              <div className="relative rounded-[3rem] p-12 overflow-hidden glass border border-white/[0.03] bg-white/[0.01]">
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 to-transparent" />
                
                <div className="relative space-y-16">
                  <div className="flex items-center justify-between">
                    <p className="text-text4 tracking-widest font-bold text-foreground/20 uppercase flex items-center gap-3">
                      <HugeiconsIcon icon={AiIdeaIcon} size={14} className="text-primary/40" />
                      Vista previa estructurada
                    </p>
                    {(() => {
                      const conf = difficultyConfig[preview.difficulty]
                      return (
                        <div className="flex items-center gap-3 px-6 py-2 rounded-full glass border border-white/[0.03]">
                          <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} animate-pulse`} />
                          <span className={`text-text4 font-bold tracking-widest ${conf.text}`}>
                            {conf.label}
                          </span>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="space-y-6">
                    <p className="text-text4 tracking-widest font-bold text-foreground/10 uppercase">Descripción del caso</p>
                    <textarea
                      value={preview.description}
                      onChange={e => setPreview({ ...preview, description: e.target.value })}
                      rows={8}
                      className="w-full bg-transparent text-foreground focus:outline-none leading-relaxed text-text1 font-bold tracking-tight resize-none border-none p-0"
                    />
                  </div>

                  <div className="pt-12 border-t border-white/[0.03] space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-text4 tracking-widest font-bold text-foreground/10 uppercase">
                        Diagnóstico correcto
                      </p>
                      <button
                        onClick={() => setDiagnosisRevealed(v => !v)}
                        className="text-text4 font-bold text-foreground/20 hover:text-foreground tracking-widest uppercase transition-all duration-500"
                      >
                        {diagnosisRevealed ? 'Ocultar' : 'Revelar para editar'}
                      </button>
                    </div>
                    {diagnosisRevealed ? (
                      <input
                        type="text"
                        value={preview.correct_diagnosis}
                        onChange={e => setPreview({ ...preview, correct_diagnosis: e.target.value })}
                        className="w-full bg-transparent text-foreground/80 font-bold text-text2 focus:outline-none border-b border-primary/20 py-4 tracking-tight uppercase"
                        autoFocus
                      />
                    ) : (
                      <p className="font-bold text-text2 tracking-[0.4em] text-foreground/10 select-none">
                        {'●'.repeat(Math.min(preview.correct_diagnosis.length, 24))}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-8 translate-y-[-50%] relative z-20">
                <ShinyButton
                  onClick={handleSave}
                  disabled={saving || !preview.description || !preview.correct_diagnosis}
                  className="px-20 py-6 rounded-full"
                >
                  <span className="font-bold tracking-widest uppercase py-1 text-base">
                    {saving ? 'Guardando...' : 'Confirmar y guardar'}
                  </span>
                </ShinyButton>

                <button
                  onClick={() => setPreview(null)}
                  className="group flex items-center gap-3 text-text4 font-bold text-foreground/20 hover:text-foreground tracking-widest uppercase transition-all duration-500"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} className="group-hover:-translate-x-1 transition-transform" />
                  <span>Descartar y volver</span>
                </button>
              </div>
            </div>
          </BlurFade>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <BlurFade>
            <p className="text-center text-text4 font-bold text-rose-500 tracking-widest uppercase mt-8">
              {error}
            </p>
          </BlurFade>
        )}
      </AnimatePresence>
    </div>
  )
}
