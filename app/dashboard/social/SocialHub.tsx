'use client';
import { Layers, Calendar, ArrowRight, Zap, CirclePlay, Sparkles } from 'lucide-react';
import { T, SHADOW, IconTile, SocialSection } from './SocialCommon';
import { EDITORIAL_DAYS, HOOK_LAB_COUNTS, SOCIAL_LIMITS } from '@/lib/social-limits';
import type { SocialPlanTier } from '@/lib/social-limits';

interface SocialHubProps {
    planTier: SocialPlanTier;
    isPro: boolean;
    setSection: (s: SocialSection) => void;
}

export default function SocialHub({ planTier, isPro, setSection }: SocialHubProps) {
    const hl = HOOK_LAB_COUNTS[planTier];

    return (
        <>
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 11, background: T.ink,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, flexShrink: 0,
                    }}>
                        <Layers size={22} strokeWidth={1.75} aria-hidden />
                    </div>
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <h2 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 700, letterSpacing: '-.025em', color: T.ink, margin: 0 }}>
                            Social Mode
                        </h2>
                        <p style={{ fontSize: 13, color: T.ink40, marginTop: 2 }}>Studio para creadores · IA</p>
                    </div>
                    {!isPro && (
                        <div style={{
                            fontSize: 12, fontWeight: 600, color: T.ink40, background: T.paper,
                            border: `1px solid ${T.ink10}`, padding: '5px 14px', borderRadius: 100,
                        }}>
                            Free · límites por semana
                        </div>
                    )}
                </div>
                <p style={{ fontSize: 15, color: T.ink60, lineHeight: 1.65, maxWidth: 720 }}>
                    <strong>Genera contenido como un pro:</strong> calendario de publicaciones, ganchos para reels y{' '}
                    <strong>Shorts listos</strong> desde URL (YouTube hoy): la IA analiza el vídeo, corta los mejores momentos en <strong>9:16</strong> y organiza copy para TikTok, Reels y Shorts.{' '}
                    Pensado para creadores que quieren publicar más sin partir de cero. Sin conectar OAuth.
                </p>
            </div>

            {!isPro && (
                <div style={{
                    background: 'rgba(232,179,64,.12)', border: '1px solid rgba(200,150,40,.25)', borderRadius: 12,
                    padding: '14px 18px', marginBottom: 22, fontSize: 13, color: '#6B5A2E', lineHeight: 1.55,
                }}>
                    Estás en <strong>plan Free</strong> (salida reducida y límites por semana). Sube a <strong>Pro</strong> para calendario de 7 días,
                    Hook Lab completo y más <strong>Shorts listos</strong> (YouTube) al día.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                <button type="button" onClick={() => setSection('editorial')} style={hubButtonStyle} 
                    onMouseEnter={handleHubMouseEnter} onMouseLeave={handleHubMouseLeave}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                        <IconTile icon={Calendar} background="#F0F2EF" iconColor="#5C6560" />
                        <ArrowRight size={20} strokeWidth={1.75} color={T.ink40} aria-hidden />
                    </div>
                    <div>
                        <p style={hubTitleStyle}>Calendario editorial</p>
                        <span style={{ ...hubLabelStyle, color: T.coral, background: 'rgba(232,93,76,.08)' }}>Semanal · IA</span>
                        <p style={hubDescStyle}>
                            Para planificar la semana: carrusel, reel e hilo con hashtags y tips de rodaje. Menos bloqueo ante el calendario.{' '}
                            {isPro ? 'Sin límite de generaciones (Pro).' : `Vista previa de ${EDITORIAL_DAYS.free} días.`}
                        </p>
                    </div>
                </button>

                <button type="button" onClick={() => setSection('hooklab')} style={hubButtonStyle}
                    onMouseEnter={handleHubMouseEnter} onMouseLeave={handleHubMouseLeave}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                        <IconTile icon={Zap} background="#F5EFEA" iconColor={T.coral} />
                        <ArrowRight size={20} strokeWidth={1.75} color={T.ink40} aria-hidden />
                    </div>
                    <div>
                        <p style={hubTitleStyle}>Hook Lab</p>
                        <span style={{ ...hubLabelStyle, color: T.violet, background: 'rgba(123,104,238,.1)' }}>Ganchos · CTA</span>
                        <p style={hubDescStyle}>
                            Abre reels con ideas fuertes: {hl.hooks} ganchos y {hl.angles} {hl.angles === 1 ? 'ángulo' : 'ángulos'}
                            {isPro ? ' + audio y textos en pantalla.' : '.'} Ideal antes de grabar.
                        </p>
                    </div>
                </button>

                <button type="button" onClick={() => setSection('ytclips')} style={hubButtonStyle}
                    onMouseEnter={handleHubMouseEnter} onMouseLeave={handleHubMouseLeave}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                        <IconTile icon={CirclePlay} background="#FDEDED" iconColor="#C41E3A" />
                        <ArrowRight size={20} strokeWidth={1.75} color={T.ink40} aria-hidden />
                    </div>
                    <div>
                        <p style={hubTitleStyle}>Shorts listos</p>
                        <span style={{ ...hubLabelStyle, color: T.coral, background: 'rgba(232,93,76,.1)' }}>URL → IA → proyecto · estilo Opus</span>
                        <p style={hubDescStyle}>
                            Pega un enlace, analizamos el vídeo y generamos clips 9:16 con toda la info. Proyectos en la nube que caducan solos a los 2 días. {isPro ? 'Pro: pack completo (~12 momentos), sin límite de usos.' : 'Free: hasta ~4 momentos por análisis.'}
                        </p>
                    </div>
                </button>

                <div style={{ ...hubButtonStyle, borderStyle: 'dashed', opacity: 0.65, pointerEvents: 'none' }}>
                    <IconTile icon={Sparkles} background="#EEF0F5" iconColor={T.ink40} />
                    <div>
                        <p style={hubTitleStyle}>Más herramientas</p>
                        <span style={{ ...hubLabelStyle, color: T.ink40, background: T.paper }}>Próximamente</span>
                        <p style={hubDescStyle}>Ideas, formatos y flujos nuevos para Social Mode.</p>
                    </div>
                </div>
            </div>
        </>
    );
}

const hubButtonStyle: React.CSSProperties = {
    textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
    background: T.white, borderRadius: 16, padding: '22px 24px', border: `1px solid ${T.ink10}`,
    cursor: 'pointer', fontFamily: T.sans, transition: 'border-color .15s, box-shadow .15s',
};

const hubTitleStyle: React.CSSProperties = {
    fontFamily: T.serif, fontSize: 18, fontWeight: 700, color: T.ink, margin: '0 0 6px'
};

const hubLabelStyle: React.CSSProperties = {
    display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    padding: '4px 10px', borderRadius: 100, marginBottom: 8,
};

const hubDescStyle: React.CSSProperties = {
    fontSize: 13, color: T.ink60, lineHeight: 1.55, margin: 0
};

const handleHubMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = T.ink20;
    e.currentTarget.style.boxShadow = SHADOW.soft;
};

const handleHubMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = T.ink10;
    e.currentTarget.style.boxShadow = 'none';
};
