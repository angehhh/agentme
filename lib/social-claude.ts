import Anthropic from '@anthropic-ai/sdk';
import type { SocialPlanTier } from '@/lib/social-limits';
import { EDITORIAL_DAYS, HOOK_LAB_COUNTS } from '@/lib/social-limits';
import { getEditorialFreePrompt, getEditorialProPrompt, getHookLabFreePrompt, getHookLabProPrompt, } from '@/lib/prompts/social';
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
export type EditorialFormat = 'carrusel' | 'reel' | 'hilo';
export type EditorialPost = {
    day: number;
    day_label: string;
    format: EditorialFormat;
    title: string;
    hook: string;
    outline: string[];
    cta: string;
    platforms: string;
    hashtags?: string;
    production_tip?: string;
};
export type EditorialCalendarResult = {
    week_theme: string;
    posts: EditorialPost[];
};
export type EditorialCalendarGenResult = {
    ok: true;
    calendar: EditorialCalendarResult;
} | {
    ok: false;
    reason: 'missing_api_key' | 'api_or_parse';
};
function parseAssistantJsonObject<T>(raw: string): T {
    let s = raw.trim();
    const fenced = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```/im.exec(s);
    if (fenced)
        s = fenced[1].trim();
    else if (s.startsWith('```')) {
        s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    }
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start === -1 || end <= start) {
        throw new SyntaxError('No se encontró un objeto JSON en la respuesta del modelo');
    }
    return JSON.parse(s.slice(start, end + 1)) as T;
}
const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export async function generateEditorialCalendar(params: {
    niche: string;
    audience?: string;
    tone?: string;
    mainPlatform?: string;
    language?: string;
    tier: SocialPlanTier;
}): Promise<EditorialCalendarGenResult> {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
        return { ok: false, reason: 'missing_api_key' };
    }
    const { niche, audience = 'público general interesado en el nicho', tone = 'profesional y cercano', mainPlatform = 'Instagram', language = 'español', tier, } = params;
    const nicheTrim = niche.trim();
    if (!nicheTrim)
        return { ok: false, reason: 'api_or_parse' };
    const targetDays = tier === 'free' ? EDITORIAL_DAYS.free : EDITORIAL_DAYS.pro;
    const isPro = tier === 'pro';
    const paramsPrompt = { nicheTrim, audience, tone, mainPlatform, language };
    const freePrompt = getEditorialFreePrompt(paramsPrompt);
    const proPrompt = getEditorialProPrompt(paramsPrompt);
    try {
        const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: isPro ? 4096 : 2048,
            messages: [{
                    role: 'user',
                    content: isPro ? proPrompt : freePrompt,
                }],
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const parsed = parseAssistantJsonObject<{
            week_theme?: string;
            posts?: Array<{
                day?: number;
                day_label?: string;
                format?: string;
                title?: string;
                hook?: string;
                outline?: unknown;
                cta?: string;
                platforms?: string;
                hashtags?: string;
                production_tip?: string;
            }>;
        }>(text);
        const formats: EditorialFormat[] = ['carrusel', 'reel', 'hilo'];
        const normFormat = (f: string | undefined): EditorialFormat => {
            const x = (f || '').toLowerCase();
            if (x.includes('reel'))
                return 'reel';
            if (x.includes('hilo') || x.includes('thread'))
                return 'hilo';
            return 'carrusel';
        };
        const maxDay = targetDays;
        const raw = Array.isArray(parsed.posts) ? parsed.posts : [];
        const posts: EditorialPost[] = raw.slice(0, maxDay).map((p, i) => {
            const outline = Array.isArray(p.outline)
                ? p.outline.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
                : [];
            const outlineCap = isPro ? outline : outline.slice(0, 2);
            const base: EditorialPost = {
                day: typeof p.day === 'number' && p.day >= 1 && p.day <= maxDay ? p.day : i + 1,
                day_label: typeof p.day_label === 'string' && p.day_label.trim() ? p.day_label.trim() : WEEKDAYS[i] || `Día ${i + 1}`,
                format: formats.includes(normFormat(p.format)) ? normFormat(p.format) : 'carrusel',
                title: typeof p.title === 'string' ? p.title.trim() : `Idea ${i + 1}`,
                hook: typeof p.hook === 'string' ? p.hook.trim() : '',
                outline: outlineCap.length
                    ? outlineCap
                    : isPro
                        ? ['Gancho', 'Desarrollo', 'Cierre con valor']
                        : ['Punto clave', 'Siguiente paso'],
                cta: typeof p.cta === 'string' ? p.cta.trim() : 'Guarda y comparte si te sirvió.',
                platforms: typeof p.platforms === 'string' ? p.platforms.trim() : mainPlatform,
            };
            if (isPro) {
                if (typeof p.hashtags === 'string' && p.hashtags.trim())
                    base.hashtags = p.hashtags.trim();
                if (typeof p.production_tip === 'string' && p.production_tip.trim()) {
                    base.production_tip = p.production_tip.trim();
                }
            }
            return base;
        });
        while (posts.length < maxDay) {
            const i = posts.length;
            const fmt: EditorialFormat = i % 3 === 0 ? 'carrusel' : i % 3 === 1 ? 'reel' : 'hilo';
            const pad: EditorialPost = {
                day: i + 1,
                day_label: WEEKDAYS[i] || `Día ${i + 1}`,
                format: fmt,
                title: `Idea ${fmt} sobre ${nicheTrim}`,
                hook: `¿Te pasa esto con ${nicheTrim}?`,
                outline: isPro
                    ? ['Gancho', 'Desarrollo', 'Cierre con valor']
                    : ['Idea principal', 'Qué hacer después'],
                cta: 'Comenta si quieres parte 2.',
                platforms: mainPlatform,
            };
            if (isPro) {
                pad.hashtags = `#${nicheTrim.split(/\s+/)[0]?.replace(/\W/g, '') || 'contenido'} #tips`;
                pad.production_tip = 'Plano medio + corte rápido al gancho.';
            }
            posts.push(pad);
        }
        return {
            ok: true,
            calendar: {
                week_theme: typeof parsed.week_theme === 'string' ? parsed.week_theme.trim() : 'Semana de contenido',
                posts: posts.slice(0, maxDay),
            },
        };
    }
    catch (e) {
        console.error('[social-claude] generateEditorialCalendar', e);
        return { ok: false, reason: 'api_or_parse' };
    }
}
export type HookLabAngle = {
    title: string;
    pitch: string;
};
export type HookLabResult = {
    topic: string;
    hooks: string[];
    angles: HookLabAngle[];
    sound_mood?: string;
    on_screen_texts?: string[];
};
export type HookLabGenResult = {
    ok: true;
    data: HookLabResult;
} | {
    ok: false;
    reason: 'missing_api_key' | 'api_or_parse';
};
export async function generateHookLab(params: {
    topic: string;
    audience?: string;
    tone?: string;
    language?: string;
    tier: SocialPlanTier;
    /** Contexto de pasos previos del pipeline (Pro); se inyecta en el prompt del pack final. */
    strategyAppendix?: string;
}): Promise<HookLabGenResult> {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
        return { ok: false, reason: 'missing_api_key' };
    }
    const { topic, audience = 'usuarios de TikTok, Reels y Shorts', tone = 'directo, energético, sin postureo', language = 'español', tier, strategyAppendix, } = params;
    const topicTrim = topic.trim();
    if (!topicTrim)
        return { ok: false, reason: 'api_or_parse' };
    const { hooks: nHooks, angles: nAngles } = tier === 'free' ? HOOK_LAB_COUNTS.free : HOOK_LAB_COUNTS.pro;
    const isPro = tier === 'pro';
    const paramsPrompt = { topicTrim, audience, tone, language, nHooks, nAngles, strategyBlock: strategyAppendix?.trim() || undefined };
    const freeContent = getHookLabFreePrompt(paramsPrompt);
    const proContent = getHookLabProPrompt(paramsPrompt);
    try {
        const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: isPro ? 4096 : 1536,
            messages: [{
                    role: 'user',
                    content: isPro ? proContent : freeContent,
                }],
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const parsed = parseAssistantJsonObject<{
            topic?: string;
            hooks?: unknown;
            angles?: unknown;
            sound_mood?: string;
            on_screen_texts?: unknown;
        }>(text);
        const rawHooks = Array.isArray(parsed.hooks) ? parsed.hooks : [];
        const hooks: string[] = rawHooks
            .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
            .map(h => h.trim())
            .slice(0, nHooks);
        while (hooks.length < nHooks) {
            hooks.push(`Hook ${hooks.length + 1}: ${topicTrim.slice(0, 48)}`);
        }
        const rawAngles = Array.isArray(parsed.angles) ? parsed.angles : [];
        const angles: HookLabAngle[] = rawAngles.slice(0, nAngles).map((a, i) => {
            if (a && typeof a === 'object' && !Array.isArray(a)) {
                const o = a as Record<string, unknown>;
                const title = typeof o.title === 'string' && o.title.trim()
                    ? o.title.trim()
                    : typeof o.name === 'string' && o.name.trim()
                        ? o.name.trim()
                        : `Ángulo ${i + 1}`;
                const pitch = typeof o.pitch === 'string' && o.pitch.trim()
                    ? o.pitch.trim()
                    : typeof o.idea === 'string' && o.idea.trim()
                        ? o.idea.trim()
                        : `Enfoca ${topicTrim} desde otra perspectiva.`;
                return { title, pitch };
            }
            if (typeof a === 'string' && a.trim()) {
                return { title: `Ángulo ${i + 1}`, pitch: a.trim() };
            }
            return {
                title: `Ángulo ${i + 1}`,
                pitch: `Plantea ${topicTrim} en formato vídeo corto.`,
            };
        });
        while (angles.length < nAngles) {
            const i = angles.length;
            angles.push({
                title: `Ángulo ${i + 1}`,
                pitch: `Otra forma de contar ${topicTrim}.`,
            });
        }
        const data: HookLabResult = {
            topic: typeof parsed.topic === 'string' && parsed.topic.trim() ? parsed.topic.trim() : topicTrim,
            hooks: hooks.slice(0, nHooks),
            angles: angles.slice(0, nAngles),
        };
        if (isPro) {
            if (typeof parsed.sound_mood === 'string' && parsed.sound_mood.trim()) {
                data.sound_mood = parsed.sound_mood.trim();
            }
            if (!data.sound_mood) {
                data.sound_mood = 'Voz en off clara + música tipo tendencia suave de fondo.';
            }
            const ost = Array.isArray(parsed.on_screen_texts)
                ? parsed.on_screen_texts.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map(s => s.trim())
                : [];
            const pad: string[] = [...ost];
            while (pad.length < 3) {
                pad.push(`Idea en pantalla ${pad.length + 1} · ${topicTrim.slice(0, 36)}`);
            }
            data.on_screen_texts = pad.slice(0, 3);
        }
        return { ok: true, data };
    }
    catch (e) {
        console.error('[social-claude] generateHookLab', e);
        return { ok: false, reason: 'api_or_parse' };
    }
}
