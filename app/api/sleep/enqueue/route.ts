import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { enqueueSleepJob } from '@/lib/modes/sleep';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const supabase = await createRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user)
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        const body = await req.json().catch(() => ({}));
        const goal = typeof body.goal === 'string' ? body.goal : '';
        if (!goal.trim())
            return NextResponse.json({ error: 'Falta goal' }, { status: 400 });
        const { id, error } = await enqueueSleepJob(supabaseAdmin, user.id, goal);
        if (error || !id)
            return NextResponse.json({
                error: 'No se pudo encolar (¿ejecutaste supabase/create_sleep_jobs.sql?)',
                detail: error?.message,
            }, { status: 503 });
        return NextResponse.json({ success: true, jobId: id });
    }
    catch (e) {
        console.error('[sleep/enqueue]', e);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
