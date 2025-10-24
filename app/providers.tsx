// app/providers.tsx
'use client'; // <-- BU İFADE ZORUNLU!

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient({
    // TanStack Query için default ayarlar eklenebilir
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 dakika
        },
    },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        // QueryClientProvider, tüm hook'ların çalışması için en dışta olmalı
        <QueryClientProvider client={queryClient}>
            <SessionProvider>
                {children}
            </SessionProvider>
        </QueryClientProvider>
    );
}