'use client';

import { SWRConfig } from 'swr';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig
            value={{
                revalidateOnFocus: true,
                revalidateIfStale: true,
                dedupingInterval: 4000,
                shouldRetryOnError: false,
            }}
        >
            {children}
        </SWRConfig>
    );
}
