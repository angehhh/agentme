'use client';
import { ArrowLeft, ExternalLink, Zap } from 'lucide-react';
import { T, SHADOW, IconTile, StrokeIcon, SectionLabel, Ico, STROKE, SocialSection } from './SocialCommon';
import { SOCIAL_LIMITS } from '@/lib/social-limits';
import type { HookLabResult } from '@/lib/social-claude';
import { labelsForHookLabSteps } from '@/lib/user-facing-agent-steps';

type HookLabPipelineMeta = {
    pipelineSteps: string[];
    nicheAnalysis: { summary: string; keywords: string[]; audience_insight: string } | null;
    viralPatterns: string[];
    scriptIdeas: string[];
};

interface HookLabSectionProps {
    isPro: boolean;
    hl: { readonly hooks: number; readonly angles: number };
    hookTopic: string;
    setHookTopic: (s: string) => void;
    niche: string;
    generateHookLab: () => void;
    hookLoading: boolean;
    hookErr: string | null;
    hookLab: HookLabResult | null;
    hookLabMeta: HookLabPipelineMeta | null;
    copyHookLabAll: () => void;
    copySingleHook: (h: string, i: number) => void;
    copiedFlash: string | null;
    setSection: (s: SocialSection) => void;
}

export default function HookLabSection({
    isPro, hl, hookTopic, setHookTopic, niche,
    generateHookLab, hookLoading, hookErr, hookLab, hookLabMeta,
    copyHookLabAll, copySingleHook, copiedFlash,
    setSection
}: HookLabSectionProps) {

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

    return (
        <>
            <button type="button" onClick={() => setSection('hub')} style={backBtnStyle}>
                <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
                Todas las herramientas
            </button>
            <div style={{ marginBottom: 22 }}>
                <h2 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', color: T.ink, margin: '0 0 8px' }}>
                    Hook Lab
                </h2>
                <p style={{ fontSize: 14, color: T.ink60, lineHeight: 1.6, maxWidth: 640 }}>
                    Tu asistente prepara ganchos y ángulos para vídeos cortos. En Pro, primero entiende tu tema y luego te propone el pack (también audio y textos en pantalla). Usa el mismo nicho, tono y audiencia que en el calendario editorial.
                </p>
            </div>
            <div style={{
                background: T.paper, borderRadius: 12, padding: '14px 18px', border: `1px solid ${T.ink10}`,
                marginBottom: 20, fontSize: 13, color: T.ink60, lineHeight: 1.55,
            }}>
                <strong style={{ color: T.ink }}>Preferencias globales</strong> (nicho, audiencia, tono, red) se editan en el calendario editorial.{' '}
                <button type="button" onClick={() => setSection('editorial')} style={{
                    background: 'none', border: 'none', padding: 0, margin: 0, fontFamily: T.sans, fontSize: 13,
                    fontWeight: 700, color: T.coral, cursor: 'pointer', textDecoration: 'underline',
                }}>
                    Abrir calendario editorial
                </button>
            </div>

            <div style={{ background: T.white, borderRadius: 16, padding: '24px 28px', border: `1px solid ${T.ink10}`, marginBottom: 24 }}>
                <h3 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
                    Generar pack de hooks
                </h3>
                <p style={{ fontSize: 13, color: T.ink60, marginBottom: 16, lineHeight: 1.55 }}>
                    {isPro ? (
                        <>
                            Pack Pro: <strong>{hl.hooks} ganchos</strong>, <strong>{hl.angles} ángulos</strong>, sugerencia de <strong>audio</strong> y{' '}
                            <strong>3 textos</strong> para overlay — mismo tema, listo para rodar.
                        </>
                    ) : (
                        <>
                            Vista Free: <strong>{hl.hooks} ganchos</strong> y <strong>{hl.angles} ángulo</strong> por tema (vídeo corto vertical).
                        </>
                    )}
                </p>
                <label style={labelStyle}>Tema del vídeo *</label>
                <input value={hookTopic} onChange={e => setHookTopic(e.target.value)} placeholder="Ej. Por qué tu rutina de skincare no funciona, errores al invertir si eres principiante…" style={{ ...inputStyle, marginBottom: 14 }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                    <button type="button" onClick={() => setHookTopic(niche.trim())} disabled={!niche.trim()} style={{
                        padding: '8px 14px', borderRadius: 9, border: `1px solid ${T.ink10}`,
                        background: T.paper, fontWeight: 600, fontSize: 12, fontFamily: T.sans,
                        cursor: niche.trim() ? 'pointer' : 'not-allowed', opacity: niche.trim() ? 1 : 0.5,
                    }}>
                        Usar mi nicho como tema
                    </button>
                    <button type="button" onClick={generateHookLab} disabled={hookLoading || !hookTopic.trim()} style={{
                        padding: '10px 22px', borderRadius: 9, border: 'none',
                        background: T.coral, color: T.white, fontWeight: 600, fontSize: 14, fontFamily: T.sans,
                        cursor: hookLoading || !hookTopic.trim() ? 'wait' : 'pointer', opacity: !hookTopic.trim() ? 0.5 : 1,
                    }}>
                        {hookLoading ? 'Tu asistente está trabajando…' : 'Generar pack de hooks'}
                    </button>
                </div>
                <p style={{ fontSize: 11, color: T.ink40, marginTop: 12 }}>
                    <strong>Hook Lab:</strong> Free <strong>{SOCIAL_LIMITS.hookLab.freePerWeek}/semana</strong> (lun UTC) · Pro{' '}
                    <strong>sin límite</strong> (UTC).
                </p>
            </div>

            {hookLoading && (
                <div style={{
                    marginBottom: 20, padding: '16px 18px', background: T.paper,
                    borderRadius: 12, border: `1px solid ${T.ink10}`,
                }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.ink, margin: '0 0 12px' }}>
                        {isPro ? 'Así va avanzando tu asistente' : 'Preparando tu pack'}
                    </p>
                    {(isPro
                        ? [
                            'Entendiendo de qué va tu tema…',
                            'Buscando formatos que suelen funcionar en vídeo corto…',
                            'Esquematizando ideas que puedes grabar…',
                            'Escribiendo ganchos y ángulos listos para usar…',
                        ]
                        : [
                            'Leyendo tu tema y preferencias…',
                            'Creando ganchos y ángulos para tu vídeo…',
                        ]
                    ).map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
                            color: T.ink60, marginBottom: 10,
                            animation: `fadeIn .4s ${i * 0.35}s ease both`, opacity: 0 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.ink20, flexShrink: 0 }}/>
                            {step}
                        </div>
                    ))}
                </div>
            )}

            {hookErr && (
                <div style={{
                    background: 'rgba(232,93,76,.1)', border: '1px solid rgba(232,93,76,.25)', borderRadius: 10,
                    padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#9A3D2E',
                }}>
                    {hookErr}
                </div>
            )}

            {hookLab && hookLabMeta && hookLabMeta.pipelineSteps.length > 0 && (
                <div style={{
                    background: T.paper, borderRadius: 14, padding: '16px 18px',
                    border: `1px solid ${T.ink10}`, marginBottom: 20, fontSize: 13, color: T.ink60, lineHeight: 1.55,
                }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: T.ink40, textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 10px' }}>
                        Qué ha hecho antes de los ganchos
                    </p>
                    <p style={{ margin: '0 0 10px', fontFamily: T.sans, fontSize: 12, color: T.ink40 }}>
                        Tu asistente ha seguido estos pasos (en orden):
                    </p>
                    <ol style={{ margin: '0 0 14px', paddingLeft: 20, color: T.ink, fontWeight: 600, fontSize: 13 }}>
                        {labelsForHookLabSteps(hookLabMeta.pipelineSteps).map((label, i) => (
                            <li key={i} style={{ marginBottom: 6 }}>{label}</li>
                        ))}
                    </ol>
                    {isPro && hookLabMeta.nicheAnalysis && (
                        <>
                            <p style={{ margin: '12px 0 6px', fontWeight: 700, color: T.ink, fontSize: 13 }}>Tu tema, en pocas palabras</p>
                            <p style={{ margin: 0 }}>{hookLabMeta.nicheAnalysis.summary}</p>
                            <p style={{ margin: '8px 0 0', fontSize: 12 }}>
                                <strong>Palabras clave:</strong> {hookLabMeta.nicheAnalysis.keywords.join(', ')}
                            </p>
                            {hookLabMeta.nicheAnalysis.audience_insight && (
                                <p style={{ margin: '6px 0 0', fontSize: 12 }}>
                                    <strong>Qué suele importar a tu audiencia:</strong> {hookLabMeta.nicheAnalysis.audience_insight}
                                </p>)}
                        </>)}
                    {isPro && hookLabMeta.viralPatterns.length > 0 && (
                        <>
                            <p style={{ margin: '14px 0 6px', fontWeight: 700, color: T.ink, fontSize: 13 }}>Formatos que encajan con tu tema</p>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                                {hookLabMeta.viralPatterns.map((p, i) => (<li key={i} style={{ marginBottom: 4 }}>{p}</li>))}
                            </ul>
                        </>)}
                    {isPro && hookLabMeta.scriptIdeas.length > 0 && (
                        <>
                            <p style={{ margin: '14px 0 6px', fontWeight: 700, color: T.ink, fontSize: 13 }}>Ideas rápidas para plantear el vídeo</p>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                                {hookLabMeta.scriptIdeas.map((p, i) => (<li key={i} style={{ marginBottom: 4 }}>{p}</li>))}
                            </ul>
                        </>)}
                    {isPro && (hookLabMeta.nicheAnalysis || hookLabMeta.viralPatterns.length > 0) && (
                        <p style={{ margin: '14px 0 0', fontSize: 11, color: T.ink40 }}>
                            Usamos esto para que los ganchos y ángulos encajen mejor con lo que quieres contar.
                        </p>)}
                </div>
            )}

            {hookLab && (
                <section style={{ marginBottom: 32 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                        paddingBottom: 12, borderBottom: `1px solid ${T.ink10}`,
                    }}>
                        <IconTile icon={Ico.zap} />
                        <h3 style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: '-.02em' }}>
                            Hook Lab
                        </h3>
                        <span style={{
                            marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#B84A3D',
                            background: 'rgba(232,93,76,.1)', padding: '4px 10px', borderRadius: 100,
                        }}>
                            {hookLab.hooks.length} hooks · {hookLab.angles.length} ángulos
                        </span>
                    </div>

                    <div style={{
                        background: `linear-gradient(145deg, #FFF9F7 0%, ${T.white} 100%)`,
                        borderRadius: 20,
                        padding: 'clamp(20px, 4vw, 28px)',
                        border: `1px solid rgba(232,93,76,.15)`,
                        boxShadow: SHADOW.soft,
                        marginBottom: 24,
                    }}>
                        <SectionLabel color={T.coral}>Tema del vídeo</SectionLabel>
                        <p style={{
                            fontFamily: T.serif, fontSize: 'clamp(1.2rem, 2.8vw, 1.45rem)', fontWeight: 700,
                            color: T.ink, lineHeight: 1.35, margin: '0 0 16px',
                        }}>
                            {hookLab.topic}
                        </p>
                        <button type="button" onClick={copyHookLabAll} style={{ ...btnGhost, padding: '10px 18px', fontSize: 13 }}>
                            {copiedFlash === 'hooklab' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <StrokeIcon icon={Ico.check} size={18} color={T.green} /> Todo copiado
                                </span>
                            ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <StrokeIcon icon={Ico.clipboard} size={18} /> Copiar informe completo
                                </span>
                            )}
                        </button>
                    </div>

                    <div style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: 14, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: '-.01em' }}>
                                Ganchos de apertura
                            </h4>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.ink40 }}>
                                Toca <StrokeIcon icon={Ico.paperclip} size={14} /> para copiar uno solo
                            </span>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                            gap: 12,
                        }}>
                            {hookLab.hooks.map((h, i) => (
                                <div key={i} style={{
                                    position: 'relative', background: T.white, borderRadius: 14, padding: '14px 16px',
                                    border: `1px solid ${T.ink10}`, boxShadow: SHADOW.card,
                                    display: 'flex', gap: 12, alignItems: 'flex-start',
                                }}>
                                    <span style={{
                                        flexShrink: 0, width: 28, height: 28, borderRadius: 10, background: T.ink, color: T.white,
                                        fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontFamily: T.sans,
                                    }}>
                                        {i + 1}
                                    </span>
                                    <p style={{ flex: 1, fontSize: 14, color: T.ink60, lineHeight: 1.55, margin: 0, paddingRight: 36 }}>
                                        {h}
                                    </p>
                                    <button type="button" title="Copiar gancho" onClick={() => copySingleHook(h, i)} style={{
                                        position: 'absolute', top: 10, right: 10,
                                        width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.ink10}`,
                                        background: copiedFlash === `hook-${i}` ? 'rgba(40,200,64,.12)' : T.paper,
                                        cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <StrokeIcon icon={copiedFlash === `hook-${i}` ? Ico.check : Ico.paperclip} size={16} color={copiedFlash === `hook-${i}` ? T.green : T.ink} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {hookLab.sound_mood && (
                        <div style={{
                            marginBottom: 24, padding: '18px 20px', borderRadius: 16,
                            background: 'linear-gradient(135deg, rgba(37,99,235,.08) 0%, rgba(37,99,235,.02) 100%)',
                            border: '1px solid rgba(37,99,235,.18)',
                            boxShadow: SHADOW.card,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                <IconTile icon={Ico.music} box={46} size={22} />
                                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: T.blue }}>
                                    Audio sugerido
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: T.white, background: T.blue, padding: '2px 8px', borderRadius: 100 }}>
                                    Pro
                                </span>
                            </div>
                            <p style={{ fontSize: 15, color: T.ink60, margin: '0 0 12px', lineHeight: 1.6 }}>{hookLab.sound_mood}</p>
                            <p style={{
                                fontSize: 12, color: T.ink40, margin: '0 0 14px', lineHeight: 1.5,
                                padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,.65)', border: `1px solid ${T.ink10}`,
                            }}>
                                <strong style={{ color: T.ink60 }}>No hay nada que reproducir aquí:</strong> esto es una orientación para que elijas música,
                                voz en off o sonidos en TikTok, CapCut, Instagram, bibliotecas libres de derechos, etc.
                            </p>
                            <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${hookLab.topic} música ${hookLab.sound_mood}`.slice(0, 180))}`} target="_blank" rel="noopener noreferrer" style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600,
                                color: T.blue, textDecoration: 'none', fontFamily: T.sans,
                            }}>
                                <ExternalLink size={16} strokeWidth={STROKE} />
                                Buscar inspiración en YouTube
                            </a>
                        </div>
                    )}

                    {hookLab.on_screen_texts && hookLab.on_screen_texts.length > 0 && (
                        <div style={{ marginBottom: 28 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <IconTile icon={Ico.mobile} />
                                <h4 style={{ fontSize: 14, fontWeight: 800, color: T.ink, margin: 0 }}>Textos en pantalla</h4>
                                <span style={{ fontSize: 10, fontWeight: 700, color: T.white, background: T.blue, padding: '2px 8px', borderRadius: 100 }}>
                                    Pro
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {hookLab.on_screen_texts.map((t, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                                        background: T.white, borderRadius: 12, border: `1px solid ${T.ink10}`,
                                        fontFamily: 'ui-monospace, monospace', fontSize: 13, color: T.ink,
                                        boxShadow: '0 1px 0 rgba(12,12,12,.04)',
                                    }}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 800, color: T.ink40, width: 52, flexShrink: 0,
                                        }}>
                                            Clip {i + 1}
                                        </span>
                                        <span style={{ fontFamily: T.sans, fontWeight: 600 }}>{t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 style={{ fontSize: 14, fontWeight: 800, color: T.ink, margin: '0 0 14px', letterSpacing: '-.01em' }}>
                            Ángulos narrativos
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {hookLab.angles.map((a, i) => (
                                <div key={i} style={{
                                    display: 'flex', gap: 16, alignItems: 'flex-start',
                                    background: T.white, borderRadius: 16, padding: '18px 20px',
                                    border: `1px solid ${T.ink10}`, boxShadow: SHADOW.card,
                                }}>
                                    <div style={{
                                        flexShrink: 0, width: 40, height: 40, borderRadius: 12,
                                        background: `linear-gradient(135deg, ${T.coral} 0%, #ff8a70 100%)`,
                                        color: T.white, fontWeight: 800, fontSize: 16, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', fontFamily: T.sans,
                                    }}>
                                        {i + 1}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 16, fontWeight: 700, color: T.ink, margin: '0 0 8px', lineHeight: 1.3 }}>
                                            {a.title}
                                        </p>
                                        <p style={{ fontSize: 14, color: T.ink60, lineHeight: 1.6, margin: 0 }}>{a.pitch}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}

const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: T.ink40, display: 'block', marginBottom: 6 };
