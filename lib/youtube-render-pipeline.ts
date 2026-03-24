/**
 * Descarga un vÃ­deo de YouTube (yt-dlp) y exporta MP4 verticales 1080Ã—1920 (9:16) con FFmpeg.
 * Las rutas a binarios se resuelven vÃ­a process.cwd() (ver resolve-media-binaries).
 */

import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { Writable } from 'stream'
import archiver from 'archiver'
import { create as createYoutubeDl } from 'youtube-dl-exec'
import { resolveFfmpegPath, resolveYtDlpExecutable } from '@/lib/resolve-media-binaries'

export type YoutubeRenderClip = {
  start_sec: number
  end_sec: number
  title?: string
}

export const YOUTUBE_RENDER_MAX_CLIPS = 14
export const YOUTUBE_RENDER_MIN_CLIP_SEC = 2
export const YOUTUBE_RENDER_MAX_CLIP_SEC = 90
/** Suma mÃ¡xima de duraciones de clips (evita abusos de CPU). */
export const YOUTUBE_RENDER_MAX_TOTAL_CLIP_SEC = 16 * 60
/** VÃ­deos de YouTube mÃ¡s largos no se procesan (descarga + memoria). */
export const YOUTUBE_RENDER_MAX_SOURCE_DURATION_SEC = 2 * 60 * 60

function youtubeDlClient() {
  return createYoutubeDl(resolveYtDlpExecutable())
}

function safeFileName(s: string): string {
  const t = s.replace(/[^\w\sÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼ÃÃ‰ÃÃ“ÃšÃ‘Ãœ-]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 55)
  return t || 'clip'
}

function runFfmpeg916(
  ff: string,
  input: string,
  output: string,
  startSec: number,
  durationSec: number,
): Promise<void> {
  const vf =
    'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1'
  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-ss',
    String(startSec),
    '-i',
    input,
    '-t',
    String(durationSec),
    '-vf',
    vf,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    output,
  ]
  return new Promise((resolve, reject) => {
    const p = spawn(ff, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let err = ''
    p.stderr?.on('data', d => {
      err += d.toString()
    })
    p.on('error', reject)
    p.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg terminÃ³ con cÃ³digo ${code}: ${err.slice(-1200)}`))
    })
  })
}

async function zipFilesToBuffer(entries: { abs: string; name: string }[]): Promise<Buffer> {
  const archive = archiver('zip', { zlib: { level: 6 } })
  const chunks: Buffer[] = []
  const sink = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      cb()
    },
  })
  const done = new Promise<void>((resolve, reject) => {
    archive.on('error', reject)
    sink.on('error', reject)
    sink.on('finish', () => resolve())
  })
  archive.pipe(sink)
  for (const e of entries) {
    archive.file(e.abs, { name: e.name })
  }
  archive.finalize()
  await done
  return Buffer.concat(chunks)
}

export function validateRenderClips(clips: YoutubeRenderClip[]): { ok: true } | { ok: false; message: string } {
  if (!Array.isArray(clips) || clips.length === 0) {
    return { ok: false, message: 'Indica al menos un clip (inicio y fin).' }
  }
  if (clips.length > YOUTUBE_RENDER_MAX_CLIPS) {
    return {
      ok: false,
      message: `MÃ¡ximo ${YOUTUBE_RENDER_MAX_CLIPS} clips por descarga.`,
    }
  }
  let total = 0
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i]!
    const start = Number(c.start_sec)
    const end = Number(c.end_sec)
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return { ok: false, message: `Clip ${i + 1}: tiempos no vÃ¡lidos.` }
    }
    if (start < 0 || end <= start) {
      return { ok: false, message: `Clip ${i + 1}: el fin debe ser mayor que el inicio.` }
    }
    const dur = end - start
    if (dur < YOUTUBE_RENDER_MIN_CLIP_SEC || dur > YOUTUBE_RENDER_MAX_CLIP_SEC) {
      return {
        ok: false,
        message: `Clip ${i + 1}: duraciÃ³n entre ${YOUTUBE_RENDER_MIN_CLIP_SEC} y ${YOUTUBE_RENDER_MAX_CLIP_SEC} s.`,
      }
    }
    total += dur
  }
  if (total > YOUTUBE_RENDER_MAX_TOTAL_CLIP_SEC) {
    return {
      ok: false,
      message: `La suma de duraciones no puede superar ${Math.floor(YOUTUBE_RENDER_MAX_TOTAL_CLIP_SEC / 60)} minutos.`,
    }
  }
  return { ok: true }
}

type YtInfo = { duration?: number; _type?: string }

async function fetchVideoInfo(youtubeDl: ReturnType<typeof createYoutubeDl>, youtubeUrl: string): Promise<YtInfo> {
  return (await youtubeDl(youtubeUrl, {
    dumpSingleJson: true,
    skipDownload: true,
    noWarnings: true,
    noPlaylist: true,
  })) as YtInfo
}

async function downloadYoutubeToTmp(params: {
  youtubeUrl: string
  youtubeDl: ReturnType<typeof createYoutubeDl>
  tmp: string
  ffmpegDir: string
  onProgress?: (msg: string) => void
}): Promise<string> {
  params.onProgress?.('Descargando vÃ­deo (puede tardar varios minutos)â€¦')
  const sourceBase = path.join(params.tmp, 'source')
  await params.youtubeDl(params.youtubeUrl, {
    output: `${sourceBase}.%(ext)s`,
    format: 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best',
    mergeOutputFormat: 'mp4',
    ffmpegLocation: params.ffmpegDir,
    noWarnings: true,
    noPlaylist: true,
  })

  const names = await fs.readdir(params.tmp)
  const sourceFile = names.find(
    f => f.startsWith('source.') && !f.endsWith('.part') && !f.endsWith('.ytdl'),
  )
  if (!sourceFile) {
    throw new Error('No se encontrÃ³ el archivo descargado. Prueba otra URL o formato.')
  }
  return path.join(params.tmp, sourceFile)
}

/**
 * Un clip â†’ un MP4 9:16 en memoria (descarga completa del vÃ­deo por peticiÃ³n).
 */
export async function renderYoutubeSingleClipToMp4Buffer(params: {
  youtubeUrl: string
  clip: YoutubeRenderClip
  onProgress?: (msg: string) => void
}): Promise<Buffer> {
  const ff = resolveFfmpegPath()
  const v = validateRenderClips([params.clip])
  if (!v.ok) throw new Error(v.message)

  const youtubeDl = youtubeDlClient()
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'yt-render-one-'))
  const ffmpegDir = path.dirname(ff)

  try {
    params.onProgress?.('Comprobando vÃ­deo en YouTubeâ€¦')
    const info = await fetchVideoInfo(youtubeDl, params.youtubeUrl)
    const dur = typeof info.duration === 'number' ? info.duration : 0
    if (dur > YOUTUBE_RENDER_MAX_SOURCE_DURATION_SEC) {
      throw new Error(
        `El vÃ­deo dura mÃ¡s de ${YOUTUBE_RENDER_MAX_SOURCE_DURATION_SEC / 3600} h; reduce la duraciÃ³n o elige otro.`,
      )
    }

    const inputAbs = await downloadYoutubeToTmp({
      youtubeUrl: params.youtubeUrl,
      youtubeDl,
      tmp,
      ffmpegDir,
      onProgress: params.onProgress,
    })

    const durationSec = params.clip.end_sec - params.clip.start_sec
    const outAbs = path.join(tmp, 'out.mp4')
    params.onProgress?.('Render 9:16â€¦')
    await runFfmpeg916(ff, inputAbs, outAbs, params.clip.start_sec, durationSec)
    return await fs.readFile(outAbs)
  } finally {
    await fs.rm(tmp, { recursive: true, force: true }).catch(() => {})
  }
}

/**
 * Varios clips â†’ un ZIP con un MP4 por clip (una sola descarga del vÃ­deo fuente).
 */
export async function renderYoutubeClipsToZipBuffer(params: {
  youtubeUrl: string
  clips: YoutubeRenderClip[]
  onProgress?: (msg: string) => void
}): Promise<Buffer> {
  const ff = resolveFfmpegPath()
  const v = validateRenderClips(params.clips)
  if (!v.ok) throw new Error(v.message)

  const youtubeDl = youtubeDlClient()
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'yt-render-'))
  const ffmpegDir = path.dirname(ff)

  try {
    params.onProgress?.('Comprobando vÃ­deo en YouTubeâ€¦')
    const info = await fetchVideoInfo(youtubeDl, params.youtubeUrl)
    const dur = typeof info.duration === 'number' ? info.duration : 0
    if (dur > YOUTUBE_RENDER_MAX_SOURCE_DURATION_SEC) {
      throw new Error(
        `El vÃ­deo dura mÃ¡s de ${YOUTUBE_RENDER_MAX_SOURCE_DURATION_SEC / 3600} h; reduce la duraciÃ³n o elige otro.`,
      )
    }

    const inputAbs = await downloadYoutubeToTmp({
      youtubeUrl: params.youtubeUrl,
      youtubeDl,
      tmp,
      ffmpegDir,
      onProgress: params.onProgress,
    })

    const zipEntries: { abs: string; name: string }[] = []
    for (let i = 0; i < params.clips.length; i++) {
      const c = params.clips[i]!
      const durationSec = c.end_sec - c.start_sec
      const safeTitle = safeFileName(c.title || `clip_${i + 1}`)
      const outName = `${String(i + 1).padStart(2, '0')}_${safeTitle}.mp4`
      const outAbs = path.join(tmp, outName)
      params.onProgress?.(`Render 9:16 ${i + 1}/${params.clips.length}â€¦`)
      await runFfmpeg916(ff, inputAbs, outAbs, c.start_sec, durationSec)
      zipEntries.push({ abs: outAbs, name: outName })
    }

    params.onProgress?.('Generando ZIPâ€¦')
    return await zipFilesToBuffer(zipEntries)
  } finally {
    await fs.rm(tmp, { recursive: true, force: true }).catch(() => {})
  }
}
