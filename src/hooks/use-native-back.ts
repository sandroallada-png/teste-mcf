'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useNativeBack() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only run on Capacitor (Native APK)
        if (typeof window === 'undefined' || !(window as any).Capacitor) return;

        let listener: any = null;

        const setupListener = async () => {
            const { App } = await import('@capacitor/app');

            listener = await App.addListener('backButton', (data: { canGoBack: boolean }) => {
                const rootPaths = ['/dashboard', '/', '/login', '/welcome'];
                if (rootPaths.includes(pathname || '')) {
                    // Let the system handle it (exit app) if we're on a root page
                    return;
                }

                // Otherwise, go back in the Next.js router
                router.back();
            });
        };

        setupListener();

        return () => {
            if (listener) {
                listener.remove();
            }
        };
    }, [router, pathname]);
}
