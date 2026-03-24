import Anthropic from '@anthropic-ai/sdk'
import type { SocialPlanTier } from '@/lib/social-limits'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/** Salida enriquecida a partir de la transcripción del vídeo */
export type VideoContentPack = {
  summary: string
  key_takeaways: string[]
  hook_suggestions: string[]
  caption_short: string
  caption_long: string
  thread_outline: string[]
  hashtags: string[]
  cta_ideas: string[]
  quote_cards: string[]
}

export type VideoContentGenResult =
  | { ok: true; pack: VideoContentPack }
  | { ok: false; reason: 'missing_api_key' | 'api_or_parse' }

function parseAssistantJsonObject<T>(raw: string): T {
  let s = raw.trim()
  const fenced = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```/im.exec(s)
  if (fenced) s = fenced[1].trim()
  else if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  }
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start === -1 || end <= start) {
    throw new SyntaxError('No se encontró un objeto JSON en la respuesta del modelo')
  }
  return JSON.parse(s.slice(start, end + 1)) as T
}

const MAX_TRANSCRIPT_CHARS = 48_000

export async function generateVideoContentPack(params: {
  transcript: string
  tier: SocialPlanTier
  language?: string
  nicheHint?: string
}): Promise<VideoContentGenResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return { ok: false, reason: 'missing_api_key' }
  }

  const { tier, language = 'español', nicheHint } = params
  let transcript = params.transcript.trim()
  if (!transcript) return { ok: false, reason: 'api_or_parse' }

  const truncated = transcript.length > MAX_TRANSCRIPT_CHARS
  if (truncated) {
    transcript = transcript.slice(0, MAX_TRANSCRIPT_CHARS)
  }

  const isPro = tier === 'pro'
  const counts = isPro
    ? {
        takeaways: 6,
        hooks: 12,
        thread: 8,
        hashtags: 12,
        cta: 4,
        quotes: 5,
      }
    : {
        takeaways: 3,
        hooks: 5,
        thread: 4,
        hashtags: 6,
        cta: 2,
        quotes: 2,
      }

  const nicheLine = nicheHint?.trim()
    ? `Contexto del creador (opcional): ${nicheHint.trim()}`
    : 'Sin contexto extra del creador.'

  const prompt = `Eres editor de redes y copywriter. A partir de la TRANSCRIPCIÃ“N de un vídeo (lo dicho en voz), genera material listo para publicar.

Idioma de salida: ${language}
${nicheLine}
${truncated ? 'NOTA: la transcripción está truncada por longitud; infiere con prudencia lo que falte.' : ''}

TRANSCRIPCIÃ“N:
---
${transcript}
---

Responde SOLO con JSON válido (sin markdown):
{
  "summary": "2-4 frases: de qué va el vídeo y por qué importa",
  "key_takeaways": ["punto 1", ...],
  "hook_suggestions": ["gancho corto 1", ...],
  "caption_short": "una línea tipo TikTok/IG (máx ~200 caracteres)",
  "caption_long": "párrafo para IG/LinkedIn con saltos de línea \\n donde tenga sentido",
  "thread_outline": ["tweet/hilo 1", "2", ...],
  "hashtags": ["#tema", ...] sin repetir,
  "cta_ideas": ["CTA 1", ...],
  "quote_cards": ["frase corta citable 1", ...]
}

Reglas estrictas:
- Todos los textos en el idioma indicado.
- key_takeaways: exactamente ${counts.takeaways} ítems, muy concretos.
- hook_suggestions: exactamente ${counts.hooks} ítems; primera persona o imperativo; para vídeo corto vertical.
- thread_outline: exactamente ${counts.thread} ítems; cada uno autónomo (orden narrativo).
- hashtags: exactamente ${counts.hashtags} ítems; relevantes al contenido; formato #palabra o #varias_palabras.
- cta_ideas: exactamente ${counts.cta} ítems.
- quote_cards: exactamente ${counts.quotes} ítems; memorables, sin comillas externas en el string.`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: isPro ? 4096 : 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const raw = parseAssistantJsonObject<VideoContentPack>(text)

    const pack: VideoContentPack = {
      summary: String(raw.summary ?? '').trim(),
      key_takeaways: Array.isArray(raw.key_takeaways) ? raw.key_takeaways.map(String) : [],
      hook_suggestions: Array.isArray(raw.hook_suggestions) ? raw.hook_suggestions.map(String) : [],
      caption_short: String(raw.caption_short ?? '').trim(),
      caption_long: String(raw.caption_long ?? '').trim(),
      thread_outline: Array.isArray(raw.thread_outline) ? raw.thread_outline.map(String) : [],
      hashtags: Array.isArray(raw.hashtags) ? raw.hashtags.map(String) : [],
      cta_ideas: Array.isArray(raw.cta_ideas) ? raw.cta_ideas.map(String) : [],
      quote_cards: Array.isArray(raw.quote_cards) ? raw.quote_cards.map(String) : [],
    }

    if (!pack.summary && pack.key_takeaways.length === 0) {
      return { ok: false, reason: 'api_or_parse' }
    }

    return { ok: true, pack }
  } catch (e) {
    console.error('[video-content-claude]', e)
    return { ok: false, reason: 'api_or_parse' }
  }
}
