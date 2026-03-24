import { useEffect, useState } from 'react';
import useSWR from 'swr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EditorialCalendarResult, EditorialPost, HookLabResult } from '@/lib/social-claude';
import type { SocialPlanTier } from '@/lib/social-limits';
import { EDITORIAL_DAYS, HOOK_LAB_COUNTS } from '@/lib/social-limits';

import SocialHub from './social/SocialHub';
import EditorialSection from './social/EditorialSection';
import HookLabSection from './social/HookLabSection';
import SleepSection from './social/SleepSection';
import { labelsForEditorialSteps } from '@/lib/user-facing-agent-steps';
import { SHELL } from '@/lib/app-shell';
import { postToText } from './social/SocialCommon';
import type { SocialSection } from './social/SocialCommon';

export default function SocialView({ userId, supabase, planTier, }: {
    userId: string;
    supabase: SupabaseClient;
    planTier: SocialPlanTier;
}) {
    const isPro = planTier === 'pro';
    const calDays = EDITORIAL_DAYS[planTier];
    const hl = HOOK_LAB_COUNTS[planTier];

    const [niche, setNiche] = useState('');
    const [audience, setAudience] = useState('');
    const [tone, setTone] = useState('profesional y cercano');
    const [mainPlatform, setMainPlatform] = useState('Instagram');
    const [language, setLanguage] = useState('español');
    const [settingsErr, setSettingsErr] = useState<string | null>(null);
    const [savingPrefs, setSavingPrefs] = useState(false);

    const [calendar, setCalendar] = useState<EditorialCalendarResult | null>(null);
    const [editorialAssistantLabels, setEditorialAssistantLabels] = useState<string[]>([]);
    const [genLoading, setGenLoading] = useState(false);
    const [genErr, setGenErr] = useState<string | null>(null);

    const [hookTopic, setHookTopic] = useState('');
    const [hookLab, setHookLab] = useState<HookLabResult | null>(null);
    type HookLabPipelineMeta = {
        pipelineSteps: string[];
        nicheAnalysis: { summary: string; keywords: string[]; audience_insight: string } | null;
        viralPatterns: string[];
        scriptIdeas: string[];
    };
    const [hookLabMeta, setHookLabMeta] = useState<HookLabPipelineMeta | null>(null);
    const [hookLoading, setHookLoading] = useState(false);
    const [hookErr, setHookErr] = useState<string | null>(null);
    const [copiedFlash, setCopiedFlash] = useState<string | null>(null);

    const [section, setSection] = useState<SocialSection>('hub');

    const storageCal = `agentme_social_calendar_${userId}`;
    const storageHook = `agentme_social_hooklab_${userId}`;

    useEffect(() => {
        try {
            const cal = sessionStorage.getItem(storageCal);
            if (cal) {
                const parsed = JSON.parse(cal) as EditorialCalendarResult | {
                    calendar?: EditorialCalendarResult;
                    editorialAssistantLabels?: string[];
                };
                if (parsed && typeof parsed === 'object' && 'calendar' in parsed && parsed.calendar?.posts?.length) {
                    setCalendar(parsed.calendar);
                    setEditorialAssistantLabels(Array.isArray(parsed.editorialAssistantLabels) ? parsed.editorialAssistantLabels : []);
                }
                else if ((parsed as EditorialCalendarResult)?.posts?.length) {
                    setCalendar(parsed as EditorialCalendarResult);
                    setEditorialAssistantLabels([]);
                }
            }
            const hlb = sessionStorage.getItem(storageHook);
            if (hlb) {
                const parsed = JSON.parse(hlb) as HookLabResult | { hookLab?: HookLabResult; meta?: HookLabPipelineMeta };
                if (parsed && typeof parsed === 'object' && 'hookLab' in parsed && parsed.hookLab?.hooks?.length) {
                    setHookLab(parsed.hookLab);
                    setHookLabMeta(parsed.meta ?? null);
                }
                else if ((parsed as HookLabResult)?.hooks?.length) {
                    setHookLab(parsed as HookLabResult);
                    setHookLabMeta(null);
                }
            }
        }
        catch { /* ignore */ }
    }, [userId, storageCal, storageHook]);

    const { data: settingsData, mutate: mutateSettings } = useSWR(
        userId ? ['social_settings', userId] : null,
        async () => {
            const { data, error } = await supabase.from('social_settings').select('*').eq('user_id', userId).maybeSingle();
            if (error)
                throw error;
            return data;
        },
        {
            dedupingInterval: 8000,
            revalidateOnFocus: false,
            onError: (e: Error) => setSettingsErr(e.message || 'Error al cargar preferencias'),
            onSuccess: () => setSettingsErr(null),
        },
    );

    useEffect(() => {
        if (settingsData === undefined || settingsData === null)
            return;
        setNiche(settingsData.niche ?? '');
        setAudience(settingsData.audience ?? '');
        setTone(settingsData.tone ?? 'profesional y cercano');
        setMainPlatform(settingsData.main_platform ?? 'Instagram');
        setHookTopic(prev => (prev.trim() ? prev : (settingsData.niche ?? '')));
    }, [settingsData]);

    const savePreferences = async () => {
        setSavingPrefs(true);
        const row = {
            user_id: userId,
            niche: niche.trim(),
            audience: audience.trim(),
            tone: tone.trim(),
            main_platform: mainPlatform.trim(),
            updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('social_settings').upsert(row);
        setSavingPrefs(false);
        if (error) {
            setSettingsErr(error.message);
            return;
        }
        setSettingsErr(null);
        await mutateSettings(
            {
                user_id: userId,
                niche: row.niche,
                audience: row.audience,
                tone: row.tone,
                main_platform: row.main_platform,
                updated_at: row.updated_at,
            },
            { revalidate: false },
        );
    };

    const generate = async () => {
        if (!niche.trim()) return;
        setGenLoading(true);
        setCalendar(null);
        setEditorialAssistantLabels([]);
        try {
            const res = await fetch('/api/social/editorial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ niche, audience, tone, mainPlatform, language }),
            });
            const data = await res.json();
            if (data.calendar) {
                setCalendar(data.calendar);
                const labels = Array.isArray(data.pipeline?.steps)
                    ? labelsForEditorialSteps(data.pipeline.steps as string[])
                    : [];
                setEditorialAssistantLabels(labels);
                sessionStorage.setItem(storageCal, JSON.stringify({
                    calendar: data.calendar,
                    editorialAssistantLabels: labels,
                }));
            }
            else {
                setGenErr(data.message || 'Error al generar calendario');
            }
        }
        catch { setGenErr('Error de conexión'); }
        finally { setGenLoading(false); }
    };

    const generateHookLab = async () => {
        if (!hookTopic.trim()) return;
        setHookLoading(true);
        setHookLab(null);
        setHookLabMeta(null);
        try {
            const res = await fetch('/api/social/hook-lab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: hookTopic, audience, tone, language }),
            });
            const data = await res.json();
            if (data.hookLab) {
                setHookLab(data.hookLab);
                const meta: HookLabPipelineMeta | null = Array.isArray(data.pipeline?.steps)
                    ? {
                        pipelineSteps: data.pipeline.steps as string[],
                        nicheAnalysis: data.nicheAnalysis ?? null,
                        viralPatterns: Array.isArray(data.viralPatterns) ? data.viralPatterns : [],
                        scriptIdeas: Array.isArray(data.scriptIdeas) ? data.scriptIdeas : [],
                    }
                    : null;
                setHookLabMeta(meta);
                sessionStorage.setItem(storageHook, JSON.stringify({ hookLab: data.hookLab, meta }));
            }
            else {
                setHookErr(data.message || 'Error al generar Hook Lab');
            }
        }
        catch { setHookErr('Error de conexión'); }
        finally { setHookLoading(false); }
    };

    const flashCopy = (id: string) => {
        setCopiedFlash(id);
        setTimeout(() => setCopiedFlash(null), 2000);
    };

    const copyWeek = async () => {
        if (!calendar) return;
        const text = `# Calendario editorial\n\n` + calendar.posts.map(postToText).join('\n\n---\n\n');
        await navigator.clipboard.writeText(text);
        flashCopy('week');
    };

    const copyOne = async (p: EditorialPost, idx: number) => {
        await navigator.clipboard.writeText(postToText(p));
        flashCopy(`post-${idx}`);
    };

    const copySingleHook = async (text: string, idx: number) => {
        await navigator.clipboard.writeText(text);
        flashCopy(`hook-${idx}`);
    };

    const copyHookLabAll = async () => {
        if (!hookLab) return;
        const text = `# Hook Lab\n\n` + hookLab.hooks.map((h, i) => `${i + 1}. ${h}`).join('\n');
        await navigator.clipboard.writeText(text);
        flashCopy('hooklab');
    };

    return (
        <div style={{ padding: SHELL.pagePadding, maxWidth: SHELL.contentMax, margin: '0 auto', width: '100%' }}>
            {settingsErr && (
                <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: 12, borderRadius: 8, color: '#991b1b', fontSize: 13, marginBottom: 16 }}>
                    {settingsErr}
                </div>
            )}

            {section === 'hub' && (
                <SocialHub planTier={planTier} isPro={isPro} setSection={setSection} />
            )}

            {section === 'editorial' && (
                <EditorialSection
                    setSection={setSection} niche={niche} setNiche={setNiche}
                    audience={audience} setAudience={setAudience}
                    tone={tone} setTone={setTone}
                    mainPlatform={mainPlatform} setMainPlatform={setMainPlatform}
                    language={language} setLanguage={setLanguage}
                    savingPrefs={savingPrefs} savePrefs={savePreferences}
                    generate={generate} genLoading={genLoading}
                    calDays={calDays} isPro={isPro} genErr={genErr}
                    calendar={calendar} copyWeek={copyWeek} copiedFlash={copiedFlash}
                    copyOne={copyOne}
                    editorialAssistantLabels={editorialAssistantLabels}
                />
            )}

            {section === 'sleep' && (
                <SleepSection setSection={setSection} />
            )}

            {section === 'hooklab' && (
                <HookLabSection
                    setSection={setSection} isPro={isPro} hl={hl}
                    hookTopic={hookTopic} setHookTopic={setHookTopic}
                    niche={niche} generateHookLab={generateHookLab}
                    hookLoading={hookLoading} hookErr={hookErr}
                    hookLab={hookLab} hookLabMeta={hookLabMeta}
                    copyHookLabAll={copyHookLabAll}
                    copiedFlash={copiedFlash} copySingleHook={copySingleHook}
                />
            )}
        </div>
    );
}
