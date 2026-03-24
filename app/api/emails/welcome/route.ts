import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM_EMAIL, APP_NAME } from '@/lib/resend'

/* â”€â”€ HTML template â”€â”€ */
function welcomeTemplate(name: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Bienvenido a AGENTME</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { background:#F5F4F1; font-family:'DM Sans',Helvetica,sans-serif; -webkit-font-smoothing:antialiased; }
  </style>
</head>
<body style="background:#F5F4F1; padding:40px 16px;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" role="presentation"
        style="max-width:540px; width:100%;">

        <!-- HEADER -->
        <tr><td style="padding-bottom:32px; text-align:center;">
          <table cellpadding="0" cellspacing="0" role="presentation"
            style="display:inline-table;">
            <tr>
              <td style="background:#0C0C0C; border-radius:8px;
                width:32px; height:32px; text-align:center;
                vertical-align:middle; padding:0 8px;">
                <span style="color:white; font-size:16px; font-weight:800;">A</span>
              </td>
              <td style="padding-left:10px; font-size:17px; font-weight:700;
                color:#0C0C0C; letter-spacing:-.02em; vertical-align:middle;">
                AGENTME
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- HERO CARD -->
        <tr><td style="background:#0C0C0C; border-radius:20px;
          padding:48px 44px; text-align:center; margin-bottom:20px;">
          <p style="font-size:13px; font-weight:700; color:#484848;
            text-transform:uppercase; letter-spacing:.09em; margin-bottom:16px;">
            Bienvenido a bordo
          </p>
          <h1 style="font-size:32px; font-weight:800; color:#FFFFFF;
            letter-spacing:-.03em; line-height:1.15; margin-bottom:16px;">
            Tu agente estÃ¡<br/>listo para trabajar
          </h1>
          <p style="font-size:15px; color:#555555; line-height:1.7; margin-bottom:32px;">
            Hola <strong style="color:#D0D0D0;">${name}</strong>, tu cuenta
            en AGENTME ya estÃ¡ activa. Define tu primer objetivo y el agente
            lo ejecutarÃ¡ mientras tÃº vives tu vida.
          </p>
          <a href="https://agentme.app/dashboard"
            style="display:inline-block; background:#FFFFFF; color:#0C0C0C;
            padding:14px 32px; border-radius:9px; font-size:15px;
            font-weight:700; text-decoration:none; letter-spacing:-.01em;">
            Ir al dashboard â†’
          </a>
        </td></tr>

        <!-- SPACER -->
        <tr><td style="height:20px;"></td></tr>

        <!-- MODES GRID -->
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <!-- Opportunity -->
              <td width="48%" style="background:#FFFFFF; border-radius:14px;
                padding:22px; border:1px solid #E8E8E8; vertical-align:top;">
                <p style="font-size:11px; font-weight:700; color:#ABABAB;
                  text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px;">
                  Empleo & becas
                </p>
                <p style="font-size:15px; font-weight:700; color:#0C0C0C;
                  margin-bottom:8px; letter-spacing:-.01em;">
                  Opportunity Mode
                </p>
                <p style="font-size:13px; color:#606060; line-height:1.6;">
                  Escanea LinkedIn e Instagram buscando oportunidades que encajan contigo.
                </p>
              </td>
              <td width="4%"></td>
              <!-- Sleep -->
              <td width="48%" style="background:#FFFFFF; border-radius:14px;
                padding:22px; border:1px solid #E8E8E8; vertical-align:top;">
                <p style="font-size:11px; font-weight:700; color:#ABABAB;
                  text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px;">
                  El diferenciador
                </p>
                <p style="font-size:15px; font-weight:700; color:#0C0C0C;
                  margin-bottom:8px; letter-spacing:-.01em;">
                  Sleep Mode
                </p>
                <p style="font-size:13px; color:#606060; line-height:1.6;">
                  Define un objetivo antes de dormir. A las 7 AM recibes los resultados.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- SPACER -->
        <tr><td style="height:20px;"></td></tr>

        <!-- CTA secundario -->
        <tr><td style="background:#FFFFFF; border-radius:14px;
          padding:24px 28px; border:1px solid #E8E8E8; text-align:center;">
          <p style="font-size:14px; color:#606060; line-height:1.65;">
            Tienes el plan <strong style="color:#0C0C0C;">Free</strong> activo.
            Actualiza a <strong style="color:#0C0C0C;">Pro por $12/mes</strong>
            para acciones ilimitadas y todos los modos.
          </p>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="padding-top:36px; text-align:center;">
          <p style="font-size:12px; color:#C8C8C8; line-height:1.6;">
            Â© 2026 AGENTME Â· Todos los derechos reservados<br/>
            <a href="#" style="color:#ABABAB; text-decoration:underline;">
              Cancelar suscripciÃ³n
            </a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`
}

/* â”€â”€ API Route â”€â”€ */
export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    const displayName = name || email.split('@')[0]

    const { data, error } = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      email,
      subject: `Bienvenido a ${APP_NAME}, ${displayName} â€” Tu agente estÃ¡ listo`,
      html:    welcomeTemplate(displayName),
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })

  } catch (err) {
    console.error('Welcome email error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}