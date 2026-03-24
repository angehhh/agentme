export class AgentMemory {
    private readonly store = new Map<string, unknown>();

    set(key: string, value: unknown): void {
        this.store.set(key, value);
    }

    get<T>(key: string): T | undefined {
        return this.store.get(key) as T | undefined;
    }

    has(key: string): boolean {
        return this.store.has(key);
    }

    snapshot(): Record<string, unknown> {
        return Object.fromEntries(this.store.entries());
    }
}
