/**
 * Etiquetas para usuarios finales (no exponer ids técnicos del pipeline).
 */
const HOOK_LAB: Record<string, string> = {
    ingest_brief: 'Preparar tu tema y preferencias',
    analyze_niche: 'Entender tu nicho y tu audiencia',
    viral_patterns: 'Ver qué formatos encajan en redes',
    script_ideas: 'Bosquejar ideas para el vídeo',
    hook_pack: 'Escribir tus ganchos y ángulos',
    verify: 'Comprobar que el resultado esté completo',
};

const EDITORIAL: Record<string, string> = {
    ingest_brief: 'Guardar tu nicho y tono',
    generate_calendar: 'Montar tu semana de publicaciones',
};

const OPPORTUNITY: Record<string, string> = {
    scrape: 'Buscar ofertas activas',
    discover_companies: 'Agrupar empresas detrás de las ofertas',
    filter_companies: 'Priorizar empresas que más encajan',
    enrich_ai: 'Ordenar ofertas y resumir el mercado',
    outreach: 'Preparar borradores de mensajes',
    verify: 'Revisar que los datos tengan sentido',
};

export function labelsForHookLabSteps(stepIds: string[]): string[] {
    return stepIds.map(id => HOOK_LAB[id] ?? 'Un paso del asistente');
}

export function labelsForEditorialSteps(stepIds: string[]): string[] {
    return stepIds.map(id => EDITORIAL[id] ?? 'Un paso del asistente');
}

export function labelsForOpportunitySteps(stepIds: string[]): string[] {
    return stepIds.map(id => OPPORTUNITY[id] ?? 'Un paso del asistente');
}
