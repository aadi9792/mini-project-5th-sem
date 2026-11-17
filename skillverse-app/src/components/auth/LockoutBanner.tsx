"use client";

import React, { useState, useEffect } from "react";
import { Lock } from "lucide-react";

interface LockoutBannerProps {
  lockedUntil: string | Date;
  onUnlock?: () => void;
}

export function LockoutBanner({ lockedUntil, onUnlock }: LockoutBannerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    const target = new Date(lockedUntil).getTime();

    const updateTimer = () => {
      const diff = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setSecondsRemaining(diff);
      if (diff <= 0 && onUnlock) {
        onUnlock();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil, onUnlock]);

  if (secondsRemaining <= 0) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div className="bg-[var(--sv-warning)]/12 border border-[var(--sv-warning)]/40 rounded-xl p-3.5 flex items-start gap-3 my-3 text-[var(--sv-text)] text-[13px] leading-relaxed">
      <Lock className="w-4 h-4 text-[var(--sv-warning)] shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-[var(--sv-text)]">
          Account temporarily locked for security
        </p>
        <p className="text-[var(--sv-text-soft)] mt-0.5">
          Too many incorrect password attempts. Please wait{" "}
          <span className="font-bold text-[var(--sv-text)]">{timeFormatted}</span> before trying again.
        </p>
      </div>
    </div>
  );
}
