'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

/* â”€â”€ ICONS â”€â”€ */
const IC = {
  logo: (
    <svg width="32" height="32" viewBox="0 0 30 30" fill="none">
      <rect width="30" height="30" rx="7" fill="#0C0C0C"/>
      <path d="M15 6L22 10V20L15 24L8 20V10L15 6Z" fill="white" opacity=".95"/>
      <path d="M15 11L19 13.5V18.5L15 21L11 18.5V13.5L15 11Z" fill="#0C0C0C"/>
    </svg>
  ),
  mail: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  lock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  eyeOff: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
}

const T = {
  ink:   '#0C0C0C',
  ink60: '#606060',
  ink40: '#909090',
  ink20: '#C8C8C8',
  ink10: '#E8E8E8',
  paper: '#F5F4F1',
  white: '#FFFFFF',
  green: '#28C840',
  red:   '#C0392B',
  serif: "'Playfair Display', Georgia, serif",
  sans:  "'DM Sans', 'Helvetica Neue', sans-serif",
}

export default function AuthPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [mode,     setMode]     = useState<'login' | 'signup'>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [done,     setDone]     = useState(false)

  const sendWelcomeEmail = async (email: string, name?: string) => {
    try {
      await fetch('/api/emails/welcome', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, name }),
      })
    } catch (e) {
      // No bloqueamos el flujo si falla el email
      console.error('Welcome email failed:', e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Email o contraseña incorrectos')
        setLoading(false)
        return
      }
      router.push('/dashboard')

    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message.includes('already')
          ? 'Este email ya está registrado'
          : 'Error al crear la cuenta')
        setLoading(false)
        return
      }
      if (data.user) {
        await sendWelcomeEmail(email)
      }
      if (data.session) {
        router.push('/dashboard')
        return
      }
      setDone(true)
    }

    setLoading(false)
  }

  /* â”€â”€ Email confirmation screen â”€â”€ */
  if (done) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; }
          body { font-family:${T.sans}; background:${T.paper}; }
        `}</style>
        <div style={{ minHeight: '100vh', background: T.paper,
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%',
              background: 'rgba(40,200,64,.1)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: T.green,
              margin: '0 auto 24px' }}>
              {IC.check}
            </div>
            <h2 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700,
              letterSpacing: '-.025em', color: T.ink, marginBottom: 12 }}>
              Revisa tu email
            </h2>
            <p style={{ fontSize: 15, color: T.ink60, lineHeight: 1.7,
              marginBottom: 28 }}>
              Te hemos enviado un link de confirmación a{' '}
              <strong style={{ color: T.ink }}>{email}</strong>.
              También te llegará un email de bienvenida de AGENTME.
            </p>
            <button onClick={() => setMode('login')}
              style={{ background: 'none', border: 'none',
                fontSize: 14, fontWeight: 600, color: T.ink60,
                cursor: 'pointer', fontFamily: T.sans,
                textDecoration: 'underline' }}>
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </>
    )
  }

  /* â”€â”€ Main auth form â”€â”€ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:${T.sans}; background:${T.paper}; -webkit-font-smoothing:antialiased; }
        input::placeholder { color:${T.ink20}; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade { animation:fadeUp .35s ease; }
      `}</style>

      <div style={{ minHeight: '100vh', background: T.paper,
        display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ padding: '20px 32px',
          borderBottom: `1px solid ${T.ink10}`,
          background: T.white,
          display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 10 }}
            onClick={() => router.push('/')}>
            {IC.logo}
            <span style={{ fontFamily: T.serif, fontWeight: 700,
              fontSize: 17, letterSpacing: '-.02em', color: T.ink }}>
              AGENTME
            </span>
          </div>
        </div>

        {/* Center */}
        <div style={{ flex: 1, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 24 }}>

          <div className="fade" style={{ width: '100%', maxWidth: 420 }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <h1 style={{ fontFamily: T.serif,
                fontSize: 32, fontWeight: 700,
                letterSpacing: '-.03em', color: T.ink, marginBottom: 8 }}>
                {mode === 'login'
                  ? <>Bienvenido de<br/><em style={{ fontStyle: 'italic', color: T.ink60 }}>nuevo</em></>
                  : <>Empieza a<br/><em style={{ fontStyle: 'italic', color: T.ink60 }}>trabajar menos</em></>
                }
              </h1>
              <p style={{ fontSize: 15, color: T.ink60, lineHeight: 1.6 }}>
                {mode === 'login'
                  ? 'Inicia sesión para acceder a tu agente'
                  : 'Crea tu cuenta gratis â€” sin tarjeta de crédito'}
              </p>
            </div>

            {/* Card */}
            <div style={{ background: T.white, borderRadius: 18,
              padding: '32px 32px', border: `1px solid ${T.ink10}`,
              boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>

              {/* Tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 4, background: T.paper, padding: 4,
                borderRadius: 10, marginBottom: 28 }}>
                {(['login', 'signup'] as const).map(m => (
                  <button key={m} onClick={() => { setMode(m); setError('') }}
                    style={{ padding: '9px 0', borderRadius: 7,
                      fontSize: 14, fontWeight: mode === m ? 600 : 400,
                      background: mode === m ? T.white : 'transparent',
                      color: mode === m ? T.ink : T.ink60,
                      border: 'none', cursor: 'pointer',
                      fontFamily: T.sans, transition: 'all .15s',
                      boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
                    {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>

                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12,
                    fontWeight: 700, color: T.ink40,
                    textTransform: 'uppercase', letterSpacing: '.08em',
                    marginBottom: 8 }}>
                    Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14,
                      top: '50%', transform: 'translateY(-50%)',
                      color: T.ink40, pointerEvents: 'none' }}>
                      {IC.mail}
                    </span>
                    <input
                      type="email" required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      style={{ width: '100%', padding: '12px 14px 12px 42px',
                        borderRadius: 9, border: `1.5px solid ${T.ink10}`,
                        fontSize: 14, fontFamily: T.sans, color: T.ink,
                        outline: 'none', background: T.paper,
                        transition: 'border-color .15s' }}
                      onFocus={e => (e.target.style.borderColor = T.ink)}
                      onBlur={e => (e.target.style.borderColor = T.ink10)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12,
                    fontWeight: 700, color: T.ink40,
                    textTransform: 'uppercase', letterSpacing: '.08em',
                    marginBottom: 8 }}>
                    Contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14,
                      top: '50%', transform: 'translateY(-50%)',
                      color: T.ink40, pointerEvents: 'none' }}>
                      {IC.lock}
                    </span>
                    <input
                      type={showPw ? 'text' : 'password'} required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢'}
                      minLength={6}
                      style={{ width: '100%', padding: '12px 44px 12px 42px',
                        borderRadius: 9, border: `1.5px solid ${T.ink10}`,
                        fontSize: 14, fontFamily: T.sans, color: T.ink,
                        outline: 'none', background: T.paper,
                        transition: 'border-color .15s' }}
                      onFocus={e => (e.target.style.borderColor = T.ink)}
                      onBlur={e => (e.target.style.borderColor = T.ink10)}
                    />
                    <button type="button"
                      onClick={() => setShowPw(p => !p)}
                      style={{ position: 'absolute', right: 14,
                        top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none',
                        color: T.ink40, cursor: 'pointer', padding: 0,
                        display: 'flex', alignItems: 'center' }}>
                      {showPw ? IC.eyeOff : IC.eye}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div style={{ background: 'rgba(192,57,43,.08)',
                    border: '1px solid rgba(192,57,43,.2)',
                    borderRadius: 9, padding: '11px 14px',
                    fontSize: 13, color: T.red, marginBottom: 20 }}>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '14px 0',
                    borderRadius: 9, background: loading ? T.ink10 : T.ink,
                    color: loading ? T.ink40 : T.white,
                    fontSize: 15, fontWeight: 700, border: 'none',
                    fontFamily: T.sans, cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all .15s', letterSpacing: '-.01em' }}>
                  {loading
                    ? 'Cargando...'
                    : mode === 'login'
                      ? 'Iniciar sesión'
                      : 'Crear cuenta gratis'}
                </button>
              </form>
            </div>

            {/* Footer */}
            <p style={{ textAlign: 'center', fontSize: 13,
              color: T.ink40, marginTop: 20, lineHeight: 1.6 }}>
              {mode === 'login'
                ? <>Â¿No tienes cuenta?{' '}
                    <button onClick={() => { setMode('signup'); setError('') }}
                      style={{ background: 'none', border: 'none',
                        fontSize: 13, fontWeight: 600, color: T.ink,
                        cursor: 'pointer', fontFamily: T.sans,
                        textDecoration: 'underline' }}>
                      Crear cuenta gratis
                    </button>
                  </>
                : <>Â¿Ya tienes cuenta?{' '}
                    <button onClick={() => { setMode('login'); setError('') }}
                      style={{ background: 'none', border: 'none',
                        fontSize: 13, fontWeight: 600, color: T.ink,
                        cursor: 'pointer', fontFamily: T.sans,
                        textDecoration: 'underline' }}>
                      Iniciar sesión
                    </button>
                  </>
              }
            </p>
          </div>
        </div>
      </div>
    </>
  )
}