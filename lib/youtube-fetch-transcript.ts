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
      return { ok: false, code: 'empty', message: 'No hay lÃ­neas de transcripciÃ³n.' }
    }
    return { ok: true, segments, videoId }
  } catch (e: unknown) {
    if (e instanceof YoutubeTranscriptVideoUnavailableError) {
      return { ok: false, code: 'unavailable', message: 'El vÃ­deo no estÃ¡ disponible o el ID no es vÃ¡lido.' }
    }
    if (e instanceof YoutubeTranscriptDisabledError) {
      return {
        ok: false,
        code: 'disabled',
        message: 'Este vÃ­deo tiene subtÃ­tulos/transcripciÃ³n desactivados en YouTube.',
      }
    }
    if (e instanceof YoutubeTranscriptNotAvailableError) {
      return {
        ok: false,
        code: 'no_captions',
        message: 'No hay subtÃ­tulos pÃºblicos para este vÃ­deo. Prueba otro vÃ­deo o uno con subtÃ­tulos automÃ¡ticos activados.',
      }
    }
    if (e instanceof YoutubeTranscriptNotAvailableLanguageError) {
      return {
        ok: false,
        code: 'lang',
        message: 'No hay transcripciÃ³n en ese idioma. Prueba sin idioma o con otro cÃ³digo (ej. en, es).',
      }
    }
    if (e instanceof YoutubeTranscriptTooManyRequestError) {
      return {
        ok: false,
        code: 'rate_limit',
        message: 'YouTube estÃ¡ limitando peticiones desde este servidor. Intenta mÃ¡s tarde.',
      }
    }
    console.error('[youtube-fetch-transcript]', e)
    return { ok: false, code: 'unknown', message: 'No se pudo obtener la transcripciÃ³n de YouTube.' }
  }
}
