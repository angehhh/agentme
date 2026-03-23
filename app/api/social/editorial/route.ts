import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateEditorialCalendar } from '@/lib/social-claude'
import {
  SOCIAL_LIMITS,
  tierFromPlan,
  utcStartOfIsoWeekIso,
} from '@/lib/social-limits'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId,
      niche,
      audience,
      tone,
      mainPlatform,
      language,
    } = body as {
      userId?: string
      niche?: string
      audience?: string
      tone?: string
      mainPlatform?: string
      language?: string
    }

    if (!userId || !niche?.trim()) {
      return NextResponse.json({ error: 'Faltan userId o nicho' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .maybeSingle()

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
        .eq('mode', 'social')
        .gte('created_at', since)

      if (cErr) console.error('[social/editorial] count missions', cErr)
      const used = count ?? 0
      if (used >= SOCIAL_LIMITS.editorial.freePerWeek) {
        return NextResponse.json({
          error: 'limit_reached',
          message: `Plan Free: ${SOCIAL_LIMITS.editorial.freePerWeek} calendario por semana (lunes UTC), solo vista previa de 3 días. Pro: semana completa (7) y sin límite de generaciones en la app.`,
          limit: SOCIAL_LIMITS.editorial.freePerWeek,
        }, { status: 429 })
      }
    }

    const gen = await generateEditorialCalendar({
      niche: niche.trim(),
      audience: typeof audience === 'string' ? audience : undefined,
      tone: typeof tone === 'string' ? tone : undefined,
      mainPlatform: typeof mainPlatform === 'string' ? mainPlatform : undefined,
      language: typeof language === 'string' ? language : undefined,
      tier,
    })

    if (!gen.ok) {
      const message =
        gen.reason === 'missing_api_key'
          ? 'Falta ANTHROPIC_API_KEY en el servidor (p. ej. .env.local). Añádela y reinicia `next dev`.'
          : 'No se pudo generar el calendario (API de Anthropic o respuesta inesperada). Revisa la consola del servidor, créditos de la cuenta e inténtalo de nuevo.'
      return NextResponse.json(
        {
          error: gen.reason === 'missing_api_key' ? 'missing_api_key' : 'ia_no_disponible',
          message,
        },
        { status: 503 },
      )
    }

    const calendar = gen.calendar

    const { error: mErr } = await supabase.from('missions').insert({
      user_id: userId,
      mode: 'social',
      status: 'completed',
      goal: `Calendario editorial [${tier}]: ${niche.trim().slice(0, 110)}`,
      actions: calendar.posts.length,
      created_at: new Date().toISOString(),
    })
    if (mErr) console.error('[social/editorial] mission insert', mErr)

    return NextResponse.json({
      success: true,
      calendar,
      tier,
      limit: isFree ? SOCIAL_LIMITS.editorial.freePerWeek : null,
      limitWindow: isFree ? 'week' : null,
    })
  } catch (e) {
    console.error('[social/editorial]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
