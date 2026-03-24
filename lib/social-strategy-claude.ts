import Anthropic from '@anthropic-ai/sdk';
import { getSocialAnalyzeNichePrompt, getSocialScriptIdeasPrompt, getSocialViralPatternsPrompt, } from '@/lib/prompts/social';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

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
    if (start === -1 || end <= start)
        throw new SyntaxError('No JSON');
    return JSON.parse(s.slice(start, end + 1)) as T;
}

export type SocialNicheAnalysis = {
    summary: string;
    keywords: string[];
    audience_insight: string;
};

export async function analyzeNicheForHookLab(params: {
    topic: string;
    audience: string;
    tone: string;
    language: string;
}): Promise<SocialNicheAnalysis | null> {
    if (!process.env.ANTHROPIC_API_KEY?.trim())
        return null;
    const topicTrim = params.topic.trim();
    if (!topicTrim)
        return null;
    const prompt = getSocialAnalyzeNichePrompt({
        topicTrim,
        audience: params.audience,
        tone: params.tone,
        language: params.language,
    });
    try {
        const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 512,
            messages: [{ role: 'user', content: prompt }],
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const parsed = parseAssistantJsonObject<{
            summary?: string;
            keywords?: unknown;
            audience_insight?: string;
        }>(text);
        const keywords = Array.isArray(parsed.keywords)
            ? parsed.keywords.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map(s => s.trim()).slice(0, 8)
            : [];
        return {
            summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : `Tema: ${topicTrim}`,
            keywords: keywords.length ? keywords : [topicTrim.slice(0, 40)],
            audience_insight: typeof parsed.audience_insight === 'string' ? parsed.audience_insight.trim() : '',
        };
    }
    catch (e) {
        console.error('[social-strategy-claude] analyzeNicheForHookLab', e);
        return null;
    }
}

export async function viralPatternsForHookLab(params: {
    topic: string;
    niche: SocialNicheAnalysis;
}): Promise<string[] | null> {
    if (!process.env.ANTHROPIC_API_KEY?.trim())
        return null;
    const topicTrim = params.topic.trim();
    const keywordsLine = params.niche.keywords.join(', ');
    const prompt = getSocialViralPatternsPrompt({
        topicTrim,
        nicheSummary: params.niche.summary,
        keywordsLine,
    });
    try {
        const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 768,
            messages: [{ role: 'user', content: prompt }],
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const parsed = parseAssistantJsonObject<{ patterns?: unknown }>(text);
        const raw = Array.isArray(parsed.patterns) ? parsed.patterns : [];
        const patterns = raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map(s => s.trim()).slice(0, 10);
        return patterns.length ? patterns : null;
    }
    catch (e) {
        console.error('[social-strategy-claude] viralPatternsForHookLab', e);
        return null;
    }
}

export async function scriptIdeasForHookLab(params: {
    topic: string;
    niche: SocialNicheAnalysis;
    patterns: string[];
}): Promise<string[] | null> {
    if (!process.env.ANTHROPIC_API_KEY?.trim())
        return null;
    const patternsBlock = params.patterns.map((p, i) => `${i + 1}. ${p}`).join('\n');
    const prompt = getSocialScriptIdeasPrompt({
        topicTrim: params.topic.trim(),
        nicheSummary: params.niche.summary,
        patternsBlock,
    });
    try {
        const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 768,
            messages: [{ role: 'user', content: prompt }],
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const parsed = parseAssistantJsonObject<{ ideas?: unknown }>(text);
        const raw = Array.isArray(parsed.ideas) ? parsed.ideas : [];
        const ideas = raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map(s => s.trim()).slice(0, 8);
        return ideas.length ? ideas : null;
    }
    catch (e) {
        console.error('[social-strategy-claude] scriptIdeasForHookLab', e);
        return null;
    }
}
