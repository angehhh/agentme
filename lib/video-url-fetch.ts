import { VIDEO_UPLOAD_MAX_MB } from '@/lib/social-limits'

const MAX_BYTES = VIDEO_UPLOAD_MAX_MB * 1024 * 1024

const BLOCKED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
  'tiktok.com',
  'www.tiktok.com',
  'vm.tiktok.com',
  'instagram.com',
  'www.instagram.com',
  'facebook.com',
  'www.facebook.com',
  'twitter.com',
  'www.twitter.com',
  'x.com',
  'www.x.com',
])

function hostBlocked(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (BLOCKED_HOSTS.has(h)) return true
  for (const b of BLOCKED_HOSTS) {
    if (h.endsWith(`.${b}`) || h === b) return true
  }
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h)
  if (ipv4) {
    const a = Number(ipv4[1])
    const b = Number(ipv4[2])
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
  }
  if (h === 'localhost' || h.endsWith('.local')) return true
  return false
}

export type VideoFetchResult =
  | { ok: true; buffer: Buffer; filename: string }
  | { ok: false; message: string }

/**
 * Descarga un vÃ­deo por URL directa (p. ej. .mp4 en CDN). No soporta YouTube ni redes que requieran login.
 */
export async function fetchVideoFromUrl(videoUrl: string): Promise<VideoFetchResult> {
  let url: URL
  try {
    url = new URL(videoUrl.trim())
  } catch {
    return { ok: false, message: 'URL no vÃ¡lida.' }
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { ok: false, message: 'Solo se permiten URLs http(s).' }
  }

  if (hostBlocked(url.hostname)) {
    return {
      ok: false,
      message:
        'Esa plataforma no permite descarga directa desde aquÃ­. Sube el archivo MP4 o usa un enlace directo a un .mp4 (CDN, almacenamiento propio, etc.).',
    }
  }

  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 120_000)

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { Accept: 'video/*, application/octet-stream, */*' },
    })

    if (!res.ok) {
      return { ok: false, message: `No se pudo descargar el vÃ­deo (HTTP ${res.status}).` }
    }

    const len = res.headers.get('content-length')
    if (len) {
      const n = parseInt(len, 10)
      if (!Number.isFinite(n) || n > MAX_BYTES) {
        return {
          ok: false,
          message: `El archivo supera el mÃ¡ximo de ${VIDEO_UPLOAD_MAX_MB} MB (lÃ­mite de transcripciÃ³n).`,
        }
      }
    }

    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > MAX_BYTES) {
      return {
        ok: false,
        message: `El archivo supera el mÃ¡ximo de ${VIDEO_UPLOAD_MAX_MB} MB (lÃ­mite de transcripciÃ³n).`,
      }
    }

    if (buf.length < 512) {
      return { ok: false, message: 'El archivo descargado es demasiado pequeÃ±o o vacÃ­o.' }
    }

    const path = url.pathname.toLowerCase()
    const ct = (res.headers.get('content-type') || '').toLowerCase()
    const looksVideo =
      ct.startsWith('video/') ||
      path.endsWith('.mp4') ||
      path.endsWith('.webm') ||
      path.endsWith('.mov') ||
      path.endsWith('.m4v')

    if (!looksVideo && !ct.includes('octet-stream')) {
      return {
        ok: false,
        message: 'La URL no parece un vÃ­deo (content-type o extensiÃ³n). Usa un enlace directo a .mp4 / video/*.',
      }
    }

    const base = path.split('/').pop() || 'video'
    const filename = base.includes('.') ? base.slice(0, 80) : `${base.slice(0, 40)}.mp4`

    return { ok: true, buffer: buf, filename }
  } catch (e) {
    const msg = e instanceof Error && e.name === 'AbortError' ? 'Tiempo de espera agotado al descargar.' : 'Error al descargar la URL.'
    return { ok: false, message: msg }
  } finally {
    clearTimeout(t)
  }
}
