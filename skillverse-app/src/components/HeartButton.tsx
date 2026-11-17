"use client";

import React, { useState, useEffect } from "react";
import { Heart, X, Wind, Volume2, Users, VolumeX, Check } from "lucide-react";
import { companionsClient, ZoneCheckInResponse } from "@/lib/companions/companionsClient";
import { soundEngine } from "@/lib/sound/soundService";

const ZONES = [
  { id: "calm", label: "Calm", emoji: "😌" },
  { id: "okay", label: "Okay", emoji: "🙂" },
  { id: "worried", label: "Worried", emoji: "😟" },
  { id: "big_feelings", label: "Big Feelings", emoji: "🌋" },
] as const;

const QUIET_SOUNDS = [
  { id: "rain", label: "Rain", emoji: "🌧️" },
  { id: "ocean-waves", label: "Ocean Waves", emoji: "🌊" },
  { id: "gentle-wind", label: "Gentle Wind", emoji: "🍃" },
  { id: "white-noise", label: "White Noise", emoji: "🤍" },
] as const;

export function HeartButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"checkin" | "tools">("checkin");
  const [checkInResult, setCheckInResult] = useState<ZoneCheckInResponse | null>(null);
  const [activeSound, setActiveSound] = useState<string | null>(null);

  // Breathing circle phase: "in" (4s) | "hold" (4s) | "out" (4s)
  const [breathPhase, setBreathPhase] = useState<"Breathe In" | "Hold" | "Breathe Out">("Breathe In");

  useEffect(() => {
    if (!isOpen) {
      soundEngine.stopQuietSound();
      setActiveSound(null);
      return;
    }

    const interval = setInterval(() => {
      setBreathPhase((prev) => {
        if (prev === "Breathe In") return "Hold";
        if (prev === "Hold") return "Breathe Out";
        return "Breathe In";
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleZoneSelect = async (zone: string) => {
    try {
      const res = await companionsClient.recordZoneCheckIn(zone);
      setCheckInResult(res);
      setActiveTab("tools");
    } catch {
      setActiveTab("tools");
    }
  };

  const handleToggleSound = (soundId: "rain" | "ocean-waves" | "gentle-wind" | "white-noise") => {
    if (activeSound === soundId) {
      soundEngine.stopQuietSound();
      setActiveSound(null);
    } else {
      soundEngine.playQuietSound(soundId);
      setActiveSound(soundId);
    }
  };

  const handleClose = () => {
    soundEngine.stopQuietSound();
    setActiveSound(null);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Heart Button (03 §3.8: fill is var(--sv-ink) for WCAG AA compliance) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open Calm Cove and Emotional Check-in"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[var(--sv-warning)] shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer ring-4 ring-white/80 dark:ring-[#1e2238]/80"
      >
        <Heart className="w-7 h-7 text-[var(--sv-ink)] fill-[var(--sv-ink)]" />
      </button>

      {/* Calm Cove Modal Sheet (03 §3.8: to-sv-card for Dark Mode support) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-card-enter">
          <div className="bg-gradient-to-b from-[var(--sv-bg-soft)] to-[var(--sv-card)] rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[var(--sv-primary)]/20 relative max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--sv-text-soft)]/15 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--sv-warning)]/20 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-[var(--sv-ink)] fill-[var(--sv-ink)]" />
                </div>
                <h2 className="font-heading font-bold text-xl text-[var(--sv-text)]">
                  Calm Cove
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-[var(--sv-card)] flex items-center justify-center text-[var(--sv-text-soft)] hover:text-[var(--sv-text)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Check-in or Companion Reaction Line */}
            {checkInResult && (
              <div className="mb-5 p-3.5 rounded-2xl bg-[var(--sv-card)] border border-[var(--sv-primary)]/25 shadow-sm text-center animate-card-enter">
                <span className="text-2xl mb-1 inline-block">
                  {checkInResult.mood === "happy" ? "😊" : checkInResult.mood === "concerned" ? "🤗" : "🤍"}
                </span>
                <p className="text-[14px] font-medium text-[var(--sv-text)] leading-snug">
                  &ldquo;{checkInResult.line}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCheckInResult(null);
                    setActiveTab("checkin");
                  }}
                  className="text-[12px] text-[var(--sv-primary-deep)] font-semibold hover:underline mt-2 inline-block cursor-pointer"
                >
                  Check in again
                </button>
              </div>
            )}

            {/* Step 1: Zone Check-in */}
            {!checkInResult && activeTab === "checkin" && (
              <div className="mb-6">
                <h3 className="font-heading font-bold text-[16px] text-[var(--sv-text)] text-center mb-1">
                  How are you feeling right now?
                </h3>
                <p className="text-[13px] text-[var(--sv-text-soft)] text-center mb-4">
                  Tap what matches your body and feelings.
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  {ZONES.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => handleZoneSelect(z.id)}
                      className="p-3.5 rounded-2xl bg-[var(--sv-card)] border border-[var(--sv-text-soft)]/20 hover:border-[var(--sv-primary)]/50 hover:shadow-sm flex items-center gap-3 transition-all cursor-pointer"
                    >
                      <span className="text-2xl">{z.emoji}</span>
                      <span className="font-heading font-bold text-[15px] text-[var(--sv-text)]">
                        {z.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("tools")}
                    className="text-[13px] text-[var(--sv-text-soft)] hover:text-[var(--sv-primary-deep)] hover:underline cursor-pointer"
                  >
                    Go straight to calming tools
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Calm Cove Calming Tools */}
            {(checkInResult || activeTab === "tools") && (
              <div className="space-y-5">
                {/* 1. Breathing Circle Tool */}
                <div className="bg-[var(--sv-card)] rounded-2xl p-5 border border-[var(--sv-text-soft)]/15 text-center shadow-sm">
                  <div className="flex items-center justify-center gap-1.5 text-[14px] font-heading font-bold text-[var(--sv-primary-deep)] mb-4">
                    <Wind className="w-4 h-4" />
                    <span>Gentle Breathing</span>
                  </div>

                  {/* Pulsing Breathing Visual */}
                  <div className="relative w-32 h-32 mx-auto flex items-center justify-center my-2">
                    <div
                      className={`absolute rounded-full transition-all duration-[3800ms] ease-in-out ${
                        breathPhase === "Breathe In"
                          ? "w-32 h-32 bg-[var(--sv-primary)]/20"
                          : breathPhase === "Hold"
                          ? "w-32 h-32 bg-[var(--sv-primary)]/30 ring-4 ring-[var(--sv-primary)]/20"
                          : "w-16 h-16 bg-[var(--sv-primary)]/15"
                      }`}
                    />
                    <div
                      className={`relative z-10 w-20 h-20 rounded-full bg-[var(--sv-primary-deep)] text-white font-heading font-bold text-[13px] flex items-center justify-center text-center shadow-md transition-transform duration-[3800ms] ${
                        breathPhase === "Breathe In" ? "scale-110" : breathPhase === "Breathe Out" ? "scale-90" : "scale-105"
                      }`}
                    >
                      {breathPhase}
                    </div>
                  </div>
                </div>

                {/* 2. Quiet Sounds (§3.8: 4 looping options) */}
                <div className="bg-[var(--sv-card)] rounded-2xl p-4 border border-[var(--sv-text-soft)]/15 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-[14px] font-heading font-bold text-[var(--sv-primary-deep)]">
                      <Volume2 className="w-4 h-4" />
                      <span>Quiet Sounds</span>
                    </div>
                    {activeSound && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.stopQuietSound();
                          setActiveSound(null);
                        }}
                        className="text-[12px] text-[var(--sv-warning)] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Stop</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {QUIET_SOUNDS.map((s) => {
                      const isPlaying = activeSound === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleToggleSound(s.id)}
                          className={`h-11 px-3 rounded-xl border flex items-center justify-between text-[13px] font-semibold transition-all cursor-pointer ${
                            isPlaying
                              ? "bg-[var(--sv-primary-deep)] text-white border-[var(--sv-primary-deep)] shadow-sm"
                              : "bg-[var(--sv-card-tint)] text-[var(--sv-text)] border-[var(--sv-text-soft)]/15 hover:border-[var(--sv-primary)]"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{s.emoji}</span>
                            <span>{s.label}</span>
                          </div>
                          {isPlaying && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Ask a Grown-Up */}
                <div className="bg-[var(--sv-card)] rounded-2xl p-4 border border-[var(--sv-text-soft)]/15 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[var(--sv-secondary)]/20 text-[var(--sv-secondary-deep)] flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-[14px] text-[var(--sv-text)]">
                      Ask a Grown-Up
                    </h4>
                    <p className="text-[12px] text-[var(--sv-text-soft)] leading-snug">
                      It is always okay to pause your game and ask for a hug or a helping hand.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

