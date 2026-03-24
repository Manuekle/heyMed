import { NextRequest, NextResponse } from 'next/server'

export interface ProcessedCase {
  description: string
  correct_diagnosis: string
  difficulty: 'easy' | 'medium' | 'hard'
  system: 'cardio' | 'neuro' | 'gastro' | 'urgencias' | 'respiratorio' | 'otro'
}

const SYSTEM_MSG = `Eres un docente de medicina experto. SIEMPRE respondes ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones, sin texto adicional.`

const BASE_INSTRUCTIONS = `Transforma el caso clínico en un caso educativo claro y conciso.

Responde ÚNICAMENTE con este JSON válido (sin markdown, sin backticks, sin explicaciones):
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

const IMAGE_PROMPT = `Observa detenidamente la imagen adjunta. Contiene un caso clínico médico (puede ser una foto de un documento, una captura de pantalla, texto manuscrito, o una imagen médica con información clínica).

Extrae TODA la información clínica visible en la imagen y úsala para generar el caso educativo.

${BASE_INSTRUCTIONS}`

const TEXT_PROMPT = `Analiza el siguiente caso clínico proporcionado como texto.

${BASE_INSTRUCTIONS}`

// ── Image path: OpenAI-compatible endpoint (MiniMax Anthropic endpoint doesn't support images) ──
async function processWithImage(imageBase64: string, imageType: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY!
  const dataUrl = `data:${imageType};base64,${imageBase64}`

  const res = await fetch('https://api.minimax.io/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.7',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_MSG },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            { type: 'text', text: IMAGE_PROMPT },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => 'Could not read error body')
    console.error(`[process-case] MiniMax OpenAI API error ${res.status}:`, errBody)
    return null
  }

  const data = await res.json()
  // OpenAI format: data.choices[0].message.content
  return data.choices?.[0]?.message?.content ?? ''
}

// ── Text path: Anthropic-compatible endpoint ──
async function processWithText(rawCase: string) {
  const base = process.env.ANTHROPIC_BASE_URL?.replace(/\/$/, '') ?? 'https://api.anthropic.com'
  const res = await fetch(`${base}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.7',
      max_tokens: 1024,
      system: SYSTEM_MSG,
      messages: [{ role: 'user', content: `${TEXT_PROMPT}\n\nTexto original:\n${rawCase}` }],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => 'Could not read error body')
    console.error(`[process-case] API error ${res.status}:`, errBody)
    return null
  }

  const data = await res.json()
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text')
  return textBlock?.text ?? ''
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { rawCase, imageBase64, imageType } = body

  if (!rawCase?.trim() && !imageBase64) {
    return NextResponse.json({ error: 'Se requiere texto o imagen del caso' }, { status: 400 })
  }

  const text = imageBase64
    ? await processWithImage(imageBase64, imageType ?? 'image/jpeg')
    : await processWithText(rawCase)

  if (text === null) {
    return NextResponse.json({ error: 'Error procesando el caso con IA' }, { status: 500 })
  }

  try {
    // Strip markdown code fences the model sometimes wraps around JSON
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
