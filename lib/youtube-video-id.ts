/** Extrae el ID de 11 caracteres de URLs habituales de YouTube */
export function extractYoutubeVideoId(input: string): string | null {
  const s = input.trim()
  if (!s) return null
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s

  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0]
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
    }

    if (host.endsWith('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
      const m = u.pathname.match(/\/(shorts|embed|live)\/([a-zA-Z0-9_-]{11})/)
      if (m?.[2]) return m[2]
    }
  } catch {
    return null
  }

  const loose = s.match(/(?:v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return loose?.[1] ?? null
}

export function youtubeWatchUrl(videoId: string, startSec?: number): string {
  const base = `https://www.youtube.com/watch?v=${videoId}`
  if (startSec != null && Number.isFinite(startSec) && startSec > 0) {
    return `${base}&t=${Math.floor(startSec)}s`
  }
  return base
}

/** Vista previa embebida del tramo [startSec, endSec]. `origin` mejora compatibilidad del reproductor incrustado. */
export function youtubeEmbedClipUrl(
  videoId: string,
  startSec: number,
  endSec: number,
  opts?: { origin?: string },
): string {
  const start = Math.max(0, Math.floor(startSec))
  const end = Math.max(start + 1, Math.ceil(endSec))
  const q = new URLSearchParams({
    start: String(start),
    end: String(end),
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
  })
  if (opts?.origin?.trim()) {
    q.set('origin', opts.origin.trim())
  }
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${q.toString()}`
}
