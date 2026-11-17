"use client";

import React, { useState } from "react";
import { Check, AlertTriangle } from "lucide-react";

export interface BasicInfoData {
  nickname: string;
  age: number | "";
  interests: string[];
}

export const INTEREST_CHIPS = [
  { id: "space", label: "🚀 Space" },
  { id: "dinosaurs", label: "🦕 Dinosaurs" },
  { id: "animals", label: "🐾 Animals" },
  { id: "art", label: "🎨 Art & Drawing" },
  { id: "music", label: "🎵 Music" },
  { id: "sports", label: "⚽ Sports" },
  { id: "cars", label: "🚗 Cars & Trucks" },
  { id: "superheroes", label: "🦸 Superheroes" },
  { id: "princesses_fairytales", label: "🏰 Princesses & Fairytales" },
  { id: "building_blocks", label: "🧱 Building & Blocks" },
  { id: "nature_bugs", label: "🐛 Nature & Bugs" },
  { id: "reading_stories", label: "📚 Reading & Stories" },
] as const;

interface BasicInfoStepProps {
  data: BasicInfoData;
  onChange: (updates: Partial<BasicInfoData>) => void;
  showErrors?: boolean;
}

export function BasicInfoStep({ data, onChange, showErrors }: BasicInfoStepProps) {
  const [chipLimitNotice, setChipLimitNotice] = useState(false);

  const trimmedNickname = data.nickname.trim();
  const isNicknameValid = trimmedNickname.length >= 2 && trimmedNickname.length <= 20;
  const isAgeValid = typeof data.age === "number" && data.age >= 6 && data.age <= 17;
  const isInterestsValid = data.interests.length >= 1 && data.interests.length <= 5;

  const toggleInterest = (id: string) => {
    if (data.interests.includes(id)) {
      setChipLimitNotice(false);
      onChange({ interests: data.interests.filter((i) => i !== id) });
    } else {
      if (data.interests.length >= 5) {
        setChipLimitNotice(true);
        return;
      }
      setChipLimitNotice(false);
      onChange({ interests: [...data.interests, id] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-[22px] sm:text-[24px] text-[var(--sv-text)] tracking-tight">
          Let&apos;s start with the basics
        </h2>
        <p className="text-[14px] text-[var(--sv-text-soft)] mt-1">
          Tell us about the hero of this adventure.
        </p>
      </div>

      {/* Nickname Field */}
      <div>
        <label
          htmlFor="child-nickname"
          className="block text-[13px] font-semibold text-[var(--sv-text)] mb-1.5"
        >
          What should we call your child in the app?
        </label>
        <input
          id="child-nickname"
          type="text"
          value={data.nickname}
          onChange={(e) => onChange({ nickname: e.target.value })}
          placeholder="e.g. Leo"
          maxLength={25}
          className={`w-full h-12 px-4 rounded-xl border text-[15px] text-[var(--sv-text)] placeholder:text-[var(--sv-text-soft)]/60 focus:outline-none transition-all ${
            showErrors && !isNicknameValid
              ? "border-[var(--sv-warning)] focus:ring-2 focus:ring-[var(--sv-warning)]/20"
              : "border-[var(--sv-text-soft)]/25 focus:border-[var(--sv-primary)] focus:ring-4 focus:ring-[var(--sv-primary)]/15"
          }`}
        />
        {showErrors && !isNicknameValid && (
          <p className="flex items-center gap-1.5 mt-1.5 text-[13px] text-[var(--sv-warning)]" role="alert">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Please enter a nickname (2–20 characters).</span>
          </p>
        )}
      </div>

      {/* Age Field */}
      <div>
        <label
          htmlFor="child-age"
          className="block text-[13px] font-semibold text-[var(--sv-text)] mb-1.5"
        >
          How old are they?
        </label>
        <select
          id="child-age"
          value={data.age}
          onChange={(e) => onChange({ age: e.target.value ? Number(e.target.value) : "" })}
          className={`w-full h-12 px-4 rounded-xl border text-[15px] bg-white text-[var(--sv-text)] focus:outline-none transition-all cursor-pointer ${
            showErrors && !isAgeValid
              ? "border-[var(--sv-warning)] focus:ring-2 focus:ring-[var(--sv-warning)]/20"
              : "border-[var(--sv-text-soft)]/25 focus:border-[var(--sv-primary)] focus:ring-4 focus:ring-[var(--sv-primary)]/15"
          }`}
        >
          <option value="" disabled>
            Select age
          </option>
          {Array.from({ length: 12 }, (_, i) => i + 6).map((age) => (
            <option key={age} value={age}>
              {age} years old
            </option>
          ))}
        </select>
        {showErrors && !isAgeValid && (
          <p className="flex items-center gap-1.5 mt-1.5 text-[13px] text-[var(--sv-warning)]" role="alert">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Please select your child&apos;s age (6–17).</span>
          </p>
        )}
      </div>

      {/* Interests Chips */}
      <div>
        <label className="block text-[13px] font-semibold text-[var(--sv-text)] mb-1.5">
          What do they love? <span className="text-[12px] font-normal text-[var(--sv-text-soft)]">(pick 1–5)</span>
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          {INTEREST_CHIPS.map((chip) => {
            const isSelected = data.interests.includes(chip.id);
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => toggleInterest(chip.id)}
                className={`h-10 px-4 rounded-full text-[14px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-[var(--sv-primary)] text-white shadow-sm ring-2 ring-[var(--sv-primary)]/20"
                    : "bg-white border border-[var(--sv-text-soft)]/25 text-[var(--sv-text)] hover:border-[var(--sv-primary)]/50"
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {chipLimitNotice && (
          <p className="text-[12px] text-[var(--sv-warning)] mt-2 font-medium">
            You can pick up to 5.
          </p>
        )}

        {showErrors && !isInterestsValid && (
          <p className="flex items-center gap-1.5 mt-2 text-[13px] text-[var(--sv-warning)]" role="alert">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Pick at least one thing they love.</span>
          </p>
        )}
      </div>
    </div>
  );
}

