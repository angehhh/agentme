import Anthropic from '@anthropic-ai/sdk';
import type { SocialPlanTier } from '@/lib/social-limits';
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
export type YoutubeVerticalClip = {
    start_sec: number;
    end_sec: number;
    title: string;
    hook_overlay: string;
    why_stops_scroll: string;
    nine_sixteen_framing: string;
    safe_zones_caption: string;
    on_screen_text_suggestions: string[];
    sound_hook: string;
    cta_end: string;
    estimated_virality_1_10: number;
    publish_description: string;
    suggested_hashtags: string[];
    best_platforms: string[];
    thumbnail_cover_idea: string;
    edit_checklist: string[];
    dynamic_caption_style: string;
};
export type YoutubeClipsResult = {
    video_title_hint?: string;
    clips: YoutubeVerticalClip[];
};
export type YoutubeClipsGenResult = {
    ok: true;
    data: YoutubeClipsResult;
} | {
    ok: false;
    reason: 'missing_api_key' | 'api_or_parse';
};
export const YOUTUBE_CLIPS_TARGET_COUNT = { pro: 12, free: 4 } as const;
function parseAssistantJsonObject<T>(raw: string): T {
    let s = raw.trim();
    const fenced = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```/im.exec(s);
    if (fenced)
        s = fenced[1].trim();
    else if (s.startsWith('```')) {
        s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    }
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start === -1 || end <= start) {
        throw new SyntaxError('No se encontró un objeto JSON en la respuesta del modelo');
    }
    return JSON.parse(s.slice(start, end + 1)) as T;
}
export async function generateYoutubeVerticalClips(params: {
    timedTranscript: string;
    videoTitle: string | null;
    videoDurationSec: number;
    tier: SocialPlanTier;
    language: string;
}): Promise<YoutubeClipsGenResult> {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
        return { ok: false, reason: 'missing_api_key' };
    }
    const { timedTranscript, videoTitle, videoDurationSec, tier, language } = params;
    if (!timedTranscript.trim())
        return { ok: false, reason: 'api_or_parse' };
    const clipCount = tier === 'pro' ? YOUTUBE_CLIPS_TARGET_COUNT.pro : YOUTUBE_CLIPS_TARGET_COUNT.free;
    const titleLine = videoTitle ? `Título del vídeo (YouTube): ${videoTitle}` : 'Título: desconocido';
    const prompt = `Eres el motor creativo de una herramienta para CREADORES DE CONTENIDO (estilo OpusClip): conviertes un vídeo largo de YouTube en varios SHORTS VERTICALES 9:16 listos para publicar (TikTok, Instagram Reels, YouTube Shorts).

El creador NO recibe un MP4 renderizado; recibe TODO lo necesario para editar en 10–15 minutos y subir: tiempos exactos, copy, hashtags, descripción del post y checklist de edición.

${titleLine}
Duración aproximada del vídeo: ${Math.round(videoDurationSec)} segundos.
Idioma de salida (títulos, copy, descripciones): ${language}

TRANSCRIPCIÓN CON TIEMPOS (s = segundos desde el inicio):
---
${timedTranscript}
---

Tarea:
1. Elige exactamente **${clipCount}** momentos fuertes, **poco solapados**, duración ideal **22–55 s** (18–60 s si el clip lo merece).
2. **Obligatorio:** el array JSON \`clips\` debe tener **exactamente ${clipCount} elementos** (ni uno menos ni uno más), salvo si el vídeo es tan corto que es imposible — en ese caso, todos los momentos válidos que quepan sin inventar tiempo.
3. **start_sec** y **end_sec** en segundos decimales, alineados con frases de la transcripción (usa [Xs–Ys]).
4. Cada clip debe servir como **pieza autónoma** para algoritmos de cortos: gancho en 0–2 s, desarrollo claro, CTA final.
5. Rellena SIEMPRE los campos de **publicación** (descripción + hashtags + plataformas) como si el creador fuera a pegarlos tal cual. Sé conciso en listas largas para poder incluir los ${clipCount} clips completos en el JSON.

Responde SOLO JSON válido (sin markdown):
{
  "video_title_hint": "título corto inferido si falta",
  "clips": [
    {
      "start_sec": 12.5,
      "end_sec": 48.0,
      "title": "título pegadizo del clip (para carpeta de proyecto o idea de cover)",
      "hook_overlay": "texto 0–2s en pantalla, muy corto",
      "why_stops_scroll": "1 frase: curiosidad/tensión/beneficio",
      "nine_sixteen_framing": "cómo recortar 16:9→9:16: sujeto centrado, cara en tercio superior, etc.",
      "safe_zones_caption": "zona segura para subtítulos quemados sin tapar cara",
      "on_screen_text_suggestions": ["2 a 4 textos cortos en secuencia"],
      "sound_hook": "música tendencia / silencio / SFX sugerido",
      "cta_end": "frase últimos 3s",
      "estimated_virality_1_10": 7,
      "publish_description": "2–5 líneas listas para descripción de TikTok/Reels/Shorts; puede incluir 1–2 emojis máximo",
      "suggested_hashtags": ["#tag1", "#tag2", "... 5 a 10 hashtags relevantes"],
      "best_platforms": ["TikTok", "Instagram Reels", "YouTube Shorts"] o subconjunto ordenado por encaje,
      "thumbnail_cover_idea": "qué mostrar en el frame 0 o cover (expresión, texto grande, contraste)",
      "edit_checklist": ["4 a 6 pasos: importar tramo", "recorte 9:16", "subtítulos", "texto hook", ...],
      "dynamic_caption_style": "cómo animar captions: palabras clave en negrita/color, ritmo con cortes, estilo viral"
    }
  ]
}

Reglas:
- **${clipCount} entradas en \`clips\`** para este plan (Pro = 12, Free = 4) si el material del vídeo lo permite.
- start_sec < end_sec, end_sec ≤ ${Math.ceil(videoDurationSec) + 5}.
- publish_description sin URL del vídeo largo (el creador ya tiene el enlace).
- Sin markdown ni backticks en el JSON.`;
    try {
        const maxOutTokens = tier === 'pro' ? 32768 : 8192;
        const stream = anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: maxOutTokens,
            messages: [{ role: 'user', content: prompt }],
        });
        const msg = await stream.finalMessage();
        const text = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
        const raw = parseAssistantJsonObject<{
            video_title_hint?: string;
            clips?: Record<string, unknown>[];
        }>(text);
        const clips = Array.isArray(raw.clips)
            ? raw.clips
                .map((c): YoutubeVerticalClip => {
                const strArr = (k: string) => Array.isArray(c[k]) ? (c[k] as unknown[]).map(x => String(x)) : [];
                return {
                    start_sec: Number(c.start_sec),
                    end_sec: Number(c.end_sec),
                    title: String(c.title ?? '').trim(),
                    hook_overlay: String(c.hook_overlay ?? '').trim(),
                    why_stops_scroll: String(c.why_stops_scroll ?? '').trim(),
                    nine_sixteen_framing: String(c.nine_sixteen_framing ?? '').trim(),
                    safe_zones_caption: String(c.safe_zones_caption ?? '').trim(),
                    on_screen_text_suggestions: strArr('on_screen_text_suggestions'),
                    sound_hook: String(c.sound_hook ?? '').trim(),
                    cta_end: String(c.cta_end ?? '').trim(),
                    estimated_virality_1_10: Math.min(10, Math.max(1, Math.round(Number(c.estimated_virality_1_10) || 5))),
                    publish_description: String(c.publish_description ?? '').trim(),
                    suggested_hashtags: strArr('suggested_hashtags'),
                    best_platforms: strArr('best_platforms'),
                    thumbnail_cover_idea: String(c.thumbnail_cover_idea ?? '').trim(),
                    edit_checklist: strArr('edit_checklist'),
                    dynamic_caption_style: String(c.dynamic_caption_style ?? '').trim(),
                };
            })
                .filter(c => c.end_sec > c.start_sec && c.title.length > 0)
            : [];
        if (!clips.length)
            return { ok: false, reason: 'api_or_parse' };
        if (msg.stop_reason === 'max_tokens') {
            console.warn('[youtube-clips-claude] stop_reason=max_tokens', {
                tier,
                clipsParsed: clips.length,
                target: clipCount,
            });
        }
        let outClips = clips;
        if (outClips.length > clipCount) {
            outClips = outClips.slice(0, clipCount);
        }
        if (tier === 'pro' && outClips.length < clipCount && videoDurationSec >= 120) {
            console.warn('[youtube-clips-claude] Pro devolvió menos clips que el objetivo', {
                got: outClips.length,
                target: clipCount,
                durationSec: Math.round(videoDurationSec),
            });
        }
        return {
            ok: true,
            data: {
                video_title_hint: typeof raw.video_title_hint === 'string' ? raw.video_title_hint : undefined,
                clips: outClips,
            },
        };
    }
    catch (e) {
        console.error('[youtube-clips-claude]', e);
        return { ok: false, reason: 'api_or_parse' };
    }
}
