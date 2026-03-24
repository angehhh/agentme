import type { TranscriptResponse } from 'youtube-transcript'

/**
 * YouTube puede devolver tiempos en ms (srv3) o en segundos (formato clÃ¡sico).
 * HeurÃ­stica: duraciones grandes en enteros â†’ milisegundos.
 */
export function cueToSeconds(item: TranscriptResponse): { startSec: number; endSec: number } {
  const { offset, duration } = item
  if (!Number.isFinite(offset) || !Number.isFinite(duration)) {
    return { startSec: 0, endSec: 0 }
  }

  if (!Number.isInteger(offset) || !Number.isInteger(duration)) {
    return { startSec: offset, endSec: offset + duration }
  }

  /** Enteros: InnerTube suele usar ms (p. ej. duraciÃ³n 3200 = 3,2 s). Enteros &lt; 200 suelen ser segundos. */
  if (duration >= 200) {
    return { startSec: offset / 1000, endSec: (offset + duration) / 1000 }
  }

  if (offset > 50_000) {
    return { startSec: offset / 1000, endSec: (offset + duration) / 1000 }
  }

  return { startSec: offset, endSec: offset + duration }
}

/** LÃ­nea de tiempo legible para el modelo (segundos con 1 decimal) */
export function transcriptToTimedLines(segments: TranscriptResponse[], maxLines = 900): string {
  const lines: string[] = []
  for (const seg of segments) {
    const { startSec, endSec } = cueToSeconds(seg)
    const t = seg.text.replace(/\s+/g, ' ').trim()
    if (!t) continue
    lines.push(`[${startSec.toFixed(1)}sâ€“${endSec.toFixed(1)}s] ${t}`)
    if (lines.length >= maxLines) {
      lines.push('â€¦ (transcripciÃ³n truncada por longitud)')
      break
    }
  }
  return lines.join('\n')
}

export function totalDurationSec(segments: TranscriptResponse[]): number {
  if (!segments.length) return 0
  const last = segments[segments.length - 1]!
  const { endSec } = cueToSeconds(last)
  return Math.max(endSec, 0)
}
