'use client';

import { useState, useCallback, useRef } from 'react';
import { difficultyClient } from '@/lib/guardian/guardianClient';

export type Tier = 'easy' | 'medium' | 'hard';

const TIERS: Tier[] = ['easy', 'medium', 'hard'];

function tierUp(t: Tier): Tier {
  const idx = TIERS.indexOf(t);
  return TIERS[Math.min(idx + 1, TIERS.length - 1)];
}

function tierDown(t: Tier): Tier {
  const idx = TIERS.indexOf(t);
  return TIERS[Math.max(idx - 1, 0)];
}

interface UseDifficultyProfileReturn {
  sessionTier: Tier;
  setSessionTier: (t: Tier) => void;
  onTierChange: string | null;        // companion line to show, null = no change this round
  clearTierChange: () => void;
  reportRoundResult: (strong: boolean) => void;
  reportDistressCheckIn: () => void;
  commitSession: () => Promise<void>;
  discardSession: () => void;
  isBossBattle: boolean;
}

export function useDifficultyProfile(gameId: string, initialTier: Tier, isBossBattle = false): UseDifficultyProfileReturn {
  const [sessionTier, setSessionTierState] = useState<Tier>(initialTier);
  const [onTierChange, setOnTierChange] = useState<string | null>(null);

  // Consecutive streak counters (strict consecutive, reset on opposite result)
  const strongStreak = useRef(0);
  const struggleStreak = useRef(0);
  // How many tiers dropped by distress (for refund at session end)
  const distressDropCount = useRef(0);
  // Whether distress step-down already happened (no re-escalation this session)
  const distressFired = useRef(false);

  const currentTier = useRef<Tier>(initialTier);

  const setSessionTier = useCallback((t: Tier) => {
    currentTier.current = t;
    setSessionTierState(t);
  }, []);

  const reportRoundResult = useCallback((strong: boolean) => {
    if (isBossBattle) return; // Boss Battle: no adaptive changes

    if (strong) {
      strongStreak.current++;
      struggleStreak.current = 0;
      if (strongStreak.current >= 3 && !distressFired.current) {
        const next = tierUp(currentTier.current);
        if (next !== currentTier.current) {
          setSessionTier(next);
          setOnTierChange("Let's try something a little trickier!");
          strongStreak.current = 0;
        }
      }
    } else {
      struggleStreak.current++;
      strongStreak.current = 0;
      if (struggleStreak.current >= 3) {
        const next = tierDown(currentTier.current);
        if (next !== currentTier.current) {
          setSessionTier(next);
          setOnTierChange("Let's ease into this together.");
          struggleStreak.current = 0;
        }
      }
    }
  }, [isBossBattle, setSessionTier]);

  const reportDistressCheckIn = useCallback(() => {
    if (isBossBattle) return;
    const next = tierDown(currentTier.current);
    if (next !== currentTier.current) {
      distressDropCount.current++;
    }
    distressFired.current = true;
    strongStreak.current = 0;
    struggleStreak.current = 0;
    setSessionTier(next);
    setOnTierChange("Let's take it easy for a bit — I'm right here with you.");
  }, [isBossBattle, setSessionTier]);

  const commitSession = useCallback(async () => {
    if (isBossBattle) return; // Boss Battle never writes to profile

    // Refund distress drops: bump tier up by distressDropCount, capped at hard
    let persistTier = currentTier.current;
    for (let i = 0; i < distressDropCount.current; i++) {
      persistTier = tierUp(persistTier);
    }

    try {
      await difficultyClient.updateProfile(gameId, persistTier);
    } catch (e) {
      // Retry once
      try {
        await difficultyClient.updateProfile(gameId, persistTier);
      } catch {
        // Silent fail — tier update is not critical
      }
    }
  }, [gameId, isBossBattle]);

  const discardSession = useCallback(() => {
    // No-op: nothing persisted for abandoned sessions
  }, []);

  const clearTierChange = useCallback(() => {
    setOnTierChange(null);
  }, []);

  return {
    sessionTier,
    setSessionTier,
    onTierChange,
    clearTierChange,
    reportRoundResult,
    reportDistressCheckIn,
    commitSession,
    discardSession,
    isBossBattle,
  };
}

