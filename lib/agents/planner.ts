import Anthropic from '@anthropic-ai/sdk';
import type { PlanStep } from './types';
import { getOpportunityPlannerPrompt } from '@/lib/prompts/orchestrator';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/** Orden canónico del pipeline Opportunity (subconjuntos respetan este orden). */
export const OPPORTUNITY_PIPELINE_ORDER = [
    'scrape',
    'discover_companies',
    'filter_companies',
    'enrich_ai',
    'outreach',
    'verify',
] as const;

export const OPPORTUNITY_ALLOWED_STEP_IDS = [...OPPORTUNITY_PIPELINE_ORDER] as unknown as readonly string[];

export function opportunityTemplatePlan(): PlanStep[] {
    return [
        { id: 'scrape', title: 'Buscar ofertas en LinkedIn', description: 'Scraping y filtrado local de ofertas' },
        { id: 'discover_companies', title: 'Mapa de empresas', description: 'Agrega empresas de la muestra y enriquecimiento IA (Pro)' },
        { id: 'filter_companies', title: 'Filtrar empresas', description: 'Clasifica encaje primary/secondary/out (Pro)' },
        { id: 'enrich_ai', title: 'Rankear ofertas e insights', description: 'Claude rankea ofertas y mercado (Pro)' },
        { id: 'outreach', title: 'Borradores de outreach', description: 'Notas LinkedIn y aperturas de email (Pro)' },
        { id: 'verify', title: 'Verificar salida', description: 'Comprueba datos mínimos coherentes' },
    ];
}

function normalizeOpportunityStepIds(raw: unknown): string[] {
    if (!Array.isArray(raw))
        return [];
    return raw
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map(s => s.trim().toLowerCase())
        .filter(id => (OPPORTUNITY_ALLOWED_STEP_IDS as readonly string[]).includes(id));
}

function dedupeKeepOrder(ids: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of ids) {
        if (seen.has(id))
            continue;
        seen.add(id);
        out.push(id);
    }
    return out;
}

export function ensureOpportunityPipeline(ids: string[]): PlanStep[] {
    const template = opportunityTemplatePlan();
    const byId = new Map(template.map(s => [s.id, s]));
    const uniq = dedupeKeepOrder(ids);
    const set = new Set(uniq);
    if (!set.has('scrape'))
        set.add('scrape');
    const ordered: string[] = [];
    for (const id of OPPORTUNITY_PIPELINE_ORDER) {
        if (set.has(id))
            ordered.push(id);
    }
    return ordered
        .filter(id => byId.has(id))
        .map(id => byId.get(id)!);
}

export async function planOpportunityWithClaude(params: {
    goal: string;
    location: string;
}): Promise<PlanStep[] | null> {
    if (!process.env.ANTHROPIC_API_KEY?.trim())
        return null;
    const allowed = [...OPPORTUNITY_ALLOWED_STEP_IDS];
    const prompt = getOpportunityPlannerPrompt({
        goal: params.goal,
        location: params.location,
        allowedStepIds: allowed,
    });
    try {
        const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 256,
            messages: [{ role: 'user', content: prompt }],
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        let s = text.trim();
        const fenced = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```/im.exec(s);
        if (fenced)
            s = fenced[1].trim();
        const start = s.indexOf('{');
        const end = s.lastIndexOf('}');
        if (start === -1 || end <= start)
            return null;
        const parsed = JSON.parse(s.slice(start, end + 1)) as { steps?: unknown };
        const ids = normalizeOpportunityStepIds(parsed.steps);
        if (ids.length === 0)
            return null;
        return ensureOpportunityPipeline(ids);
    }
    catch (e) {
        console.error('[agents/planner] planOpportunityWithClaude', e);
        return null;
    }
}

export async function resolveOpportunityPlan(params: {
    goal: string;
    location: string;
    useLlmPlanner: boolean;
}): Promise<PlanStep[]> {
    if (params.useLlmPlanner) {
        const planned = await planOpportunityWithClaude({
            goal: params.goal,
            location: params.location,
        });
        if (planned && planned.length > 0)
            return planned;
    }
    return opportunityTemplatePlan();
}
