"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";

interface Particle {
  id: number;
  top: string;
  left: string;
  size: string;
  opacity: number;
  animDuration: string;
  animDelay: string;
}

export function ThemeAmbience() {
  const { theme } = useTheme();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate deterministic particles client-side to prevent SSR prerender mismatch
    const count = theme === "ocean" ? 22 : theme === "jungle" ? 14 : 45;

    const items: Particle[] = Array.from({ length: count }).map((_, i) => {
      const top = (i * 37 + 13) % 100;
      const left = (i * 59 + 29) % 100;
      let size = "2px";
      if (theme === "ocean") {
        size = `${6 + (i % 8) * 1.5}px`;
      } else if (theme === "jungle") {
        size = `${24 + (i % 6) * 3}px`;
      } else {
        size = i % 3 === 0 ? "3px" : "1.5px";
      }

      const opacity = theme === "ocean" ? 0.15 + (i % 25) / 100 : theme === "jungle" ? 0.15 + (i % 20) / 100 : 0.2 + (i % 70) / 100;
      const animDelay = `${(i % 5) * 1.2}s`;
      const animDuration = `${theme === "ocean" ? 6 + (i % 4) * 2 : 4 + (i % 4)}s`;

      return {
        id: i,
        top: `${top}%`,
        left: `${left}%`,
        size,
        opacity,
        animDelay,
        animDuration,
      };
    });

    setParticles(items);
  }, [theme]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {theme === "space" && (
        <div className="absolute inset-0 animate-drift">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-[var(--sv-primary-deep)]/40 star-twinkle"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                animation: `twinkle ${p.animDuration} ease-in-out infinite alternate ${p.animDelay}`,
              }}
            />
          ))}
        </div>
      )}

      {theme === "ocean" && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full border border-[var(--sv-secondary)]/50 bg-[var(--sv-secondary)]/20"
              style={{
                bottom: "-20px",
                left: p.left,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                animation: `rise ${p.animDuration} linear infinite ${p.animDelay}`,
              }}
            />
          ))}
        </div>
      )}

      {theme === "jungle" && (
        <div className="absolute inset-0 animate-drift">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-[40%] bg-[var(--sv-primary)]/20 blur-[1px] rotate-45"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: `calc(${p.size} * 0.6)`,
                opacity: p.opacity,
                animation: `drift ${p.animDuration} ease-in-out infinite alternate ${p.animDelay}`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

