import Anthropic from '@anthropic-ai/sdk';
import type { JobResult, MarketStats } from './agent';
import { getAnalyzeJobsPrompt, getMarketInsightsPrompt } from './prompts/opportunity';
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
