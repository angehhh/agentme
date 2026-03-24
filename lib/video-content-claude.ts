import Anthropic from '@anthropic-ai/sdk';
import type { SocialPlanTier } from '@/lib/social-limits';
import { getVideoContentPrompt } from './prompts/media';
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
export type VideoContentPack = {
    summary: string;
    key_takeaways: string[];
    hook_suggestions: string[];
    caption_short: string;
    caption_long: string;
    thread_outline: string[];
    hashtags: string[];
    cta_ideas: string[];
    quote_cards: string[];
};
export type VideoContentGenResult = {
    ok: true;
    pack: VideoContentPack;
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
const MAX_TRANSCRIPT_CHARS = 48000;
export async function generateVideoContentPack(params: {
    transcript: string;
    tier: SocialPlanTier;
    language?: string;
    nicheHint?: string;
}): Promise<VideoContentGenResult> {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
        return { ok: false, reason: 'missing_api_key' };
    }
    const { tier, language = 'español', nicheHint } = params;
    let transcript = params.transcript.trim();
    if (!transcript)
        return { ok: false, reason: 'api_or_parse' };
    const truncated = transcript.length > MAX_TRANSCRIPT_CHARS;
    if (truncated) {
        transcript = transcript.slice(0, MAX_TRANSCRIPT_CHARS);
    }
    const isPro = tier === 'pro';
    const counts = isPro
        ? {
            takeaways: 6,
            hooks: 12,
            thread: 8,
            hashtags: 12,
            cta: 4,
            quotes: 5,
        }
        : {
            takeaways: 3,
            hooks: 5,
            thread: 4,
            hashtags: 6,
            cta: 2,
            quotes: 2,
        };
    const nicheLine = nicheHint?.trim()
        ? `Contexto del creador (opcional): ${nicheHint.trim()}`
        : 'Sin contexto extra del creador.';
    const prompt = getVideoContentPrompt({
        language,
        nicheLine,
        truncated,
        transcript,
        counts
    });
    try {
        const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: isPro ? 4096 : 2048,
            messages: [{ role: 'user', content: prompt }],
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const raw = parseAssistantJsonObject<VideoContentPack>(text);
        const pack: VideoContentPack = {
            summary: String(raw.summary ?? '').trim(),
            key_takeaways: Array.isArray(raw.key_takeaways) ? raw.key_takeaways.map(String) : [],
            hook_suggestions: Array.isArray(raw.hook_suggestions) ? raw.hook_suggestions.map(String) : [],
            caption_short: String(raw.caption_short ?? '').trim(),
            caption_long: String(raw.caption_long ?? '').trim(),
            thread_outline: Array.isArray(raw.thread_outline) ? raw.thread_outline.map(String) : [],
            hashtags: Array.isArray(raw.hashtags) ? raw.hashtags.map(String) : [],
            cta_ideas: Array.isArray(raw.cta_ideas) ? raw.cta_ideas.map(String) : [],
            quote_cards: Array.isArray(raw.quote_cards) ? raw.quote_cards.map(String) : [],
        };
        if (!pack.summary && pack.key_takeaways.length === 0) {
            return { ok: false, reason: 'api_or_parse' };
        }
        return { ok: true, pack };
    }
    catch (e) {
        console.error('[video-content-claude]', e);
        return { ok: false, reason: 'api_or_parse' };
    }
}
