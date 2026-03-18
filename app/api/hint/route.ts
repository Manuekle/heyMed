import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { caseDescription, hintsGiven = [] } = await req.json()

  if (!caseDescription) {
    return NextResponse.json({ error: 'caseDescription requerido' }, { status: 400 })
  }

  const previousHints =
    hintsGiven.length > 0
      ? `\nPistas ya dadas (no repitas): ${hintsGiven.join(' | ')}`
      : ''

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
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `Eres un tutor médico. Para el siguiente caso clínico, da UNA pista breve al estudiante SIN revelar el diagnóstico. La pista debe orientar el pensamiento clínico.

Caso: ${caseDescription}${previousHints}

Responde SOLO con la pista (1 oración, máx 20 palabras). No menciones el diagnóstico.`,
        },
      ],
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ hint: 'Revisa los síntomas principales del paciente.' })
  }

  const data = await res.json()
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text')
  const hint = textBlock?.text?.trim() ?? 'Considera la combinación de síntomas.'

  return NextResponse.json({ hint })
}
