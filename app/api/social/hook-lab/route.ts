import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateHookLab } from '@/lib/social-claude'
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
    const { userId, topic, audience, tone, language } = body as {
      userId?: string
      topic?: string
      audience?: string
      tone?: string
      language?: string
    }

    if (!userId || !topic?.trim()) {
      return NextResponse.json({ error: 'Faltan userId o tema' }, { status: 400 })
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
        .eq('mode', 'social_hook')
        .gte('created_at', since)

      if (cErr) console.error('[social/hook-lab] count missions', cErr)
      const used = count ?? 0
      if (used >= SOCIAL_LIMITS.hookLab.freePerWeek) {
        return NextResponse.json(
          {
            error: 'limit_reached',
            message: `Plan Free: ${SOCIAL_LIMITS.hookLab.freePerWeek} Hook Labs por semana (lunes UTC), salida reducida. Pro: pack completo y sin límite de uso en la app.`,
            limit: SOCIAL_LIMITS.hookLab.freePerWeek,
          },
          { status: 429 },
        )
      }
    }

    const gen = await generateHookLab({
      topic: topic.trim(),
      audience: typeof audience === 'string' ? audience : undefined,
      tone: typeof tone === 'string' ? tone : undefined,
      language: typeof language === 'string' ? language : undefined,
      tier,
    })

    if (!gen.ok) {
      const message =
        gen.reason === 'missing_api_key'
          ? 'Falta ANTHROPIC_API_KEY en el servidor (p. ej. .env.local). Añádela y reinicia `next dev`.'
          : 'No se pudo generar Hook Lab (API de Anthropic o respuesta inesperada). Revisa la consola del servidor e inténtalo de nuevo.'
      return NextResponse.json(
        {
          error: gen.reason === 'missing_api_key' ? 'missing_api_key' : 'ia_no_disponible',
          message,
        },
        { status: 503 },
      )
    }

    const { data: hookData } = gen

    const { error: mErr } = await supabase.from('missions').insert({
      user_id: userId,
      mode: 'social_hook',
      status: 'completed',
      goal: `Hook Lab [${tier}]: ${topic.trim().slice(0, 110)}`,
      actions: hookData.hooks.length,
      created_at: new Date().toISOString(),
    })
    if (mErr) console.error('[social/hook-lab] mission insert', mErr)

    return NextResponse.json({
      success: true,
      hookLab: hookData,
      tier,
      limit: isFree ? SOCIAL_LIMITS.hookLab.freePerWeek : null,
      limitWindow: isFree ? 'week' : null,
      plan: tier,
    })
  } catch (e) {
    console.error('[social/hook-lab]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
