/**
 * Núcleo de orquestación: Planner, Executor, Memory, Verifier, Orchestrator.
 * Importa desde `@/lib/agents` o rutas concretas bajo `lib/agents/*`.
 */
export type { PlanStep, AgentTraceEntry, AgentRunResult } from './types';
export { AgentMemory } from './memory';
export { executePlan, type StepHandler } from './executor';
export { runMemoryChecks, type VerifyRule } from './verifier';
export { runAgentPipeline } from './orchestrator';
export {
    OPPORTUNITY_PIPELINE_ORDER,
    OPPORTUNITY_ALLOWED_STEP_IDS,
    opportunityTemplatePlan,
    ensureOpportunityPipeline,
    planOpportunityWithClaude,
    resolveOpportunityPlan,
} from './planner';
