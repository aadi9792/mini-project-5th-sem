"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass } from "lucide-react";

const THEMES = [
  { id: "space", name: "Space Explorer", emoji: "🚀", desc: "Cosmic stars, nebula colors, and astronaut gear." },
  { id: "ocean", name: "Deep Ocean", emoji: "🌊", desc: "Gentle coral reefs, deep blue tides, and diving helmets." },
  { id: "jungle", name: "Wild Jungle", emoji: "🌴", desc: "Canopy greens, warm sunlight, and safari hats." },
];

export default function ThemePickerPlaceholderPage() {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState("space");

  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-full bg-[var(--sv-card-tint)] border border-[var(--sv-secondary)]/30 flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm animate-float-bob">
        <Compass className="w-8 h-8 text-[var(--sv-primary-deep)]" />
      </div>

      <span className="text-[12px] font-bold text-[var(--sv-primary-deep)] uppercase tracking-wider bg-[var(--sv-primary)]/10 px-3 py-1 rounded-full">
        Tutorial Island • Step 4
      </span>

      <h1 className="font-heading font-bold text-[26px] sm:text-[30px] text-[var(--sv-text)] tracking-tight mt-3">
        Pick your World Theme!
      </h1>

      <p className="text-[14px] text-[var(--sv-text-soft)] mt-1.5 max-w-md mx-auto">
        Themes change the world art, ambience, and companion accessories without altering any game rules.
      </p>

      {/* 3 Themes grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 max-w-md mx-auto">
        {THEMES.map((t) => {
          const isSelected = selectedTheme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTheme(t.id)}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-[var(--sv-card-tint)] border-2 border-[var(--sv-primary)] shadow-md ring-2 ring-[var(--sv-primary)]/20"
                  : "bg-white border border-[var(--sv-text-soft)]/20 hover:border-[var(--sv-primary)]/40"
              }`}
            >
              <span className="text-4xl mb-2">{t.emoji}</span>
              <span className="font-heading font-bold text-[16px] text-[var(--sv-text)]">{t.name}</span>
              <span className="text-[11px] text-[var(--sv-text-soft)] mt-1 leading-snug">{t.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-[var(--sv-card-tint)] border border-[var(--sv-primary)]/20 rounded-xl text-[12px] text-[var(--sv-text-soft)] max-w-sm mx-auto mb-6 text-left">
        <span className="font-semibold text-[var(--sv-primary-deep)]">Module 02 Sequence Note:</span> Real CSS variable switching and soundscape wiring are specified in Module 04.
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => router.push("/first-game")}
          className="w-full h-12 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[15px] hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Choose Theme & Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => router.push("/first-game")}
          className="text-[13px] text-[var(--sv-text-soft)] hover:text-[var(--sv-primary-deep)] transition-colors py-2 cursor-pointer"
        >
          Skip (dev only)
        </button>
      </div>
    </div>
  );
}

