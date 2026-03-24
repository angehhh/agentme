import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateYoutubeVerticalClips } from '@/lib/youtube-clips-claude';
import { fetchYoutubeTranscript } from '@/lib/youtube-fetch-transcript';
import { totalDurationSec, transcriptToTimedLines } from '@/lib/youtube-transcript-helpers';
import { extractYoutubeVideoId } from '@/lib/youtube-video-id';
import { SOCIAL_LIMITS, tierFromPlan, utcStartOfIsoWeekIso, } from '@/lib/social-limits';
export const maxDuration = 300;
export const runtime = 'nodejs';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const MAX_TIMED_CHARS = 110000;
async function fetchYoutubeOEmbedTitle(videoId: string): Promise<string | null> {
    try {
        const watch = `https://www.youtube.com/watch?v=${videoId}`;
        const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`, { cache: 'no-store' });
        if (!res.ok)
            return null;
        const j = (await res.json()) as {
            title?: string;
        };
        return typeof j.title === 'string' ? j.title : null;
    }
    catch {
        return null;
    }
}
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, youtubeUrl, captionLang, language } = body as {
            userId?: string;
            youtubeUrl?: string;
            captionLang?: string;
            language?: string;
        };
        if (!userId?.trim()) {
            return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
        }
        if (!youtubeUrl?.trim()) {
            return NextResponse.json({ error: 'Falta la URL de YouTube' }, { status: 400 });
        }
        const videoId = extractYoutubeVideoId(youtubeUrl.trim());
        if (!videoId) {
            return NextResponse.json({ error: 'URL inválida', message: 'Pega un enlace de youtube.com, youtu.be o Shorts.' }, { status: 400 });
        }
        const { data: profile } = await supabase.from('profiles').select('plan').eq('id', userId).maybeSingle();
        if (!profile) {
            return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
        }
        const tier = tierFromPlan(profile.plan);
        const isFree = tier === 'free';
        if (isFree) {
            const since = utcStartOfIsoWeekIso();
            const { count, error: cErr } = await supabase
                .from('missions')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('mode', 'social_youtube_clips')
                .gte('created_at', since);
            if (cErr)
                console.error('[social/youtube-clips] count', cErr);
            const used = count ?? 0;
            if (used >= SOCIAL_LIMITS.youtubeClips.freePerWeek) {
                return NextResponse.json({
                    error: 'limit_reached',
                    message: `Plan Free: ${SOCIAL_LIMITS.youtubeClips.freePerWeek} análisis YouTube/semana (lun UTC). Pro: sin límite en la app.`,
                    limit: SOCIAL_LIMITS.youtubeClips.freePerWeek,
                }, { status: 429 });
            }
        }
        const tr = await fetchYoutubeTranscript(videoId, captionLang?.trim() || undefined);
        if (!tr.ok) {
            return NextResponse.json({ error: tr.code, message: tr.message }, { status: 400 });
        }
        let timed = transcriptToTimedLines(tr.segments);
        if (timed.length > MAX_TIMED_CHARS) {
            timed =
                timed.slice(0, MAX_TIMED_CHARS) +
                    '\n\n… [Transcripción truncada: el vídeo es muy largo; los clips se basan en la parte inicial.]';
        }
        const durationSec = totalDurationSec(tr.segments);
        const oEmbedTitle = await fetchYoutubeOEmbedTitle(videoId);
        const outLang = typeof language === 'string' && language.trim() ? language.trim() : 'español';
        const gen = await generateYoutubeVerticalClips({
            timedTranscript: timed,
            videoTitle: oEmbedTitle,
            videoDurationSec: durationSec,
            tier,
            language: outLang,
        });
        if (!gen.ok) {
            const message = gen.reason === 'missing_api_key'
                ? 'Falta ANTHROPIC_API_KEY en el servidor.'
                : 'No se pudieron generar los clips con la IA.';
            return NextResponse.json({ error: gen.reason === 'missing_api_key' ? 'missing_api_key' : 'ia_no_disponible', message }, { status: 503 });
        }
        const titleForMission = oEmbedTitle || gen.data.video_title_hint || videoId;
        const { error: mErr } = await supabase.from('missions').insert({
            user_id: userId,
            mode: 'social_youtube_clips',
            status: 'completed',
            goal: `YouTube 9:16 [${tier}]: ${titleForMission.slice(0, 100)}`,
            actions: gen.data.clips.length,
            created_at: new Date().toISOString(),
        });
        if (mErr)
            console.error('[social/youtube-clips] mission insert', mErr);
        return NextResponse.json({
            success: true,
            videoId,
            videoTitle: oEmbedTitle,
            ...gen.data,
            tier,
            limit: isFree ? SOCIAL_LIMITS.youtubeClips.freePerWeek : null,
            limitWindow: isFree ? 'week' : null,
        });
    }
    catch (e) {
        console.error('[social/youtube-clips]', e);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
