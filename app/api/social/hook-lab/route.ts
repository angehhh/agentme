import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SOCIAL_LIMITS, tierFromPlan, utcStartOfIsoWeekIso, } from '@/lib/social-limits';
import { requireSessionUser } from '@/lib/require-session-user';
import { runSocialHookLabAgent } from '@/lib/modes/social-hook-pipeline';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function POST(req: NextRequest) {
    try {
        const auth = await requireSessionUser();
        if (!auth.ok)
            return auth.response;
        const userId = auth.user.id;
        const body = await req.json();
        const { topic, audience, tone, language } = body as {
            topic?: string;
            audience?: string;
            tone?: string;
            language?: string;
        };

        if (!topic?.trim()) {
            return NextResponse.json({ error: 'Falta tema' }, { status: 400 });
        }
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('plan')
            .eq('id', userId)
            .maybeSingle();
        if (!profile) {
            return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
        }
        const tier = tierFromPlan(profile.plan);
        const isFree = tier === 'free';
        if (isFree) {
            const since = utcStartOfIsoWeekIso();
            const { count, error: cErr } = await supabaseAdmin
                .from('missions')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('mode', 'social_hook')
                .gte('created_at', since);
            if (cErr)
                console.error('[social/hook-lab] count missions', cErr);
            const used = count ?? 0;
            if (used >= SOCIAL_LIMITS.hookLab.freePerWeek) {
                return NextResponse.json({
                    error: 'limit_reached',
                    message: `Plan Free: ${SOCIAL_LIMITS.hookLab.freePerWeek} Hook Labs por semana (lunes UTC), salida reducida. Pro: pack completo y sin límite de uso en la app.`,
                    limit: SOCIAL_LIMITS.hookLab.freePerWeek,
                }, { status: 429 });
            }
        }
        const agent = await runSocialHookLabAgent({
            topic: topic.trim(),
            audience: typeof audience === 'string' ? audience : 'usuarios de TikTok, Reels y Shorts',
            tone: typeof tone === 'string' ? tone : 'directo, energético, sin postureo',
            language: typeof language === 'string' ? language : 'español',
            tier,
            isPro: !isFree,
        });
        if (!agent.ok || !agent.state.hookLab) {
            const message = agent.error === 'missing_api_key'
                ? 'Falta ANTHROPIC_API_KEY en el servidor (p. ej. .env.local). Añádela y reinicia `next dev`.'
                : 'No se pudo generar Hook Lab (API de Anthropic o respuesta inesperada). Revisa la consola del servidor e inténtalo de nuevo.';
            return NextResponse.json({
                error: agent.error === 'missing_api_key' ? 'missing_api_key' : 'ia_no_disponible',
                message,
            }, { status: 503 });
        }
        const hookData = agent.state.hookLab;
        const { error: mErr } = await supabaseAdmin.from('missions').insert({
            user_id: userId,
            mode: 'social_hook',
            status: 'completed',
            goal: `Hook Lab [${tier}]: ${topic.trim().slice(0, 110)}`,
            actions: hookData.hooks.length,
            created_at: new Date().toISOString(),
        });
        if (mErr)
            console.error('[social/hook-lab] mission insert', mErr);
        return NextResponse.json({
            success: true,
            hookLab: hookData,
            tier,
            limit: isFree ? SOCIAL_LIMITS.hookLab.freePerWeek : null,
            limitWindow: isFree ? 'week' : null,
            plan: tier,
            pipeline: { steps: agent.plan.map(s => s.id) },
            nicheAnalysis: agent.state.nicheAnalysis,
            viralPatterns: agent.state.viralPatterns,
            scriptIdeas: agent.state.scriptIdeas,
        });
    }
    catch (e) {
        console.error('[social/hook-lab]', e);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
