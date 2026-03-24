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
