'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ProcessedCase } from '@/app/api/process-case/route'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Image01Icon,
  File01Icon,
  Delete01Icon,
  CheckmarkCircle01Icon,
  ArrowLeft01Icon,
  AiIdeaIcon,
  TextIcon,
  SparklesIcon,
  ViewIcon,
  ViewOffSlashIcon
} from '@hugeicons/core-free-icons'
import { BlurFade } from '@/components/ui/blur-fade'
import { ShinyButton } from '@/components/ui/shiny-button'
import { PageHeader } from '@/components/page-header'

type Difficulty = 'easy' | 'medium' | 'hard'
type InputMode = 'text' | 'image'

const difficultyConfig: Record<Difficulty, { label: string; dot: string; text: string; bg: string }> = {
  easy: { label: 'Básico', dot: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  medium: { label: 'Moderado', dot: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10' },
  hard: { label: 'Complejo', dot: 'bg-rose-500', text: 'text-rose-500', bg: 'bg-rose-500/10' },
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

  if (saved) {
    return (
      <BlurFade>
        <div className="text-center py-40 rounded-[3rem] border border-border bg-card/50 space-y-8">
          <div className="w-20 h-20 rounded-full border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500 bg-emerald-500/10">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} />
          </div>
          <div>
            <p className="text-heading2 text-foreground font-semibold tracking-[-0.04em] mb-4 ">Caso guardado</p>
            <p className="text-text4 tracking-[-0.04em] font-semibold text-muted-foreground/40 ">
              Volviendo al dashboard...
            </p>
          </div>
        </div>
      </BlurFade>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-16">
      <PageHeader
        label="NUEVO CASO"
        title="Subir caso clínico"
        description="Estructura tus casos con IA. Pega el texto o sube una imagen de un caso médico."
        backLink="/dashboard"
      />

      <AnimatePresence mode="wait">
        {!preview && (
          <motion.div
            key="upload-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-12"
          >
            {/* Elegant Mode Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-full p-1 bg-card/80 border border-border relative">
                {(['text', 'image'] as InputMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(null) }}
                    className={`relative px-8 py-2.5 rounded-full text-[13px] font-semibold tracking-[-0.02em] flex items-center gap-2 z-10 transition-colors duration-500 ${mode === m ? 'text-background' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {mode === m && (
                      <motion.div
                        layoutId="active-tab"
                        className="absolute inset-0 bg-foreground rounded-full z-[-1]"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <HugeiconsIcon
                      icon={m === 'text' ? TextIcon : Image01Icon}
                      size={14}
                      strokeWidth={2}
                    />
                    {m === 'text' ? 'Texto' : 'Imagen'}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Input Area */}
            <div className="relative rounded-[2.5rem] bg-card/40 border border-border overflow-hidden transition-all duration-500 focus-within:border-primary/30">
              <AnimatePresence mode="wait">
                {mode === 'text' ? (
                  <motion.div
                    key="text-input-field"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-1"
                  >
                    <textarea
                      value={raw}
                      onChange={e => setRaw(e.target.value)}
                      placeholder="Paciente de 45 años que acude por dolor torácico opresivo de 2 horas de evolución..."
                      className="w-full bg-transparent px-8 py-10 min-h-[400px] text-foreground placeholder:text-muted-foreground resize-none focus:outline-none leading-relaxed text-text2 md:text-text1 font-medium tracking-[-0.04em]"
                    />
                    <div className="px-8 py-4 border-t border-border/50 flex justify-between items-center bg-foreground/[0.02]">
                      <span className="text-[11px] font-semibold text-muted-foreground tabular-nums font-sans">
                        {raw.length} caracteres
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${raw.length >= 50 ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                        <span className="text-[11px] font-semibold text-muted-foreground">mínimo 50 caracteres</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="image-input-field"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="p-1"
                  >
                    {!imageFile ? (
                      <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`min-h-[400px] flex flex-col items-center justify-center gap-8 cursor-pointer transition-all duration-500 group border-2 border-dashed rounded-[2rem] m-2 ${dragOver ? 'border-primary/40 bg-primary/5' : 'border-border/50 hover:bg-foreground/[0.02]'}`}
                      >
                        <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          <HugeiconsIcon icon={Image01Icon} size={24} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-text2 font-semibold text-foreground/40 tracking-[-0.04em]">
                            Suelte el archivo aquí o <span className="text-primary/60">explore</span>
                          </p>
                          <p className="text-[11px] font-semibold text-muted-foreground">
                            JPEG · PNG · WEBP · {MAX_SIZE_MB}MB MÁX
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
                      <div className="p-8 space-y-8">
                        <div className="relative rounded-2xl overflow-hidden border border-border aspect-[4/3] bg-card/50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imagePreviewUrl!} alt="Preview" className="w-full h-full object-contain" />
                          <button
                            onClick={clearImage}
                            className="absolute top-4 right-4 p-2 rounded-xl bg-background/80 backdrop-blur-md border border-border text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-foreground/[0.02] border border-border/50">
                          <HugeiconsIcon icon={File01Icon} size={16} className="text-muted-foreground" />
                          <span className="text-[12px] font-medium text-foreground/60 truncate flex-1">{imageFile.name}</span>
                          <span className="text-[10px] font-semibold text-muted-foreground/20 uppercase tracking-[-0.04em]">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Action */}
            <div className="flex flex-col items-center gap-6">
              <ShinyButton
                onClick={handleProcess}
                disabled={!canProcess || processing}
                className="px-12 py-3 rounded-full"
              >
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={SparklesIcon} size={16} />
                  <span className="font-semibold tracking-[-0.02em]">
                    {processing ? 'Analizando...' : 'Procesar con IA'}
                  </span>
                </div>
              </ShinyButton>
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[12px] font-semibold text-rose-500/80 tracking-[-0.04em]"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aesthetic Structured Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            key="preview-view"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-12"
          >
            <div className="rounded-[2.5rem] bg-card border border-border overflow-hidden relative shadow-2xl">
              {/* Refined Header */}
              <div className="px-12 py-10 flex items-center justify-between border-b border-border/50 bg-foreground/[0.01]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <HugeiconsIcon icon={AiIdeaIcon} size={20} />
                  </div>
                  <div>
                    <h4 className="text-[14px]">Vista previa del caso</h4>
                  </div>
                </div>
                {(() => {
                  const conf = difficultyConfig[preview.difficulty]
                  return (
                    <div className={`flex items-center gap-2 px-5 py-1.5 rounded-full ${conf.bg} border border-${conf.text}/10`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} animate-pulse`} />
                      <span className={`text-[12px] font-semibold tracking-[-0.04em] uppercase ${conf.text}`}>
                        {conf.label}
                      </span>
                    </div>
                  )
                })()}
              </div>

              {/* Description Body */}
              <div className="p-12 space-y-12">
                <div className="space-y-6">
                  <label className="text-[11px] font-medium text-muted-foreground">Descripción Clínica</label>
                  <textarea
                    value={preview.description}
                    onChange={e => setPreview({ ...preview, description: e.target.value })}
                    rows={8}
                    className="w-full bg-transparent text-foreground/80 focus:outline-none leading-relaxed text-text2 md:text-text1 font-medium tracking-[-0.04em] border-none p-0 resize-none min-h-[100px]"
                  />
                </div>

                {/* Dotted Separator */}
                <div className="border-t border-dashed border-border/60" />

                {/* Diagnosis Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium">Diagnóstico Final</label>
                    <button
                      onClick={() => setDiagnosisRevealed(v => !v)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-foreground/[0.03] transition-colors group"
                    >
                      <HugeiconsIcon
                        icon={diagnosisRevealed ? ViewOffSlashIcon : ViewIcon}
                        size={14}
                        className="text-primary/40 group-hover:text-primary transition-colors"
                      />
                      <span className="text-[11px] font-semibold text-muted-foreground/40 group-hover:text-foreground/60 transition-colors uppercase tracking-[-0.04em]">
                        {diagnosisRevealed ? 'Ocultar' : 'Revelar'}
                      </span>
                    </button>
                  </div>

                  <div className="min-h-[80px] p-6 rounded-2xl bg-foreground/[0.015] border border-border/30 flex items-center">
                    {diagnosisRevealed ? (
                      <input
                        type="text"
                        value={preview.correct_diagnosis}
                        onChange={e => setPreview({ ...preview, correct_diagnosis: e.target.value })}
                        className="w-full bg-transparent text-foreground font-semibold text-heading3 focus:outline-none tracking-[-0.04em] border-none p-0"
                        placeholder="Escribe el diagnóstico..."
                        autoFocus
                      />
                    ) : (
                      <div className="flex gap-3">
                        {[...Array(10)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="w-3.5 h-3.5 rounded-full bg-foreground/5"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Strip */}
              <div className="px-12 py-8 bg-foreground/[0.015] border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-8">
                <button
                  onClick={() => setPreview(null)}
                  className="group flex items-center gap-2 text-text4 font-semibold text-muted-foreground/40 hover:text-foreground transition-all"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} className="group-hover:-translate-x-1 transition-transform" />
                  <span>Descartar y volver</span>
                </button>

                <ShinyButton
                  onClick={handleSave}
                  disabled={saving || !preview.description || !preview.correct_diagnosis}
                  className="px-12 py-3 rounded-full shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                    <span className="font-semibold text-[14px]">
                      {saving ? 'Guardando...' : 'Confirmar y Guardar'}
                    </span>
                  </div>
                </ShinyButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
