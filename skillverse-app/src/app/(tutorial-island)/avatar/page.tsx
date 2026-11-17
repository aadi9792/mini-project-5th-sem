"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Smile } from "lucide-react";

const AVATAR_OPTIONS = [
  { emoji: "😀", label: "Happy Explorer" },
  { emoji: "🐱", label: "Clever Cat" },
  { emoji: "🐻", label: "Brave Bear" },
  { emoji: "🦊", label: "Swift Fox" },
  { emoji: "🐶", label: "Loyal Pup" },
  { emoji: "🦄", label: "Magic Unicorn" },
];

export default function AvatarPickerPage() {
  const router = useRouter();
  const [selectedEmoji, setSelectedEmoji] = useState("😀");

  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-full bg-[var(--sv-card-tint)] border border-[var(--sv-secondary)]/30 flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm animate-float-bob">
        <Smile className="w-8 h-8 text-[var(--sv-primary-deep)]" />
      </div>

      <span className="text-[12px] font-bold text-[var(--sv-primary-deep)] uppercase tracking-wider bg-[var(--sv-primary)]/10 px-3 py-1 rounded-full">
        Tutorial Island • Step 2
      </span>

      <h1 className="font-heading font-bold text-[26px] sm:text-[30px] text-[var(--sv-text)] tracking-tight mt-3">
        Choose your hero face!
      </h1>

      <p className="text-[14px] text-[var(--sv-text-soft)] mt-1.5 max-w-md mx-auto">
        Pick your hero avatar. You can customize headwear and accessories in the shop later!
      </p>

      {/* 6 Emoji base faces grid */}
      <div className="grid grid-cols-3 gap-3 my-6 max-w-xs mx-auto">
        {AVATAR_OPTIONS.map((item) => {
          const isSelected = selectedEmoji === item.emoji;
          return (
            <button
              key={item.emoji}
              type="button"
              onClick={() => setSelectedEmoji(item.emoji)}
              className={`h-20 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-[var(--sv-card-tint)] border-2 border-[var(--sv-primary)] shadow-md scale-105 ring-2 ring-[var(--sv-primary)]/20"
                  : "bg-white border border-[var(--sv-text-soft)]/20 hover:border-[var(--sv-primary)]/40 hover:scale-102"
              }`}
            >
              <span className="text-3xl">{item.emoji}</span>
              <span className="text-[11px] text-[var(--sv-text-soft)] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dev notice banner per 02 §3.6 */}
      <div className="p-3 bg-[var(--sv-card-tint)] border border-[var(--sv-primary)]/20 rounded-xl text-[12px] text-[var(--sv-text-soft)] max-w-sm mx-auto mb-6 text-left">
        <span className="font-semibold text-[var(--sv-primary-deep)]">Module 02 Sequence Note:</span> Full shop economy and persistence for avatars will be wired in Module 09.
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => router.push("/companion")}
          className="w-full h-12 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[15px] hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Choose {selectedEmoji} & Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => router.push("/companion")}
          className="text-[13px] text-[var(--sv-text-soft)] hover:text-[var(--sv-primary-deep)] transition-colors py-2 cursor-pointer"
        >
          Skip (dev only)
        </button>
      </div>
    </div>
  );
}

