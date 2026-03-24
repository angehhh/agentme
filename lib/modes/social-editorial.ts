import { generateEditorialCalendar, type EditorialCalendarGenResult } from '@/lib/social-claude';
import type { SocialPlanTier } from '@/lib/social-limits';
import { executePlan } from '@/lib/agents/executor';
import { AgentMemory } from '@/lib/agents/memory';
import type { PlanStep } from '@/lib/agents/types';
import type { StepHandler } from '@/lib/agents/executor';

export type SocialEditorialCtx = {
    niche: string;
    audience?: string;
    tone?: string;
    mainPlatform?: string;
    language?: string;
    tier: SocialPlanTier;
};

export type SocialEditorialState = {
    gen: EditorialCalendarGenResult | null;
};

function editorialTemplatePlan(): PlanStep[] {
    return [
        { id: 'ingest_brief', title: 'Normalizar brief', description: 'Guarda nicho y parámetros en memoria del agente' },
        { id: 'generate_calendar', title: 'Generar calendario', description: 'Claude produce la semana de contenidos' },
    ];
}

const ingestBriefHandler: StepHandler<SocialEditorialCtx> = async ({ ctx, memory }) => {
    memory.set('brief', {
        niche: ctx.niche.trim(),
        audience: ctx.audience,
        tone: ctx.tone,
        mainPlatform: ctx.mainPlatform,
        language: ctx.language,
        tier: ctx.tier,
    });
};

const generateCalendarHandler: StepHandler<SocialEditorialCtx> = async ({ ctx, memory }) => {
    const gen = await generateEditorialCalendar({
        niche: ctx.niche.trim(),
        audience: ctx.audience,
        tone: ctx.tone,
        mainPlatform: ctx.mainPlatform,
        language: ctx.language,
        tier: ctx.tier,
    });
    memory.set('editorial_gen', gen);
    if (!gen.ok)
        throw new Error(gen.reason === 'missing_api_key' ? 'missing_api_key' : 'api_or_parse');
};

const handlers: Record<string, StepHandler<SocialEditorialCtx>> = {
    ingest_brief: ingestBriefHandler,
    generate_calendar: generateCalendarHandler,
};

export async function runSocialEditorialAgent(ctx: SocialEditorialCtx): Promise<{
    ok: boolean;
    error?: string;
    plan: PlanStep[];
    state: SocialEditorialState;
}> {
    const plan = editorialTemplatePlan();
    const memory = new AgentMemory();
    const trace = await executePlan({ plan, ctx, memory, handlers });
    const gen = memory.get<EditorialCalendarGenResult>('editorial_gen') ?? null;
    const failed = trace.some(t => t.status === 'error');
    const lastError = [...trace].reverse().find(t => t.status === 'error');
    return {
        ok: !failed && Boolean(gen?.ok),
        error: failed ? lastError?.detail : !gen?.ok ? 'api_or_parse' : undefined,
        plan,
        state: { gen },
    };
}
