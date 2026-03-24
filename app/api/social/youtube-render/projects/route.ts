import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { listYoutubeRenderProjectsForUser } from '@/lib/youtube-render-projects';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function GET(req: NextRequest) {
    try {
        const supabase = await createRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userId = user.id;
        const projects = await listYoutubeRenderProjectsForUser(supabaseAdmin, userId);
        return NextResponse.json({ success: true, projects });
    }
    catch (e) {
        console.error('[social/youtube-render/projects]', e);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
