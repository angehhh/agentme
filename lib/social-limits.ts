export type SocialPlanTier = 'free' | 'pro';
export function tierFromPlan(plan: string | null | undefined): SocialPlanTier {
    if (!plan || plan === 'free')
        return 'free';
    return 'pro';
}
export function utcStartOfTodayIso(): string {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)).toISOString();
}
export function utcStartOfIsoWeekIso(): string {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const day = d.getUTCDate();
    const wd = d.getUTCDay();
    const daysFromMonday = wd === 0 ? 6 : wd - 1;
    return new Date(Date.UTC(y, m, day - daysFromMonday, 0, 0, 0, 0)).toISOString();
}
export const SOCIAL_LIMITS = {
    editorial: {
        freePerWeek: 1,
        proPerDay: 40,
    },
    hookLab: {
        freePerWeek: 2,
        proPerDay: 80,
    },
    videoContent: {
        freePerWeek: 1,
        proPerDay: 15,
    },
    youtubeClips: {
        freePerWeek: 2,
        proPerDay: 20,
    },
    youtubeRender: {
        freePerWeek: 1,
        proPerDay: 5,
    },
} as const;
export const VIDEO_UPLOAD_MAX_MB = 24;
export const EDITORIAL_DAYS = { free: 3, pro: 7 } as const;
export const HOOK_LAB_COUNTS = {
    free: { hooks: 5, angles: 1 },
    pro: { hooks: 12, angles: 5 },
} as const;
