'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
const IC = {
    logo: (<svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <rect width="30" height="30" rx="7" fill="#0C0C0C"/>
      <path d="M15 6L22 10V20L15 24L8 20V10L15 6Z" fill="white" opacity=".95"/>
      <path d="M15 11L19 13.5V18.5L15 21L11 18.5V13.5L15 11Z" fill="#0C0C0C"/>
    </svg>),
    arrowRight: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>),
    check: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>),
    target: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>),
    dollar: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>),
    moon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>),
    social: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>),
    zap: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>),
    clock: (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>),
    activity: (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>),
    search: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>),
    mail: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>),
    star: (<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>),
    shield: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>),
    twitter: (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>),
    linkedin: (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
    </svg>),
    globe: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>),
};
const T = {
    ink: '#0C0C0C',
    ink70: '#484848',
    ink50: '#606060',
    ink30: '#ABABAB',
    ink10: '#E8E8E8',
    paper: '#F5F4F1',
    white: '#FFFFFF',
    green: '#28C840',
    yellow: '#E8E350',
    serif: "'Playfair Display', Georgia, serif",
    sans: "'DM Sans', 'Helvetica Neue', sans-serif",
};
const Dot = ({ color = T.green }: {
    color?: string;
}) => (<span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
        background: color, animation: 'pulse 2s ease-in-out infinite', flexShrink: 0 }}/>);
const Divider = () => (<div style={{ borderTop: `1px solid ${T.ink10}` }}/>);
export default function AgentMeLanding() {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [logStep, setLogStep] = useState(0);
    const [typed, setTyped] = useState('');
    const [caretOn, setCaretOn] = useState(true);
    const [modeIdx, setModeIdx] = useState(0);
    const goal = 'Conseguir 3 reuniones de ventas para mañana';
    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', h, { passive: true });
        return () => window.removeEventListener('scroll', h);
    }, []);
    useEffect(() => {
        let i = 0;
        const iv = setInterval(() => {
            i++;
            setTyped(goal.slice(0, i));
            if (i >= goal.length) {
                setCaretOn(false);
                clearInterval(iv);
            }
        }, 46);
        return () => clearInterval(iv);
    }, []);
    useEffect(() => {
        const iv = setInterval(() => setLogStep(p => Math.min(p + 1, 5)), 920);
        return () => clearInterval(iv);
    }, []);
    useEffect(() => {
        const iv = setInterval(() => setModeIdx(p => (p + 1) % 4), 3200);
        return () => clearInterval(iv);
    }, []);
    const scroll = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    const logs = [
        { t: '03:12', msg: 'Agente inicializado correctamente' },
        { t: '03:41', msg: '847 perfiles analizados en LinkedIn' },
        { t: '04:02', msg: '12 mensajes enviados a prospectos' },
        { t: '05:18', msg: 'Primera respuesta positiva recibida' },
        { t: '06:44', msg: '3 reuniones confirmadas en agenda' },
        { t: '07:00', msg: 'Briefing enviado — misión completada' },
    ];
    const modes = [
        { icon: IC.target, name: 'Opportunity Mode', tag: 'Empleo & becas',
            desc: 'Escanea LinkedIn buscando ofertas de empleo alineadas con tu perfil. Filtra por experiencia, ubicación y más.' },
        { icon: IC.social, name: 'Social Mode', tag: 'Contenido & redes',
            desc: 'Calendario editorial con IA: ideas por nicho en formato carrusel, reel o hilo, con gancho, esquema y CTA. Tú publicas en tus redes.' },
        { icon: IC.dollar, name: 'Money Mode', tag: 'Ahorro · Próximamente',
            desc: 'Comparará precios, encontrará cupones y monitorizará ofertas. Solo te avisará cuando valga la pena.' },
        { icon: IC.moon, name: 'Sleep Mode', tag: 'El diferenciador · Próximamente',
            desc: 'Definirás un objetivo antes de dormir. El agente ejecutará mientras duermes y tendrás resultados al despertar.' },
    ];
    const plans = [
        { name: 'Free', price: '0€', sub: 'siempre',
            items: ['5 búsquedas por día', '1 agente activo', 'Opportunity Mode básico', 'Estadísticas del mercado'],
            cta: 'Empezar gratis', primary: false },
        { name: 'Pro', price: '12€', sub: 'al mes',
            items: ['Búsquedas ilimitadas', 'Análisis IA de ofertas', 'Todos los modos', 'Tendencias y salarios', 'Ranking de relevancia'],
            cta: '7 días gratis', primary: true },
        { name: 'Hustler', price: '39€', sub: 'al mes',
            items: ['Todo lo de Pro', 'Agentes ilimitados', 'Acceso a la API', 'Analytics avanzados', 'Soporte prioritario'],
            cta: 'Contactar', primary: false },
    ];
    const testimonials = [
        { n: 'Sara L.', r: 'Creadora · 22 años', i: 'S',
            t: 'Opportunity Mode me encontró ofertas que ni sabía que existían. En 10 segundos tenía resultados filtrados y relevantes.' },
        { n: 'Carlos R.', r: 'Nómada digital · 27 años', i: 'C',
            t: 'El análisis IA me ahorra horas. Me dice exactamente qué ofertas encajan conmigo y por qué. Brutal.' },
        { n: 'María T.', r: 'Emprendedora · 25 años', i: 'M',
            t: 'Busco trabajo remoto desde España y el agente me filtra solo lo relevante. Ya no pierdo tiempo en LinkedIn.' },
    ];
    const Section = ({ id, bg, children, pt = 130, pb = 130 }: {
        id?: string;
        bg?: string;
        children: React.ReactNode;
        pt?: number;
        pb?: number;
    }) => (<section id={id} style={{ padding: `${pt}px 24px ${pb}px`, background: bg }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>{children}</div>
    </section>);
    const Label = ({ text }: {
        text: string;
    }) => (<p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.11em',
            color: T.ink30, textTransform: 'uppercase', marginBottom: 20 }}>{text}</p>);
    const H2 = ({ children, style = {} }: {
        children: React.ReactNode;
        style?: React.CSSProperties;
    }) => (<h2 style={{ fontFamily: T.serif, fontSize: 'clamp(38px,5vw,62px)',
            letterSpacing: '-.035em', color: T.ink, lineHeight: 1.06,
            ...style }}>{children}</h2>);
    const Btn = ({ label, onClick, variant = 'solid', size = 'md', icon }: {
        label: string;
        onClick: () => void;
        variant?: 'solid' | 'outline' | 'ghost';
        size?: 'md' | 'lg';
        icon?: React.ReactNode;
    }) => {
        const pad = size === 'lg' ? '15px 38px' : '11px 24px';
        const fs = size === 'lg' ? 15 : 14;
        const base: React.CSSProperties = {
            display: 'inline-flex', alignItems: 'center', gap: 9,
            padding: pad, borderRadius: 9, fontSize: fs, fontWeight: 600,
            fontFamily: T.sans, cursor: 'pointer', transition: 'all .18s ease',
            border: 'none',
        };
        const styles: Record<string, React.CSSProperties> = {
            solid: { ...base, background: T.ink, color: T.white },
            outline: { ...base, background: 'transparent', color: T.ink, border: `1.5px solid ${T.ink10}` },
            ghost: { ...base, background: 'transparent', color: T.ink50 },
        };
        return (<button style={styles[variant]} onClick={onClick} onMouseEnter={e => {
                if (variant === 'solid') {
                    e.currentTarget.style.opacity = '.85';
                }
                if (variant === 'outline') {
                    e.currentTarget.style.borderColor = T.ink;
                }
                if (variant === 'ghost') {
                    e.currentTarget.style.color = T.ink;
                }
            }} onMouseLeave={e => {
                if (variant === 'solid') {
                    e.currentTarget.style.opacity = '1';
                }
                if (variant === 'outline') {
                    e.currentTarget.style.borderColor = T.ink10;
                }
                if (variant === 'ghost') {
                    e.currentTarget.style.color = T.ink50;
                }
            }}>
        {label}{icon}
      </button>);
    };
    return (<>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${T.paper}; color: ${T.ink}; font-family: ${T.sans}; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        a { text-decoration: none; color: inherit; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${T.paper}; }
        ::-webkit-scrollbar-thumb { background: #CCCCCC; border-radius: 3px; }
        @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.82)} }
        @keyframes blink   { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fadeUp1 { animation: fadeUp .5s .05s ease both; }
        .fadeUp2 { animation: fadeUp .5s .14s ease both; }
        .fadeUp3 { animation: fadeUp .5s .23s ease both; }
        .fadeUp4 { animation: fadeUp .5s .32s ease both; }
        .fadeUp5 { animation: fadeUp .5s .42s ease both; }
      `}</style>

      <div>

        
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            height: 64,
            background: scrolled ? 'rgba(245,244,241,.94)' : 'transparent',
            backdropFilter: scrolled ? 'blur(20px)' : 'none',
            borderBottom: scrolled ? `1px solid ${T.ink10}` : '1px solid transparent',
            transition: 'all .22s ease',
        }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 28px',
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {IC.logo}
              <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 17,
            letterSpacing: '-.025em', color: T.ink }}>AGENTME</span>
            </div>

            
            <div style={{ display: 'flex', gap: 34 }}>
              {[['Cómo funciona', 'como-funciona'], ['Modos', 'modos'], ['Precios', 'precios']].map(([l, id]) => (<button key={id} onClick={() => scroll(id)} style={{ fontFamily: T.sans, background: 'none', border: 'none',
                fontSize: 14, fontWeight: 500, color: T.ink50, cursor: 'pointer',
                transition: 'color .15s' }} onMouseEnter={e => (e.currentTarget.style.color = T.ink)} onMouseLeave={e => (e.currentTarget.style.color = T.ink50)}>{l}</button>))}
            </div>

            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Btn label="Iniciar sesión" onClick={() => router.push('/auth')} variant="ghost"/>
              <Btn label="Empezar gratis" onClick={() => router.push('/auth')} variant="solid"/>
            </div>
          </div>
        </nav>

        
        <section style={{ paddingTop: 148, paddingBottom: 0, textAlign: 'center', padding: '148px 24px 0' }}>

          
          <div className="fadeUp1" style={{ display: 'inline-flex', alignItems: 'center', gap: 9,
            background: T.ink, color: T.white, borderRadius: 100,
            padding: '7px 18px', fontSize: 13, fontWeight: 500,
            letterSpacing: '.01em', marginBottom: 44 }}>
            <Dot />
            Agente IA para jóvenes ambiciosos
          </div>

          
          <h1 className="fadeUp2" style={{ fontFamily: T.serif,
            fontSize: 'clamp(54px,8.8vw,104px)', lineHeight: 1.01,
            letterSpacing: '-.04em', color: T.ink,
            maxWidth: 900, margin: '0 auto 32px' }}>
            Tu agente trabaja<br />
            <em style={{ fontStyle: 'italic', color: T.ink50 }}>mientras tú vives</em>
          </h1>

          
          <p className="fadeUp3" style={{ fontSize: 18, lineHeight: 1.78, color: T.ink50,
            maxWidth: 480, margin: '0 auto 40px', fontWeight: 400 }}>
            Define un objetivo. AGENTME lo ejecuta solo en internet.
            Cada mañana recibes los resultados.
          </p>

          
          <div className="fadeUp4" style={{ display: 'flex', justifyContent: 'center',
            gap: 12, marginBottom: 14 }}>
            <Btn label="Empezar gratis" onClick={() => router.push('/auth')} variant="solid" size="lg" icon={IC.arrowRight}/>
            <Btn label="Ver cómo funciona" onClick={() => scroll('como-funciona')} variant="outline" size="lg"/>
          </div>
          <p style={{ fontSize: 13, color: T.ink30, marginBottom: 90 }}>
            Sin tarjeta de crédito · Cancela cuando quieras
          </p>

          
          <div className="fadeUp5" style={{ maxWidth: 1000, margin: '0 auto', position: 'relative' }}>

            
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
            background: `linear-gradient(to top, ${T.paper} 28%, transparent)`,
            zIndex: 10, pointerEvents: 'none' }}/>

            <div style={{ borderRadius: 18, overflow: 'hidden',
            border: '1px solid #1C1C1C', background: '#0C0C0C',
            boxShadow: '0 52px 120px rgba(0,0,0,.36), 0 0 0 1px rgba(255,255,255,.04)' }}>

              
              <div style={{ background: '#161616', borderBottom: '1px solid #242424',
            padding: '13px 20px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 7 }}>
                  {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (<span key={c} style={{ width: 12, height: 12, borderRadius: '50%',
                background: c, display: 'block' }}/>))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9,
            fontSize: 12, fontFamily: 'monospace', color: '#404040' }}>
                  <Dot color="#28C840"/>
                  agentme.app — sleep_mode — activo
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#303030' }}>
                  03:41 AM
                </span>
              </div>

              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, padding: 22 }}>

                
                <div>
                  
                  <div style={{ background: '#161616', borderRadius: 12, padding: 20,
            border: '1px solid #242424', marginBottom: 14 }}>

                    
                    <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 22 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 9,
            background: '#222', border: '1px solid #2E2E2E',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#CCC' }}>
                          {IC.moon}
                        </div>
                        <div>
                          <p style={{ color: '#FFF', fontSize: 14, fontWeight: 600 }}>Sleep Mode</p>
                          <p style={{ color: '#484848', fontSize: 12 }}>Ejecutando misión</p>
                        </div>
                      </div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 700, letterSpacing: '.05em',
            color: T.green, background: 'rgba(40,200,64,.1)',
            padding: '4px 12px', borderRadius: 100 }}>
                        <Dot color={T.green}/> ACTIVO
                      </span>
                    </div>

                    
                    <div style={{ background: '#0E0E0E', borderRadius: 8, padding: 14,
            border: '1px solid #232323', marginBottom: 18 }}>
                      <p style={{ color: '#383838', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 9 }}>
                        Objetivo de esta noche
                      </p>
                      <p style={{ color: '#D0D0D0', fontSize: 13,
            fontFamily: 'monospace', lineHeight: 1.55 }}>
                        {typed}
                        {caretOn && (<span style={{ display: 'inline-block', width: 2, height: 14,
                background: '#E0E0E0', marginLeft: 2,
                verticalAlign: 'middle', animation: 'blink .8s step-end infinite' }}/>)}
                      </p>
                    </div>

                    
                    {[
            { l: 'Perfiles analizados', v: '847', max: '1000', pct: 85 },
            { l: 'Mensajes enviados', v: '12', max: '20', pct: 60 },
            { l: 'Reuniones confirmadas', v: '3', max: '3', pct: 100 },
        ].map(b => (<div key={b.l} style={{ marginBottom: 13 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                fontSize: 12, color: '#505050', marginBottom: 6 }}>
                          <span>{b.l}</span>
                          <span style={{ color: '#888' }}>{b.v}/{b.max}</span>
                        </div>
                        <div style={{ height: 4, background: '#252525',
                borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 4,
                background: b.pct === 100 ? T.green : '#D0D0D0',
                width: `${b.pct}%`,
                transition: 'width 1.5s cubic-bezier(.4,0,.2,1)' }}/>
                        </div>
                      </div>))}
                  </div>

                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {[
            { icon: IC.zap, v: '47', l: 'Acciones' },
            { icon: IC.clock, v: '4.2h', l: 'Activo' },
            { icon: IC.activity, v: '100%', l: 'Éxito' },
        ].map(s => (<div key={s.l} style={{ background: '#161616', borderRadius: 10,
                padding: '13px 8px', textAlign: 'center', border: '1px solid #242424' }}>
                        <div style={{ color: '#666', display: 'flex',
                justifyContent: 'center', marginBottom: 7 }}>{s.icon}</div>
                        <div style={{ color: '#FFF', fontWeight: 700, fontSize: 18,
                fontFamily: T.serif, letterSpacing: '-.02em' }}>{s.v}</div>
                        <div style={{ color: '#404040', fontSize: 11, marginTop: 3 }}>{s.l}</div>
                      </div>))}
                  </div>
                </div>

                
                <div style={{ background: '#161616', borderRadius: 12, padding: 20,
            border: '1px solid #242424', display: 'flex', flexDirection: 'column' }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 22 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#383838',
            textTransform: 'uppercase', letterSpacing: '.09em' }}>
                      Registro del agente
                    </p>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 700, color: T.green,
            background: 'rgba(40,200,64,.1)', padding: '3px 10px', borderRadius: 100 }}>
                      <Dot color={T.green}/> En vivo
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flexGrow: 1 }}>
                    {logs.map((log, i) => (<div key={i} style={{
                display: 'flex', gap: 14,
                fontFamily: 'monospace', fontSize: 12,
                transition: 'opacity .45s, transform .45s',
                opacity: i <= logStep ? 1 : 0,
                transform: i <= logStep ? 'translateY(0)' : 'translateY(6px)',
            }}>
                        <span style={{ color: '#2C2C2C', minWidth: 40, flexShrink: 0 }}>
                          {log.t}
                        </span>
                        <span style={{ color: i >= 4 ? T.green : '#303030', flexShrink: 0 }}>
                          {i >= 4 ? '✓' : '›'}
                        </span>
                        <span style={{ color: i >= 4 ? '#D0D0D0' : '#525252', lineHeight: 1.5 }}>
                          {log.msg}
                        </span>
                      </div>))}
                  </div>

                  {logStep >= 5 && (<div style={{ marginTop: 22, padding: 16, borderRadius: 10,
                background: 'rgba(232,227,80,.06)', border: '1px solid rgba(232,227,80,.18)' }}>
                      <p style={{ color: '#E8E350', fontWeight: 700, fontSize: 13,
                fontFamily: T.sans, marginBottom: 4 }}>Misión completada</p>
                      <p style={{ color: '#505050', fontSize: 12, fontFamily: T.sans }}>
                        3 reuniones confirmadas · Briefing enviado a las 07:00
                      </p>
                    </div>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        
        <div style={{ marginTop: 88 }}><Divider /></div>
        <section style={{ padding: '52px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em',
            color: T.ink30, textTransform: 'uppercase', marginBottom: 26 }}>
              Conectado con
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap',
            justifyContent: 'center', gap: '12px 38px' }}>
              {['LinkedIn', 'Supabase', 'Resend', 'Claude AI'].map(p => (<span key={p} style={{ fontSize: 15, fontWeight: 500, color: T.ink30,
                transition: 'color .15s', cursor: 'default' }} onMouseEnter={e => (e.currentTarget.style.color = T.ink)} onMouseLeave={e => (e.currentTarget.style.color = T.ink30)}>{p}</span>))}
            </div>
          </div>
        </section>
        <Divider />

        
        <Section id="como-funciona">
          <div style={{ marginBottom: 72 }}>
            <Label text="Cómo funciona"/>
            <H2>El agente que<br /><em style={{ fontStyle: 'italic', color: T.ink50 }}>realmente actúa.</em></H2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2 }}>
            {[
            { icon: IC.search, num: '01', title: 'Define tu objetivo',
                body: 'Escribe en lenguaje natural qué quieres conseguir. Sin configuración, sin formularios.' },
            { icon: IC.zap, num: '02', title: 'El agente actúa',
                body: 'Navega, envía mensajes, aplica a ofertas y ejecuta tareas de forma completamente autónoma.' },
            { icon: IC.mail, num: '03', title: 'Recibes resultados',
                body: 'Resultados guardados en tu dashboard con análisis de relevancia y estadísticas del mercado.' },
        ].map((step, i) => (<div key={i} style={{
                padding: '44px 40px',
                background: i === 1 ? T.ink : T.white,
                borderRadius: i === 0 ? '16px 0 0 16px' : i === 2 ? '0 16px 16px 0' : 0,
                border: `1px solid ${T.ink10}`,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 44 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11,
                background: i === 1 ? '#1E1E1E' : T.paper,
                border: i === 1 ? '1px solid #2A2A2A' : `1px solid ${T.ink10}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: i === 1 ? '#DDD' : T.ink }}>
                    {step.icon}
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600,
                color: i === 1 ? '#2A2A2A' : T.ink10 }}>{step.num}</span>
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.022em',
                color: i === 1 ? T.white : T.ink, marginBottom: 14 }}>{step.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.74,
                color: i === 1 ? '#5A5A5A' : T.ink50 }}>{step.body}</p>
              </div>))}
          </div>
        </Section>

        
        <Divider />
        <Section id="modos" bg={T.white}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', marginBottom: 56, flexWrap: 'wrap', gap: 24 }}>
            <div>
              <Label text="Los modos"/>
              <H2>Un agente.<br /><em style={{ fontStyle: 'italic', color: T.ink50 }}>Varios superpoderes.</em></H2>
            </div>
            <Btn label="Ver todos" onClick={() => router.push('/auth')} variant="solid" icon={IC.arrowRight}/>
          </div>

          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)',
            gap: 4, background: T.paper, padding: 5, borderRadius: 13,
            border: `1px solid ${T.ink10}`, marginBottom: 32 }}>
            {modes.map((m, i) => (<button key={i} onClick={() => setModeIdx(i)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '11px 10px', borderRadius: 9,
                fontSize: 13, fontWeight: modeIdx === i ? 600 : 500,
                background: modeIdx === i ? T.ink : 'transparent',
                color: modeIdx === i ? T.white : T.ink50,
                border: 'none', fontFamily: T.sans,
                cursor: 'pointer', transition: 'all .2s ease' }}>
                <span style={{ opacity: modeIdx === i ? 1 : .45 }}>{m.icon}</span>
                {m.name}
              </button>))}
          </div>

          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            
            <div style={{ background: T.ink, borderRadius: 20, padding: 52,
            display: 'flex', flexDirection: 'column', minHeight: 360 }}>
              <div style={{ width: 52, height: 52, borderRadius: 13,
            background: '#1C1C1C', border: '1px solid #282828',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#E0E0E0', marginBottom: 36 }}>
                {modes[modeIdx].icon}
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#383838',
            letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 14 }}>
                {modes[modeIdx].tag}
              </p>
              <h3 style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 700,
            color: T.white, letterSpacing: '-.025em', marginBottom: 20 }}>
                {modes[modeIdx].name}
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.76, color: '#5A5A5A', flexGrow: 1 }}>
                {modes[modeIdx].desc}
              </p>
              <div style={{ paddingTop: 36 }}>
                <Btn label="Probar gratis" onClick={() => router.push('/auth')} variant="outline" icon={IC.arrowRight}/>
              </div>
            </div>

            
            <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 16 }}>
              {[
            { icon: IC.zap, label: 'Acciones esta noche', value: '47 acciones' },
            { icon: IC.clock, label: 'Tiempo de operación', value: '4 h 13 min' },
            { icon: IC.activity, label: 'Tasa de éxito global', value: '94.7 %' },
            { icon: IC.target, label: 'Objetivo de la misión', value: '3 / 3 reuniones' },
        ].map((s, i) => (<div key={i} style={{ background: T.paper, borderRadius: 13,
                padding: '22px 26px', border: `1px solid ${T.ink10}`,
                display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10,
                background: T.white, border: `1px solid ${T.ink10}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.ink, flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <p style={{ fontSize: 12, color: T.ink30, marginBottom: 4 }}>{s.label}</p>
                    <p style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 700,
                color: T.ink, letterSpacing: '-.03em' }}>{s.value}</p>
                  </div>
                </div>))}
            </div>
          </div>
        </Section>

        
        <Divider />
        <Section>
          <Label text="Testimonios"/>

          
          <div style={{ maxWidth: 800, marginBottom: 80 }}>
            <blockquote style={{ fontFamily: T.serif, fontStyle: 'italic',
            fontSize: 'clamp(26px,3.8vw,44px)', lineHeight: 1.3,
            color: T.ink, letterSpacing: '-.025em', marginBottom: 32 }}>
              "En la primera semana AGENTME me consiguió 4 clientes nuevos mientras yo seguía con mis proyectos. Es como tener un comercial trabajando las 24 horas."
            </blockquote>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%',
            background: T.ink, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: T.white,
            fontSize: 15, fontWeight: 700 }}>A</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Alejandro M.</p>
                <p style={{ fontSize: 13, color: T.ink30 }}>Diseñador freelance · 24 años</p>
              </div>
              <div style={{ display: 'flex', gap: 3, marginLeft: 8, color: T.ink }}>
                {[...Array(5)].map((_, i) => <span key={i}>{IC.star}</span>)}
              </div>
            </div>
          </div>

          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {testimonials.map(t => (<div key={t.n} style={{ background: T.white, borderRadius: 16,
                padding: 30, border: `1px solid ${T.ink10}` }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 20, color: T.ink }}>
                  {[...Array(5)].map((_, i) => <span key={i}>{IC.star}</span>)}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: T.ink70, marginBottom: 26 }}>
                  "{t.t}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%',
                background: T.ink, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: T.white,
                fontSize: 13, fontWeight: 700 }}>{t.i}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{t.n}</p>
                    <p style={{ fontSize: 12, color: T.ink30 }}>{t.r}</p>
                  </div>
                </div>
              </div>))}
          </div>
        </Section>

        
        <Divider />
        <Section id="precios" bg={T.white}>
          <div style={{ marginBottom: 80 }}>
            <Label text="Precios"/>
            <H2>Menos que un café al día.<br /><em style={{ fontStyle: 'italic', color: T.ink50 }}>Mucho más valor.</em></H2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            gap: 16, maxWidth: 880, margin: '0 auto' }}>
            {plans.map(plan => (<div key={plan.name} style={{ borderRadius: 16, padding: 34,
                background: plan.primary ? T.ink : T.paper,
                border: `1px solid ${plan.primary ? T.ink : T.ink10}`,
                position: 'relative',
                transform: plan.primary ? 'scale(1.04)' : 'scale(1)',
                boxShadow: plan.primary ? '0 24px 60px rgba(0,0,0,.22)' : 'none' }}>

                {plan.primary && (<div style={{ position: 'absolute', top: -13, left: '50%',
                    transform: 'translateX(-50%)',
                    background: T.yellow, color: T.ink,
                    fontSize: 11, fontWeight: 800, letterSpacing: '.06em',
                    padding: '4px 18px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                    MÁS POPULAR
                  </div>)}

                <p style={{ fontSize: 13, color: plan.primary ? '#484848' : T.ink30, marginBottom: 8 }}>
                  {plan.name}
                </p>
                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontFamily: T.serif, fontSize: 48, fontWeight: 700,
                letterSpacing: '-.045em',
                color: plan.primary ? T.white : T.ink }}>{plan.price}</span>
                  <span style={{ fontSize: 14, color: plan.primary ? '#484848' : T.ink30 }}>
                    {' '}{plan.sub}
                  </span>
                </div>

                <ul style={{ listStyle: 'none', marginBottom: 32,
                display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.items.map(f => (<li key={f} style={{ display: 'flex', alignItems: 'center',
                    gap: 10, fontSize: 14,
                    color: plan.primary ? '#B0B0B0' : T.ink70 }}>
                      <span style={{ color: plan.primary ? T.green : T.ink, flexShrink: 0 }}>
                        {IC.check}
                      </span>
                      {f}
                    </li>))}
                </ul>

                <button onClick={() => router.push('/auth')} style={{ width: '100%', padding: '13px 0', borderRadius: 10,
                fontSize: 14, fontWeight: 600, fontFamily: T.sans,
                cursor: 'pointer', transition: 'all .15s',
                border: plan.primary ? 'none' : `1.5px solid ${T.ink10}`,
                background: plan.primary ? T.white : 'transparent',
                color: T.ink }} onMouseEnter={e => {
                e.currentTarget.style.background = plan.primary ? '#F2F2F2' : T.ink;
                e.currentTarget.style.color = plan.primary ? T.ink : T.white;
            }} onMouseLeave={e => {
                e.currentTarget.style.background = plan.primary ? T.white : 'transparent';
                e.currentTarget.style.color = T.ink;
            }}>
                  {plan.cta}
                </button>
              </div>))}
          </div>
        </Section>

        
        <Divider />
        <Section>
          <div style={{ background: T.ink, borderRadius: 24, padding: '92px 64px',
            textAlign: 'center', boxShadow: '0 32px 90px rgba(0,0,0,.22)' }}>
            <h2 style={{ fontFamily: T.serif,
            fontSize: 'clamp(38px,5.5vw,70px)',
            color: T.white, letterSpacing: '-.04em',
            lineHeight: 1.06, marginBottom: 24 }}>
              Tu vida entera,<br />
              <em style={{ fontStyle: 'italic', color: '#4A4A4A' }}>
                a un clic de distancia.
              </em>
            </h2>
            <p style={{ fontSize: 17, color: '#4A4A4A', marginBottom: 46, lineHeight: 1.72 }}>
              7 días gratis. Sin tarjeta de crédito.<br />Resultados desde el primer día.
            </p>
            <button onClick={() => router.push('/auth')} style={{ display: 'inline-flex', alignItems: 'center', gap: 10,
            background: T.white, color: T.ink,
            padding: '16px 40px', borderRadius: 10,
            fontSize: 15, fontWeight: 700, border: 'none',
            fontFamily: T.sans, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,.18)',
            transition: 'opacity .15s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '.88')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Empezar gratis ahora {IC.arrowRight}
            </button>
          </div>
        </Section>

        
        <Divider />
        <footer style={{ padding: '64px 24px 44px', background: T.white }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: 60, flexWrap: 'wrap', gap: 48 }}>

              
              <div style={{ maxWidth: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  {IC.logo}
                  <span style={{ fontFamily: T.serif, fontWeight: 700,
            fontSize: 16, color: T.ink }}>AGENTME</span>
                </div>
                <p style={{ fontSize: 14, color: T.ink30, lineHeight: 1.7 }}>
                  El primer agente IA diseñado para la vida de un joven ambicioso.
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                  {[IC.twitter, IC.linkedin, IC.globe].map((ico, i) => (<div key={i} style={{ width: 34, height: 34, borderRadius: 8,
                background: T.paper, border: `1px solid ${T.ink10}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.ink50, cursor: 'pointer', transition: 'all .15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.ink; (e.currentTarget as HTMLElement).style.color = T.white; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.paper; (e.currentTarget as HTMLElement).style.color = T.ink50; }}>
                      {ico}
                    </div>))}
                </div>
              </div>

              
              <div style={{ display: 'flex', gap: 72, flexWrap: 'wrap' }}>
                {[
            { title: 'Producto', links: ['Modos', 'Precios', 'Seguridad', 'Changelog', 'API'] },
            { title: 'Empresa', links: ['Blog', 'Carreras', 'Prensa', 'Inversores'] },
            { title: 'Legal', links: ['Privacidad', 'Términos', 'Cookies', 'Contacto'] },
        ].map(col => (<div key={col.title}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.ink,
                marginBottom: 18, letterSpacing: '-.01em' }}>{col.title}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {col.links.map(l => (<a key={l} href="#" style={{ fontSize: 14, color: T.ink30, transition: 'color .15s' }} onMouseEnter={e => (e.currentTarget.style.color = T.ink)} onMouseLeave={e => (e.currentTarget.style.color = T.ink30)}>{l}</a>))}
                    </div>
                  </div>))}
              </div>
            </div>

            
            <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', paddingTop: 28,
            borderTop: `1px solid ${T.ink10}`, flexWrap: 'wrap', gap: 16 }}>
              <p style={{ fontSize: 13, color: T.ink30 }}>
                © 2026 AGENTME. Todos los derechos reservados.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {['GDPR', 'SOC 2', 'HIPAA'].map(b => (<span key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 700, letterSpacing: '.05em',
                padding: '5px 13px', borderRadius: 100,
                background: T.paper, color: T.ink50,
                border: `1px solid ${T.ink10}` }}>
                    {IC.shield} {b}
                  </span>))}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>);
}
