import { NextRequest, NextResponse } from 'next/server'
import { scrapeLinkedInJobs } from '@/lib/agent'
import { analyzeJobs, generateMarketInsights } from '@/lib/claude'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FREE_DAILY_LIMIT = 5

export async function POST(req: NextRequest) {
  try {
    const { userId, query, location, workType, experience } = await req.json()

    if (!userId || !query) {
      return NextResponse.json({ error: 'userId y query son requeridos' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, actions_today')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    const isFree = !profile.plan || profile.plan === 'free'
    const actionsUsed = profile.actions_today || 0

    if (isFree && actionsUsed >= FREE_DAILY_LIMIT) {
      return NextResponse.json({
        error: 'limit_reached',
        message: `Has alcanzado el lÃ­mite de ${FREE_DAILY_LIMIT} bÃºsquedas diarias del plan Free.`,
        actionsUsed,
        actionsLimit: FREE_DAILY_LIMIT,
        actionsRemaining: 0,
      }, { status: 429 })
    }

    console.log(`[Opportunity Mode] Usuario: ${userId} | Query: ${query} | Plan: ${profile.plan || 'free'}`)

    const result = await scrapeLinkedInJobs(query, location || 'Spain', 15, {
      workType: workType || null,
      experience: experience || null,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Error del agente' }, { status: 500 })
    }

    let jobs = result.jobs
    let aiAnalysis = null
    let marketInsights = null

    if (!isFree && jobs.length > 0) {
      try {
        const [analyzed, insights] = await Promise.all([
          analyzeJobs(jobs, query),
          generateMarketInsights(jobs, query, result.marketStats, location || 'Spain'),
        ])
        if (analyzed) {
          jobs = analyzed.jobs
          aiAnalysis = analyzed.summary
        }
        if (insights) marketInsights = insights
      } catch (e) {
        console.error('[Claude] Analysis failed, returning raw results:', e)
      }
    }

    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .insert({
        user_id:    userId,
        mode:       'opportunity',
        status:     result.total > 0 ? 'completed' : 'partial',
        goal:       query,
        actions:    result.total,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (missionError) console.error('Mission insert error:', missionError)

    if (mission && jobs.length > 0) {
      const { error: resultsError } = await supabase
        .from('results')
        .insert(jobs.map(job => ({
          mission_id: mission.id,
          user_id:    userId,
          type:       'job',
          title:      job.title,
          company:    job.company,
          location:   job.location,
          url:        job.url,
          posted:     job.posted,
          created_at: new Date().toISOString(),
        })))
      if (resultsError) console.error('Results insert error:', resultsError)
    }

    const newActionsUsed = actionsUsed + 1
    await supabase
      .from('profiles')
      .update({ actions_today: newActionsUsed })
      .eq('id', userId)

    const actionsRemaining = isFree ? Math.max(0, FREE_DAILY_LIMIT - newActionsUsed) : -1

    return NextResponse.json({
      success:        true,
      total:          result.total,
      jobs,
      mission:        mission?.id,
      expandedSearch: result.expandedSearch || false,
      searchedIn:     result.searchedIn || location || 'Spain',
      aiAnalysis,
      marketStats:    result.marketStats,
      marketInsights,
      actionsUsed:      newActionsUsed,
      actionsRemaining,
      actionsLimit:     isFree ? FREE_DAILY_LIMIT : -1,
    })

  } catch (err) {
    console.error('[Opportunity Mode] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
