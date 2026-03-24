import { scrapeLinkedInJobs, type AgentResult, type JobResult, type SearchFilters } from '@/lib/agent';
import {
    aggregateCompaniesFromJobs,
    analyzeJobs,
    enrichCompanyCatalog,
    filterCompanyCatalog,
    generateMarketInsights,
    generateOutreachDrafts,
    type AnalyzedJob,
    type CompanyCatalogRow,
    type CompanyFilteredRow,
    type MarketInsight,
    type OutreachDraft,
} from '@/lib/claude';
import { runAgentPipeline } from '@/lib/agents/orchestrator';
import type { StepHandler } from '@/lib/agents/executor';
import { runMemoryChecks } from '@/lib/agents/verifier';
import { resolveOpportunityPlan } from '@/lib/agents/planner';
import type { PlanStep } from '@/lib/agents/types';
import type { AgentMemory } from '@/lib/agents/memory';

export type OpportunityPipelineCtx = {
    query: string;
    location: string;
    filters: SearchFilters;
    isFree: boolean;
};

export type OpportunityAgentState = {
    jobs: (JobResult | AnalyzedJob)[];
    expandedSearch: boolean;
    searchedIn: string;
    marketStats: AgentResult['marketStats'];
    aiAnalysis: string | null;
    marketInsights: MarketInsight | null;
    enrichSkipped: boolean;
    companiesCatalog: CompanyCatalogRow[];
    companiesFiltered: CompanyFilteredRow[];
    outreachDrafts: OutreachDraft[];
};

function hydrateFromMemory(memory: AgentMemory, _base: OpportunityAgentState): OpportunityAgentState {
    const scrape = memory.get<AgentResult>('scrape_result');
    const jobs = memory.get<(JobResult | AnalyzedJob)[]>('jobs_final') ?? scrape?.jobs ?? [];
    const catalog = memory.get<CompanyCatalogRow[]>('companies_catalog') ?? [];
    const filtered = memory.get<CompanyFilteredRow[]>('companies_filtered');
    const companiesFiltered = filtered ?? catalog.map(r => ({ ...r, focus: 'primary' as const }));
    return {
        jobs,
        expandedSearch: scrape?.expandedSearch ?? false,
        searchedIn: scrape?.searchedIn ?? '',
        marketStats: scrape?.marketStats ?? { totalLinkedIn: 0, cityDistribution: {} },
        aiAnalysis: memory.get<string | null>('ai_analysis') ?? null,
        marketInsights: memory.get<MarketInsight | null>('market_insights') ?? null,
        enrichSkipped: Boolean(memory.get<boolean>('enrich_skipped')),
        companiesCatalog: catalog,
        companiesFiltered,
        outreachDrafts: memory.get<OutreachDraft[]>('outreach_drafts') ?? [],
    };
}

const scrapeHandler: StepHandler<OpportunityPipelineCtx> = async ({ ctx, memory }) => {
    const result = await scrapeLinkedInJobs(ctx.query, ctx.location, 15, ctx.filters);
    memory.set('scrape_result', result);
    memory.set('jobs_final', result.jobs);
    if (!result.success)
        throw new Error(result.error || 'Error al obtener ofertas');
};

const discoverCompaniesHandler: StepHandler<OpportunityPipelineCtx> = async ({ ctx, memory }) => {
    const scrape = memory.get<AgentResult>('scrape_result');
    if (!scrape?.success) {
        memory.set('companies_catalog', []);
        memory.set('companies_filtered', []);
        return;
    }
    const jobs = scrape.jobs;
    const base = aggregateCompaniesFromJobs(jobs);
    if (ctx.isFree) {
        memory.set('companies_catalog', base);
        memory.set('companies_filtered', base.map(r => ({ ...r, focus: 'primary' as const })));
        return;
    }
    const enriched = (await enrichCompanyCatalog(base, ctx.query, ctx.location, jobs)) ?? base;
    memory.set('companies_catalog', enriched);
};

const filterCompaniesHandler: StepHandler<OpportunityPipelineCtx> = async ({ ctx, memory }) => {
    if (ctx.isFree)
        return;
    const cat = memory.get<CompanyCatalogRow[]>('companies_catalog') ?? [];
    if (cat.length === 0) {
        memory.set('companies_filtered', []);
        return;
    }
    const filtered = (await filterCompanyCatalog(cat, ctx.query, ctx.location))
        ?? cat.map(r => ({ ...r, focus: 'secondary' as const }));
    memory.set('companies_filtered', filtered);
};

const enrichAiHandler: StepHandler<OpportunityPipelineCtx> = async ({ ctx, memory }) => {
    const scrape = memory.get<AgentResult>('scrape_result');
    if (!scrape?.success) {
        memory.set('enrich_skipped', true);
        return;
    }
    let jobs = scrape.jobs;
    if (ctx.isFree || jobs.length === 0) {
        memory.set('enrich_skipped', true);
        memory.set('jobs_final', jobs);
        memory.set('ai_analysis', null);
        memory.set('market_insights', null);
        return;
    }
    try {
        const [analyzed, insights] = await Promise.all([
            analyzeJobs(jobs, ctx.query),
            generateMarketInsights(jobs, ctx.query, scrape.marketStats, ctx.location),
        ]);
        if (analyzed) {
            jobs = analyzed.jobs;
            memory.set('ai_analysis', analyzed.summary);
        }
        else {
            memory.set('ai_analysis', null);
        }
        memory.set('market_insights', insights ?? null);
        memory.set('jobs_final', jobs);
        memory.set('enrich_skipped', false);
    }
    catch (e) {
        console.error('[modes/opportunity] enrich_ai', e);
        memory.set('jobs_final', jobs);
        memory.set('ai_analysis', null);
        memory.set('market_insights', null);
        memory.set('enrich_skipped', false);
    }
};

const outreachHandler: StepHandler<OpportunityPipelineCtx> = async ({ ctx, memory }) => {
    if (ctx.isFree) {
        memory.set('outreach_drafts', []);
        return;
    }
    const jobs = memory.get<AnalyzedJob[]>('jobs_final') ?? [];
    if (jobs.length === 0) {
        memory.set('outreach_drafts', []);
        return;
    }
    const ranked = [...jobs].sort((a, b) => {
        const order = { alta: 0, media: 1, baja: 2 };
        const ra = a.relevance ? order[a.relevance] : 1;
        const rb = b.relevance ? order[b.relevance] : 1;
        return ra - rb;
    });
    const drafts = await generateOutreachDrafts(ranked, ctx.query, 5);
    memory.set('outreach_drafts', drafts ?? []);
};

const verifyHandler: StepHandler<OpportunityPipelineCtx> = async ({ memory }) => {
    const { ok, failures } = runMemoryChecks(memory, [
        {
            id: 'scrape',
            memoryKey: 'scrape_result',
            predicate: v => {
                const r = v as AgentResult | undefined;
                return Boolean(r && r.success === true);
            },
            message: 'El paso de scraping no completó correctamente.',
        },
        {
            id: 'jobs_final',
            memoryKey: 'jobs_final',
            predicate: v => Array.isArray(v),
            message: 'Falta la lista de ofertas en memoria.',
        },
    ]);
    if (!ok)
        throw new Error(failures.join(' '));
};

const opportunityHandlers: Record<string, StepHandler<OpportunityPipelineCtx>> = {
    scrape: scrapeHandler,
    discover_companies: discoverCompaniesHandler,
    filter_companies: filterCompaniesHandler,
    enrich_ai: enrichAiHandler,
    outreach: outreachHandler,
    verify: verifyHandler,
};

export function useLlmOpportunityPlanner(): boolean {
    return process.env.AGENT_OPPORTUNITY_LLM_PLANNER === '1' || process.env.AGENT_OPPORTUNITY_LLM_PLANNER === 'true';
}

export async function runOpportunityAgent(params: {
    query: string;
    location: string;
    filters: SearchFilters;
    isFree: boolean;
    useLlmPlanner?: boolean;
}): Promise<{
    ok: boolean;
    error?: string;
    plan: PlanStep[];
    state: OpportunityAgentState;
}> {
    const useLlm = params.useLlmPlanner ?? useLlmOpportunityPlanner();
    const plan = await resolveOpportunityPlan({
        goal: params.query,
        location: params.location,
        useLlmPlanner: useLlm,
    });
    const ctx: OpportunityPipelineCtx = {
        query: params.query,
        location: params.location,
        filters: params.filters,
        isFree: params.isFree,
    };
    const run = await runAgentPipeline<OpportunityPipelineCtx, OpportunityAgentState>({
        plan,
        ctx,
        buildInitialState: () => ({
            jobs: [],
            expandedSearch: false,
            searchedIn: params.location,
            marketStats: { totalLinkedIn: 0, cityDistribution: {} },
            aiAnalysis: null,
            marketInsights: null,
            enrichSkipped: false,
            companiesCatalog: [],
            companiesFiltered: [],
            outreachDrafts: [],
        }),
        hydrateState: hydrateFromMemory,
        handlers: opportunityHandlers,
    });
    return {
        ok: run.ok,
        error: run.error,
        plan: run.plan,
        state: run.state,
    };
}
