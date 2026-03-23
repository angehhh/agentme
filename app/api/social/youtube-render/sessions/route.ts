import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { listYoutubeRenderSessionsForUser } from '@/lib/youtube-render-projects'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/** Lista proyectos (sesiones por vídeo) con conteo de archivos listos. */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')?.trim()
    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 })
    }

    const rawSaved = req.nextUrl.searchParams.get('savedOnly')?.toLowerCase() ?? ''
    const savedOnly = rawSaved === '1' || rawSaved === 'true' || rawSaved === 'yes'
    const sessions = await listYoutubeRenderSessionsForUser(supabase, userId, { savedOnly })
    return NextResponse.json({ success: true, sessions })
  } catch (e) {
    console.error('[social/youtube-render/sessions]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
