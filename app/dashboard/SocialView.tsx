import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EditorialCalendarResult, EditorialPost, HookLabResult } from '@/lib/social-claude';
import type { YoutubeVerticalClip } from '@/lib/youtube-clips-claude';
import type { SocialPlanTier } from '@/lib/social-limits';
import { EDITORIAL_DAYS, HOOK_LAB_COUNTS } from '@/lib/social-limits';

import SocialHub from './social/SocialHub';
import EditorialSection from './social/EditorialSection';
import HookLabSection from './social/HookLabSection';
import YoutubeClipsSection from './social/YoutubeClipsSection';
import {
    ensureYoutubeClipShape, sessionClipProgressFromDetail,
    postToText, clipsToText, buildClipsPlanPayload,
    OpusProgressOverlay, YtProjectVideoGridGateOverlay, YoutubeClipAutoPreviewObserver
} from './social/SocialCommon';
import type { SocialSection, YtCloudSession, YtCloudRenderProject } from './social/SocialCommon';

export default function SocialView({ userId, supabase, planTier, }: {
    userId: string;
    supabase: SupabaseClient;
    planTier: SocialPlanTier;
}) {
    const isPro = planTier === 'pro';
    const calDays = EDITORIAL_DAYS[planTier];
    const hl = HOOK_LAB_COUNTS[planTier];

    // --- State ---
    const [niche, setNiche] = useState('');
    const [audience, setAudience] = useState('');
    const [tone, setTone] = useState('profesional y cercano');
    const [mainPlatform, setMainPlatform] = useState('Instagram');
    const [language, setLanguage] = useState('español');
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsErr, setSettingsErr] = useState<string | null>(null);
    const [savingPrefs, setSavingPrefs] = useState(false);

    const [calendar, setCalendar] = useState<EditorialCalendarResult | null>(null);
    const [genLoading, setGenLoading] = useState(false);
    const [genErr, setGenErr] = useState<string | null>(null);

    const [hookTopic, setHookTopic] = useState('');
    const [hookLab, setHookLab] = useState<HookLabResult | null>(null);
    const [hookLoading, setHookLoading] = useState(false);
    const [hookErr, setHookErr] = useState<string | null>(null);
    const [copiedFlash, setCopiedFlash] = useState<string | null>(null);

    const [section, setSection] = useState<SocialSection>('hub');

    const [ytUrl, setYtUrl] = useState('');
    const [ytCaptionLang, setYtCaptionLang] = useState('');
    const [ytVideoId, setYtVideoId] = useState('');
    const [ytVideoTitle, setYtVideoTitle] = useState<string | null>(null);
    const [ytClips, setYtClips] = useState<YoutubeVerticalClip[]>([]);
    const [ytTitleHint, setYtTitleHint] = useState<string | null>(null);
    const [ytLoading, setYtLoading] = useState(false);
    const [ytAnalysisFakeProgress, setYtAnalysisFakeProgress] = useState(0);
    const [ytErr, setYtErr] = useState<string | null>(null);
    const [ytCopied, setYtCopied] = useState(false);

    const [ytRenderingClipIndex, setYtRenderingClipIndex] = useState<number | null>(null);
    const [ytRenderZipLoading, setYtRenderZipLoading] = useState(false);
    const [ytRenderErr, setYtRenderErr] = useState<string | null>(null);

    const [ytSessions, setYtSessions] = useState<YtCloudSession[]>([]);
    const [ytSessionsLoading, setYtSessionsLoading] = useState(false);
    const [ytSessionsFetchedOnce, setYtSessionsFetchedOnce] = useState(false);
    const [ytOpenSessionId, setYtOpenSessionId] = useState<string | null>(null);
    const [ytSessionDetail, setYtSessionDetail] = useState<{
        session: YtCloudSession;
        assets: YtCloudRenderProject[];
    } | null>(null);
    const [ytSessionDetailLoading, setYtSessionDetailLoading] = useState(false);
    const [ytRenderSessionId, setYtRenderSessionId] = useState<string | null>(null);
    const [ytRenderFakeProgress, setYtRenderFakeProgress] = useState(0);
    const [ytBypassProjectClipsGate, setYtBypassProjectClipsGate] = useState(false);

    const [ytCloudMp4UrlByClip, setYtCloudMp4UrlByClip] = useState<Record<number, string>>({});
    const [ytAutomatedPreviewByClip, setYtAutomatedPreviewByClip] = useState<Record<number, string>>({});

    // --- Refs ---
    const ytAutomatedPreviewRef = useRef<Record<number, string>>({});
    const aliveRef = useRef(true);
    const editorialAbortRef = useRef<AbortController | null>(null);
    const hookAbortRef = useRef<AbortController | null>(null);
    const ytAbortRef = useRef<AbortController | null>(null);
    const ytRenderAbortRef = useRef<AbortController | null>(null);
    const ytOpenSessionIdRef = useRef<string | null>(null);
    const ytAutoPreviewPendingRef = useRef<Set<number>>(new Set());
    const ytClipsPackId = 0;
    const [ytPreviewKick, setYtPreviewKick] = useState(0);
    const [ytCloudClipInfoModal, setYtCloudClipInfoModal] = useState<null | {
        title: string;
        clipNum: number;
        clipTiming?: { start_sec: number; end_sec: number };
        premiumClip?: YoutubeVerticalClip;
        fallbackDesc?: string;
        downloadUrl?: string | null;
        filenameHint?: string;
    }>(null);

    const [ytEmbedOrigin, setYtEmbedOrigin] = useState('');

    const storageCal = `agentme_social_calendar_${userId}`;
    const storageHook = `agentme_social_hooklab_${userId}`;
    const storageYt = `agentme_social_ytclips_${userId}`;

    // --- Synchronize Refs ---
    ytAutomatedPreviewRef.current = ytAutomatedPreviewByClip;
    ytOpenSessionIdRef.current = ytOpenSessionId;

    // --- Effects ---
    useEffect(() => {
        return () => {
            Object.values(ytAutomatedPreviewRef.current).forEach(u => {
                try { URL.revokeObjectURL(u); } catch { }
            });
        };
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') setYtEmbedOrigin(window.location.origin);
    }, []);

    // Session status fake progress
    useEffect(() => {
        const busy = ytRenderingClipIndex !== null || ytRenderZipLoading;
        if (!busy) { setYtRenderFakeProgress(0); return; }
        const t0 = Date.now();
        const id = setInterval(() => {
            const elapsed = Date.now() - t0;
            setYtRenderFakeProgress(Math.min(91, (elapsed / 200000) * 91));
        }, 600);
        return () => clearInterval(id);
    }, [ytRenderingClipIndex, ytRenderZipLoading]);

    useEffect(() => {
        if (!ytLoading) { setYtAnalysisFakeProgress(0); return; }
        const t0 = Date.now();
        const id = setInterval(() => {
            const elapsed = Date.now() - t0;
            setYtAnalysisFakeProgress(Math.min(88, (elapsed / 100000) * 88));
        }, 450);
        return () => clearInterval(id);
    }, [ytLoading]);

    // Load persisted data
    useEffect(() => {
        aliveRef.current = true;
        try {
            const cal = sessionStorage.getItem(storageCal);
            if (cal) {
                const parsed = JSON.parse(cal) as EditorialCalendarResult;
                if (parsed?.posts?.length) setCalendar(parsed);
            }
            const hlb = sessionStorage.getItem(storageHook);
            if (hlb) {
                const parsed = JSON.parse(hlb) as HookLabResult;
                if (parsed?.hooks?.length) setHookLab(parsed);
            }
            const ys = sessionStorage.getItem(storageYt);
            if (ys) {
                const parsed = JSON.parse(ys);
                if (parsed?.videoId && parsed.clips?.length) {
                    setYtVideoId(parsed.videoId);
                    setYtVideoTitle(parsed.videoTitle ?? null);
                    setYtClips(parsed.clips.map((c: any) => ensureYoutubeClipShape(c)));
                    setYtTitleHint(parsed.video_title_hint ?? null);
                }
            }
        } catch { }

        return () => {
            aliveRef.current = false;
            editorialAbortRef.current?.abort();
            hookAbortRef.current?.abort();
            ytAbortRef.current?.abort();
            ytRenderAbortRef.current?.abort();
        };
    }, [userId, storageCal, storageHook, storageYt]);

    // Load Settings
    const loadSettings = useCallback(async () => {
        setSettingsLoading(true);
        const { data, error } = await supabase.from('social_settings').select('*').eq('user_id', userId).maybeSingle();
        if (data) {
            setNiche(data.niche ?? '');
            setAudience(data.audience ?? '');
            setTone(data.tone ?? 'profesional y cercano');
            setMainPlatform(data.main_platform ?? 'Instagram');
            if (!hookTopic.trim()) setHookTopic(data.niche ?? '');
        }
        setSettingsLoading(false);
    }, [supabase, userId, hookTopic]);

    useEffect(() => { 
        loadSettings(); 
    }, [loadSettings]);


    // --- Handlers ---
    const savePreferences = async () => {
        setSavingPrefs(true);
        const { error } = await supabase.from('social_settings').upsert({
            user_id: userId,
            niche: niche.trim(),
            audience: audience.trim(),
            tone: tone.trim(),
            main_platform: mainPlatform.trim(),
            updated_at: new Date().toISOString()
        });
        setSavingPrefs(false);
        if (error) setSettingsErr(error.message);
    };

    const generate = async () => {
        if (!niche.trim()) return;
        setGenLoading(true);
        setCalendar(null);
        try {
            const res = await fetch('/api/social/editorial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ niche, audience, tone, mainPlatform, language })
            });
            const data = await res.json();
            if (data.calendar) {
                setCalendar(data.calendar);
                sessionStorage.setItem(storageCal, JSON.stringify(data.calendar));
            } else {
                setGenErr(data.message || 'Error al generar calendario');
            }
        } catch { setGenErr('Error de conexión'); }
        finally { setGenLoading(false); }
    };

    const generateHookLab = async () => {
        if (!hookTopic.trim()) return;
        setHookLoading(true);
        setHookLab(null);
        try {
            const res = await fetch('/api/social/hook-lab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: hookTopic, audience, tone, language })
            });
            const data = await res.json();
            if (data.hookLab) {
                setHookLab(data.hookLab);
                sessionStorage.setItem(storageHook, JSON.stringify(data.hookLab));
            } else {
                setHookErr(data.message || 'Error al generar Hook Lab');
            }
        } catch { setHookErr('Error de conexión'); }
        finally { setHookLoading(false); }
    };

    const runYoutubeClips = async () => {
        if (!ytUrl.trim()) return;
        setYtLoading(true);
        setYtClips([]);
        try {
            const res = await fetch('/api/social/youtube-clips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ youtubeUrl: ytUrl, captionLang: ytCaptionLang, language })
            });
            const data = await res.json();
            if (data.clips && data.videoId) {
                const clips = data.clips.map((c: any) => ensureYoutubeClipShape(c));
                setYtClips(clips);
                setYtVideoId(data.videoId);
                setYtVideoTitle(data.videoTitle || null);
                sessionStorage.setItem(storageYt, JSON.stringify({ videoId: data.videoId, clips, videoTitle: data.videoTitle || '' }));
            } else {
                setYtErr(data.message || 'No se pudieron extraer clips');
            }
        } catch { setYtErr('Error de conexión'); }
        finally { setYtLoading(false); }
    };

    const loadYtRenderSessions = useCallback(async () => {
        setYtSessionsLoading(true);
        try {
            const res = await fetch('/api/social/youtube-render/sessions');
            const data = await res.json();
            if (Array.isArray(data.sessions)) setYtSessions(data.sessions);
        } catch { }
        finally { setYtSessionsLoading(false); setYtSessionsFetchedOnce(true); }
    }, []);

    // --- Reset ytClips cuando el usuario entra en la sección de Shorts ---
    useEffect(() => {
        if (section === 'ytclips') {
            setYtClips([]);
            setYtVideoId('');
            setYtVideoTitle(null);
            setYtUrl('');
            setYtOpenSessionId(null);
            setYtSessionDetail(null);
            sessionStorage.removeItem(storageYt);
            loadYtRenderSessions();
        }
    }, [section, storageYt, loadYtRenderSessions]);

    // --- Procesar cola de auto-previsualización ---
    useEffect(() => {
        if (ytPreviewKick === 0 || ytRenderingClipIndex !== null) return;
        const pending = Array.from(ytAutoPreviewPendingRef.current);
        const idx = pending.find(i => !ytAutomatedPreviewByClip[i] && !ytCloudMp4UrlByClip[i]);
        if (idx !== undefined) {
            ytAutoPreviewPendingRef.current.delete(idx);
            void generateYoutubeRenderClipPreview(idx);
        }
    }, [ytPreviewKick, ytRenderingClipIndex, ytAutomatedPreviewByClip, ytCloudMp4UrlByClip]);

    const loadYtSessionDetail = useCallback(async (sessionId: string) => {
        setYtOpenSessionId(sessionId);
        setYtSessionDetailLoading(true);
        try {
            const res = await fetch(`/api/social/youtube-render/sessions/${sessionId}`);
            const data = await res.json();
            if (data.success) setYtSessionDetail({ session: data.session, assets: data.assets });
        } catch { }
        finally { setYtSessionDetailLoading(false); }
    }, []);

    const downloadCloudSessionMp4 = useCallback((url: string, filename: string) => {
        void (async () => {
            try {
                const r = await fetch(url);
                const b = await r.blob();
                const u = URL.createObjectURL(b);
                const a = document.createElement('a');
                a.href = u;
                a.download = filename;
                a.click();
                setTimeout(() => URL.revokeObjectURL(u), 5000);
            } catch { setYtRenderErr('Error al descargar'); }
        })();
    }, []);

    const generateYoutubeRenderClipPreview = async (clipIndex: number, opts?: { alsoDownload?: boolean }) => {
        if (!ytVideoId || !ytClips.length) return;
        const c = ytClips[clipIndex];
        if (!c) return;
        setYtRenderingClipIndex(clipIndex);
        try {
            const res = await fetch('/api/social/youtube-render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    youtubeUrl: ytUrl,
                    output: 'mp4',
                    store: true,
                    clipIndex,
                    sessionId: ytRenderSessionId ?? undefined,
                    videoTitle: ytVideoTitle || ytTitleHint || undefined,
                    clipsPlan: buildClipsPlanPayload(ytClips),
                    clips: [{ start_sec: c.start_sec, end_sec: c.end_sec, title: c.title }]
                })
            });
            const data = await res.json();
            if (data.success && data.project?.download_url) {
                const u = data.project.download_url;
                setYtAutomatedPreviewByClip(prev => ({ ...prev, [clipIndex]: u }));
                if (opts?.alsoDownload) {
                   downloadCloudSessionMp4(u, data.project.filename || `clip-${clipIndex + 1}.mp4`);
                }
                if (data.session?.id) setYtRenderSessionId(data.session.id);
            }
        } catch { setYtRenderErr('Error al generar render'); }
        finally { setYtRenderingClipIndex(null); }
    };

    const downloadYoutubeRenderZip = async () => {
        if (!ytVideoId || !ytClips.length) return;
        setYtRenderZipLoading(true);
        try {
            const res = await fetch('/api/social/youtube-render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    youtubeUrl: ytUrl,
                    output: 'zip',
                    store: true,
                    sessionId: ytRenderSessionId ?? undefined,
                    videoTitle: ytVideoTitle || ytTitleHint || undefined,
                    clipsPlan: buildClipsPlanPayload(ytClips),
                    clips: ytClips.map(c => ({ start_sec: c.start_sec, end_sec: c.end_sec, title: c.title }))
                })
            });
            const data = await res.json();
            if (data.success && data.project?.download_url) {
                downloadCloudSessionMp4(data.project.download_url, data.project.filename || 'clips.zip');
            }
        } catch { setYtRenderErr('Error al generar ZIP'); }
        finally { setYtRenderZipLoading(false); }
    };

    const downloadOrRenderYoutubeClipMp4 = (idx: number) => {
        const u = ytAutomatedPreviewByClip[idx] || ytCloudMp4UrlByClip[idx];
        if (u) downloadCloudSessionMp4(u, `clip-${idx+1}.mp4`);
        else generateYoutubeRenderClipPreview(idx, { alsoDownload: true });
    };

    // Helper functions
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

    const copyYtClipsAll = async () => {
        if (!ytVideoId || !ytClips.length) return;
        await navigator.clipboard.writeText(clipsToText(ytVideoId, ytVideoTitle, ytClips));
        flashCopy('ytclips');
    };

    const requestAutoPreviewClip = useCallback((idx: number) => {
        ytAutoPreviewPendingRef.current.add(idx);
        setYtPreviewKick(k => k + 1);
    }, []);

    const ytSessionClipProgress = useMemo(() => {
        if (!ytSessionDetail) return null;
        return sessionClipProgressFromDetail(ytSessionDetail);
    }, [ytSessionDetail]);

    const ytProjectClipsGateActive = Boolean(ytOpenSessionId && ytSessionDetail && ytSessionClipProgress && !ytSessionClipProgress.complete && !ytBypassProjectClipsGate);

    // --- Render ---
    return (
        <div style={{ padding: 32, maxWidth: 860 }}>
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
                />
            )}

            {section === 'hooklab' && (
                <HookLabSection
                    setSection={setSection} isPro={isPro} hl={hl}
                    hookTopic={hookTopic} setHookTopic={setHookTopic}
                    niche={niche} generateHookLab={generateHookLab}
                    hookLoading={hookLoading} hookErr={hookErr}
                    hookLab={hookLab} copyHookLabAll={copyHookLabAll}
                    copiedFlash={copiedFlash} copySingleHook={copySingleHook}
                />
            )}

            {section === 'ytclips' && (
                <YoutubeClipsSection
                    isPro={isPro}
                    ytUrl={ytUrl} setYtUrl={setYtUrl}
                    ytCaptionLang={ytCaptionLang} setYtCaptionLang={setYtCaptionLang}
                    language={language} setLanguage={setLanguage}
                    ytLoading={ytLoading} runYoutubeClips={runYoutubeClips}
                    ytAnalysisFakeProgress={ytAnalysisFakeProgress}
                    ytErr={ytErr} ytRenderErr={ytRenderErr}
                    ytSessions={ytSessions} ytSessionsLoading={ytSessionsLoading}
                    loadYtRenderSessions={loadYtRenderSessions}
                    ytOpenSessionId={ytOpenSessionId} setYtOpenSessionId={setYtOpenSessionId}
                    ytSessionDetail={ytSessionDetail} ytSessionDetailLoading={ytSessionDetailLoading}
                    loadYtSessionDetail={loadYtSessionDetail} setYtSessionDetail={setYtSessionDetail}
                    ytRenderingClipIndex={ytRenderingClipIndex}
                    ytRenderFakeProgress={ytRenderFakeProgress}
                    ytRenderZipLoading={ytRenderZipLoading}
                    ytVideoId={ytVideoId}
                    ytBypassProjectClipsGate={ytBypassProjectClipsGate}
                    setYtBypassProjectClipsGate={setYtBypassProjectClipsGate}
                    ytProjectClipsGateActive={ytProjectClipsGateActive}
                    ytSessionClipProgress={ytSessionClipProgress}
                    ytClips={ytClips} ytVideoTitle={ytVideoTitle || ''}
                    ytTitleHint={ytTitleHint || ''}
                    copyYtClipsAll={copyYtClipsAll} ytCopied={ytCopied}
                    copiedFlash={copiedFlash}
                    downloadYoutubeRenderZip={downloadYoutubeRenderZip}
                    ytAutomatedPreviewByClip={ytAutomatedPreviewByClip}
                    ytCloudMp4UrlByClip={ytCloudMp4UrlByClip}
                    requestAutoPreviewClip={requestAutoPreviewClip}
                    downloadOrRenderYoutubeClipMp4={downloadOrRenderYoutubeClipMp4}
                    setYtCloudClipInfoModal={setYtCloudClipInfoModal}
                    setSection={setSection}
                    downloadCloudSessionMp4={downloadCloudSessionMp4}
                    ytClipsPackId={String(ytClipsPackId)}
                />
            )}
        </div>
    );
}
