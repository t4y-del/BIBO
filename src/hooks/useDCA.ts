import { useState, useCallback } from 'react';

export interface DCAMetrics {
    totalInvested: number;
    totalValue: number;
    totalBTC: number;
    percentageChange: number;
    numberOfPurchases: number;
    averagePrice: number;
}

export interface DCAPurchase {
    timestamp?: string;
    date?: string;
    price?: number;
    btcPrice?: number;
    btcPurchased?: number;
    btc?: number;
    usdSpent?: number;
    portfolioValue?: number;
    totalValue?: number;
    currentValue?: number;
}

export interface DCAResult {
    metrics: DCAMetrics;
    purchases: DCAPurchase[];
    priceData?: any[];
}

export interface DCAParams {
    amount: number;
    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
    duration: number;
    startDate: string; // YYYY-MM-DD
}

const ENDPOINT = 'https://charts.bitcoin.com/api/v1/charts/dca/calculate';

export function useDCA() {
    const [result, setResult] = useState<DCAResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const calculate = useCallback(async (params: DCAParams) => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            // Validate end date
            const start = new Date(params.startDate);
            const end = new Date(start);
            end.setFullYear(end.getFullYear() + params.duration);
            if (end > new Date()) {
                throw new Error('La fecha de fin no puede ser mayor a hoy');
            }

            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });

            if (!res.ok) throw new Error(`Error ${res.status}`);
            const data = await res.json();

            if (!data.metrics) throw new Error('Respuesta inválida de la API');

            setResult({
                metrics: data.metrics,
                purchases: data.data?.purchases ?? [],
                priceData: data.data?.priceData ?? [],
            });
        } catch (e: any) {
            setError(e.message ?? 'Error al calcular DCA');
        } finally {
            setLoading(false);
        }
    }, []);

    return { result, loading, error, calculate };
}
