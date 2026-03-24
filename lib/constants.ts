// employment scraping constants
export const SECTOR_KEYWORDS: Record<string, string[]> = {
    marketing: ['marketing', 'digital', 'seo', 'sem', 'social media', 'contenido', 'content', 'branding', 'publicidad', 'advertising', 'growth', 'crm', 'email', 'campañas', 'community'],
    diseño: ['diseño', 'design', 'ux', 'ui', 'figma', 'producto', 'product', 'creativo', 'creative', 'visual', 'gráfico', 'graphic'],
    desarrollo: ['developer', 'desarrollador', 'frontend', 'backend', 'fullstack', 'software', 'engineer', 'programador', 'react', 'node', 'python', 'java', 'typescript', 'devops'],
    ventas: ['ventas', 'sales', 'comercial', 'account', 'business development', 'sdr', 'bdr', 'ejecutivo de cuentas'],
    datos: ['data', 'datos', 'analytics', 'analyst', 'scientist', 'machine learning', 'ia', 'inteligencia artificial', 'bi', 'tableau', 'sql'],
    rrhh: ['recursos humanos', 'rrhh', 'hr', 'talent', 'talento', 'people', 'recruiting', 'reclutamiento'],
    finanzas: ['finanzas', 'finance', 'contabilidad', 'accounting', 'controller', 'tesorería', 'fiscal', 'auditor'],
    comunicacion: ['comunicación', 'communication', 'prensa', 'relaciones', 'pr', 'periodista', 'redactor', 'copywriter'],
};

export const WORK_TYPE_PARAM: Record<string, string> = {
    onsite: 'f_WT=1',
    remote: 'f_WT=2',
    hybrid: 'f_WT=3',
};

export const EXPERIENCE_PARAM: Record<string, string> = {
    internship: 'f_E=1',
    junior: 'f_E=2',
    mid: 'f_E=3',
    senior: 'f_E=4',
};

export const EXP_KEYWORDS: Record<string, string[]> = {
    internship: ['intern', 'internship', 'prácticas', 'becari', 'trainee', 'formación'],
    junior: ['junior', 'jr', 'entry', 'entry-level', 'graduate', 'asociado', 'trainee', 'coordinator', 'coordinador', 'assistant', 'asistente'],
    mid: [],
    senior: ['senior', 'sr', 'lead', 'principal', 'head', 'director', 'manager', 'jefe', 'responsable', 'chief'],
};

export const EXCLUDE_FOR_MID = [...EXP_KEYWORDS.internship, ...EXP_KEYWORDS.junior, ...EXP_KEYWORDS.senior];

// Video rendering limits
export const YOUTUBE_RENDER_MAX_CLIPS = 14;
export const YOUTUBE_RENDER_MIN_CLIP_SEC = 2;
export const YOUTUBE_RENDER_MAX_CLIP_SEC = 90;
export const YOUTUBE_RENDER_MAX_TOTAL_CLIP_SEC = 16 * 60;
export const YOUTUBE_RENDER_MAX_SOURCE_DURATION_SEC = 2 * 60 * 60;

// Storage and Session constants
export const YOUTUBE_RENDER_BUCKET = 'youtube-renders';
export const YOUTUBE_RENDER_TTL_DAYS = 2;
