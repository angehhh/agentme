import { AgentMemory } from './memory';
import { executePlan } from './executor';
import type { AgentRunResult, PlanStep } from './types';

export async function runAgentPipeline<TCtx, TState>(params: {
    plan: PlanStep[];
    ctx: TCtx;
    buildInitialState: () => TState;
    hydrateState?: (memory: AgentMemory, state: TState) => TState;
    handlers: Parameters<typeof executePlan<TCtx>>[0]['handlers'];
    isFailed?: (trace: { status: string }[]) => boolean;
}): Promise<AgentRunResult<TState>> {
    const memory = new AgentMemory();
    const state = params.buildInitialState();
    const trace = await executePlan({
        plan: params.plan,
        ctx: params.ctx,
        memory,
        handlers: params.handlers,
    });
    const failed = params.isFailed
        ? params.isFailed(trace)
        : trace.some(t => t.status === 'error');
    const finalState = params.hydrateState ? params.hydrateState(memory, state) : state;
    const lastError = [...trace].reverse().find(t => t.status === 'error');
    return {
        ok: !failed,
        error: failed ? lastError?.detail || 'Pipeline con error' : undefined,
        plan: params.plan,
        trace,
        state: finalState,
    };
}
