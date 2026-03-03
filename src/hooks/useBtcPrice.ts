import { useState, useEffect, useCallback, useRef } from 'react';

export interface BtcPrice {
    usd: number;
    ars: number;
    usdt: number;
}

export type PriceCurrency = 'usd' | 'ars' | 'usdt';

const ENDPOINT =
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ars,usdt';

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export function useBtcPrice() {
    const [price, setPrice] = useState<BtcPrice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchPrice = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch(ENDPOINT);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            const btc = json?.bitcoin;
            if (!btc) throw new Error('Respuesta inválida de CoinGecko');
            setPrice({ usd: btc.usd, ars: btc.ars, usdt: btc.usdt });
            setLastUpdated(new Date());
        } catch (e: any) {
            setError(e.message ?? 'Error de red');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPrice();
        intervalRef.current = setInterval(fetchPrice, REFRESH_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchPrice]);

    /** Minutes since last successful fetch */
    const minutesSince = lastUpdated
        ? Math.floor((Date.now() - lastUpdated.getTime()) / 60000)
        : null;

    return { price, loading, error, lastUpdated, minutesSince, refresh: fetchPrice };
}
