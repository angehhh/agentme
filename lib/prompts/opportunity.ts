interface AnalyzeJobsParams {
  userQuery: string;
  jobList: string;
  numJobs: number;
}

export const getAnalyzeJobsPrompt = ({ userQuery, jobList, numJobs }: AnalyzeJobsParams) => `Eres un asesor de carrera. El usuario busca: "${userQuery}".

Estas son las ofertas encontradas:
${jobList}

Responde SOLO con JSON válido (sin markdown, sin backticks). El formato:
{
  "summary": "Un párrafo breve (2-3 frases) resumiendo las oportunidades encontradas y recomendación general",
  "rankings": [
    { "index": 1, "relevance": "alta", "reason": "Frase corta explicando por qué encaja", "tip": "Consejo específico para aplicar a esta oferta" },
    { "index": 2, "relevance": "media", "reason": "Frase corta", "tip": "Consejo específico" }
  ]
}

Reglas:
- relevance: "alta", "media" o "baja"
- reason: máximo 15 palabras, en español, directo
- tip: consejo personalizado para aplicar a esa oferta concreta (máx 25 palabras), ej: "Destaca tu experiencia con React y proyectos de e-commerce en tu CV"
- Devuelve un ranking para CADA oferta (${numJobs} en total)
- summary: máximo 3 frases, en español`;

interface MarketInsightsParams {
  query: string;
  location: string;
  totalLinkedIn: string | number;
  cityList: string;
  titles: string;
}

export const getMarketInsightsPrompt = ({ query, location, totalLinkedIn, cityList, titles }: MarketInsightsParams) => `Eres un analista del mercado laboral español. El usuario busca "${query}" en "${location}".

Datos:
- Total aproximado en LinkedIn: ${totalLinkedIn || 'desconocido'}
- Distribución por ciudad en resultados: ${cityList || 'no disponible'}
- Títulos encontrados: ${titles}

Responde SOLO con JSON válido (sin markdown):
{
  "trends": "1-2 frases sobre la tendencia actual de este sector (demanda, crecimiento, etc.)",
  "salaryRange": "Rango salarial estimado para este tipo de puesto en España (ej: '25.000€ - 40.000€/año')",
  "topCities": [
    { "city": "Madrid", "demand": "Alta" },
    { "city": "Barcelona", "demand": "Media" }
  ],
  "tip": "1 consejo práctico para el candidato (máx 20 palabras)"
}

Reglas: en español, datos realistas del mercado español 2025-2026, máximo 3 ciudades en topCities.`;
