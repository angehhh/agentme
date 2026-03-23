import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runFullYoutubeRenderCleanup } from '@/lib/youtube-render-projects'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * Limpia proyectos caducados (Storage + DB). Protege con CRON_SECRET en Authorization: Bearer …
 * o query ?secret= (Vercel Cron puede usar header).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 503 })
  }
  const auth = req.headers.get('authorization')
  const q = req.nextUrl.searchParams.get('secret')
  const ok =
    auth === `Bearer ${secret}` ||
    auth === secret ||
    q === secret
  if (!ok) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  await runFullYoutubeRenderCleanup(supabase)
  return NextResponse.json({ success: true, message: 'Limpieza de sesiones y huérfanos ejecutada' })
}
