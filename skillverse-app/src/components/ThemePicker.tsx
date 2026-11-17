"use client";

import React, { useState } from "react";
import { Lock, Check } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { companionsClient } from "@/lib/companions/companionsClient";

export const THEME_ITEMS = [
  {
    id: "space",
    name: "Space Explorer",
    emoji: "🚀",
    desc: "Cosmic stars, nebula colors, astronaut gear.",
    isBuilt: true,
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    emoji: "🌊",
    desc: "Gentle reefs, deep blue tides, diving gear.",
    isBuilt: true,
  },
  {
    id: "jungle",
    name: "Wild Jungle",
    emoji: "🌴",
    desc: "Canopy greens, warm sunlight, safari gear.",
    isBuilt: true,
  },
  {
    id: "city",
    name: "Busy City",
    emoji: "🏙️",
    desc: "Skyscrapers, bustling streets.",
    isBuilt: false,
  },
  {
    id: "magic",
    name: "Magic Castle",
    emoji: "🏰",
    desc: "Spells, glowing crystals.",
    isBuilt: false,
  },
  {
    id: "sports",
    name: "Champions Stadium",
    emoji: "⚽",
    desc: "Tracks, athletic jerseys.",
    isBuilt: false,
  },
] as const;

interface ThemePickerProps {
  childId?: string;
  onThemeSelected?: (themeId: string) => void;
}

export function ThemePicker({ childId, onThemeSelected }: ThemePickerProps) {
  const { theme, setTheme } = useTheme();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelect = async (themeId: "space" | "ocean" | "jungle") => {
    setTheme(themeId);
    if (childId) {
      setIsUpdating(true);
      try {
        await companionsClient.updateTheme(childId, themeId);
      } catch {}
      setIsUpdating(false);
    }
    if (onThemeSelected) {
      onThemeSelected(themeId);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {THEME_ITEMS.map((t) => {
        const isSelected = theme === t.id;

        if (!t.isBuilt) {
          return (
            <div
              key={t.id}
              className="p-3.5 rounded-2xl border border-[var(--sv-text-soft)]/15 bg-gray-50/50 dark:bg-white/5 opacity-60 flex flex-col justify-between"
            >
              <div>
                <span className="text-3xl mb-1 block">{t.emoji}</span>
                <h4 className="font-heading font-bold text-[14px] text-[var(--sv-text)]">
                  {t.name}
                </h4>
                <p className="text-[11px] text-[var(--sv-text-soft)] mt-0.5 leading-snug">
                  {t.desc}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[var(--sv-text-soft)]">
                <Lock className="w-3 h-3" />
                <span>Coming Soon</span>
              </div>
            </div>
          );
        }

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelect(t.id as any)}
            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              isSelected
                ? "border-2 border-[var(--sv-primary)] bg-[var(--sv-card-tint)] shadow-sm ring-2 ring-[var(--sv-primary)]/20"
                : "border-[var(--sv-text-soft)]/20 bg-white dark:bg-[var(--sv-card)] hover:border-[var(--sv-primary)]/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-3xl mb-1 block">{t.emoji}</span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[var(--sv-primary)] text-white flex items-center justify-center text-[10px]">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>
              <h4 className="font-heading font-bold text-[14px] text-[var(--sv-text)]">
                {t.name}
              </h4>
              <p className="text-[11px] text-[var(--sv-text-soft)] mt-0.5 leading-snug">
                {t.desc}
              </p>
            </div>
            <div className="mt-3 text-[11px] font-bold text-[var(--sv-primary-deep)]">
              {isSelected ? "Active Theme" : "Select Theme"}
            </div>
          </button>
        );
      })}
    </div>
  );
}

