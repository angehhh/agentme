'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export const IC = {
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

export const T = {
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

export type Suggestion = {
    label: string;
    value: string;
    country: string;
    flag: string;
};

export const CITIES: Suggestion[] = [
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

export function LocationInput({ value, onChange, onEnter }: {
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

export const JOB_CATEGORIES = [
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

export function QueryInput({ value, onChange, onEnter }: {
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

export const WORK_TYPES = [
    { id: 'onsite', label: 'Presencial' },
    { id: 'remote', label: 'Remoto' },
    { id: 'hybrid', label: 'Híbrido' },
] as const;

export const EXP_LEVELS = [
    { id: 'internship', label: 'Prácticas' },
    { id: 'junior', label: 'Junior' },
    { id: 'mid', label: 'Mid' },
    { id: 'senior', label: 'Senior' },
] as const;

export const RELEVANCE_COLORS: Record<string, { bg: string; text: string; }> = {
    alta: { bg: 'rgba(40,200,64,.1)', text: '#28C840' },
    media: { bg: 'rgba(232,160,32,.1)', text: '#E8A020' },
    baja: { bg: 'rgba(192,57,43,.08)', text: '#C0392B' },
};
