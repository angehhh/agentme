import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const T = {
  ink:   '#0C0C0C',
  ink60: '#606060',
  ink40: '#909090',
  ink20: '#C8C8C8',
  ink10: '#E8E8E8',
  paper: '#F5F4F1',
  white: '#FFFFFF',
  green: '#28C840',
  serif: "'Playfair Display', Georgia, serif",
  sans:  "'DM Sans', 'Helvetica Neue', sans-serif",
}

const RELEVANCE_COLORS: Record<string, { bg: string; text: string }> = {
  alta:  { bg: 'rgba(40,200,64,.1)',  text: '#28C840' },
  media: { bg: 'rgba(232,160,32,.1)', text: '#E8A020' },
  baja:  { bg: 'rgba(192,57,43,.08)', text: '#C0392B' },
}

type Job = {
  title: string; company: string; location: string
  url: string; posted: string
  relevance?: string; reason?: string
}

export default async function SharedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('shared_results')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const jobs = (data.jobs || []) as Job[]
  const date = new Date(data.created_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:${T.sans}; background:${T.paper}; color:${T.ink}; -webkit-font-smoothing:antialiased; }
        a { color:inherit; }
      `}</style>

      <div style={{ minHeight: '100vh', background: T.paper }}>

        {/* Header */}
        <div style={{ background: T.white, borderBottom: `1px solid ${T.ink10}`, padding: '16px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
              <rect width="30" height="30" rx="7" fill="#0C0C0C"/>
              <path d="M15 6L22 10V20L15 24L8 20V10L15 6Z" fill="white" opacity=".95"/>
              <path d="M15 11L19 13.5V18.5L15 21L11 18.5V13.5L15 11Z" fill="#0C0C0C"/>
            </svg>
            <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16,
              letterSpacing: '-.02em' }}>AGENTME</span>
          </div>
          <Link href="/auth"
            style={{ fontSize: 13, fontWeight: 600, color: T.white, background: T.ink,
              padding: '8px 18px', borderRadius: 8, textDecoration: 'none' }}>
            Crear cuenta gratis
          </Link>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px' }}>

          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.ink40, textTransform: 'uppercase',
              letterSpacing: '.08em', marginBottom: 8 }}>
              Resultados compartidos · {date}
            </p>
            <h1 style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 700,
              letterSpacing: '-.03em', color: T.ink, marginBottom: 8 }}>
              {data.query}
            </h1>
            {data.location && (
              <p style={{ fontSize: 15, color: T.ink60 }}>Ubicación: {data.location}</p>
            )}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
              fontSize: 12, fontWeight: 700, color: T.green, background: 'rgba(40,200,64,.1)',
              padding: '4px 12px', borderRadius: 100 }}>
              {data.total} ofertas encontradas
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jobs.map((job: Job, i: number) => (
              <div key={i}
                style={{ background: T.white, borderRadius: 14, padding: '18px 22px',
                  border: `1px solid ${T.ink10}` }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: T.ink, letterSpacing: '-.01em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.title}
                      </p>
                      {job.relevance && RELEVANCE_COLORS[job.relevance] && (
                        <span style={{ fontSize: 10, fontWeight: 700, flexShrink: 0,
                          color: RELEVANCE_COLORS[job.relevance].text,
                          background: RELEVANCE_COLORS[job.relevance].bg,
                          padding: '2px 9px', borderRadius: 100, textTransform: 'uppercase',
                          letterSpacing: '.04em' }}>
                          {job.relevance}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      {job.company && (
                        <span style={{ fontSize: 13, color: T.ink60 }}>{job.company}</span>
                      )}
                      {job.location && (
                        <span style={{ fontSize: 13, color: T.ink60 }}>{job.location}</span>
                      )}
                      <span style={{ fontSize: 12, color: T.ink40 }}>{job.posted}</span>
                    </div>
                    {job.reason && (
                      <p style={{ fontSize: 12, color: T.ink40, marginTop: 8, fontStyle: 'italic' }}>
                        {job.reason}
                      </p>
                    )}
                  </div>
                  <a href={job.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 7, background: T.ink,
                      color: T.white, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      textDecoration: 'none', flexShrink: 0 }}>
                    Ver oferta
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ background: T.ink, borderRadius: 16, padding: '28px 32px', marginTop: 32,
            textAlign: 'center' }}>
            <p style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: T.white,
              letterSpacing: '-.02em', marginBottom: 8 }}>
              ¿Quieres que un agente busque ofertas por ti?
            </p>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
              AGENTME escanea LinkedIn y te muestra solo lo relevante. Gratis.
            </p>
            <Link href="/auth"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.white,
                color: T.ink, padding: '12px 28px', borderRadius: 9, fontSize: 15, fontWeight: 700,
                textDecoration: 'none' }}>
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
