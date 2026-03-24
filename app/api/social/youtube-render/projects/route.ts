import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { listYoutubeRenderProjectsForUser } from '@/lib/youtube-render-projects'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * Lista renders guardados (vÃ¡lidos) del usuario; elimina filas y archivos ya caducados.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')?.trim()
    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 })
    }

    const projects = await listYoutubeRenderProjectsForUser(supabase, userId)
    return NextResponse.json({ success: true, projects })
  } catch (e) {
    console.error('[social/youtube-render/projects]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
