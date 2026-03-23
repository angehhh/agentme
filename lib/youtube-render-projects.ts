import type { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

export const YOUTUBE_RENDER_BUCKET = 'youtube-renders'
export const YOUTUBE_RENDER_TTL_DAYS = 2

export type YoutubeRenderProjectRow = {
  id: string
  user_id: string
  session_id: string | null
  storage_path: string
  filename: string
  youtube_video_id: string
  title: string
  kind: 'mp4' | 'zip'
  clip_index: number | null
  duration_sec: number | null
  file_size: number
  status: string
  created_at: string
  expires_at: string
}

export type YoutubeRenderProjectPublic = YoutubeRenderProjectRow & {
  thumbnail_url: string
  download_url: string | null
  expires_label: string
}

export type YoutubeRenderSessionRow = {
  id: string
  user_id: string
  youtube_video_id: string
  youtube_url: string
  video_title: string
  clips_plan: unknown | null
  /** Pestaña «Guardados» (columna opcional hasta migrar SQL). */
  is_saved?: boolean | null
  expires_at: string
  created_at: string
  updated_at: string
}

export type YoutubeRenderSessionCard = YoutubeRenderSessionRow & {
  thumbnail_url: string
  expires_label: string
  ready_assets: number
  total_assets: number
}

export type YoutubeRenderSessionDetail = {
  session: YoutubeRenderSessionCard
  assets: YoutubeRenderProjectPublic[]
}

export function defaultExpiresAtIso(): string {
  return new Date(
    Date.now() + YOUTUBE_RENDER_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()
}

export function youtubeThumbUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg`
}

export function signedUrlSecondsForProject(expiresAtIso: string): number {
  const ms = new Date(expiresAtIso).getTime() - Date.now()
  const sec = Math.floor(ms / 1000)
  return Math.max(120, Math.min(sec, 60 * 60 * 24 * 2))
}

export function formatExpiresLabelEs(expiresAtIso: string, nowMs: number = Date.now()): string {
  const end = new Date(expiresAtIso).getTime()
  const ms = end - nowMs
  if (ms <= 0) return 'Caducado'
  const h = ms / (1000 * 60 * 60)
  if (h >= 48) return `${YOUTUBE_RENDER_TTL_DAYS} días antes de caducar`
  if (h >= 36) return '1 día antes de caducar'
  if (h >= 24) return 'Caduca en 1 día'
  if (h >= 2) return `Caduca en ${Math.ceil(h)} h`
  if (h >= 1) return 'Caduca en ~1 h'
  const m = Math.max(1, Math.ceil(ms / (1000 * 60)))
  return `Caduca en ${m} min`
}

/** Reduce tamaño del JSON del pack IA para guardar en DB */
export function trimClipsPlanForDb(plan: unknown): unknown | null {
  if (plan == null || typeof plan !== 'object') return null
  const o = plan as { clips?: unknown[] }
  if (!Array.isArray(o.clips)) return { clips: [] }
  const clips = o.clips.slice(0, 20).map((raw, i) => {
    if (!raw || typeof raw !== 'object') return { clip_index: i }
    const c = raw as Record<string, unknown>
    const arr = (x: unknown) => (Array.isArray(x) ? x.map(String).slice(0, 12) : [])
    return {
      clip_index: typeof c.clip_index === 'number' ? c.clip_index : i,
      title: String(c.title ?? '').slice(0, 200),
      start_sec: Number(c.start_sec) || 0,
      end_sec: Number(c.end_sec) || 0,
      hook_overlay: String(c.hook_overlay ?? '').slice(0, 500),
      publish_description: String(c.publish_description ?? '').slice(0, 2000),
      suggested_hashtags: arr(c.suggested_hashtags),
      why_stops_scroll: String(c.why_stops_scroll ?? '').slice(0, 500),
      nine_sixteen_framing: String(c.nine_sixteen_framing ?? '').slice(0, 400),
    }
  })
  return { clips }
}

export async function getOrCreateYoutubeRenderSession(params: {
  supabase: SupabaseClient
  userId: string
  youtubeVideoId: string
  youtubeUrl: string
  videoTitle: string
  existingSessionId?: string | null
  clipsPlan?: unknown | null
}): Promise<{ session: YoutubeRenderSessionRow } | { error: string }> {
  const now = new Date().toISOString()
  const expiresAt = defaultExpiresAtIso()

  const patchFromPlan = async (sessionId: string) => {
    if (
      params.clipsPlan == null &&
      !params.videoTitle?.trim() &&
      !params.youtubeUrl?.trim()
    ) {
      return
    }
    const patch: Record<string, unknown> = { updated_at: now }
    if (params.clipsPlan != null) {
      patch.clips_plan = trimClipsPlanForDb(params.clipsPlan)
    }
    if (params.videoTitle?.trim()) patch.video_title = params.videoTitle.trim()
    if (params.youtubeUrl?.trim()) patch.youtube_url = params.youtubeUrl.trim()
    await params.supabase.from('youtube_render_sessions').update(patch).eq('id', sessionId)
  }

  if (params.existingSessionId?.trim()) {
    const { data: s, error } = await params.supabase
      .from('youtube_render_sessions')
      .select('*')
      .eq('id', params.existingSessionId.trim())
      .eq('user_id', params.userId)
      .gt('expires_at', now)
      .maybeSingle()
    if (error || !s) {
      return { error: 'Sesión no válida o caducada.' }
    }
    await patchFromPlan(s.id)
    const { data: refreshed } = await params.supabase
      .from('youtube_render_sessions')
      .select('*')
      .eq('id', s.id)
      .single()
    return { session: (refreshed ?? s) as YoutubeRenderSessionRow }
  }

  const { data: existing } = await params.supabase
    .from('youtube_render_sessions')
    .select('*')
    .eq('user_id', params.userId)
    .eq('youtube_video_id', params.youtubeVideoId)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    await patchFromPlan(existing.id)
    const { data: refreshed } = await params.supabase
      .from('youtube_render_sessions')
      .select('*')
      .eq('id', existing.id)
      .single()
    return { session: (refreshed ?? existing) as YoutubeRenderSessionRow }
  }

  const { data: inserted, error: insErr } = await params.supabase
    .from('youtube_render_sessions')
    .insert({
      user_id: params.userId,
      youtube_video_id: params.youtubeVideoId,
      youtube_url: params.youtubeUrl,
      video_title: params.videoTitle?.trim() || params.youtubeVideoId,
      clips_plan: params.clipsPlan != null ? trimClipsPlanForDb(params.clipsPlan) : null,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (insErr || !inserted) {
    console.error('[youtube_render_sessions] insert', insErr)
    const code = String((insErr as { code?: string })?.code ?? '')
    const msg = String((insErr as { message?: string })?.message ?? '')
    const missingSessionsTable =
      code === 'PGRST205' ||
      msg.includes('youtube_render_sessions') ||
      msg.includes('schema cache')
    return {
      error: missingSessionsTable
        ? 'Falta la tabla «youtube_render_sessions» en Supabase. En SQL Editor ejecuta el archivo supabase/add_youtube_render_sessions.sql (después de create_youtube_render_projects.sql), recarga el proyecto y vuelve a intentarlo.'
        : 'No se pudo crear el proyecto en la nube.',
    }
  }
  return { session: inserted as YoutubeRenderSessionRow }
}

async function signProjectRow(
  supabase: SupabaseClient,
  row: YoutubeRenderProjectRow,
): Promise<YoutubeRenderProjectPublic> {
  const expiresIn = signedUrlSecondsForProject(row.expires_at)
  const { data: signed, error: sErr } = await supabase.storage
    .from(YOUTUBE_RENDER_BUCKET)
    .createSignedUrl(row.storage_path, expiresIn)
  if (sErr) console.error('[youtube_render_projects] signed url', sErr)
  return {
    ...row,
    thumbnail_url: youtubeThumbUrl(row.youtube_video_id),
    download_url: signed?.signedUrl ?? null,
    expires_label: formatExpiresLabelEs(row.expires_at),
  }
}

/** Sesiones caducadas: borra Storage de todos los assets y la sesión (CASCADE borra filas hijas). */
export async function cleanupExpiredYoutubeRenderSessions(
  supabase: SupabaseClient,
): Promise<number> {
  const now = new Date().toISOString()
  const { data: sessions, error } = await supabase
    .from('youtube_render_sessions')
    .select('id')
    .lt('expires_at', now)

  if (error) {
    console.error('[youtube_render_sessions] cleanup select', error)
    return 0
  }

  let removed = 0
  for (const s of sessions || []) {
    const { data: assets } = await supabase
      .from('youtube_render_projects')
      .select('storage_path')
      .eq('session_id', s.id)

    for (const a of assets || []) {
      const { error: rmErr } = await supabase.storage
        .from(YOUTUBE_RENDER_BUCKET)
        .remove([a.storage_path])
      if (rmErr) console.error('[youtube_render_sessions] storage remove', rmErr)
    }

    const { error: delErr } = await supabase
      .from('youtube_render_sessions')
      .delete()
      .eq('id', s.id)
    if (!delErr) removed++
    else console.error('[youtube_render_sessions] delete', delErr)
  }
  return removed
}

/** Filas antiguas sin sesión (antes de la migración). */
export async function cleanupOrphanYoutubeRenderProjects(
  supabase: SupabaseClient,
): Promise<number> {
  const now = new Date().toISOString()
  const { data: rows, error } = await supabase
    .from('youtube_render_projects')
    .select('id, storage_path')
    .lt('expires_at', now)
    .is('session_id', null)

  if (error) {
    console.error('[youtube_render_projects] orphan cleanup', error)
    return 0
  }

  let n = 0
  for (const r of rows || []) {
    await supabase.storage.from(YOUTUBE_RENDER_BUCKET).remove([r.storage_path])
    const { error: d } = await supabase.from('youtube_render_projects').delete().eq('id', r.id)
    if (!d) n++
  }
  return n
}

export async function runFullYoutubeRenderCleanup(supabase: SupabaseClient): Promise<void> {
  await cleanupExpiredYoutubeRenderSessions(supabase)
  await cleanupOrphanYoutubeRenderProjects(supabase)
}

export async function listYoutubeRenderSessionsForUser(
  supabase: SupabaseClient,
  userId: string,
  options?: { savedOnly?: boolean },
): Promise<YoutubeRenderSessionCard[]> {
  await runFullYoutubeRenderCleanup(supabase)

  const now = new Date().toISOString()
  let q = supabase
    .from('youtube_render_sessions')
    .select('*')
    .eq('user_id', userId)
    .gt('expires_at', now)
  if (options?.savedOnly) {
    q = q.eq('is_saved', true)
  }
  const { data: sessions, error } = await q.order('created_at', { ascending: false })

  if (error) {
    console.error('[youtube_render_sessions] list', error)
    return []
  }

  const list = (sessions || []) as YoutubeRenderSessionRow[]
  if (list.length === 0) return []

  const ids = list.map(s => s.id)
  const { data: assets } = await supabase
    .from('youtube_render_projects')
    .select('session_id, status')
    .in('session_id', ids)

  const counts = new Map<string, { total: number; ready: number }>()
  for (const sid of ids) counts.set(sid, { total: 0, ready: 0 })
  for (const a of assets || []) {
    const sid = a.session_id as string
    const c = counts.get(sid)
    if (!c) continue
    c.total++
    if (a.status === 'ready') c.ready++
  }

  return list.map(s => {
    const c = counts.get(s.id) ?? { total: 0, ready: 0 }
    return {
      ...s,
      is_saved: Boolean(s.is_saved),
      thumbnail_url: youtubeThumbUrl(s.youtube_video_id),
      expires_label: formatExpiresLabelEs(s.expires_at),
      ready_assets: c.ready,
      total_assets: c.total,
    }
  })
}

export async function getYoutubeRenderSessionDetail(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
): Promise<YoutubeRenderSessionDetail | null> {
  await runFullYoutubeRenderCleanup(supabase)

  const now = new Date().toISOString()
  const { data: session, error } = await supabase
    .from('youtube_render_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .gt('expires_at', now)
    .maybeSingle()

  if (error || !session) return null

  const s = session as YoutubeRenderSessionRow
  const { data: projects } = await supabase
    .from('youtube_render_projects')
    .select('*')
    .eq('session_id', sessionId)
    .eq('status', 'ready')
    .order('created_at', { ascending: true })

  const signed: YoutubeRenderProjectPublic[] = []
  for (const row of (projects || []) as YoutubeRenderProjectRow[]) {
    signed.push(await signProjectRow(supabase, row))
  }

  const c = { total: signed.length, ready: signed.length }
  const card: YoutubeRenderSessionCard = {
    ...s,
    is_saved: Boolean(s.is_saved),
    thumbnail_url: youtubeThumbUrl(s.youtube_video_id),
    expires_label: formatExpiresLabelEs(s.expires_at),
    ready_assets: c.ready,
    total_assets: c.total,
  }

  return { session: card, assets: signed }
}

/** Lista plana (legacy / sin sesión) */
export async function listYoutubeRenderProjectsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<YoutubeRenderProjectPublic[]> {
  await runFullYoutubeRenderCleanup(supabase)

  const now = new Date().toISOString()
  const { data: rows, error } = await supabase
    .from('youtube_render_projects')
    .select('*')
    .eq('user_id', userId)
    .gt('expires_at', now)
    .eq('status', 'ready')
    .is('session_id', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[youtube_render_projects] list orphan', error)
    return []
  }

  const out: YoutubeRenderProjectPublic[] = []
  for (const row of (rows || []) as YoutubeRenderProjectRow[]) {
    out.push(await signProjectRow(supabase, row))
  }
  return out
}

export async function saveYoutubeRenderToStorage(params: {
  supabase: SupabaseClient
  userId: string
  sessionId: string
  buffer: Buffer
  contentType: 'video/mp4' | 'application/zip'
  filename: string
  youtubeVideoId: string
  title: string
  kind: 'mp4' | 'zip'
  clipIndex: number | null
  durationSec: number | null
}): Promise<{ project: YoutubeRenderProjectRow } | { error: string }> {
  const { data: sess, error: sErr } = await params.supabase
    .from('youtube_render_sessions')
    .select('expires_at')
    .eq('id', params.sessionId)
    .eq('user_id', params.userId)
    .maybeSingle()

  if (sErr || !sess) {
    return { error: 'Sesión de proyecto no encontrada.' }
  }

  const expiresAt = sess.expires_at as string
  const ext = params.kind === 'mp4' ? 'mp4' : 'zip'
  const id = randomUUID()
  const storagePath = `${params.userId}/${id}.${ext}`

  const { error: upErr } = await params.supabase.storage
    .from(YOUTUBE_RENDER_BUCKET)
    .upload(storagePath, params.buffer, {
      contentType: params.contentType,
      upsert: false,
    })

  if (upErr) {
    console.error('[youtube_render_projects] upload', upErr)
    return { error: upErr.message || 'Error al subir el archivo a almacenamiento.' }
  }

  const { data: inserted, error: insErr } = await params.supabase
    .from('youtube_render_projects')
    .insert({
      id,
      user_id: params.userId,
      session_id: params.sessionId,
      storage_path: storagePath,
      filename: params.filename,
      youtube_video_id: params.youtubeVideoId,
      title: params.title,
      kind: params.kind,
      clip_index: params.clipIndex,
      duration_sec: params.durationSec,
      file_size: params.buffer.length,
      status: 'ready',
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (insErr || !inserted) {
    console.error('[youtube_render_projects] insert', insErr)
    await params.supabase.storage.from(YOUTUBE_RENDER_BUCKET).remove([storagePath])
    return { error: 'No se pudo registrar el archivo. Inténtalo de nuevo.' }
  }

  await params.supabase
    .from('youtube_render_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', params.sessionId)

  return { project: inserted as YoutubeRenderProjectRow }
}
