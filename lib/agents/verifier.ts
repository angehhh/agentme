import type { AgentMemory } from './memory';

export type VerifyRule = {
    id: string;
    memoryKey: string;
    predicate: (value: unknown) => boolean;
    message: string;
};

export function runMemoryChecks(memory: AgentMemory, rules: VerifyRule[]): {
    ok: boolean;
    failures: string[];
} {
    const failures: string[] = [];
    for (const r of rules) {
        const v = memory.get(r.memoryKey);
        if (!r.predicate(v))
            failures.push(`${r.id}: ${r.message}`);
    }
    return { ok: failures.length === 0, failures };
}
