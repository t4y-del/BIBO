import React, { createContext, useContext, useState, useCallback } from 'react';

interface HideBalanceContextType {
    hidden: boolean;
    toggle: () => void;
}

const HideBalanceContext = createContext<HideBalanceContextType>({
    hidden: false,
    toggle: () => { },
});

export function HideBalanceProvider({ children }: { children: React.ReactNode }) {
    const [hidden, setHidden] = useState(false);
    const toggle = useCallback(() => setHidden((h) => !h), []);

    return (
        <HideBalanceContext.Provider value={{ hidden, toggle }}>
            {children}
        </HideBalanceContext.Provider>
    );
}

export function useHideBalance() {
    return useContext(HideBalanceContext);
}

/**
 * Masks a money string with asterisks when hidden
 * e.g. "$703.486" → "$ ****"
 */
export function maskMoney(value: string, hidden: boolean): string {
    if (!hidden) return value;
    return '$ ****';
}
