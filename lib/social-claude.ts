import Anthropic from '@anthropic-ai/sdk'
import type { SocialPlanTier } from '@/lib/social-limits'
import { EDITORIAL_DAYS, HOOK_LAB_COUNTS } from '@/lib/social-limits'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export type EditorialFormat = 'carrusel' | 'reel' | 'hilo'

export type EditorialPost = {
  day: number
  day_label: string
  format: EditorialFormat
  title: string
  hook: string
  outline: string[]
  cta: string
  platforms: string
  /** Solo plan Pro: hashtags sugeridos */
  hashtags?: string
  /** Solo plan Pro: idea rápida de plano / B-roll / edición */
  production_tip?: string
}

export type EditorialCalendarResult = {
  week_theme: string
  posts: EditorialPost[]
}

export type EditorialCalendarGenResult =
  | { ok: true; calendar: EditorialCalendarResult }
  | { ok: false; reason: 'missing_api_key' | 'api_or_parse' }

/**
 * Claude a veces envuelve el JSON en ```json ... ```; JSON.parse falla si no lo quitamos.
 */
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

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/**
 * Calendario editorial: Free = vista previa 3 días; Pro = semana completa + extras.
 */
export async function generateEditorialCalendar(params: {
  niche: string
  audience?: string
  tone?: string
  mainPlatform?: string
  language?: string
  tier: SocialPlanTier
}): Promise<EditorialCalendarGenResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return { ok: false, reason: 'missing_api_key' }
  }

  const {
    niche,
    audience = 'público general interesado en el nicho',
    tone = 'profesional y cercano',
    mainPlatform = 'Instagram',
    language = 'español',
    tier,
  } = params

  const nicheTrim = niche.trim()
  if (!nicheTrim) return { ok: false, reason: 'api_or_parse' }

  const targetDays = tier === 'free' ? EDITORIAL_DAYS.free : EDITORIAL_DAYS.pro
  const isPro = tier === 'pro'

  const freePrompt = `Eres estratega de contenido para redes (Instagram, TikTok, X).

Nicho / tema del creador: ${nicheTrim}
Audiencia: ${audience}
Tono: ${tone}
Red principal: ${mainPlatform}
Idioma del contenido: ${language}

**Plan gratuito (vista previa):** genera **exactamente 3 ideas** para **Lunes, Martes y Miércoles** solamente.
- Rotar formatos: carrusel, reel, hilo (uno por día).
- **outline**: exactamente **2 viñetas cortas** por post (nada de guiones largos).
- **hook**: una línea muy corta.
- Sin hashtags extendidos ni notas de producción.

Responde SOLO JSON válido (sin markdown):
{
  "week_theme": "frase muy breve (preview de la semana)",
  "posts": [
    { "day": 1, "day_label": "Lunes", "format": "carrusel", "title": "...", "hook": "...", "outline": ["...", "..."], "cta": "...", "platforms": "..." }
  ]
}
Debe haber **exactamente 3** objetos en "posts".`

  const proPrompt = `Eres estratega senior de contenido para redes (Instagram, TikTok, X, Shorts).

Nicho / tema del creador: ${nicheTrim}
Audiencia: ${audience}
Tono: ${tone}
Red principal (priorizar): ${mainPlatform}
Idioma del contenido: ${language}

**Plan Pro:** calendario de **exactamente 7 publicaciones** (Lunes â†’ Domingo).

Reglas:
- Rotar carrusel, reel, hilo (mínimo 2 de cada formato en la semana; el 7.Âº equilibra).
- **outline**: 3 a 6 viñetas útiles (diapositivas, beats de reel, orden de hilo).
- **hashtags**: string con **3 a 6 hashtags** relevantes (con #), separados por espacio.
- **production_tip**: una línea concreta (plano sugerido, B-roll, texto en pantalla, transición).
- CTA realista, sin promesas legales/médicas/financieras garantizadas.

Responde SOLO JSON válido (sin markdown):
{
  "week_theme": "hilo conductor de la semana",
  "posts": [
    {
      "day": 1,
      "day_label": "Lunes",
      "format": "carrusel",
      "title": "...",
      "hook": "...",
      "outline": ["...", "..."],
      "cta": "...",
      "platforms": "Instagram",
      "hashtags": "#tag1 #tag2 #tag3",
      "production_tip": "..."
    }
  ]
}`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: isPro ? 4096 : 2048,
      messages: [{
        role: 'user',
        content: isPro ? proPrompt : freePrompt,
      }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const parsed = parseAssistantJsonObject<{
      week_theme?: string
      posts?: Array<{
        day?: number
        day_label?: string
        format?: string
        title?: string
        hook?: string
        outline?: unknown
        cta?: string
        platforms?: string
        hashtags?: string
        production_tip?: string
      }>
    }>(text)

    const formats: EditorialFormat[] = ['carrusel', 'reel', 'hilo']
    const normFormat = (f: string | undefined): EditorialFormat => {
      const x = (f || '').toLowerCase()
      if (x.includes('reel')) return 'reel'
      if (x.includes('hilo') || x.includes('thread')) return 'hilo'
      return 'carrusel'
    }

    const maxDay = targetDays
    const raw = Array.isArray(parsed.posts) ? parsed.posts : []
    const posts: EditorialPost[] = raw.slice(0, maxDay).map((p, i) => {
      const outline = Array.isArray(p.outline)
        ? p.outline.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        : []
      const outlineCap = isPro ? outline : outline.slice(0, 2)
      const base: EditorialPost = {
        day: typeof p.day === 'number' && p.day >= 1 && p.day <= maxDay ? p.day : i + 1,
        day_label: typeof p.day_label === 'string' && p.day_label.trim() ? p.day_label.trim() : WEEKDAYS[i] || `Día ${i + 1}`,
        format: formats.includes(normFormat(p.format)) ? normFormat(p.format) : 'carrusel',
        title: typeof p.title === 'string' ? p.title.trim() : `Idea ${i + 1}`,
        hook: typeof p.hook === 'string' ? p.hook.trim() : '',
        outline: outlineCap.length
          ? outlineCap
          : isPro
            ? ['Gancho', 'Desarrollo', 'Cierre con valor']
            : ['Punto clave', 'Siguiente paso'],
        cta: typeof p.cta === 'string' ? p.cta.trim() : 'Guarda y comparte si te sirvió.',
        platforms: typeof p.platforms === 'string' ? p.platforms.trim() : mainPlatform,
      }
      if (isPro) {
        if (typeof p.hashtags === 'string' && p.hashtags.trim()) base.hashtags = p.hashtags.trim()
        if (typeof p.production_tip === 'string' && p.production_tip.trim()) {
          base.production_tip = p.production_tip.trim()
        }
      }
      return base
    })

    while (posts.length < maxDay) {
      const i = posts.length
      const fmt: EditorialFormat = i % 3 === 0 ? 'carrusel' : i % 3 === 1 ? 'reel' : 'hilo'
      const pad: EditorialPost = {
        day: i + 1,
        day_label: WEEKDAYS[i] || `Día ${i + 1}`,
        format: fmt,
        title: `Idea ${fmt} sobre ${nicheTrim}`,
        hook: `Â¿Te pasa esto con ${nicheTrim}?`,
        outline: isPro
          ? ['Gancho', 'Desarrollo', 'Cierre con valor']
          : ['Idea principal', 'Qué hacer después'],
        cta: 'Comenta si quieres parte 2.',
        platforms: mainPlatform,
      }
      if (isPro) {
        pad.hashtags = `#${nicheTrim.split(/\s+/)[0]?.replace(/\W/g, '') || 'contenido'} #tips`
        pad.production_tip = 'Plano medio + corte rápido al gancho.'
      }
      posts.push(pad)
    }

    return {
      ok: true,
      calendar: {
        week_theme: typeof parsed.week_theme === 'string' ? parsed.week_theme.trim() : 'Semana de contenido',
        posts: posts.slice(0, maxDay),
      },
    }
  } catch (e) {
    console.error('[social-claude] generateEditorialCalendar', e)
    return { ok: false, reason: 'api_or_parse' }
  }
}

/* â”€â”€â”€ Hook Lab (TikTok / Reels / Shorts) â”€â”€â”€ */

export type HookLabAngle = {
  title: string
  pitch: string
}

export type HookLabResult = {
  topic: string
  hooks: string[]
  angles: HookLabAngle[]
  /** Solo Pro: ambiente de audio sugerido */
  sound_mood?: string
  /** Solo Pro: 3 textos cortos para overlay */
  on_screen_texts?: string[]
}

export type HookLabGenResult =
  | { ok: true; data: HookLabResult }
  | { ok: false; reason: 'missing_api_key' | 'api_or_parse' }

/**
 * Hook Lab: Free = pocos ganchos y 1 ángulo; Pro = pack amplio + extras de producción.
 */
export async function generateHookLab(params: {
  topic: string
  audience?: string
  tone?: string
  language?: string
  tier: SocialPlanTier
}): Promise<HookLabGenResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return { ok: false, reason: 'missing_api_key' }
  }

  const {
    topic,
    audience = 'usuarios de TikTok, Reels y Shorts',
    tone = 'directo, energético, sin postureo',
    language = 'español',
    tier,
  } = params

  const topicTrim = topic.trim()
  if (!topicTrim) return { ok: false, reason: 'api_or_parse' }

  const { hooks: nHooks, angles: nAngles } = tier === 'free' ? HOOK_LAB_COUNTS.free : HOOK_LAB_COUNTS.pro
  const isPro = tier === 'pro'

  const freeContent = `Eres copywriter para vídeos cortos verticales.

Tema: ${topicTrim}
Audiencia: ${audience}
Tono: ${tone}
Idioma: ${language}

**Vista Free:** solo **${nHooks} hooks** (muy cortos, â‰¤10 palabras si es posible) y **${nAngles} ángulo** (un solo enfoque narrativo con título + pitch breve).
Sin extras de sonido ni overlays.

JSON solo (sin markdown). "hooks" debe tener exactamente ${nHooks} strings; "angles" exactamente ${nAngles} objeto(s).
{
  "topic": "breve",
  "hooks": ["...", "..."],
  "angles": [{ "title": "...", "pitch": "..." }]
}`

  const proContent = `Eres copywriter senior para TikTok, Reels y Shorts (retención y claridad).

Tema: ${topicTrim}
Audiencia: ${audience}
Tono: ${tone}
Idioma: ${language}

**Plan Pro:**
- **${nHooks} hooks** variados (pregunta, POV, número, plot twist suave, contraste, storytelling mini, etc.). Cortos y grabables. Nada de promesas prohibidas.
- **${nAngles} ángulos** distintos (título + pitch de 2-3 frases: estructura del vídeo, tono, qué mostrar).
- **sound_mood**: una línea (tipo de audio: tendencia instrumental, voz en off seria, comedia, ASMR suaveâ€¦).
- **on_screen_texts**: array de **3** frases muy cortas para texto en pantalla (palabra clave por slide).

JSON solo (sin markdown):
{
  "topic": "...",
  "hooks": [],
  "angles": [{ "title": "...", "pitch": "..." }],
  "sound_mood": "...",
  "on_screen_texts": ["...", "...", "..."]
}`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: isPro ? 4096 : 1536,
      messages: [{
        role: 'user',
        content: isPro ? proContent : freeContent,
      }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const parsed = parseAssistantJsonObject<{
      topic?: string
      hooks?: unknown
      angles?: unknown
      sound_mood?: string
      on_screen_texts?: unknown
    }>(text)

    const rawHooks = Array.isArray(parsed.hooks) ? parsed.hooks : []
    const hooks: string[] = rawHooks
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .map(h => h.trim())
      .slice(0, nHooks)

    while (hooks.length < nHooks) {
      hooks.push(`Hook ${hooks.length + 1}: ${topicTrim.slice(0, 48)}`)
    }

    const rawAngles = Array.isArray(parsed.angles) ? parsed.angles : []
    const angles: HookLabAngle[] = rawAngles.slice(0, nAngles).map((a, i) => {
      if (a && typeof a === 'object' && !Array.isArray(a)) {
        const o = a as Record<string, unknown>
        const title = typeof o.title === 'string' && o.title.trim()
          ? o.title.trim()
          : typeof o.name === 'string' && o.name.trim()
            ? o.name.trim()
            : `Ãngulo ${i + 1}`
        const pitch = typeof o.pitch === 'string' && o.pitch.trim()
          ? o.pitch.trim()
          : typeof o.idea === 'string' && o.idea.trim()
            ? o.idea.trim()
            : `Enfoca ${topicTrim} desde otra perspectiva.`
        return { title, pitch }
      }
      if (typeof a === 'string' && a.trim()) {
        return { title: `Ãngulo ${i + 1}`, pitch: a.trim() }
      }
      return {
        title: `Ãngulo ${i + 1}`,
        pitch: `Plantea ${topicTrim} en formato vídeo corto.`,
      }
    })

    while (angles.length < nAngles) {
      const i = angles.length
      angles.push({
        title: `Ãngulo ${i + 1}`,
        pitch: `Otra forma de contar ${topicTrim}.`,
      })
    }

    const data: HookLabResult = {
      topic: typeof parsed.topic === 'string' && parsed.topic.trim() ? parsed.topic.trim() : topicTrim,
      hooks: hooks.slice(0, nHooks),
      angles: angles.slice(0, nAngles),
    }

    if (isPro) {
      if (typeof parsed.sound_mood === 'string' && parsed.sound_mood.trim()) {
        data.sound_mood = parsed.sound_mood.trim()
      }
      if (!data.sound_mood) {
        data.sound_mood = 'Voz en off clara + música tipo tendencia suave de fondo.'
      }
      const ost = Array.isArray(parsed.on_screen_texts)
        ? parsed.on_screen_texts.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map(s => s.trim())
        : []
      const pad: string[] = [...ost]
      while (pad.length < 3) {
        pad.push(`Idea en pantalla ${pad.length + 1} · ${topicTrim.slice(0, 36)}`)
      }
      data.on_screen_texts = pad.slice(0, 3)
    }

    return { ok: true, data }
  } catch (e) {
    console.error('[social-claude] generateHookLab', e)
    return { ok: false, reason: 'api_or_parse' }
  }
}
