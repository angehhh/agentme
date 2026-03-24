interface VideoContentParams {
  language: string;
  nicheLine: string;
  truncated: boolean;
  transcript: string;
  counts: {
    takeaways: number;
    hooks: number;
    thread: number;
    hashtags: number;
    cta: number;
    quotes: number;
  };
}

export const getVideoContentPrompt = ({ language, nicheLine, truncated, transcript, counts }: VideoContentParams) => `Eres editor de redes y copywriter. A partir de la TRANSCRIPCIÓN de un vídeo (lo dicho en voz), genera material listo para publicar.

Idioma de salida: ${language}
${nicheLine}
${truncated ? 'NOTA: la transcripción está truncada por longitud; infiere con prudencia lo que falte.' : ''}

TRANSCRIPCIÓN:
---
${transcript}
---

Responde SOLO con JSON válido (sin markdown):
{
  "summary": "2-4 frases: de qué va el vídeo y por qué importa",
  "key_takeaways": ["punto 1", ...],
  "hook_suggestions": ["gancho corto 1", ...],
  "caption_short": "una línea tipo TikTok/IG (máx ~200 caracteres)",
  "caption_long": "párrafo para IG/LinkedIn con saltos de línea \\n donde tenga sentido",
  "thread_outline": ["tweet/hilo 1", "2", ...],
  "hashtags": ["#tema", ...] sin repetir,
  "cta_ideas": ["CTA 1", ...],
  "quote_cards": ["frase corta citable 1", ...]
}

Reglas estrictas:
- Todos los textos en el idioma indicado.
- key_takeaways: exactamente ${counts.takeaways} ítems, muy concretos.
- hook_suggestions: exactamente ${counts.hooks} ítems; primera persona o imperativo; para vídeo corto vertical.
- thread_outline: exactamente ${counts.thread} ítems; cada uno autónomo (orden narrativo).
- hashtags: exactamente ${counts.hashtags} ítems; relevantes al contenido; formato #palabra o #varias_palabras.
- cta_ideas: exactamente ${counts.cta} ítems.
- quote_cards: exactamente ${counts.quotes} ítems; memorables, sin comillas externas en el string.`;

interface YoutubeClipsParams {
  titleLine: string;
  videoDurationSec: number;
  language: string;
  timedTranscript: string;
  clipCount: number;
}

export const getYoutubeClipsPrompt = ({ titleLine, videoDurationSec, language, timedTranscript, clipCount }: YoutubeClipsParams) => `Eres el motor creativo de una herramienta para CREADORES DE CONTENIDO (estilo OpusClip): conviertes un vídeo largo de YouTube en varios SHORTS VERTICALES 9:16 listos para publicar (TikTok, Instagram Reels, YouTube Shorts).

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
