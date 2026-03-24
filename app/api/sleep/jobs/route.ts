import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/require-session-user';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const auth = await requireSessionUser();
        if (!auth.ok)
            return auth.response;
        const { user, supabase } = auth;
        const { data, error } = await supabase
            .from('sleep_jobs')
            .select('id, status, goal, state, created_at, updated_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30);
        if (error) {
            const msg = error.message || '';
            const missingTable = /relation|does not exist|sleep_jobs/i.test(msg);
            console.error('[sleep/jobs]', error);
            return NextResponse.json({
                jobs: [],
                setupHint: missingTable,
            }, { status: 200 });
        }
        return NextResponse.json({ jobs: data ?? [] });
    }
    catch (e) {
        console.error('[sleep/jobs]', e);
        return NextResponse.json({ error: 'Error interno', jobs: [] }, { status: 500 });
    }
}
