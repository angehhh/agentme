import type { SupabaseClient } from '@supabase/supabase-js';

export type SleepJobState = {
    phase: number;
    trace: string[];
};

export type SleepJobRow = {
    id: string;
    user_id: string;
    status: string;
    goal: string;
    state: SleepJobState;
    created_at: string;
    updated_at: string;
};

function parseState(raw: unknown): SleepJobState {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        return { phase: 0, trace: [] };
    const o = raw as Record<string, unknown>;
    const phase = typeof o.phase === 'number' ? o.phase : 0;
    const tr = o.trace;
    const trace = Array.isArray(tr) ? tr.filter((x): x is string => typeof x === 'string') : [];
    return { phase, trace };
}

export async function enqueueSleepJob(admin: SupabaseClient, userId: string, goal: string): Promise<{
    id: string | null;
    error: Error | null;
}> {
    const { data, error } = await admin
        .from('sleep_jobs')
        .insert({
            user_id: userId,
            status: 'pending',
            goal: goal.trim().slice(0, 500),
            state: { phase: 0, trace: [] },
            updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
    if (error)
        return { id: null, error: new Error(error.message) };
    return { id: data?.id ?? null, error: null };
}

/** Toma el trabajo más antiguo en `pending` y lo marca `processing`. */
export async function claimNextPendingSleepJob(admin: SupabaseClient): Promise<SleepJobRow | null> {
    const { data: row, error: selErr } = await admin
        .from('sleep_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
    if (selErr || !row)
        return null;
    const { data: updated, error: updErr } = await admin
        .from('sleep_jobs')
        .update({
            status: 'processing',
            updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
        .eq('status', 'pending')
        .select('*')
        .maybeSingle();
    if (updErr || !updated)
        return null;
    return {
        ...updated,
        state: parseState(updated.state),
    } as SleepJobRow;
}

/**
 * Ejecuta un ciclo completo tipo "agente dormido": planner → executor → memory (stub, sin LLM).
 * Pensado para ser llamado desde un cron con service role.
 */
export async function advanceSleepJobStep(admin: SupabaseClient, job: SleepJobRow): Promise<void> {
    const trace = [
        'Planner: objetivo encolado; plan stub (expandir con LLM en fases siguientes).',
        'Executor: tick de worker — procesamiento diferido (MVP).',
        'Memory: traza persistida en sleep_jobs.state.',
    ];
    const nextState: SleepJobState = {
        phase: 3,
        trace: trace,
    };
    const { error } = await admin
        .from('sleep_jobs')
        .update({
            status: 'completed',
            state: nextState,
            updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);
    if (error)
        console.error('[sleep] advanceSleepJobStep', error);
}

export async function processOneSleepJobFromQueue(admin: SupabaseClient): Promise<{
    processed: boolean;
    jobId?: string;
}> {
    const job = await claimNextPendingSleepJob(admin);
    if (!job)
        return { processed: false };
    await advanceSleepJobStep(admin, job);
    return { processed: true, jobId: job.id };
}
