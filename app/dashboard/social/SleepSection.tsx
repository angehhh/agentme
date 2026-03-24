'use client';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Moon, RefreshCw } from 'lucide-react';
import { T, SHADOW, IconTile, SocialSection } from './SocialCommon';

type SleepJobRow = {
    id: string;
    status: string;
    goal: string;
    state: { phase?: number; trace?: string[] } | null;
    created_at: string;
    updated_at: string;
};

function statusLabel(s: string): string {
    switch (s) {
        case 'pending': return 'En cola';
        case 'processing': return 'En proceso';
        case 'completed': return 'Listo';
        case 'failed': return 'Error';
        default: return s;
    }
}

interface SleepSectionProps {
    setSection: (s: SocialSection) => void;
}

export default function SleepSection({ setSection }: SleepSectionProps) {
    const [goal, setGoal] = useState('');
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [jobs, setJobs] = useState<SleepJobRow[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [hint, setHint] = useState<string | null>(null);

    const loadJobs = useCallback(async () => {
        setListLoading(true);
        setErr(null);
        try {
            const res = await fetch('/api/sleep/jobs');
            const data = await res.json();
            if (data.setupHint)
                setHint('Falta crear la tabla en la base de datos (archivo create_sleep_jobs.sql en el proyecto). Tu equipo técnico puede ejecutarla en Supabase.');
            else
                setHint(null);
            if (Array.isArray(data.jobs))
                setJobs(data.jobs);
            else
                setJobs([]);
        }
        catch {
            setErr('No se pudo cargar la lista.');
            setJobs([]);
        }
        finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadJobs();
    }, [loadJobs]);

    const enqueue = async () => {
        if (!goal.trim())
            return;
        setLoading(true);
        setErr(null);
        try {
            const res = await fetch('/api/sleep/enqueue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal: goal.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setErr(data.message || data.error || 'No se pudo encolar');
                return;
            }
            setGoal('');
            await loadJobs();
        }
        catch {
            setErr('Error de conexión');
        }
        finally {
            setLoading(false);
        }
    };

    const backBtnStyle: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 0', marginBottom: 16, background: 'none', border: 'none',
        fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.ink40, cursor: 'pointer',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 14px', borderRadius: 9, border: `1px solid ${T.ink10}`,
        background: T.paper, fontSize: 14, fontFamily: T.sans, color: T.ink, outline: 'none',
    };

    return (
        <>
            <button type="button" onClick={() => setSection('hub')} style={backBtnStyle}>
                <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
                Todas las herramientas
            </button>
            <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <IconTile icon={Moon} background="#E8E6F5" iconColor="#5B4B8A" />
                    <div>
                        <h2 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', color: T.ink, margin: 0 }}>
                            Trabajos en segundo plano
                        </h2>
                        <p style={{ fontSize: 13, color: T.ink40, marginTop: 4 }}>Beta · tareas diferidas</p>
                    </div>
                </div>
                <p style={{ fontSize: 14, color: T.ink60, lineHeight: 1.6, maxWidth: 640 }}>
                    Deja escrito qué quieres que el asistente haga más tarde. En esta versión inicial el sistema solo registra el trabajo y lo marca como hecho con un resumen breve;
                    más adelante podrás ver aquí el progreso real (borradores, recordatorios, etc.) sin mantener la app abierta.
                </p>
            </div>

            <div style={{ background: T.white, borderRadius: 16, padding: '22px 26px', border: `1px solid ${T.ink10}`, marginBottom: 20, boxShadow: SHADOW.soft }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.ink40, display: 'block', marginBottom: 8 }}>
                    Objetivo (texto libre)
                </label>
                <textarea
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    placeholder="Ej. Preparar resumen semanal de mi nicho, revisar ideas guardadas…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 72, marginBottom: 12 }}
                />
                <button
                    type="button"
                    onClick={() => void enqueue()}
                    disabled={loading || !goal.trim()}
                    style={{
                        padding: '10px 20px', borderRadius: 9, border: 'none',
                        background: loading || !goal.trim() ? T.ink10 : T.ink,
                        color: loading || !goal.trim() ? T.ink40 : T.white,
                        fontWeight: 600, fontSize: 14, fontFamily: T.sans,
                        cursor: loading || !goal.trim() ? 'not-allowed' : 'pointer',
                    }}
                >
                    {loading ? 'Encolando…' : 'Encolar trabajo'}
                </button>
            </div>

            {err && (
                <div style={{
                    background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.2)',
                    borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#8B2E2E',
                }}>
                    {err}
                </div>
            )}
            {hint && !err && (
                <p style={{ fontSize: 12, color: T.ink40, marginBottom: 14, lineHeight: 1.5 }}>{hint}</p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.ink, margin: 0 }}>Tus trabajos recientes</h3>
                <button
                    type="button"
                    onClick={() => void loadJobs()}
                    disabled={listLoading}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.ink10}`,
                        background: T.white, fontSize: 12, fontWeight: 600, cursor: listLoading ? 'wait' : 'pointer',
                        fontFamily: T.sans,
                    }}
                >
                    <RefreshCw size={14} strokeWidth={2} style={{ animation: listLoading ? 'spin .8s linear infinite' : undefined }} />
                    Actualizar
                </button>
            </div>

            {listLoading && jobs.length === 0 ? (
                <p style={{ fontSize: 13, color: T.ink40 }}>Cargando…</p>
            ) : jobs.length === 0 ? (
                <p style={{ fontSize: 13, color: T.ink60 }}>Aún no hay trabajos. Encola uno arriba o ejecuta el cron del worker para vaciar la cola.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {jobs.map(j => (
                        <div
                            key={j.id}
                            style={{
                                background: T.white, borderRadius: 12, padding: '14px 16px',
                                border: `1px solid ${T.ink10}`,
                            }}
                        >
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{
                                    fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em',
                                    padding: '3px 8px', borderRadius: 100,
                                    background: j.status === 'completed' ? 'rgba(40,200,64,.12)' : j.status === 'failed' ? 'rgba(192,57,43,.1)' : T.paper,
                                    color: j.status === 'completed' ? T.green : j.status === 'failed' ? '#C0392B' : T.ink60,
                                }}>
                                    {statusLabel(j.status)}
                                </span>
                                <span style={{ fontSize: 11, color: T.ink40 }}>
                                    {new Date(j.created_at).toLocaleString('es')}
                                </span>
                            </div>
                            <p style={{ fontSize: 14, color: T.ink, margin: 0, lineHeight: 1.45 }}>{j.goal || '—'}</p>
                            {j.status === 'completed' && Array.isArray(j.state?.trace) && j.state!.trace!.length > 0 && (
                                <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12, color: T.ink60 }}>
                                    {j.state!.trace!.map((t, i) => (
                                        <li key={i} style={{ marginBottom: 4 }}>{t}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <p style={{ fontSize: 11, color: T.ink40, marginTop: 20, lineHeight: 1.5 }}>
                Los trabajos en cola se completan cuando el servidor ejecuta su tarea programada (cron). Si ves “En cola” mucho rato, quien administra la app debe revisar esa programación.
            </p>
        </>
    );
}
