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
  strategyBlock?: string;
}

export const getHookLabFreePrompt = ({ topicTrim, audience, tone, language, nHooks, nAngles, strategyBlock }: HookLabPromptParams) => `Eres copywriter para vídeos cortos verticales.

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
}${strategyBlock ? `\n\n---\n${strategyBlock}` : ''}`;

export const getHookLabProPrompt = ({ topicTrim, audience, tone, language, nHooks, nAngles, strategyBlock }: HookLabPromptParams) => `Eres copywriter senior para TikTok, Reels y Shorts (retención y claridad).

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
}${strategyBlock ? `\n\n---\n${strategyBlock}` : ''}`;

export type HookLabStrategyAppendixParams = {
    nicheAnalysis?: string;
    viralLines?: string;
    scriptLines?: string;
};

export function buildHookLabStrategyAppendix(p: HookLabStrategyAppendixParams): string | undefined {
    const parts: string[] = [];
    if (p.nicheAnalysis?.trim())
        parts.push(`### Análisis de nicho\n${p.nicheAnalysis.trim()}`);
    if (p.viralLines?.trim())
        parts.push(`### Patrones virales detectados\n${p.viralLines.trim()}`);
    if (p.scriptLines?.trim())
        parts.push(`### Ideas de guion (beats)\n${p.scriptLines.trim()}`);
    if (parts.length === 0)
        return undefined;
    return `${parts.join('\n\n')}\n\nAlinea hooks, ángulos y textos en pantalla con este contexto cuando encaje.`;
}

interface SocialPipelineNicheParams {
    topicTrim: string;
    audience: string;
    tone: string;
    language: string;
}

export const getSocialAnalyzeNichePrompt = ({ topicTrim, audience, tone, language }: SocialPipelineNicheParams) => `Eres estratega de contenido. Analiza el nicho/tema del creador para vídeos cortos.

Tema: ${topicTrim}
Audiencia declarada: ${audience}
Tono: ${tone}
Idioma: ${language}

Responde SOLO JSON válido (sin markdown):
{
  "summary": "2-3 frases: qué problema u oportunidad ve el público en este tema",
  "keywords": ["3-6 palabras clave o frases cortas"],
  "audience_insight": "1 frase sobre motivación o objeción típica de la audiencia"
}`;

interface SocialPipelineViralParams {
    topicTrim: string;
    nicheSummary: string;
    keywordsLine: string;
}

export const getSocialViralPatternsPrompt = ({ topicTrim, nicheSummary, keywordsLine }: SocialPipelineViralParams) => `Eres experto en formatos virales en TikTok, Reels y Shorts.

Tema: ${topicTrim}
Resumen de nicho: ${nicheSummary}
Palabras clave: ${keywordsLine}

Responde SOLO JSON válido (sin markdown):
{
  "patterns": [
    "5-8 patrones concretos (ej. 'POV + twist en 3s', 'lista numerada en pantalla', 'contradicción + prueba') aplicables a ESTE tema"
  ]
}`;

interface SocialPipelineScriptsParams {
    topicTrim: string;
    nicheSummary: string;
    patternsBlock: string;
}

export const getSocialScriptIdeasPrompt = ({ topicTrim, nicheSummary, patternsBlock }: SocialPipelineScriptsParams) => `Eres guionista de vídeos cortos verticales.

Tema: ${topicTrim}
Nicho: ${nicheSummary}
Patrones a aprovechar:
${patternsBlock}

Responde SOLO JSON válido (sin markdown):
{
  "ideas": [
    "4-6 ideas de guion en UNA línea cada una (gancho + desarrollo + cierre sugerido, muy breve)"
  ]
}`;
