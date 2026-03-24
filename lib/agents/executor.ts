import type { AgentMemory } from './memory';
import type { AgentTraceEntry, PlanStep } from './types';

export type StepHandler<TCtx> = (args: {
    ctx: TCtx;
    memory: AgentMemory;
    step: PlanStep;
}) => Promise<void>;

export async function executePlan<TCtx>(params: {
    plan: PlanStep[];
    ctx: TCtx;
    memory: AgentMemory;
    handlers: Record<string, StepHandler<TCtx>>;
}): Promise<AgentTraceEntry[]> {
    const { plan, ctx, memory, handlers } = params;
    const trace: AgentTraceEntry[] = [];
    for (const step of plan) {
        const startedAt = new Date().toISOString();
        const handler = handlers[step.id];
        if (!handler) {
            trace.push({
                stepId: step.id,
                status: 'error',
                startedAt,
                endedAt: new Date().toISOString(),
                detail: `No hay handler registrado para el paso "${step.id}"`,
            });
            break;
        }
        try {
            await handler({ ctx, memory, step });
            trace.push({
                stepId: step.id,
                status: 'ok',
                startedAt,
                endedAt: new Date().toISOString(),
            });
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            trace.push({
                stepId: step.id,
                status: 'error',
                startedAt,
                endedAt: new Date().toISOString(),
                detail: msg,
            });
            break;
        }
    }
    return trace;
}
