import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Streams response as plain text:
//   Line 1: "{result}|{score}"  (e.g. "correct|85")
//   Line 2+: explanation in Spanish

export async function POST(req: NextRequest) {
  const { attempt_id, user_answer, description, correct_diagnosis } = await req.json()

  if (!attempt_id || !user_answer || !description || !correct_diagnosis) {
    return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), { status: 400 })
  }

  const base = process.env.ANTHROPIC_BASE_URL?.replace(/\/$/, '') ?? 'https://api.anthropic.com'

  const aiRes = await fetch(`${base}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.7',
      max_tokens: 350,
      stream: true,
      messages: [
        {
          role: 'user',
          content: `Evalúa este diagnóstico clínico. Responde en este formato EXACTO (sin markdown):
Línea 1: resultado|puntaje  (ej: correct|85)
Línea 2+: explicación en español (máx 70 palabras, directo y clínico)

Criterios:
- correct (75-100): diagnóstico esencialmente correcto
- partial (30-74): parcialmente correcto o incompleto
- incorrect (0-29): diagnóstico erróneo o vacío

Caso: ${description}
Correcto: ${correct_diagnosis}
Estudiante: ${user_answer}`,
        },
      ],
    }),
  })

  if (!aiRes.ok || !aiRes.body) {
    const err = await aiRes.text()
    return new Response(JSON.stringify({ error: err }), { status: 500 })
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = aiRes.body!.getReader()
      let accumulated = ''
      let buffer = ''

      try {
        console.log('--- STARTING AI STREAM ---')
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log('--- AI STREAM DONE ---')
            break
          }

          const decoded = decoder.decode(value, { stream: true })
          console.log('RAW CHUNK:', decoded)
          buffer += decoded
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine) continue
            console.log('LINE:', trimmedLine)
            
            if (!trimmedLine.startsWith('data: ')) continue
            
            const data = trimmedLine.slice(6).trim()
            if (data === '[DONE]') continue
            
            try {
              const event = JSON.parse(data)
              console.log('EVENT TYPE:', event.type)
              if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                const text = event.delta.text
                accumulated += text
                controller.enqueue(encoder.encode(text))
              }
            } catch (err) {
              console.error('JSON PARSE ERROR:', err, data)
            }
          }
        }
        console.log('ACCUMULATED:', accumulated)

        // After stream ends, update DB (fire and forget)
        const firstNewline = accumulated.indexOf('\n')
        const firstLine = (firstNewline !== -1 ? accumulated.slice(0, firstNewline) : accumulated).trim()
        
        // Robust extraction: find verdict and score even if line has extra text
        const verdictMatch = firstLine.match(/(correct|partial|incorrect)/i)
        const scoreMatch = firstLine.match(/(\d+)/)
        
        const verdict = verdictMatch ? verdictMatch[0].toLowerCase() : 'incorrect'
        const explanation = (firstNewline !== -1 ? accumulated.slice(firstNewline + 1) : '').trim()

        if (['correct', 'partial', 'incorrect'].includes(verdict)) {
          const supabase = await createClient()
          supabase
            .from('attempts')
            .update({ ai_result: verdict, ai_explanation: explanation })
            .eq('id', attempt_id)
            .then(() => { })
        }

        controller.close()
      } catch (err) {
        controller.error(err)
      } finally {
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Accel-Buffering': 'no',
      'Cache-Control': 'no-cache',
    },
  })
}
