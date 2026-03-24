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
  ViewOffSlashIcon,
  Mic01Icon,
  MicOffIcon,
} from '@hugeicons/core-free-icons'
import { BlurFade } from '@/components/ui/blur-fade'
import { ShinyButton } from '@/components/ui/shiny-button'
import { PageHeader } from '@/components/page-header'

type Difficulty = 'easy' | 'medium' | 'hard'
type InputMode = 'text' | 'image' | 'voice'

const difficultyConfig: Record<Difficulty, { label: string; dot: string; text: string; bg: string }> = {
  easy: { label: 'básico', dot: 'bg-emerald-500/50', text: 'text-emerald-500/60', bg: 'bg-emerald-500/5' },
  medium: { label: 'moderado', dot: 'bg-amber-500/50', text: 'text-amber-500/60', bg: 'bg-amber-500/5' },
  hard: { label: 'complejo', dot: 'bg-rose-500/50', text: 'text-rose-500/60', bg: 'bg-rose-500/5' },
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 5

export function UploadClient({ userId }: { userId: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

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
  const [isRecording, setIsRecording] = useState(false)

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

  // ── voice helpers ──────────────────────────────────────────────────────────

  function startRecording() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setError('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.')
      return
    }
    setError(null)
    setRaw('')

    const recognition = new SR()
    recognition.lang = 'es-ES'
    recognition.continuous = true
    recognition.interimResults = true

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setRaw(transcript.trim())
    }

    recognition.onerror = () => {
      setIsRecording(false)
      setError('Error al acceder al micrófono.')
    }

    recognition.onend = () => setIsRecording(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  function handleModeChange(m: InputMode) {
    if (isRecording) stopRecording()
    setMode(m)
    setError(null)
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
          user_id: userId,
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

  const canProcess =
    mode === 'image' ? !!imageFile :
      mode === 'voice' ? raw.trim().length >= 10 && !isRecording :
        raw.trim().length >= 50

  if (saved) {
    return (
      <BlurFade>
        <div className="text-center py-40 rounded-[3rem] border border-border bg-card/50 space-y-8">
          <div className="w-20 h-20 rounded-full border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500 bg-emerald-500/10">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} />
          </div>
          <div>
            <p className="text-heading2 text-foreground font-semibold tracking-[-0.04em] mb-4 ">Caso guardado</p>
            <p className="text-text4 tracking-[-0.04em] font-medium text-foreground/30 ">
              Volviendo al dashboard...
            </p>
          </div>
        </div>
      </BlurFade>
    )
  }

  return (
    <div className="space-y-10">
      <PageHeader
        label="nuevo"
        title="Subir caso"
        description="Estructura tus casos clínicos con IA pegando el texto o subiendo una imagen."
        backLink="/dashboard"
      />

      <AnimatePresence mode="wait">
        {!preview && (
          <motion.div
            key="upload-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-10"
          >
            {/* Mode Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-full p-1 bg-card/80 border border-border/60 relative">
                {(['text', 'image', 'voice'] as InputMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    className={`relative px-8 py-2.5 rounded-full text-xs md:text-sm font-semibold tracking-[-0.04em] flex items-center gap-2 z-10 transition-colors duration-500 ${mode === m ? 'text-background' : 'text-foreground/40 hover:text-foreground'}`}
                  >
                    {mode === m && (
                      <motion.div
                        layoutId="active-tab"
                        className="absolute inset-0 bg-foreground rounded-full z-[-1]"
                        transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
                      />
                    )}
                    <HugeiconsIcon
                      icon={m === 'text' ? TextIcon : m === 'image' ? Image01Icon : Mic01Icon}
                      size={14}
                      strokeWidth={2}
                    />
                    {m === 'text' ? 'texto' : m === 'image' ? 'imagen' : 'voz'}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Surface */}
            <div className="relative rounded-[2rem] bg-card/30 border border-border transition-all duration-700 focus-within:border-primary/20">
              <AnimatePresence mode="wait">
                {mode === 'text' ? (
                  <motion.div
                    key="text-input"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className="flex flex-col"
                  >
                    <div className="relative">
                      <textarea
                        value={raw}
                        onChange={e => setRaw(e.target.value)}
                        placeholder="pega aquí o escribe el caso clínico..."
                        className="w-full bg-transparent px-10 py-12 min-h-[400px] text-foreground placeholder:text-muted-foreground resize-none focus:outline-none leading-relaxed text-[16px] md:text-text1 font-medium tracking-[-0.04em]"
                      />
                      {raw && (
                        <button
                          onClick={() => setRaw('')}
                          className="absolute top-8 right-10 p-2.5 rounded-full bg-card/40 backdrop-blur-md border border-border/50 text-foreground/20 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={14} />
                        </button>
                      )}
                    </div>
                    <div className="px-10 py-8 border-t border-border/10 flex justify-between items-center text-xs md:text-sm font-semibold text-foreground/15 tracking-[-0.02em]">
                      <div className="flex items-center gap-6">
                        <span className="tabular-nums lowercase">{raw.length} caracteres</span>
                        <div className="flex items-center gap-2 lowercase">
                          <span className={`w-1.5 h-1.5 rounded-full ${raw.length >= 50 ? 'bg-emerald-500/50' : 'bg-foreground/10'}`} />
                          <span>requisito mínimo</span>
                        </div>
                      </div>
                      {!processing && raw.length > 0 && (
                        <span className="text-primary/40 lowercase">listo para analizar</span>
                      )}
                    </div>
                  </motion.div>
                ) : mode === 'image' ? (
                  <motion.div
                    key="image-input"
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="p-1"
                  >
                    {!imageFile ? (
                      <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[440px] flex flex-col items-center justify-center gap-12 px-10 py-14 cursor-pointer group"
                      >
                        <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10 ${dragOver
                          ? 'border-primary/60 bg-primary/10 text-primary shadow-[0_0_30px_rgba(var(--color-primary),0.15)]'
                          : 'border-border/60 bg-card group-hover:border-primary/40 group-hover:bg-primary/5 text-foreground/30 group-hover:text-primary/60'
                          }`}>
                          <HugeiconsIcon icon={Image01Icon} size={28} />
                        </div>
                        <div className="text-center space-y-3">
                          <p className="text-text2 font-semibold tracking-[-0.04em] text-foreground/40 group-hover:text-foreground/60 transition-colors">
                            {dragOver ? 'suelta la imagen' : 'subir imagen clínica'}
                          </p>
                          <p className="text-xs md:text-sm font-medium text-foreground/10 tracking-[-0.02em]">
                            pdf · jpg · png · {MAX_SIZE_MB}mb
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
                      <div className="min-h-[440px] flex flex-col items-center justify-center p-10 space-y-8">
                        <div className="w-full max-w-xl relative rounded-2xl overflow-hidden aspect-video bg-card/50 border border-border/20 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imagePreviewUrl!} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-border/40 bg-foreground/[0.01]">
                          <HugeiconsIcon icon={File01Icon} size={16} className="text-foreground/20" />
                          <span className="text-xs md:text-sm font-semibold text-foreground/60 truncate tracking-[-0.04em]">{imageFile.name}</span>
                          <span className="text-xs md:text-sm font-semibold text-foreground/10 tabular-nums tracking-[-0.04em]">{(imageFile.size / 1024 / 1024).toFixed(2)} mb</span>
                        </div>
                        <button
                          onClick={clearImage}
                          className="text-xs md:text-sm font-semibold text-foreground/20 hover:text-rose-500 transition-all lowercase"
                        >
                          eliminar y subir otra
                        </button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="voice-input"
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="p-1"
                  >
                    <div className="min-h-[440px] flex flex-col items-center justify-center gap-12 px-10 py-14">

                      {/* Mic button */}
                      <div className="relative flex items-center justify-center">
                        {isRecording && (
                          <>
                            <motion.div
                              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                              className="absolute w-28 h-28 rounded-full bg-rose-500/20"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
                              transition={{ repeat: Infinity, duration: 2, delay: 0.3, ease: 'easeInOut' }}
                              className="absolute w-24 h-24 rounded-full bg-rose-500/15"
                            />
                          </>
                        )}
                        <motion.button
                          onClick={isRecording ? stopRecording : startRecording}
                          whileTap={{ scale: 0.94 }}
                          className={`relative w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10 ${isRecording
                            ? 'border-rose-500/60 bg-rose-500/10 text-rose-500 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
                            : 'border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 text-foreground/30 hover:text-primary/60'
                            }`}
                        >
                          <HugeiconsIcon
                            icon={isRecording ? MicOffIcon : Mic01Icon}
                            size={28}
                          />
                        </motion.button>
                      </div>

                      {/* Status */}
                      <div className="text-center space-y-3">
                        <p className="text-text2 font-semibold tracking-[-0.04em] text-foreground/40">
                          {isRecording ? 'escuchando...' : raw ? 'listo para analizar' : 'toca para hablar'}
                        </p>
                        {!isRecording && !raw && (
                          <p className="text-xs md:text-sm font-medium text-foreground/10 tracking-[-0.02em]">
                            solo disponible en Chrome y Edge
                          </p>
                        )}
                      </div>

                      {/* Live transcript */}
                      <AnimatePresence>
                        {raw && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-xl"
                          >
                            <div className="p-8 rounded-[1.5rem] bg-foreground/[0.02] border border-border/30">
                              <p className="text-text2 font-medium text-foreground/50 leading-relaxed tracking-[-0.02em]">
                                {raw}
                              </p>
                            </div>
                            {!isRecording && (
                              <button
                                onClick={() => setRaw('')}
                                className="mt-4 text-xs md:text-sm font-semibold text-foreground/20 hover:text-foreground/50 tracking-[-0.04em] transition-colors w-full text-center"
                              >
                                borrar y volver a grabar
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Button */}
            <div className="flex flex-col items-center gap-8">
              <ShinyButton
                onClick={handleProcess}
                disabled={!canProcess || processing}
                className="px-6 py-2 rounded-full"
              >
                <div className="flex items-center gap-2.5">
                  <HugeiconsIcon icon={SparklesIcon} size={16} />
                  <span className="font-semibold tracking-[-0.04em] text-xs md:text-sm">
                    {processing ? 'procesando...' : 'analizar con ia'}
                  </span>
                </div>
              </ShinyButton>
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs md:text-sm font-medium text-rose-500/60 tracking-[-0.04em]"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Structured Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-12"
          >
            <div className="rounded-[2.5rem] bg-card/40 border border-border overflow-hidden relative shadow-sm">
              {/* Header */}
              <div className="px-12 py-10 flex items-center justify-between border-b border-border/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/60">
                    <HugeiconsIcon icon={AiIdeaIcon} size={20} />
                  </div>
                  <h4 className="text-xs md:text-sm font-semibold tracking-[-0.04em] text-foreground/80">instrucciones de caso</h4>
                </div>
                {(() => {
                  const conf = difficultyConfig[preview.difficulty]
                  return (
                    <div className={`flex items-center gap-2 px-5 py-1.5 rounded-full ${conf.bg} border border-${conf.text}/10`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                      <span className={`text-xs md:text-sm font-semibold tracking-[-0.04em] ${conf.text}`}>
                        {conf.label}
                      </span>
                    </div>
                  )
                })()}
              </div>

              {/* Description Body */}
              <div className="p-12 space-y-12">
                <textarea
                  value={preview.description}
                  onChange={e => setPreview({ ...preview, description: e.target.value })}
                  rows={8}
                  className="w-full bg-transparent text-foreground/60 focus:outline-none leading-relaxed text-[16px] md:text-text1 font-medium tracking-[-0.04em] border-none p-0 resize-none min-h-[160px]"
                />

                <div className="border-t border-dashed border-border/40" />

                {/* Diagnosis Section */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <label className="text-xs md:text-sm font-semibold text-foreground/20 tracking-[-0.02em] ml-1">diagnóstico final</label>
                    <button
                      onClick={() => setDiagnosisRevealed(v => !v)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-foreground/[0.03] transition-colors group"
                    >
                      <HugeiconsIcon
                        icon={diagnosisRevealed ? ViewOffSlashIcon : ViewIcon}
                        size={14}
                        className="text-foreground/10 group-hover:text-primary/40 transition-colors"
                      />
                      <span className="text-xs md:text-sm font-semibold text-foreground/10 group-hover:text-foreground/30 transition-colors tracking-[-0.02em]">
                        {diagnosisRevealed ? 'ocultar' : 'revelar'}
                      </span>
                    </button>
                  </div>

                  <div className="min-h-[90px] p-8 rounded-[1.5rem] bg-foreground/[0.01] border border-border/20 flex items-center">
                    {diagnosisRevealed ? (
                      <input
                        type="text"
                        value={preview.correct_diagnosis}
                        onChange={e => setPreview({ ...preview, correct_diagnosis: e.target.value })}
                        className="w-full bg-transparent text-foreground/90 font-semibold text-[16px] md:text-heading3 focus:outline-none tracking-[-0.04em] border-none p-0"
                        placeholder="Escribe el diagnóstico..."
                        autoFocus
                      />
                    ) : (
                      <div className="flex gap-3 px-4">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="w-3 h-3 rounded-full bg-foreground/[0.04]" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Strip */}
              <div className="px-12 py-10 bg-foreground/[0.01] border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-10">
                <button
                  onClick={() => setPreview(null)}
                  className="group flex items-center gap-2 text-text4 font-semibold text-foreground/20 hover:text-foreground/50 transition-all tracking-[-0.04em]"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} className="group-hover:-translate-x-1 transition-transform" />
                  <span>descartar y volver</span>
                </button>

                <ShinyButton
                  onClick={handleSave}
                  disabled={saving || !preview.description || !preview.correct_diagnosis}
                  className="px-8 py-2 rounded-full"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-xs md:text-sm tracking-[-0.04em]">
                      {saving ? 'guardando...' : 'confirmar y guardar'}
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
