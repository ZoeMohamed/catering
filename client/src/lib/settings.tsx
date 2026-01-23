import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SiteSettings } from '@shared/schema';
import { apiRequest } from './queryClient';
import { isStaticMode, mockSettings } from './static-data';

interface SettingsContextType {
    settings: SiteSettings | null;
    isLoading: boolean;
    error: Error | null;
}

interface SettingsResponse {
    settings: SiteSettings;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const { data, isLoading, error } = useQuery<SettingsResponse>({
        queryKey: ['/api/pengaturan'],
        queryFn: async () => {
            if (isStaticMode) {
                return { settings: mockSettings };
            }
            try {
                const response = await apiRequest('GET', '/api/pengaturan');
                return await response.json();
            } catch (error) {
                console.error('Error fetching settings:', error);
                // Return default settings on error
                return {
                    settings: {
                        id: 1,
                        siteName: "Catering Aja",
                        title: "Catering Aja - Solusi Katering Anda"
                    }
                };
            }
        },
        retry: 3,
        retryDelay: 1000,
    });

    // Apply settings to the document
    React.useEffect(() => {
        if (data?.settings) {
            document.title = data.settings.title || 'Catering Aja';
            const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (favicon) {
                favicon.href = data.settings.faviconUrl || '/favicon.ico';
            }
        }
    }, [data?.settings]);

    return (
        <SettingsContext.Provider value={{
            settings: data?.settings ?? null,
            isLoading,
            error: error as Error | null
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
} 
