'use client';
import { ArrowLeft, LayoutGrid, Clapperboard, List, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { T, SHADOW, IconTile, StrokeIcon, SectionLabel, Ico, splitHashtagTokens, SocialSection } from './SocialCommon';
import { EDITORIAL_DAYS } from '@/lib/social-limits';
import type { EditorialCalendarResult, EditorialFormat, EditorialPost } from '@/lib/social-claude';

const FORMAT_LABEL: Record<EditorialFormat, string> = {
    carrusel: 'Carrusel',
    reel: 'Reel',
    hilo: 'Hilo',
};

const FORMAT_COLOR: Record<EditorialFormat, string> = {
    carrusel: T.violet,
    reel: T.coral,
    hilo: T.blue,
};

const FORMAT_ICON: Record<EditorialFormat, LucideIcon> = {
    carrusel: LayoutGrid,
    reel: Clapperboard,
    hilo: List,
};

interface EditorialSectionProps {
    isPro: boolean;
    calDays: number;
    niche: string;
    setNiche: (s: string) => void;
    audience: string;
    setAudience: (s: string) => void;
    tone: string;
    setTone: (s: string) => void;
    mainPlatform: string;
    setMainPlatform: (s: string) => void;
    language: string;
    setLanguage: (s: string) => void;
    calendar: EditorialCalendarResult | null;
    genLoading: boolean;
    generate: () => void;
    savingPrefs: boolean;
    savePrefs: () => void;
    genErr: string | null;
    setSection: (s: SocialSection) => void;
    copyWeek: () => void;
    copyOne: (p: EditorialPost, idx: number) => void;
    copiedFlash: string | null;
}

export default function EditorialSection({
    isPro, calDays, niche, setNiche, audience, setAudience, tone, setTone,
    mainPlatform, setMainPlatform, language, setLanguage,
    calendar, genLoading, generate, savingPrefs, savePrefs,
    genErr, setSection,
    copyWeek, copyOne, copiedFlash
}: EditorialSectionProps) {

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

    const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: T.ink40, display: 'block', marginBottom: 6 };

    return (
        <>
            <button type="button" onClick={() => setSection('hub')} style={backBtnStyle}>
                <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
                Todas las herramientas
            </button>
            <div style={{ marginBottom: 22 }}>
                <h2 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', color: T.ink, margin: '0 0 8px' }}>
                    Calendario editorial
                </h2>
                <p style={{ fontSize: 14, color: T.ink60, lineHeight: 1.6, maxWidth: 640 }}>
                    Define tu nicho, tono y red; la IA propone publicaciones para la semana.
                </p>
            </div>

            <div style={{ background: T.white, borderRadius: 16, padding: '24px 28px', border: `1px solid ${T.ink10}`, marginBottom: 24 }}>
                <h3 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
                    Tu nicho y estilo
                </h3>
                <p style={{ fontSize: 12, color: T.ink40, marginBottom: 18 }}>
                    Se guarda en tu cuenta para la próxima vez.
                </p>
                <>
                    <label style={labelStyle}>Nicho *</label>
                    <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Ej. fitness para gente ocupada, SaaS B2B, recetas veganas rápidas…" style={{ ...inputStyle, marginBottom: 14 }} />
                    <label style={labelStyle}>Audiencia</label>
                    <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="Quién te sigue o a quién quieres llegar" style={{ ...inputStyle, marginBottom: 14 }} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={labelStyle}>Tono</label>
                            <input value={tone} onChange={e => setTone(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Red principal</label>
                            <select value={mainPlatform} onChange={e => setMainPlatform(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                <option value="Instagram">Instagram</option>
                                <option value="TikTok">TikTok</option>
                                <option value="X / Twitter">X / Twitter</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Varias">Varias</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Idioma del contenido</label>
                            <input value={language} onChange={e => setLanguage(e.target.value)} placeholder="español" style={inputStyle} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        <button type="button" onClick={savePrefs} disabled={savingPrefs} style={{
                            padding: '10px 18px', borderRadius: 9, border: `1px solid ${T.ink10}`,
                            background: T.paper, fontWeight: 600, fontSize: 13, fontFamily: T.sans, cursor: savingPrefs ? 'wait' : 'pointer',
                        }}>
                            {savingPrefs ? 'Guardando…' : 'Guardar preferencias'}
                        </button>
                        <button type="button" onClick={generate} disabled={genLoading || !niche.trim()} style={{
                            padding: '10px 22px', borderRadius: 9, border: 'none',
                            background: T.ink, color: T.white, fontWeight: 600, fontSize: 14, fontFamily: T.sans,
                            cursor: genLoading || !niche.trim() ? 'wait' : 'pointer', opacity: !niche.trim() ? 0.5 : 1,
                        }}>
                            {genLoading
                                ? `Generando ${calDays} día${calDays > 1 ? 's' : ''}…`
                                : isPro
                                    ? 'Generar semana completa — 7 días (IA)'
                                    : 'Generar vista previa — 3 días (IA)'}
                        </button>
                    </div>
                    <p style={{ fontSize: 11, color: T.ink40, marginTop: 12 }}>
                        <strong>Calendario:</strong>{' '}
                        Free <strong>1/semana</strong> (lun UTC), solo {EDITORIAL_DAYS.free} ideas · Pro{' '}
                        <strong>sin límite de generaciones</strong> (UTC), {EDITORIAL_DAYS.pro} días + extras.
                    </p>
                </>
            </div>

            {genErr && (
                <div style={{
                    background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.2)', borderRadius: 10,
                    padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#8B2E2E',
                }}>
                    {genErr}
                </div>
            )}

            {calendar && (
                <section style={{ marginBottom: 32 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                        paddingBottom: 12, borderBottom: `1px solid ${T.ink10}`,
                    }}>
                        <IconTile icon={Ico.calendar} />
                        <h3 style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: '-.02em' }}>
                            Calendario editorial
                        </h3>
                        <span style={{
                            marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: T.ink40,
                            background: T.paper, padding: '4px 10px', borderRadius: 100, border: `1px solid ${T.ink10}`,
                        }}>
                            {calendar.posts.length} {calendar.posts.length === 1 ? 'pieza' : 'piezas'}
                        </span>
                    </div>

                    <div style={{
                        background: `linear-gradient(145deg, ${T.white} 0%, #FAFAF8 100%)`,
                        borderRadius: 20,
                        padding: 'clamp(20px, 4vw, 28px)',
                        border: `1px solid ${T.ink10}`,
                        boxShadow: SHADOW.soft,
                        marginBottom: 24,
                    }}>
                        <SectionLabel color={isPro ? T.violet : T.coral}>
                            {isPro ? 'Hilo de la semana' : 'Vista previa · Free'}
                        </SectionLabel>
                        <p style={{
                            fontFamily: T.serif, fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 700,
                            color: T.ink, lineHeight: 1.35, margin: '0 0 12px', letterSpacing: '-.02em',
                        }}>
                            {calendar.week_theme}
                        </p>
                        {!isPro && (
                            <p style={{ fontSize: 13, color: T.coral, margin: 0, fontWeight: 600, opacity: 0.95 }}>
                                {calendar.posts.length} días de muestra · Pro desbloquea 7 días + hashtags y rodaje.
                            </p>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20, alignItems: 'center' }}>
                            <button type="button" onClick={copyWeek} style={{ ...btnGhost, padding: '10px 18px', fontSize: 13 }}>
                                {copiedFlash === 'week' ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                        <StrokeIcon icon={Ico.check} size={18} color={T.green} /> Copiado al portapapeles
                                    </span>
                                ) : (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                        <StrokeIcon icon={Ico.clipboard} size={18} />
                                        {isPro ? 'Copiar semana completa' : 'Copiar vista previa'}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {calendar.posts.map((p, idx) => (
                            <article key={`${p.day}-${idx}`} style={{
                                background: T.white,
                                borderRadius: 18,
                                overflow: 'hidden',
                                border: `1px solid ${T.ink10}`,
                                boxShadow: SHADOW.card,
                            }}>
                                <div style={{
                                    display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 0,
                                    borderBottom: `1px solid ${T.ink10}`,
                                    background: `linear-gradient(90deg, ${FORMAT_COLOR[p.format]}12 0%, transparent 55%)`,
                                }}>
                                    <div style={{
                                        minWidth: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: FORMAT_COLOR[p.format], color: T.white, fontFamily: T.serif,
                                        fontSize: 22, fontWeight: 800, padding: '14px 12px',
                                    }}>
                                        {p.day}
                                    </div>
                                    <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                                        <IconTile icon={FORMAT_ICON[p.format]} box={40} size={20} />
                                        <span style={{
                                            fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
                                            color: T.white, background: FORMAT_COLOR[p.format], padding: '5px 12px', borderRadius: 8,
                                        }}>
                                            {FORMAT_LABEL[p.format]}
                                        </span>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{p.day_label}</span>
                                        <span style={{
                                            marginLeft: 'auto', fontSize: 12, color: T.ink40, fontWeight: 500,
                                            padding: '4px 10px', borderRadius: 8, background: T.paper, border: `1px solid ${T.ink10}`,
                                        }}>
                                            {p.platforms}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ padding: '20px 22px 22px' }}>
                                    <h4 style={{ fontSize: 17, fontWeight: 700, color: T.ink, margin: '0 0 16px', lineHeight: 1.3, letterSpacing: '-.015em' }}>
                                        {p.title}
                                    </h4>

                                    <div style={{ marginBottom: 18 }}>
                                        <SectionLabel>Gancho</SectionLabel>
                                        <p style={{
                                            fontSize: 15, color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic',
                                            padding: '14px 16px', borderRadius: 12, background: T.paper, borderLeft: `3px solid ${FORMAT_COLOR[p.format]}`,
                                        }}>
                                            {'\u201c'}{p.hook}{'\u201d'}
                                        </p>
                                    </div>

                                    <div style={{ marginBottom: 18 }}>
                                        <SectionLabel>Estructura</SectionLabel>
                                        <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                                            {p.outline.map((line, i) => (
                                                <li key={i} style={{
                                                    display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10,
                                                    fontSize: 14, color: T.ink60, lineHeight: 1.55,
                                                }}>
                                                    <span style={{
                                                        flexShrink: 0, width: 26, height: 26, borderRadius: 8,
                                                        background: T.paper, border: `1px solid ${T.ink10}`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 12, fontWeight: 800, color: T.ink,
                                                    }}>
                                                        {i + 1}
                                                    </span>
                                                    <span style={{ paddingTop: 2 }}>{line}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>

                                    <div style={{
                                        padding: '14px 16px', borderRadius: 12, background: 'rgba(12,12,12,.03)',
                                        marginBottom: 16, border: `1px solid ${T.ink10}`,
                                    }}>
                                        <SectionLabel style={{ marginBottom: 6 }}>CTA</SectionLabel>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: T.ink, margin: 0, lineHeight: 1.5 }}>
                                            {p.cta}
                                        </p>
                                    </div>

                                    {p.hashtags && (
                                        <div style={{ marginBottom: 16 }}>
                                            <SectionLabel color={T.violet}>Hashtags</SectionLabel>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {splitHashtagTokens(p.hashtags).map((tag, ti) => (
                                                    <span key={ti} style={{
                                                        fontSize: 12, fontWeight: 600, color: T.violet,
                                                        background: 'rgba(123,104,238,.1)', padding: '6px 11px', borderRadius: 100,
                                                        border: '1px solid rgba(123,104,238,.2)', fontFamily: T.sans,
                                                    }}>
                                                        {tag.startsWith('#') ? tag : `#${tag}`}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {p.production_tip && (
                                        <div style={{
                                            marginBottom: 18, padding: '14px 16px', borderRadius: 12,
                                            background: 'linear-gradient(135deg, rgba(40,200,64,.08) 0%, rgba(40,200,64,.02) 100%)',
                                            border: '1px solid rgba(40,200,64,.2)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                                <IconTile icon={Ico.camera} box={36} size={18} />
                                                <SectionLabel color={T.green} style={{ marginBottom: 0 }}>Producción</SectionLabel>
                                            </div>
                                            <p style={{ fontSize: 13, color: T.ink60, margin: 0, lineHeight: 1.6 }}>{p.production_tip}</p>
                                        </div>
                                    )}

                                    <button type="button" onClick={() => copyOne(p, idx)} style={{
                                        ...btnGhost,
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        borderColor: copiedFlash === `post-${idx}` ? T.green : T.ink10,
                                        background: copiedFlash === `post-${idx}` ? 'rgba(40,200,64,.1)' : T.white,
                                    }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                            <StrokeIcon icon={copiedFlash === `post-${idx}` ? Ico.check : Ico.paperclip} size={16} color={copiedFlash === `post-${idx}` ? T.green : T.ink} />
                                            {copiedFlash === `post-${idx}` ? 'Copiado' : 'Copiar esta pieza'}
                                        </span>
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </>
    );
}
