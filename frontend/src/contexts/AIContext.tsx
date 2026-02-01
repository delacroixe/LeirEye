/**
 * AIContext - Contexto global para gestionar el estado de la IA
 */

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import apiService from '../services/api';

interface AIStatus {
    available: boolean;
    models: string[];
    has_required_model: boolean;
    required_model: string;
    install_hint?: string;
}

interface AIContextType {
    status: AIStatus | null;
    isLoading: boolean;
    refreshStatus: () => Promise<void>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<AIStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getAIStatus();
            setStatus(data);
        } catch (error) {
            console.error('Error fetching AI status:', error);
            setStatus({
                available: false,
                models: [],
                has_required_model: false,
                required_model: 'llama3.2:latest',
                install_hint: 'Error conectando con Ollama'
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshStatus();
    }, [refreshStatus]);

    return (
        <AIContext.Provider value={{ status, isLoading, refreshStatus }}>
            {children}
        </AIContext.Provider>
    );
}

export function useAI() {
    const context = useContext(AIContext);
    if (context === undefined) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
}
