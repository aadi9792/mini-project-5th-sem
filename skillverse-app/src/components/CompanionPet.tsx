"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { companionsClient, ChildCompanion } from "@/lib/companions/companionsClient";
import { CompanionCloset } from "./CompanionCloset";
import { useTheme } from "./ThemeProvider";

interface CompanionPetProps {
  nickname: string;
  onNavigateToQuest?: () => void;
}

const IDLE_LINES = [
  "Ready for an adventure, {nickname}?",
  "I'm here whenever you need me!",
  "Let's see what's new today!",
  "You're doing great — keep going!",
  "Pick a quest and let's go!",
];

export function CompanionPet({ nickname, onNavigateToQuest }: CompanionPetProps) {
  const { theme } = useTheme();
  const [activeCompanion, setActiveCompanion] = useState<ChildCompanion | null>(null);
  const [evolutionStage, setEvolutionStage] = useState<{ stage: number; name: string }>({
    stage: 1,
    name: "Hatchling",
  });
  const [idleLine, setIdleLine] = useState<string>("");
  const [isClosetOpen, setIsClosetOpen] = useState(false);

  const fetchActiveCompanion = () => {
    companionsClient
      .getMyCompanions()
      .then((res) => {
        if (res.active) {
          setActiveCompanion(res.active);
        }
        if (res.evolutionStage) {
          setEvolutionStage(res.evolutionStage);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchActiveCompanion();
    // Deterministic or random idle line per load
    const randomTemplate = IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)];
    setIdleLine(randomTemplate.replace(/\{nickname\}/g, nickname || "Explorer"));
  }, [nickname]);

  // Theme accessory badge lookup (00a §3.2)
  const getThemeAccessory = () => {
    if (theme === "ocean") return "🤿";
    if (theme === "jungle") return "🧭";
    return "🧑‍🚀"; // default space
  };

  const emoji = activeCompanion?.template?.emoji || "🤖";
  const name = activeCompanion?.customName || "Beep";

  return (
    <>
      <div className="bg-[var(--sv-card)] rounded-3xl p-5 sm:p-6 border border-[var(--sv-primary)]/15 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center gap-4">
          {/* Companion Avatar Badge with Evolution Stages & Theme Accessory */}
          <button
            type="button"
            onClick={() => setIsClosetOpen(true)}
            aria-label={`${name}, your companion pet. Tap to open closet.`}
            className="relative shrink-0 group cursor-pointer focus:outline-none"
          >
            {/* Evolution Stage 3 & 4 Glow */}
            {evolutionStage.stage >= 3 && (
              <div className="absolute inset-0 rounded-full bg-[var(--sv-primary)]/40 blur-md animate-pulse" />
            )}

            <div
              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-[var(--sv-primary)] to-[var(--sv-secondary)] text-white text-3xl sm:text-4xl flex items-center justify-center shadow-md relative z-10 transition-transform group-hover:scale-105 ${
                evolutionStage.stage === 2
                  ? "ring-2 ring-[var(--sv-attention)]"
                  : evolutionStage.stage >= 3
                  ? "ring-3 ring-[var(--sv-primary-deep)]"
                  : ""
              }`}
            >
              <span className="animate-float-bob">{emoji}</span>

              {/* Theme Accessory Badge in bottom-right corner */}
              <span className="absolute -bottom-1 -right-1 text-sm sm:text-base bg-white dark:bg-[#1e2238] rounded-full p-0.5 shadow-sm border border-[var(--sv-text-soft)]/20">
                {getThemeAccessory()}
              </span>

              {/* Evolution Stage 4 Star Sparkle */}
              {evolutionStage.stage >= 4 && (
                <span className="absolute -top-1 -right-1 text-xs bg-[var(--sv-attention)] rounded-full p-0.5 shadow-sm">
                  ⭐
                </span>
              )}
            </div>
          </button>

          {/* Idle Line & Companion Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-bold text-lg text-[var(--sv-text)]">
                {name}
              </h3>
              <span className="text-[11px] font-semibold text-[var(--sv-primary-deep)] bg-[var(--sv-primary)]/15 px-2 py-0.5 rounded-full">
                {evolutionStage.name}
              </span>
            </div>

            <p className="text-[13px] sm:text-[14px] text-[var(--sv-text-soft)] mt-1 italic leading-relaxed">
              &ldquo;{idleLine}&rdquo;
            </p>

            <button
              type="button"
              onClick={() => setIsClosetOpen(true)}
              className="text-[12px] text-[var(--sv-primary-deep)] font-semibold hover:underline mt-1 inline-block cursor-pointer"
            >
              Change companion
            </button>
          </div>

          {/* Let's Go Button (00 §6.2.1 Primary CTA using solid var(--sv-primary-deep)) */}
          <div className="hidden sm:block shrink-0">
            <button
              type="button"
              onClick={onNavigateToQuest}
              className="h-11 px-5 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[14px] hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Let&apos;s go</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Companion Closet Modal */}
      <CompanionCloset
        isOpen={isClosetOpen}
        onClose={() => setIsClosetOpen(false)}
        onCompanionSwitched={fetchActiveCompanion}
        nickname={nickname}
      />
    </>
  );
}

