'use client'

import { useEffect, useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { Calendar, CirclePlay, Clapperboard, Download, Zap } from 'lucide-react'

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   TOKENS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const T = {
  ink:   '#0C0C0C', ink60: '#606060', ink40: '#909090',
  ink20: '#C8C8C8', ink10: '#E8E8E8', paper: '#F5F4F1',
  white: '#FFFFFF', green: '#28C840',
  serif: "'Playfair Display', Georgia, serif",
  sans:  "'DM Sans', 'Helvetica Neue', sans-serif",
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ICONS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const IC = {
  target: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>),
  externalLink: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>),
  building: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>),
  mapPin: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>),
  clock: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  chevronDown: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>),
  chevronUp: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>),
  zap: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>),
  plus: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  share: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>),
  check: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>),
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   TYPES
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
type Mission = {
  id:          string
  goal:        string
  mode:        string
  status:      string
  actions:     number
  created_at:  string
  result_count: number
}

type JobResult = {
  id:       string
  title:    string
  company:  string
  location: string
  url:      string
  posted:   string
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   HELPERS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch { return iso }
}

function isSocialMission(mode: string | undefined) {
  return (
    mode === 'social' ||
    mode === 'social_hook' ||
    mode === 'social_video' ||
    mode === 'social_youtube_clips' ||
    mode === 'social_youtube_render'
  )
}

function missionModeLabel(mode: string | undefined) {
  if (mode === 'social') return 'Social · Calendario editorial'
  if (mode === 'social_hook') return 'Social · Hook Lab'
  if (mode === 'social_video') return 'Social · Vídeo â†’ contenido'
  if (mode === 'social_youtube_clips') return 'Social · YouTube clips 9:16'
  if (mode === 'social_youtube_render') return 'Social · YouTube ZIP 9:16'
  return 'Opportunity · Búsqueda empleo'
}

function missionStatsLine(m: Mission) {
  if (m.mode === 'social') return `${m.actions} ideas en el calendario`
  if (m.mode === 'social_hook') return `${m.actions} ganchos generados`
  if (m.mode === 'social_video') return `${m.actions} piezas de contenido (hooks)`
  if (m.mode === 'social_youtube_clips') return `${m.actions} clips verticales sugeridos`
  if (m.mode === 'social_youtube_render') return `${m.actions} vídeos MP4 9:16 descargados (ZIP)`
  return `${m.result_count} ofertas guardadas`
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   MISSION CARD
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function MissionCard({
  mission, userId, supabase
}: {
  mission:  Mission
  userId:   string
  supabase: SupabaseClient
}) {
  const [open,     setOpen]     = useState(false)
  const [jobs,     setJobs]     = useState<JobResult[]>([])
  const [loading,  setLoading]  = useState(false)
  const [loaded,   setLoaded]   = useState(false)
  const [sharing,  setSharing]  = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const handleShare = async () => {
    if (sharing || jobs.length === 0) return
    setSharing(true)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          query: mission.goal,
          location: '',
          jobs,
          total: jobs.length,
        }),
      })
      const data = await res.json()
      if (data.success) {
        const url = `${window.location.origin}/shared/${data.id}`
        setShareUrl(url)
        await navigator.clipboard.writeText(url)
      }
    } catch { /* silent */ }
    setSharing(false)
  }

  const toggle = async () => {
    const willOpen = !open
    setOpen(willOpen)

    if (isSocialMission(mission.mode)) {
      setLoaded(true)
      setJobs([])
      return
    }

    if (willOpen && !loaded && !loading) {
      setLoading(true)
      const { data } = await supabase
        .from('results')
        .select('id, title, company, location, url, posted')
        .eq('mission_id', mission.id)
        .order('created_at', { ascending: true })

      setJobs(data || [])
      setLoaded(true)
      setLoading(false)
    }
  }

  const statusColor = mission.status === 'completed' ? T.green : '#E8A020'
  const statusLabel = mission.status === 'completed' ? 'Completada' : 'Parcial'

  return (
    <div style={{ background: T.white, borderRadius: 14,
      border: `1px solid ${T.ink10}`, overflow: 'hidden' }}>

      {/* Header */}
      <div onClick={toggle}
        style={{ padding: '18px 22px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 16,
          borderBottom: open ? `1px solid ${T.ink10}` : 'none',
          transition: 'background .12s' }}
        onMouseEnter={e => (e.currentTarget.style.background = T.paper)}
        onMouseLeave={e => (e.currentTarget.style.background = T.white)}>

        <div style={{ width: 38, height: 38, borderRadius: 10, background: T.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.white, flexShrink: 0 }}>
          {mission.mode === 'social' ? (
            <Calendar size={20} strokeWidth={1.75} color="#fff" aria-hidden />
          ) : mission.mode === 'social_hook' ? (
            <Zap size={20} strokeWidth={1.75} color="#fff" aria-hidden />
          ) : mission.mode === 'social_video' ? (
            <Clapperboard size={20} strokeWidth={1.75} color="#fff" aria-hidden />
          ) : mission.mode === 'social_youtube_clips' ? (
            <CirclePlay size={20} strokeWidth={1.75} color="#fff" aria-hidden />
          ) : mission.mode === 'social_youtube_render' ? (
            <Download size={20} strokeWidth={1.75} color="#fff" aria-hidden />
          ) : (
            IC.target
          )}
        </div>

        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
            <p
              title={mission.goal || undefined}
              style={{
                fontSize: 15, fontWeight: 700, color: T.ink,
                letterSpacing: '-.01em',
                flex: 1, minWidth: 0,
                ...(isSocialMission(mission.mode)
                  ? { whiteSpace: 'normal' as const, wordBreak: 'break-word' as const, lineHeight: 1.35 }
                  : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }),
              }}
            >
              {mission.goal || 'Sin objetivo'}
            </p>
            <span style={{ fontSize: 10, fontWeight: 700, color: statusColor,
              background: `${statusColor}18`, padding: '2px 8px',
              borderRadius: 100, flexShrink: 0, letterSpacing: '.04em',
              textTransform: 'uppercase' }}>
              {statusLabel}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: T.ink40, fontWeight: 600 }}>{missionModeLabel(mission.mode)}</span>
            <span style={{ fontSize: 12, color: T.ink40 }}>
              {missionStatsLine(mission)}
            </span>
            <span style={{ fontSize: 12, color: T.ink40 }}>
              {formatDate(mission.created_at)}
            </span>
          </div>
        </div>

        <div style={{ color: T.ink40, flexShrink: 0 }}>
          {open ? IC.chevronUp : IC.chevronDown}
        </div>
      </div>

      {/* Detalle expandido */}
      {open && isSocialMission(mission.mode) && (
        <div style={{ padding: '16px 22px 20px', borderTop: `1px solid ${T.ink10}` }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: T.ink40, marginBottom: 10 }}>
            Qué generaste
          </p>
          <p style={{ fontSize: 15, color: T.ink, lineHeight: 1.55, margin: '0 0 14px' }}>
            {mission.goal || 'Sin descripción'}
          </p>
          <p style={{ fontSize: 13, color: T.ink60, lineHeight: 1.6, margin: 0 }}>
            El contenido completo (calendario o ganchos) no se guarda en esta lista: vuelve a{' '}
            <strong>Social Mode</strong> para verlo, copiarlo o generar otro. Aquí queda el registro para tu historial y límites.
          </p>
        </div>
      )}

      {open && !isSocialMission(mission.mode) && (
        <div style={{ padding: '16px 22px 20px' }}>
          {!loading && jobs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.ink40 }}>
                {jobs.length} ofertas guardadas
              </span>
              <button onClick={handleShare} disabled={sharing}
                style={{ display: 'flex', alignItems: 'center', gap: 6,
                  background: shareUrl ? 'rgba(40,200,64,.08)' : T.ink,
                  color: shareUrl ? T.green : T.white,
                  padding: '6px 12px', borderRadius: 7,
                  border: shareUrl ? `1px solid rgba(40,200,64,.2)` : 'none',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: T.sans, opacity: sharing ? .6 : 1,
                  transition: 'all .2s' }}>
                {shareUrl ? (<>{IC.check} Link copiado</>) :
                 sharing ? 'Generando...' : (<>{IC.share} Compartir</>)}
              </button>
            </div>
          )}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, color: T.ink40, padding: '12px 0' }}>
              <div style={{ width: 14, height: 14, border: `2px solid ${T.ink10}`,
                borderTopColor: T.ink40, borderRadius: '50%',
                animation: 'spin .7s linear infinite' }} />
              Cargando ofertas...
            </div>
          ) : jobs.length === 0 ? (
            <p style={{ fontSize: 13, color: T.ink40, padding: '8px 0' }}>
              No hay ofertas guardadas para esta búsqueda.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {jobs.map((job, i) => (
                <div key={job.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', borderRadius: 10,
                    background: T.paper, border: `1px solid ${T.ink10}`,
                    animation: `fadeIn .25s ${i * 0.04}s ease both`, opacity: 0 }}>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: T.ink,
                      marginBottom: 4, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center',
                      gap: 12, flexWrap: 'wrap' }}>
                      {job.company && (
                        <span style={{ display: 'flex', alignItems: 'center',
                          gap: 4, fontSize: 12, color: T.ink60 }}>
                          {IC.building} {job.company}
                        </span>
                      )}
                      {job.location && (
                        <span style={{ display: 'flex', alignItems: 'center',
                          gap: 4, fontSize: 12, color: T.ink60 }}>
                          {IC.mapPin} {job.location}
                        </span>
                      )}
                      {job.posted && (
                        <span style={{ display: 'flex', alignItems: 'center',
                          gap: 4, fontSize: 11, color: T.ink40 }}>
                          {IC.clock} {job.posted}
                        </span>
                      )}
                    </div>
                  </div>
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 600, color: T.ink,
                        textDecoration: 'none', flexShrink: 0,
                        padding: '7px 12px', borderRadius: 7,
                        border: `1.5px solid ${T.ink10}`, background: T.white,
                        transition: 'all .12s' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = T.ink
                        e.currentTarget.style.color = T.white
                        e.currentTarget.style.borderColor = T.ink
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = T.white
                        e.currentTarget.style.color = T.ink
                        e.currentTarget.style.borderColor = T.ink10
                      }}>
                      Ver {IC.externalLink}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   MISSIONS VIEW
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function MissionsView({
  userId,
  supabase,
  onNewMission,
}: {
  userId:       string
  supabase:     SupabaseClient
  onNewMission: () => void
}) {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      // Query directa â€” sin RPC
      const { data: raw, error } = await supabase
        .from('missions')
        .select('id, goal, mode, status, actions, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Missions error:', error)
        setLoading(false)
        return
      }

      if (!raw || raw.length === 0) {
        setMissions([])
        setLoading(false)
        return
      }

      // Contar resultados para cada misión en una sola query
      const missionIds = raw.map(m => m.id)
      const { data: counts } = await supabase
        .from('results')
        .select('mission_id')
        .in('mission_id', missionIds)

      // Agrupar conteo por mission_id
      const countMap: Record<string, number> = {}
      for (const r of counts || []) {
        countMap[r.mission_id] = (countMap[r.mission_id] || 0) + 1
      }

      const withCount: Mission[] = raw.map(m => ({
        ...m,
        result_count: countMap[m.id] || 0,
      }))

      setMissions(withCount)
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) return (
    <div style={{ padding: 32, display: 'flex', alignItems: 'center',
      gap: 10, fontSize: 14, color: T.ink40, fontFamily: T.sans }}>
      <div style={{ width: 16, height: 16, border: `2px solid ${T.ink10}`,
        borderTopColor: T.ink40, borderRadius: '50%',
        animation: 'spin .8s linear infinite' }} />
      Cargando misiones...
    </div>
  )

  const totalOfertas = missions.reduce((s, m) => s + (m.result_count || 0), 0)
  const completadas  = missions.filter(m => m.status === 'completed').length

  return (
    <div style={{ padding: 32, maxWidth: 860 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 32,
        gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 700,
            letterSpacing: '-.025em', color: T.ink, marginBottom: 6 }}>
            Misiones
          </h2>
          <p style={{ fontSize: 15, color: T.ink60, lineHeight: 1.6 }}>
            Historial de Opportunity (ofertas) y de Social Mode (calendario / Hook Lab). Haz clic para ver el detalle.
          </p>
        </div>
        <button onClick={onNewMission}
          style={{ display: 'flex', alignItems: 'center', gap: 7,
            background: T.ink, color: T.white, padding: '11px 20px',
            borderRadius: 9, fontSize: 14, fontWeight: 600,
            border: 'none', fontFamily: T.sans, cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0, transition: 'opacity .15s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
          {IC.plus} Nueva misión
        </button>
      </div>

      {/* Stats */}
      {missions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total misiones',    value: missions.length },
            { label: 'Ofertas guardadas', value: totalOfertas },
            { label: 'Completadas',       value: completadas },
          ].map((s, i) => (
            <div key={i} style={{ background: T.white, borderRadius: 12,
              padding: '16px 20px', border: `1px solid ${T.ink10}` }}>
              <p style={{ fontSize: 11, color: T.ink40, textTransform: 'uppercase',
                letterSpacing: '.08em', fontWeight: 700, marginBottom: 6 }}>
                {s.label}
              </p>
              <p style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700,
                letterSpacing: '-.025em', color: T.ink }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      {missions.length === 0 ? (
        <div style={{ background: T.white, borderRadius: 16, padding: '56px 40px',
          textAlign: 'center', border: `1px solid ${T.ink10}` }}>
          <div style={{ width: 52, height: 52, borderRadius: 13, background: T.paper,
            border: `1px solid ${T.ink10}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: T.ink40, margin: '0 auto 20px' }}>
            {IC.target}
          </div>
          <h3 style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700,
            letterSpacing: '-.02em', color: T.ink, marginBottom: 10 }}>
            Sin misiones todavía
          </h3>
          <p style={{ fontSize: 14, color: T.ink60, lineHeight: 1.65,
            marginBottom: 28, maxWidth: 320, margin: '0 auto 28px' }}>
            Activa Opportunity Mode para que el agente empiece a buscar ofertas.
          </p>
          <button onClick={onNewMission}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
              background: T.ink, color: T.white, padding: '11px 24px',
              borderRadius: 9, fontSize: 14, fontWeight: 600,
              border: 'none', fontFamily: T.sans, cursor: 'pointer' }}>
            {IC.zap} Lanzar primera misión
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {missions.map(m => (
            <MissionCard key={m.id} mission={m} userId={userId} supabase={supabase} />
          ))}
        </div>
      )}
    </div>
  )
}