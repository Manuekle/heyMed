import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Input: { attempt_id: string }
// Output: { result: 'correct'|'partial'|'incorrect', explanation: string }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { attempt_id } = await req.json()
    if (!attempt_id) throw new Error('attempt_id requerido')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Obtener intento + caso en una sola query
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select('id, user_answer, user_id, case:cases(description, correct_diagnosis)')
      .eq('id', attempt_id)
      .single()

    if (attemptError || !attempt) throw new Error('Intento no encontrado')
    if (attempt.ai_result) throw new Error('Intento ya evaluado')

    const { description, correct_diagnosis } = attempt.case as {
      description: string
      correct_diagnosis: string
    }

    // Llamar a Claude
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: `Eres un evaluador de diagnósticos clínicos. Evalúa objetivamente la respuesta del estudiante.

Caso clínico: ${description}

Diagnóstico correcto: ${correct_diagnosis}

Respuesta del estudiante: ${attempt.user_answer}

Responde ÚNICAMENTE con este JSON (sin markdown, sin texto extra):
{
  "result": "correct" | "partial" | "incorrect",
  "explanation": "Explicación breve en español (máx 120 palabras). Incluye qué acertó, qué faltó y por qué."
}

Criterios:
- correct: diagnóstico esencialmente correcto, puede tener detalles menores incorrectos
- partial: identifica parte del problema pero falta diagnóstico principal o tiene error importante
- incorrect: diagnóstico erróneo o vacío`,
          },
        ],
      }),
    })

    if (!aiRes.ok) {
      const err = await aiRes.text()
      throw new Error(`Anthropic error: ${err}`)
    }

    const aiData = await aiRes.json()
    const rawText = aiData.content?.[0]?.text ?? ''

    let evaluation: { result: string; explanation: string }
    try {
      evaluation = JSON.parse(rawText)
    } catch {
      throw new Error(`IA devolvió JSON inválido: ${rawText}`)
    }

    if (!['correct', 'partial', 'incorrect'].includes(evaluation.result)) {
      throw new Error(`result inválido: ${evaluation.result}`)
    }

    // Actualizar intento — el trigger award_points_on_evaluation se ejecuta aquí
    const { error: updateError } = await supabase
      .from('attempts')
      .update({
        ai_result: evaluation.result,
        ai_explanation: evaluation.explanation,
      })
      .eq('id', attempt_id)

    if (updateError) throw updateError

    return new Response(JSON.stringify(evaluation), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
