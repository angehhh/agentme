type TipEntry = { keywords: string[]; tip: string }

const KEYWORD_TIPS: TipEntry[] = [
  // TecnologÃ­as frontend
  { keywords: ['react', 'reactjs', 'react.js'],           tip: 'Esta oferta pide React â€” asegÃºrate de mencionarlo en tu CV y destaca proyectos concretos.' },
  { keywords: ['angular'],                                 tip: 'Angular es clave aquÃ­ â€” incluye tu experiencia con versiones especÃ­ficas (Angular 14+, etc.).' },
  { keywords: ['vue', 'vuejs', 'vue.js'],                 tip: 'Vue.js es requisito â€” menciona si has trabajado con Vuex, Pinia o Nuxt.' },
  { keywords: ['next', 'nextjs', 'next.js'],              tip: 'Next.js es importante â€” destaca experiencia con SSR, App Router o despliegues en Vercel.' },
  { keywords: ['typescript', 'ts'],                        tip: 'TypeScript es demandado â€” muestra que sabes tipado estricto, no solo "any" en todo.' },
  { keywords: ['javascript', 'js'],                        tip: 'JavaScript es la base â€” destaca tu nivel (ES6+, async/await, closures).' },
  { keywords: ['html', 'css', 'tailwind', 'sass'],        tip: 'MaquetaciÃ³n es parte del puesto â€” menciona responsive design y frameworks CSS que uses.' },

  // Backend
  { keywords: ['node', 'nodejs', 'node.js', 'express'],   tip: 'Node.js es clave â€” menciona APIs REST que hayas construido y herramientas como Express o Fastify.' },
  { keywords: ['python', 'django', 'flask', 'fastapi'],   tip: 'Python es requisito â€” destaca librerÃ­as y frameworks especÃ­ficos que domines.' },
  { keywords: ['java', 'spring'],                          tip: 'Java/Spring es central aquÃ­ â€” incluye experiencia con microservicios y versiones de Java.' },
  { keywords: ['.net', 'c#', 'csharp'],                   tip: 'El stack .NET es importante â€” menciona si trabajas con .NET Core, Blazor o Azure.' },
  { keywords: ['php', 'laravel', 'symfony'],               tip: 'PHP es parte del stack â€” destaca frameworks modernos (Laravel 10+, Symfony) y no solo WordPress.' },
  { keywords: ['go', 'golang'],                            tip: 'Go es valorado â€” menciona tu experiencia con concurrencia y servicios de alto rendimiento.' },
  { keywords: ['ruby', 'rails'],                           tip: 'Ruby on Rails sigue siendo demandado â€” destaca tu experiencia con versiones recientes.' },

  // Datos
  { keywords: ['sql', 'mysql', 'postgresql', 'postgres'], tip: 'SQL es requisito â€” incluye quÃ© bases de datos manejas y consultas complejas que hayas optimizado.' },
  { keywords: ['mongodb', 'nosql', 'dynamodb'],           tip: 'Bases de datos NoSQL son importantes â€” explica cuÃ¡ndo y por quÃ© las elegiste en proyectos.' },
  { keywords: ['data', 'datos', 'analytics', 'analyst'],  tip: 'El perfil analÃ­tico es clave â€” destaca herramientas (Excel avanzado, SQL, Python) y mÃ©tricas que hayas movido.' },
  { keywords: ['power bi', 'tableau', 'looker'],          tip: 'VisualizaciÃ³n de datos es central â€” incluye dashboards que hayas creado y decisiones que impactaron.' },
  { keywords: ['machine learning', 'ml', 'ia', 'ai'],     tip: 'IA/ML es el foco â€” menciona modelos que hayas entrenado, datasets y resultados medibles.' },

  // Cloud & DevOps
  { keywords: ['aws', 'amazon web services'],              tip: 'AWS es requisito â€” menciona servicios especÃ­ficos (EC2, Lambda, S3) y certificaciones si las tienes.' },
  { keywords: ['azure', 'microsoft azure'],                tip: 'Azure es clave â€” destaca servicios que domines y certificaciones AZ-900 o superiores.' },
  { keywords: ['gcp', 'google cloud'],                     tip: 'Google Cloud es valorado â€” incluye BigQuery, GKE u otros servicios que hayas usado.' },
  { keywords: ['docker', 'kubernetes', 'k8s'],             tip: 'ContainerizaciÃ³n es importante â€” describe cÃ³mo has usado Docker/K8s en entornos reales.' },
  { keywords: ['devops', 'ci/cd', 'cicd'],                 tip: 'DevOps es parte del rol â€” menciona pipelines CI/CD, herramientas (Jenkins, GitHub Actions) y automatizaciones.' },

  // Marketing & ComunicaciÃ³n
  { keywords: ['marketing', 'digital marketing'],          tip: 'Incluye mÃ©tricas concretas: CPC, CTR, ROAS. Los nÃºmeros hablan mÃ¡s que las descripciones.' },
  { keywords: ['seo'],                                     tip: 'SEO es clave â€” menciona herramientas (Ahrefs, Semrush, Search Console) y mejoras de trÃ¡fico que hayas logrado.' },
  { keywords: ['sem', 'google ads', 'ppc'],                tip: 'SEM/PPC es central â€” incluye presupuestos gestionados, ROAS y campaÃ±as exitosas con cifras.' },
  { keywords: ['social media', 'redes sociales', 'community'], tip: 'Redes sociales: incluye mÃ©tricas de crecimiento, engagement rate y campaÃ±as concretas.' },
  { keywords: ['content', 'contenido', 'copywriting', 'copy', 'redactor'], tip: 'Contenido es protagonista â€” adjunta portfolio o links a piezas publicadas si puedes.' },
  { keywords: ['email marketing', 'crm', 'hubspot', 'mailchimp'], tip: 'CRM/Email es requisito â€” menciona tasas de apertura, segmentaciÃ³n y automatizaciones que hayas implementado.' },
  { keywords: ['branding', 'marca'],                       tip: 'Branding es el foco â€” incluye proyectos de identidad visual o reposicionamiento con resultados.' },

  // DiseÃ±o
  { keywords: ['figma'],                                   tip: 'Figma es la herramienta principal â€” destaca tu dominio de componentes, auto-layout y design systems.' },
  { keywords: ['ux', 'user experience', 'experiencia de usuario'], tip: 'UX es central â€” menciona metodologÃ­as (design thinking, user testing) y cÃ³mo mejoraste mÃ©tricas.' },
  { keywords: ['ui', 'user interface', 'interfaz'],        tip: 'UI es importante â€” incluye tu portfolio con diseÃ±os responsive y sistemas de diseÃ±o.' },
  { keywords: ['diseÃ±o', 'design', 'creativo', 'creative'], tip: 'DiseÃ±o es clave â€” enlaza tu portfolio y destaca herramientas (Figma, Photoshop, Illustrator).' },

  // Ventas & Negocio
  { keywords: ['ventas', 'sales', 'comercial'],            tip: 'Ventas es el puesto â€” incluye cifras: cuota alcanzada, % sobre objetivo, cartera de clientes.' },
  { keywords: ['account', 'cuentas'],                      tip: 'GestiÃ³n de cuentas: destaca retenciÃ³n de clientes, upselling y relaciones a largo plazo.' },
  { keywords: ['business development', 'bdr', 'sdr'],      tip: 'Desarrollo de negocio â€” incluye pipeline generado, meetings agendados y conversiÃ³n.' },

  // RRHH & People
  { keywords: ['recursos humanos', 'rrhh', 'hr', 'people'], tip: 'RRHH es el Ã¡rea â€” menciona procesos de selecciÃ³n gestionados, onboarding y retenciÃ³n.' },
  { keywords: ['recruiting', 'reclutamiento', 'talent', 'talento'], tip: 'Reclutamiento: incluye volumen de contrataciones, time-to-hire y herramientas ATS que uses.' },

  // Finanzas
  { keywords: ['finanzas', 'finance', 'controller'],       tip: 'Finanzas: menciona reporting, forecasting y herramientas (SAP, Oracle, Excel avanzado).' },
  { keywords: ['contabilidad', 'accounting', 'auditor'],   tip: 'Contabilidad: destaca normativa que domines (PGC, NIIF/IFRS) y software contable.' },

  // GestiÃ³n & liderazgo
  { keywords: ['project manager', 'pm', 'gestiÃ³n de proyectos'], tip: 'GestiÃ³n de proyectos â€” menciona metodologÃ­a (Agile, Scrum, Waterfall) y herramientas (Jira, Asana).' },
  { keywords: ['product', 'producto'],                     tip: 'Producto es el foco â€” incluye mÃ©tricas de impacto, roadmaps liderados y metodologÃ­as de discovery.' },
  { keywords: ['scrum', 'agile', 'agil'],                  tip: 'MetodologÃ­as Ã¡giles son clave â€” menciona certificaciones (PSM, SAFe) y equipos que hayas liderado.' },
  { keywords: ['manager', 'director', 'lead', 'jefe', 'responsable'], tip: 'Liderazgo es esperado â€” incluye tamaÃ±o de equipos gestionados y logros medibles del equipo.' },

  // Nivel de experiencia
  { keywords: ['junior', 'jr', 'entry'],                   tip: 'Para puestos junior: destaca formaciÃ³n, proyectos personales, ganas de aprender y actitud proactiva.' },
  { keywords: ['senior', 'sr', 'lead', 'principal'],       tip: 'Para puestos senior: enfÃ³cate en impacto, mentoring a juniors y decisiones tÃ©cnicas/estratÃ©gicas.' },
  { keywords: ['intern', 'prÃ¡cticas', 'becario', 'beca'],  tip: 'Para prÃ¡cticas: tu motivaciÃ³n y proyectos acadÃ©micos/personales pesan mÃ¡s que la experiencia laboral.' },

  // Idiomas
  { keywords: ['inglÃ©s', 'english', 'ingles'],             tip: 'El inglÃ©s es requisito â€” indica tu nivel real (B2, C1) y si has trabajado en entornos internacionales.' },
  { keywords: ['alemÃ¡n', 'german', 'deutsch'],             tip: 'AlemÃ¡n requerido â€” especifica tu nivel y cualquier certificaciÃ³n (Goethe, TestDaF).' },
  { keywords: ['francÃ©s', 'french', 'franÃ§ais'],           tip: 'FrancÃ©s es valorado â€” indica tu nivel y experiencia en entornos francÃ³fonos.' },
]

export function generateTips(title: string): string[] {
  const t = title.toLowerCase()
  const tips: string[] = []

  for (const entry of KEYWORD_TIPS) {
    if (entry.keywords.some(kw => t.includes(kw))) {
      tips.push(entry.tip)
      if (tips.length >= 2) break
    }
  }

  return tips
}
