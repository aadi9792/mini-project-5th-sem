'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface GuardianTokenCtx {
  token: string | null;
  tier: 'view' | 'action' | null;
  setToken: (token: string, tier: 'view' | 'action') => void;
  clearToken: () => void;
}

const GuardianTokenContext = createContext<GuardianTokenCtx>({
  token: null, tier: null,
  setToken: () => {}, clearToken: () => {},
});

export function GuardianTokenProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [tier, setTierState] = useState<'view' | 'action' | null>(null);

  const setToken = useCallback((t: string, tier: 'view' | 'action') => {
    setTokenState(t); setTierState(tier);
  }, []);
  const clearToken = useCallback(() => { setTokenState(null); setTierState(null); }, []);

  return (
    <GuardianTokenContext.Provider value={{ token, tier, setToken, clearToken }}>
      {children}
    </GuardianTokenContext.Provider>
  );
}

export const useGuardianToken = () => useContext(GuardianTokenContext);

