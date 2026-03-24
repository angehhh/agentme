/**
 * Transcripción de audio/vídeo vía OpenAI Whisper (requiere OPENAI_API_KEY).
 * Formatos típicos: mp4, mp3, webm, m4a, wav (límite ~25 MB en la API).
 */

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions'

export type TranscribeResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'missing_api_key' | 'http_error' | 'empty' }

export async function transcribeAudioBuffer(params: {
  buffer: Buffer
  filename: string
  /** ISO 639-1 opcional, ej. es */
  language?: string
}): Promise<TranscribeResult> {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) return { ok: false, reason: 'missing_api_key' }

  const { buffer, filename, language } = params
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_') || 'audio.mp4'

  const form = new FormData()
  /** Copia para satisfacer tipos BlobPart (ArrayBuffer) en TS estricto */
  const bytes = Uint8Array.from(buffer)
  form.append('file', new Blob([bytes]), safeName)
  form.append('model', 'whisper-1')
  if (language?.trim()) {
    form.append('language', language.trim().slice(0, 5))
  }

  const res = await fetch(WHISPER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error('[transcribe-openai]', res.status, errText.slice(0, 500))
    return { ok: false, reason: 'http_error' }
  }

  const data = (await res.json()) as { text?: string }
  const text = typeof data.text === 'string' ? data.text.trim() : ''
  if (!text) return { ok: false, reason: 'empty' }
  return { ok: true, text }
}
