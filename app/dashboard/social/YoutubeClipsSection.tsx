'use client';
import Image from 'next/image';
import { ArrowLeft, Clock, Info, Download, ExternalLink, CirclePlay, Zap } from 'lucide-react';
import { 
    T, SHADOW, IconTile, StrokeIcon, STROKE, formatMmSs, YtCloudRenderProject, 
    SocialSection, parseClipIndex, Ico, OpusProgressOverlay, 
    YtProjectVideoGridGateOverlay, YoutubeClipAutoPreviewObserver, ensureYoutubeClipShape 
} from './SocialCommon';
import { SOCIAL_LIMITS } from '@/lib/social-limits';
import { youtubeWatchUrl, extractYoutubeVideoId } from '@/lib/youtube-video-id';
import { youtubeThumbUrl } from '@/lib/youtube-render-projects';
import { YOUTUBE_RENDER_TTL_DAYS } from '@/lib/constants';
import type { YoutubeVerticalClip } from '@/lib/youtube-clips-claude';
import { CSSProperties, useEffect, useRef } from 'react';

interface YoutubeClipsSectionProps {
    isPro: boolean;
    ytUrl: string;
    setYtUrl: (s: string) => void;
    ytCaptionLang: string;
    setYtCaptionLang: (s: string) => void;
    language: string;
    setLanguage: (s: string) => void;
    ytLoading: boolean;
    runYoutubeClips: () => void;
    ytAnalysisFakeProgress: number;
    ytErr: string | null;
    ytRenderErr: string | null;
    ytSessions: any[];
    ytSessionsLoading: boolean;
    loadYtRenderSessions: () => void;
    ytOpenSessionId: string | null;
    setYtOpenSessionId: (id: string | null) => void;
    ytSessionDetail: any | null;
    ytSessionDetailLoading: boolean;
    loadYtSessionDetail: (id: string) => void;
    setYtSessionDetail: (d: any | null) => void;
    ytRenderingClipIndex: number | null;
    ytRenderFakeProgress: number;
    ytRenderZipLoading: boolean;
    ytVideoId: string;
    ytBypassProjectClipsGate: boolean;
    setYtBypassProjectClipsGate: (b: boolean) => void;
    ytProjectClipsGateActive: boolean;
    ytSessionClipProgress: { required: number; ready: number } | null;
    ytClips: YoutubeVerticalClip[];
    ytVideoTitle: string;
    ytTitleHint: string;
    copyYtClipsAll: () => void;
    ytCopied: boolean;
    copiedFlash: string | null;
    downloadYoutubeRenderZip: () => void;
    ytAutomatedPreviewByClip: Record<number, string>;
    ytCloudMp4UrlByClip: Record<number, string>;
    requestAutoPreviewClip: (idx: number) => void;
    downloadOrRenderYoutubeClipMp4: (idx: number) => void;
    setYtCloudClipInfoModal: (m: any | null) => void;
    setSection: (s: SocialSection) => void;
    downloadCloudSessionMp4: (url: string, fname: string) => void;
    ytClipsPackId: string;
}

export default function YoutubeClipsSection({
    isPro, ytUrl, setYtUrl, ytCaptionLang, setYtCaptionLang, language, setLanguage,
    ytLoading, runYoutubeClips, ytAnalysisFakeProgress, ytErr, ytRenderErr,
    ytSessions, ytSessionsLoading, loadYtRenderSessions,
    ytOpenSessionId, setYtOpenSessionId, ytSessionDetail, ytSessionDetailLoading, loadYtSessionDetail, setYtSessionDetail,
    ytRenderingClipIndex, ytRenderFakeProgress, ytRenderZipLoading,
    ytVideoId, ytBypassProjectClipsGate, setYtBypassProjectClipsGate,
    ytProjectClipsGateActive, ytSessionClipProgress,
    ytClips, ytVideoTitle, ytTitleHint, copyYtClipsAll, ytCopied, copiedFlash,
    downloadYoutubeRenderZip, ytAutomatedPreviewByClip, ytCloudMp4UrlByClip,
    requestAutoPreviewClip, downloadOrRenderYoutubeClipMp4, setYtCloudClipInfoModal,
    setSection, downloadCloudSessionMp4, ytClipsPackId
}: YoutubeClipsSectionProps) {

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 14px', borderRadius: 9, border: `1px solid ${T.ink10}`,
        background: T.paper, fontSize: 14, fontFamily: T.sans, color: T.ink, outline: 'none',
    };

    const btnGhost: React.CSSProperties = {
        padding: '8px 14px', borderRadius: 10, border: `1px solid ${T.ink10}`,
        background: T.white, fontWeight: 600, fontSize: 12, fontFamily: T.sans, cursor: 'pointer',
        boxShadow: '0 1px 0 rgba(12,12,12,.03)', transition: 'border-color .15s, background .15s',
    };

    const backBtnStyle: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 0', marginBottom: 16, background: 'none', border: 'none',
        fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.ink40, cursor: 'pointer',
    };

    const vidStyle: CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        background: '#000',
        display: 'block',
    };

    const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: T.ink40, display: 'block', marginBottom: 6 };
    const numberBadgeStyle: React.CSSProperties = { flexShrink: 0, minWidth: 40, height: 40, borderRadius: 12, background: T.ink, color: T.white, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.sans };
    const ytLinkButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#C41E3A', textDecoration: 'none', fontFamily: T.sans, padding: '8px 14px', borderRadius: 10, border: `1px solid rgba(196,30,58,.25)`, background: '#fff' };
    const previewBoxStyle: React.CSSProperties = { position: 'relative', width: '100%', maxWidth: 240, aspectRatio: '9/16', borderRadius: 14, overflow: 'hidden', background: '#0a0a0a', border: `1px solid ${T.ink10}` };
    const vidOverlayStyle: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000', zIndex: 2 };
    const previewOverlayStyle: React.CSSProperties = { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,.88) 100%)', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, textAlign: 'center' };
    const subLabelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: T.ink40, letterSpacing: '.08em', margin: '0 0 8px' };
    const dlClipButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(196,30,58,.35)', background: '#C41E3A', color: T.white, fontWeight: 600, fontSize: 13, fontFamily: T.sans, width: '100%', justifyContent: 'center' };
    const dlButtonStyle: React.CSSProperties = { position: 'absolute', bottom: 10, left: 8, zIndex: 5, pointerEvents: 'auto', margin: 0, padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(0,0,0,.5)', color: '#7dd3a0', fontSize: 11, fontWeight: 700, fontFamily: T.sans, cursor: 'pointer', backdropFilter: 'blur(6px)' };
    const infoButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.4)', background: 'rgba(0,0,0,.58)', color: '#fff', fontWeight: 800, fontSize: 9, letterSpacing: '.1em', fontFamily: T.sans, cursor: 'pointer', textTransform: 'uppercase' };

    const renderClipCard = (
        clip: any,
        videoUrl: string | null,
        isRendering: boolean,
        renderProgress: number,
        downloadLabel: string,
        onDownload: () => void,
        previewObserver?: React.ReactNode,
        isHistoric?: boolean
    ) => {
        return (
            <article key={clip.clip_index} style={{ background: isHistoric ? '#1e1e1e' : T.white, borderRadius: 16, padding: 20, border: `1px solid ${isHistoric ? '#333' : T.ink10}`, boxShadow: SHADOW.card, position: 'relative' }}>
                {previewObserver}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: isHistoric ? '#fff' : T.ink }}>{clip.title}</h4>
                        <p style={{ fontSize: 12, color: T.coral, fontWeight: 700 }}>{formatMmSs(clip.start_sec)} – {formatMmSs(clip.end_sec)}</p>
                    </div>
                    <a href={youtubeWatchUrl(ytVideoId || (ytSessionDetail?.session?.youtube_video_id), clip.start_sec)} target="_blank" rel="noopener noreferrer" style={{ ...ytLinkButtonStyle, background: isHistoric ? '#2a0a10' : '#fff' }}><ExternalLink size={14} /></a>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300 }}>
                        <div style={previewBoxStyle}>
                            {videoUrl ? (
                                <video src={videoUrl} controls playsInline style={vidOverlayStyle} />
                            ) : (
                                <div style={{
                                    position: 'absolute', inset: 0, zIndex: 1,
                                    background: 'linear-gradient(180deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,.88) 100%)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    padding: 14, textAlign: 'center', gap: 12,
                                }}>
                                    <div style={{ width: 28, height: 28, position: 'relative' }}>
                                        <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(74,222,128,.2)', borderRadius: '50%' }} />
                                        <div style={{ position: 'absolute', inset: 0, border: '3px solid #4ADE80', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#ccc', letterSpacing: '.04em' }}>Procesando MP4 9:16…</p>
                                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                                </div>
                            )}
                            {isRendering && <OpusProgressOverlay visible pct={renderProgress} variant="render" />}
                        </div>
                        <button type="button" onClick={onDownload} disabled={isRendering} style={dlClipButtonStyle}>
                            <Download size={16} /> {downloadLabel}
                        </button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {!isPro && !isHistoric ? (
                            <div style={{ background: '#f8f9fa', padding: 24, borderRadius: 12, border: `1px solid ${T.ink10}`, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(123,104,238,.1)', color: '#7B68EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                    <Zap size={22} />
                                </div>
                                <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: T.ink }}>Desbloquea la IA</h4>
                                <p style={{ fontSize: 13, color: T.ink60, lineHeight: 1.5, margin: 0, maxWidth: 260 }}>
                                    Pásate a Pro para ver los hooks precisos, guiones, textos en pantalla recomendados y copies completos para redes sociales listos para publicar.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div style={{ background: isHistoric ? '#262626' : '#f8f9fa', padding: 16, borderRadius: 12, border: `1px solid ${isHistoric ? '#444' : T.ink10}` }}>
                                    <p style={{ fontSize: 11, fontWeight: 800, color: isHistoric ? '#bbb' : T.ink40, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Hook Sugerido (IA)</p>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: isHistoric ? '#fff' : T.ink, lineHeight: 1.5, margin: 0 }}>&quot;{clip.hook_overlay || clip.hook}&quot;</p>
                                </div>
                                <div style={{ background: isHistoric ? '#262626' : '#f8f9fa', padding: 16, borderRadius: 12, border: `1px solid ${isHistoric ? '#444' : T.ink10}` }}>
                                    <p style={{ fontSize: 11, fontWeight: 800, color: isHistoric ? '#bbb' : T.ink40, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Copy para Redes (IA)</p>
                                    <p style={{ fontSize: 13, color: isHistoric ? '#ddd' : T.ink, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>{clip.publish_description || clip.copy}</p>
                                    {(clip.suggested_hashtags?.length > 0 || clip.hashtags) && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                                            {(Array.isArray(clip.suggested_hashtags) ? clip.suggested_hashtags : String(clip.hashtags || '').split(/[ ,]+/).filter(Boolean)).map((h: string, i: number) => (
                                                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: isHistoric ? '#60a5fa' : '#0066cc', background: isHistoric ? 'rgba(96,165,250,.1)' : 'rgba(0,102,204,.08)', padding: '3px 10px', borderRadius: 100 }}>
                                                    {h.startsWith('#') ? h : `#${h}`}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {isHistoric && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(74,222,128,.1)', borderRadius: 10, color: '#4ade80', fontSize: 12, fontWeight: 600 }}>
                                        <Clock size={16} /> Este proyecto se eliminará automáticamente tras 24h de su creación.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </article>
        );
    };

    return (
        <>
            <button type="button" onClick={() => setSection('hub')} style={backBtnStyle}>
                <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
                Todas las herramientas
            </button>
            <div style={{ marginBottom: 22 }}>
                <h2 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', color: T.ink, margin: '0 0 8px' }}>
                    Shorts listos
                </h2>
                <p style={{ fontSize: 14, color: T.ink60, lineHeight: 1.6, maxWidth: 720 }}>
                    <strong>1)</strong> Pega la <strong>URL</strong> del vídeo largos.{' '}
                    <strong>2)</strong> La <strong>IA analiza</strong> el contenido y propone los mejores cortes con copy y hashtags.{' '}
                    <strong>3)</strong> Al terminar, abre el <strong>proyecto</strong> en la nube.{' '}
                    <strong>4)</strong> A los <strong>{YOUTUBE_RENDER_TTL_DAYS} días</strong> se eliminan solos.
                </p>
            </div>

            <div style={{
                background: '#121212',
                color: '#e8e8e8',
                borderRadius: 16,
                padding: '20px 22px',
                marginBottom: 22,
                border: '1px solid #2a2a2a',
            }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-.02em', color: '#fff' }}>
                            Tus proyectos{' '}
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#888' }}>({ytSessions.length})</span>
                        </h3>
                    </div>
                    <button type="button" onClick={() => { void loadYtRenderSessions(); }} disabled={ytSessionsLoading} style={{
                        padding: '8px 14px', borderRadius: 8, border: '1px solid #444', background: '#1e1e1e', color: '#ddd', fontSize: 12, fontWeight: 600, cursor: ytSessionsLoading ? 'wait' : 'pointer', fontFamily: T.sans,
                    }}>
                        {ytSessionsLoading ? 'Actualizando…' : 'Actualizar'}
                    </button>
                </div>

                {ytSessions.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                        {ytSessions.map(s => {
                            const showProgress = (ytRenderingClipIndex !== null || ytRenderZipLoading) && s.youtube_video_id === ytVideoId;
                            return (
                                <button key={s.id} type="button" onClick={() => {
                                    setYtBypassProjectClipsGate(false);
                                    void loadYtSessionDetail(s.id);
                                }} style={{
                                    textAlign: 'left', cursor: 'pointer', borderRadius: 12, overflow: 'hidden',
                                    background: '#1e1e1e', border: ytOpenSessionId === s.id ? '1px solid #4ade80' : '1px solid #333',
                                    padding: 0, fontFamily: T.sans,
                                }}>
                                    <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
                                        <Image src={s.thumbnail_url} alt="" fill style={{ objectFit: 'cover' }} sizes="(max-width:300px) 100vw, 300px" />
                                        <OpusProgressOverlay visible={showProgress} pct={ytRenderFakeProgress} variant="render" />
                                        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                                            <span style={{ background: 'rgba(0,0,0,.78)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                                                {s.total_assets} archivos
                                            </span>
                                        </div>
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px', background: 'linear-gradient(to top, rgba(0,0,0,.9), transparent)', fontSize: 10, fontWeight: 700, color: '#f2f2f2' }}>
                                            {s.expires_label}
                                        </div>
                                    </div>
                                    <div style={{ padding: 12 }}>
                                        <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                            {s.video_title || s.youtube_video_id}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {ytOpenSessionId && ytSessionDetail && (
                    <div style={{ marginTop: 22, padding: 18, borderRadius: 12, border: '1px solid #333', background: '#1a1a1a' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{ytSessionDetail.session.video_title}</h4>
                            <button type="button" onClick={() => setYtOpenSessionId(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12 }}>Cerrar</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {ytSessionDetail.assets.filter((a: any) => a.kind === 'mp4').map((a: any, ai: number) => {
                                 const plan = ytSessionDetail.session.clips_plan as { clips?: any[] } | null;
                                 const row = plan?.clips?.find(c => parseClipIndex(c.clip_index) === parseClipIndex(a.clip_index));
                                 const shaped = ensureYoutubeClipShape(row || { clip_index: a.clip_index, title: a.title });
                                 
                                 return renderClipCard(
                                     shaped,
                                     a.download_url,
                                     false,
                                     0,
                                     'Descargar MP4 HD',
                                     () => downloadCloudSessionMp4(a.download_url!, `clip-${ai+1}.mp4`),
                                     undefined,
                                     true
                                 );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Auto-refresh de sesión histórica */}
            {ytOpenSessionId && ytSessionDetail && <HistoricSessionPoller sessionId={ytOpenSessionId} assets={ytSessionDetail.assets} loadYtSessionDetail={loadYtSessionDetail} />}

            {/* Formulario y clips nuevos: OCULTOS si hay sesión histórica abierta */}
            {!ytOpenSessionId && (
                <>
                    <div style={{ background: T.white, borderRadius: 16, padding: '24px 28px', border: `1px solid ${T.ink10}`, marginBottom: 24 }}>
                        <label style={labelStyle}>URL de YouTube</label>
                        <input value={ytUrl} onChange={e => setYtUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" style={{ ...inputStyle, marginBottom: 14 }} />
                        <button type="button" onClick={runYoutubeClips} disabled={ytLoading || !ytUrl.trim()} style={{ padding: '10px 22px', borderRadius: 9, border: 'none', background: '#C41E3A', color: T.white, fontWeight: 600, cursor: ytLoading ? 'wait' : 'pointer' }}>
                            {ytLoading ? 'Analizando con IA…' : 'Generar shorts'}
                        </button>
                        {ytErr && (
                            <div style={{ marginTop: 16, background: 'rgba(196,30,58,.08)', border: '1px solid rgba(196,30,58,.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C41E3A', fontWeight: 500 }}>
                                {ytErr}
                            </div>
                        )}
                        {ytRenderErr && (
                            <div style={{ marginTop: 16, background: 'rgba(196,30,58,.08)', border: '1px solid rgba(196,30,58,.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C41E3A', fontWeight: 500 }}>
                                {ytRenderErr}
                            </div>
                        )}
                        {ytLoading && (
                            <div style={{ marginTop: 16, aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                                <OpusProgressOverlay visible pct={ytAnalysisFakeProgress} variant="analysis" />
                            </div>
                        )}
                    </div>

                    {ytClips.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {ytClips.map((c, i) => {
                                const shaped = ensureYoutubeClipShape({ ...c, clip_index: i });
                                const isRendering = ytRenderingClipIndex === i;
                                const dlLabel = isRendering ? 'Generando…' : 'Descargar MP4 HD';
                                const videoUrl = ytAutomatedPreviewByClip[i] ?? ytCloudMp4UrlByClip[i] ?? null;
                                
                                return renderClipCard(
                                    shaped,
                                    videoUrl,
                                    isRendering,
                                    ytRenderFakeProgress,
                                    dlLabel,
                                    () => downloadOrRenderYoutubeClipMp4(i),
                                    <YoutubeClipAutoPreviewObserver clipIndex={i} packResetKey={`${ytVideoId}-${ytClipsPackId}`} onEnterView={requestAutoPreviewClip} />,
                                    false
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </>
    );
}

/* ─── Poller: refresca la sesión histórica cada 8s mientras haya clips sin MP4 ─── */
function HistoricSessionPoller({ sessionId, assets, loadYtSessionDetail }: {
    sessionId: string;
    assets: any[];
    loadYtSessionDetail: (id: string) => void;
}) {
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const mp4s = assets.filter((a: any) => a.kind === 'mp4');
        const allReady = mp4s.length > 0 && mp4s.every((a: any) => !!a.download_url);

        if (allReady) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            loadYtSessionDetail(sessionId);
        }, 8000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [sessionId, assets, loadYtSessionDetail]);

    return null;
}
