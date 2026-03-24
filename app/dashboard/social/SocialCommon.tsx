'use client';
import { useRef, useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Calendar, Check, Clipboard, Music, Paperclip, Smartphone, Video, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { EditorialPost } from '@/lib/social-claude';
import type { YoutubeVerticalClip } from '@/lib/youtube-clips-claude';
import { youtubeWatchUrl } from '@/lib/youtube-video-id';

export const T = {
    ink: '#0C0C0C', ink60: '#606060', ink40: '#909090', ink20: '#D8D8D8', ink10: '#E8E8E8',
    paper: '#F5F4F1', white: '#FFFFFF', green: '#28C840',
    coral: '#E85D4C', violet: '#7B68EE', blue: '#2563EB',
    serif: "'Playfair Display', Georgia, serif",
    sans: "'DM Sans', 'Helvetica Neue', sans-serif",
};

export const SHADOW = {
    card: '0 1px 2px rgba(12,12,12,.04), 0 8px 24px rgba(12,12,12,.07)',
    soft: '0 4px 20px rgba(12,12,12,.06)',
};

export const STROKE = 1.75;
export const ICON_TILE_BG = '#E6E6E4';

export const Ico = {
    calendar: Calendar,
    clipboard: Clipboard,
    check: Check,
    paperclip: Paperclip,
    camera: Video,
    zap: Zap,
    music: Music,
    mobile: Smartphone,
} as const satisfies Record<string, LucideIcon>;

export type SocialSection = 'hub' | 'editorial' | 'hooklab' | 'ytclips' | 'sleep';

export type YtCloudSession = {
    id: string;
    youtube_video_id: string;
    video_title: string;
    thumbnail_url: string;
    expires_label: string;
    expires_at: string;
    ready_assets: number;
    total_assets: number;
    clips_plan?: unknown;
};

export type YtCloudRenderProject = {
    id: string;
    title: string;
    kind: 'mp4' | 'zip';
    filename: string;
    clip_index?: number | null;
    created_at?: string;
    duration_sec: number | null;
    expires_at: string;
    expires_label: string;
    thumbnail_url: string;
    download_url: string | null;
};

export interface IconTileProps {
    icon: LucideIcon;
    box?: number;
    size?: number;
    background?: string;
    iconColor?: string;
}

export function IconTile({ icon: Icon, box = 44, size = 22, background = ICON_TILE_BG, iconColor = T.ink }: IconTileProps) {
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: box,
            height: box,
            borderRadius: 14,
            background,
            flexShrink: 0,
        }}>
            <Icon size={size} strokeWidth={STROKE} color={iconColor} aria-hidden />
        </span>
    );
}

export function StrokeIcon({ icon: Icon, size = 18, color = T.ink }: { icon: LucideIcon; size?: number; color?: string }) {
    return <Icon size={size} strokeWidth={STROKE} color={color} aria-hidden style={{ flexShrink: 0 }} />;
}

export function SectionLabel({ children, color, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
    return (
        <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: '.12em',
            textTransform: 'uppercase', color: color ?? T.ink40, marginBottom: 8, fontFamily: T.sans,
            ...style,
        }}>
            {children}
        </span>
    );
}

export function formatMmSs(sec: number): string {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
}

export function parseClipIndex(v: unknown): number | null {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number' && Number.isFinite(v)) return Math.floor(v);
    if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v);
        if (Number.isFinite(n)) return Math.floor(n);
    }
    return null;
}

export function splitHashtagTokens(s: string): string[] {
    return s.split(/\s+/).map(t => t.trim()).filter(Boolean);
}

export function OpusProgressOverlay({ visible, pct, variant = 'analysis' }: { visible: boolean; pct: number; variant?: 'analysis' | 'render' }) {
    if (!visible) return null;
    const isRender = variant === 'render';
    const accent = isRender ? '#4ADE80' : '#E85D4C';
    const bg = isRender ? 'rgba(0,0,0,.82)' : 'rgba(15,15,15,.88)';
    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 10, background: bg,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 24, textAlign: 'center', backdropFilter: 'blur(4px)',
        }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '.04em' }}>
                {isRender ? 'GENERANDO MP4 9:16' : 'ANALIZANDO VÍDEO CON IA'}
            </p>
            <div style={{ width: '100%', maxWidth: 200, height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: accent, transition: 'width .4s ease-out', boxShadow: `0 0 12px ${accent}66` }} />
            </div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: accent, fontFamily: 'ui-monospace, monospace' }}>
                {Math.floor(pct)}%
            </p>
            <p style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,.5)', lineHeight: 1.4, maxWidth: 180 }}>
                {isRender ? 'No cierres esta pestaña. Procesando FFmpeg en el servidor...' : 'Extrayendo transcripción y buscando momentos virales...'}
            </p>
        </div>
    );
}

export function YtProjectVideoGridGateOverlay({ progress, onBypass }: { progress: { required: number; ready: number }; onBypass: () => void }) {
    const pct = progress.required > 0 ? Math.round((progress.ready / progress.required) * 100) : 0;
    return (
        <div style={{
            position: 'absolute', inset: -1, zIndex: 20,
            background: 'rgba(20,20,20,.85)', backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 28, textAlign: 'center', borderRadius: 12,
        }}>
            <div style={{
                width: 64, height: 64, borderRadius: 20, background: 'rgba(74,222,128,.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
            }}>
                <div style={{ position: 'relative', width: 28, height: 28 }}>
                    <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(74,222,128,.2)', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', inset: 0, border: '3px solid #4ADE80', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                </div>
            </div>
            <h5 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#fff' }}>Generando clips en la nube</h5>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#999', lineHeight: 1.5, maxWidth: 320 }}>
                Estamos preparando los archivos MP4 9:16 de este pack. {progress.ready} de {progress.required} listos ({pct}%).
            </p>
            <div style={{ width: '100%', maxWidth: 240, height: 4, background: 'rgba(255,255,255,.05)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: '#4ADE80' }} />
            </div>
            <button type="button" onClick={onBypass} style={{
                background: 'none', border: 'none', padding: 0, margin: 0,
                color: '#666', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline',
            }}>
                Ver clips incompletos de todas formas
            </button>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

export function YoutubeClipAutoPreviewObserver({ clipIndex, onEnterView, packResetKey }: { clipIndex: number; onEnterView: (idx: number) => void; packResetKey: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const triggered = useRef(false);
    useEffect(() => { triggered.current = false; }, [packResetKey]);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !triggered.current) {
                triggered.current = true;
                onEnterView(clipIndex);
            }
        }, { threshold: 0.1 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [clipIndex, onEnterView, packResetKey]);
    return <div ref={ref} style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1, pointerEvents: 'none', visibility: 'hidden' }} />;
}

export type YoutubeVerticalClipWithIndex = YoutubeVerticalClip & { clip_index: number };

export function ensureYoutubeClipShape(c: any): YoutubeVerticalClipWithIndex {
    return {
        clip_index: parseClipIndex(c.clip_index) ?? 0,
        title: String(c.title || 'Clip sin título'),
        start_sec: Number(c.start_sec || 0),
        end_sec: Number(c.end_sec || 0),
        hook_overlay: String(c.hook_overlay || c.hook || ''),
        publish_description: String(c.publish_description || c.copy || ''),
        suggested_hashtags: Array.isArray(c.suggested_hashtags) ? c.suggested_hashtags : splitHashtagTokens(String(c.hashtags || '')),
        why_stops_scroll: String(c.why_stops_scroll || ''),
        nine_sixteen_framing: String(c.nine_sixteen_framing || ''),
        safe_zones_caption: String(c.safe_zones_caption || ''),
        on_screen_text_suggestions: Array.isArray(c.on_screen_text_suggestions) ? c.on_screen_text_suggestions : [],
        sound_hook: String(c.sound_hook || ''),
        cta_end: String(c.cta_end || ''),
        estimated_virality_1_10: Number(c.estimated_virality_1_10 || 5),
        best_platforms: Array.isArray(c.best_platforms) ? c.best_platforms : [],
        thumbnail_cover_idea: String(c.thumbnail_cover_idea || ''),
        edit_checklist: Array.isArray(c.edit_checklist) ? c.edit_checklist : [],
        dynamic_caption_style: String(c.dynamic_caption_style || ''),
    } as YoutubeVerticalClipWithIndex;
}

export function assignMp4sToPlanSlots(planClips: any[], assets: any[]): Record<number, any> {
    const mp4s = assets.filter(a => a.kind === 'mp4');
    const result: Record<number, any> = {};
    planClips.forEach((row, i) => {
        const idx = parseClipIndex(row.clip_index) ?? i;
        const match = mp4s.find(a => parseClipIndex(a.clip_index) === idx);
        if (match) result[i] = match;
    });
    return result;
}

export function formatYtDurationBadge(sec: number | null | undefined): string {
    if (sec == null || !Number.isFinite(sec) || sec <= 0) return '—';
    const m = Math.floor(sec / 60);
    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    if (m >= 1) return `${m}'`;
    return `${Math.round(sec)}s`;
}

export function buildClipsPlanPayload(clips: YoutubeVerticalClip[]) {
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
    };
}

export function etaLabelFromRemainingClips(remaining: number, secondsPerClip = 140): string {
    if (remaining <= 0) return '0m';
    const sec = remaining * secondsPerClip;
    const m = Math.max(1, Math.ceil(sec / 60));
    if (m >= 90) return `${Math.round(m / 60)}h`;
    return `${m}m`;
}

export function sessionClipProgressFromDetail(detail: {
    session: { clips_plan?: unknown };
    assets: YtCloudRenderProject[];
}): { required: number; ready: number; complete: boolean } {
    const plan = detail.session.clips_plan as { clips?: Array<Record<string, unknown>> } | null;
    const planClips = Array.isArray(plan?.clips) ? plan.clips : [];
    if (planClips.length > 0) {
        const slots = assignMp4sToPlanSlots(planClips, detail.assets);
        const ready = Object.values(slots).filter(s => s?.download_url).length;
        return { required: planClips.length, ready, complete: ready >= planClips.length };
    }
    const mp4s = detail.assets.filter(a => a.kind === 'mp4');
    const withUrl = mp4s.filter(a => a.download_url).length;
    const required = mp4s.length;
    if (required === 0) return { required: 0, ready: 0, complete: true };
    return { required, ready: withUrl, complete: withUrl >= required };
}

export function postToText(p: EditorialPost): string {
    const FORMAT_LABEL: Record<string, string> = { reel: 'Reel/Video corto', carousel: 'Carrusel dinámico', thread: 'Hilo/Post de texto' };
    const lines = [
        `## ${p.day_label} · ${FORMAT_LABEL[p.format] || p.format}`,
        `**${p.title}**`,
        '',
        `Hook: ${p.hook}`,
        '',
        ...p.outline.map((x, i) => `${i + 1}. ${x}`),
        '',
        `CTA: ${p.cta}`,
        '',
        `Redes: ${p.platforms}`,
    ];
    if (p.hashtags?.trim()) lines.push('', `Hashtags: ${p.hashtags.trim()}`);
    if (p.production_tip?.trim()) lines.push('', `Producción: ${p.production_tip.trim()}`);
    return lines.join('\n');
}

export function clipsToText(videoId: string, title: string | null, clips: YoutubeVerticalClip[]): string {
    const header = title || 'YouTube — clips 9:16';
    const lines = [
        `# ${header}`,
        `Video: https://www.youtube.com/watch?v=${videoId}`,
        '',
    ];
    clips.forEach((c, i) => {
        lines.push(
            `## Clip ${i + 1} · ${formatMmSs(c.start_sec)} – ${formatMmSs(c.end_sec)}`,
            `**${c.title}**`,
            `Enlace: ${youtubeWatchUrl(videoId, c.start_sec)}`,
            '',
            `Hook overlay: ${c.hook_overlay}`,
            `Por qué frena el scroll: ${c.why_stops_scroll}`,
            `Encuadre 9:16: ${c.nine_sixteen_framing}`,
            `Zonas seguras captions: ${c.safe_zones_caption}`,
            `Textos en pantalla: ${c.on_screen_text_suggestions.join(' | ')}`,
            `Sonido: ${c.sound_hook}`,
            `CTA final: ${c.cta_end}`,
            `Potencial (1-10): ${c.estimated_virality_1_10}`,
            '',
            `Descripción para publicar:`,
            c.publish_description || '—',
            '',
            `Hashtags: ${c.suggested_hashtags.length ? c.suggested_hashtags.join(' ') : '—'}`,
            `Plataformas recomendadas: ${c.best_platforms.length ? c.best_platforms.join(', ') : '—'}`,
            `Idea miniatura/cover: ${c.thumbnail_cover_idea || '—'}`,
            `Estilo captions dinámicos: ${c.dynamic_caption_style || '—'}`,
            '',
            `Checklist edición:`,
            ...(c.edit_checklist.length ? c.edit_checklist.map((x, j) => `${j + 1}. ${x}`) : ['—']),
            ''
        );
    });
    return lines.join('\n');
}
