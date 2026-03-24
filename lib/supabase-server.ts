import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
export function createMiddlewareClient(req: NextRequest) {
    let res = NextResponse.next({ request: req });
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        cookies: {
            getAll() {
                return req.cookies.getAll();
            },
            setAll(cookiesToSet) {
                for (const { name, value, options } of cookiesToSet) {
                    req.cookies.set(name, value);
                    res.cookies.set(name, value, options);
                }
            },
        },
    });
    return { supabase, res };
}
