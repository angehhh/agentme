type TipEntry = { keywords: string[]; tip: string }

const KEYWORD_TIPS: TipEntry[] = [
  // Tecnologías frontend
  { keywords: ['react', 'reactjs', 'react.js'],           tip: 'Esta oferta pide React — asegúrate de mencionarlo en tu CV y destaca proyectos concretos.' },
  { keywords: ['angular'],                                 tip: 'Angular es clave aquí — incluye tu experiencia con versiones específicas (Angular 14+, etc.).' },
  { keywords: ['vue', 'vuejs', 'vue.js'],                 tip: 'Vue.js es requisito — menciona si has trabajado con Vuex, Pinia o Nuxt.' },
  { keywords: ['next', 'nextjs', 'next.js'],              tip: 'Next.js es importante — destaca experiencia con SSR, App Router o despliegues en Vercel.' },
  { keywords: ['typescript', 'ts'],                        tip: 'TypeScript es demandado — muestra que sabes tipado estricto, no solo "any" en todo.' },
  { keywords: ['javascript', 'js'],                        tip: 'JavaScript es la base — destaca tu nivel (ES6+, async/await, closures).' },
  { keywords: ['html', 'css', 'tailwind', 'sass'],        tip: 'Maquetación es parte del puesto — menciona responsive design y frameworks CSS que uses.' },

  // Backend
  { keywords: ['node', 'nodejs', 'node.js', 'express'],   tip: 'Node.js es clave — menciona APIs REST que hayas construido y herramientas como Express o Fastify.' },
  { keywords: ['python', 'django', 'flask', 'fastapi'],   tip: 'Python es requisito — destaca librerías y frameworks específicos que domines.' },
  { keywords: ['java', 'spring'],                          tip: 'Java/Spring es central aquí — incluye experiencia con microservicios y versiones de Java.' },
  { keywords: ['.net', 'c#', 'csharp'],                   tip: 'El stack .NET es importante — menciona si trabajas con .NET Core, Blazor o Azure.' },
  { keywords: ['php', 'laravel', 'symfony'],               tip: 'PHP es parte del stack — destaca frameworks modernos (Laravel 10+, Symfony) y no solo WordPress.' },
  { keywords: ['go', 'golang'],                            tip: 'Go es valorado — menciona tu experiencia con concurrencia y servicios de alto rendimiento.' },
  { keywords: ['ruby', 'rails'],                           tip: 'Ruby on Rails sigue siendo demandado — destaca tu experiencia con versiones recientes.' },

  // Datos
  { keywords: ['sql', 'mysql', 'postgresql', 'postgres'], tip: 'SQL es requisito — incluye qué bases de datos manejas y consultas complejas que hayas optimizado.' },
  { keywords: ['mongodb', 'nosql', 'dynamodb'],           tip: 'Bases de datos NoSQL son importantes — explica cuándo y por qué las elegiste en proyectos.' },
  { keywords: ['data', 'datos', 'analytics', 'analyst'],  tip: 'El perfil analítico es clave — destaca herramientas (Excel avanzado, SQL, Python) y métricas que hayas movido.' },
  { keywords: ['power bi', 'tableau', 'looker'],          tip: 'Visualización de datos es central — incluye dashboards que hayas creado y decisiones que impactaron.' },
  { keywords: ['machine learning', 'ml', 'ia', 'ai'],     tip: 'IA/ML es el foco — menciona modelos que hayas entrenado, datasets y resultados medibles.' },

  // Cloud & DevOps
  { keywords: ['aws', 'amazon web services'],              tip: 'AWS es requisito — menciona servicios específicos (EC2, Lambda, S3) y certificaciones si las tienes.' },
  { keywords: ['azure', 'microsoft azure'],                tip: 'Azure es clave — destaca servicios que domines y certificaciones AZ-900 o superiores.' },
  { keywords: ['gcp', 'google cloud'],                     tip: 'Google Cloud es valorado — incluye BigQuery, GKE u otros servicios que hayas usado.' },
  { keywords: ['docker', 'kubernetes', 'k8s'],             tip: 'Containerización es importante — describe cómo has usado Docker/K8s en entornos reales.' },
  { keywords: ['devops', 'ci/cd', 'cicd'],                 tip: 'DevOps es parte del rol — menciona pipelines CI/CD, herramientas (Jenkins, GitHub Actions) y automatizaciones.' },

  // Marketing & Comunicación
  { keywords: ['marketing', 'digital marketing'],          tip: 'Incluye métricas concretas: CPC, CTR, ROAS. Los números hablan más que las descripciones.' },
  { keywords: ['seo'],                                     tip: 'SEO es clave — menciona herramientas (Ahrefs, Semrush, Search Console) y mejoras de tráfico que hayas logrado.' },
  { keywords: ['sem', 'google ads', 'ppc'],                tip: 'SEM/PPC es central — incluye presupuestos gestionados, ROAS y campañas exitosas con cifras.' },
  { keywords: ['social media', 'redes sociales', 'community'], tip: 'Redes sociales: incluye métricas de crecimiento, engagement rate y campañas concretas.' },
  { keywords: ['content', 'contenido', 'copywriting', 'copy', 'redactor'], tip: 'Contenido es protagonista — adjunta portfolio o links a piezas publicadas si puedes.' },
  { keywords: ['email marketing', 'crm', 'hubspot', 'mailchimp'], tip: 'CRM/Email es requisito — menciona tasas de apertura, segmentación y automatizaciones que hayas implementado.' },
  { keywords: ['branding', 'marca'],                       tip: 'Branding es el foco — incluye proyectos de identidad visual o reposicionamiento con resultados.' },

  // Diseño
  { keywords: ['figma'],                                   tip: 'Figma es la herramienta principal — destaca tu dominio de componentes, auto-layout y design systems.' },
  { keywords: ['ux', 'user experience', 'experiencia de usuario'], tip: 'UX es central — menciona metodologías (design thinking, user testing) y cómo mejoraste métricas.' },
  { keywords: ['ui', 'user interface', 'interfaz'],        tip: 'UI es importante — incluye tu portfolio con diseños responsive y sistemas de diseño.' },
  { keywords: ['diseño', 'design', 'creativo', 'creative'], tip: 'Diseño es clave — enlaza tu portfolio y destaca herramientas (Figma, Photoshop, Illustrator).' },

  // Ventas & Negocio
  { keywords: ['ventas', 'sales', 'comercial'],            tip: 'Ventas es el puesto — incluye cifras: cuota alcanzada, % sobre objetivo, cartera de clientes.' },
  { keywords: ['account', 'cuentas'],                      tip: 'Gestión de cuentas: destaca retención de clientes, upselling y relaciones a largo plazo.' },
  { keywords: ['business development', 'bdr', 'sdr'],      tip: 'Desarrollo de negocio — incluye pipeline generado, meetings agendados y conversión.' },

  // RRHH & People
  { keywords: ['recursos humanos', 'rrhh', 'hr', 'people'], tip: 'RRHH es el área — menciona procesos de selección gestionados, onboarding y retención.' },
  { keywords: ['recruiting', 'reclutamiento', 'talent', 'talento'], tip: 'Reclutamiento: incluye volumen de contrataciones, time-to-hire y herramientas ATS que uses.' },

  // Finanzas
  { keywords: ['finanzas', 'finance', 'controller'],       tip: 'Finanzas: menciona reporting, forecasting y herramientas (SAP, Oracle, Excel avanzado).' },
  { keywords: ['contabilidad', 'accounting', 'auditor'],   tip: 'Contabilidad: destaca normativa que domines (PGC, NIIF/IFRS) y software contable.' },

  // Gestión & liderazgo
  { keywords: ['project manager', 'pm', 'gestión de proyectos'], tip: 'Gestión de proyectos — menciona metodología (Agile, Scrum, Waterfall) y herramientas (Jira, Asana).' },
  { keywords: ['product', 'producto'],                     tip: 'Producto es el foco — incluye métricas de impacto, roadmaps liderados y metodologías de discovery.' },
  { keywords: ['scrum', 'agile', 'agil'],                  tip: 'Metodologías ágiles son clave — menciona certificaciones (PSM, SAFe) y equipos que hayas liderado.' },
  { keywords: ['manager', 'director', 'lead', 'jefe', 'responsable'], tip: 'Liderazgo es esperado — incluye tamaño de equipos gestionados y logros medibles del equipo.' },

  // Nivel de experiencia
  { keywords: ['junior', 'jr', 'entry'],                   tip: 'Para puestos junior: destaca formación, proyectos personales, ganas de aprender y actitud proactiva.' },
  { keywords: ['senior', 'sr', 'lead', 'principal'],       tip: 'Para puestos senior: enfócate en impacto, mentoring a juniors y decisiones técnicas/estratégicas.' },
  { keywords: ['intern', 'prácticas', 'becario', 'beca'],  tip: 'Para prácticas: tu motivación y proyectos académicos/personales pesan más que la experiencia laboral.' },

  // Idiomas
  { keywords: ['inglés', 'english', 'ingles'],             tip: 'El inglés es requisito — indica tu nivel real (B2, C1) y si has trabajado en entornos internacionales.' },
  { keywords: ['alemán', 'german', 'deutsch'],             tip: 'Alemán requerido — especifica tu nivel y cualquier certificación (Goethe, TestDaF).' },
  { keywords: ['francés', 'french', 'français'],           tip: 'Francés es valorado — indica tu nivel y experiencia en entornos francófonos.' },
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
