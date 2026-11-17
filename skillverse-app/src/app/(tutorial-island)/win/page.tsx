"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Star, ArrowRight, Loader2, Award } from "lucide-react";
import { childrenClient } from "@/lib/children/childrenClient";

export default function WinPage() {
  const router = useRouter();
  const [childId, setChildId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("Hero");
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    childrenClient.getMyChild().then((state) => {
      if (state?.child) {
        setChildId(state.child.id);
        setNickname(state.child.nickname);
      }
    });
  }, []);

  const handleFinish = async () => {
    setIsFinishing(true);
    if (childId) {
      try {
        await childrenClient.completeTutorial(childId);
      } catch {
        // Complete-tutorial is idempotent, proceed to hub
      }
    }
    router.push("/hub");
  };

  return (
    <div className="text-center py-6">
      {/* Gentle Celebration Star Burst */}
      <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[var(--sv-attention)]/20 animate-pulse" />
        <div className="w-20 h-20 rounded-full bg-[var(--sv-attention)]/30 flex items-center justify-center text-4xl shadow-md border border-[var(--sv-attention)]/40 animate-float-bob">
          ⭐
        </div>
      </div>

      <span className="text-[12px] font-bold text-[var(--sv-primary-deep)] uppercase tracking-wider bg-[var(--sv-primary)]/10 px-3 py-1 rounded-full">
        Tutorial Complete
      </span>

      <h1 className="font-heading font-bold text-[32px] sm:text-[38px] text-[var(--sv-text)] tracking-tight mt-3">
        You did it!
      </h1>

      <p className="text-[15px] sm:text-[16px] text-[var(--sv-text-soft)] mt-2 max-w-md mx-auto leading-relaxed">
        You earned your first stars and met your companion friend!
      </p>

      {/* Reward Summary Pill */}
      <div className="inline-flex items-center gap-3 bg-[var(--sv-card-tint)] border border-[var(--sv-primary)]/30 rounded-2xl px-6 py-3 my-6 shadow-sm">
        <div className="flex items-center gap-1.5 font-heading font-bold text-[18px] text-[var(--sv-primary-deep)]">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span>+3 Stars</span>
        </div>
        <span className="text-[var(--sv-text-soft)]">•</span>
        <div className="flex items-center gap-1.5 font-heading font-bold text-[16px] text-[var(--sv-text)]">
          <Award className="w-5 h-5 text-[var(--sv-primary)]" />
          <span>Explorer Badge</span>
        </div>
      </div>

      <div className="max-w-sm mx-auto mt-2">
        <button
          type="button"
          onClick={handleFinish}
          disabled={isFinishing}
          className="w-full h-14 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[17px] hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isFinishing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Entering the Hub...</span>
            </>
          ) : (
            <>
              <span>Go to your Hub</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

