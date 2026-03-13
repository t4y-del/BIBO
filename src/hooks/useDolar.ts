import { useState, useEffect, useCallback, useRef } from 'react';

export interface DolarQuote {
    casa: string;
    nombre: string;
    compra: number;
    venta: number;
    fechaActualizacion: string;
}

const ENDPOINT = 'https://dolarapi.com/v1/dolares';
const REFRESH_MS = 5 * 60 * 1000;

export function useDolar() {
    const [quotes, setQuotes] = useState<DolarQuote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchDolar = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch(ENDPOINT);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setQuotes(data);
        } catch (e: any) {
            setError(e.message ?? 'Error de red');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDolar();
        intervalRef.current = setInterval(fetchDolar, REFRESH_MS);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [fetchDolar]);

    const oficial = quotes.find(q => q.casa === 'oficial');
    const blue = quotes.find(q => q.casa === 'blue');

    return { quotes, oficial, blue, loading, error, refresh: fetchDolar };
}
