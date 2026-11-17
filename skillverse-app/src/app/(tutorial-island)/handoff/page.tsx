"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Smartphone, Loader2 } from "lucide-react";
import { childrenClient } from "@/lib/children/childrenClient";

export default function HandoffPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState<string>("Hero");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    childrenClient
      .getMyChild()
      .then((state) => {
        if (!state?.child) {
          router.replace("/create-profile");
          return;
        }
        if (state.tutorialCompleted) {
          router.replace("/continue-as");
          return;
        }
        setNickname(state.child.nickname || "Hero");
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--sv-primary)] mx-auto mb-3" />
        <p className="text-[14px] text-[var(--sv-text-soft)]">Preparing Tutorial Island...</p>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      {/* Device handoff illustration icon badge */}
      <div className="w-20 h-20 rounded-full bg-[var(--sv-card-tint)] border border-[var(--sv-secondary)]/30 text-[var(--sv-primary-deep)] flex items-center justify-center mx-auto mb-6 shadow-sm animate-float-bob">
        <Smartphone className="w-9 h-9 stroke-[2.2]" />
      </div>

      <span className="text-[12px] font-bold text-[var(--sv-primary-deep)] uppercase tracking-wider bg-[var(--sv-primary)]/10 px-3 py-1 rounded-full">
        Tutorial Island • Step 1
      </span>

      <h1 className="font-heading font-bold text-[26px] sm:text-[32px] text-[var(--sv-text)] tracking-tight mt-4">
        Time to meet your adventure, {nickname}!
      </h1>

      <p className="text-[15px] sm:text-[16px] text-[var(--sv-text-soft)] mt-3 max-w-md mx-auto leading-relaxed">
        Hand the device to {nickname} — let&apos;s get started.
      </p>

      <div className="mt-8 max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => router.push("/avatar")}
          className="w-full h-14 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[17px] hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Start</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

