import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/require-session-user';
import { runOpportunityAgent } from '@/lib/modes/opportunity';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const FREE_DAILY_LIMIT = 5;
export async function POST(req: NextRequest) {
    try {
        const auth = await requireSessionUser();
        if (!auth.ok)
            return auth.response;
        const userId = auth.user.id;

        const { query, location, workType, experience } = await req.json();
        if (!query) {
            return NextResponse.json({ error: 'La query es requerida' }, { status: 400 });
        }
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('plan, actions_today')
            .eq('id', userId)
            .single();
        if (!profile) {
            return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
        }
        const isFree = !profile.plan || profile.plan === 'free';
        const actionsUsed = profile.actions_today || 0;
        if (isFree && actionsUsed >= FREE_DAILY_LIMIT) {
            return NextResponse.json({
                error: 'limit_reached',
                message: `Has alcanzado el límite de ${FREE_DAILY_LIMIT} búsquedas diarias del plan Free.`,
                actionsUsed,
                actionsLimit: FREE_DAILY_LIMIT,
                actionsRemaining: 0,
            }, { status: 429 });
        }
        console.log(`[Opportunity Mode] Usuario: ${userId} | Query: ${query} | Plan: ${profile.plan || 'free'}`);
        const agent = await runOpportunityAgent({
            query,
            location: location || 'Spain',
            filters: {
                workType: workType || null,
                experience: experience || null,
            },
            isFree,
        });
        if (!agent.ok) {
            return NextResponse.json({ error: agent.error || 'Error del agente' }, { status: 500 });
        }
        const { jobs, expandedSearch, searchedIn, marketStats, aiAnalysis, marketInsights, companiesCatalog, companiesFiltered, outreachDrafts, } = agent.state;
        const resultTotal = jobs.length;
        const { data: mission, error: missionError } = await supabaseAdmin
            .from('missions')
            .insert({
            user_id: userId,
            mode: 'opportunity',
            status: resultTotal > 0 ? 'completed' : 'partial',
            goal: query,
            actions: resultTotal,
            created_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (missionError)
            console.error('Mission insert error:', missionError);
        if (mission && jobs.length > 0) {
            const { error: resultsError } = await supabaseAdmin
                .from('results')
                .insert(jobs.map(job => ({
                mission_id: mission.id,
                user_id: userId,
                type: 'job',
                title: job.title,
                company: job.company,
                location: job.location,
                url: job.url,
                posted: job.posted,
                created_at: new Date().toISOString(),
            })));
            if (resultsError)
                console.error('Results insert error:', resultsError);
        }
        const newActionsUsed = actionsUsed + 1;
        await supabaseAdmin
            .from('profiles')
            .update({ actions_today: newActionsUsed })
            .eq('id', userId);
        const actionsRemaining = isFree ? Math.max(0, FREE_DAILY_LIMIT - newActionsUsed) : -1;
        return NextResponse.json({
            success: true,
            total: resultTotal,
            jobs,
            mission: mission?.id,
            expandedSearch: expandedSearch || false,
            searchedIn: searchedIn || location || 'Spain',
            aiAnalysis,
            marketStats,
            marketInsights,
            companiesCatalog,
            companiesFiltered,
            outreachDrafts,
            pipeline: { steps: agent.plan.map(s => s.id) },
            actionsUsed: newActionsUsed,
            actionsRemaining,
            actionsLimit: isFree ? FREE_DAILY_LIMIT : -1,
        });
    }
    catch (err) {
        console.error('[Opportunity Mode] Error:', err);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
