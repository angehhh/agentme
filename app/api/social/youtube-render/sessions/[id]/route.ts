import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getYoutubeRenderSessionDetail } from '@/lib/youtube-render-projects'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/** Detalle de un proyecto: sesión + assets con URL firmada + clips_plan (IA). */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')?.trim()
    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 })
    }
    const { id: sessionId } = await ctx.params
    if (!sessionId?.trim()) {
      return NextResponse.json({ error: 'Falta id' }, { status: 400 })
    }

    const detail = await getYoutubeRenderSessionDetail(supabase, userId, sessionId.trim())
    if (!detail) {
      return NextResponse.json({ error: 'Proyecto no encontrado o caducado' }, { status: 404 })
    }
    return NextResponse.json({ success: true, ...detail })
  } catch (e) {
    console.error('[social/youtube-render/sessions/id]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

/** Marcar / desmarcar proyecto en «Guardados». */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')?.trim()
    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 })
    }
    const { id: sessionId } = await ctx.params
    if (!sessionId?.trim()) {
      return NextResponse.json({ error: 'Falta id' }, { status: 400 })
    }

    const body = (await req.json()) as { is_saved?: unknown }
    if (typeof body.is_saved !== 'boolean') {
      return NextResponse.json({ error: 'Body inválido: is_saved (boolean) requerido' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('youtube_render_sessions')
      .update({ is_saved: body.is_saved, updated_at: now })
      .eq('id', sessionId.trim())
      .eq('user_id', userId)
      .gt('expires_at', now)
      .select('id, is_saved')
      .maybeSingle()

    if (error) {
      console.error('[social/youtube-render/sessions/id] PATCH', error)
      const msg = error.message ?? ''
      if (msg.includes('is_saved') || msg.includes('column')) {
        return NextResponse.json(
          {
            error: 'schema',
            message:
              'Falta la columna is_saved. Ejecuta en Supabase: supabase/add_youtube_render_sessions_saved.sql',
          },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Proyecto no encontrado o caducado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, id: data.id, is_saved: Boolean(data.is_saved) })
  } catch (e) {
    console.error('[social/youtube-render/sessions/id] PATCH', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
