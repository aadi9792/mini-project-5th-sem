"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Heart } from "lucide-react";

const COMPANIONS = [
  { id: "robot", name: "Beep", emoji: "🤖", blurb: "Calm, thoughtful, loves puzzles and organizing." },
  { id: "dragon", name: "Spark", emoji: "🐲", blurb: "Energetic, brave, learns to cool down big feelings." },
  { id: "owl", name: "Hoot", emoji: "🦉", blurb: "Gentle listener, observant, loves quiet routines." },
];

export default function CompanionPickerPlaceholderPage() {
  const router = useRouter();
  const [selectedCompanion, setSelectedCompanion] = useState("robot");

  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-full bg-[var(--sv-card-tint)] border border-[var(--sv-secondary)]/30 flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm animate-float-bob">
        <Heart className="w-8 h-8 text-[var(--sv-primary-deep)] fill-[var(--sv-primary-deep)]/20" />
      </div>

      <span className="text-[12px] font-bold text-[var(--sv-primary-deep)] uppercase tracking-wider bg-[var(--sv-primary)]/10 px-3 py-1 rounded-full">
        Tutorial Island • Step 3
      </span>

      <h1 className="font-heading font-bold text-[26px] sm:text-[30px] text-[var(--sv-text)] tracking-tight mt-3">
        Meet your Companion!
      </h1>

      <p className="text-[14px] text-[var(--sv-text-soft)] mt-1.5 max-w-md mx-auto">
        Your companion friend travels beside you, helps with big feelings, and celebrates every win.
      </p>

      {/* 3 Starter Companions preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 max-w-md mx-auto">
        {COMPANIONS.map((c) => {
          const isSelected = selectedCompanion === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCompanion(c.id)}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-[var(--sv-card-tint)] border-2 border-[var(--sv-primary)] shadow-md ring-2 ring-[var(--sv-primary)]/20"
                  : "bg-white border border-[var(--sv-text-soft)]/20 hover:border-[var(--sv-primary)]/40"
              }`}
            >
              <span className="text-4xl mb-2">{c.emoji}</span>
              <span className="font-heading font-bold text-[16px] text-[var(--sv-text)]">{c.name}</span>
              <span className="text-[11px] text-[var(--sv-text-soft)] mt-1 leading-snug">{c.blurb}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-[var(--sv-card-tint)] border border-[var(--sv-primary)]/20 rounded-xl text-[12px] text-[var(--sv-text-soft)] max-w-sm mx-auto mb-6 text-left">
        <span className="font-semibold text-[var(--sv-primary-deep)]">Module 02 Sequence Note:</span> Full naming and behavioral engine for companions is specified in Module 03.
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => router.push("/theme")}
          className="w-full h-12 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[15px] hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Choose Companion & Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => router.push("/theme")}
          className="text-[13px] text-[var(--sv-text-soft)] hover:text-[var(--sv-primary-deep)] transition-colors py-2 cursor-pointer"
        >
          Skip (dev only)
        </button>
      </div>
    </div>
  );
}

