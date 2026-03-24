'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { generateTips } from '@/lib/tips';
import MissionsView from './MissionsView';
import SocialView from './SocialView';
const IC = {
    logo: (<svg width="28" height="28" viewBox="0 0 30 30" fill="none">
      <rect width="30" height="30" rx="7" fill="#0C0C0C"/>
      <path d="M15 6L22 10V20L15 24L8 20V10L15 6Z" fill="white" opacity=".95"/>
      <path d="M15 11L19 13.5V18.5L15 21L11 18.5V13.5L15 11Z" fill="#0C0C0C"/>
    </svg>),
    home: (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>),
    activity: (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>),
    settings: (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>),
    logout: (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>),
    target: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>),
    trending: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>),
    social: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>),
    dollar: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>),
    moon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>),
    zap: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>),
    check: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>),
    arrowRight: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>),
    plus: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>),
    externalLink: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>),
    mapPin: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>),
    building: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>),
    search: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>),
    inbox: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>),
    clock: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>),
    info: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>),
};
const T = {
    ink: '#0C0C0C',
    ink60: '#606060',
    ink40: '#909090',
    ink20: '#C8C8C8',
    ink10: '#E8E8E8',
    paper: '#F5F4F1',
    white: '#FFFFFF',
    green: '#28C840',
    serif: "'Playfair Display', Georgia, serif",
    sans: "'DM Sans', 'Helvetica Neue', sans-serif",
};
type Profile = {
    id: string;
    email: string;
    full_name: string | null;
    plan: string;
    actions_today: number;
};
type JobResult = {
    title: string;
    company: string;
    location: string;
    url: string;
    posted: string;
    relevance?: 'alta' | 'media' | 'baja';
    reason?: string;
    tip?: string;
};
type Suggestion = {
    label: string;
    value: string;
    country: string;
    flag: string;
};
type View = 'home' | 'opportunity' | 'social' | 'missions' | 'settings';
function LocationInput({ value, onChange, onEnter }: {
    value: string;
    onChange: (v: string) => void;
    onEnter: () => void;
}) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const toFlag = (code: string) => {
        if (!code || code.length !== 2)
            return '🌍';
        return code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397));
    };
    const fetchSuggestions = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        setLoading(true);
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&featuretype=city&addressdetails=1&limit=7&format=json&accept-language=es`;
            const res = await fetch(url, { headers: { 'User-Agent': 'AGENTME-app/1.0' } });
            const data = await res.json();
            const seen: Set<string> = new Set();
            const items: Suggestion[] = [];
            for (const place of data) {
                const addr = place.address || {};
                const city = addr.city || addr.town || addr.village || addr.municipality || place.display_name.split(',')[0];
                const country = addr.country || '';
                const code = addr.country_code?.toUpperCase() || '';
                const key = `${city}-${country}`;
                if (!seen.has(key) && city && (['city', 'town', 'village', 'municipality'].includes(place.type) ||
                    ['place', 'boundary'].includes(place.class))) {
                    seen.add(key);
                    const state = addr.state || addr.province || '';
                    items.push({
                        label: state && state !== city && state !== country ? `${city}, ${state}, ${country}` : `${city}, ${country}`,
                        value: city, country, flag: toFlag(code),
                    });
                }
                if (items.length >= 6)
                    break;
            }
            if (items.length === 0) {
                const fb = CITIES.filter(c => c.value.toLowerCase().startsWith(q.toLowerCase()) || c.country.toLowerCase().startsWith(q.toLowerCase())).slice(0, 6);
                setSuggestions(fb);
                setOpen(fb.length > 0);
            }
            else {
                setSuggestions(items);
                setOpen(true);
            }
        }
        catch {
            const fb = CITIES.filter(c => c.value.toLowerCase().startsWith(q.toLowerCase()) || c.country.toLowerCase().startsWith(q.toLowerCase())).slice(0, 6);
            setSuggestions(fb);
            setOpen(fb.length > 0);
        }
        finally {
            setLoading(false);
        }
    }, []);
    const handleChange = (v: string) => {
        onChange(v);
        setHighlighted(-1);
        if (debounceRef.current)
            clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(v), 380);
    };
    const select = (s: Suggestion) => { onChange(s.value); setOpen(false); setSuggestions([]); };
    useEffect(() => {
        const h = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
            setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (open && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlighted(h => Math.min(h + 1, suggestions.length - 1));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlighted(h => Math.max(h - 1, 0));
                return;
            }
            if (e.key === 'Enter' && highlighted >= 0) {
                e.preventDefault();
                select(suggestions[highlighted]);
                return;
            }
            if (e.key === 'Escape') {
                setOpen(false);
                return;
            }
        }
        if (e.key === 'Enter')
            onEnter();
    };
    return (<div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: T.ink40, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
          {loading
            ? <div style={{ width: 13, height: 13, border: `1.5px solid ${T.ink20}`, borderTopColor: T.ink40, borderRadius: '50%', animation: 'spin .7s linear infinite' }}/>
            : IC.mapPin}
        </span>
        <input value={value} onChange={e => handleChange(e.target.value)} onKeyDown={handleKey} onFocus={() => { if (suggestions.length > 0)
        setOpen(true); }} placeholder="Madrid, Barcelona, London..." autoComplete="off" style={{
            width: '100%', padding: '11px 12px 11px 34px',
            borderRadius: open ? '9px 9px 0 0' : 9,
            border: `1.5px solid ${open ? T.ink : T.ink10}`,
            fontSize: 14, fontFamily: T.sans, color: T.ink,
            outline: 'none', background: T.white, transition: 'border-color .15s',
        }}/>
      </div>
      {open && suggestions.length > 0 && (<div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.white,
                border: `1.5px solid ${T.ink}`, borderTop: 'none', borderRadius: '0 0 9px 9px',
                zIndex: 999, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,.1)' }}>
          {suggestions.map((s, i) => (<div key={i} onMouseDown={e => { e.preventDefault(); select(s); }} onMouseEnter={() => setHighlighted(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer',
                    background: highlighted === i ? T.paper : T.white,
                    borderBottom: i < suggestions.length - 1 ? `1px solid ${T.ink10}` : 'none',
                    transition: 'background .08s' }}>
              <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0 }}>{s.flag}</span>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{s.value}</span>
                <span style={{ fontSize: 12, color: T.ink40 }}> · {s.country}</span>
              </div>
            </div>))}
        </div>)}
    </div>);
}
const CITIES: Suggestion[] = [
    { value: 'Madrid', country: 'España', flag: '🇪🇸', label: 'Madrid, España' },
    { value: 'Barcelona', country: 'España', flag: '🇪🇸', label: 'Barcelona, España' },
    { value: 'Valencia', country: 'España', flag: '🇪🇸', label: 'Valencia, España' },
    { value: 'Sevilla', country: 'España', flag: '🇪🇸', label: 'Sevilla, España' },
    { value: 'Bilbao', country: 'España', flag: '🇪🇸', label: 'Bilbao, España' },
    { value: 'Málaga', country: 'España', flag: '🇪🇸', label: 'Málaga, España' },
    { value: 'Zaragoza', country: 'España', flag: '🇪🇸', label: 'Zaragoza, España' },
    { value: 'Granada', country: 'España', flag: '🇪🇸', label: 'Granada, España' },
    { value: 'Alicante', country: 'España', flag: '🇪🇸', label: 'Alicante, España' },
    { value: 'San Fernando', country: 'España', flag: '🇪🇸', label: 'San Fernando, España' },
    { value: 'London', country: 'United Kingdom', flag: '🇬🇧', label: 'London, UK' },
    { value: 'Paris', country: 'France', flag: '🇫🇷', label: 'Paris, France' },
    { value: 'Berlin', country: 'Germany', flag: '🇩🇪', label: 'Berlin, Germany' },
    { value: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', label: 'Amsterdam, Netherlands' },
    { value: 'Lisbon', country: 'Portugal', flag: '🇵🇹', label: 'Lisbon, Portugal' },
    { value: 'Remote', country: 'Worldwide', flag: '🌍', label: 'Remote' },
    { value: 'Spain', country: 'España', flag: '🇪🇸', label: 'Spain' },
];
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
const JOB_CATEGORIES = [
    { label: 'Marketing digital', icon: '📢' },
    { label: 'Marketing y ventas', icon: '📈' },
    { label: 'SEO / SEM', icon: '🔍' },
    { label: 'Social Media Manager', icon: '📱' },
    { label: 'Community Manager', icon: '💬' },
    { label: 'Copywriter', icon: '✍️' },
    { label: 'UX/UI Designer', icon: '🎨' },
    { label: 'Diseño gráfico', icon: '🖌️' },
    { label: 'Product Designer', icon: '📐' },
    { label: 'Desarrollador Frontend', icon: '💻' },
    { label: 'Desarrollador Backend', icon: '⚙️' },
    { label: 'Desarrollador Fullstack', icon: '🔧' },
    { label: 'React Developer', icon: '⚛️' },
    { label: 'Python Developer', icon: '🐍' },
    { label: 'DevOps / Cloud', icon: '☁️' },
    { label: 'Data Analyst', icon: '📊' },
    { label: 'Data Scientist', icon: '🧬' },
    { label: 'Machine Learning', icon: '🤖' },
    { label: 'Product Manager', icon: '🎯' },
    { label: 'Project Manager', icon: '📋' },
    { label: 'Scrum Master', icon: '🔄' },
    { label: 'Recursos Humanos', icon: '🤝' },
    { label: 'Customer Success', icon: '🌟' },
    { label: 'Ventas / Sales', icon: '💼' },
    { label: 'Contabilidad / Finanzas', icon: '🏦' },
    { label: 'Ciberseguridad', icon: '🔒' },
    { label: 'QA / Testing', icon: '🧪' },
    { label: 'Administración', icon: '🏢' },
    { label: 'Logística', icon: '🚚' },
    { label: 'Atención al cliente', icon: '📞' },
];
function QueryInput({ value, onChange, onEnter }: {
    value: string;
    onChange: (v: string) => void;
    onEnter: () => void;
}) {
    const [filtered, setFiltered] = useState(JOB_CATEGORIES);
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const wrapRef = useRef<HTMLDivElement>(null);
    const handleChange = (v: string) => {
        onChange(v);
        setHighlighted(-1);
        if (v.trim().length === 0) {
            setFiltered(JOB_CATEGORIES);
            setOpen(true);
        }
        else {
            const q = v.toLowerCase();
            const matches = JOB_CATEGORIES.filter(c => c.label.toLowerCase().includes(q));
            setFiltered(matches);
            setOpen(matches.length > 0);
        }
    };
    const select = (cat: typeof JOB_CATEGORIES[0]) => {
        onChange(cat.label);
        setOpen(false);
    };
    useEffect(() => {
        const h = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
            setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (open && filtered.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlighted(h => Math.min(h + 1, filtered.length - 1));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlighted(h => Math.max(h - 1, 0));
                return;
            }
            if (e.key === 'Enter' && highlighted >= 0) {
                e.preventDefault();
                select(filtered[highlighted]);
                return;
            }
            if (e.key === 'Escape') {
                setOpen(false);
                return;
            }
        }
        if (e.key === 'Enter')
            onEnter();
    };
    return (<div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: T.ink40, pointerEvents: 'none' }}>{IC.search}</span>
        <input value={value} onChange={e => handleChange(e.target.value)} onKeyDown={handleKey} onFocus={() => setOpen(true)} placeholder="Escribe o elige una categoría..." autoComplete="off" style={{
            width: '100%', padding: '11px 12px 11px 38px',
            borderRadius: open && filtered.length > 0 ? '9px 9px 0 0' : 9,
            border: `1.5px solid ${open && filtered.length > 0 ? T.ink : T.ink10}`,
            fontSize: 14, fontFamily: T.sans, color: T.ink,
            outline: 'none', background: T.paper, transition: 'border-color .15s',
        }}/>
      </div>
      {open && filtered.length > 0 && (<div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.white,
                border: `1.5px solid ${T.ink}`, borderTop: 'none', borderRadius: '0 0 9px 9px',
                zIndex: 999, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,.1)',
                maxHeight: 260, overflowY: 'auto' }}>
          {filtered.map((cat, i) => (<div key={cat.label} onMouseDown={e => { e.preventDefault(); select(cat); }} onMouseEnter={() => setHighlighted(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer',
                    background: highlighted === i ? T.paper : T.white,
                    borderBottom: i < filtered.length - 1 ? `1px solid ${T.ink10}` : 'none',
                    transition: 'background .08s' }}>
              <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{cat.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{cat.label}</span>
            </div>))}
        </div>)}
    </div>);
}
const WORK_TYPES = [
    { id: 'onsite', label: 'Presencial' },
    { id: 'remote', label: 'Remoto' },
    { id: 'hybrid', label: 'Híbrido' },
] as const;
const EXP_LEVELS = [
    { id: 'internship', label: 'Prácticas' },
    { id: 'junior', label: 'Junior' },
    { id: 'mid', label: 'Mid' },
    { id: 'senior', label: 'Senior' },
] as const;
const RELEVANCE_COLORS: Record<string, {
    bg: string;
    text: string;
}> = {
    alta: { bg: 'rgba(40,200,64,.1)', text: '#28C840' },
    media: { bg: 'rgba(232,160,32,.1)', text: '#E8A020' },
    baja: { bg: 'rgba(192,57,43,.08)', text: '#C0392B' },
};
function OpportunityView({ profile, onProfileUpdate }: {
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
    const isFree = !profile.plan || profile.plan === 'free';
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
    return (<div style={{ padding: 32, maxWidth: 860 }}>

      
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
          El agente busca ofertas en LinkedIn que encajan con tu perfil y las guarda aquí.
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
            El agente está buscando...</>) : (<>{IC.zap} Lanzar agente</>)}
        </button>

        {loading && (<div style={{ marginTop: 20, padding: '16px 18px', background: T.paper,
                borderRadius: 10, border: `1px solid ${T.ink10}` }}>
            {['Abriendo navegador...', 'Navegando a LinkedIn Jobs...',
                `Buscando "${query}"${location ? ` en ${location}` : ''}...`,
                ...(experience ? [`Filtrando por experiencia: ${EXP_LEVELS.find(e => e.id === experience)?.label}...`] : []),
                'Filtrando ofertas relevantes...',
                ...(isFree ? ['Guardando resultados...'] : ['Analizando con IA...', 'Guardando resultados...']),
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
            El agente amplió la búsqueda a <strong>{searchedIn}</strong>.
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em', color: T.ink }}>Resultados</h3>
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
            Escribe qué buscas, selecciona la ciudad y pulsa "Lanzar agente".
          </p>
        </div>)}
    </div>);
}
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
    const NavBtn = ({ id, icon, label }: {
        id: View;
        icon: React.ReactNode;
        label: string;
    }) => (<button onClick={() => setView(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px',
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
            <NavBtn id="home" icon={IC.home} label="Inicio"/>
            <NavBtn id="missions" icon={IC.activity} label="Misiones"/>
            <NavBtn id="settings" icon={IC.settings} label="Ajustes"/>
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
