import { NextRequest, NextResponse } from 'next/server'

export interface ProcessedCase {
  description: string
  correct_diagnosis: string
  difficulty: 'easy' | 'medium' | 'hard'
  system: 'cardio' | 'neuro' | 'gastro' | 'urgencias' | 'respiratorio' | 'otro'
}

const PROMPT = `Eres un docente de medicina. Analiza este caso clínico y transfórmalo en un caso educativo claro y conciso.

Responde ÚNICAMENTE con este JSON válido (sin markdown):
{
  "description": "Caso clínico redactado en español claro (máx 120 palabras). Incluye: edad, sexo, motivo de consulta, síntomas, signos vitales y hallazgos relevantes. Sin jerga excesiva.",
  "correct_diagnosis": "Diagnóstico principal preciso y específico",
  "difficulty": "easy",
  "system": "cardio"
}

Criterios de dificultad:
- easy: presentación clásica, diagnóstico directo
- medium: requiere integrar varios datos clínicos
- hard: presentación atípica o diagnóstico poco frecuente

Criterios de system (elige uno):
- cardio: cardiología, arritmias, ICC, coronariopatías
- neuro: neurología, ACV, cefaleas, convulsiones
- gastro: gastroenterología, hígado, páncreas
- urgencias: trauma, intoxicaciones, sepsis, politraumatismo
- respiratorio: neumología, EPOC, asma, neumonía
- otro: endocrino, reumatología, infectología, dermatología, etc.`

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { rawCase, imageBase64, imageType } = body

  if (!rawCase?.trim() && !imageBase64) {
    return NextResponse.json({ error: 'Se requiere texto o imagen del caso' }, { status: 400 })
  }

  type ContentBlock =
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

  const content: ContentBlock[] = imageBase64
    ? [
        { type: 'image', source: { type: 'base64', media_type: imageType ?? 'image/jpeg', data: imageBase64 } },
        { type: 'text', text: PROMPT },
      ]
    : [{ type: 'text', text: `${PROMPT}\n\nTexto original:\n${rawCase}` }]

  const base = process.env.ANTHROPIC_BASE_URL?.replace(/\/$/, '') ?? 'https://api.anthropic.com'
  const res = await fetch(`${base}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content }],
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Error procesando el caso con IA' }, { status: 500 })
  }

  const data = await res.json()
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text')
  const text = textBlock?.text ?? ''

  try {
    // Strip markdown code fences that the AI sometimes wraps around JSON
    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim()

    const processed: ProcessedCase = JSON.parse(cleaned)
    if (!processed.description || !processed.correct_diagnosis) throw new Error('Respuesta incompleta')
    if (!processed.system) processed.system = 'otro'
    return NextResponse.json(processed)
  } catch (err) {
    console.error('[process-case] Failed to parse AI response:', text)
    console.error('[process-case] Parse error:', err)
    return NextResponse.json({ error: 'La IA devolvió un formato inesperado.' }, { status: 500 })
  }
}
