'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import SocialView from '@/app/dashboard/SocialView';
import { T } from '@/app/dashboard/social/SocialCommon';

/**
 * Shared Results Page
 * 
 * This page handles public shares of social plans or opportunity results.
 * It uses the modular SocialView component for consistency.
 */
export default function SharedPage() {
    const params = useParams();
    const id = params.id as string;
    const supabase = createClient();
    
    const [loading, setLoading] = useState(true);
    const [sharedData, setSharedData] = useState<unknown>(null);
    const [error, setError] = useState<string | null>(null);

    // In this simplified architecture for the shared page,
    // we assume 'id' can be a shared_result ID or a userId if the profile is public.
    // For now, mirroring the logic of showing the social dashboard for the given ID.

    useEffect(() => {
        if (id) {
            setLoading(false);
        }
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: T.sans, color: T.ink40 }}>
                Cargando vista compartida...
            </div>
        );
    }

    if (!id) {
        return (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: T.sans, color: T.ink }}>
                ID no válido.
            </div>
        );
    }

    // Direct render of SocialView with the given ID as the target userId.
    // Shared pages are typically 'pro' features or show pro results.
    return (
        <div style={{ background: T.paper, minHeight: '100vh' }}>
            <SocialView 
                userId={id} 
                supabase={supabase} 
                planTier="pro" 
            />
        </div>
    );
}
