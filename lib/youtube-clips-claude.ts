import Anthropic from '@anthropic-ai/sdk';
import type { SocialPlanTier } from '@/lib/social-limits';
import { getYoutubeClipsPrompt } from './prompts/media';
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
export type YoutubeVerticalClip = {
    start_sec: number;
    end_sec: number;
    title: string;
    hook_overlay: string;
    why_stops_scroll: string;
    nine_sixteen_framing: string;
    safe_zones_caption: string;
    on_screen_text_suggestions: string[];
    sound_hook: string;
    cta_end: string;
    estimated_virality_1_10: number;
    publish_description: string;
    suggested_hashtags: string[];
    best_platforms: string[];
    thumbnail_cover_idea: string;
    edit_checklist: string[];
    dynamic_caption_style: string;
};
export type YoutubeClipsResult = {
    video_title_hint?: string;
    clips: YoutubeVerticalClip[];
};
export type YoutubeClipsGenResult = {
    ok: true;
    data: YoutubeClipsResult;
} | {
    ok: false;
    reason: 'missing_api_key' | 'api_or_parse';
};
export const YOUTUBE_CLIPS_TARGET_COUNT = { pro: 12, free: 4 } as const;
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
export async function generateYoutubeVerticalClips(params: {
    timedTranscript: string;
    videoTitle: string | null;
    videoDurationSec: number;
    tier: SocialPlanTier;
    language: string;
}): Promise<YoutubeClipsGenResult> {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
        return { ok: false, reason: 'missing_api_key' };
    }
    const { timedTranscript, videoTitle, videoDurationSec, tier, language } = params;
    if (!timedTranscript.trim())
        return { ok: false, reason: 'api_or_parse' };
    const clipCount = tier === 'pro' ? YOUTUBE_CLIPS_TARGET_COUNT.pro : YOUTUBE_CLIPS_TARGET_COUNT.free;
    const titleLine = videoTitle ? `Título del vídeo (YouTube): ${videoTitle}` : 'Título: desconocido';
    const prompt = getYoutubeClipsPrompt({
        titleLine,
        videoDurationSec,
        language,
        timedTranscript,
        clipCount
    });
    try {
        const maxOutTokens = tier === 'pro' ? 32768 : 8192;
        const MAX_RETRIES = 3;
        let lastError: unknown = null;

        let msg: Anthropic.Message | null = null;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const stream = anthropic.messages.stream({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: maxOutTokens,
                    messages: [{ role: 'user', content: prompt }],
                });
                msg = await stream.finalMessage();
                break;
            } catch (err: unknown) {
                lastError = err;
                const isOverloaded = err instanceof Error && 
                    (err.message?.includes('Overloaded') || err.message?.includes('overloaded'));
                const isRateLimit = err instanceof Error && 
                    (err.message?.includes('rate_limit') || err.message?.includes('429'));
                if ((isOverloaded || isRateLimit) && attempt < MAX_RETRIES - 1) {
                    const delay = Math.pow(2, attempt + 1) * 1000 + Math.random() * 1000;
                    console.warn(`[youtube-clips-claude] API overloaded, retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                throw err;
            }
        }

        if (!msg) {
            console.error('[youtube-clips-claude] All retries failed', lastError);
            return { ok: false, reason: 'api_or_parse' };
        }

        const text = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
        const raw = parseAssistantJsonObject<{
            video_title_hint?: string;
            clips?: Record<string, unknown>[];
        }>(text);
        const clips = Array.isArray(raw.clips)
            ? raw.clips
                .map((c): YoutubeVerticalClip => {
                const strArr = (k: string) => Array.isArray(c[k]) ? (c[k] as unknown[]).map(x => String(x)) : [];
                return {
                    start_sec: Number(c.start_sec),
                    end_sec: Number(c.end_sec),
                    title: String(c.title ?? '').trim(),
                    hook_overlay: String(c.hook_overlay ?? '').trim(),
                    why_stops_scroll: String(c.why_stops_scroll ?? '').trim(),
                    nine_sixteen_framing: String(c.nine_sixteen_framing ?? '').trim(),
                    safe_zones_caption: String(c.safe_zones_caption ?? '').trim(),
                    on_screen_text_suggestions: strArr('on_screen_text_suggestions'),
                    sound_hook: String(c.sound_hook ?? '').trim(),
                    cta_end: String(c.cta_end ?? '').trim(),
                    estimated_virality_1_10: Math.min(10, Math.max(1, Math.round(Number(c.estimated_virality_1_10) || 5))),
                    publish_description: String(c.publish_description ?? '').trim(),
                    suggested_hashtags: strArr('suggested_hashtags'),
                    best_platforms: strArr('best_platforms'),
                    thumbnail_cover_idea: String(c.thumbnail_cover_idea ?? '').trim(),
                    edit_checklist: strArr('edit_checklist'),
                    dynamic_caption_style: String(c.dynamic_caption_style ?? '').trim(),
                };
            })
                .filter(c => c.end_sec > c.start_sec && c.title.length > 0)
            : [];
        if (!clips.length)
            return { ok: false, reason: 'api_or_parse' };
        if (msg.stop_reason === 'max_tokens') {
            console.warn('[youtube-clips-claude] stop_reason=max_tokens', {
                tier,
                clipsParsed: clips.length,
                target: clipCount,
            });
        }
        let outClips = clips;
        if (outClips.length > clipCount) {
            outClips = outClips.slice(0, clipCount);
        }
        if (tier === 'pro' && outClips.length < clipCount && videoDurationSec >= 120) {
            console.warn('[youtube-clips-claude] Pro devolvió menos clips que el objetivo', {
                got: outClips.length,
                target: clipCount,
                durationSec: Math.round(videoDurationSec),
            });
        }
        return {
            ok: true,
            data: {
                video_title_hint: typeof raw.video_title_hint === 'string' ? raw.video_title_hint : undefined,
                clips: outClips,
            },
        };
    }
    catch (e) {
        console.error('[youtube-clips-claude]', e);
        return { ok: false, reason: 'api_or_parse' };
    }
}
