"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Trophy, Play, Star } from "lucide-react";
import { childrenClient } from "@/lib/children/childrenClient";

export default function FirstMiniGamePlaceholderPage() {
  const router = useRouter();
  const [recommendedWorld, setRecommendedWorld] = useState<string>("time");
  const [childName, setChildName] = useState<string>("Hero");

  useEffect(() => {
    childrenClient.getMyChild().then((state) => {
      if (state?.child) {
        setChildName(state.child.nickname);
        childrenClient
          .getDerivedPreferences(state.child.id)
          .then((derived) => {
            if (derived.recommendedWorldOrder?.[0]) {
              setRecommendedWorld(derived.recommendedWorldOrder[0]);
            }
          })
          .catch(() => {});
      }
    });
  }, []);

  const worldDetails: Record<string, { title: string; game: string; emoji: string }> = {
    time: { title: "Time Island", game: "Launch Challenge", emoji: "🚀" },
    feelings: { title: "Volcano Valley", game: "Calm the Volcano", emoji: "🌋" },
    faces: { title: "Expression Bay", game: "Face Detective", emoji: "🎭" },
  };

  const currentWorld = worldDetails[recommendedWorld] || worldDetails.time;

  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-full bg-[var(--sv-card-tint)] border border-[var(--sv-secondary)]/30 flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm animate-float-bob">
        <Trophy className="w-8 h-8 text-[var(--sv-primary-deep)]" />
      </div>

      <span className="text-[12px] font-bold text-[var(--sv-primary-deep)] uppercase tracking-wider bg-[var(--sv-primary)]/10 px-3 py-1 rounded-full">
        Tutorial Island • Step 5
      </span>

      <h1 className="font-heading font-bold text-[26px] sm:text-[30px] text-[var(--sv-text)] tracking-tight mt-3">
        Your First Mini-Game!
      </h1>

      <p className="text-[14px] text-[var(--sv-text-soft)] mt-1.5 max-w-md mx-auto">
        Every hero takes on their first mini-game quest to earn their first stars and prepare for the Hub.
      </p>

      {/* Recommended Game Card */}
      <div className="bg-[var(--sv-card-tint)] border border-[var(--sv-primary)]/30 rounded-2xl p-5 my-6 max-w-sm mx-auto text-left space-y-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{currentWorld.emoji}</span>
          <div>
            <h3 className="font-heading font-bold text-lg text-[var(--sv-text)]">
              {currentWorld.game}
            </h3>
            <p className="text-[12px] text-[var(--sv-text-soft)]">
              {currentWorld.title} • Easy Mode
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-[var(--sv-text-soft)]/10 text-[13px] text-[var(--sv-text)]">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Reward: <strong>3 Stars</strong> + First Win Badge</span>
        </div>
      </div>

      <div className="p-3 bg-[var(--sv-card-tint)] border border-[var(--sv-primary)]/20 rounded-xl text-[12px] text-[var(--sv-text-soft)] max-w-sm mx-auto mb-6 text-left">
        <span className="font-semibold text-[var(--sv-primary-deep)]">Module 02 Sequence Note:</span> The full mini-game engine, sound effects, and round loops are built in Module 07.
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => router.push("/win")}
          className="w-full h-12 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[15px] hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Complete Game & Win</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/win")}
          className="text-[13px] text-[var(--sv-text-soft)] hover:text-[var(--sv-primary-deep)] transition-colors py-2 cursor-pointer"
        >
          Skip (dev only)
        </button>
      </div>
    </div>
  );
}

