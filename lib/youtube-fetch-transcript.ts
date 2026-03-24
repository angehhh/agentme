import {
  YoutubeTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
} from 'youtube-transcript'
import type { TranscriptResponse } from 'youtube-transcript'

export type YoutubeTranscriptFetchResult =
  | { ok: true; segments: TranscriptResponse[]; videoId: string }
  | { ok: false; code: string; message: string }

export async function fetchYoutubeTranscript(
  videoId: string,
  lang?: string,
): Promise<YoutubeTranscriptFetchResult> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId, {
      ...(lang?.trim() ? { lang: lang.trim() } : {}),
    })
    if (!segments?.length) {
      return { ok: false, code: 'empty', message: 'No hay líneas de transcripción.' }
    }
    return { ok: true, segments, videoId }
  } catch (e: unknown) {
    if (e instanceof YoutubeTranscriptVideoUnavailableError) {
      return { ok: false, code: 'unavailable', message: 'El vídeo no está disponible o el ID no es válido.' }
    }
    if (e instanceof YoutubeTranscriptDisabledError) {
      return {
        ok: false,
        code: 'disabled',
        message: 'Este vídeo tiene subtítulos/transcripción desactivados en YouTube.',
      }
    }
    if (e instanceof YoutubeTranscriptNotAvailableError) {
      return {
        ok: false,
        code: 'no_captions',
        message: 'No hay subtítulos públicos para este vídeo. Prueba otro vídeo o uno con subtítulos automáticos activados.',
      }
    }
    if (e instanceof YoutubeTranscriptNotAvailableLanguageError) {
      return {
        ok: false,
        code: 'lang',
        message: 'No hay transcripción en ese idioma. Prueba sin idioma o con otro código (ej. en, es).',
      }
    }
    if (e instanceof YoutubeTranscriptTooManyRequestError) {
      return {
        ok: false,
        code: 'rate_limit',
        message: 'YouTube está limitando peticiones desde este servidor. Intenta más tarde.',
      }
    }
    console.error('[youtube-fetch-transcript]', e)
    return { ok: false, code: 'unknown', message: 'No se pudo obtener la transcripción de YouTube.' }
  }
}
