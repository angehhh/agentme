import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { randomBytes } from 'crypto';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function POST(req: NextRequest) {
    try {
        const supabase = await createRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
        }
        const userId = user.id;

        const { query, location, jobs, total } = await req.json();
        if (!query || !jobs?.length) {
            return NextResponse.json({ error: 'Datos requeridos' }, { status: 400 });
        }
        const id = randomBytes(6).toString('base64url');
        const { error } = await supabaseAdmin
            .from('shared_results')
            .insert({
            id,
            user_id: userId,
            query,
            location: location || '',
            jobs: jobs.map((j: Record<string, unknown>) => ({
                title: j.title, company: j.company, location: j.location,
                url: j.url, posted: j.posted,
                relevance: j.relevance || null, reason: j.reason || null,
            })),
            total: total || jobs.length,
        });
        if (error) {
            console.error('Share insert error:', error);
            return NextResponse.json({ error: 'Error al compartir' }, { status: 500 });
        }
        return NextResponse.json({ success: true, id });
    }
    catch (err) {
        console.error('[Share] Error:', err);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
