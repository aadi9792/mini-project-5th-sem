"use client";

import React, { useMemo } from "react";

export default function TutorialIslandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stars = useMemo(() => {
    return Array.from({ length: 70 }).map((_, i) => {
      const top = (i * 31 + 7) % 100;
      const left = (i * 47 + 19) % 100;
      const size = i % 4 === 0 ? 3 : i % 2 === 0 ? 2 : 1.5;
      const opacity = 0.25 + ((i * 13) % 65) / 100;
      const animDelay = (i % 6) * 0.8;
      const animDuration = 2.5 + (i % 4);

      return {
        id: i,
        top: `${top}%`,
        left: `${left}%`,
        size: `${size}px`,
        opacity,
        animDelay: `${animDelay}s`,
        animDuration: `${animDuration}s`,
      };
    });
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-[var(--sv-bg)] overflow-hidden">
      {/* Full Starfield Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden animate-drift" aria-hidden="true">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-[var(--sv-primary-deep)]/50 star-twinkle"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animation: `twinkle ${star.animDuration} ease-in-out infinite alternate ${star.animDelay}`,
            }}
          />
        ))}
      </div>

      {/* Floating Theme Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-12 left-10 text-4xl opacity-50 animate-float-bob">✨</div>
        <div className="absolute bottom-16 left-1/4 text-3xl opacity-40 animate-float-bob" style={{ animationDelay: "1.5s" }}>🪐</div>
        <div className="absolute top-1/4 right-12 text-4xl opacity-50 animate-float-bob" style={{ animationDelay: "2.5s" }}>🚀</div>
      </div>

      {/* Card Content Container */}
      <div className="w-full max-w-xl relative z-10 animate-card-enter">
        <div
          className="bg-white rounded-3xl p-6 sm:p-10 border border-[var(--sv-primary)]/15"
          style={{
            boxShadow: "0 14px 45px rgba(47, 127, 163, 0.15)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

