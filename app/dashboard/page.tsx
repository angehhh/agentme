'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { generateTips } from '@/lib/tips';
import MissionsView from './MissionsView';
import SocialView from './SocialView';
import { IC, T, type Suggestion, CITIES, LocationInput, JOB_CATEGORIES, QueryInput, WORK_TYPES, EXP_LEVELS, RELEVANCE_COLORS } from './DashboardCommon';
import OpportunityView, { type Profile } from './OpportunityView';

function SleepModal({ onClose }: {
    onClose: () => void;
}) {
    const [goal, setGoal] = useState('');
    const [saved, setSaved] = useState(false);
    return (<div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.55)',
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: T.white, borderRadius: 20, padding: 40, width: '100%',
            maxWidth: 520, boxShadow: '0 32px 80px rgba(0,0,0,.22)', animation: 'slideUp .3s ease' }} onClick={e => e.stopPropagation()}>
        {!saved ? (<>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: T.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.white, marginBottom: 24 }}>{IC.moon}</div>
            <h2 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700,
                letterSpacing: '-.025em', color: T.ink, marginBottom: 8 }}>Sleep Mode</h2>
            <p style={{ fontSize: 14, color: T.ink60, marginBottom: 28, lineHeight: 1.6 }}>
              Define tu objetivo antes de dormir. El agente trabajará a las 3 AM y recibirás un informe a las 7 AM.
            </p>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.ink40,
                textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
              ¿Qué quieres conseguir esta noche?
            </label>
            <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="Ej: Encontrar 5 ofertas de trabajo de diseño UX en Madrid..." style={{ width: '100%', minHeight: 110, padding: '14px 16px', borderRadius: 10,
                border: `1.5px solid ${T.ink10}`, fontSize: 14, fontFamily: T.sans, color: T.ink,
                resize: 'vertical', outline: 'none', lineHeight: 1.6, background: T.paper,
                transition: 'border-color .15s' }} onFocus={e => (e.target.style.borderColor = T.ink)} onBlur={e => (e.target.style.borderColor = T.ink10)}/>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => { if (goal.trim())
            setSaved(true); }} disabled={!goal.trim()} style={{ flex: 1, padding: '13px 0', borderRadius: 9,
                background: goal.trim() ? T.ink : T.ink10,
                color: goal.trim() ? T.white : T.ink40,
                fontSize: 14, fontWeight: 600, border: 'none', fontFamily: T.sans,
                cursor: goal.trim() ? 'pointer' : 'not-allowed' }}>
                Activar Sleep Mode
              </button>
              <button onClick={onClose} style={{ padding: '13px 20px', borderRadius: 9, background: 'transparent',
                color: T.ink60, fontSize: 14, fontWeight: 500,
                border: `1.5px solid ${T.ink10}`, fontFamily: T.sans, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </>) : (<div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(40,200,64,.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', color: T.green, fontSize: 24 }}>✓</div>
            <h3 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 8 }}>
              ¡Sleep Mode activado!
            </h3>
            <p style={{ fontSize: 14, color: T.ink60, lineHeight: 1.6 }}>
              El agente empezará a las 3 AM.<br />Recibirás el informe a las 7 AM.
            </p>
          </div>)}
      </div>
    </div>);
}


type View = 'home' | 'opportunity' | 'social' | 'missions' | 'settings';

export default function DashboardPage() {
    const router = useRouter();
    const supabase = createClient();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [view, setView] = useState<View>('home');
    const [sleepOpen, setSleepOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [nameInput, setNameInput] = useState('');
    const [nameSaved, setNameSaved] = useState(false);
    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
                return;
            }
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (data) {
                setProfile(data);
                setNameInput(data.full_name || '');
            }
            setLoading(false);
        };
        load();
    }, []);
    const handleLogout = async () => { await supabase.auth.signOut(); router.push('/'); };
    const saveName = async () => {
        if (!profile || !nameInput.trim())
            return;
        await supabase.from('profiles').update({ full_name: nameInput.trim() }).eq('id', profile.id);
        setProfile(p => p ? { ...p, full_name: nameInput.trim() } : p);
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 2000);
    };
    if (loading)
        return (<div style={{ minHeight: '100vh', background: T.paper, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontFamily: T.sans }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: `2px solid ${T.ink10}`, borderTopColor: T.ink,
                borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }}/>
        <p style={{ fontSize: 14, color: T.ink40 }}>Cargando...</p>
      </div>
    </div>);
    const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'Usuario';
    const initial = displayName.charAt(0).toUpperCase();
    const modes = [
        { id: 'opportunity' as View, icon: IC.target, name: 'Opportunity Mode', tag: 'Empleo & becas', available: true, sleep: false },
        { id: 'social' as View, icon: IC.social, name: 'Social Mode', tag: 'Calendario IA', available: true, sleep: false },
        { id: null, icon: IC.dollar, name: 'Money Mode', tag: 'Ahorro', available: false, sleep: false },
        { id: null, icon: IC.moon, name: 'Sleep Mode', tag: 'El diferenciador', available: true, sleep: true },
    ];
    const stats = [
        { icon: IC.zap, label: 'Acciones hoy', value: profile?.actions_today ?? 0 },
        { icon: IC.activity, label: 'Misiones activas', value: 0 },
        { icon: IC.inbox, label: 'Plan actual', value: profile?.plan ?? 'free' },
    ];
    const renderNavBtn = ({ id, icon, label }: {
        id: View;
        icon: React.ReactNode;
        label: string;
    }) => (<button key={id} onClick={() => setView(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px',
            borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: T.sans, fontSize: 14,
            fontWeight: view === id ? 600 : 400, background: view === id ? T.paper : 'transparent',
            color: view === id ? T.ink : T.ink60, marginBottom: 2, transition: 'all .15s', textAlign: 'left' }} onMouseEnter={e => { if (view !== id)
        e.currentTarget.style.background = T.paper; }} onMouseLeave={e => { if (view !== id)
        e.currentTarget.style.background = 'transparent'; }}>
      {icon} {label}
    </button>);
    return (<>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:${T.sans}; background:${T.paper}; color:${T.ink}; -webkit-font-smoothing:antialiased; }
        textarea, input { font-family:${T.sans}; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${T.ink10}; border-radius:2px; }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade { animation:fadeIn .35s ease; }
        a { color:inherit; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>

        
        <aside style={{ width: 240, flexShrink: 0, background: T.white, borderRight: `1px solid ${T.ink10}`,
            display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>

          <div style={{ padding: '22px 20px 18px', borderBottom: `1px solid ${T.ink10}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              {IC.logo}
              <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16,
            letterSpacing: '-.02em', color: T.ink }}>AGENTME</span>
            </div>
          </div>

          <nav style={{ padding: '14px 12px', flexGrow: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: T.ink20,
            textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>Principal</p>
            {renderNavBtn({ id: 'home', icon: IC.home, label: 'Inicio' })}
            {renderNavBtn({ id: 'missions', icon: IC.activity, label: 'Misiones' })}
            {renderNavBtn({ id: 'settings', icon: IC.settings, label: 'Ajustes' })}
            <div style={{ height: 1, background: T.ink10, margin: '14px 8px' }}/>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: T.ink20,
            textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>Modos</p>
            {modes.map((m, i) => (<button key={i} onClick={() => { if (m.sleep) {
            setSleepOpen(true);
            return;
        } ; if (m.available && m.id)
            setView(m.id); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px',
                borderRadius: 8, border: 'none', cursor: m.available ? 'pointer' : 'default',
                fontFamily: T.sans, fontSize: 13, fontWeight: view === m.id ? 600 : 400,
                background: view === m.id ? T.paper : 'transparent',
                color: m.available ? (view === m.id ? T.ink : T.ink60) : T.ink20,
                marginBottom: 2, transition: 'all .15s', textAlign: 'left' }} onMouseEnter={e => { if (m.available && view !== m.id)
            e.currentTarget.style.background = T.paper; }} onMouseLeave={e => { if (m.available && view !== m.id)
            e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ opacity: m.available ? 1 : .4 }}>{m.icon}</span>
                <span style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                {!m.available && (<span style={{ fontSize: 9, fontWeight: 700, color: T.ink20, background: T.paper,
                    border: `1px solid ${T.ink10}`, padding: '2px 6px', borderRadius: 4,
                    textTransform: 'uppercase', letterSpacing: '.04em', flexShrink: 0 }}>Pronto</span>)}
              </button>))}
          </nav>

          <div style={{ padding: '14px 12px', borderTop: `1px solid ${T.ink10}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.ink,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.white, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{initial}</div>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.ink,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                <p style={{ fontSize: 11, color: T.ink40 }}>Plan {profile?.plan ?? 'free'}</p>
              </div>
              <button onClick={handleLogout} title="Cerrar sesión" style={{ color: T.ink40, background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, display: 'flex', alignItems: 'center', transition: 'color .15s', flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.color = T.ink)} onMouseLeave={e => (e.currentTarget.style.color = T.ink40)}>
                {IC.logout}
              </button>
            </div>
          </div>
        </aside>

        
        <main style={{ flexGrow: 1, minHeight: '100vh', background: T.paper, overflow: 'auto' }}>
          <div style={{ height: 60, borderBottom: `1px solid ${T.ink10}`, background: T.white,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 32px', position: 'sticky', top: 0, zIndex: 50 }}>
            <h1 style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 700, letterSpacing: '-.02em', color: T.ink }}>
              {view === 'home' && 'Inicio'}{view === 'opportunity' && 'Opportunity Mode'}
              {view === 'social' && 'Social Mode'}
              {view === 'missions' && 'Misiones'}{view === 'settings' && 'Ajustes'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
            color: T.green, background: 'rgba(40,200,64,.1)', padding: '5px 12px', borderRadius: 100 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, display: 'inline-block' }}/>
              Agente activo
            </div>
          </div>

          
          {view === 'home' && (<div className="fade" style={{ padding: 32 }}>
              <div style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: T.serif, fontSize: 'clamp(28px,3vw,40px)', fontWeight: 700,
                letterSpacing: '-.03em', color: T.ink, marginBottom: 6 }}>
                  Bienvenido, <em style={{ fontStyle: 'italic', color: T.ink60 }}>{displayName}</em>
                </h2>
                <p style={{ fontSize: 15, color: T.ink60, lineHeight: 1.6 }}>Tu agente está listo para trabajar por ti.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 32 }}>
                {stats.map((s, i) => (<div key={i} style={{ background: T.white, borderRadius: 14, padding: '22px 24px',
                    border: `1px solid ${T.ink10}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: T.paper,
                    border: `1px solid ${T.ink10}`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: T.ink, flexShrink: 0 }}>{s.icon}</div>
                    <div>
                      <p style={{ fontSize: 12, color: T.ink40, marginBottom: 4 }}>{s.label}</p>
                      <p style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 700,
                    letterSpacing: '-.025em', color: T.ink, textTransform: 'capitalize' }}>{s.value}</p>
                    </div>
                  </div>))}
              </div>

              <div style={{ background: T.ink, borderRadius: 16, padding: '24px 28px', marginBottom: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, display: 'inline-block' }}/>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#484848', letterSpacing: '.06em', textTransform: 'uppercase' }}>Estado del agente</p>
                  </div>
                  <p style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: T.white, letterSpacing: '-.02em' }}>Sin misiones configuradas</p>
                  <p style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Activa un modo para empezar</p>
                </div>
                <button onClick={() => setView('opportunity')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.white, color: T.ink,
                padding: '11px 22px', borderRadius: 9, fontSize: 14, fontWeight: 600, border: 'none',
                fontFamily: T.sans, cursor: 'pointer', transition: 'opacity .15s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '.88')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  {IC.zap} Lanzar agente
                </button>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em', color: T.ink, marginBottom: 16 }}>Modos disponibles</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
                {modes.map((m, i) => (<div key={i} onClick={() => { if (m.sleep) {
                setSleepOpen(true);
                return;
            } ; if (m.available && m.id)
                setView(m.id); }} style={{ background: T.white, borderRadius: 16, padding: 24, border: `1px solid ${T.ink10}`,
                    cursor: m.available ? 'pointer' : 'default', transition: 'all .18s ease' }} onMouseEnter={e => { if (m.available) {
                e.currentTarget.style.borderColor = T.ink;
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)';
            } }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.ink10; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 11,
                    background: m.available ? T.ink : T.paper,
                    border: m.available ? 'none' : `1px solid ${T.ink10}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: m.available ? T.white : T.ink40 }}>{m.icon}</div>
                      {!m.available
                    ? <span style={{ fontSize: 10, fontWeight: 700, color: T.ink40, background: T.paper,
                            padding: '3px 9px', borderRadius: 100, border: `1px solid ${T.ink10}`,
                            textTransform: 'uppercase', letterSpacing: '.06em' }}>Próximamente</span>
                    : <span style={{ fontSize: 11, fontWeight: 700, color: T.green,
                            background: 'rgba(40,200,64,.1)', padding: '3px 10px',
                            borderRadius: 100, letterSpacing: '.04em' }}>Disponible</span>}
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: T.ink40, textTransform: 'uppercase',
                    letterSpacing: '.08em', marginBottom: 6 }}>{m.tag}</p>
                    <h4 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.015em', color: T.ink, marginBottom: 8 }}>{m.name}</h4>
                    {m.available && (<div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 13, fontWeight: 600, color: T.ink }}>
                        Activar {IC.arrowRight}
                      </div>)}
                  </div>))}
              </div>
            </div>)}

          {view === 'opportunity' && profile && (<div className="fade">
              <OpportunityView profile={profile} onProfileUpdate={setProfile}/>
            </div>)}

          {view === 'social' && profile && (<div className="fade">
              <SocialView userId={profile.id} supabase={supabase} planTier={!profile.plan || profile.plan === 'free' ? 'free' : 'pro'}/>
            </div>)}

          {view === 'missions' && profile && (<div className="fade">
              <MissionsView userId={profile.id} supabase={supabase} onNewMission={() => setView('opportunity')}/>
            </div>)}

          {view === 'settings' && (<div className="fade" style={{ padding: 32 }}>
              <div style={{ maxWidth: 540, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: T.white, borderRadius: 16, padding: 28, border: `1px solid ${T.ink10}` }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 24 }}>Perfil</h3>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.ink40,
                textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Nombre completo</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="Tu nombre" style={{ flex: 1, padding: '11px 14px', borderRadius: 9, border: `1.5px solid ${T.ink10}`,
                fontSize: 14, fontFamily: T.sans, color: T.ink, outline: 'none',
                background: T.paper, transition: 'border-color .15s' }} onFocus={e => (e.target.style.borderColor = T.ink)} onBlur={e => (e.target.style.borderColor = T.ink10)}/>
                      <button onClick={saveName} style={{ padding: '11px 18px', borderRadius: 9,
                background: nameSaved ? 'rgba(40,200,64,.1)' : T.ink,
                color: nameSaved ? T.green : T.white, fontSize: 14, fontWeight: 600,
                border: 'none', fontFamily: T.sans, cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap' }}>
                        {nameSaved ? '✓ Guardado' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.ink40,
                textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Email</label>
                    <input value={profile?.email || ''} disabled style={{ width: '100%', padding: '11px 14px', borderRadius: 9,
                border: `1.5px solid ${T.ink10}`, fontSize: 14, fontFamily: T.sans,
                color: T.ink40, background: T.paper, cursor: 'not-allowed' }}/>
                  </div>
                </div>

                <div style={{ background: T.white, borderRadius: 16, padding: 28, border: `1px solid ${T.ink10}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Plan actual</h3>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
                background: (!profile?.plan || profile.plan === 'free') ? T.paper : T.ink,
                color: (!profile?.plan || profile.plan === 'free') ? T.ink60 : T.white,
                border: (!profile?.plan || profile.plan === 'free') ? `1px solid ${T.ink10}` : 'none',
                padding: '4px 12px', borderRadius: 100 }}>
                      {profile?.plan ?? 'Free'}
                    </span>
                  </div>
                  {(!profile?.plan || profile.plan === 'free') ? (<>
                      {['5 búsquedas por día', '1 agente activo', 'Estadísticas básicas del mercado',
                    'Social: 3 días/semana + 2 Hook Labs/semana (vista Free)'].map(f => (<div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: T.ink60, marginBottom: 10 }}>
                          <span style={{ color: T.ink }}>{IC.check}</span> {f}
                        </div>))}
                      <div style={{ padding: '14px 18px', borderRadius: 10, background: T.paper, border: `1px solid ${T.ink10}`, marginTop: 10 }}>
                        <p style={{ fontSize: 13, color: T.ink60, lineHeight: 1.6 }}>
                          Actualiza a <strong style={{ color: T.ink }}>Pro ($12/mes)</strong> para búsquedas ilimitadas, análisis IA y todos los modos.
                        </p>
                      </div>
                    </>) : (<>
                      {['Búsquedas ilimitadas', 'Análisis IA de ofertas', 'Ranking de relevancia personalizado', 'Tendencias y salarios del mercado', 'Demanda por ciudad', 'Todos los modos disponibles',
                    'Social Pro: 7 días, hashtags & producción, Hook Lab completo (80/día)'].map(f => (<div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: T.ink60, marginBottom: 10 }}>
                          <span style={{ color: T.green }}>{IC.check}</span> {f}
                        </div>))}
                      <div style={{ padding: '14px 18px', borderRadius: 10, background: 'rgba(40,200,64,.06)', border: '1px solid rgba(40,200,64,.15)', marginTop: 10 }}>
                        <p style={{ fontSize: 13, color: T.ink60, lineHeight: 1.6 }}>
                          Tienes acceso completo a todas las funciones de AGENTME.
                        </p>
                      </div>
                    </>)}
                </div>

                <div style={{ background: T.white, borderRadius: 16, padding: 28, border: `1px solid ${T.ink10}` }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 16 }}>Sesión</h3>
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent',
                color: '#C0392B', padding: '10px 0', border: 'none', fontSize: 14,
                fontWeight: 600, fontFamily: T.sans, cursor: 'pointer' }}>
                    {IC.logout} Cerrar sesión
                  </button>
                </div>
              </div>
            </div>)}
        </main>
      </div>

      {sleepOpen && <SleepModal onClose={() => setSleepOpen(false)}/>}
    </>);
}
