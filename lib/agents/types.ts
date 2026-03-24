export type PlanStep = {
    id: string;
    title?: string;
    description?: string;
};

export type AgentTraceEntry = {
    stepId: string;
    status: 'ok' | 'skipped' | 'error';
    startedAt: string;
    endedAt: string;
    detail?: string;
};

export type AgentRunResult<TState> = {
    ok: boolean;
    error?: string;
    plan: PlanStep[];
    trace: AgentTraceEntry[];
    state: TState;
};
