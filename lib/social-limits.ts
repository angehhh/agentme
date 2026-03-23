/**
 * Límites y ventanas de tiempo del Social Mode (calendario + Hook Lab).
 * Free: poca frecuencia y salidas “preview”.
 * Pro (y no-free): en las rutas API no se aplica tope diario — solo Free cuenta misiones por semana/día según modo.
 */

export type SocialPlanTier = 'free' | 'pro'

export function tierFromPlan(plan: string | null | undefined): SocialPlanTier {
  if (!plan || plan === 'free') return 'free'
  return 'pro'
}

export function utcStartOfTodayIso(): string {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)).toISOString()
}

/** Lunes 00:00:00.000 UTC de la semana ISO actual. */
export function utcStartOfIsoWeekIso(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  const day = d.getUTCDate()
  const wd = d.getUTCDay()
  const daysFromMonday = wd === 0 ? 6 : wd - 1
  return new Date(Date.UTC(y, m, day - daysFromMonday, 0, 0, 0, 0)).toISOString()
}

export const SOCIAL_LIMITS = {
  /** Calendario editorial: misiones mode = social */
  editorial: {
    freePerWeek: 1,
    proPerDay: 40,
  },
  /** Hook Lab: misiones mode = social_hook */
  hookLab: {
    freePerWeek: 2,
    proPerDay: 80,
  },
  /** Vídeo → contenido (transcripción + IA): misiones mode = social_video */
  videoContent: {
    freePerWeek: 1,
    proPerDay: 15,
  },
  /** YouTube → clips verticales 9:16 (guía por subtítulos + IA): mode = social_youtube_clips */
  youtubeClips: {
    freePerWeek: 2,
    proPerDay: 20,
  },
  /** YouTube → descarga + recorte real MP4 9:16 + ZIP: mode = social_youtube_render (pesado; servidor propio) */
  youtubeRender: {
    freePerWeek: 1,
    proPerDay: 5,
  },
} as const

/** Tamaño máximo de vídeo subido o descargado por URL (Whisper ~25 MB). */
export const VIDEO_UPLOAD_MAX_MB = 24

/** Días de calendario generados por tier */
export const EDITORIAL_DAYS = { free: 3, pro: 7 } as const

/** Hook Lab: ganchos y ángulos por tier */
export const HOOK_LAB_COUNTS = {
  free: { hooks: 5, angles: 1 },
  pro: { hooks: 12, angles: 5 },
} as const
