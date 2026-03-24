import Anthropic from '@anthropic-ai/sdk'
import type { JobResult, MarketStats } from './agent'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export type AnalyzedJob = JobResult & {
  relevance: 'alta' | 'media' | 'baja'
  reason:    string
  tip?:      string
}

export type AnalysisResult = {
  jobs:    AnalyzedJob[]
  summary: string
}

export async function analyzeJobs(
  jobs: JobResult[],
  userQuery: string
): Promise<AnalysisResult | null> {
  if (!process.env.ANTHROPIC_API_KEY || jobs.length === 0) return null

  const jobList = jobs.map((j, i) =>
    `${i + 1}. "${j.title}" en ${j.company || 'empresa desconocida'} (${j.location || 'ubicación no especificada'})`
  ).join('\n')

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Eres un asesor de carrera. El usuario busca: "${userQuery}".

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
- Devuelve un ranking para CADA oferta (${jobs.length} en total)
- summary: máximo 3 frases, en español`
      }]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const parsed = JSON.parse(text)

    const analyzedJobs: AnalyzedJob[] = jobs.map((job, i) => {
      const ranking = parsed.rankings?.find((r: { index: number }) => r.index === i + 1)
      return {
        ...job,
        relevance: ranking?.relevance || 'media',
        reason:    ranking?.reason || '',
        tip:       ranking?.tip || '',
      }
    })

    analyzedJobs.sort((a, b) => {
      const order = { alta: 0, media: 1, baja: 2 }
      return order[a.relevance] - order[b.relevance]
    })

    return {
      jobs:    analyzedJobs,
      summary: parsed.summary || '',
    }
  } catch (error) {
    console.error('[Claude] Error analyzing jobs:', error)
    return null
  }
}

export type MarketInsight = {
  trends:     string
  salaryRange: string
  topCities:  { city: string; demand: string }[]
  tip:        string
}

export async function generateMarketInsights(
  jobs: JobResult[],
  query: string,
  stats: MarketStats,
  location: string
): Promise<MarketInsight | null> {
  if (!process.env.ANTHROPIC_API_KEY || jobs.length === 0) return null

  const cityList = Object.entries(stats.cityDistribution)
    .sort(([, a], [, b]) => b - a)
    .map(([city, count]) => `${city}: ${count}`)
    .join(', ')

  const titles = jobs.map(j => j.title).join(', ')

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Eres un analista del mercado laboral español. El usuario busca "${query}" en "${location}".

Datos:
- Total aproximado en LinkedIn: ${stats.totalLinkedIn || 'desconocido'}
- Distribución por ciudad en resultados: ${cityList || 'no disponible'}
- Títulos encontrados: ${titles}

Responde SOLO con JSON válido (sin markdown):
{
  "trends": "1-2 frases sobre la tendencia actual de este sector (demanda, crecimiento, etc.)",
  "salaryRange": "Rango salarial estimado para este tipo de puesto en España (ej: '25.000â‚¬ - 40.000â‚¬/año')",
  "topCities": [
    { "city": "Madrid", "demand": "Alta" },
    { "city": "Barcelona", "demand": "Media" }
  ],
  "tip": "1 consejo práctico para el candidato (máx 20 palabras)"
}

Reglas: en español, datos realistas del mercado español 2025-2026, máximo 3 ciudades en topCities.`
      }]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    return JSON.parse(text) as MarketInsight
  } catch (error) {
    console.error('[Claude] Market insights error:', error)
    return null
  }
}
