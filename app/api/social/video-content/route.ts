import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateVideoContentPack } from '@/lib/video-content-claude'
import { transcribeAudioBuffer } from '@/lib/transcribe-openai'
import { fetchVideoFromUrl } from '@/lib/video-url-fetch'
import {
  SOCIAL_LIMITS,
  VIDEO_UPLOAD_MAX_MB,
  tierFromPlan,
  utcStartOfIsoWeekIso,
} from '@/lib/social-limits'

export const maxDuration = 120
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const MAX_BYTES = VIDEO_UPLOAD_MAX_MB * 1024 * 1024

type ParsedInput =
  | { ok: true; userId: string; language: string; whisperLang?: string; nicheHint?: string; buffer: Buffer; filename: string }
  | { ok: false; status: number; message: string }

async function parseRequest(req: NextRequest): Promise<ParsedInput> {
  const ct = req.headers.get('content-type') || ''

  if (ct.includes('multipart/form-data')) {
    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return {
        ok: false,
        status: 413,
        message: 'Archivo demasiado grande o formulario invÃ¡lido. Prueba un vÃ­deo mÃ¡s pequeÃ±o (mÃ¡x. ~24 MB).',
      }
    }

    const uid = form.get('userId')
    const userId = typeof uid === 'string' ? uid : ''
    if (!userId) return { ok: false, status: 400, message: 'Falta userId.' }

    let language = 'espaÃ±ol'
    const lang = form.get('language')
    if (typeof lang === 'string' && lang.trim()) language = lang.trim()

    let whisperLang: string | undefined
    const wl = form.get('whisperLanguage')
    if (typeof wl === 'string' && wl.trim()) whisperLang = wl.trim().slice(0, 5)

    let nicheHint: string | undefined
    const nh = form.get('nicheHint')
    if (typeof nh === 'string' && nh.trim()) nicheHint = nh.trim().slice(0, 300)

    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return { ok: false, status: 400, message: 'Falta el archivo de vÃ­deo (campo file).' }
    }

    const f = file as File
    if (f.size > MAX_BYTES) {
      return {
        ok: false,
        status: 400,
        message: `El archivo supera ${VIDEO_UPLOAD_MAX_MB} MB (lÃ­mite para transcripciÃ³n).`,
      }
    }

    const ab = await f.arrayBuffer()
    const buffer = Buffer.from(ab)
    const filename = f.name?.trim() || 'upload.mp4'

    return { ok: true, userId, language, whisperLang, nicheHint, buffer, filename }
  }

  let body: {
    userId?: string
    videoUrl?: string
    language?: string
    whisperLanguage?: string
    nicheHint?: string
  }
  try {
    body = await req.json()
  } catch {
    return { ok: false, status: 400, message: 'JSON invÃ¡lido.' }
  }

  const userId = typeof body.userId === 'string' ? body.userId : ''
  if (!userId) return { ok: false, status: 400, message: 'Falta userId.' }

  const videoUrl = typeof body.videoUrl === 'string' ? body.videoUrl.trim() : ''
  if (!videoUrl) {
    return { ok: false, status: 400, message: 'Falta videoUrl o sube el vÃ­deo como multipart (campo file).' }
  }

  let language = 'espaÃ±ol'
  if (typeof body.language === 'string' && body.language.trim()) language = body.language.trim()

  let whisperLang: string | undefined
  if (typeof body.whisperLanguage === 'string' && body.whisperLanguage.trim()) {
    whisperLang = body.whisperLanguage.trim().slice(0, 5)
  }

  let nicheHint: string | undefined
  if (typeof body.nicheHint === 'string' && body.nicheHint.trim()) {
    nicheHint = body.nicheHint.trim().slice(0, 300)
  }

  const fetched = await fetchVideoFromUrl(videoUrl)
  if (!fetched.ok) {
    return { ok: false, status: 400, message: fetched.message }
  }

  return {
    ok: true,
    userId,
    language,
    whisperLang,
    nicheHint,
    buffer: fetched.buffer,
    filename: fetched.filename,
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseRequest(req)
    if (!parsed.ok) {
      return NextResponse.json({ error: 'bad_request', message: parsed.message }, { status: parsed.status })
    }

    const { userId, language, whisperLang, nicheHint, buffer, filename } = parsed

    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', userId).maybeSingle()
    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    const tier = tierFromPlan(profile.plan)
    const isFree = tier === 'free'

    if (isFree) {
      const since = utcStartOfIsoWeekIso()
      const { count, error: cErr } = await supabase
        .from('missions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('mode', 'social_video')
        .gte('created_at', since)
      if (cErr) console.error('[social/video-content] count', cErr)
      const used = count ?? 0
      if (used >= SOCIAL_LIMITS.videoContent.freePerWeek) {
        return NextResponse.json(
          {
            error: 'limit_reached',
            message: `Plan Free: ${SOCIAL_LIMITS.videoContent.freePerWeek} anÃ¡lisis de vÃ­deo por semana (lunes UTC). Pro: sin lÃ­mite en la app.`,
            limit: SOCIAL_LIMITS.videoContent.freePerWeek,
          },
          { status: 429 },
        )
      }
    }

    const tr = await transcribeAudioBuffer({
      buffer,
      filename,
      language: whisperLang,
    })

    if (!tr.ok) {
      if (tr.reason === 'missing_api_key') {
        return NextResponse.json(
          {
            error: 'missing_openai_key',
            message:
              'Falta OPENAI_API_KEY en el servidor para transcribir el audio del vÃ­deo (Whisper). AÃ±Ã¡dela en .env.local y reinicia.',
          },
          { status: 503 },
        )
      }
      return NextResponse.json(
        {
          error: 'transcription_failed',
          message:
            tr.reason === 'empty'
              ? 'No se obtuvo texto del vÃ­deo (Â¿sin audio o silencio?).'
              : 'Error al transcribir con Whisper. Revisa formato, tamaÃ±o y que el vÃ­deo tenga pista de audio.',
        },
        { status: 502 },
      )
    }

    const gen = await generateVideoContentPack({
      transcript: tr.text,
      tier,
      language,
      nicheHint,
    })

    if (!gen.ok) {
      const message =
        gen.reason === 'missing_api_key'
          ? 'Falta ANTHROPIC_API_KEY en el servidor.'
          : 'No se pudo generar el contenido con la IA.'
      return NextResponse.json(
        { error: gen.reason === 'missing_api_key' ? 'missing_api_key' : 'ia_no_disponible', message },
        { status: 503 },
      )
    }

    const label = filename.slice(0, 80)
    const { error: mErr } = await supabase.from('missions').insert({
      user_id: userId,
      mode: 'social_video',
      status: 'completed',
      goal: `VÃ­deo â†’ contenido [${tier}]: ${label}`,
      actions: gen.pack.hook_suggestions.length,
      created_at: new Date().toISOString(),
    })
    if (mErr) console.error('[social/video-content] mission insert', mErr)

    return NextResponse.json({
      success: true,
      pack: gen.pack,
      transcriptPreview: tr.text.slice(0, 400) + (tr.text.length > 400 ? 'â€¦' : ''),
      tier,
      limit: isFree ? SOCIAL_LIMITS.videoContent.freePerWeek : null,
      limitWindow: isFree ? 'week' : null,
    })
  } catch (e) {
    console.error('[social/video-content]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
