'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { IC } from '@/components/icons';
import { Btn } from '@/components/ui/button';
import { Label, H2 } from '@/components/ui/typography';
import { Dot, Divider, Section } from '@/components/ui/misc';

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
    { icon: IC.target, name: 'Opportunity Mode', tag: 'Empleo & becas', desc: 'Escanea LinkedIn buscando ofertas de empleo alineadas con tu perfil. Filtra por experiencia, ubicación y más.' },
    { icon: IC.social, name: 'Social Mode', tag: 'Contenido & redes', desc: 'Calendario editorial con IA: ideas por nicho en formato carrusel, reel o hilo, con gancho, esquema y CTA. Tú publicas en tus redes.' },
    { icon: IC.dollar, name: 'Money Mode', tag: 'Ahorro · Próximamente', desc: 'Comparará precios, encontrará cupones y monitorizará ofertas. Solo te avisará cuando valga la pena.' },
    { icon: IC.moon, name: 'Sleep Mode', tag: 'El diferenciador · Próximamente', desc: 'Definirás un objetivo antes de dormir. El agente ejecutará mientras duermes y tendrás resultados al despertar.' },
  ];

  const plans = [
    { name: 'Free', price: '0€', sub: 'siempre', items: ['5 búsquedas por día', '1 agente activo', 'Opportunity Mode básico', 'Estadísticas del mercado'], cta: 'Empezar gratis', primary: false },
    { name: 'Pro', price: '12€', sub: 'al mes', items: ['Búsquedas ilimitadas', 'Análisis IA de ofertas', 'Todos los modos', 'Tendencias y salarios', 'Ranking de relevancia'], cta: '7 días gratis', primary: true },
    { name: 'Hustler', price: '39€', sub: 'al mes', items: ['Todo lo de Pro', 'Agentes ilimitados', 'Acceso a la API', 'Analytics avanzados', 'Soporte prioritario'], cta: 'Contactar', primary: false },
  ];

  const testimonials = [
    { n: 'Sara L.', r: 'Creadora · 22 años', i: 'S', t: 'Opportunity Mode me encontró ofertas que ni sabía que existían. En 10 segundos tenía resultados filtrados y relevantes.' },
    { n: 'Carlos R.', r: 'Nómada digital · 27 años', i: 'C', t: 'El análisis IA me ahorra horas. Me dice exactamente qué ofertas encajan conmigo y por qué. Brutal.' },
    { n: 'María T.', r: 'Emprendedora · 25 años', i: 'M', t: 'Busco trabajo remoto desde España y el agente me filtra solo lo relevante. Ya no pierdo tiempo en LinkedIn.' },
  ];

  return (
    <div>
      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] h-16 transition-all duration-220 border-b ${scrolled ? 'bg-paper/95 backdrop-blur-[20px] border-ink-10' : 'bg-transparent border-transparent'}`}>
        <div className="max-w-[1120px] mx-auto px-7 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {IC.logo}
            <span className="font-serif font-bold text-[17px] tracking-[-0.025em] text-ink">AGENTME</span>
          </div>
          <div className="hidden md:flex gap-[34px]">
            {[['Cómo funciona', 'como-funciona'], ['Modos', 'modos'], ['Precios', 'precios']].map(([l, id]) => (
              <button key={id} onClick={() => scroll(id)} className="font-sans bg-transparent border-none text-[14px] font-medium text-ink-60 cursor-pointer transition-colors hover:text-ink">
                {l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Btn label="Iniciar sesión" onClick={() => router.push('/auth')} variant="ghost" />
            <Btn label="Empezar gratis" onClick={() => router.push('/auth')} variant="solid" />
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-[148px] px-6 text-center">
        <div className="animate-fade-up flex items-center gap-[9px] bg-ink text-white rounded-full px-[18px] py-[7px] text-[13px] font-medium tracking-[0.01em] mx-auto mb-11 w-max">
          <Dot /> Agente IA para jóvenes ambiciosos
        </div>

        <h1 className="animate-fade-up [animation-delay:90ms] font-serif text-[clamp(54px,8.8vw,104px)] leading-[1.01] tracking-[-0.04em] text-ink max-w-[900px] mx-auto mb-8">
          Tu agente trabaja<br />
          <em className="italic text-ink-60">mientras tú vives</em>
        </h1>

        <p className="animate-fade-up [animation-delay:180ms] text-[18px] leading-[1.78] text-ink-60 max-w-[480px] mx-auto mb-10 font-normal">
          Define un objetivo. AGENTME lo ejecuta solo en internet. Cada mañana recibes los resultados.
        </p>

        <div className="animate-fade-up [animation-delay:270ms] flex justify-center gap-3 mb-3.5">
          <Btn label="Empezar gratis" onClick={() => router.push('/auth')} variant="solid" size="lg" icon={IC.arrowRight} />
          <Btn label="Ver cómo funciona" onClick={() => scroll('como-funciona')} variant="outline" size="lg" />
        </div>
        <p className="text-[13px] text-ink-40 mb-[90px]">Sin tarjeta de crédito · Cancela cuando quieras</p>

        {/* MOCKUP UI */}
        <div className="animate-fade-up [animation-delay:370ms] max-w-[1000px] mx-auto relative">
          <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-paper to-transparent z-10 pointer-events-none" />
          
          <div className="rounded-[18px] overflow-hidden border border-[#1C1C1C] bg-[#0C0C0C] shadow-[0_52px_120px_rgba(0,0,0,0.36),0_0_0_1px_rgba(255,255,255,0.04)] text-left">
            <div className="bg-[#161616] border-b border-[#242424] px-5 py-[13px] flex items-center justify-between">
              <div className="flex gap-[7px]">
                {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <span key={c} className="w-3 h-3 rounded-full block" style={{ background: c }} />)}
              </div>
              <div className="flex items-center gap-[9px] text-[12px] font-mono text-[#404040]">
                <Dot color="bg-brand-green" /> agentme.app — sleep_mode — activo
              </div>
              <span className="font-mono text-[12px] text-[#303030]">03:41 AM</span>
            </div>

            <div className="grid md:grid-cols-2 gap-[18px] p-[22px]">
              <div>
                <div className="bg-[#161616] rounded-xl p-5 border border-[#242424] mb-3.5">
                  <div className="flex justify-between items-center mb-[22px]">
                    <div className="flex items-center gap-3">
                      <div className="w-[38px] h-[38px] rounded-lg bg-[#222] border border-[#2E2E2E] flex items-center justify-center text-[#CCC]">
                        {IC.moon}
                      </div>
                      <div>
                        <p className="text-white text-[14px] font-semibold">Sleep Mode</p>
                        <p className="text-[#484848] text-[12px]">Ejecutando misión</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.05em] text-brand-green bg-brand-green/10 px-3 py-1 rounded-full">
                      <Dot color="bg-brand-green" /> ACTIVO
                    </span>
                  </div>

                  <div className="bg-[#0E0E0E] rounded-lg p-3.5 border border-[#232323] mb-[18px]">
                    <p className="text-[#383838] text-[11px] font-bold uppercase tracking-[0.08em] mb-2">Objetivo de esta noche</p>
                    <p className="text-[#D0D0D0] text-[13px] font-mono leading-[1.55]">
                      {typed}
                      {caretOn && <span className="inline-block w-[2px] h-[14px] bg-[#E0E0E0] ml-0.5 align-middle animate-blink" />}
                    </p>
                  </div>

                  {[
                    { l: 'Perfiles analizados', v: '847', max: '1000', pct: 85 },
                    { l: 'Mensajes enviados', v: '12', max: '20', pct: 60 },
                    { l: 'Reuniones confirmadas', v: '3', max: '3', pct: 100 },
                  ].map(b => (
                    <div key={b.l} className="mb-3">
                      <div className="flex justify-between text-[12px] text-[#505050] mb-1.5">
                        <span>{b.l}</span>
                        <span className="text-[#888]">{b.v}/{b.max}</span>
                      </div>
                      <div className="h-1 bg-[#252525] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ease-out ${b.pct === 100 ? 'bg-brand-green' : 'bg-[#D0D0D0]'}`} style={{ width: `${b.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { icon: IC.zap, v: '47', l: 'Acciones' },
                    { icon: IC.clock, v: '4.2h', l: 'Activo' },
                    { icon: IC.activity, v: '100%', l: 'Éxito' },
                  ].map(s => (
                    <div key={s.l} className="bg-[#161616] rounded-xl py-3 px-2 text-center border border-[#242424]">
                      <div className="text-[#666] flex justify-center mb-1.5">{s.icon}</div>
                      <div className="text-white font-bold text-[18px] font-serif tracking-[-0.02em]">{s.v}</div>
                      <div className="text-[#404040] text-[11px] mt-1">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#161616] rounded-xl p-5 border border-[#242424] flex flex-col">
                <div className="flex justify-between items-center mb-[22px]">
                  <p className="text-[11px] font-bold text-[#383838] uppercase tracking-[0.09em]">Registro del agente</p>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-full">
                    <Dot color="bg-brand-green" /> En vivo
                  </span>
                </div>

                <div className="flex flex-col gap-4 grow">
                  {logs.map((log, i) => (
                    <div key={i} className={`flex gap-3.5 font-mono text-[12px] transition-all duration-500 ${i <= logStep ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5'}`}>
                      <span className="text-[#2C2C2C] min-w-[40px] shrink-0">{log.t}</span>
                      <span className={`shrink-0 ${i >= 4 ? 'text-brand-green' : 'text-[#303030]'}`}>{i >= 4 ? '✓' : '›'}</span>
                      <span className={`leading-[1.5] ${i >= 4 ? 'text-[#D0D0D0]' : 'text-[#525252]'}`}>{log.msg}</span>
                    </div>
                  ))}
                </div>

                {logStep >= 5 && (
                  <div className="mt-[22px] p-4 rounded-xl bg-brand-yellow/5 border border-brand-yellow/20">
                    <p className="text-brand-yellow font-bold text-[13px] font-sans mb-1">Misión completada</p>
                    <p className="text-[#505050] text-[12px] font-sans">3 reuniones confirmadas · Briefing enviado a las 07:00</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-[88px]"><Divider /></div>
      
      {/* INTEGRATIONS */}
      <section className="py-[52px] px-6">
        <div className="max-w-[960px] mx-auto text-center">
          <p className="text-[11px] font-bold tracking-[0.12em] text-ink-40 uppercase mb-6">Conectado con</p>
          <div className="flex flex-wrap justify-center gap-x-[38px] gap-y-3">
            {['LinkedIn', 'Supabase', 'Resend', 'Claude AI'].map(p => (
              <span key={p} className="text-[15px] font-medium text-ink-40 transition-colors hover:text-ink cursor-default">{p}</span>
            ))}
          </div>
        </div>
      </section>
      
      <Divider />

      {/* HOW IT WORKS */}
      <Section id="como-funciona">
        <div className="mb-[72px]">
          <Label text="Cómo funciona" />
          <H2>El agente que<br /><em className="italic text-ink-60">realmente actúa.</em></H2>
        </div>
        <div className="grid md:grid-cols-3 gap-0.5">
          {[
            { icon: IC.search, num: '01', title: 'Define tu objetivo', body: 'Escribe en lenguaje natural qué quieres conseguir. Sin configuración, sin formularios.' },
            { icon: IC.zap, num: '02', title: 'El agente actúa', body: 'Navega, envía mensajes, aplica a ofertas y ejecuta tareas de forma completamente autónoma.' },
            { icon: IC.mail, num: '03', title: 'Recibes resultados', body: 'Resultados guardados en tu dashboard con análisis de relevancia y estadísticas del mercado.' },
          ].map((step, i) => (
            <div key={i} className={`p-10 lg:px-10 lg:py-11 border border-ink-10 ${i === 1 ? 'bg-ink text-white' : 'bg-white'} ${i === 0 ? 'rounded-l-2xl rounded-r-none' : i === 2 ? 'rounded-r-2xl rounded-l-none' : ''}`}>
               <div className="flex justify-between items-start mb-11">
                  <div className={`w-11 h-11 rounded-[11px] flex items-center justify-center ${i === 1 ? 'bg-[#1E1E1E] border border-[#2A2A2A] text-[#DDD]' : 'bg-paper border border-ink-10 text-ink'}`}>
                    {step.icon}
                  </div>
                  <span className={`font-mono text-[13px] font-bold ${i === 1 ? 'text-[#2A2A2A]' : 'text-ink-10'}`}>{step.num}</span>
               </div>
               <h3 className={`text-[22px] font-bold tracking-[-0.022em] mb-3.5 ${i === 1 ? 'text-white' : 'text-ink'}`}>{step.title}</h3>
               <p className={`text-[15px] leading-[1.74] ${i === 1 ? 'text-[#5A5A5A]' : 'text-ink-60'}`}>{step.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* MODES */}
      <Section id="modos" bgClass="bg-white">
        <div className="flex justify-between items-end mb-14 flex-wrap gap-6">
          <div>
            <Label text="Los modos" />
            <H2>Un agente.<br /><em className="italic text-ink-60">Varios superpoderes.</em></H2>
          </div>
          <Btn label="Ver todos" onClick={() => router.push('/auth')} variant="solid" icon={IC.arrowRight} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-paper p-1.5 rounded-[13px] border border-ink-10 mb-8">
          {modes.map((m, i) => (
            <button key={i} onClick={() => setModeIdx(i)} className={`flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-lg text-[13px] font-sans border-none cursor-pointer transition-all duration-200 ${modeIdx === i ? 'font-semibold bg-ink text-white' : 'font-medium bg-transparent text-ink-60 hover:text-ink'}`}>
              <span className={modeIdx === i ? 'opacity-100' : 'opacity-45'}>{m.icon}</span>
              <span className="hidden md:inline">{m.name}</span>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-ink rounded-[20px] p-[52px] flex flex-col min-h-[360px]">
            <div className="w-[52px] h-[52px] rounded-[13px] bg-[#1C1C1C] border border-[#282828] flex items-center justify-center text-[#E0E0E0] mb-9">
              {modes[modeIdx].icon}
            </div>
            <p className="text-[11px] font-bold text-[#383838] tracking-[0.09em] uppercase mb-3.5">{modes[modeIdx].tag}</p>
            <h3 className="font-serif text-[30px] font-bold text-white tracking-[-0.025em] mb-5">{modes[modeIdx].name}</h3>
            <p className="text-[16px] leading-[1.76] text-[#5A5A5A] grow">{modes[modeIdx].desc}</p>
            <div className="pt-9">
              <Btn label="Probar gratis" onClick={() => router.push('/auth')} variant="outline" icon={IC.arrowRight} />
            </div>
          </div>

          <div className="grid grid-rows-2 gap-4">
            {[
              { icon: IC.zap, label: 'Acciones esta noche', value: '47 acciones' },
              { icon: IC.clock, label: 'Tiempo de operación', value: '4 h 13 min' },
              { icon: IC.activity, label: 'Tasa de éxito global', value: '94.7 %' },
              { icon: IC.target, label: 'Objetivo de la misión', value: '3 / 3 reuniones' },
            ].map((s, i) => (
              <div key={i} className="bg-paper rounded-[13px] py-5 px-6 border border-ink-10 flex items-center gap-[18px]">
                <div className="w-[42px] h-[42px] rounded-xl bg-white border border-ink-10 flex items-center justify-center text-ink shrink-0">{s.icon}</div>
                <div>
                  <p className="text-[12px] text-ink-40 mb-1">{s.label}</p>
                  <p className="font-serif text-[22px] font-bold text-ink tracking-[-0.03em]">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Divider />

      {/* TESTIMONIALS */}
      <Section>
        <Label text="Testimonios" />
        <div className="max-w-[800px] mb-20">
          <blockquote className="font-serif italic text-[clamp(26px,3.8vw,44px)] leading-[1.3] text-ink tracking-[-0.025em] mb-8">
            &quot;En la primera semana AGENTME me consiguió 4 clientes nuevos mientras yo seguía con mis proyectos. Es como tener un comercial trabajando las 24 horas.&quot;
          </blockquote>
          <div className="flex items-center gap-3.5">
            <div className="w-[42px] h-[42px] rounded-full bg-ink flex items-center justify-center text-white text-[15px] font-bold">A</div>
            <div>
              <p className="text-[14px] font-semibold text-ink">Alejandro M.</p>
              <p className="text-[13px] text-ink-40">Diseñador freelance · 24 años</p>
            </div>
            <div className="flex gap-[3px] ml-2 text-ink">
              {[...Array(5)].map((_, i) => <span key={i}>{IC.star}</span>)}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map(t => (
            <div key={t.n} className="bg-white rounded-2xl p-[30px] border border-ink-10">
              <div className="flex gap-[3px] mb-5 text-ink">
                {[...Array(5)].map((_, i) => <span key={i}>{IC.star}</span>)}
              </div>
              <p className="text-[15px] leading-[1.75] text-ink-60 mb-[26px]">&quot;{t.t}&quot;</p>
              <div className="flex items-center gap-[11px]">
                <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center text-white text-[13px] font-bold">{t.i}</div>
                <div>
                  <p className="text-[14px] font-semibold text-ink">{t.n}</p>
                  <p className="text-[12px] text-ink-40">{t.r}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* PRICING */}
      <Section id="precios" bgClass="bg-white">
        <div className="mb-20">
          <Label text="Precios" />
          <H2>Menos que un café al día.<br /><em className="italic text-ink-60">Mucho más valor.</em></H2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 max-w-[880px] mx-auto">
          {plans.map(plan => (
            <div key={plan.name} className={`rounded-2xl p-[34px] border relative transition-transform ${plan.primary ? 'bg-ink border-ink scale-[1.04] shadow-[0_24px_60px_rgba(0,0,0,0.22)]' : 'bg-paper border-ink-10'}`}>
              
              {plan.primary && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-yellow text-ink text-[11px] font-extrabold tracking-[0.06em] px-[18px] py-1 rounded-full whitespace-nowrap">
                  MÁS POPULAR
                </div>
              )}

              <p className={`text-[13px] mb-2 ${plan.primary ? 'text-[#484848]' : 'text-ink-40'}`}>{plan.name}</p>
              <div className="mb-7">
                <span className={`font-serif text-[48px] font-bold tracking-[-0.045em] ${plan.primary ? 'text-white' : 'text-ink'}`}>{plan.price}</span>
                <span className={`text-[14px] ${plan.primary ? 'text-[#484848]' : 'text-ink-40'}`}> {plan.sub}</span>
              </div>

              <ul className="list-none mb-8 flex flex-col gap-3">
                {plan.items.map(f => (
                  <li key={f} className={`flex items-center gap-2.5 text-[14px] ${plan.primary ? 'text-[#B0B0B0]' : 'text-ink-60'}`}>
                    <span className={`shrink-0 ${plan.primary ? 'text-brand-green' : 'text-ink'}`}>{IC.check}</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button onClick={() => router.push('/auth')} className={`w-full py-3.5 rounded-lg text-[14px] font-semibold font-sans cursor-pointer transition-colors border-none ${plan.primary ? 'bg-white text-ink hover:bg-[#F2F2F2]' : 'bg-transparent border border-ink-10 text-ink hover:bg-ink hover:text-white'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* CTA SECTION */}
      <Section>
        <div className="bg-ink rounded-[24px] py-[92px] px-8 md:px-[64px] text-center shadow-[0_32px_90px_rgba(0,0,0,0.22)]">
          <h2 className="font-serif text-[clamp(38px,5.5vw,70px)] text-white tracking-[-0.04em] leading-[1.06] mb-6">
            Tu vida entera,<br />
            <em className="italic text-[#4A4A4A]">a un clic de distancia.</em>
          </h2>
          <p className="text-[17px] text-[#4A4A4A] mb-[46px] leading-[1.72]">
            7 días gratis. Sin tarjeta de crédito.<br />Resultados desde el primer día.
          </p>
          <button onClick={() => router.push('/auth')} className="inline-flex items-center gap-2.5 bg-white text-ink px-10 py-4 rounded-xl text-[15px] font-bold border-none font-sans cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-opacity hover:opacity-90">
            Empezar gratis ahora {IC.arrowRight}
          </button>
        </div>
      </Section>

      <Divider />

      {/* FOOTER */}
      <footer className="pt-16 pb-11 px-6 bg-white">
        <div className="max-w-[1120px] mx-auto">
          <div className="flex justify-between items-start mb-[60px] flex-wrap gap-12">
            <div className="max-w-[260px]">
              <div className="flex items-center gap-2.5 mb-4">
                {IC.logo}
                <span className="font-serif font-bold text-[16px] text-ink">AGENTME</span>
              </div>
              <p className="text-[14px] text-ink-40 leading-[1.7]">
                El primer agente IA diseñado para la vida de un joven ambicioso.
              </p>
              <div className="flex gap-2.5 mt-[22px]">
                {[IC.twitter, IC.linkedin, IC.globe].map((ico, i) => (
                  <div key={i} className="w-[34px] h-[34px] rounded-lg bg-paper border border-ink-10 flex items-center justify-center text-ink-60 cursor-pointer transition-colors hover:bg-ink hover:text-white">
                    {ico}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-[72px] flex-wrap">
              {[
                { title: 'Producto', links: ['Modos', 'Precios', 'Seguridad', 'Changelog', 'API'] },
                { title: 'Empresa', links: ['Blog', 'Carreras', 'Prensa', 'Inversores'] },
                { title: 'Legal', links: ['Privacidad', 'Términos', 'Cookies', 'Contacto'] },
              ].map(col => (
                <div key={col.title}>
                  <p className="text-[13px] font-bold text-ink mb-4.5 tracking-[-0.01em]">{col.title}</p>
                  <div className="flex flex-col gap-3">
                    {col.links.map(l => (
                      <a key={l} href="#" className="text-[14px] text-ink-40 transition-colors hover:text-ink">{l}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center pt-8 border-t border-ink-10 flex-wrap gap-4">
            <p className="text-[13px] text-ink-40">© 2026 AgentMe AI. Todos los derechos reservados.</p>
            <p className="text-[13px] text-ink-40 flex items-center gap-1.5">
              <Dot color="bg-brand-green" /> Sistemas operacionales
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
