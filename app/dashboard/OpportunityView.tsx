'use client';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { generateTips } from '@/lib/tips';
import { IC, T, LocationInput, EXP_LEVELS, RELEVANCE_COLORS } from './DashboardCommon';
import { SHELL } from '@/lib/app-shell';
import { labelsForOpportunitySteps } from '@/lib/user-facing-agent-steps';

export type Profile = {
    id: string;
    email: string;
    full_name: string | null;
    plan: string;
    actions_today: number;
};

export type JobResult = {
    title: string;
    company: string;
    location: string;
    url: string;
    posted: string;
    relevance?: 'alta' | 'media' | 'baja';
    reason?: string;
    tip?: string;
};

type CompanyFilteredRow = {
    name: string;
    job_count: number;
    sample_titles: string[];
    sector_guess?: string;
    angle?: string;
    explore?: string[];
    focus: 'primary' | 'secondary' | 'out';
    filter_reason?: string;
};

type OutreachDraft = {
    job_url: string;
    company: string;
    title: string;
    linkedin_note: string;
    email_opener: string;
    one_liner_value: string;
};

export default function OpportunityView({ profile, onProfileUpdate }: {
    profile: Profile;
    onProfileUpdate: (p: Profile) => void;
}) {
    const supabase = createClient();
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [workType, setWorkType] = useState<string | null>(null);
    const [experience, setExperience] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState<JobResult[]>([]);
    const [total, setTotal] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [limitError, setLimitError] = useState('');
    const [ran, setRan] = useState(false);
    const [expandedSearch, setExpandedSearch] = useState(false);
    const [searchedIn, setSearchedIn] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    const [actionsRemaining, setActionsRemaining] = useState<number | null>(null);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [marketStats, setMarketStats] = useState<{
        totalLinkedIn: number;
        cityDistribution: Record<string, number>;
    } | null>(null);
    const [marketInsights, setMarketInsights] = useState<{
        trends: string;
        salaryRange: string;
        topCities: {
            city: string;
            demand: string;
        }[];
        tip: string;
    } | null>(null);
    const [shareUrl, setShareUrl] = useState('');
    const [sharing, setSharing] = useState(false);
    const [companiesFiltered, setCompaniesFiltered] = useState<CompanyFilteredRow[]>([]);
    const [outreachDrafts, setOutreachDrafts] = useState<OutreachDraft[]>([]);
    const [assistantJourneyLabels, setAssistantJourneyLabels] = useState<string[]>([]);
    const isFree = !profile.plan || profile.plan === 'free';
    const primaryCompanyNames = useMemo(() => new Set(companiesFiltered.filter(c => c.focus === 'primary').map(c => c.name.trim().toLowerCase())), [companiesFiltered]);

    useEffect(() => {
        const loadFavorites = async () => {
            const { data } = await supabase
                .from('favorites')
                .select('url')
                .eq('user_id', profile.id);
            if (data)
                setFavorites(new Set(data.map(f => f.url)));
        };
        loadFavorites();
    }, [profile.id]);

    const handleShare = async () => {
        if (sharing || !jobs.length)
            return;
        setSharing(true);
        try {
            const res = await fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: profile.id,
                    query,
                    location,
                    jobs,
                    total,
                }),
            });
            const data = await res.json();
            if (data.success) {
                const url = `${window.location.origin}/shared/${data.id}`;
                setShareUrl(url);
                await navigator.clipboard.writeText(url);
            }
        }
        catch { }
        setSharing(false);
    };

    const toggleFavorite = async (job: JobResult) => {
        const isFav = favorites.has(job.url);
        if (isFav) {
            await supabase.from('favorites').delete().eq('user_id', profile.id).eq('url', job.url);
            setFavorites(prev => { const n = new Set(prev); n.delete(job.url); return n; });
        }
        else {
            await supabase.from('favorites').insert({
                user_id: profile.id, title: job.title, company: job.company,
                location: job.location, url: job.url, posted: job.posted,
            });
            setFavorites(prev => new Set(prev).add(job.url));
        }
    };

    const runAgent = async () => {
        if (!query.trim())
            return;
        setLoading(true);
        setError('');
        setLimitError('');
        setJobs([]);
        setRan(false);
        setExpandedSearch(false);
        setSearchedIn('');
        setAiSummary('');
        setMarketStats(null);
        setMarketInsights(null);
        setShareUrl('');
        setSharing(false);
        setCompaniesFiltered([]);
        setOutreachDrafts([]);
        setAssistantJourneyLabels([]);
        try {
            const res = await fetch('/api/agent/opportunity', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: profile.id,
                    query: query.trim(),
                    location: location.trim() || 'Spain',
                    workType, experience,
                }),
            });
            const data = await res.json();
            if (data.error === 'limit_reached') {
                setLimitError(data.message);
                return;
            }
            if (!res.ok || data.error) {
                setError(data.error || 'Error al ejecutar el agente');
                return;
            }
            const incoming = (data.jobs || []) as JobResult[];
            const withTips = incoming.map((job: JobResult) => {
                if (job.tip)
                    return job;
                const tips = generateTips(job.title);
                return tips.length > 0 ? { ...job, tip: tips[0] } : job;
            });
            setJobs(withTips);
            setTotal(data.total);
            setExpandedSearch(data.expandedSearch || false);
            setSearchedIn(data.searchedIn || '');
            setAiSummary(data.aiAnalysis || '');
            if (data.marketStats)
                setMarketStats(data.marketStats);
            if (data.marketInsights)
                setMarketInsights(data.marketInsights);
            if (Array.isArray(data.companiesFiltered))
                setCompaniesFiltered(data.companiesFiltered as CompanyFilteredRow[]);
            if (!isFree && Array.isArray(data.outreachDrafts))
                setOutreachDrafts(data.outreachDrafts as OutreachDraft[]);
            if (Array.isArray(data.pipeline?.steps))
                setAssistantJourneyLabels(labelsForOpportunitySteps(data.pipeline.steps as string[]));
            if (data.actionsRemaining !== undefined)
                setActionsRemaining(data.actionsRemaining);
            if (data.actionsUsed !== undefined) {
                onProfileUpdate({ ...profile, actions_today: data.actionsUsed });
            }
            setRan(true);
        }
        catch {
            setError('Error de conexión. Intenta de nuevo.');
        }
        finally {
            setLoading(false);
        }
    };

    const toggleFilter = <T,>(current: T | null, value: T, setter: (v: T | null) => void) => {
        setter(current === value ? null : value);
    };

    const chipStyle = (active: boolean): React.CSSProperties => ({
        padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: active ? 600 : 400,
        border: `1.5px solid ${active ? T.ink : T.ink10}`,
        background: active ? T.ink : 'transparent',
        color: active ? T.white : T.ink60,
        cursor: 'pointer', fontFamily: T.sans, transition: 'all .15s',
    });

    return (
    <div style={{ padding: SHELL.pagePadding, maxWidth: SHELL.contentMax, margin: '0 auto', width: '100%' }}>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: T.ink,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white }}>
            {IC.target}
          </div>
          <div style={{ flexGrow: 1 }}>
            <h2 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 700,
            letterSpacing: '-.025em', color: T.ink }}>Opportunity Mode</h2>
            <p style={{ fontSize: 13, color: T.ink40 }}>Empleo & becas</p>
          </div>
          {isFree && (<div style={{ fontSize: 12, fontWeight: 600, color: T.ink40,
                background: T.paper, border: `1px solid ${T.ink10}`,
                padding: '5px 14px', borderRadius: 100 }}>
              {actionsRemaining !== null
                ? `${actionsRemaining} de 5 búsquedas restantes`
                : `${Math.max(0, 5 - (profile.actions_today || 0))} de 5 búsquedas restantes`}
            </div>)}
        </div>
        <p style={{ fontSize: 15, color: T.ink60, lineHeight: 1.65 }}>
            Tu asistente busca ofertas recientes y te las ordena con contexto útil (en Pro: empresas, mercado y borradores de mensaje).
        </p>
      </div>

      <div style={{ background: T.white, borderRadius: 16, padding: 24,
            border: `1px solid ${T.ink10}`, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.ink40,
            textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Qué buscar</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: T.ink40, pointerEvents: 'none' }}>{IC.search}</span>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="diseño UX, marketing, desarrollo..." style={{ width: '100%', padding: '11px 12px 11px 38px', borderRadius: 9,
            border: `1.5px solid ${T.ink10}`, fontSize: 14, fontFamily: T.sans, color: T.ink,
            outline: 'none', background: T.paper, transition: 'border-color .15s' }} onFocus={e => (e.target.style.borderColor = T.ink)} onBlur={e => (e.target.style.borderColor = T.ink10)} onKeyDown={e => e.key === 'Enter' && runAgent()}/>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.ink40,
            textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Ubicación</label>
            <LocationInput value={location} onChange={setLocation} onEnter={runAgent}/>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.ink40,
            textTransform: 'uppercase', letterSpacing: '.08em' }}>Experiencia</label>
            {experience && (<button onClick={() => setExperience(null)} style={{ fontSize: 10, color: T.ink40, background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: T.sans, textDecoration: 'underline' }}>
                Limpiar
              </button>)}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {EXP_LEVELS.map(exp => (<button key={exp.id} onClick={() => toggleFilter(experience, exp.id, setExperience)} style={chipStyle(experience === exp.id)}>
                {exp.label}
              </button>))}
          </div>
        </div>

        <button onClick={runAgent} disabled={loading || !query.trim()} style={{ display: 'flex', alignItems: 'center', gap: 8,
            background: loading || !query.trim() ? T.ink10 : T.ink,
            color: loading || !query.trim() ? T.ink40 : T.white,
            padding: '12px 24px', borderRadius: 9, fontSize: 14, fontWeight: 600,
            border: 'none', fontFamily: T.sans,
            cursor: loading || !query.trim() ? 'not-allowed' : 'pointer', transition: 'all .15s' }}>
          {loading ? (<><div style={{ width: 14, height: 14, border: `2px solid ${T.ink20}`,
                borderTopColor: T.ink40, borderRadius: '50%', animation: 'spin .7s linear infinite' }}/>
            Buscando ofertas…</>) : (<>{IC.zap} Buscar ofertas</>)}
        </button>

        {loading && (<div style={{ marginTop: 20, padding: '16px 18px', background: T.paper,
                borderRadius: 10, border: `1px solid ${T.ink10}` }}>
            {[`Buscando ofertas de «${query}»${location ? ` en ${location}` : ''}…`,
                'Descartando lo que no encaja con tu búsqueda…',
                ...(experience ? [`Aplicando el nivel de experiencia que elegiste…`] : []),
                ...(isFree
                    ? ['Preparando la lista para ti…']
                    : [
                        'Agrupando empresas que aparecen en los resultados…',
                        'Decidiendo qué empresas encajan mejor contigo…',
                        'Ordenando ofertas y resumiendo el mercado…',
                        'Redactando ideas de mensajes (LinkedIn y email)…',
                        'Últimos retoques…',
                    ]),
            ].map((step, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
                    color: T.ink60, marginBottom: 10,
                    animation: `fadeIn .4s ${i * 0.4}s ease both`, opacity: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.ink20, flexShrink: 0 }}/>
                {step}
              </div>))}
          </div>)}
      </div>

      {limitError && (<div style={{ background: T.ink, borderRadius: 14, padding: '24px 28px', marginBottom: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 6 }}>
            Límite diario alcanzado
          </p>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 16 }}>
            {limitError}
          </p>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                background: T.white, color: T.ink, padding: '10px 22px', borderRadius: 9,
                fontSize: 14, fontWeight: 600, border: 'none', fontFamily: T.sans, cursor: 'pointer' }}>
            Actualizar a Pro — $12/mes
          </button>
        </div>)}

      {error && !limitError && (<div style={{ background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.2)',
                borderRadius: 12, padding: '14px 18px', fontSize: 14, color: '#C0392B', marginBottom: 20 }}>
          {error}
        </div>)}

      {ran && expandedSearch && location && (<div style={{ display: 'flex', alignItems: 'center', gap: 10,
                background: '#FFFBEB', border: '1px solid #F0E68C',
                borderRadius: 10, padding: '11px 16px', marginBottom: 16, fontSize: 13, color: '#7A6A00' }}>
          {IC.info}
          <span>
            No había ofertas de <strong>{query}</strong> en <strong>{location}</strong> esta semana.
            Hemos ampliado la búsqueda a <strong>{searchedIn}</strong>.
          </span>
        </div>)}

      {ran && marketStats && (<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                background: T.white, borderRadius: 12, padding: '14px 20px', border: `1px solid ${T.ink10}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.paper,
                border: `1px solid ${T.ink10}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: T.ink, flexShrink: 0 }}>
            {IC.trending}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
              {marketStats.totalLinkedIn > 0
                ? `Hay ~${marketStats.totalLinkedIn.toLocaleString('es-ES')} ofertas de "${query}" en ${searchedIn || location || 'España'} esta semana`
                : `${total} ofertas encontradas para "${query}" en ${searchedIn || location || 'España'}`}
            </p>
            {Object.keys(marketStats.cityDistribution).length > 1 && (<p style={{ fontSize: 12, color: T.ink40, marginTop: 3 }}>
                {Object.entries(marketStats.cityDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 4)
                    .map(([city, count]) => `${city} (${count})`)
                    .join(' · ')}
              </p>)}
          </div>
        </div>)}

      {ran && !isFree && (aiSummary || marketInsights) && (<div style={{ background: 'linear-gradient(135deg, #0C0C0C 0%, #1a1a2e 100%)',
                borderRadius: 16, padding: '24px 28px', marginBottom: 20 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#7B68EE', background: 'rgba(123,104,238,.15)',
                padding: '3px 10px', borderRadius: 100, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Análisis Pro
            </span>
          </div>

          {aiSummary && (<p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.7, marginBottom: marketInsights ? 20 : 0 }}>
              {aiSummary}
            </p>)}

          {marketInsights && (<>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, padding: '14px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase',
                    letterSpacing: '.08em', marginBottom: 6 }}>Tendencia</p>
                  <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.55 }}>{marketInsights.trends}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, padding: '14px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase',
                    letterSpacing: '.08em', marginBottom: 6 }}>Rango salarial estimado</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: T.white, fontFamily: T.serif,
                    letterSpacing: '-.02em' }}>{marketInsights.salaryRange}</p>
                </div>
              </div>

              {marketInsights.topCities && marketInsights.topCities.length > 0 && (<div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase',
                        letterSpacing: '.08em', display: 'flex', alignItems: 'center', marginRight: 4 }}>Demanda</span>
                  {marketInsights.topCities.map((c, i) => {
                        const demandColor = c.demand.toLowerCase() === 'alta' ? '#28C840'
                            : c.demand.toLowerCase() === 'media' ? '#E8A020' : '#888';
                        return (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6,
                                background: 'rgba(255,255,255,.06)', borderRadius: 8, padding: '6px 12px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#ddd' }}>{c.city}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: demandColor,
                                textTransform: 'uppercase', letterSpacing: '.04em' }}>
                          {c.demand}
                        </span>
                      </div>);
                    })}
                </div>)}

              {marketInsights.tip && (<div style={{ display: 'flex', alignItems: 'center', gap: 8,
                        background: 'rgba(123,104,238,.1)', borderRadius: 8, padding: '10px 14px' }}>
                  {IC.zap}
                  <p style={{ fontSize: 13, color: '#aaa' }}>{marketInsights.tip}</p>
                </div>)}
            </>)}
        </div>)}

      {ran && companiesFiltered.length > 0 && (<div style={{ background: T.white, borderRadius: 16, padding: '22px 24px',
                border: `1px solid ${T.ink10}`, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.ink40,
                textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Empresas en tus resultados
            </span>
            {!isFree && (<span style={{ fontSize: 10, fontWeight: 700, color: '#7B68EE',
                background: 'rgba(123,104,238,.1)', padding: '3px 10px', borderRadius: 100 }}>
                Vista Pro
              </span>)}
          </div>
          <p style={{ fontSize: 13, color: T.ink60, marginBottom: 16, lineHeight: 1.55 }}>
            {isFree
                ? 'Lista de empresas que salen en las ofertas de esta búsqueda.'
                : 'Quién está contratando, con contexto breve y una etiqueta de encaje (prioritaria, secundaria o poco alineada).'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {companiesFiltered.map((c, i) => {
                const fc = c.focus === 'primary'
                    ? { bg: 'rgba(40,200,64,.08)', text: T.green }
                    : c.focus === 'secondary'
                        ? { bg: 'rgba(232,160,32,.1)', text: '#B8860B' }
                        : { bg: T.paper, text: T.ink40 };
                return (<div key={i} style={{ borderRadius: 12, padding: '14px 16px',
                        border: `1px solid ${T.ink10}`, background: fc.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: T.ink40 }}>
                        {c.job_count} oferta{c.job_count === 1 ? '' : 's'}
                      </span>
                      {!isFree && (<span style={{ fontSize: 10, fontWeight: 700,
                            letterSpacing: '.02em', color: fc.text, background: T.white,
                            padding: '2px 8px', borderRadius: 100, border: `1px solid ${T.ink10}` }}>
                          {c.focus === 'primary' ? 'Prioritaria' : c.focus === 'secondary' ? 'También interesante' : 'Poco alineada'}
                        </span>)}
                    </div>
                    {c.sector_guess && (<p style={{ fontSize: 12, color: T.ink60, marginTop: 8 }}>
                        <strong>Sector (estimado):</strong> {c.sector_guess}
                      </p>)}
                    {c.angle && (<p style={{ fontSize: 12, color: T.ink60, marginTop: 6, fontStyle: 'italic', lineHeight: 1.5 }}>
                        {c.angle}
                      </p>)}
                    {c.filter_reason && !isFree && c.focus !== 'primary' && (
                        <p style={{ fontSize: 11, color: T.ink40, marginTop: 6 }}>{c.filter_reason}</p>)}
                    {c.sample_titles && c.sample_titles.length > 0 && (
                        <p style={{ fontSize: 11, color: T.ink40, marginTop: 8 }}>
                          Roles: {c.sample_titles.slice(0, 3).join(' · ')}
                        </p>)}
                    {c.explore && c.explore.length > 0 && !isFree && (
                        <div style={{ marginTop: 10 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: T.ink40, textTransform: 'uppercase',
                                letterSpacing: '.06em', marginBottom: 6 }}>
                            Otras empresas que podrías investigar (solo ideas; no vienen de esta búsqueda)
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {c.explore.map((ex, j) => (<span key={j} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 100,
                                    background: T.paper, border: `1px solid ${T.ink10}`, color: T.ink60 }}>
                                {ex}
                              </span>))}
                          </div>
                        </div>)}
                  </div>);
            })}
          </div>
        </div>)}

      {ran && !isFree && outreachDrafts.length > 0 && (<div style={{ background: 'linear-gradient(135deg, #0F1419 0%, #1a2332 100%)',
                borderRadius: 16, padding: '24px 28px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#5BC0BE', background: 'rgba(91,192,190,.15)',
                padding: '3px 10px', borderRadius: 100, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Mensajes sugeridos
            </span>
            <span style={{ fontSize: 12, color: '#8892a0' }}>Borradores para tus mejores encajes (hasta 5). Revísalos siempre antes de enviar.</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {outreachDrafts.map((o, i) => (<div key={i} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12,
                    padding: '16px 18px', border: '1px solid rgba(255,255,255,.08)' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#e6e8ec', marginBottom: 4 }}>{o.title}</p>
                <p style={{ fontSize: 12, color: '#8892a0', marginBottom: 12 }}>{o.company}</p>
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#5BC0BE', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                    Nota LinkedIn
                  </p>
                  <p style={{ fontSize: 13, color: '#c5cad3', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{o.linkedin_note}</p>
                  <button type="button" onClick={() => navigator.clipboard.writeText(o.linkedin_note)} style={{ marginTop: 8,
                        fontSize: 11, fontWeight: 600, color: '#5BC0BE', background: 'transparent', border: 'none',
                        cursor: 'pointer', fontFamily: T.sans, textDecoration: 'underline' }}>
                    Copiar nota
                  </button>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#8892a0', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                    Apertura email
                  </p>
                  <p style={{ fontSize: 13, color: '#c5cad3', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{o.email_opener}</p>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#8892a0', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                    Propuesta de valor (1 línea)
                  </p>
                  <p style={{ fontSize: 13, color: '#c5cad3', lineHeight: 1.5 }}>{o.one_liner_value}</p>
                </div>
                <a href={o.job_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: '#7B68EE' }}>
                  Ver oferta {IC.externalLink}
                </a>
              </div>))}
          </div>
        </div>)}

      {ran && isFree && (<div style={{ background: T.ink, borderRadius: 14, padding: '22px 26px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#7B68EE', background: 'rgba(123,104,238,.2)',
                padding: '3px 10px', borderRadius: 100, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Pro
            </span>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.white }}>Desbloquea todo el potencial</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
                'Análisis IA de cada oferta',
                'Ranking de relevancia personalizado',
                'Mapa de empresas + filtro por encaje',
                'Borradores de outreach (LinkedIn + email)',
                'Rango salarial estimado',
                'Tendencias del sector',
                'Demanda por ciudad',
                'Búsquedas ilimitadas',
            ].map(f => (<div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888' }}>
                <span style={{ color: '#7B68EE' }}>{IC.check}</span> {f}
              </div>))}
          </div>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                background: T.white, color: T.ink, padding: '10px 22px', borderRadius: 9,
                fontSize: 14, fontWeight: 600, border: 'none', fontFamily: T.sans, cursor: 'pointer' }}>
            Actualizar a Pro — $12/mes
          </button>
        </div>)}

      {ran && (<div>
            <div style={{ marginBottom: 14 }}>
              {assistantJourneyLabels.length > 0 && (
                <div style={{
                  fontSize: 12, color: T.ink60, lineHeight: 1.55, padding: '12px 14px',
                  background: T.paper, borderRadius: 10, border: `1px solid ${T.ink10}`, marginBottom: 14,
                }}>
                  <span style={{ fontWeight: 700, color: T.ink }}>Qué ha hecho tu asistente: </span>
                  {assistantJourneyLabels.join(' · ')}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em', color: T.ink }}>Ofertas</h3>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.green,
                background: 'rgba(40,200,64,.1)', padding: '3px 10px', borderRadius: 100 }}>
                {total} ofertas encontradas
              </span>
              {experience && (<span style={{ fontSize: 11, fontWeight: 600, color: T.ink60,
                    background: T.paper, border: `1px solid ${T.ink10}`,
                    padding: '3px 10px', borderRadius: 100 }}>
                  {EXP_LEVELS.find(e => e.id === experience)?.label}
                </span>)}
            </div>
            <button onClick={handleShare} disabled={sharing} style={{ display: 'flex', alignItems: 'center', gap: 6, background: shareUrl ? 'rgba(40,200,64,.08)' : T.ink,
                color: shareUrl ? T.green : T.white, padding: '7px 14px', borderRadius: 8, border: shareUrl ? `1px solid rgba(40,200,64,.2)` : 'none',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: sharing ? .6 : 1, transition: 'all .2s' }}>
              {shareUrl ? (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Link copiado</>) : sharing ? 'Generando...' : (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Compartir</>)}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jobs.map((job, i) => (<div key={i} style={{ background: T.white, borderRadius: 14, padding: '18px 22px',
                    border: `1px solid ${T.ink10}`,
                    transition: 'border-color .15s, box-shadow .15s',
                    animation: `fadeIn .35s ${i * 0.06}s ease both`, opacity: 0 }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.ink; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.06)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.ink10; e.currentTarget.style.boxShadow = 'none'; }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: T.ink, letterSpacing: '-.01em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.title}
                      </p>
                      {job.relevance && (<span style={{ fontSize: 10, fontWeight: 700, flexShrink: 0,
                        color: RELEVANCE_COLORS[job.relevance]?.text || T.ink40,
                        background: RELEVANCE_COLORS[job.relevance]?.bg || T.paper,
                        padding: '2px 9px', borderRadius: 100, textTransform: 'uppercase',
                        letterSpacing: '.04em' }}>
                          {job.relevance}
                        </span>)}
                      {!isFree && primaryCompanyNames.has((job.company || '').trim().toLowerCase()) && (
                        <span style={{ fontSize: 9, fontWeight: 700, flexShrink: 0, color: T.green,
                            background: 'rgba(40,200,64,.1)', padding: '2px 8px', borderRadius: 100,
                            textTransform: 'uppercase', letterSpacing: '.04em' }}>
                          Encaja muy bien contigo
                        </span>)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: T.ink60 }}>
                        {IC.building} {job.company}
                      </span>
                      {job.location && (<span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: T.ink60 }}>
                          {IC.mapPin} {job.location}
                        </span>)}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.ink40 }}>
                        {IC.clock} {job.posted}
                      </span>
                    </div>
                    {job.reason && (<p style={{ fontSize: 12, color: T.ink40, marginTop: 8, fontStyle: 'italic', lineHeight: 1.5 }}>
                        {job.reason}
                      </p>)}
                    {job.tip && (<div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 10,
                        padding: '8px 12px', borderRadius: 8,
                        background: job.relevance ? 'rgba(123,104,238,.06)' : 'rgba(40,200,64,.06)',
                        border: `1px solid ${job.relevance ? 'rgba(123,104,238,.12)' : 'rgba(40,200,64,.12)'}` }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={job.relevance ? '#7B68EE' : T.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '.06em',
                        color: job.relevance ? '#7B68EE' : T.green }}>
                            {job.relevance ? 'Consejo Pro' : 'Consejo'}
                          </span>
                          <p style={{ fontSize: 12, color: T.ink60, lineHeight: 1.5, marginTop: 2 }}>
                            {job.tip}
                          </p>
                        </div>
                      </div>)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => toggleFavorite(job)} title={favorites.has(job.url) ? 'Quitar de guardados' : 'Guardar oferta'} style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${T.ink10}`,
                    background: favorites.has(job.url) ? '#FFF8E1' : T.white,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all .15s', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={favorites.has(job.url) ? '#E8A020' : 'none'} stroke={favorites.has(job.url) ? '#E8A020' : T.ink40} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </button>
                    <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 7, background: T.ink,
                    color: T.white, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', flexShrink: 0, transition: 'opacity .15s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                      Ver oferta {IC.externalLink}
                    </a>
                  </div>
                </div>
              </div>))}
          </div>
        </div>)}

      {!ran && !loading && !limitError && (<div style={{ background: T.white, borderRadius: 16, padding: '48px 32px',
                textAlign: 'center', border: `1px solid ${T.ink10}` }}>
          <div style={{ width: 52, height: 52, borderRadius: 13, background: T.paper,
                border: `1px solid ${T.ink10}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: T.ink40, margin: '0 auto 20px' }}>{IC.target}</div>
          <h3 style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700,
                letterSpacing: '-.02em', color: T.ink, marginBottom: 10 }}>Listo para buscar</h3>
          <p style={{ fontSize: 14, color: T.ink60, lineHeight: 1.65, maxWidth: 340, margin: '0 auto' }}>
            Escribe qué buscas, selecciona la ciudad y pulsa &quot;Lanzar agente&quot;.
          </p>
        </div>)}
    </div>);
}
