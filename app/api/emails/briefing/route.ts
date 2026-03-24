import { NextRequest, NextResponse } from 'next/server';
import { resend, FROM_EMAIL, APP_NAME } from '@/lib/resend';
type Mission = {
    title: string;
    result: string;
    actions: number;
    status: 'completed' | 'partial' | 'failed';
};
function briefingTemplate(name: string, missions: Mission[], date: string): string {
    const total = missions.reduce((s, m) => s + m.actions, 0);
    const done = missions.filter(m => m.status === 'completed').length;
    const missionRows = missions.length > 0
        ? missions.map(m => {
            const statusColor = m.status === 'completed' ? '#28C840' :
                m.status === 'partial' ? '#E8E350' : '#C0392B';
            const statusLabel = m.status === 'completed' ? 'Completada' :
                m.status === 'partial' ? 'Parcial' : 'Fallida';
            return `
          <tr>
            <td style="padding:16px 0; border-bottom:1px solid #E8E8E8;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <p style="font-size:14px; font-weight:600; color:#0C0C0C;
                      margin-bottom:4px; letter-spacing:-.01em;">${m.title}</p>
                    <p style="font-size:13px; color:#606060; line-height:1.55;">${m.result}</p>
                  </td>
                  <td style="text-align:right; white-space:nowrap; padding-left:16px; vertical-align:top;">
                    <span style="display:inline-block; font-size:11px; font-weight:700;
                      color:${statusColor}; background:${statusColor}18;
                      padding:3px 10px; border-radius:100px; letter-spacing:.04em;">
                      ${statusLabel}
                    </span>
                    <p style="font-size:12px; color:#ABABAB; margin-top:6px;">
                      ${m.actions} acciones
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
        }).join('')
        : `<tr><td style="padding:32px 0; text-align:center; color:#ABABAB; font-size:14px;">
        No hubo misiones esta noche.
      </td></tr>`;
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Briefing diario — AGENTME</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { background:#F5F4F1; font-family:'DM Sans',Helvetica,sans-serif; -webkit-font-smoothing:antialiased; }
  </style>
</head>
<body style="background:#F5F4F1; padding:40px 16px;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" role="presentation"
        style="max-width:540px; width:100%;">

        <!-- LOGO -->
        <tr><td style="padding-bottom:28px; text-align:center;">
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

        <!-- HEADER CARD -->
        <tr><td style="background:#0C0C0C; border-radius:20px 20px 0 0;
          padding:36px 40px 32px;">
          <p style="font-size:12px; font-weight:700; color:#383838;
            text-transform:uppercase; letter-spacing:.09em; margin-bottom:10px;">
            Briefing del agente · ${date}
          </p>
          <h1 style="font-size:26px; font-weight:800; color:#FFFFFF;
            letter-spacing:-.03em; line-height:1.2; margin-bottom:6px;">
            Buenos días, ${name}
          </h1>
          <p style="font-size:14px; color:#555555; line-height:1.6;">
            Esto es lo que tu agente consiguió mientras dormías.
          </p>
        </td></tr>

        <!-- STATS ROW -->
        <tr><td style="background:#161616; padding:0 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding:20px 0; text-align:center; border-right:1px solid #2A2A2A;">
                <p style="font-size:28px; font-weight:800; color:#FFFFFF;
                  letter-spacing:-.03em;">${total}</p>
                <p style="font-size:11px; color:#484848; text-transform:uppercase;
                  letter-spacing:.08em; margin-top:4px;">Acciones</p>
              </td>
              <td style="padding:20px 0; text-align:center; border-right:1px solid #2A2A2A;">
                <p style="font-size:28px; font-weight:800; color:#FFFFFF;
                  letter-spacing:-.03em;">${missions.length}</p>
                <p style="font-size:11px; color:#484848; text-transform:uppercase;
                  letter-spacing:.08em; margin-top:4px;">Misiones</p>
              </td>
              <td style="padding:20px 0; text-align:center;">
                <p style="font-size:28px; font-weight:800; color:#28C840;
                  letter-spacing:-.03em;">${done}</p>
                <p style="font-size:11px; color:#484848; text-transform:uppercase;
                  letter-spacing:.08em; margin-top:4px;">Completadas</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- MISSIONS -->
        <tr><td style="background:#FFFFFF; border-radius:0 0 20px 20px;
          padding:8px 40px 32px; border:1px solid #E8E8E8; border-top:none;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr><td style="padding:24px 0 4px;">
              <p style="font-size:12px; font-weight:700; color:#ABABAB;
                text-transform:uppercase; letter-spacing:.09em;">
                Detalle de misiones
              </p>
            </td></tr>
            ${missionRows}
          </table>
        </td></tr>

        <!-- SPACER -->
        <tr><td style="height:16px;"></td></tr>

        <!-- CTA -->
        <tr><td style="background:#FFFFFF; border-radius:14px;
          padding:24px 28px; border:1px solid #E8E8E8; text-align:center;">
          <p style="font-size:14px; color:#606060; margin-bottom:18px; line-height:1.65;">
            ¿Quieres que el agente trabaje esta noche?
          </p>
          <a href="https://agentme.app/dashboard"
            style="display:inline-block; background:#0C0C0C; color:#FFFFFF;
            padding:12px 28px; border-radius:9px; font-size:14px;
            font-weight:700; text-decoration:none; letter-spacing:-.01em;">
            Activar nueva misión →
          </a>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="padding-top:32px; text-align:center;">
          <p style="font-size:12px; color:#C8C8C8; line-height:1.6;">
            © 2026 AGENTME · Briefing diario automático<br/>
            <a href="#" style="color:#ABABAB; text-decoration:underline;">
              Cancelar emails
            </a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}
export async function POST(req: NextRequest) {
    try {
        const { email, name, missions } = await req.json();
        if (!email) {
            return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
        }
        const displayName = name || email.split('@')[0];
        const today = new Date().toLocaleDateString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long'
        });
        const dateStr = today.charAt(0).toUpperCase() + today.slice(1);
        const missionList: Mission[] = missions || [];
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Tu briefing del agente — ${dateStr}`,
            html: briefingTemplate(displayName, missionList, dateStr),
        });
        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, id: data?.id });
    }
    catch (err) {
        console.error('Briefing email error:', err);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
