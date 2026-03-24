import Anthropic from '@anthropic-ai/sdk';
import type { JobResult, MarketStats } from './agent';
import { getAnalyzeJobsPrompt, getDiscoverCompaniesPrompt, getFilterCompaniesPrompt, getMarketInsightsPrompt, getOutreachPrompt, } from './prompts/opportunity';
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
export type AnalyzedJob = JobResult & {
    relevance: 'alta' | 'media' | 'baja';
    reason: string;
    tip?: string;
};
export type AnalysisResult = {
    jobs: AnalyzedJob[];
    summary: string;
};
export async function analyzeJobs(jobs: JobResult[], userQuery: string): Promise<AnalysisResult | null> {
    if (!process.env.ANTHROPIC_API_KEY || jobs.length === 0)
        return null;
    const jobList = jobs.map((j, i) => `${i + 1}. "${j.title}" en ${j.company || 'empresa desconocida'} (${j.location || 'ubicación no especificada'})`).join('\n');
    try {
        const prompt = getAnalyzeJobsPrompt({
            userQuery,
            jobList,
            numJobs: jobs.length
        });
        const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{
                    role: 'user',
                    content: prompt
                }]
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const parsed = JSON.parse(text);
        const analyzedJobs: AnalyzedJob[] = jobs.map((job, i) => {
            const ranking = parsed.rankings?.find((r: {
                index: number;
            }) => r.index === i + 1);
            return {
                ...job,
                relevance: ranking?.relevance || 'media',
                reason: ranking?.reason || '',
                tip: ranking?.tip || '',
            };
        });
        analyzedJobs.sort((a, b) => {
            const order = { alta: 0, media: 1, baja: 2 };
            return order[a.relevance] - order[b.relevance];
        });
        return {
            jobs: analyzedJobs,
            summary: parsed.summary || '',
        };
    }
    catch (error) {
        console.error('[Claude] Error analyzing jobs:', error);
        return null;
    }
}
export type MarketInsight = {
    trends: string;
    salaryRange: string;
    topCities: {
        city: string;
        demand: string;
    }[];
    tip: string;
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
    if (start === -1 || end <= start)
        throw new SyntaxError('No se encontró JSON en la respuesta del modelo');
    return JSON.parse(s.slice(start, end + 1)) as T;
}

export type CompanyCatalogRow = {
    name: string;
    job_count: number;
    sample_titles: string[];
    sector_guess?: string;
    angle?: string;
    explore?: string[];
};

export type CompanyFilteredRow = CompanyCatalogRow & {
    focus: 'primary' | 'secondary' | 'out';
    filter_reason?: string;
};

export type OutreachDraft = {
    job_url: string;
    company: string;
    title: string;
    linkedin_note: string;
    email_opener: string;
    one_liner_value: string;
};

export function aggregateCompaniesFromJobs(jobs: JobResult[]): CompanyCatalogRow[] {
    const byName = new Map<string, { titles: string[] }>();
    for (const j of jobs) {
        const name = (j.company || '').trim() || 'Sin nombre';
        const cur = byName.get(name) || { titles: [] };
        if (j.title && cur.titles.length < 4)
            cur.titles.push(j.title.trim());
        byName.set(name, cur);
    }
    return [...byName.entries()]
        .map(([name, { titles }]) => ({
            name,
            job_count: jobs.filter(x => (x.company || '').trim() === name || (name === 'Sin nombre' && !(x.company || '').trim())).length,
            sample_titles: titles,
        }))
        .sort((a, b) => b.job_count - a.job_count);
}

function fixJobCount(rows: CompanyCatalogRow[], jobs: JobResult[]): CompanyCatalogRow[] {
    return rows.map(r => ({
        ...r,
        job_count: jobs.filter(j => (j.company || '').trim() === r.name || (r.name === 'Sin nombre' && !(j.company || '').trim())).length,
    }));
}

export async function enrichCompanyCatalog(rows: CompanyCatalogRow[], userQuery: string, location: string, jobs: JobResult[]): Promise<CompanyCatalogRow[] | null> {
    if (!process.env.ANTHROPIC_API_KEY || rows.length === 0)
        return null;
    const companyLines = rows.map((r, i) => `${i + 1}. ${r.name} — ${r.job_count} oferta(s) — ejemplos: ${r.sample_titles.slice(0, 3).join('; ') || 'n/d'}`).join('\n');
    try {
        const prompt = getDiscoverCompaniesPrompt({ userQuery, location, companyLines });
        const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const parsed = parseAssistantJsonObject<{ companies?: Array<{
            name?: string;
            sector_guess?: string;
            angle?: string;
            explore?: unknown;
        }> }>(text);
        const list = Array.isArray(parsed.companies) ? parsed.companies : [];
        const byLower = new Map(rows.map(r => [r.name.toLowerCase(), r]));
        const merged: CompanyCatalogRow[] = rows.map(base => {
            const hit = list.find(c => (c.name || '').trim().toLowerCase() === base.name.toLowerCase())
                || list.find(c => base.name.toLowerCase().includes((c.name || '').trim().toLowerCase()));
            const ex = hit?.explore;
            const explore = Array.isArray(ex)
                ? ex.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map(s => s.trim()).slice(0, 4)
                : undefined;
            return {
                ...base,
                sector_guess: typeof hit?.sector_guess === 'string' ? hit.sector_guess.trim() : undefined,
                angle: typeof hit?.angle === 'string' ? hit.angle.trim() : undefined,
                explore,
            };
        });
        for (const c of list) {
            const n = typeof c.name === 'string' ? c.name.trim() : '';
            if (!n || byLower.has(n.toLowerCase()))
                continue;
            merged.push({
                name: n,
                job_count: 0,
                sample_titles: [],
                sector_guess: typeof c.sector_guess === 'string' ? c.sector_guess.trim() : undefined,
                angle: typeof c.angle === 'string' ? c.angle.trim() : undefined,
                explore: Array.isArray(c.explore)
                    ? c.explore.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map(s => s.trim()).slice(0, 4)
                    : undefined,
            });
        }
        return fixJobCount(merged, jobs);
    }
    catch (e) {
        console.error('[Claude] enrichCompanyCatalog', e);
        return null;
    }
}

export async function filterCompanyCatalog(rows: CompanyCatalogRow[], userQuery: string, location: string): Promise<CompanyFilteredRow[] | null> {
    if (!process.env.ANTHROPIC_API_KEY || rows.length === 0)
        return null;
    const companyBlock = rows.map((r, i) => `${i + 1}. ${r.name} | vacantes en muestra: ${r.job_count} | sector (estimado): ${r.sector_guess || 'n/d'} | nota: ${r.angle || 'n/d'}`).join('\n');
    try {
        const prompt = getFilterCompaniesPrompt({ userQuery, location, companyBlock });
        const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const parsed = parseAssistantJsonObject<{ results?: Array<{ name?: string; focus?: string; reason?: string }> }>(text);
        const results = Array.isArray(parsed.results) ? parsed.results : [];
        const normFocus = (f: string | undefined): 'primary' | 'secondary' | 'out' => {
            const x = (f || '').toLowerCase();
            if (x === 'primary' || x === 'secondary' || x === 'out')
                return x;
            return 'secondary';
        };
        return rows.map(base => {
            const hit = results.find(r => (r.name || '').trim().toLowerCase() === base.name.toLowerCase());
            return {
                ...base,
                focus: normFocus(hit?.focus),
                filter_reason: typeof hit?.reason === 'string' ? hit.reason.trim() : undefined,
            };
        });
    }
    catch (e) {
        console.error('[Claude] filterCompanyCatalog', e);
        return null;
    }
}

export async function generateOutreachDrafts(jobs: AnalyzedJob[], userQuery: string, limit: number): Promise<OutreachDraft[] | null> {
    if (!process.env.ANTHROPIC_API_KEY || jobs.length === 0)
        return null;
    const slice = jobs.slice(0, Math.max(1, Math.min(limit, 8)));
    const jobsBlock = slice.map((j, i) => `${i + 1}. ${j.title} @ ${j.company || '—'} | relevancia: ${j.relevance || 'n/d'} | ${j.url}`).join('\n');
    try {
        const prompt = getOutreachPrompt({ userQuery, jobsBlock });
        const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const parsed = parseAssistantJsonObject<{ items?: Array<{
            job_url?: string;
            linkedin_note?: string;
            email_opener?: string;
            one_liner_value?: string;
        }> }>(text);
        const items = Array.isArray(parsed.items) ? parsed.items : [];
        return slice.map((j, i) => {
            const hit = items.find(x => (x.job_url || '').trim() === j.url) || items[i];
            return {
                job_url: j.url,
                company: j.company || '',
                title: j.title,
                linkedin_note: typeof hit?.linkedin_note === 'string' ? hit.linkedin_note.trim().slice(0, 320) : '',
                email_opener: typeof hit?.email_opener === 'string' ? hit.email_opener.trim() : '',
                one_liner_value: typeof hit?.one_liner_value === 'string' ? hit.one_liner_value.trim() : '',
            };
        });
    }
    catch (e) {
        console.error('[Claude] generateOutreachDrafts', e);
        return null;
    }
}

export async function generateMarketInsights(jobs: JobResult[], query: string, stats: MarketStats, location: string): Promise<MarketInsight | null> {
    if (!process.env.ANTHROPIC_API_KEY || jobs.length === 0)
        return null;
    const cityList = Object.entries(stats.cityDistribution)
        .sort(([, a], [, b]) => b - a)
        .map(([city, count]) => `${city}: ${count}`)
        .join(', ');
    const titles = jobs.map(j => j.title).join(', ');
    try {
        const prompt = getMarketInsightsPrompt({
            query,
            location,
            totalLinkedIn: stats.totalLinkedIn,
            cityList,
            titles
        });
        const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 512,
            messages: [{
                    role: 'user',
                    content: prompt
                }]
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        return JSON.parse(text) as MarketInsight;
    }
    catch (error) {
        console.error('[Claude] Market insights error:', error);
        return null;
    }
}
