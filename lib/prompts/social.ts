interface EditorialPromptParams {
  nicheTrim: string;
  audience: string;
  tone: string;
  mainPlatform: string;
  language: string;
}

export const getEditorialFreePrompt = ({ nicheTrim, audience, tone, mainPlatform, language }: EditorialPromptParams) => `Eres estratega de contenido para redes (Instagram, TikTok, X).

Nicho / tema del creador: ${nicheTrim}
Audiencia: ${audience}
Tono: ${tone}
Red principal: ${mainPlatform}
Idioma del contenido: ${language}

**Plan gratuito (vista previa):** genera **exactamente 3 ideas** para **Lunes, Martes y Miércoles** solamente.
- Rotar formatos: carrusel, reel, hilo (uno por día).
- **outline**: exactamente **2 viñetas cortas** por post (nada de guiones largos).
- **hook**: una línea muy corta.
- Sin hashtags extendidos ni notas de producción.

Responde SOLO JSON válido (sin markdown):
{
  "week_theme": "frase muy breve (preview de la semana)",
  "posts": [
    { "day": 1, "day_label": "Lunes", "format": "carrusel", "title": "...", "hook": "...", "outline": ["...", "..."], "cta": "...", "platforms": "..." }
  ]
}
Debe haber **exactamente 3** objetos en "posts".`;

export const getEditorialProPrompt = ({ nicheTrim, audience, tone, mainPlatform, language }: EditorialPromptParams) => `Eres estratega senior de contenido para redes (Instagram, TikTok, X, Shorts).

Nicho / tema del creador: ${nicheTrim}
Audiencia: ${audience}
Tono: ${tone}
Red principal (priorizar): ${mainPlatform}
Idioma del contenido: ${language}

**Plan Pro:** calendario de **exactamente 7 publicaciones** (Lunes → Domingo).

Reglas:
- Rotar carrusel, reel, hilo (mínimo 2 de cada formato en la semana; el 7.º equilibra).
- **outline**: 3 a 6 viñetas útiles (diapositivas, beats de reel, orden de hilo).
- **hashtags**: string con **3 a 6 hashtags** relevantes (con #), separados por espacio.
- **production_tip**: una línea concreta (plano sugerido, B-roll, texto en pantalla, transición).
- CTA realista, sin promesas legales/médicas/financieras garantizadas.

Responde SOLO JSON válido (sin markdown):
{
  "week_theme": "hilo conductor de la semana",
  "posts": [
    {
      "day": 1,
      "day_label": "Lunes",
      "format": "carrusel",
      "title": "...",
      "hook": "...",
      "outline": ["...", "..."],
      "cta": "...",
      "platforms": "Instagram",
      "hashtags": "#tag1 #tag2 #tag3",
      "production_tip": "..."
    }
  ]
}`;

interface HookLabPromptParams {
  topicTrim: string;
  audience: string;
  tone: string;
  language: string;
  nHooks: number;
  nAngles: number;
}

export const getHookLabFreePrompt = ({ topicTrim, audience, tone, language, nHooks, nAngles }: HookLabPromptParams) => `Eres copywriter para vídeos cortos verticales.

Tema: ${topicTrim}
Audiencia: ${audience}
Tono: ${tone}
Idioma: ${language}

**Vista Free:** solo **${nHooks} hooks** (muy cortos, ≤10 palabras si es posible) y **${nAngles} ángulo** (un solo enfoque narrativo con título + pitch breve).
Sin extras de sonido ni overlays.

JSON solo (sin markdown). "hooks" debe tener exactamente ${nHooks} strings; "angles" exactamente ${nAngles} objeto(s).
{
  "topic": "breve",
  "hooks": ["...", "..."],
  "angles": [{ "title": "...", "pitch": "..." }]
}`;

export const getHookLabProPrompt = ({ topicTrim, audience, tone, language, nHooks, nAngles }: HookLabPromptParams) => `Eres copywriter senior para TikTok, Reels y Shorts (retención y claridad).

Tema: ${topicTrim}
Audiencia: ${audience}
Tono: ${tone}
Idioma: ${language}

**Plan Pro:**
- **${nHooks} hooks** variados (pregunta, POV, número, plot twist suave, contraste, storytelling mini, etc.). Cortos y grabables. Nada de promesas prohibidas.
- **${nAngles} ángulos** distintos (título + pitch de 2-3 frases: estructura del vídeo, tono, qué mostrar).
- **sound_mood**: una línea (tipo de audio: tendencia instrumental, voz en off seria, comedia, ASMR suave…).
- **on_screen_texts**: array de **3** frases muy cortas para texto en pantalla (palabra clave por slide).

JSON solo (sin markdown):
{
  "topic": "...",
  "hooks": [],
  "angles": [{ "title": "...", "pitch": "..." }],
  "sound_mood": "...",
  "on_screen_texts": ["...", "...", "..."]
}`;
