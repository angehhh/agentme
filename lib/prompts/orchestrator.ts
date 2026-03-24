export function getOpportunityPlannerPrompt(params: { goal: string; location: string; allowedStepIds: string[] }): string {
    const allowed = params.allowedStepIds.join(', ');
    return `Eres el planificador de un agente de búsqueda de oportunidades laborales (LinkedIn + empresas + IA + outreach).

Objetivo del usuario: "${params.goal}"
Ubicación preferida: "${params.location}"

Pasos permitidos (ids exactos, en minúsculas): ${allowed}

Responde SOLO con JSON válido (sin markdown, sin backticks):
{
  "steps": ["id1", "id2"],
  "rationale": "Una frase en español sobre por qué este orden"
}

Reglas:
- "scrape" es siempre el primer paso lógico para traer ofertas.
- Orden típico completo: scrape → discover_companies → filter_companies → enrich_ai → outreach → verify.
- "discover_companies" agrupa y enriquece empresas a partir de las ofertas (no sustituye al scrape).
- "filter_companies" clasifica empresas por encaje con el objetivo del usuario.
- "enrich_ai" rankea ofertas e insights de mercado (en planes free el ejecutor lo omite).
- "outreach" genera borradores de mensajes (en free el ejecutor lo omite).
- "verify" va al final como comprobación.
- Usa solo ids de la lista permitida, sin repetir.`;
}
