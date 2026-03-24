import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractYoutubeVideoId } from '@/lib/youtube-video-id'
import {
  SOCIAL_LIMITS,
  tierFromPlan,
  utcStartOfIsoWeekIso,
} from '@/lib/social-limits'
import {
  formatExpiresLabelEs,
  getOrCreateYoutubeRenderSession,
  saveYoutubeRenderToStorage,
  signedUrlSecondsForProject,
  youtubeThumbUrl,
  type YoutubeRenderProjectRow,
  type YoutubeRenderSessionRow,
} from '@/lib/youtube-render-projects'
import {
  renderYoutubeClipsToZipBuffer,
  renderYoutubeSingleClipToMp4Buffer,
  type YoutubeRenderClip,
  validateRenderClips,
} from '@/lib/youtube-render-pipeline'

export const maxDuration = 300
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function isYoutubeRenderDisabled(): boolean {
  if (process.env.DISABLE_YOUTUBE_RENDER === '1') return true
  if (process.env.VERCEL === '1' && process.env.ENABLE_YOUTUBE_RENDER !== '1') return true
  return false
}

function asciiDownloadName(videoId: string, clip: YoutubeRenderClip, index0: number): string {
  const raw = (clip.title || `clip-${index0 + 1}`)
    .replace(/[^\w\s-]/g, '_')
    .replace(/\s+/g, '-')
    .slice(0, 48)
  const base = raw || `clip-${index0 + 1}`
  return `${videoId}-${String(index0 + 1).padStart(2, '0')}-${base}.mp4`
}

async function assertRenderLimit(userId: string, tier: 'free' | 'pro'): Promise<NextResponse | null> {
  if (tier !== 'free') return null
  const since = utcStartOfIsoWeekIso()
  const { count, error: cErr } = await supabase
    .from('missions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('mode', 'social_youtube_render')
    .gte('created_at', since)
  if (cErr) console.error('[social/youtube-render] count', cErr)
  const used = count ?? 0
  if (used >= SOCIAL_LIMITS.youtubeRender.freePerWeek) {
    return NextResponse.json(
      {
        error: 'limit_reached',
        message: `Plan Free: ${SOCIAL_LIMITS.youtubeRender.freePerWeek} descarga(s) de vídeo 9:16/semana (lun UTC). Pro: sin límite en la app.`,
        limit: SOCIAL_LIMITS.youtubeRender.freePerWeek,
      },
      { status: 429 },
    )
  }
  return null
}

async function jsonStoredProject(row: YoutubeRenderProjectRow) {
  const expiresIn = signedUrlSecondsForProject(row.expires_at)
  const { data: signed, error: sErr } = await supabase.storage
    .from('youtube-renders')
    .createSignedUrl(row.storage_path, expiresIn)
  if (sErr) console.error('[social/youtube-render] signed url', sErr)
  return {
    ...row,
    thumbnail_url: youtubeThumbUrl(row.youtube_video_id),
    download_url: signed?.signedUrl ?? null,
    expires_label: formatExpiresLabelEs(row.expires_at),
  }
}

export async function POST(req: NextRequest) {
  try {
    if (isYoutubeRenderDisabled()) {
      return NextResponse.json(
        {
          error: 'render_disabled',
          message:
            'La descarga y render 9:16 no está activa en este despliegue. Usa un servidor propio (VPS/Docker) con `next start` o define ENABLE_YOUTUBE_RENDER=1 en Vercel sabiendo los límites de tiempo y disco.',
        },
        { status: 501 },
      )
    }

    const body = (await req.json()) as {
      userId?: string
      youtubeUrl?: string
      clips?: YoutubeRenderClip[]
      output?: 'zip' | 'mp4'
      clipIndex?: number
      /** Si true: sube a Storage y responde JSON (caduca a los 2 días). Si false: solo binario. */
      store?: boolean
      videoTitle?: string
      /** Proyecto nube existente (mismo vídeo) */
      sessionId?: string
      /** Snapshot del pack IA para el detalle del proyecto */
      clipsPlan?: unknown
    }

    const userId = body.userId?.trim()
    const youtubeUrl = body.youtubeUrl?.trim()
    const clips = Array.isArray(body.clips) ? body.clips : []
    const output = body.output === 'mp4' ? 'mp4' : 'zip'
    const store = body.store === true

    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 })
    }
    if (!youtubeUrl) {
      return NextResponse.json({ error: 'Falta la URL de YouTube' }, { status: 400 })
    }

    const videoId = extractYoutubeVideoId(youtubeUrl)
    if (!videoId) {
      return NextResponse.json(
        { error: 'URL inválida', message: 'Pega un enlace válido de YouTube.' },
        { status: 400 },
      )
    }

    if (output === 'mp4') {
      if (clips.length !== 1) {
        return NextResponse.json(
          {
            error: 'clips_invalidos',
            message: 'Para descargar un MP4 debes enviar exactamente un clip en el array.',
          },
          { status: 400 },
        )
      }
    } else {
      const validated = validateRenderClips(clips)
      if (!validated.ok) {
        return NextResponse.json({ error: 'clips_invalidos', message: validated.message }, { status: 400 })
      }
    }

    const singleClip = clips[0]
    if (output === 'mp4' && singleClip) {
      const oneOk = validateRenderClips([singleClip])
      if (!oneOk.ok) {
        return NextResponse.json({ error: 'clips_invalidos', message: oneOk.message }, { status: 400 })
      }
    }

    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', userId).maybeSingle()
    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    const tier = tierFromPlan(profile.plan)

    const limitResp = await assertRenderLimit(userId, tier)
    if (limitResp) return limitResp

    const clipIndex = typeof body.clipIndex === 'number' && body.clipIndex >= 0 ? body.clipIndex : 0

    let sessionForStore: YoutubeRenderSessionRow | null = null
    if (store) {
      const sr = await getOrCreateYoutubeRenderSession({
        supabase,
        userId,
        youtubeVideoId: videoId,
        youtubeUrl,
        videoTitle: body.videoTitle?.trim() || videoId,
        existingSessionId: body.sessionId?.trim() || null,
        clipsPlan: body.clipsPlan ?? null,
      })
      if ('error' in sr) {
        return NextResponse.json(
          { error: 'session_error', message: sr.error },
          { status: 503 },
        )
      }
      sessionForStore = sr.session
    }

    try {
      if (output === 'mp4' && singleClip) {
        const buf = await renderYoutubeSingleClipToMp4Buffer({
          youtubeUrl,
          clip: singleClip,
        })
        const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf)
        const filename = asciiDownloadName(videoId, singleClip, clipIndex)
        const durationSec = Math.round(singleClip.end_sec - singleClip.start_sec)
        const displayTitle = singleClip.title?.trim() || `Clip ${clipIndex + 1}`

        const { error: mErr } = await supabase.from('missions').insert({
          user_id: userId,
          mode: 'social_youtube_render',
          status: 'completed',
          goal: `YouTube MP4 9:16 [${tier}]: ${videoId} · clip ${clipIndex + 1}`,
          actions: 1,
          created_at: new Date().toISOString(),
        })
        if (mErr) console.error('[social/youtube-render] mission insert', mErr)

        if (store && sessionForStore) {
          const saved = await saveYoutubeRenderToStorage({
            supabase,
            userId,
            sessionId: sessionForStore.id,
            buffer,
            contentType: 'video/mp4',
            filename,
            youtubeVideoId: videoId,
            title: displayTitle,
            kind: 'mp4',
            clipIndex,
            durationSec,
          })
          if ('error' in saved) {
            return NextResponse.json(
              { error: 'storage_fallido', message: saved.error },
              { status: 503 },
            )
          }
          const pub = await jsonStoredProject(saved.project)
          return NextResponse.json({
            success: true,
            project: pub,
            session: {
              id: sessionForStore.id,
              video_title: sessionForStore.video_title,
              youtube_video_id: sessionForStore.youtube_video_id,
              expires_at: sessionForStore.expires_at,
              expires_label: formatExpiresLabelEs(sessionForStore.expires_at),
            },
          })
        }

        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
            'X-Video-Id': videoId,
          },
        })
      }

      const zip = await renderYoutubeClipsToZipBuffer({
        youtubeUrl,
        clips,
      })
      const zipBuf = Buffer.isBuffer(zip) ? zip : Buffer.from(zip)
      const zipFilename = `clips-9-16-${videoId}.zip`
      const totalDur = Math.round(
        clips.reduce((acc, c) => acc + (c.end_sec - c.start_sec), 0),
      )
      const packTitle =
        body.videoTitle?.trim() ||
        `Pack ${clips.length} clips`

      const { error: mErr } = await supabase.from('missions').insert({
        user_id: userId,
        mode: 'social_youtube_render',
        status: 'completed',
        goal: `YouTube ZIP 9:16 [${tier}]: ${videoId} · ${clips.length} clips`,
        actions: clips.length,
        created_at: new Date().toISOString(),
      })
      if (mErr) console.error('[social/youtube-render] mission insert', mErr)

      if (store && sessionForStore) {
        const saved = await saveYoutubeRenderToStorage({
          supabase,
          userId,
          sessionId: sessionForStore.id,
          buffer: zipBuf,
          contentType: 'application/zip',
          filename: zipFilename,
          youtubeVideoId: videoId,
          title: packTitle,
          kind: 'zip',
          clipIndex: null,
          durationSec: totalDur,
        })
        if ('error' in saved) {
          return NextResponse.json(
            { error: 'storage_fallido', message: saved.error },
            { status: 503 },
          )
        }
        const pub = await jsonStoredProject(saved.project)
        return NextResponse.json({
          success: true,
          project: pub,
          session: {
            id: sessionForStore.id,
            video_title: sessionForStore.video_title,
            youtube_video_id: sessionForStore.youtube_video_id,
            expires_at: sessionForStore.expires_at,
            expires_label: formatExpiresLabelEs(sessionForStore.expires_at),
          },
        })
      }

      return new NextResponse(new Uint8Array(zipBuf), {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${zipFilename}"`,
          'Cache-Control': 'no-store',
          'X-Video-Id': videoId,
        },
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[social/youtube-render] pipeline', e)
      return NextResponse.json(
        {
          error: 'render_fallido',
          message:
            msg.length > 400
              ? `${msg.slice(0, 400)}â€¦`
              : msg || 'No se pudo descargar o procesar el vídeo. Revisa yt-dlp y FFmpeg (variables YT_DLP_PATH / FFMPEG_BIN si hace falta).',
        },
        { status: 502 },
      )
    }
  } catch (e) {
    console.error('[social/youtube-render]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
