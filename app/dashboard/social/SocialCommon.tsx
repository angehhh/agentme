'use client';
import type { CSSProperties, ReactNode } from 'react';
import { Calendar, Check, Clipboard, Music, Paperclip, Smartphone, Video, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { EditorialPost } from '@/lib/social-claude';

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

export type SocialSection = 'hub' | 'editorial' | 'hooklab' | 'sleep';

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

export function splitHashtagTokens(s: string): string[] {
    return s.split(/\s+/).map(t => t.trim()).filter(Boolean);
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
