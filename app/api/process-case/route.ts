import { NextRequest, NextResponse } from 'next/server'

export interface ProcessedCase {
  description: string
  correct_diagnosis: string
  difficulty: 'easy' | 'medium' | 'hard'
  system: 'cardio' | 'neuro' | 'gastro' | 'urgencias' | 'respiratorio' | 'otro'
}

const SYSTEM_MSG = `Eres un docente de medicina experto. SIEMPRE respondes ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones, sin texto adicional.`

const BASE_INSTRUCTIONS = `Transforma el caso clínico en un caso educativo claro y conciso.

CORRECCIÓN DE ERRORES Y FORMATO:
- El texto de entrada puede haber sido extraído por OCR y contener errores tipográficos o caracteres basura. DEBES corregir automáticamente la ortografía, la gramática y el sentido clínico.
- ESTRICTAMENTE: Toda tu respuesta debe estar en ESPAÑOL nativo y perfecto. NO uses caracteres chinos, ingleses ni ningún otro.
- FORMATO NUMÉRICO: Escribe los pesos, tallas y valores de laboratorio con máximo DOS decimales. NO uses más de 2 decimales (ej. escribe "6.4 kg" o "6.40 kg", MÁS NUNCA "6,400 kg"). Usa el punto o la coma de forma consistente.

PRECISIÓN CLÍNICA (¡MUY IMPORTANTE!):
- Sé analíticamente riguroso. NO saltes a diagnósticos definitivos (ej. "Retraso del crecimiento pondoestatural" o "Desnutrición severa") si faltan criterios diagnósticos clave como percentiles OMS, Z-scores o tendencias a largo plazo.
- Con datos limitados (ej. pocos controles de peso/talla), define el diagnóstico de forma sindrómica o como "riesgo de..." (ej. "Ganancia ponderal insuficiente para la edad", "Riesgo de desnutrición", "Talla baja en estudio").
- La precisión clínica es tu prioridad principal. Evita aseveraciones fuertes sin el sustento clínico completo.
- El diagnóstico debe ser MUY CONCISO Y DIRECTO (máx. 10 palabras). Solo nombra el diagnóstico principal o sindrómico (ej. "Ganancia ponderal insuficiente con riesgo nutricional"). NO incluyas la justificación, ni la edad, ni la causa dentro del campo de diagnóstico.

Responde ÚNICAMENTE con este JSON válido (sin markdown, sin backticks, sin explicaciones):
{
  "description": "Caso clínico redactado en español perfecto sin errores (máx 120 palabras). Incluye: edad, sexo, motivo de consulta, síntomas, signos vitales y hallazgos relevantes. Sin jerga excesiva.",
  "correct_diagnosis": "Diagnóstico principal clínico preciso, corto y directo (máx 10 palabras. Ej: 'Ganancia ponderal insuficiente' en lugar de 'Retraso del crecimiento' si faltan percentiles). NO justifiques ni describas la etiología aquí.",
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

const TEXT_PROMPT = `Analiza el siguiente caso clínico proporcionado como texto.

${BASE_INSTRUCTIONS}`

/**
 * Strip <think>...</think> reasoning blocks that MiniMax-M2.7 wraps around its output.
 * Then strip markdown code fences. Returns the cleaned text for JSON parsing.
 */
function cleanModelOutput(raw: string): string {
  // Remove <think>...</think> blocks (including multiline)
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '')

  // Strip markdown code fences
  cleaned = cleaned
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()

  return cleaned
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
  const { rawCase } = body

  if (!rawCase?.trim()) {
    return NextResponse.json({ error: 'Se requiere texto del caso' }, { status: 400 })
  }

  const text = await processWithText(rawCase)

  if (text === null) {
    return NextResponse.json({ error: 'Error procesando el caso con IA' }, { status: 500 })
  }

  try {
    const cleaned = cleanModelOutput(text)
    console.log('[process-case] Cleaned output:', cleaned.slice(0, 300))

    const processed: ProcessedCase = JSON.parse(cleaned)
    if (!processed.description || !processed.correct_diagnosis) throw new Error('Respuesta incompleta')
    if (!processed.system) processed.system = 'otro'
    return NextResponse.json(processed)
  } catch (err) {
    console.error('[process-case] Failed to parse AI response:', text.slice(0, 500))
    console.error('[process-case] Parse error:', err)
    return NextResponse.json({ error: 'La IA devolvió un formato inesperado.' }, { status: 500 })
  }
}
