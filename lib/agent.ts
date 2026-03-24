import { chromium, Browser, Page } from 'playwright';
export type JobResult = {
    title: string;
    company: string;
    location: string;
    url: string;
    posted: string;
};
export type MarketStats = {
    totalLinkedIn: number;
    cityDistribution: Record<string, number>;
};
export type AgentResult = {
    success: boolean;
    jobs: JobResult[];
    total: number;
    expandedSearch: boolean;
    searchedIn: string;
    marketStats: MarketStats;
    error?: string;
};
const SECTOR_KEYWORDS: Record<string, string[]> = {
    marketing: ['marketing', 'digital', 'seo', 'sem', 'social media', 'contenido', 'content', 'branding', 'publicidad', 'advertising', 'growth', 'crm', 'email', 'campañas', 'community'],
    diseño: ['diseño', 'design', 'ux', 'ui', 'figma', 'producto', 'product', 'creativo', 'creative', 'visual', 'gráfico', 'graphic'],
    desarrollo: ['developer', 'desarrollador', 'frontend', 'backend', 'fullstack', 'software', 'engineer', 'programador', 'react', 'node', 'python', 'java', 'typescript', 'devops'],
    ventas: ['ventas', 'sales', 'comercial', 'account', 'business development', 'sdr', 'bdr', 'ejecutivo de cuentas'],
    datos: ['data', 'datos', 'analytics', 'analyst', 'scientist', 'machine learning', 'ia', 'inteligencia artificial', 'bi', 'tableau', 'sql'],
    rrhh: ['recursos humanos', 'rrhh', 'hr', 'talent', 'talento', 'people', 'recruiting', 'reclutamiento'],
    finanzas: ['finanzas', 'finance', 'contabilidad', 'accounting', 'controller', 'tesorería', 'fiscal', 'auditor'],
    comunicacion: ['comunicación', 'communication', 'prensa', 'relaciones', 'pr', 'periodista', 'redactor', 'copywriter'],
};
function getRelevantKeywords(query: string): string[] {
    const q = query.toLowerCase();
    for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
        if (q.includes(sector) || keywords.some(k => q.includes(k)))
            return keywords;
    }
    return q.split(/\s+/).filter(w => w.length > 2);
}
function isRelevant(title: string, query: string): boolean {
    const t = title.toLowerCase();
    const q = query.toLowerCase();
    if (q.split(/\s+/).filter(w => w.length > 2).some(w => t.includes(w)))
        return true;
    if (getRelevantKeywords(query).some(k => t.includes(k)))
        return true;
    return false;
}
type ScrapeResult = {
    jobs: JobResult[];
    totalLinkedIn: number;
};
async function scrapeUrl(page: Page, url: string, limit: number): Promise<ScrapeResult> {
    console.log(`[Agent] Navegando a: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const data = await page.evaluate((maxJobs: number) => {
        const results: {
            title: string;
            company: string;
            location: string;
            url: string;
            posted: string;
        }[] = [];
        const cards = document.querySelectorAll('.jobs-search__results-list li, .base-card, [data-entity-urn]');
        cards.forEach((card, i) => {
            if (i >= maxJobs)
                return;
            const titleEl = card.querySelector('.base-search-card__title, h3');
            const companyEl = card.querySelector('.base-search-card__subtitle, h4');
            const linkEl = card.querySelector('a[href*="/jobs/"]') as HTMLAnchorElement;
            const postedEl = card.querySelector('time, .job-search-card__listdate');
            const locationEl = (card.querySelector('.job-search-card__location') ||
                card.querySelector('[class*="job-search-card__location"]') ||
                card.querySelector('.base-search-card__metadata span') ||
                card.querySelector('[class*="location"]'));
            const title = titleEl?.textContent?.trim() || '';
            const company = companyEl?.textContent?.trim() || '';
            const rawLoc = locationEl?.textContent?.trim() || '';
            const location = rawLoc.split('\n')[0].trim();
            const url = linkEl?.href || '';
            const posted = postedEl?.getAttribute('datetime') || postedEl?.textContent?.trim() || 'Reciente';
            if (title && url)
                results.push({ title, company, location, url, posted });
        });
        let totalLinkedIn = 0;
        const countEl = document.querySelector('.results-context-header__job-count, .jobs-search-results-list__title-heading .results-context-header span');
        if (countEl) {
            const num = countEl.textContent?.replace(/[^\d]/g, '');
            totalLinkedIn = num ? parseInt(num, 10) : 0;
        }
        if (!totalLinkedIn) {
            const headings = document.querySelectorAll('h1, h2, .results-context-header');
            for (const h of headings) {
                const match = h.textContent?.match(/([\d,.]+)\s*(result|oferta|empleo|job)/i);
                if (match) {
                    totalLinkedIn = parseInt(match[1].replace(/[,.]/g, ''), 10);
                    break;
                }
            }
        }
        const jobs = results.filter((job, i, self) => i === self.findIndex(j => j.url === job.url));
        return { jobs, totalLinkedIn };
    }, limit) as {
        jobs: JobResult[];
        totalLinkedIn: number;
    };
    return data;
}
export type SearchFilters = {
    workType?: string | null;
    experience?: string | null;
};
const WORK_TYPE_PARAM: Record<string, string> = {
    onsite: 'f_WT=1',
    remote: 'f_WT=2',
    hybrid: 'f_WT=3',
};
const EXPERIENCE_PARAM: Record<string, string> = {
    internship: 'f_E=1',
    junior: 'f_E=2',
    mid: 'f_E=3',
    senior: 'f_E=4',
};
const EXP_KEYWORDS: Record<string, string[]> = {
    internship: ['intern', 'internship', 'prácticas', 'becari', 'trainee', 'formación'],
    junior: ['junior', 'jr', 'entry', 'entry-level', 'graduate', 'asociado', 'trainee', 'coordinator', 'coordinador', 'assistant', 'asistente'],
    mid: [],
    senior: ['senior', 'sr', 'lead', 'principal', 'head', 'director', 'manager', 'jefe', 'responsable', 'chief'],
};
const EXCLUDE_FOR_MID = [...EXP_KEYWORDS.internship, ...EXP_KEYWORDS.junior, ...EXP_KEYWORDS.senior];
function matchesExperience(title: string, level: string): boolean {
    const t = title.toLowerCase();
    if (level === 'mid') {
        return !EXCLUDE_FOR_MID.some(kw => t.includes(kw));
    }
    const keywords = EXP_KEYWORDS[level];
    return keywords ? keywords.some(kw => t.includes(kw)) : true;
}
function buildFilterParams(filters: SearchFilters): string {
    const parts: string[] = [];
    if (filters.workType && WORK_TYPE_PARAM[filters.workType]) {
        parts.push(WORK_TYPE_PARAM[filters.workType]);
    }
    if (filters.experience && EXPERIENCE_PARAM[filters.experience]) {
        parts.push(EXPERIENCE_PARAM[filters.experience]);
    }
    return parts.length > 0 ? '&' + parts.join('&') : '';
}
export async function scrapeLinkedInJobs(query: string, location: string = 'Spain', limit: number = 15, filters: SearchFilters = {}): Promise<AgentResult> {
    let browser: Browser | null = null;
    const filterParams = buildFilterParams(filters);
    try {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'],
        });
        const page: Page = await browser.newPage();
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'es-ES,es;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Upgrade-Insecure-Requests': '1',
        });
        const isWide = ['spain', 'españa', 'europe', 'europa', 'remote', 'worldwide'].includes(location.toLowerCase().trim());
        let expandedSearch = false;
        let searchedIn = location;
        const url1 = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&f_TPR=r604800&sortBy=DD${filterParams}`;
        let scrape = await scrapeUrl(page, url1, limit);
        let raw = scrape.jobs;
        let totalLinkedIn = scrape.totalLinkedIn;
        let relevant = raw.filter(j => isRelevant(j.title, query));
        console.log(`[Agent] Intento 1 → ${raw.length} brutas, ${relevant.length} relevantes, ~${totalLinkedIn} en LinkedIn`);
        if (relevant.length < 3 && !isWide) {
            console.log(`[Agent] Pocos resultados en "${location}", buscando en España...`);
            const url2 = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(query)}&location=Spain&f_TPR=r604800&sortBy=DD${filterParams}`;
            scrape = await scrapeUrl(page, url2, limit);
            raw = scrape.jobs;
            if (scrape.totalLinkedIn > totalLinkedIn)
                totalLinkedIn = scrape.totalLinkedIn;
            relevant = raw.filter(j => isRelevant(j.title, query));
            expandedSearch = true;
            searchedIn = 'España';
            console.log(`[Agent] Intento 2 (España) → ${raw.length} brutas, ${relevant.length} relevantes`);
        }
        if (relevant.length < 3) {
            console.log(`[Agent] Aún pocos resultados, buscando sin límite de tiempo...`);
            const url3 = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(isWide ? location : 'Spain')}&sortBy=DD${filterParams}`;
            scrape = await scrapeUrl(page, url3, limit);
            raw = scrape.jobs;
            if (scrape.totalLinkedIn > totalLinkedIn)
                totalLinkedIn = scrape.totalLinkedIn;
            relevant = raw.filter(j => isRelevant(j.title, query));
            if (!isWide) {
                expandedSearch = true;
                searchedIn = 'España';
            }
            console.log(`[Agent] Intento 3 (sin tiempo) → ${raw.length} brutas, ${relevant.length} relevantes`);
        }
        let pool = relevant.length > 0 ? relevant : raw;
        if (filters.experience && EXP_KEYWORDS[filters.experience]) {
            const matched = pool.filter(j => matchesExperience(j.title, filters.experience!));
            const unmatched = pool.filter(j => !matchesExperience(j.title, filters.experience!));
            pool = [...matched, ...unmatched];
            console.log(`[Agent] Filtro experiencia "${filters.experience}" → ${matched.length} coinciden, ${unmatched.length} resto`);
        }
        const finalJobs = pool.slice(0, 10);
        console.log(`[Agent] ✓ ${finalJobs.length} ofertas finales para "${query}"`);
        const cityDistribution: Record<string, number> = {};
        for (const job of finalJobs) {
            const city = job.location?.split(',')[0]?.trim() || 'Sin ubicación';
            cityDistribution[city] = (cityDistribution[city] || 0) + 1;
        }
        return {
            success: true,
            jobs: finalJobs,
            total: finalJobs.length,
            expandedSearch,
            searchedIn,
            marketStats: { totalLinkedIn, cityDistribution },
        };
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        console.error('[Agent] Error:', msg);
        return { success: false, jobs: [], total: 0, expandedSearch: false, searchedIn: location, marketStats: { totalLinkedIn: 0, cityDistribution: {} }, error: msg };
    }
    finally {
        if (browser)
            await browser.close();
    }
}
export async function scrapePage(url: string): Promise<{
    title: string;
    text: string;
    links: string[];
    success: boolean;
    error?: string;
}> {
    let browser: Browser | null = null;
    try {
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
        const data = await page.evaluate(() => ({
            title: document.title || '',
            text: document.body?.innerText?.slice(0, 3000) || '',
            links: Array.from(document.querySelectorAll('a[href]'))
                .map(a => (a as HTMLAnchorElement).href)
                .filter(h => h.startsWith('http'))
                .slice(0, 20),
        }));
        return { ...data, success: true };
    }
    catch (error) {
        return { title: '', text: '', links: [], success: false, error: error instanceof Error ? error.message : 'Error' };
    }
    finally {
        if (browser)
            await browser.close();
    }
}
