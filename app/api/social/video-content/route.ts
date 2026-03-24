import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateVideoContentPack } from '@/lib/video-content-claude';
import { transcribeAudioBuffer } from '@/lib/transcribe-openai';
import { fetchVideoFromUrl } from '@/lib/video-url-fetch';
import { SOCIAL_LIMITS, VIDEO_UPLOAD_MAX_MB, tierFromPlan, utcStartOfIsoWeekIso, } from '@/lib/social-limits';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export const maxDuration = 120;
export const runtime = 'nodejs';
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const MAX_BYTES = VIDEO_UPLOAD_MAX_MB * 1024 * 1024;
type ParsedInput = {
    ok: true;
    language: string;
    whisperLang?: string;
    nicheHint?: string;
    buffer: Buffer;
    filename: string;
} | {
    ok: false;
    status: number;
    message: string;
};
async function parseRequest(req: NextRequest): Promise<ParsedInput> {
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('multipart/form-data')) {
        let form: FormData;
        try {
            form = await req.formData();
        }
        catch {
            return {
                ok: false,
                status: 413,
                message: 'Archivo demasiado grande o formulario inválido. Prueba un vídeo más pequeño (máx. ~24 MB).',
            };
        }
        let language = 'español';
        const lang = form.get('language');
        if (typeof lang === 'string' && lang.trim())
            language = lang.trim();
        let whisperLang: string | undefined;
        const wl = form.get('whisperLanguage');
        if (typeof wl === 'string' && wl.trim())
            whisperLang = wl.trim().slice(0, 5);
        let nicheHint: string | undefined;
        const nh = form.get('nicheHint');
        if (typeof nh === 'string' && nh.trim())
            nicheHint = nh.trim().slice(0, 300);
        const file = form.get('file');
        if (!file || typeof file === 'string') {
            return { ok: false, status: 400, message: 'Falta el archivo de vídeo (campo file).' };
        }
        const f = file as File;
        if (f.size > MAX_BYTES) {
            return {
                ok: false,
                status: 400,
                message: `El archivo supera ${VIDEO_UPLOAD_MAX_MB} MB (límite para transcripción).`,
            };
        }
        const ab = await f.arrayBuffer();
        const buffer = Buffer.from(ab);
        const filename = f.name?.trim() || 'upload.mp4';
        return { ok: true, language, whisperLang, nicheHint, buffer, filename };
    }
    let body: {
        videoUrl?: string;
        language?: string;
        whisperLanguage?: string;
        nicheHint?: string;
    };
    try {
        body = await req.json();
    }
    catch {
        return { ok: false, status: 400, message: 'JSON inválido.' };
    }
    const videoUrl = typeof body.videoUrl === 'string' ? body.videoUrl.trim() : '';
    if (!videoUrl) {
        return { ok: false, status: 400, message: 'Falta videoUrl o sube el vídeo como multipart (campo file).' };
    }
    let language = 'español';
    if (typeof body.language === 'string' && body.language.trim())
        language = body.language.trim();
    let whisperLang: string | undefined;
    if (typeof body.whisperLanguage === 'string' && body.whisperLanguage.trim()) {
        whisperLang = body.whisperLanguage.trim().slice(0, 5);
    }
    let nicheHint: string | undefined;
    if (typeof body.nicheHint === 'string' && body.nicheHint.trim()) {
        nicheHint = body.nicheHint.trim().slice(0, 300);
    }
    const fetched = await fetchVideoFromUrl(videoUrl);
    if (!fetched.ok) {
        return { ok: false, status: 400, message: fetched.message };
    }
    return {
        ok: true,
        language,
        whisperLang,
        nicheHint,
        buffer: fetched.buffer,
        filename: fetched.filename,
    };
}
export async function POST(req: NextRequest) {
    try {
        const supabase = await createRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userId = user.id;
        const parsed = await parseRequest(req);
        if (!parsed.ok) {
            return NextResponse.json({ error: 'bad_request', message: parsed.message }, { status: parsed.status });
        }
        const { language, whisperLang, nicheHint, buffer, filename } = parsed;
        const { data: profile } = await supabaseAdmin.from('profiles').select('plan').eq('id', userId).maybeSingle();
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
                .eq('mode', 'social_video')
                .gte('created_at', since);
            if (cErr)
                console.error('[social/video-content] count', cErr);
            const used = count ?? 0;
            if (used >= SOCIAL_LIMITS.videoContent.freePerWeek) {
                return NextResponse.json({
                    error: 'limit_reached',
                    message: `Plan Free: ${SOCIAL_LIMITS.videoContent.freePerWeek} análisis de vídeo por semana (lunes UTC). Pro: sin límite en la app.`,
                    limit: SOCIAL_LIMITS.videoContent.freePerWeek,
                }, { status: 429 });
            }
        }
        const tr = await transcribeAudioBuffer({
            buffer,
            filename,
            language: whisperLang,
        });
        if (!tr.ok) {
            if (tr.reason === 'missing_api_key') {
                return NextResponse.json({
                    error: 'missing_openai_key',
                    message: 'Falta OPENAI_API_KEY en el servidor para transcribir el audio del vídeo (Whisper). Añádela en .env.local y reinicia.',
                }, { status: 503 });
            }
            return NextResponse.json({
                error: 'transcription_failed',
                message: tr.reason === 'empty'
                    ? 'No se obtuvo texto del vídeo (¿sin audio o silencio?).'
                    : 'Error al transcribir con Whisper. Revisa formato, tamaño y que el vídeo tenga pista de audio.',
            }, { status: 502 });
        }
        const gen = await generateVideoContentPack({
            transcript: tr.text,
            tier,
            language,
            nicheHint,
        });
        if (!gen.ok) {
            const message = gen.reason === 'missing_api_key'
                ? 'Falta ANTHROPIC_API_KEY en el servidor.'
                : 'No se pudo generar el contenido con la IA.';
            return NextResponse.json({ error: gen.reason === 'missing_api_key' ? 'missing_api_key' : 'ia_no_disponible', message }, { status: 503 });
        }
        const label = filename.slice(0, 80);
        const { error: mErr } = await supabaseAdmin.from('missions').insert({
            user_id: userId,
            mode: 'social_video',
            status: 'completed',
            goal: `Vídeo → contenido [${tier}]: ${label}`,
            actions: gen.pack.hook_suggestions.length,
            created_at: new Date().toISOString(),
        });
        if (mErr)
            console.error('[social/video-content] mission insert', mErr);
        return NextResponse.json({
            success: true,
            pack: gen.pack,
            transcriptPreview: tr.text.slice(0, 400) + (tr.text.length > 400 ? '…' : ''),
            tier,
            limit: isFree ? SOCIAL_LIMITS.videoContent.freePerWeek : null,
            limitWindow: isFree ? 'week' : null,
        });
    }
    catch (e) {
        console.error('[social/video-content]', e);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
