"use client";

import React, { useMemo } from "react";
import Link from "next/link";

interface AuthCardProps {
  children: React.ReactNode;
  showMascot?: boolean;
  maxWidth?: string;
}

export function AuthCard({ children, showMascot = true, maxWidth = "max-w-[440px]" }: AuthCardProps) {
  // Generate a deterministic calm starfield (45 stars)
  const stars = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => {
      // Deterministic pseudo-random positions
      const top = ((i * 37 + 13) % 100);
      const left = ((i * 59 + 29) % 100);
      const size = (i % 3 === 0) ? 2 : 1.5;
      const opacity = 0.2 + ((i * 17) % 70) / 100;
      const animDelay = (i % 5) * 1.2;
      const animDuration = 3 + (i % 4);

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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[var(--sv-bg)]">
      {/* Calm Starfield Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden animate-drift" aria-hidden="true">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-[var(--sv-primary-deep)]/40 star-twinkle"
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

      {/* Main Container */}
      <div className={`w-full ${maxWidth} relative z-10 animate-card-enter`}>
        {/* Header: Logo, Tagline & Mascot */}
        <div className="flex flex-col items-center text-center mb-6">
          {showMascot && (
            <div className="w-16 h-16 rounded-full bg-[var(--sv-card-tint)] border border-[var(--sv-secondary)]/20 flex items-center justify-center text-3xl shadow-sm mb-3 animate-float-bob">
              🤖
            </div>
          )}
          <Link href="/" className="inline-block group">
            <h1 className="font-heading font-bold text-[24px] sm:text-[26px] text-[var(--sv-primary-deep)] tracking-tight hover:opacity-90 transition-opacity">
              Skillverse
            </h1>
          </Link>
          <p className="text-[14px] sm:text-[15px] text-[var(--sv-text-soft)] mt-0.5">
            Where every child is the hero.
          </p>
        </div>

        {/* Card Body */}
        <div
          className="bg-white rounded-3xl p-6 sm:p-10 border border-[var(--sv-primary)]/10"
          style={{
            boxShadow: "0 10px 40px rgba(47, 127, 163, 0.12)",
          }}
        >
          {children}
        </div>

        {/* Global Footer */}
        <div className="text-center mt-6 text-[13px] text-[var(--sv-text-soft)]">
          <Link
            href="/terms"
            className="hover:text-[var(--sv-primary-deep)] transition-colors hover:underline"
          >
            Terms
          </Link>
          <span className="mx-2">•</span>
          <Link
            href="/privacy"
            className="hover:text-[var(--sv-primary-deep)] transition-colors hover:underline"
          >
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}
