import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processOneSleepJobFromQueue } from '@/lib/modes/sleep';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret)
        return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 503 });
    const auth = req.headers.get('authorization');
    const q = req.nextUrl.searchParams.get('secret');
    const ok = auth === `Bearer ${secret}` || auth === secret || q === secret;
    if (!ok)
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const result = await processOneSleepJobFromQueue(supabaseAdmin);
    return NextResponse.json({
        success: true,
        processed: result.processed,
        jobId: result.jobId ?? null,
    });
}
