'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { EditorialCalendarResult, EditorialFormat, EditorialPost, HookLabResult } from '@/lib/social-claude'
import type { YoutubeVerticalClip } from '@/lib/youtube-clips-claude'
import { extractYoutubeVideoId, youtubeEmbedClipUrl, youtubeWatchUrl } from '@/lib/youtube-video-id'
import type { SocialPlanTier } from '@/lib/social-limits'
import { EDITORIAL_DAYS, HOOK_LAB_COUNTS, SOCIAL_LIMITS } from '@/lib/social-limits'
import { YOUTUBE_RENDER_TTL_DAYS, youtubeThumbUrl } from '@/lib/youtube-render-projects'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CirclePlay,
  Clapperboard,
  Clock,
  Clipboard,
  Download,
  ExternalLink,
  LayoutGrid,
  Info,
  Layers,
  List,
  Music,
  Paperclip,
  Smartphone,
  Sparkles,
  Video,
  Zap,
} from 'lucide-react'

/** Pantalla inicial vs herramienta concreta (ampliable con mÃ¡s ids) */
type SocialSection = 'hub' | 'editorial' | 'hooklab' | 'ytclips'

const T = {
  ink: '#0C0C0C', ink60: '#606060', ink40: '#909090', ink20: '#D8D8D8', ink10: '#E8E8E8',
  paper: '#F5F4F1', white: '#FFFFFF', green: '#28C840',
  coral: '#E85D4C', violet: '#7B68EE', blue: '#2563EB',
  serif: "'Playfair Display', Georgia, serif",
  sans: "'DM Sans', 'Helvetica Neue', sans-serif",
}

const FORMAT_LABEL: Record<EditorialFormat, string> = {
  carrusel: 'Carrusel',
  reel: 'Reel',
  hilo: 'Hilo',
}

const FORMAT_COLOR: Record<EditorialFormat, string> = {
  carrusel: T.violet,
  reel: T.coral,
  hilo: T.blue,
}

/** Fondo tipo â€œsquircleâ€ gris claro (referencia UI minimal) */
const ICON_TILE_BG = '#E6E6E4'
const STROKE = 1.75

const FORMAT_ICON: Record<EditorialFormat, LucideIcon> = {
  carrusel: LayoutGrid,
  reel: Clapperboard,
  hilo: List,
}

/** Iconos Lucide outline para Social Mode */
const Ico = {
  calendar: Calendar,
  clipboard: Clipboard,
  check: Check,
  paperclip: Paperclip,
  camera: Video,
  zap: Zap,
  music: Music,
  mobile: Smartphone,
} as const satisfies Record<string, LucideIcon>

function IconTile({
  icon: Icon,
  box = 44,
  size = 22,
  background = ICON_TILE_BG,
  iconColor = T.ink,
}: {
  icon: LucideIcon
  box?: number
  size?: number
  background?: string
  iconColor?: string
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: box,
        height: box,
        borderRadius: 14,
        background,
        flexShrink: 0,
      }}
    >
      <Icon size={size} strokeWidth={STROKE} color={iconColor} aria-hidden />
    </span>
  )
}

function StrokeIcon({ icon: Icon, size = 18, color = T.ink }: { icon: LucideIcon; size?: number; color?: string }) {
  return <Icon size={size} strokeWidth={STROKE} color={color} aria-hidden style={{ flexShrink: 0 }} />
}

const SHADOW = {
  card: '0 1px 2px rgba(12,12,12,.04), 0 8px 24px rgba(12,12,12,.07)',
  soft: '0 4px 20px rgba(12,12,12,.06)',
}

function splitHashtagTokens(s: string): string[] {
  return s.split(/\s+/).map(t => t.trim()).filter(Boolean)
}

function SectionLabel({ children, color, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: '.12em',
      textTransform: 'uppercase', color: color ?? T.ink40, marginBottom: 8, fontFamily: T.sans,
      ...style,
    }}>
      {children}
    </span>
  )
}

/** Asegura forma completa (p. ej. datos antiguos en sessionStorage) */
/** Proyecto de render guardado en Supabase (lista / tarjetas) */
type YtCloudRenderProject = {
  id: string
  title: string
  kind: 'mp4' | 'zip'
  filename: string
  /** Ãndice del clip en el plan IA (solo MP4); alinea plan â†” archivo */
  clip_index?: number | null
  created_at?: string
  duration_sec: number | null
  expires_at: string
  expires_label: string
  thumbnail_url: string
  download_url: string | null
}

/** clip_index en API/JSON a veces viene como string; null = sin Ã­ndice (huÃ©rfano). */
function parseClipIndex(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number' && Number.isFinite(v)) return Math.floor(v)
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return Math.floor(n)
  }
  return null
}

/**
 * Alinea MP4s con cada fila del plan: primero por clip_index, luego huecos con archivos sin Ã­ndice (orden created_at).
 * Evita quedarse en 10/12 por `clip_index ===` fallando entre nÃºmero y string.
 */
function assignMp4sToPlanSlots(
  planClips: Array<Record<string, unknown>>,
  assets: YtCloudRenderProject[],
): (YtCloudRenderProject | undefined)[] {
  const rawMp4s = assets.filter(a => a.kind === 'mp4' && a.download_url)
  const indexed = new Map<number, YtCloudRenderProject>()
  const orphans: YtCloudRenderProject[] = []
  for (const a of rawMp4s) {
    const pi = parseClipIndex(a.clip_index)
    if (pi !== null && pi >= 0) {
      if (!indexed.has(pi)) indexed.set(pi, a)
    } else {
      orphans.push(a)
    }
  }
  orphans.sort((a, b) => String(a.created_at ?? a.id).localeCompare(String(b.created_at ?? b.id)))
  let oi = 0
  const out: (YtCloudRenderProject | undefined)[] = []
  for (let i = 0; i < planClips.length; i++) {
    const row = planClips[i]
    const idx = parseClipIndex(row?.clip_index) ?? i
    const hit = indexed.get(idx)
    if (hit) {
      out.push(hit)
      continue
    }
    out.push(orphans[oi++] ?? undefined)
  }
  return out
}

function formatYtDurationBadge(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec) || sec <= 0) return 'â€”'
  const m = Math.floor(sec / 60)
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`
  if (m >= 1) return `${m}'`
  return `${Math.round(sec)}s`
}

function buildClipsPlanPayload(clips: YoutubeVerticalClip[]) {
  return {
    clips: clips.map((c, i) => ({
      clip_index: i,
      title: c.title,
      start_sec: c.start_sec,
      end_sec: c.end_sec,
      hook_overlay: c.hook_overlay,
      why_stops_scroll: c.why_stops_scroll,
      nine_sixteen_framing: c.nine_sixteen_framing,
      safe_zones_caption: c.safe_zones_caption,
      on_screen_text_suggestions: c.on_screen_text_suggestions,
      sound_hook: c.sound_hook,
      cta_end: c.cta_end,
      estimated_virality_1_10: c.estimated_virality_1_10,
      publish_description: c.publish_description,
      suggested_hashtags: c.suggested_hashtags,
      best_platforms: c.best_platforms,
      thumbnail_cover_idea: c.thumbnail_cover_idea,
      edit_checklist: c.edit_checklist,
      dynamic_caption_style: c.dynamic_caption_style,
    })),
  }
}

/** Barra de progreso estilo Opus Clip (anÃ¡lisis IA o render MP4 / subida) */
function OpusProgressOverlay({
  visible,
  pct,
  variant = 'render',
}: {
  visible: boolean
  pct: number
  variant?: 'render' | 'analysis'
}) {
  if (!visible) return null
  const phase =
    variant === 'analysis'
      ? pct < 22 ? 'Leyendo subtÃ­tulos del vÃ­deoâ€¦' :
        pct < 42 ? 'Analizando ritmo y picos de retenciÃ³nâ€¦' :
        pct < 62 ? 'IA eligiendo los mejores cortesâ€¦' :
        pct < 82 ? 'Redactando copy, hashtags y checklistâ€¦' :
        'Organizando el pack de shortsâ€¦'
      : pct < 28 ? 'Descargando fuenteâ€¦' :
        pct < 55 ? 'Render 9:16â€¦' :
        pct < 88 ? 'Subiendo a la nubeâ€¦' :
        'Casi listoâ€¦'
  const eta = pct >= (variant === 'analysis' ? 84 : 92) ? 'ETA ~0m' : 'â€¦'
  const outerBg =
    variant === 'analysis'
      ? 'rgba(15, 23, 42, 0.78)'
      : 'rgba(6, 32, 22, 0.72)'
  const innerBg =
    variant === 'analysis'
      ? 'rgba(15, 35, 30, 0.96)'
      : 'rgba(6, 40, 28, 0.96)'
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 4,
      background: outerBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
    }}>
      <div style={{
        width: 'min(100%, 300px)',
        borderRadius: 14,
        border: '2px solid rgba(52, 211, 153, 0.88)',
        boxShadow: '0 0 0 1px rgba(0,0,0,.25), 0 16px 48px rgba(0,0,0,.5)',
        background: innerBg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '20px 18px',
      }}>
        <Clock size={24} color="#a7f3d0" strokeWidth={1.75} aria-hidden />
        <div style={{
          width: '100%',
          maxWidth: 220,
          height: 5,
          background: 'rgba(255,255,255,.12)',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, Math.round(pct))}%`,
            background: 'linear-gradient(90deg,#047857,#34d399)',
            borderRadius: 4,
            transition: 'width .4s ease-out',
          }} />
        </div>
        <span style={{
          color: '#ecfdf5',
          fontSize: 12,
          fontWeight: 700,
          textAlign: 'center',
          fontFamily: T.sans,
          lineHeight: 1.4,
        }}>
          {Math.min(100, Math.round(pct))}% ({eta}) Â· {phase}
        </span>
      </div>
    </div>
  )
}

/** PÃ­ldora compacta estilo Opus: % + ETA (borde neÃ³n verde) */
function OpusClipProgressPill({ pct, etaLabel }: { pct: number; etaLabel: string }) {
  const p = Math.max(0, Math.min(100, Math.round(pct)))
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 18px',
        borderRadius: 999,
        background: 'rgba(22, 48, 38, 0.96)',
        border: '1.5px solid #4ade80',
        boxShadow: '0 0 14px rgba(74, 222, 128, 0.45), 0 0 28px rgba(34, 197, 94, 0.2)',
        fontFamily: T.sans,
      }}
    >
      <Clock size={20} color="#4ade80" strokeWidth={2} aria-hidden />
      <span style={{
        color: '#4ade80',
        fontSize: 15,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap',
      }}>
        {p}% <span style={{ fontWeight: 700, opacity: 0.92 }}>(ETA {etaLabel})</span>
      </span>
    </div>
  )
}

/** Overlay estilo Opus (fondo claro) encima de la rejilla de vÃ­deos 9:16 en proyecto nube */
function YtProjectVideoGridGateOverlay({
  progress,
  onBypass,
}: {
  progress: { required: number; ready: number }
  onBypass: () => void
}) {
  const pct = progress.required > 0 ? (progress.ready / progress.required) * 100 : 0
  const eta = etaLabelFromRemainingClips(progress.required - progress.ready)
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 12,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 28,
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: '0 12px 40px rgba(0,0,0,.18)',
        textAlign: 'center',
      }}
    >
      <OpusClipProgressPill pct={pct} etaLabel={eta} />
      <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.55, maxWidth: 440 }}>
        Creando los clips en la nube: <strong style={{ color: '#374151' }}>{progress.ready}</strong> de{' '}
        <strong style={{ color: '#374151' }}>{progress.required}</strong> con MP4 listo. Tiempo estimado segÃºn los que faltan.
        Actualizamos cada pocos segundos.
        {progress.ready < progress.required ? (
          <>
            {' '}
            Si el contador no sube, faltan generaciones desde el anÃ¡lisis (o hay retraso en el servidor). Puedes usar{' '}
            <strong style={{ color: '#374151' }}>Ver proyecto igualmente</strong> para ver los que ya estÃ¡n listos.
          </>
        ) : null}
      </p>
      <button
        type="button"
        onClick={onBypass}
        style={{
          padding: '10px 18px',
          borderRadius: 10,
          border: `1px solid ${T.ink10}`,
          background: T.white,
          color: T.ink,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: T.sans,
        }}
      >
        Ver proyecto igualmente
      </button>
    </div>
  )
}

function etaLabelFromRemainingClips(remaining: number, secondsPerClip = 140): string {
  if (remaining <= 0) return '0m'
  const sec = remaining * secondsPerClip
  const m = Math.max(1, Math.ceil(sec / 60))
  if (m >= 90) return `${Math.round(m / 60)}h`
  return `${m}m`
}

/** Progreso de clips MP4 en detalle de sesiÃ³n (plan IA vs assets) */
function sessionClipProgressFromDetail(detail: {
  session: { clips_plan?: unknown }
  assets: YtCloudRenderProject[]
}): { required: number; ready: number; complete: boolean } {
  const plan = detail.session.clips_plan as { clips?: Array<Record<string, unknown>> } | null
  const planClips = Array.isArray(plan?.clips) ? plan.clips : []
  const mp4s = detail.assets.filter(a => a.kind === 'mp4')
  if (planClips.length > 0) {
    const slots = assignMp4sToPlanSlots(planClips, detail.assets)
    const ready = slots.filter(s => s?.download_url).length
    return { required: planClips.length, ready, complete: ready >= planClips.length }
  }
  const withUrl = mp4s.filter(a => a.download_url).length
  const required = mp4s.length
  if (required === 0) return { required: 0, ready: 0, complete: true }
  return { required, ready: withUrl, complete: withUrl >= required }
}

/** Proyecto = un vÃ­deo YouTube con todos sus clips / ZIP en la nube */
type YtCloudSession = {
  id: string
  youtube_video_id: string
  video_title: string
  thumbnail_url: string
  expires_label: string
  expires_at: string
  ready_assets: number
  total_assets: number
  clips_plan?: unknown
}

function ensureYoutubeClipShape(c: Partial<YoutubeVerticalClip>): YoutubeVerticalClip {
  const arr = (x: unknown) => (Array.isArray(x) ? x.map(String) : [])
  return {
    start_sec: Number(c.start_sec) || 0,
    end_sec: Number(c.end_sec) || 0,
    title: String(c.title ?? ''),
    hook_overlay: String(c.hook_overlay ?? ''),
    why_stops_scroll: String(c.why_stops_scroll ?? ''),
    nine_sixteen_framing: String(c.nine_sixteen_framing ?? ''),
    safe_zones_caption: String(c.safe_zones_caption ?? ''),
    on_screen_text_suggestions: arr(c.on_screen_text_suggestions),
    sound_hook: String(c.sound_hook ?? ''),
    cta_end: String(c.cta_end ?? ''),
    estimated_virality_1_10: Math.min(10, Math.max(1, Math.round(Number(c.estimated_virality_1_10) || 5))),
    publish_description: String(c.publish_description ?? ''),
    suggested_hashtags: arr(c.suggested_hashtags),
    best_platforms: arr(c.best_platforms),
    thumbnail_cover_idea: String(c.thumbnail_cover_idea ?? ''),
    edit_checklist: arr(c.edit_checklist),
    dynamic_caption_style: String(c.dynamic_caption_style ?? ''),
  }
}

/** Copy, hashtags, checklist y metadatos del clip (modal Â«INFORMACIÃ“NÂ» Pro). */
function YoutubeClipPremiumInfoContent({ c }: { c: YoutubeVerticalClip }) {
  return (
    <>
      <p style={{ fontSize: 13, color: T.ink60, margin: '0 0 10px', lineHeight: 1.55 }}>
        <strong style={{ color: T.ink }}>Hook overlay:</strong> {c.hook_overlay}
      </p>
      <p style={{ fontSize: 13, color: T.ink60, margin: '0 0 10px', lineHeight: 1.55 }}>
        <strong style={{ color: T.ink }}>Scroll-stop:</strong> {c.why_stops_scroll}
      </p>

      {c.publish_description.trim() ? (
        <div style={{
          marginBottom: 14, padding: '14px 16px', borderRadius: 12, background: T.paper,
          border: `1px solid ${T.ink10}`,
        }}>
          <SectionLabel color={T.blue} style={{ marginBottom: 6 }}>DescripciÃ³n para publicar</SectionLabel>
          <p style={{ fontSize: 14, color: T.ink60, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {c.publish_description}
          </p>
        </div>
      ) : null}

      {(c.suggested_hashtags.length > 0 || c.best_platforms.length > 0) && (
        <div style={{ marginBottom: 14 }}>
          {c.best_platforms.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: T.ink40, letterSpacing: '.08em' }}>PLATAFORMAS</span>
              {c.best_platforms.map((p, j) => (
                <span
                  key={j}
                  style={{
                    fontSize: 11, fontWeight: 700, color: T.ink, background: T.white,
                    padding: '4px 10px', borderRadius: 100, border: `1px solid ${T.ink10}`,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}
          {c.suggested_hashtags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: T.ink40, letterSpacing: '.08em', marginRight: 4 }}>HASHTAGS</span>
              {c.suggested_hashtags.map((h, j) => (
                <span
                  key={j}
                  style={{
                    fontSize: 12, fontWeight: 600, color: T.violet, background: 'rgba(123,104,238,.08)',
                    padding: '4px 10px', borderRadius: 8,
                  }}
                >
                  {h.startsWith('#') ? h : `#${h.replace(/^#/, '')}`}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {c.thumbnail_cover_idea.trim() ? (
        <p style={{ fontSize: 13, color: T.ink60, margin: '0 0 10px', lineHeight: 1.55 }}>
          <strong style={{ color: T.ink }}>Miniatura / primer frame:</strong> {c.thumbnail_cover_idea}
        </p>
      ) : null}

      {c.dynamic_caption_style.trim() ? (
        <p style={{ fontSize: 13, color: T.ink60, margin: '0 0 10px', lineHeight: 1.55 }}>
          <strong style={{ color: T.ink }}>SubtÃ­tulos dinÃ¡micos (estilo viral):</strong> {c.dynamic_caption_style}
        </p>
      ) : null}

      <p style={{ fontSize: 13, color: T.ink60, margin: '0 0 10px', lineHeight: 1.55 }}>
        <strong style={{ color: T.ink }}>Encuadre 9:16:</strong> {c.nine_sixteen_framing}
      </p>
      <p style={{ fontSize: 13, color: T.ink60, margin: '0 0 10px', lineHeight: 1.55 }}>
        <strong style={{ color: T.ink }}>Zona captions:</strong> {c.safe_zones_caption}
      </p>
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: T.ink40, letterSpacing: '.08em' }}>TEXTO EN PANTALLA</span>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13, color: T.ink60, lineHeight: 1.5 }}>
          {c.on_screen_text_suggestions.map((t, j) => (
            <li key={j}>{t}</li>
          ))}
        </ul>
      </div>
      {c.edit_checklist.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.ink40, letterSpacing: '.08em' }}>CHECKLIST DE EDICIÃ“N</span>
          <ol style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 13, color: T.ink60, lineHeight: 1.55 }}>
            {c.edit_checklist.map((step, j) => (
              <li key={j} style={{ marginBottom: 4 }}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      <p style={{ fontSize: 13, color: T.ink60, margin: '0 0 6px', lineHeight: 1.55 }}>
        <strong style={{ color: T.ink }}>Sonido:</strong> {c.sound_hook}
      </p>
      <p style={{ fontSize: 13, color: T.ink60, margin: 0, lineHeight: 1.55 }}>
        <strong style={{ color: T.ink }}>CTA cierre:</strong> {c.cta_end}
      </p>
      <p style={{ fontSize: 11, color: T.ink40, marginTop: 10, marginBottom: 0 }}>
        Potencial estimado: <strong>{c.estimated_virality_1_10}</strong>/10
      </p>
    </>
  )
}

function postToText(p: EditorialPost): string {
  const lines = [
    `## ${p.day_label} Â· ${FORMAT_LABEL[p.format]}`,
    `**${p.title}**`,
    '',
    `Hook: ${p.hook}`,
    '',
    ...p.outline.map((x, i) => `${i + 1}. ${x}`),
    '',
    `CTA: ${p.cta}`,
    '',
    `Redes: ${p.platforms}`,
  ]
  if (p.hashtags?.trim()) {
    lines.push('', `Hashtags: ${p.hashtags.trim()}`)
  }
  if (p.production_tip?.trim()) {
    lines.push('', `ProducciÃ³n: ${p.production_tip.trim()}`)
  }
  return lines.join('\n')
}

/** Al entrar el clip en pantalla, encola la vista previa MP4 automÃ¡tica. */
function YoutubeClipAutoPreviewObserver({
  clipIndex,
  packResetKey,
  onEnterView,
}: {
  clipIndex: number
  packResetKey: string
  onEnterView: (i: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const firedRef = useRef(false)
  useEffect(() => {
    firedRef.current = false
  }, [packResetKey, clipIndex])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !firedRef.current) {
            firedRef.current = true
            onEnterView(clipIndex)
          }
        }
      },
      { root: null, rootMargin: '140px', threshold: 0.07 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [clipIndex, onEnterView, packResetKey])
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        visibility: 'hidden',
        zIndex: 0,
      }}
      aria-hidden
    />
  )
}

export default function SocialView({
  userId,
  supabase,
  planTier,
}: {
  userId: string
  supabase: SupabaseClient
  planTier: SocialPlanTier
}) {
  const isPro = planTier === 'pro'
  const calDays = EDITORIAL_DAYS[planTier]
  const hl = HOOK_LAB_COUNTS[planTier]
  const [niche, setNiche] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('profesional y cercano')
  const [mainPlatform, setMainPlatform] = useState('Instagram')
  const [language, setLanguage] = useState('espaÃ±ol')
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsErr, setSettingsErr] = useState<string | null>(null)
  const [savingPrefs, setSavingPrefs] = useState(false)

  const [calendar, setCalendar] = useState<EditorialCalendarResult | null>(null)
  const [genLoading, setGenLoading] = useState(false)
  const [genErr, setGenErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [hookTopic, setHookTopic] = useState('')
  const [hookLab, setHookLab] = useState<HookLabResult | null>(null)
  const [hookLoading, setHookLoading] = useState(false)
  const [hookErr, setHookErr] = useState<string | null>(null)
  const [hookCopied, setHookCopied] = useState(false)
  /** Feedback breve al copiar: 'week' | 'hooklab' | `post-${i}` | `hook-${i}` */
  const [copiedFlash, setCopiedFlash] = useState<string | null>(null)
  const [section, setSection] = useState<SocialSection>('hub')


  const [ytUrl, setYtUrl] = useState('')
  const [ytCaptionLang, setYtCaptionLang] = useState('')
  const [ytVideoId, setYtVideoId] = useState('')
  const [ytVideoTitle, setYtVideoTitle] = useState<string | null>(null)
  const [ytClips, setYtClips] = useState<YoutubeVerticalClip[]>([])
  const [ytTitleHint, setYtTitleHint] = useState<string | null>(null)
  const [ytLoading, setYtLoading] = useState(false)
  /** Progreso simulado estilo Opus mientras la IA analiza el vÃ­deo (youtube-clips) */
  const [ytAnalysisFakeProgress, setYtAnalysisFakeProgress] = useState(0)
  const [ytErr, setYtErr] = useState<string | null>(null)
  const [ytCopied, setYtCopied] = useState(false)
  /** Ãndice del clip que se estÃ¡ renderizando a MP4, o null */
  const [ytRenderingClipIndex, setYtRenderingClipIndex] = useState<number | null>(null)
  const [ytRenderZipLoading, setYtRenderZipLoading] = useState(false)
  const [ytRenderErr, setYtRenderErr] = useState<string | null>(null)
  const [ytSessions, setYtSessions] = useState<YtCloudSession[]>([])
  const [ytSessionsLoading, setYtSessionsLoading] = useState(false)
  /** Tras el primer fetch de la lista nube en esta vista (evita limpiar borrador antes de saber si hay proyectos). */
  const [ytSessionsFetchedOnce, setYtSessionsFetchedOnce] = useState(false)
  const [ytOpenSessionId, setYtOpenSessionId] = useState<string | null>(null)
  const [ytSessionDetail, setYtSessionDetail] = useState<{
    session: YtCloudSession
    assets: YtCloudRenderProject[]
  } | null>(null)
  const [ytSessionDetailLoading, setYtSessionDetailLoading] = useState(false)
  /** SesiÃ³n nube del vÃ­deo actual (para encadenar MP4/ZIP en el mismo proyecto) */
  const [ytRenderSessionId, setYtRenderSessionId] = useState<string | null>(null)
  const [ytRenderFakeProgress, setYtRenderFakeProgress] = useState(0)
  /** Saltar bloqueo â€œesperar todos los MP4â€ (proyecto en nube / lista de clips) */
  const [ytBypassProjectClipsGate, setYtBypassProjectClipsGate] = useState(false)
  /** URLs firmadas en Supabase (MP4 ya generados) por Ã­ndice de clip â€” vista previa sin re-render */
  const [ytCloudMp4UrlByClip, setYtCloudMp4UrlByClip] = useState<Record<number, string>>({})
  /** Object URLs del MP4 9:16 generado por Ã­ndice de clip (para <video> + descarga opcional) */
  const [ytAutomatedPreviewByClip, setYtAutomatedPreviewByClip] = useState<Record<number, string>>({})
  /** Nombre de archivo sugerido por clip, tras generar la vista previa */
  const [ytAutomatedFilenameByClip, setYtAutomatedFilenameByClip] = useState<Record<number, string>>({})
  const ytAutomatedPreviewRef = useRef<Record<number, string>>({})

  const aliveRef = useRef(true)
  const editorialAbortRef = useRef<AbortController | null>(null)
  const hookAbortRef = useRef<AbortController | null>(null)
  const ytAbortRef = useRef<AbortController | null>(null)
  const ytRenderAbortRef = useRef<AbortController | null>(null)
  const ytOpenSessionIdRef = useRef<string | null>(null)
  /** Cola de Ã­ndices de clip para generar vista previa MP4 automÃ¡ticamente (uno tras otro) */
  const ytAutoPreviewPendingRef = useRef<Set<number>>(new Set())
  const ytPreviewDrainLockRef = useRef(false)
  /** Evita encolar el clip 0 dos veces por el mismo vÃ­deo al hidratar / regenerar pack */
  const ytAutoInitialRequestedRef = useRef<string>('')
  const [ytPreviewKick, setYtPreviewKick] = useState(0)
  /** Se incrementa al terminar un pack nuevo (resetea observers de scroll) */
  const [ytClipsPackId, setYtClipsPackId] = useState(0)
  /** Modal Â«INFORMACIÃ“NÂ» (contenido premium por clip) */
  const [ytClipInfoModalIndex, setYtClipInfoModalIndex] = useState<number | null>(null)
  /** Modal Â«INFORMACIÃ“NÂ» en la rejilla del proyecto en la nube (Pro: guÃ­a completa si el plan lo trae) */
  const [ytCloudClipInfoModal, setYtCloudClipInfoModal] = useState<null | {
    clipNum: number
    title: string
    downloadUrl: string | null
    filenameHint: string
    /** Pack con plan IA guardado en sesiÃ³n: guÃ­a completa solo se muestra a Pro */
    premiumClip: YoutubeVerticalClip | null
    /** Solo MP4 sin plan en la sesiÃ³n (solo se muestra a Pro) */
    fallbackDesc?: string
    /** Rango temporal del clip (cabecera para todos si hay plan) */
    clipTiming?: { start_sec: number; end_sec: number } | null
  }>(null)
  /**
   * Origen del pack de clips en pantalla: `analysis` = Ãºltimo â€œAnalizarâ€ (persistido asÃ­ en sessionStorage);
   * `storage` = borrador antiguo sin marca; se descarta si la API dice 0 proyectos y no hay sesiÃ³n abierta.
   */
  const ytClipsSourceRef = useRef<'none' | 'analysis' | 'storage'>('none')
  /** Origen para URLs embed de YouTube (mejora carga del iframe). */
  const [ytEmbedOrigin, setYtEmbedOrigin] = useState('')

  const storageCal = `agentme_social_calendar_${userId}`
  const storageHook = `agentme_social_hooklab_${userId}`
  const storageYt = `agentme_social_ytclips_${userId}`

  ytAutomatedPreviewRef.current = ytAutomatedPreviewByClip
  ytOpenSessionIdRef.current = ytOpenSessionId

  useEffect(() => {
    return () => {
      Object.values(ytAutomatedPreviewRef.current).forEach(u => {
        try {
          URL.revokeObjectURL(u)
        } catch { /* ignore */ }
      })
    }
  }, [])

  useEffect(() => {
    setYtSessionsFetchedOnce(false)
  }, [userId])

  useEffect(() => {
    if (typeof window !== 'undefined') setYtEmbedOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    const clipOpen = ytClipInfoModalIndex !== null
    const cloudOpen = ytCloudClipInfoModal !== null
    if (!clipOpen && !cloudOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setYtClipInfoModalIndex(null)
      setYtCloudClipInfoModal(null)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [ytClipInfoModalIndex, ytCloudClipInfoModal])

  useEffect(() => {
    aliveRef.current = true
    try {
      const cal = sessionStorage.getItem(storageCal)
      if (cal) {
        const parsed = JSON.parse(cal) as EditorialCalendarResult
        if (parsed?.posts?.length) setCalendar(parsed)
      }
      const hl = sessionStorage.getItem(storageHook)
      if (hl) {
        const parsed = JSON.parse(hl) as HookLabResult
        if (parsed?.hooks?.length) setHookLab(parsed)
      }
      const ys = sessionStorage.getItem(storageYt)
      if (ys) {
        const parsed = JSON.parse(ys) as {
          videoId?: string
          videoTitle?: string | null
          clips?: YoutubeVerticalClip[]
          video_title_hint?: string
          persistSource?: 'analysis'
        }
        if (parsed?.videoId && parsed.clips?.length) {
          ytClipsSourceRef.current = parsed.persistSource === 'analysis' ? 'analysis' : 'storage'
          setYtVideoId(parsed.videoId)
          setYtVideoTitle(parsed.videoTitle ?? null)
          setYtClips(parsed.clips.map(c => ensureYoutubeClipShape(c as Partial<YoutubeVerticalClip>)))
          setYtTitleHint(parsed.video_title_hint ?? null)
        }
      }
    } catch { /* ignore */ }
    return () => {
      aliveRef.current = false
      editorialAbortRef.current?.abort()
      hookAbortRef.current?.abort()
      ytAbortRef.current?.abort()
      ytRenderAbortRef.current?.abort()
    }
  }, [userId, storageCal, storageHook, storageYt])

  const loadYtRenderSessions = useCallback(async () => {
    setYtSessionsLoading(true)
    try {
      const res = await fetch(
        `/api/social/youtube-render/sessions?userId=${encodeURIComponent(userId)}`,
      )
      const data = (await res.json()) as { sessions?: YtCloudSession[] }
      if (!aliveRef.current) return
      if (Array.isArray(data.sessions)) setYtSessions(data.sessions)
    } catch { /* ignore */ }
    finally {
      if (aliveRef.current) {
        setYtSessionsLoading(false)
        setYtSessionsFetchedOnce(true)
      }
    }
  }, [userId])

  /** Si no hay proyectos en la nube ni sesiÃ³n abierta, no mostrar un borrador viejo de sessionStorage (evita â€œ0 proyectosâ€ + clips antiguos). */
  useEffect(() => {
    if (section !== 'ytclips') return
    if (!ytSessionsFetchedOnce || ytSessionsLoading) return
    if (ytSessions.length > 0) return
    if (ytOpenSessionId) return
    if (ytClipsSourceRef.current !== 'storage') return
    if (!ytClips.length && !ytVideoId.trim()) return

    ytClipsSourceRef.current = 'none'
    setYtAutomatedPreviewByClip(prev => {
      Object.values(prev).forEach(u => {
        try {
          URL.revokeObjectURL(u)
        } catch { /* ignore */ }
      })
      return {}
    })
    setYtAutomatedFilenameByClip({})
    setYtCloudMp4UrlByClip({})
    setYtRenderSessionId(null)
    ytAutoPreviewPendingRef.current.clear()
    ytAutoInitialRequestedRef.current = ''
    ytPreviewDrainLockRef.current = false
    setYtClips([])
    setYtVideoId('')
    setYtVideoTitle(null)
    setYtTitleHint(null)
    setYtClipsPackId(x => x + 1)
    try {
      sessionStorage.removeItem(storageYt)
    } catch { /* ignore */ }
  }, [
    section,
    ytSessionsFetchedOnce,
    ytSessionsLoading,
    ytSessions.length,
    ytOpenSessionId,
    ytClips.length,
    ytVideoId,
    storageYt,
  ])

  /** Rellena vista previa desde proyectos en la nube del mismo YouTube (si ya hay MP4 guardados). */
  const hydrateYtCloudClipPreviews = useCallback(async () => {
    if (!ytVideoId.trim()) return
    try {
      const res = await fetch(
        `/api/social/youtube-render/sessions?userId=${encodeURIComponent(userId)}`,
      )
      const data = (await res.json()) as { sessions?: YtCloudSession[] }
      if (!aliveRef.current) return
      const sessions = Array.isArray(data.sessions) ? data.sessions : []
      const match = sessions.find(s => s.youtube_video_id === ytVideoId)
      if (!match) {
        setYtCloudMp4UrlByClip({})
        return
      }
      setYtRenderSessionId(prev => prev ?? match.id)
      const dRes = await fetch(
        `/api/social/youtube-render/sessions/${encodeURIComponent(match.id)}?userId=${encodeURIComponent(userId)}`,
      )
      const detail = (await dRes.json()) as {
        success?: boolean
        assets?: YtCloudRenderProject[]
      }
      if (!aliveRef.current) return
      if (!detail.success || !Array.isArray(detail.assets)) return
      const next: Record<number, string> = {}
      for (const a of detail.assets) {
        if (a.kind !== 'mp4' || !a.download_url) continue
        const idx = parseClipIndex(a.clip_index)
        if (idx === null || idx < 0) continue
        if (next[idx] == null) next[idx] = a.download_url
      }
      setYtCloudMp4UrlByClip(next)
    } catch {
      if (aliveRef.current) setYtCloudMp4UrlByClip({})
    }
  }, [userId, ytVideoId])

  const loadYtSessionDetail = useCallback(
    async (sessionId: string) => {
      setYtOpenSessionId(sessionId)
      setYtSessionDetailLoading(true)
      setYtSessionDetail(null)
      try {
        const res = await fetch(
          `/api/social/youtube-render/sessions/${encodeURIComponent(sessionId)}?userId=${encodeURIComponent(userId)}`,
        )
        const data = (await res.json()) as {
          success?: boolean
          session?: YtCloudSession
          assets?: YtCloudRenderProject[]
        }
        if (!aliveRef.current) return
        if (data.success && data.session && Array.isArray(data.assets)) {
          setYtSessionDetail({ session: data.session, assets: data.assets })
        }
      } catch { /* ignore */ }
      finally {
        if (aliveRef.current) setYtSessionDetailLoading(false)
      }
    },
    [userId],
  )

  useEffect(() => {
    if (section === 'ytclips') void loadYtRenderSessions()
  }, [section, loadYtRenderSessions])

  useEffect(() => {
    if (section !== 'ytclips' || !ytVideoId || !ytClips.length) return
    void hydrateYtCloudClipPreviews()
  }, [section, ytVideoId, ytClips.length, ytClipsPackId, hydrateYtCloudClipPreviews])

  useEffect(() => {
    const busy = ytRenderingClipIndex !== null || ytRenderZipLoading
    if (!busy) {
      setYtRenderFakeProgress(0)
      return
    }
    const t0 = Date.now()
    const id = setInterval(() => {
      const elapsed = Date.now() - t0
      setYtRenderFakeProgress(Math.min(91, (elapsed / 200000) * 91))
    }, 600)
    return () => clearInterval(id)
  }, [ytRenderingClipIndex, ytRenderZipLoading])

  useEffect(() => {
    if (!ytLoading) {
      setYtAnalysisFakeProgress(0)
      return
    }
    const t0 = Date.now()
    const id = setInterval(() => {
      const elapsed = Date.now() - t0
      setYtAnalysisFakeProgress(Math.min(88, (elapsed / 100000) * 88))
    }, 450)
    return () => clearInterval(id)
  }, [ytLoading])

  const flashCopy = (id: string) => {
    setCopiedFlash(id)
    setTimeout(() => setCopiedFlash(null), 2000)
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 9,
    border: `1.5px solid ${T.ink10}`,
    fontSize: 14,
    fontFamily: T.sans,
    color: T.ink,
    outline: 'none',
    background: T.paper,
  }

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true)
    setSettingsErr(null)
    const { data, error } = await supabase
      .from('social_settings')
      .select('niche, audience, tone, main_platform')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      if (error.message.includes('relation') || error.code === '42P01') {
        setSettingsErr('Ejecuta en Supabase: supabase/create_social_mode.sql')
      } else {
        setSettingsErr(error.message)
      }
      setSettingsLoading(false)
      return
    }
    if (data) {
      setNiche(data.niche ?? '')
      setAudience(data.audience ?? '')
      setTone(data.tone ?? 'profesional y cercano')
      setMainPlatform(data.main_platform ?? 'Instagram')
      setHookTopic(ht => (ht.trim() ? ht : (data.niche ?? '')))
    }
    setSettingsLoading(false)
  }, [supabase, userId])

  useEffect(() => { loadSettings() }, [loadSettings])

  const savePreferences = async () => {
    setSavingPrefs(true)
    setSettingsErr(null)
    const { error } = await supabase.from('social_settings').upsert(
      {
        user_id: userId,
        niche: niche.trim(),
        audience: audience.trim(),
        tone: tone.trim() || 'profesional y cercano',
        main_platform: mainPlatform.trim() || 'Instagram',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    setSavingPrefs(false)
    if (error) {
      setSettingsErr(
        error.message.includes('relation') || error.code === '42P01'
          ? 'Falta create_social_mode.sql en Supabase.'
          : error.message,
      )
      return
    }
  }

  const generate = async () => {
    if (!niche.trim()) return
    editorialAbortRef.current?.abort()
    editorialAbortRef.current = new AbortController()
    const signal = editorialAbortRef.current.signal

    setGenLoading(true)
    setGenErr(null)
    setCalendar(null)
    try {
      sessionStorage.removeItem(storageCal)
    } catch { /* ignore */ }

    try {
      const res = await fetch('/api/social/editorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          userId,
          niche: niche.trim(),
          audience: audience.trim() || undefined,
          tone: tone.trim() || undefined,
          mainPlatform: mainPlatform.trim() || undefined,
          language: language.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!aliveRef.current) return
      setGenLoading(false)
      if (!res.ok) {
        if (data.error === 'limit_reached') {
          setGenErr(typeof data.message === 'string' ? data.message : 'LÃ­mite diario alcanzado.')
        } else {
          setGenErr(typeof data.message === 'string' ? data.message : 'No se pudo generar.')
        }
        return
      }
      if (data.calendar) {
        const cal = data.calendar as EditorialCalendarResult
        setCalendar(cal)
        try {
          sessionStorage.setItem(storageCal, JSON.stringify(cal))
        } catch { /* ignore */ }
      }
    } catch (e: unknown) {
      if (!aliveRef.current) return
      setGenLoading(false)
      if (e instanceof Error && e.name === 'AbortError') return
      setGenErr('Error de conexiÃ³n.')
    }
  }

  const copyWeek = async () => {
    if (!calendar) return
    const text = [
      `# Calendario editorial â€” ${calendar.week_theme}`,
      '',
      ...calendar.posts.map(postToText),
    ].join('\n\n---\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      flashCopy('week')
      setTimeout(() => setCopied(false), 2500)
    } catch { /* ignore */ }
  }

  const copyOne = async (p: EditorialPost, idx: number) => {
    try {
      await navigator.clipboard.writeText(postToText(p))
      flashCopy(`post-${idx}`)
    } catch { /* ignore */ }
  }

  const copySingleHook = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text)
      flashCopy(`hook-${idx}`)
    } catch { /* ignore */ }
  }

  const generateHookLab = async () => {
    if (!hookTopic.trim()) return
    hookAbortRef.current?.abort()
    hookAbortRef.current = new AbortController()
    const signal = hookAbortRef.current.signal

    setHookLoading(true)
    setHookErr(null)
    setHookLab(null)
    try {
      sessionStorage.removeItem(storageHook)
    } catch { /* ignore */ }

    try {
      const res = await fetch('/api/social/hook-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          userId,
          topic: hookTopic.trim(),
          audience: audience.trim() || undefined,
          tone: tone.trim() || undefined,
          language: language.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!aliveRef.current) return
      setHookLoading(false)
      if (!res.ok) {
        if (data.error === 'limit_reached') {
          setHookErr(typeof data.message === 'string' ? data.message : 'LÃ­mite diario alcanzado.')
        } else {
          setHookErr(typeof data.message === 'string' ? data.message : 'No se pudo generar Hook Lab.')
        }
        return
      }
      if (data.hookLab) {
        const lab = data.hookLab as HookLabResult
        setHookLab(lab)
        try {
          sessionStorage.setItem(storageHook, JSON.stringify(lab))
        } catch { /* ignore */ }
      }
    } catch (e: unknown) {
      if (!aliveRef.current) return
      setHookLoading(false)
      if (e instanceof Error && e.name === 'AbortError') return
      setHookErr('Error de conexiÃ³n.')
    }
  }

  const copyHookLabAll = async () => {
    if (!hookLab) return
    const lines: string[] = [
      `# Hook Lab â€” ${hookLab.topic}`,
      '',
      `## ${hookLab.hooks.length} ganchos`,
      ...hookLab.hooks.map((h, i) => `${i + 1}. ${h}`),
      '',
      `## ${hookLab.angles.length} Ã¡ngulo(s)`,
      ...hookLab.angles.map((a, i) => `### ${i + 1}. ${a.title}\n${a.pitch}`),
    ]
    if (hookLab.sound_mood?.trim()) {
      lines.push(
        '',
        '## Audio sugerido (solo guÃ­a de estilo, sin archivo de audio)',
        hookLab.sound_mood.trim(),
      )
    }
    if (hookLab.on_screen_texts?.length) {
      lines.push('', '## Textos en pantalla', ...hookLab.on_screen_texts.map((t, i) => `${i + 1}. ${t}`))
    }
    const text = lines.join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setHookCopied(true)
      flashCopy('hooklab')
      setTimeout(() => setHookCopied(false), 2500)
    } catch { /* ignore */ }
  }

  function formatMmSs(sec: number): string {
    const s = Math.max(0, Math.floor(sec))
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${m}:${r.toString().padStart(2, '0')}`
  }

  function clipsToText(
    videoId: string,
    title: string | null,
    clips: YoutubeVerticalClip[],
  ): string {
    const header = title || 'YouTube â€” clips 9:16'
    const lines = [
      `# ${header}`,
      `Video: https://www.youtube.com/watch?v=${videoId}`,
      '',
    ]
    clips.forEach((c, i) => {
      lines.push(
        `## Clip ${i + 1} Â· ${formatMmSs(c.start_sec)} â€“ ${formatMmSs(c.end_sec)}`,
        `**${c.title}**`,
        `Enlace: ${youtubeWatchUrl(videoId, c.start_sec)}`,
        '',
        `Hook overlay: ${c.hook_overlay}`,
        `Por quÃ© frena el scroll: ${c.why_stops_scroll}`,
        `Encuadre 9:16: ${c.nine_sixteen_framing}`,
        `Zonas seguras captions: ${c.safe_zones_caption}`,
        `Textos en pantalla: ${c.on_screen_text_suggestions.join(' | ')}`,
        `Sonido: ${c.sound_hook}`,
        `CTA final: ${c.cta_end}`,
        `Potencial (1-10): ${c.estimated_virality_1_10}`,
        '',
        `DescripciÃ³n para publicar:`,
        c.publish_description || 'â€”',
        '',
        `Hashtags: ${c.suggested_hashtags.length ? c.suggested_hashtags.join(' ') : 'â€”'}`,
        `Plataformas recomendadas: ${c.best_platforms.length ? c.best_platforms.join(', ') : 'â€”'}`,
        `Idea miniatura/cover: ${c.thumbnail_cover_idea || 'â€”'}`,
        `Estilo captions dinÃ¡micos: ${c.dynamic_caption_style || 'â€”'}`,
        '',
        `Checklist ediciÃ³n:`,
        ...(c.edit_checklist.length ? c.edit_checklist.map((x, j) => `${j + 1}. ${x}`) : ['â€”']),
        '',
      )
    })
    return lines.join('\n')
  }

  const runYoutubeClips = async () => {
    if (!ytUrl.trim()) return
    ytAbortRef.current?.abort()
    ytAbortRef.current = new AbortController()
    const signal = ytAbortRef.current.signal

    setYtLoading(true)
    setYtErr(null)
    ytClipsSourceRef.current = 'none'
    setYtAutomatedPreviewByClip(prev => {
      Object.values(prev).forEach(u => {
        try {
          URL.revokeObjectURL(u)
        } catch { /* ignore */ }
      })
      return {}
    })
    setYtAutomatedFilenameByClip({})
    setYtCloudMp4UrlByClip({})
    setYtRenderSessionId(null)
    ytAutoPreviewPendingRef.current.clear()
    ytAutoInitialRequestedRef.current = ''
    ytPreviewDrainLockRef.current = false
    setYtClips([])
    setYtVideoId('')
    setYtVideoTitle(null)
    setYtTitleHint(null)
    try {
      sessionStorage.removeItem(storageYt)
    } catch { /* ignore */ }

    try {
      const res = await fetch('/api/social/youtube-clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          userId,
          youtubeUrl: ytUrl.trim(),
          captionLang: ytCaptionLang.trim() || undefined,
          language: language.trim() || 'espaÃ±ol',
        }),
      })
      const data = await res.json()
      if (!aliveRef.current) return
      setYtLoading(false)
      if (!res.ok) {
        setYtErr(typeof data.message === 'string' ? data.message : 'No se pudieron generar los clips.')
        return
      }
      const clips = data.clips as YoutubeVerticalClip[] | undefined
      const vid = typeof data.videoId === 'string' ? data.videoId : ''
      if (clips?.length && vid) {
        setYtClips(clips.map(c => ensureYoutubeClipShape(c as Partial<YoutubeVerticalClip>)))
        setYtVideoId(vid)
        setYtVideoTitle(typeof data.videoTitle === 'string' ? data.videoTitle : null)
        setYtTitleHint(typeof data.video_title_hint === 'string' ? data.video_title_hint : null)
        try {
          sessionStorage.setItem(
            storageYt,
            JSON.stringify({
              videoId: vid,
              videoTitle: data.videoTitle ?? null,
              clips,
              video_title_hint: data.video_title_hint,
              persistSource: 'analysis' as const,
            }),
          )
        } catch { /* ignore */ }
        ytClipsSourceRef.current = 'analysis'
        setYtClipsPackId(x => x + 1)
      }
    } catch (e: unknown) {
      if (!aliveRef.current) return
      setYtLoading(false)
      if (e instanceof Error && e.name === 'AbortError') return
      setYtErr('Error de conexiÃ³n.')
    }
  }

  const requestAutoPreviewClip = useCallback((clipIndex: number) => {
    ytAutoPreviewPendingRef.current.add(clipIndex)
    setYtPreviewKick(k => k + 1)
  }, [])

  const copyYtClipsAll = async () => {
    if (!ytVideoId || !ytClips.length) return
    try {
      await navigator.clipboard.writeText(clipsToText(ytVideoId, ytVideoTitle, ytClips))
      setYtCopied(true)
      flashCopy('ytclips')
      setTimeout(() => setYtCopied(false), 2500)
    } catch { /* ignore */ }
  }

  /**
   * Genera el MP4 9:16, lo guarda en la nube (sesiÃ³n) y muestra vista previa local.
   * Si `alsoDownload`, dispara la descarga del archivo al terminar (un solo paso para el usuario).
   */
  const generateYoutubeRenderClipPreview = async (
    clipIndex: number,
    opts?: { alsoDownload?: boolean },
  ) => {
    if (!ytUrl.trim() || !ytVideoId || !ytClips.length) return
    const c = ytClips[clipIndex]
    if (!c) return
    ytRenderAbortRef.current?.abort()
    ytRenderAbortRef.current = new AbortController()
    const signal = ytRenderAbortRef.current.signal
    setYtRenderErr(null)
    setYtRenderingClipIndex(clipIndex)
    try {
      const res = await fetch('/api/social/youtube-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          userId,
          youtubeUrl: ytUrl.trim(),
          output: 'mp4',
          store: true,
          clipIndex,
          sessionId: ytRenderSessionId ?? undefined,
          videoTitle: ytVideoTitle || ytTitleHint || undefined,
          clipsPlan: buildClipsPlanPayload(ytClips),
          clips: [
            {
              start_sec: c.start_sec,
              end_sec: c.end_sec,
              title: c.title,
            },
          ],
        }),
      })
      const ct = res.headers.get('content-type') || ''
      if (!aliveRef.current) return
      if (ct.includes('application/json')) {
        const data = (await res.json()) as {
          success?: boolean
          project?: { download_url?: string; filename?: string }
          session?: { id?: string }
          message?: string
        }
        if (!res.ok || !data.success) {
          setYtRenderErr(
            typeof data.message === 'string'
              ? data.message
              : `No se pudo generar el vÃ­deo del clip ${clipIndex + 1}.`,
          )
          return
        }
        if (data.project?.download_url) {
          const fname =
            typeof data.project.filename === 'string' && data.project.filename.trim()
              ? data.project.filename.trim()
              : `clip-${clipIndex + 1}-9-16-${ytVideoId}.mp4`
          const vidRes = await fetch(data.project.download_url, { signal })
          if (!vidRes.ok) {
            setYtRenderErr('No se pudo cargar el MP4 para la vista previa.')
            return
          }
          const blob = await vidRes.blob()
          const objectUrl = URL.createObjectURL(blob)
          setYtAutomatedPreviewByClip(prev => {
            const next = { ...prev }
            const old = next[clipIndex]
            if (old) {
              try {
                URL.revokeObjectURL(old)
              } catch { /* ignore */ }
            }
            next[clipIndex] = objectUrl
            return next
          })
          setYtAutomatedFilenameByClip(prev => ({ ...prev, [clipIndex]: fname }))
          if (opts?.alsoDownload) {
            try {
              const a = document.createElement('a')
              a.href = objectUrl
              a.download = fname
              document.body.appendChild(a)
              a.click()
              a.remove()
            } catch { /* ignore */ }
          }
          if (typeof data.session?.id === 'string') setYtRenderSessionId(data.session.id)
          void loadYtRenderSessions()
          void hydrateYtCloudClipPreviews()
          if (
            typeof data.session?.id === 'string' &&
            ytOpenSessionIdRef.current === data.session.id
          ) {
            void loadYtSessionDetail(data.session.id)
          }
        }
        return
      }
      if (!res.ok || !ct.includes('video/mp4')) {
        let msg = `No se pudo generar el vÃ­deo del clip ${clipIndex + 1}.`
        try {
          const j = (await res.json()) as { message?: string }
          if (typeof j.message === 'string') msg = j.message
        } catch { /* ignore */ }
        setYtRenderErr(msg)
        return
      }
      const blob = await res.blob()
      const cd = res.headers.get('Content-Disposition')
      const m = cd?.match(/filename="([^"]+)"/)
      const fname = m?.[1] ?? `clip-${clipIndex + 1}-9-16-${ytVideoId}.mp4`
      const objectUrl = URL.createObjectURL(blob)
      setYtAutomatedPreviewByClip(prev => {
        const next = { ...prev }
        const old = next[clipIndex]
        if (old) {
          try {
            URL.revokeObjectURL(old)
          } catch { /* ignore */ }
        }
        next[clipIndex] = objectUrl
        return next
      })
      setYtAutomatedFilenameByClip(prev => ({ ...prev, [clipIndex]: fname }))
      if (opts?.alsoDownload) {
        try {
          const a = document.createElement('a')
          a.href = objectUrl
          a.download = fname
          document.body.appendChild(a)
          a.click()
          a.remove()
        } catch { /* ignore */ }
      }
    } catch (e: unknown) {
      if (!aliveRef.current) return
      if (e instanceof Error && e.name === 'AbortError') return
      setYtRenderErr('Error de conexiÃ³n o tiempo agotado.')
    } finally {
      if (aliveRef.current) setYtRenderingClipIndex(null)
    }
  }

  /** Descarga el MP4 ya generado (blob local o URL firmada en la nube) como archivo en disco. */
  const downloadYoutubeClipFromPreview = (clipIndex: number) => {
    const blobUrl = ytAutomatedPreviewByClip[clipIndex]
    const cloudUrl = ytCloudMp4UrlByClip[clipIndex]
    const fname =
      ytAutomatedFilenameByClip[clipIndex] ?? `clip-${clipIndex + 1}-9-16-${ytVideoId}.mp4`
    const trigger = (href: string, revokeAfterMs?: number) => {
      const a = document.createElement('a')
      a.href = href
      a.setAttribute('download', fname)
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      a.remove()
      if (revokeAfterMs != null && href.startsWith('blob:')) {
        window.setTimeout(() => {
          try {
            URL.revokeObjectURL(href)
          } catch { /* ignore */ }
        }, revokeAfterMs)
      }
    }
    if (blobUrl) {
      trigger(blobUrl)
      return
    }
    if (cloudUrl) {
      void (async () => {
        try {
          const r = await fetch(cloudUrl)
          if (!r.ok) throw new Error('fetch')
          const b = await r.blob()
          const cd = r.headers.get('Content-Disposition')
          const m = cd?.match(/filename="?([^";]+)"?/i)
          const nameFromServer = m?.[1]?.trim()
          const finalName = nameFromServer || fname
          const u = URL.createObjectURL(b)
          const a = document.createElement('a')
          a.href = u
          a.setAttribute('download', finalName)
          a.style.display = 'none'
          document.body.appendChild(a)
          a.click()
          a.remove()
          window.setTimeout(() => {
            try {
              URL.revokeObjectURL(u)
            } catch { /* ignore */ }
          }, 4000)
        } catch {
          setYtRenderErr(
            'No se pudo descargar el MP4 (red o CORS). Prueba otro navegador o vuelve a generar el clip.',
          )
        }
      })()
    }
  }

  /** Descarga directa de un MP4 por URL firmada (proyecto en la nube), sin abrir pestaÃ±a. */
  const downloadCloudSessionMp4 = useCallback((url: string, filename: string) => {
    void (async () => {
      try {
        const r = await fetch(url)
        if (!r.ok) throw new Error('fetch')
        const b = await r.blob()
        const cd = r.headers.get('Content-Disposition')
        const m = cd?.match(/filename="?([^";]+)"?/i)
        const nameFromServer = m?.[1]?.trim()
        const finalName = nameFromServer || filename
        const u = URL.createObjectURL(b)
        const a = document.createElement('a')
        a.href = u
        a.setAttribute('download', finalName)
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.setTimeout(() => {
          try {
            URL.revokeObjectURL(u)
          } catch { /* ignore */ }
        }, 4000)
      } catch {
        setYtRenderErr(
          'No se pudo descargar el MP4 (red o CORS). Prueba otro navegador o vuelve a generar el clip.',
        )
      }
    })()
  }, [])

  /** 1.Âª vez: render + descarga; si ya hay MP4 (local o nube), solo descarga. */
  const downloadOrRenderYoutubeClipMp4 = (clipIndex: number) => {
    if (ytAutomatedPreviewByClip[clipIndex] ?? ytCloudMp4UrlByClip[clipIndex]) {
      downloadYoutubeClipFromPreview(clipIndex)
      return
    }
    void generateYoutubeRenderClipPreview(clipIndex, { alsoDownload: true })
  }

  const generateYoutubeClipPreviewRef = useRef(generateYoutubeRenderClipPreview)
  generateYoutubeClipPreviewRef.current = generateYoutubeRenderClipPreview

  useEffect(() => {
    if (section !== 'ytclips' || !ytVideoId || !ytClips.length) return
    if (ytAutoInitialRequestedRef.current === ytVideoId) return
    ytAutoInitialRequestedRef.current = ytVideoId
    requestAutoPreviewClip(0)
  }, [section, ytVideoId, ytClips.length, requestAutoPreviewClip])

  /** Encola vista previa MP4 para todos los clips del pack (cola sigue siendo uno tras otro). */
  useEffect(() => {
    if (section !== 'ytclips' || !ytClips.length) return
    for (let i = 1; i < ytClips.length; i++) {
      requestAutoPreviewClip(i)
    }
  }, [section, ytClips.length, ytClipsPackId, requestAutoPreviewClip])

  const ytSessionClipProgress = useMemo(() => {
    if (!ytSessionDetail) return null
    return sessionClipProgressFromDetail(ytSessionDetail)
  }, [ytSessionDetail])

  const ytProjectClipsGateActive =
    Boolean(
      ytOpenSessionId &&
        ytSessionDetail &&
        !ytSessionDetailLoading &&
        ytSessionClipProgress &&
        ytSessionClipProgress.required > 0 &&
        !ytSessionClipProgress.complete &&
        !ytBypassProjectClipsGate,
    )

  useEffect(() => {
    if (!ytOpenSessionId || !ytSessionDetail || ytSessionDetailLoading) return
    if (ytBypassProjectClipsGate) return
    const prog = sessionClipProgressFromDetail(ytSessionDetail)
    if (prog.complete || prog.required === 0) return
    const id = setInterval(() => {
      void loadYtSessionDetail(ytOpenSessionId)
    }, 4000)
    return () => clearInterval(id)
  }, [
    ytOpenSessionId,
    ytSessionDetail,
    ytSessionDetailLoading,
    ytBypassProjectClipsGate,
    loadYtSessionDetail,
  ])

  useEffect(() => {
    if (section !== 'ytclips') return
    if (ytRenderingClipIndex !== null) return
    if (!ytVideoId || !ytClips.length) return
    if (ytPreviewDrainLockRef.current) return

    const pending = ytAutoPreviewPendingRef.current
    for (const x of [...pending]) {
      if (ytAutomatedPreviewByClip[x] || ytCloudMp4UrlByClip[x]) pending.delete(x)
    }
    const sorted = [...pending].sort((a, b) => a - b)
    const next = sorted[0]
    if (next === undefined) return

    pending.delete(next)
    ytPreviewDrainLockRef.current = true
    void Promise.resolve(generateYoutubeClipPreviewRef.current(next, {})).finally(() => {
      ytPreviewDrainLockRef.current = false
      setYtPreviewKick(k => k + 1)
    })
  }, [
    section,
    ytRenderingClipIndex,
    ytAutomatedPreviewByClip,
    ytPreviewKick,
    ytVideoId,
    ytClips.length,
    ytCloudMp4UrlByClip,
  ])

  const downloadYoutubeRenderZip = async () => {
    if (!ytUrl.trim() || !ytVideoId || !ytClips.length) return
    ytRenderAbortRef.current?.abort()
    ytRenderAbortRef.current = new AbortController()
    const signal = ytRenderAbortRef.current.signal
    setYtRenderErr(null)
    setYtRenderZipLoading(true)
    try {
      const res = await fetch('/api/social/youtube-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          userId,
          youtubeUrl: ytUrl.trim(),
          output: 'zip',
          store: true,
          sessionId: ytRenderSessionId ?? undefined,
          videoTitle: ytVideoTitle || ytTitleHint || undefined,
          clipsPlan: buildClipsPlanPayload(ytClips),
          clips: ytClips.map(c => ({
            start_sec: c.start_sec,
            end_sec: c.end_sec,
            title: c.title,
          })),
        }),
      })
      const ct = res.headers.get('content-type') || ''
      if (!aliveRef.current) return
      if (ct.includes('application/json')) {
        const data = (await res.json()) as {
          success?: boolean
          project?: { download_url?: string }
          session?: { id?: string }
          message?: string
        }
        if (!res.ok || !data.success) {
          setYtRenderErr(typeof data.message === 'string' ? data.message : 'No se pudo generar el ZIP.')
          return
        }
        if (typeof data.session?.id === 'string') setYtRenderSessionId(data.session.id)
        void loadYtRenderSessions()
        if (data.project?.download_url) {
          window.open(data.project.download_url, '_blank', 'noopener,noreferrer')
        }
        if (
          typeof data.session?.id === 'string' &&
          ytOpenSessionIdRef.current === data.session.id
        ) {
          void loadYtSessionDetail(data.session.id)
        }
        return
      }
      if (!res.ok || !ct.includes('zip')) {
        let msg = 'No se pudo generar el ZIP.'
        try {
          const j = (await res.json()) as { message?: string }
          if (typeof j.message === 'string') msg = j.message
        } catch { /* ignore */ }
        setYtRenderErr(msg)
        return
      }
      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = `clips-9-16-${ytVideoId}.zip`
      a.click()
      URL.revokeObjectURL(href)
    } catch (e: unknown) {
      if (!aliveRef.current) return
      if (e instanceof Error && e.name === 'AbortError') return
      setYtRenderErr('Error de conexiÃ³n o tiempo agotado.')
    } finally {
      if (aliveRef.current) setYtRenderZipLoading(false)
    }
  }

  const btnGhost: CSSProperties = {
    padding: '8px 14px', borderRadius: 10, border: `1px solid ${T.ink10}`,
    background: T.white, fontWeight: 600, fontSize: 12, fontFamily: T.sans, cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(12,12,12,.03)', transition: 'border-color .15s, background .15s',
  }

  const backBtnStyle: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 0', marginBottom: 16, background: 'none', border: 'none',
    fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.ink40, cursor: 'pointer',
  }

  return (
    <div style={{ padding: 32, maxWidth: 860 }}>
      {settingsErr && (
        <div style={{
          background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.2)', borderRadius: 10,
          padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#8B2E2E',
        }}>
          {settingsErr}
        </div>
      )}

      {section === 'hub' && (
        <>
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11, background: T.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, flexShrink: 0,
              }}>
                <Layers size={22} strokeWidth={1.75} aria-hidden />
              </div>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <h2 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 700, letterSpacing: '-.025em', color: T.ink, margin: 0 }}>
                  Social Mode
                </h2>
                <p style={{ fontSize: 13, color: T.ink40, marginTop: 2 }}>Studio para creadores Â· IA</p>
              </div>
              {!isPro && (
                <div style={{
                  fontSize: 12, fontWeight: 600, color: T.ink40, background: T.paper,
                  border: `1px solid ${T.ink10}`, padding: '5px 14px', borderRadius: 100,
                }}>
                  Free Â· lÃ­mites por semana
                </div>
              )}
            </div>
            <p style={{ fontSize: 15, color: T.ink60, lineHeight: 1.65, maxWidth: 720 }}>
              <strong>Genera contenido como un pro:</strong> calendario de publicaciones, ganchos para reels y{' '}
              <strong>Shorts listos</strong> desde URL (YouTube hoy): la IA analiza el vÃ­deo, corta los mejores momentos en <strong>9:16</strong> y organiza copy para TikTok, Reels y Shorts.{' '}
              Pensado para creadores que quieren publicar mÃ¡s sin partir de cero. Sin conectar OAuth.
            </p>
          </div>

          {!isPro && (
            <div style={{
              background: 'rgba(232,179,64,.12)', border: '1px solid rgba(200,150,40,.25)', borderRadius: 12,
              padding: '14px 18px', marginBottom: 22, fontSize: 13, color: '#6B5A2E', lineHeight: 1.55,
            }}>
              EstÃ¡s en <strong>plan Free</strong> (salida reducida y lÃ­mites por semana). Sube a <strong>Pro</strong> para calendario de 7 dÃ­as,
              Hook Lab completo y mÃ¡s <strong>Shorts listos</strong> (YouTube) al dÃ­a.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            <button
              type="button"
              onClick={() => setSection('editorial')}
              style={{
                textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
                background: T.white, borderRadius: 16, padding: '22px 24px', border: `1px solid ${T.ink10}`,
                cursor: 'pointer', fontFamily: T.sans, transition: 'border-color .15s, box-shadow .15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = T.ink20
                e.currentTarget.style.boxShadow = SHADOW.soft
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = T.ink10
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                <IconTile icon={Calendar} background="#F0F2EF" iconColor="#5C6560" />
                <ArrowRight size={20} strokeWidth={1.75} color={T.ink40} aria-hidden />
              </div>
              <div>
                <p style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 700, color: T.ink, margin: '0 0 6px' }}>
                  Calendario editorial
                </p>
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: T.coral, background: 'rgba(232,93,76,.08)', padding: '4px 10px', borderRadius: 100, marginBottom: 8,
                }}>
                  Semanal Â· IA
                </span>
                <p style={{ fontSize: 13, color: T.ink60, lineHeight: 1.55, margin: 0 }}>
                  Para planificar la semana: carrusel, reel e hilo con hashtags y tips de rodaje. Menos bloqueo ante el calendario.{' '}
                  {isPro
                    ? 'Sin lÃ­mite de generaciones (Pro).'
                    : `Vista previa de ${EDITORIAL_DAYS.free} dÃ­as.`}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSection('hooklab')}
              style={{
                textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
                background: T.white, borderRadius: 16, padding: '22px 24px', border: `1px solid ${T.ink10}`,
                cursor: 'pointer', fontFamily: T.sans, transition: 'border-color .15s, box-shadow .15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = T.ink20
                e.currentTarget.style.boxShadow = SHADOW.soft
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = T.ink10
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                <IconTile icon={Zap} background="#F5EFEA" iconColor={T.coral} />
                <ArrowRight size={20} strokeWidth={1.75} color={T.ink40} aria-hidden />
              </div>
              <div>
                <p style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 700, color: T.ink, margin: '0 0 6px' }}>
                  Hook Lab
                </p>
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: T.violet, background: 'rgba(123,104,238,.1)', padding: '4px 10px', borderRadius: 100, marginBottom: 8,
                }}>
                  Ganchos Â· CTA
                </span>
                <p style={{ fontSize: 13, color: T.ink60, lineHeight: 1.55, margin: 0 }}>
                  Abre reels con ideas fuertes: {hl.hooks} ganchos y {hl.angles}{' '}
                  {hl.angles === 1 ? 'Ã¡ngulo' : 'Ã¡ngulos'}
                  {isPro ? ' + audio y textos en pantalla.' : '.'} Ideal antes de grabar.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSection('ytclips')}
              style={{
                textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
                background: T.white, borderRadius: 16, padding: '22px 24px', border: `1px solid ${T.ink10}`,
                cursor: 'pointer', fontFamily: T.sans, transition: 'border-color .15s, box-shadow .15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = T.ink20
                e.currentTarget.style.boxShadow = SHADOW.soft
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = T.ink10
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                <IconTile icon={CirclePlay} background="#FDEDED" iconColor="#C41E3A" />
                <ArrowRight size={20} strokeWidth={1.75} color={T.ink40} aria-hidden />
              </div>
              <div>
                <p style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 700, color: T.ink, margin: '0 0 6px' }}>
                  Shorts listos
                </p>
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: T.coral, background: 'rgba(232,93,76,.1)', padding: '4px 10px', borderRadius: 100, marginBottom: 8,
                }}>
                  URL â†’ IA â†’ proyecto Â· estilo Opus
                </span>
                <p style={{ fontSize: 13, color: T.ink60, lineHeight: 1.55, margin: 0 }}>
                  Pega un enlace, analizamos el vÃ­deo y generamos clips 9:16 con toda la info. Proyectos en la nube que caducan solos a los 2 dÃ­as. {isPro ? 'Pro: pack completo (~12 momentos), sin lÃ­mite de usos.' : 'Free: hasta ~4 momentos por anÃ¡lisis.'}
                </p>
              </div>
            </button>

            <div
              style={{
                textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
                background: T.white, borderRadius: 16, padding: '22px 24px', border: `1px dashed ${T.ink10}`,
                opacity: 0.65, pointerEvents: 'none',
              }}
            >
              <IconTile icon={Sparkles} background="#EEF0F5" iconColor={T.ink40} />
              <div>
                <p style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 700, color: T.ink, margin: '0 0 6px' }}>
                  MÃ¡s herramientas
                </p>
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: T.ink40, background: T.paper, padding: '4px 10px', borderRadius: 100, marginBottom: 8,
                }}>
                  PrÃ³ximamente
                </span>
                <p style={{ fontSize: 13, color: T.ink60, lineHeight: 1.55, margin: 0 }}>
                  Ideas, formatos y flujos nuevos para Social Mode.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {section === 'editorial' && (
      <>
      <button type="button" onClick={() => setSection('hub')} style={backBtnStyle}>
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
        Todas las herramientas
      </button>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', color: T.ink, margin: '0 0 8px' }}>
          Calendario editorial
        </h2>
        <p style={{ fontSize: 14, color: T.ink60, lineHeight: 1.6, maxWidth: 640 }}>
          Define tu nicho, tono y red; la IA propone publicaciones para la semana.
        </p>
      </div>

      <div style={{ background: T.white, borderRadius: 16, padding: '24px 28px', border: `1px solid ${T.ink10}`, marginBottom: 24 }}>
        <h3 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
          Tu nicho y estilo
        </h3>
        <p style={{ fontSize: 12, color: T.ink40, marginBottom: 18 }}>
          Se guarda en tu cuenta para la prÃ³xima vez.
        </p>
        {settingsLoading ? (
          <p style={{ color: T.ink40 }}>Cargandoâ€¦</p>
        ) : (
          <>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.ink40, display: 'block', marginBottom: 6 }}>Nicho *</label>
            <input
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder="Ej. fitness para gente ocupada, SaaS B2B, recetas veganas rÃ¡pidasâ€¦"
              style={{ ...inputStyle, marginBottom: 14 }}
            />
            <label style={{ fontSize: 11, fontWeight: 700, color: T.ink40, display: 'block', marginBottom: 6 }}>Audiencia</label>
            <input
              value={audience}
              onChange={e => setAudience(e.target.value)}
              placeholder="QuiÃ©n te sigue o a quiÃ©n quieres llegar"
              style={{ ...inputStyle, marginBottom: 14 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.ink40, display: 'block', marginBottom: 6 }}>Tono</label>
                <input value={tone} onChange={e => setTone(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.ink40, display: 'block', marginBottom: 6 }}>Red principal</label>
                <select value={mainPlatform} onChange={e => setMainPlatform(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="X / Twitter">X / Twitter</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Varias">Varias</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.ink40, display: 'block', marginBottom: 6 }}>Idioma del contenido</label>
                <input value={language} onChange={e => setLanguage(e.target.value)} placeholder="espaÃ±ol" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button
                type="button"
                onClick={savePreferences}
                disabled={savingPrefs}
                style={{
                  padding: '10px 18px', borderRadius: 9, border: `1px solid ${T.ink10}`,
                  background: T.paper, fontWeight: 600, fontSize: 13, fontFamily: T.sans, cursor: savingPrefs ? 'wait' : 'pointer',
                }}
              >
                {savingPrefs ? 'Guardandoâ€¦' : 'Guardar preferencias'}
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={genLoading || !niche.trim()}
                style={{
                  padding: '10px 22px', borderRadius: 9, border: 'none',
                  background: T.ink, color: T.white, fontWeight: 600, fontSize: 14, fontFamily: T.sans,
                  cursor: genLoading || !niche.trim() ? 'wait' : 'pointer', opacity: !niche.trim() ? 0.5 : 1,
                }}
              >
                {genLoading
                  ? `Generando ${calDays} dÃ­a${calDays > 1 ? 's' : ''}â€¦`
                  : isPro
                    ? 'Generar semana completa â€” 7 dÃ­as (IA)'
                    : 'Generar vista previa â€” 3 dÃ­as (IA)'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: T.ink40, marginTop: 12 }}>
              <strong>Calendario:</strong>{' '}
              Free <strong>1/semana</strong> (lun UTC), solo {EDITORIAL_DAYS.free} ideas Â· Pro{' '}
              <strong>sin lÃ­mite de generaciones</strong> (UTC), {EDITORIAL_DAYS.pro} dÃ­as + extras.
            </p>
          </>
        )}
      </div>

      {genErr && (
        <div style={{
          background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.2)', borderRadius: 10,
          padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#8B2E2E',
        }}>
          {genErr}
        </div>
      )}

      {calendar && (
        <section style={{ marginBottom: 32 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            paddingBottom: 12, borderBottom: `1px solid ${T.ink10}`,
          }}>
            <IconTile icon={Ico.calendar} />
            <h3 style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: '-.02em' }}>
              Calendario editorial
            </h3>
            <span style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: T.ink40,
              background: T.paper, padding: '4px 10px', borderRadius: 100, border: `1px solid ${T.ink10}`,
            }}>
              {calendar.posts.length} {calendar.posts.length === 1 ? 'pieza' : 'piezas'}
            </span>
          </div>

          <div style={{
            background: `linear-gradient(145deg, ${T.white} 0%, #FAFAF8 100%)`,
            borderRadius: 20,
            padding: 'clamp(20px, 4vw, 28px)',
            border: `1px solid ${T.ink10}`,
            boxShadow: SHADOW.soft,
            marginBottom: 24,
          }}>
            <SectionLabel color={isPro ? T.violet : T.coral}>
              {isPro ? 'Hilo de la semana' : 'Vista previa Â· Free'}
            </SectionLabel>
            <p style={{
              fontFamily: T.serif, fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 700,
              color: T.ink, lineHeight: 1.35, margin: '0 0 12px', letterSpacing: '-.02em',
            }}>
              {calendar.week_theme}
            </p>
            {!isPro && (
              <p style={{ fontSize: 13, color: T.coral, margin: 0, fontWeight: 600, opacity: 0.95 }}>
                {calendar.posts.length} dÃ­as de muestra Â· Pro desbloquea 7 dÃ­as + hashtags y rodaje.
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20, alignItems: 'center' }}>
              <button type="button" onClick={copyWeek} style={{ ...btnGhost, padding: '10px 18px', fontSize: 13 }}>
                {copied || copiedFlash === 'week' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <StrokeIcon icon={Ico.check} size={18} color={T.green} /> Copiado al portapapeles
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <StrokeIcon icon={Ico.clipboard} size={18} />
                    {isPro ? 'Copiar semana completa' : 'Copiar vista previa'}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {calendar.posts.map((p, idx) => (
              <article
                key={`${p.day}-${idx}`}
                style={{
                  background: T.white,
                  borderRadius: 18,
                  overflow: 'hidden',
                  border: `1px solid ${T.ink10}`,
                  boxShadow: SHADOW.card,
                }}
              >
                <div style={{
                  display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 0,
                  borderBottom: `1px solid ${T.ink10}`,
                  background: `linear-gradient(90deg, ${FORMAT_COLOR[p.format]}12 0%, transparent 55%)`,
                }}>
                  <div style={{
                    minWidth: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: FORMAT_COLOR[p.format], color: T.white, fontFamily: T.serif,
                    fontSize: 22, fontWeight: 800, padding: '14px 12px',
                  }}>
                    {p.day}
                  </div>
                  <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                    <IconTile icon={FORMAT_ICON[p.format]} box={40} size={20} />
                    <span style={{
                      fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
                      color: T.white, background: FORMAT_COLOR[p.format], padding: '5px 12px', borderRadius: 8,
                    }}>
                      {FORMAT_LABEL[p.format]}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{p.day_label}</span>
                    <span style={{
                      marginLeft: 'auto', fontSize: 12, color: T.ink40, fontWeight: 500,
                      padding: '4px 10px', borderRadius: 8, background: T.paper, border: `1px solid ${T.ink10}`,
                    }}>
                      {p.platforms}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '20px 22px 22px' }}>
                  <h4 style={{ fontSize: 17, fontWeight: 700, color: T.ink, margin: '0 0 16px', lineHeight: 1.3, letterSpacing: '-.015em' }}>
                    {p.title}
                  </h4>

                  <div style={{ marginBottom: 18 }}>
                    <SectionLabel>Gancho</SectionLabel>
                    <p style={{
                      fontSize: 15, color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic',
                      padding: '14px 16px', borderRadius: 12, background: T.paper, borderLeft: `3px solid ${FORMAT_COLOR[p.format]}`,
                    }}>
                      â€œ{p.hook}â€
                    </p>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <SectionLabel>Estructura</SectionLabel>
                    <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {p.outline.map((line, i) => (
                        <li
                          key={i}
                          style={{
                            display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10,
                            fontSize: 14, color: T.ink60, lineHeight: 1.55,
                          }}
                        >
                          <span style={{
                            flexShrink: 0, width: 26, height: 26, borderRadius: 8,
                            background: T.paper, border: `1px solid ${T.ink10}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800, color: T.ink,
                          }}>
                            {i + 1}
                          </span>
                          <span style={{ paddingTop: 2 }}>{line}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div style={{
                    padding: '14px 16px', borderRadius: 12, background: 'rgba(12,12,12,.03)',
                    marginBottom: 16, border: `1px solid ${T.ink10}`,
                  }}>
                    <SectionLabel style={{ marginBottom: 6 }}>CTA</SectionLabel>
                    <p style={{ fontSize: 14, fontWeight: 600, color: T.ink, margin: 0, lineHeight: 1.5 }}>
                      {p.cta}
                    </p>
                  </div>

                  {p.hashtags && (
                    <div style={{ marginBottom: 16 }}>
                      <SectionLabel color={T.violet}>Hashtags</SectionLabel>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {splitHashtagTokens(p.hashtags).map((tag, ti) => (
                          <span
                            key={ti}
                            style={{
                              fontSize: 12, fontWeight: 600, color: T.violet,
                              background: 'rgba(123,104,238,.1)', padding: '6px 11px', borderRadius: 100,
                              border: '1px solid rgba(123,104,238,.2)', fontFamily: T.sans,
                            }}
                          >
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.production_tip && (
                    <div style={{
                      marginBottom: 18, padding: '14px 16px', borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(40,200,64,.08) 0%, rgba(40,200,64,.02) 100%)',
                      border: '1px solid rgba(40,200,64,.2)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <IconTile icon={Ico.camera} box={36} size={18} />
                        <SectionLabel color={T.green} style={{ marginBottom: 0 }}>ProducciÃ³n</SectionLabel>
                      </div>
                      <p style={{ fontSize: 13, color: T.ink60, margin: 0, lineHeight: 1.6 }}>{p.production_tip}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => copyOne(p, idx)}
                    style={{
                      ...btnGhost,
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      borderColor: copiedFlash === `post-${idx}` ? T.green : T.ink10,
                      background: copiedFlash === `post-${idx}` ? 'rgba(40,200,64,.1)' : T.white,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <StrokeIcon
                        icon={copiedFlash === `post-${idx}` ? Ico.check : Ico.paperclip}
                        size={16}
                        color={copiedFlash === `post-${idx}` ? T.green : T.ink}
                      />
                      {copiedFlash === `post-${idx}` ? 'Copiado' : 'Copiar esta pieza'}
                    </span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      </>
      )}

      {section === 'hooklab' && (
      <>
      <button type="button" onClick={() => setSection('hub')} style={backBtnStyle}>
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
        Todas las herramientas
      </button>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', color: T.ink, margin: '0 0 8px' }}>
          Hook Lab
        </h2>
        <p style={{ fontSize: 14, color: T.ink60, lineHeight: 1.6, maxWidth: 640 }}>
          Ganchos, Ã¡ngulos y (en Pro) audio y textos para overlay. El mismo nicho, tono y audiencia del calendario editorial se envÃ­an a la IA.
        </p>
      </div>
      <div style={{
        background: T.paper, borderRadius: 12, padding: '14px 18px', border: `1px solid ${T.ink10}`,
        marginBottom: 20, fontSize: 13, color: T.ink60, lineHeight: 1.55,
      }}>
        <strong style={{ color: T.ink }}>Preferencias globales</strong> (nicho, audiencia, tono, red) se editan en el calendario editorial.{' '}
        <button
          type="button"
          onClick={() => setSection('editorial')}
          style={{
            background: 'none', border: 'none', padding: 0, margin: 0, fontFamily: T.sans, fontSize: 13,
            fontWeight: 700, color: T.coral, cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          Abrir calendario editorial
        </button>
      </div>

      <div style={{ background: T.white, borderRadius: 16, padding: '24px 28px', border: `1px solid ${T.ink10}`, marginBottom: 24 }}>
        <h3 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
          Generar pack de hooks
        </h3>
        <p style={{ fontSize: 13, color: T.ink60, marginBottom: 16, lineHeight: 1.55 }}>
          {isPro ? (
            <>
              Pack Pro: <strong>{hl.hooks} ganchos</strong>, <strong>{hl.angles} Ã¡ngulos</strong>, sugerencia de <strong>audio</strong> y{' '}
              <strong>3 textos</strong> para overlay â€” mismo tema, listo para rodar.
            </>
          ) : (
            <>
              Vista Free: <strong>{hl.hooks} ganchos</strong> y <strong>{hl.angles} Ã¡ngulo</strong> por tema (vÃ­deo corto vertical).
            </>
          )}
        </p>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.ink40, display: 'block', marginBottom: 6 }}>Tema del vÃ­deo *</label>
        <input
          value={hookTopic}
          onChange={e => setHookTopic(e.target.value)}
          placeholder="Ej. Por quÃ© tu rutina de skincare no funciona, errores al invertir si eres principianteâ€¦"
          style={{ ...inputStyle, marginBottom: 14 }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setHookTopic(niche.trim())}
            disabled={!niche.trim()}
            style={{
              padding: '8px 14px', borderRadius: 9, border: `1px solid ${T.ink10}`,
              background: T.paper, fontWeight: 600, fontSize: 12, fontFamily: T.sans,
              cursor: niche.trim() ? 'pointer' : 'not-allowed', opacity: niche.trim() ? 1 : 0.5,
            }}
          >
            Usar mi nicho como tema
          </button>
          <button
            type="button"
            onClick={generateHookLab}
            disabled={hookLoading || !hookTopic.trim()}
            style={{
              padding: '10px 22px', borderRadius: 9, border: 'none',
              background: T.coral, color: T.white, fontWeight: 600, fontSize: 14, fontFamily: T.sans,
              cursor: hookLoading || !hookTopic.trim() ? 'wait' : 'pointer', opacity: !hookTopic.trim() ? 0.5 : 1,
            }}
          >
            {hookLoading ? 'Generandoâ€¦' : 'Generar Hook Lab (IA)'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: T.ink40, marginTop: 12 }}>
          <strong>Hook Lab:</strong> Free <strong>{SOCIAL_LIMITS.hookLab.freePerWeek}/semana</strong> (lun UTC) Â· Pro{' '}
          <strong>sin lÃ­mite</strong> (UTC).
        </p>
      </div>

      {hookErr && (
        <div style={{
          background: 'rgba(232,93,76,.1)', border: '1px solid rgba(232,93,76,.25)', borderRadius: 10,
          padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#9A3D2E',
        }}>
          {hookErr}
        </div>
      )}

      {hookLab && (
        <section style={{ marginBottom: 32 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            paddingBottom: 12, borderBottom: `1px solid ${T.ink10}`,
          }}>
            <IconTile icon={Ico.zap} />
            <h3 style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: '-.02em' }}>
              Hook Lab
            </h3>
            <span style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#B84A3D',
              background: 'rgba(232,93,76,.1)', padding: '4px 10px', borderRadius: 100,
            }}>
              {hookLab.hooks.length} hooks Â· {hookLab.angles.length} Ã¡ngulos
            </span>
          </div>

          <div style={{
            background: `linear-gradient(145deg, #FFF9F7 0%, ${T.white} 100%)`,
            borderRadius: 20,
            padding: 'clamp(20px, 4vw, 28px)',
            border: `1px solid rgba(232,93,76,.15)`,
            boxShadow: SHADOW.soft,
            marginBottom: 24,
          }}>
            <SectionLabel color={T.coral}>Tema del vÃ­deo</SectionLabel>
            <p style={{
              fontFamily: T.serif, fontSize: 'clamp(1.2rem, 2.8vw, 1.45rem)', fontWeight: 700,
              color: T.ink, lineHeight: 1.35, margin: '0 0 16px',
            }}>
              {hookLab.topic}
            </p>
            <button type="button" onClick={copyHookLabAll} style={{ ...btnGhost, padding: '10px 18px', fontSize: 13 }}>
              {hookCopied || copiedFlash === 'hooklab' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <StrokeIcon icon={Ico.check} size={18} color={T.green} /> Todo copiado
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <StrokeIcon icon={Ico.clipboard} size={18} /> Copiar informe completo
                </span>
              )}
            </button>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: '-.01em' }}>
                Ganchos de apertura
              </h4>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.ink40 }}>
                Toca <StrokeIcon icon={Ico.paperclip} size={14} /> para copiar uno solo
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              gap: 12,
            }}>
              {hookLab.hooks.map((h, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative', background: T.white, borderRadius: 14, padding: '14px 16px',
                    border: `1px solid ${T.ink10}`, boxShadow: SHADOW.card,
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}
                >
                  <span style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: 10, background: T.ink, color: T.white,
                    fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: T.sans,
                  }}>
                    {i + 1}
                  </span>
                  <p style={{ flex: 1, fontSize: 14, color: T.ink60, lineHeight: 1.55, margin: 0, paddingRight: 36 }}>
                    {h}
                  </p>
                  <button
                    type="button"
                    title="Copiar gancho"
                    onClick={() => copySingleHook(h, i)}
                    style={{
                      position: 'absolute', top: 10, right: 10,
                      width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.ink10}`,
                      background: copiedFlash === `hook-${i}` ? 'rgba(40,200,64,.12)' : T.paper,
                      cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <StrokeIcon
                      icon={copiedFlash === `hook-${i}` ? Ico.check : Ico.paperclip}
                      size={16}
                      color={copiedFlash === `hook-${i}` ? T.green : T.ink}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {hookLab.sound_mood && (
            <div style={{
              marginBottom: 24, padding: '18px 20px', borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(37,99,235,.08) 0%, rgba(37,99,235,.02) 100%)',
              border: '1px solid rgba(37,99,235,.18)',
              boxShadow: SHADOW.card,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <IconTile icon={Ico.music} box={46} size={22} />
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.blue }}>
                  Audio sugerido
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.white, background: T.blue, padding: '2px 8px', borderRadius: 100 }}>
                  Pro
                </span>
              </div>
              <p style={{ fontSize: 15, color: T.ink60, margin: '0 0 12px', lineHeight: 1.6 }}>{hookLab.sound_mood}</p>
              <p style={{
                fontSize: 12, color: T.ink40, margin: '0 0 14px', lineHeight: 1.5,
                padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,.65)', border: `1px solid ${T.ink10}`,
              }}>
                <strong style={{ color: T.ink60 }}>No hay nada que reproducir aquÃ­:</strong> esto es una orientaciÃ³n para que elijas mÃºsica,
                voz en off o sonidos en TikTok, CapCut, Instagram, bibliotecas libres de derechos, etc.
              </p>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  `${hookLab.topic} mÃºsica ${hookLab.sound_mood}`.slice(0, 180),
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600,
                  color: T.blue, textDecoration: 'none', fontFamily: T.sans,
                }}
              >
                <ExternalLink size={16} strokeWidth={STROKE} />
                Buscar inspiraciÃ³n en YouTube
              </a>
            </div>
          )}

          {hookLab.on_screen_texts && hookLab.on_screen_texts.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <IconTile icon={Ico.mobile} />
                <h4 style={{ fontSize: 14, fontWeight: 800, color: T.ink, margin: 0 }}>Textos en pantalla</h4>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.white, background: T.blue, padding: '2px 8px', borderRadius: 100 }}>
                  Pro
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {hookLab.on_screen_texts.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                      background: T.white, borderRadius: 12, border: `1px solid ${T.ink10}`,
                      fontFamily: 'ui-monospace, monospace', fontSize: 13, color: T.ink,
                      boxShadow: '0 1px 0 rgba(12,12,12,.04)',
                    }}
                  >
                    <span style={{
                      fontSize: 11, fontWeight: 800, color: T.ink40, width: 52, flexShrink: 0,
                    }}>
                      Clip {i + 1}
                    </span>
                    <span style={{ fontFamily: T.sans, fontWeight: 600 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: T.ink, margin: '0 0 14px', letterSpacing: '-.01em' }}>
              Ãngulos narrativos
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {hookLab.angles.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', gap: 16, alignItems: 'flex-start',
                    background: T.white, borderRadius: 16, padding: '18px 20px',
                    border: `1px solid ${T.ink10}`, boxShadow: SHADOW.card,
                  }}
                >
                  <div style={{
                    flexShrink: 0, width: 40, height: 40, borderRadius: 12,
                    background: `linear-gradient(135deg, ${T.coral} 0%, #ff8a70 100%)`,
                    color: T.white, fontWeight: 800, fontSize: 16, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontFamily: T.sans,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: T.ink, margin: '0 0 8px', lineHeight: 1.3 }}>
                      {a.title}
                    </p>
                    <p style={{ fontSize: 14, color: T.ink60, lineHeight: 1.6, margin: 0 }}>{a.pitch}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      </>
      )}

      {section === 'ytclips' && (
      <>
      <button type="button" onClick={() => setSection('hub')} style={backBtnStyle}>
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
        Todas las herramientas
      </button>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', color: T.ink, margin: '0 0 8px' }}>
          Shorts listos
        </h2>
        <p style={{ fontSize: 14, color: T.ink60, lineHeight: 1.6, maxWidth: 720 }}>
          <strong>1)</strong> Pega la <strong>URL</strong> del vÃ­deo (ahora <strong>YouTube</strong>; Drive u otros enlaces, prÃ³ximamente).{' '}
          <strong>2)</strong> La <strong>IA analiza</strong> el contenido y propone los mejores cortes con copy y hashtags. VerÃ¡s una <strong>barra de progreso estilo Opus</strong> mientras trabaja.{' '}
          <strong>3)</strong> Al terminar, abre el <strong>proyecto</strong> en la nube: ahÃ­ estÃ¡n todos los <strong>clips en vista previa 9:16</strong> y las descargas.{' '}
          <strong>4)</strong> A los <strong>{YOUTUBE_RENDER_TTL_DAYS} dÃ­as</strong> el proyecto y los archivos se <strong>eliminan solos</strong>.
        </p>
      </div>

      <div style={{
        background: 'rgba(196,30,58,.08)', border: '1px solid rgba(196,30,58,.2)', borderRadius: 12,
        padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#6B2D2D', lineHeight: 1.55,
      }}>
        <strong>Importante:</strong> hace falta que el vÃ­deo tenga <strong>subtÃ­tulos o transcripciÃ³n</strong> disponibles en YouTube.
        Si no hay, prueba otro vÃ­deo o uno con subtÃ­tulos automÃ¡ticos activos.
      </div>

      <div style={{
        background: '#121212',
        color: '#e8e8e8',
        borderRadius: 16,
        padding: '20px 22px',
        marginBottom: 22,
        border: '1px solid #2a2a2a',
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-.02em', color: '#fff' }}>
              Tus proyectos (como en Opus){' '}
              <span style={{ fontSize: 13, fontWeight: 700, color: '#888' }}>({ytSessions.length})</span>
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9a9a9a', lineHeight: 1.5, maxWidth: 560 }}>
              Cada tarjeta es un vÃ­deo analizado: entra para ver <strong style={{ color: '#cfcfcf' }}>todos los clips 9:16</strong> con vista previa. La barra verde mientras se generan MP4/ZIP. Caducidad automÃ¡tica a los{' '}
              <strong style={{ color: '#cfcfcf' }}>{YOUTUBE_RENDER_TTL_DAYS} dÃ­as</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { void loadYtRenderSessions() }}
            disabled={ytSessionsLoading}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #444',
              background: '#1e1e1e',
              color: '#ddd',
              fontSize: 12,
              fontWeight: 600,
              cursor: ytSessionsLoading ? 'wait' : 'pointer',
              fontFamily: T.sans,
            }}
          >
            {ytSessionsLoading ? 'Actualizandoâ€¦' : 'Actualizar'}
          </button>
        </div>

        {ytSessionsLoading && ytSessions.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Cargando proyectosâ€¦</p>
        ) : null}

        {!ytSessionsLoading && ytSessions.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: '#888', lineHeight: 1.55 }}>
            AÃºn no hay proyectos. <strong style={{ color: '#bbb' }}>Descarga un MP4 9:16</strong> o un{' '}
            <strong style={{ color: '#bbb' }}>ZIP</strong> desde los clips de abajo y se crearÃ¡ un proyecto agrupado.
          </p>
        ) : null}

        {!ytSessionsLoading && ytSessions.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {ytSessions.map(s => {
              const showProgress =
                (ytRenderingClipIndex !== null || ytRenderZipLoading) &&
                s.youtube_video_id === ytVideoId
              const planForDur = s.clips_plan as { clips?: { end_sec?: unknown }[] } | undefined
              const durClips = planForDur?.clips
              const approxSourceMin =
                Array.isArray(durClips) && durClips.length > 0
                  ? Math.max(
                    1,
                    Math.ceil(
                      Math.max(...durClips.map(c => Number(c?.end_sec) || 0)) / 60,
                    ),
                  )
                  : null
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setYtBypassProjectClipsGate(false)
                    void loadYtSessionDetail(s.id)
                  }}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#1e1e1e',
                    border: ytOpenSessionId === s.id ? '1px solid #4ade80' : '1px solid #333',
                    padding: 0,
                    fontFamily: T.sans,
                  }}
                >
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.thumbnail_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <OpusProgressOverlay visible={showProgress} pct={ytRenderFakeProgress} variant="render" />
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 6,
                      zIndex: 2,
                    }}>
                      <span style={{
                        background: 'rgba(0,0,0,.78)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 8px',
                        borderRadius: 6,
                      }}>
                        {s.total_assets} archivo{s.total_assets === 1 ? '' : 's'}
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                        {approxSourceMin != null ? (
                          <span style={{
                            background: 'rgba(0,0,0,.78)',
                            color: '#e8e8e8',
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}>
                            <Clock size={12} strokeWidth={2} aria-hidden />
                            {approxSourceMin}&apos;
                          </span>
                        ) : null}
                        <span style={{
                          background: 'rgba(55,55,55,.92)',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 6,
                        }}>
                          {isPro ? 'Pro' : 'Free Plan'}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '12px 12px 10px',
                      background: 'linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.45) 60%, transparent 100%)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#f2f2f2',
                      lineHeight: 1.35,
                      zIndex: 2,
                    }}>
                      {s.expires_label}
                    </div>
                  </div>
                  <div style={{ padding: 12 }}>
                    <p style={{
                      margin: '0 0 4px',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#fff',
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {s.video_title || s.youtube_video_id}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#888' }}>
                      Shorts listos Â· {s.ready_assets}/{s.total_assets} listos
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : null}

        {ytOpenSessionId ? (
          <div style={{
            marginTop: 22,
            padding: 18,
            borderRadius: 12,
            border: '1px solid #333',
            background: '#1a1a1a',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#6ee7b7', letterSpacing: '.06em' }}>
                  PROYECTO Â· TODOS LOS SHORTS
                </p>
                <h4 style={{ margin: '6px 0 0', fontSize: 17, fontWeight: 800, color: '#fff' }}>
                  {ytSessionDetail?.session.video_title ?? 'Cargandoâ€¦'}
                </h4>
                {ytSessionDetail ? (
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#999', lineHeight: 1.5 }}>
                    Vista previa de cada clip en <strong style={{ color: '#ccc' }}>9:16</strong>. {ytSessionDetail.session.expires_label} Â·{' '}
                    {ytSessionDetail.assets.length} archivo(s)
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setYtOpenSessionId(null)
                  setYtSessionDetail(null)
                  setYtBypassProjectClipsGate(false)
                  setYtCloudClipInfoModal(null)
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #444',
                  background: '#252525',
                  color: '#ddd',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: T.sans,
                  flexShrink: 0,
                }}
              >
                Cerrar
              </button>
            </div>

            {ytSessionDetailLoading ? (
              <p style={{ color: '#888', fontSize: 13 }}>Cargando informaciÃ³nâ€¦</p>
            ) : null}

            <div style={{ position: 'relative' }}>
              {ytSessionDetail && !ytSessionDetailLoading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}>
                {!ytProjectClipsGateActive
                  ? ytSessionDetail.assets.filter(a => a.kind === 'zip').map(z => (
                  <div
                    key={z.id}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: '#222',
                      border: '1px solid #333',
                    }}
                  >
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: '#a7f3d0' }}>PACK ZIP</p>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#ccc' }}>{z.title}</p>
                    {z.download_url ? (
                      <a
                        href={z.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 13, fontWeight: 700, color: '#7dd3a0' }}
                      >
                        Descargar ZIP
                      </a>
                    ) : null}
                  </div>
                ))
                  : null}

                {(() => {
                  const plan = ytSessionDetail.session.clips_plan as { clips?: Array<Record<string, unknown>> } | null
                  const planClips = Array.isArray(plan?.clips) ? plan.clips : []
                  const assets = ytSessionDetail.assets.filter(a => a.kind === 'mp4')
                  const vidStyle: CSSProperties = {
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    background: '#000',
                    display: 'block',
                  }
                  const gateOverlay =
                    ytProjectClipsGateActive && ytSessionClipProgress ? (
                      <YtProjectVideoGridGateOverlay
                        progress={ytSessionClipProgress}
                        onBypass={() => setYtBypassProjectClipsGate(true)}
                      />
                    ) : null
                  const gridWrapStyle: CSSProperties = {
                    position: 'relative',
                    minHeight: ytProjectClipsGateActive ? 280 : undefined,
                  }

                  if (planClips.length === 0) {
                    return (
                      <div style={gridWrapStyle}>
                        {gateOverlay}
                        <p style={{
                          margin: '4px 0 10px',
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#9ca3af',
                          letterSpacing: '.08em',
                        }}>
                          CLIPS 9:16 Â· VISTA PREVIA
                        </p>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))',
                          gap: 14,
                        }}>
                          {assets.map((a, assetIdx) => {
                            const title = String(a.title ?? `Clip ${assetIdx + 1}`)
                            const slug =
                              title
                                .replace(/[^\w\s-Ã Ã¡Ã©Ã­Ã³ÃºÃ±Ã¼]/gi, '')
                                .replace(/\s+/g, '-')
                                .slice(0, 48) || `clip-${assetIdx + 1}`
                            const fname = `clip-${assetIdx + 1}-9-16-${slug}.mp4`
                            const openCloudInfo = () => {
                              setYtCloudClipInfoModal({
                                clipNum: assetIdx + 1,
                                title,
                                downloadUrl: a.download_url ?? null,
                                filenameHint: fname,
                                premiumClip: null,
                                clipTiming: null,
                                fallbackDesc: isPro
                                  ? 'Solo hay archivo MP4 en este proyecto (sin plan de copy guardado).'
                                  : undefined,
                              })
                            }
                            return (
                              <div
                                key={a.id}
                                style={{
                                  borderRadius: 12,
                                  overflow: 'hidden',
                                  background: '#222',
                                  border: '1px solid #333',
                                }}
                              >
                                <div style={{ position: 'relative', aspectRatio: '9/16', background: '#000', flexShrink: 0 }}>
                                  {a.download_url ? (
                                    <video src={a.download_url} controls playsInline style={vidStyle} />
                                  ) : (
                                    <div style={{
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: 12,
                                      textAlign: 'center',
                                      fontSize: 11,
                                      color: '#666',
                                    }}>
                                      Sin vista previa
                                    </div>
                                  )}
                                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        zIndex: 5,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                        alignItems: 'flex-end',
                                        pointerEvents: 'auto',
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={e => {
                                          e.stopPropagation()
                                          openCloudInfo()
                                        }}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          padding: '6px 10px',
                                          borderRadius: 8,
                                          border: isPro ? '1px solid rgba(255,255,255,.4)' : '1px dashed rgba(255,255,255,.35)',
                                          background: 'rgba(0,0,0,.58)',
                                          color: isPro ? '#fff' : 'rgba(255,255,255,.65)',
                                          fontWeight: 800,
                                          fontSize: 9,
                                          letterSpacing: '.1em',
                                          fontFamily: T.sans,
                                          cursor: 'pointer',
                                          textTransform: 'uppercase',
                                        }}
                                      >
                                        <Info size={14} strokeWidth={2} aria-hidden />
                                        INFORMACIÃ“N
                                        {!isPro ? (
                                          <span style={{ fontSize: 8, fontWeight: 800, opacity: 0.9 }}>+P</span>
                                        ) : null}
                                      </button>
                                    </div>
                                    {a.download_url ? (
                                      <button
                                        type="button"
                                        onClick={e => {
                                          e.stopPropagation()
                                          downloadCloudSessionMp4(a.download_url!, fname)
                                        }}
                                        style={{
                                          position: 'absolute',
                                          bottom: 10,
                                          left: 8,
                                          zIndex: 5,
                                          pointerEvents: 'auto',
                                          margin: 0,
                                          padding: '6px 10px',
                                          borderRadius: 8,
                                          border: 'none',
                                          background: 'rgba(0,0,0,.5)',
                                          color: '#7dd3a0',
                                          fontSize: 11,
                                          fontWeight: 700,
                                          fontFamily: T.sans,
                                          cursor: 'pointer',
                                          backdropFilter: 'blur(6px)',
                                        }}
                                      >
                                        Descargar MP4
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  }

                  const slotMp4s = assignMp4sToPlanSlots(planClips, ytSessionDetail.assets)

                  return (
                    <div style={gridWrapStyle}>
                      {gateOverlay}
                      <p style={{
                        margin: '4px 0 10px',
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#9ca3af',
                        letterSpacing: '.08em',
                      }}>
                        CLIPS 9:16 Â· VISTA PREVIA Y COPY
                      </p>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(172px, 1fr))',
                        gap: 14,
                      }}>
                        {planClips.map((row, i) => {
                          const idx = parseClipIndex(row.clip_index) ?? i
                          const mp4 = slotMp4s[i]
                          const title = String(row.title ?? `Clip ${idx + 1}`)
                          const slug =
                            title
                              .replace(/[^\w\s-Ã Ã¡Ã©Ã­Ã³ÃºÃ±Ã¼]/gi, '')
                              .replace(/\s+/g, '-')
                              .slice(0, 48) || `clip-${idx + 1}`
                          const fname = `clip-${idx + 1}-9-16-${slug}.mp4`
                          const openCloudInfo = () => {
                            const shaped = ensureYoutubeClipShape(
                              row as Partial<YoutubeVerticalClip>,
                            )
                            const timing =
                              shaped.end_sec > shaped.start_sec
                                ? { start_sec: shaped.start_sec, end_sec: shaped.end_sec }
                                : null
                            setYtCloudClipInfoModal({
                              clipNum: idx + 1,
                              title,
                              downloadUrl: mp4?.download_url ?? null,
                              filenameHint: fname,
                              premiumClip: isPro ? shaped : null,
                              clipTiming: timing,
                            })
                          }
                          return (
                            <div
                              key={`plan-${idx}-${i}`}
                              style={{
                                borderRadius: 12,
                                overflow: 'hidden',
                                background: '#222',
                                border: '1px solid #333',
                              }}
                            >
                              <div style={{ position: 'relative', aspectRatio: '9/16', background: '#000', flexShrink: 0 }}>
                                {mp4?.download_url ? (
                                  <video src={mp4.download_url} controls playsInline style={vidStyle} />
                                ) : (
                                  <div style={{
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 12,
                                    textAlign: 'center',
                                    fontSize: 11,
                                    color: '#777',
                                    lineHeight: 1.45,
                                  }}>
                                    MP4 aÃºn no en la nube. Usa <strong style={{ color: '#aaa' }}>Descargar MP4 9:16</strong> abajo.
                                  </div>
                                )}
                                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 8,
                                      right: 8,
                                      zIndex: 5,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 6,
                                      alignItems: 'flex-end',
                                      pointerEvents: 'auto',
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation()
                                        openCloudInfo()
                                      }}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '6px 10px',
                                        borderRadius: 8,
                                        border: isPro ? '1px solid rgba(255,255,255,.4)' : '1px dashed rgba(255,255,255,.35)',
                                        background: 'rgba(0,0,0,.58)',
                                        color: isPro ? '#fff' : 'rgba(255,255,255,.85)',
                                        fontWeight: 800,
                                        fontSize: 9,
                                        letterSpacing: '.1em',
                                        fontFamily: T.sans,
                                        cursor: 'pointer',
                                        textTransform: 'uppercase',
                                      }}
                                    >
                                      <Info size={14} strokeWidth={2} aria-hidden />
                                      INFORMACIÃ“N
                                      {!isPro ? (
                                        <span style={{ fontSize: 8, fontWeight: 800, opacity: 0.9 }}>+P</span>
                                      ) : null}
                                    </button>
                                  </div>
                                  {mp4?.download_url ? (
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation()
                                        downloadCloudSessionMp4(mp4.download_url!, fname)
                                      }}
                                      style={{
                                        position: 'absolute',
                                        bottom: 10,
                                        left: 8,
                                        zIndex: 5,
                                        pointerEvents: 'auto',
                                        margin: 0,
                                        padding: '6px 10px',
                                        borderRadius: 8,
                                        border: 'none',
                                        background: 'rgba(0,0,0,.5)',
                                        color: '#7dd3a0',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        fontFamily: T.sans,
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(6px)',
                                      }}
                                    >
                                      Descargar MP4
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ background: T.white, borderRadius: 16, padding: '24px 28px', border: `1px solid ${T.ink10}`, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: T.ink60, lineHeight: 1.55, margin: '0 0 18px' }}>
          Pega el enlace del vÃ­deo largo. <strong>Hoy funciona con YouTube</strong> (hace falta transcripciÃ³n/subtÃ­tulos).{' '}
          <strong>Drive, Vimeo u otros</strong>: mismo flujo, en roadmap.
        </p>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.ink40, display: 'block', marginBottom: 6 }}>
          URL del vÃ­deo
        </label>
        <input
          value={ytUrl}
          onChange={e => setYtUrl(e.target.value)}
          placeholder="YouTube: https://youtube.com/watch?v=â€¦ Â· youtu.be/â€¦"
          style={{ ...inputStyle, marginBottom: 14 }}
        />
        <label style={{ fontSize: 11, fontWeight: 700, color: T.ink40, display: 'block', marginBottom: 6 }}>
          Idioma de subtÃ­tulos (opcional, ej. es, en)
        </label>
        <input
          value={ytCaptionLang}
          onChange={e => setYtCaptionLang(e.target.value)}
          placeholder="Dejar vacÃ­o = idioma por defecto del vÃ­deo"
          style={{ ...inputStyle, marginBottom: 14 }}
        />
        <label style={{ fontSize: 11, fontWeight: 700, color: T.ink40, display: 'block', marginBottom: 6 }}>
          Idioma del copy generado
        </label>
        <input value={language} onChange={e => setLanguage(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }} placeholder="espaÃ±ol" />

        <button
          type="button"
          onClick={runYoutubeClips}
          disabled={ytLoading || !ytUrl.trim()}
          style={{
            padding: '10px 22px', borderRadius: 9, border: 'none',
            background: '#C41E3A', color: T.white, fontWeight: 600, fontSize: 14, fontFamily: T.sans,
            cursor: ytLoading ? 'wait' : 'pointer', opacity: !ytUrl.trim() ? 0.5 : 1,
          }}
        >
          {ytLoading ? 'Analizando vÃ­deo con IAâ€¦' : 'Analizar y generar shorts'}
        </button>

        {ytLoading ? (() => {
          const analysisVid = extractYoutubeVideoId(ytUrl.trim())
          return (
            <div style={{
              marginTop: 20,
              borderRadius: 14,
              overflow: 'hidden',
              position: 'relative',
              aspectRatio: '16/9',
              maxHeight: 300,
              background: '#0f0f0f',
              border: `1px solid ${T.ink20}`,
            }}>
              {analysisVid ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={youtubeThumbUrl(analysisVid)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : null}
              <OpusProgressOverlay visible variant="analysis" pct={ytAnalysisFakeProgress} />
            </div>
          )
        })() : null}
        <p style={{ fontSize: 11, color: T.ink40, marginTop: 12 }}>
          <strong>LÃ­mites pack IA:</strong> Free <strong>{SOCIAL_LIMITS.youtubeClips.freePerWeek}/semana</strong> (lun UTC) Â· Pro{' '}
          <strong>sin lÃ­mite</strong> (UTC). {isPro ? 'Hasta ~12 momentos por anÃ¡lisis.' : 'Hasta ~4 momentos.'}
        </p>
        <p style={{ fontSize: 11, color: T.ink40, marginTop: 8, marginBottom: 0 }}>
          <strong>LÃ­mites vÃ­deo 9:16 (MP4 o ZIP):</strong> cada descarga cuenta Â· Free{' '}
          <strong>{SOCIAL_LIMITS.youtubeRender.freePerWeek}/semana</strong> Â· Pro{' '}
          <strong>sin lÃ­mite</strong> (aparte del pack IA).
        </p>
      </div>

      {ytErr && (
        <div style={{
          background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.2)', borderRadius: 10,
          padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#8B2E2E',
        }}>
          {ytErr}
        </div>
      )}

      {ytRenderErr && (
        <div style={{
          background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.2)', borderRadius: 10,
          padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#8B2E2E',
        }}>
          {ytRenderErr}
        </div>
      )}

      {ytClips.length > 0 && ytVideoId && (
        <section style={{ marginBottom: 32 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            paddingBottom: 12, borderBottom: `1px solid ${T.ink10}`, flexWrap: 'wrap',
          }}>
            <IconTile icon={CirclePlay} background="#FDEDED" iconColor="#C41E3A" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: '-.02em' }}>
                {ytVideoTitle || ytTitleHint || 'Clips sugeridos'}
              </h3>
              <p style={{ fontSize: 12, color: T.ink40, margin: '4px 0 0' }}>
                {ytClips.length} piezas Â· 9:16 Â· copy + hashtags + checklist
              </p>
            </div>
            <button
              type="button"
              onClick={copyYtClipsAll}
              style={{ ...btnGhost, padding: '10px 18px', fontSize: 13 }}
            >
              {ytCopied || copiedFlash === 'ytclips' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <StrokeIcon icon={Ico.check} size={18} color={T.green} /> Copiado
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <StrokeIcon icon={Ico.clipboard} size={18} /> Copiar plan completo
                </span>
              )}
            </button>
          </div>

          <div style={{
            background: 'rgba(64,120,90,.08)', border: '1px solid rgba(64,120,90,.22)', borderRadius: 12,
            padding: '12px 16px', marginBottom: 18, fontSize: 12, color: '#2D4A3A', lineHeight: 1.55,
          }}>
            <strong>Vista previa + MP4 9:16:</strong> si el clip ya estÃ¡ en tu <strong>proyecto en la nube</strong>, la vista previa aparece al momento; si no, se <strong>genera sola</strong> al ver cada tarjeta (uno tras otro).{' '}
            <strong>Descargar MP4</strong> guarda el archivo (tambiÃ©n en la nube 2 dÃ­as). Cada render vuelve a descargar el vÃ­deo en el servidor (lento).{' '}
            <button
              type="button"
              onClick={() => { void downloadYoutubeRenderZip() }}
              disabled={ytRenderZipLoading || ytRenderingClipIndex !== null || !ytUrl.trim()}
              style={{
                display: 'inline', padding: 0, margin: 0, border: 'none', background: 'none',
                color: '#1B5E3A', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer',
                fontSize: 'inherit', fontFamily: 'inherit',
              }}
            >
              {ytRenderZipLoading ? 'Generando ZIPâ€¦' : 'Descargar todos en un ZIP'}
            </button>
            . En <strong>Vercel</strong> suele estar desactivado: <code style={{ fontSize: 11 }}>ENABLE_YOUTUBE_RENDER=1</code> o{' '}
            <code style={{ fontSize: 11 }}>next start</code> local/VPS. Si falla yt-dlp, define <code style={{ fontSize: 11 }}>YT_DLP_PATH</code>.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {ytClips.map((c, i) => (
              <article
                key={i}
                style={{
                  position: 'relative',
                  background: T.white, borderRadius: 16, padding: '20px 22px',
                  border: `1px solid ${T.ink10}`, boxShadow: SHADOW.card,
                }}
              >
                <YoutubeClipAutoPreviewObserver
                  clipIndex={i}
                  packResetKey={`${ytVideoId}-${ytClipsPackId}`}
                  onEnterView={requestAutoPreviewClip}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <span style={{
                    flexShrink: 0, minWidth: 40, height: 40, borderRadius: 12, background: T.ink, color: T.white,
                    fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.sans,
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: '0 0 6px', lineHeight: 1.3 }}>
                      {c.title}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.coral, margin: 0 }}>
                      {formatMmSs(c.start_sec)} â€“ {formatMmSs(c.end_sec)} Â· ~{Math.round(c.end_sec - c.start_sec)} s
                    </p>
                  </div>
                  <a
                    href={youtubeWatchUrl(ytVideoId, c.start_sec)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600,
                      color: '#C41E3A', textDecoration: 'none', fontFamily: T.sans,
                      padding: '8px 14px', borderRadius: 10, border: `1px solid rgba(196,30,58,.25)`, background: '#fff',
                    }}
                  >
                    <ExternalLink size={16} strokeWidth={STROKE} />
                    Abrir en YouTube
                  </a>
                </div>

                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16, alignItems: 'flex-start',
                }}>
                  <div style={{ flexShrink: 0, width: '100%', maxWidth: 240 }}>
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 240,
                      aspectRatio: '9/16',
                      borderRadius: 14,
                      overflow: 'hidden',
                      background: '#0a0a0a',
                      border: `1px solid ${T.ink10}`,
                    }}>
                      {(ytAutomatedPreviewByClip[i] ?? ytCloudMp4UrlByClip[i]) ? (
                        <video
                          key={ytAutomatedPreviewByClip[i] ?? ytCloudMp4UrlByClip[i] ?? `clip-${i}`}
                          src={ytAutomatedPreviewByClip[i] ?? ytCloudMp4UrlByClip[i]}
                          controls
                          playsInline
                          preload="metadata"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            background: '#000',
                            zIndex: 2,
                          }}
                        >
                          Tu navegador no reproduce vÃ­deo embebido.
                        </video>
                      ) : (
                        <>
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundImage: `url(${youtubeThumbUrl(ytVideoId)})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              zIndex: 1,
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(180deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,.88) 100%)',
                            zIndex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 14,
                            textAlign: 'center',
                          }}>
                            <span style={{
                              fontSize: 12,
                              color: 'rgba(255,255,255,.94)',
                              lineHeight: 1.5,
                              fontFamily: T.sans,
                              fontWeight: 600,
                            }}>
                              {ytRenderingClipIndex === i
                                ? 'Generando tu clip vertical 9:16â€¦'
                                : 'AquÃ­ verÃ¡s el MP4 vertical generado. Si ya existe en tu proyecto en la nube, se muestra al instante; si no, se genera al ver la tarjeta (uno tras otro).'}
                            </span>
                          </div>
                        </>
                      )}
                      {ytRenderingClipIndex === i ? (
                        <OpusProgressOverlay visible pct={ytRenderFakeProgress} variant="render" />
                      ) : null}
                    </div>
                    <details style={{ marginTop: 10, fontSize: 11, color: T.ink40, fontFamily: T.sans }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 700, color: T.ink60 }}>
                        Referencia: mismo tramo en YouTube (16:9)
                      </summary>
                      <div style={{
                        marginTop: 8,
                        borderRadius: 10,
                        overflow: 'hidden',
                        aspectRatio: '9/16',
                        maxHeight: 220,
                        border: `1px solid ${T.ink10}`,
                        background: '#000',
                      }}>
                        <iframe
                          title={`Referencia YouTube clip ${i + 1}`}
                          src={youtubeEmbedClipUrl(
                            ytVideoId,
                            c.start_sec,
                            c.end_sec,
                            ytEmbedOrigin ? { origin: ytEmbedOrigin } : undefined,
                          )}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="strict-origin-when-cross-origin"
                          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                        />
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: 11, color: T.ink40, lineHeight: 1.45 }}>
                        Si el reproductor no carga (bloqueo de incrustaciÃ³n del vÃ­deo),{' '}
                        <a
                          href={youtubeWatchUrl(ytVideoId, c.start_sec)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: T.coral, fontWeight: 700 }}
                        >
                          abre este tramo en YouTube
                        </a>
                        .
                      </p>
                    </details>
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <p style={{
                      fontSize: 11, fontWeight: 800, color: T.ink40, letterSpacing: '.08em', margin: '0 0 8px',
                    }}>
                      MP4 VERTICAL 9:16 (AUTOMATIZACIÃ“N)
                    </p>
                    <p style={{ fontSize: 12, color: T.ink60, margin: '0 0 14px', lineHeight: 1.55 }}>
                      El recuadro muestra el <strong>MP4 9:16 real</strong> (desde la nube si ya lo generaste, o tras el render).{' '}
                      <strong>Descargar MP4</strong> baja el archivo sin volver a procesar cuando ya estÃ¡ listo.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => downloadOrRenderYoutubeClipMp4(i)}
                        disabled={
                          ytRenderingClipIndex !== null ||
                          ytRenderZipLoading ||
                          !ytUrl.trim()
                        }
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 18px',
                          borderRadius: 10,
                          border: '1px solid rgba(196,30,58,.35)',
                          background: '#C41E3A',
                          color: T.white,
                          fontWeight: 600,
                          fontSize: 13,
                          fontFamily: T.sans,
                          cursor:
                            ytRenderingClipIndex !== null || ytRenderZipLoading || !ytUrl.trim()
                              ? 'wait'
                              : 'pointer',
                          opacity:
                            ytRenderingClipIndex !== null || ytRenderZipLoading || !ytUrl.trim()
                              ? 0.65
                              : 1,
                        }}
                      >
                        <Download size={18} strokeWidth={1.75} aria-hidden />
                        {ytRenderingClipIndex === i
                          ? 'Generando y descargandoâ€¦'
                          : (ytAutomatedPreviewByClip[i] ?? ytCloudMp4UrlByClip[i])
                            ? 'Descargar MP4 otra vez'
                            : 'Descargar MP4 9:16'}
                      </button>
                      {(ytAutomatedPreviewByClip[i] ?? ytCloudMp4UrlByClip[i]) ? (
                        <button
                          type="button"
                          onClick={() => { void generateYoutubeRenderClipPreview(i, { alsoDownload: true }) }}
                          disabled={
                            ytRenderingClipIndex !== null ||
                            ytRenderZipLoading ||
                            !ytUrl.trim()
                          }
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: `1px solid ${T.ink20}`,
                            background: T.white,
                            color: T.ink,
                            fontWeight: 600,
                            fontSize: 12,
                            fontFamily: T.sans,
                            cursor: ytRenderingClipIndex !== null ? 'wait' : 'pointer',
                            opacity: ytRenderingClipIndex !== null ? 0.65 : 1,
                          }}
                        >
                          <CirclePlay size={16} strokeWidth={1.75} aria-hidden />
                          Regenerar y descargar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: `1px solid ${T.ink10}`,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setYtClipInfoModalIndex(i)
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: isPro ? '2px solid #0C0C0C' : `1px solid ${T.ink20}`,
                      background: isPro ? T.ink : T.paper,
                      color: isPro ? T.white : T.ink,
                      fontWeight: 800,
                      fontSize: 12,
                      letterSpacing: '.1em',
                      fontFamily: T.sans,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    <Info size={18} strokeWidth={2} aria-hidden />
                    INFORMACIÃ“N
                    {!isPro ? (
                      <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>+ Pro</span>
                    ) : null}
                  </button>
                  {!isPro ? (
                    <span style={{ fontSize: 12, color: T.ink40, lineHeight: 1.45 }}>
                      Ver el tÃ­tulo del short en el modal; copy, hashtags y checklist con Pro.
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {ytClipInfoModalIndex !== null && ytClips[ytClipInfoModalIndex] ? (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10040,
            background: 'rgba(12,12,12,.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setYtClipInfoModalIndex(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="yt-clip-info-title"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 560,
              maxHeight: 'min(88vh, 720px)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 16,
              background: T.white,
              border: `1px solid ${T.ink10}`,
              boxShadow: '0 24px 60px rgba(0,0,0,.2)',
            }}
          >
            <div style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              padding: '16px 18px',
              borderBottom: `1px solid ${T.ink10}`,
              background: T.paper,
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '.12em',
                  color: isPro ? T.violet : T.ink40,
                  textTransform: 'uppercase',
                }}>
                  {isPro ? 'Pro Â· guÃ­a del clip' : 'InformaciÃ³n del clip'}
                </p>
                <h3
                  id="yt-clip-info-title"
                  style={{
                    margin: '6px 0 0',
                    fontFamily: T.serif,
                    fontSize: 18,
                    fontWeight: 700,
                    color: T.ink,
                    lineHeight: 1.3,
                  }}
                >
                  {ytClips[ytClipInfoModalIndex].title}
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: T.ink40 }}>
                  Clip {ytClipInfoModalIndex + 1} Â· {formatMmSs(ytClips[ytClipInfoModalIndex].start_sec)} â€“{' '}
                  {formatMmSs(ytClips[ytClipInfoModalIndex].end_sec)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setYtClipInfoModalIndex(null)}
                style={{
                  flexShrink: 0,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${T.ink10}`,
                  background: T.white,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: T.sans,
                }}
              >
                Cerrar
              </button>
            </div>
            <div style={{
              overflowY: 'auto',
              padding: '18px 20px 22px',
              WebkitOverflowScrolling: 'touch',
            }}>
              {isPro ? (
                <YoutubeClipPremiumInfoContent c={ytClips[ytClipInfoModalIndex]} />
              ) : (
                <div style={{
                  padding: '16px 18px',
                  borderRadius: 12,
                  background: T.paper,
                  border: `1px dashed ${T.ink20}`,
                }}>
                  <p style={{ margin: 0, fontSize: 14, color: T.ink60, lineHeight: 1.6 }}>
                    <strong style={{ color: T.ink }}>Plan Pro:</strong> desbloquea la guÃ­a completa de este short
                    (hook, descripciÃ³n para publicar, hashtags, plataformas, checklist de ediciÃ³n, textos en pantalla,
                    etc.).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {ytCloudClipInfoModal ? (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10041,
            background: 'rgba(12,12,12,.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setYtCloudClipInfoModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="yt-cloud-clip-info-title"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth:
                ytCloudClipInfoModal.premiumClip ||
                (isPro && ytCloudClipInfoModal.fallbackDesc)
                  ? 560
                  : 520,
              maxHeight:
                ytCloudClipInfoModal.premiumClip ||
                (isPro && ytCloudClipInfoModal.fallbackDesc)
                  ? 'min(90vh, 820px)'
                  : 'min(88vh, 680px)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 16,
              background: '#1a1a1a',
              border: '1px solid #333',
              boxShadow: '0 24px 60px rgba(0,0,0,.45)',
            }}
          >
            <div style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              padding: '16px 18px',
              borderBottom: '1px solid #333',
              background: '#141414',
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '.12em',
                  color: ytCloudClipInfoModal.premiumClip ? T.violet : '#9ca3af',
                  textTransform: 'uppercase',
                }}>
                  {ytCloudClipInfoModal.premiumClip ? 'Pro Â· guÃ­a del clip' : 'InformaciÃ³n del clip'}
                </p>
                <h3
                  id="yt-cloud-clip-info-title"
                  style={{
                    margin: '6px 0 0',
                    fontFamily: T.serif,
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#fff',
                    lineHeight: 1.3,
                  }}
                >
                  {ytCloudClipInfoModal.title}
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af' }}>
                  {ytCloudClipInfoModal.clipTiming ? (
                    <>
                      Clip {ytCloudClipInfoModal.clipNum} Â·{' '}
                      {formatMmSs(ytCloudClipInfoModal.clipTiming.start_sec)} â€“{' '}
                      {formatMmSs(ytCloudClipInfoModal.clipTiming.end_sec)} Â· proyecto en la nube
                    </>
                  ) : (
                    <>Clip {ytCloudClipInfoModal.clipNum} Â· proyecto en la nube</>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setYtCloudClipInfoModal(null)}
                style={{
                  flexShrink: 0,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #444',
                  background: '#252525',
                  color: '#ddd',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: T.sans,
                }}
              >
                Cerrar
              </button>
            </div>
            <div style={{
              overflowY: 'auto',
              padding: '18px 20px 22px',
              WebkitOverflowScrolling: 'touch',
            }}>
              {ytCloudClipInfoModal.premiumClip ? (
                <div style={{
                  marginBottom: 16,
                  padding: '16px 18px 18px',
                  borderRadius: 12,
                  background: T.paper,
                  border: `1px solid ${T.ink10}`,
                }}>
                  <YoutubeClipPremiumInfoContent c={ytCloudClipInfoModal.premiumClip} />
                </div>
              ) : null}
              {!isPro ? (
                <div style={{
                  marginBottom: 16,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,.06)',
                  border: '1px dashed rgba(255,255,255,.22)',
                }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#d1d5db', lineHeight: 1.55 }}>
                    <strong style={{ color: '#fff' }}>Plan Pro:</strong> desbloquea la guÃ­a completa (hook, copy para
                    publicar, hashtags, plataformas, checklist de ediciÃ³n, textos en pantallaâ€¦).
                  </p>
                </div>
              ) : null}
              {isPro && ytCloudClipInfoModal.fallbackDesc ? (
                <p style={{
                  margin: '0 0 16px',
                  fontSize: 13,
                  color: '#9ca3af',
                  lineHeight: 1.55,
                }}>
                  {ytCloudClipInfoModal.fallbackDesc}
                </p>
              ) : null}
              {ytCloudClipInfoModal.downloadUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    downloadCloudSessionMp4(
                      ytCloudClipInfoModal.downloadUrl!,
                      ytCloudClipInfoModal.filenameHint,
                    )
                  }}
                  style={{
                    marginTop: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(125,211,160,.45)',
                    background: 'rgba(34,197,94,.12)',
                    color: '#7dd3a0',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: T.sans,
                  }}
                >
                  <Download size={18} strokeWidth={1.75} aria-hidden />
                  Descargar MP4
                </button>
              ) : (
                <p style={{ margin: '16px 0 0', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                  AÃºn no hay MP4 en la nube para este clip.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
      </>
      )}
    </div>
  )
}
