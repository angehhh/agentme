import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getYoutubeRenderSessionDetail } from '@/lib/youtube-render-projects';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const sessionId = (await context.params).id;
        if (!sessionId) {
            return NextResponse.json({ error: 'Falta sessionId' }, { status: 400 });
        }

        const userId = user.id;
        const detail = await getYoutubeRenderSessionDetail(supabaseAdmin, userId, sessionId);
        
        if (!detail) {
            return NextResponse.json({ error: 'Sesión no encontrada o no pertenece al usuario' }, { status: 404 });
        }

        return NextResponse.json({ success: true, ...detail });
    }
    catch (e) {
        console.error('[social/youtube-render/projects]', e);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
