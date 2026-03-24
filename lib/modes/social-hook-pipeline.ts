import { generateHookLab, type HookLabGenResult, type HookLabResult } from '@/lib/social-claude';
import {
    analyzeNicheForHookLab,
    scriptIdeasForHookLab,
    viralPatternsForHookLab,
    type SocialNicheAnalysis,
} from '@/lib/social-strategy-claude';
import { runAgentPipeline } from '@/lib/agents/orchestrator';
import type { StepHandler } from '@/lib/agents/executor';
import { runMemoryChecks } from '@/lib/agents/verifier';
import type { PlanStep } from '@/lib/agents/types';
import type { AgentMemory } from '@/lib/agents/memory';
import type { SocialPlanTier } from '@/lib/social-limits';
import { buildHookLabStrategyAppendix } from '@/lib/prompts/social';

export type SocialHookLabPipelineCtx = {
    topic: string;
    audience: string;
    tone: string;
    language: string;
    tier: SocialPlanTier;
    isPro: boolean;
};

export type SocialHookLabAgentState = {
    hookLab: HookLabResult | null;
    nicheAnalysis: SocialNicheAnalysis | null;
    viralPatterns: string[];
    scriptIdeas: string[];
};

export function socialHookLabTemplatePlan(isPro: boolean): PlanStep[] {
    if (!isPro) {
        return [
            { id: 'ingest_brief', title: 'Brief', description: 'Normaliza tema y preferencias' },
            { id: 'hook_pack', title: 'Pack de hooks', description: 'Genera hooks con IA' },
            { id: 'verify', title: 'Verificar', description: 'Comprueba salida' },
        ];
    }
    return [
        { id: 'ingest_brief', title: 'Brief', description: 'Normaliza tema y preferencias' },
        { id: 'analyze_niche', title: 'Analizar nicho', description: 'Resumen, keywords, insight de audiencia' },
        { id: 'viral_patterns', title: 'Patrones virales', description: 'Formatos que encajan con el tema' },
        { id: 'script_ideas', title: 'Ideas de guion', description: 'Beats de vídeo corto' },
        { id: 'hook_pack', title: 'Optimizar hooks', description: 'Pack final alineado al contexto' },
        { id: 'verify', title: 'Verificar', description: 'Comprueba salida' },
    ];
}

function hydrateSocialHookLab(memory: AgentMemory, _base: SocialHookLabAgentState): SocialHookLabAgentState {
    const gen = memory.get<HookLabGenResult>('hook_lab_gen');
    const data = gen && gen.ok ? gen.data : null;
    return {
        hookLab: data,
        nicheAnalysis: memory.get<SocialNicheAnalysis>('niche_analysis') ?? null,
        viralPatterns: memory.get<string[]>('viral_patterns') ?? [],
        scriptIdeas: memory.get<string[]>('script_ideas') ?? [],
    };
}

const ingestBriefHandler: StepHandler<SocialHookLabPipelineCtx> = async ({ ctx, memory }) => {
    memory.set('brief', {
        topic: ctx.topic.trim(),
        audience: ctx.audience,
        tone: ctx.tone,
        language: ctx.language,
        tier: ctx.tier,
    });
};

const analyzeNicheHandler: StepHandler<SocialHookLabPipelineCtx> = async ({ ctx, memory }) => {
    if (!ctx.isPro) {
        memory.set('niche_analysis', null);
        return;
    }
    const n = await analyzeNicheForHookLab({
        topic: ctx.topic,
        audience: ctx.audience,
        tone: ctx.tone,
        language: ctx.language,
    });
    memory.set('niche_analysis', n ?? {
        summary: ctx.topic.trim(),
        keywords: [ctx.topic.trim().slice(0, 48)],
        audience_insight: '',
    });
};

const viralPatternsHandler: StepHandler<SocialHookLabPipelineCtx> = async ({ ctx, memory }) => {
    if (!ctx.isPro) {
        memory.set('viral_patterns', []);
        return;
    }
    const niche = memory.get<SocialNicheAnalysis>('niche_analysis');
    if (!niche) {
        memory.set('viral_patterns', []);
        return;
    }
    const p = await viralPatternsForHookLab({ topic: ctx.topic, niche });
    memory.set('viral_patterns', p ?? []);
};

const scriptIdeasHandler: StepHandler<SocialHookLabPipelineCtx> = async ({ ctx, memory }) => {
    if (!ctx.isPro) {
        memory.set('script_ideas', []);
        return;
    }
    const niche = memory.get<SocialNicheAnalysis>('niche_analysis');
    const patterns = memory.get<string[]>('viral_patterns') ?? [];
    if (!niche || patterns.length === 0) {
        memory.set('script_ideas', []);
        return;
    }
    const ideas = await scriptIdeasForHookLab({ topic: ctx.topic, niche, patterns });
    memory.set('script_ideas', ideas ?? []);
};

const hookPackHandler: StepHandler<SocialHookLabPipelineCtx> = async ({ ctx, memory }) => {
    const na = memory.get<SocialNicheAnalysis>('niche_analysis');
    const patterns = memory.get<string[]>('viral_patterns') ?? [];
    const ideas = memory.get<string[]>('script_ideas') ?? [];
    const nicheBlock = na
        ? `${na.summary}\nPalabras clave: ${na.keywords.join(', ')}\nInsight audiencia: ${na.audience_insight}`
        : undefined;
    const viralLines = patterns.length > 0 ? patterns.map((p, i) => `${i + 1}. ${p}`).join('\n') : undefined;
    const scriptLines = ideas.length > 0 ? ideas.map((x, i) => `${i + 1}. ${x}`).join('\n') : undefined;
    const strategyAppendix = ctx.isPro
        ? buildHookLabStrategyAppendix({
            nicheAnalysis: nicheBlock,
            viralLines,
            scriptLines,
        })
        : undefined;
    const gen = await generateHookLab({
        topic: ctx.topic,
        audience: ctx.audience,
        tone: ctx.tone,
        language: ctx.language,
        tier: ctx.tier,
        strategyAppendix: strategyAppendix ?? undefined,
    });
    memory.set('hook_lab_gen', gen);
    if (!gen.ok)
        throw new Error(gen.reason === 'missing_api_key' ? 'missing_api_key' : 'api_or_parse');
};

const verifyHookLabHandler: StepHandler<SocialHookLabPipelineCtx> = async ({ memory }) => {
    const { ok, failures } = runMemoryChecks(memory, [
        {
            id: 'hook_lab_gen',
            memoryKey: 'hook_lab_gen',
            predicate: v => {
                const g = v as HookLabGenResult | undefined;
                return Boolean(g && g.ok === true);
            },
            message: 'El pack de hooks no se generó correctamente.',
        },
    ]);
    if (!ok)
        throw new Error(failures.join(' '));
};

const socialHookLabHandlers: Record<string, StepHandler<SocialHookLabPipelineCtx>> = {
    ingest_brief: ingestBriefHandler,
    analyze_niche: analyzeNicheHandler,
    viral_patterns: viralPatternsHandler,
    script_ideas: scriptIdeasHandler,
    hook_pack: hookPackHandler,
    verify: verifyHookLabHandler,
};

export async function runSocialHookLabAgent(ctx: SocialHookLabPipelineCtx): Promise<{
    ok: boolean;
    error?: string;
    plan: PlanStep[];
    state: SocialHookLabAgentState;
}> {
    const plan = socialHookLabTemplatePlan(ctx.isPro);
    const run = await runAgentPipeline<SocialHookLabPipelineCtx, SocialHookLabAgentState>({
        plan,
        ctx,
        buildInitialState: () => ({
            hookLab: null,
            nicheAnalysis: null,
            viralPatterns: [],
            scriptIdeas: [],
        }),
        hydrateState: hydrateSocialHookLab,
        handlers: socialHookLabHandlers,
    });
    return {
        ok: run.ok,
        error: run.error,
        plan: run.plan,
        state: run.state,
    };
}
