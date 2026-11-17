"use client";

import React from "react";
import { Edit3, CheckCircle } from "lucide-react";
import { BasicInfoData, INTEREST_CHIPS } from "./BasicInfoStep";
import { QuestionConfig } from "./QuestionStep";

interface ReviewStepProps {
  basicInfo: BasicInfoData;
  preferences: Record<string, any>;
  questionConfigs: QuestionConfig[];
  onEditStep: (stepNumber: number) => void;
}

export function ReviewStep({
  basicInfo,
  preferences,
  questionConfigs,
  onEditStep,
}: ReviewStepProps) {
  const getInterestLabels = () => {
    return basicInfo.interests
      .map((id) => INTEREST_CHIPS.find((c) => c.id === id)?.label || id)
      .join(", ");
  };

  const getAnswerLabel = (q: QuestionConfig) => {
    const raw = preferences[q.id];
    if (q.type === "single-select") {
      const opt = q.options.find((o) => o.value === raw);
      return opt ? opt.label : "Not selected";
    } else {
      const arr: string[] = Array.isArray(raw) ? raw : [];
      if (arr.length === 0) return "Not selected";
      return arr
        .map((val) => q.options.find((o) => o.value === val)?.label || val)
        .join(", ");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-[22px] sm:text-[24px] text-[var(--sv-text)] tracking-tight">
          Review {basicInfo.nickname}&apos;s profile
        </h2>
        <p className="text-[14px] text-[var(--sv-text-soft)] mt-1">
          Everything can be updated anytime from your Guardian Dashboard.
        </p>
      </div>

      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
        {/* Step 1 Basic Info Summary */}
        <div className="bg-[var(--sv-card-tint)] border border-[var(--sv-secondary)]/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading font-bold text-[15px] text-[var(--sv-primary-deep)]">
              Basic Information
            </h3>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="inline-flex items-center gap-1 text-[13px] text-[var(--sv-primary-deep)] font-semibold hover:underline cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
          <div className="text-[13px] text-[var(--sv-text)] space-y-1">
            <p>
              <span className="font-semibold text-[var(--sv-text-soft)]">Nickname:</span>{" "}
              {basicInfo.nickname}
            </p>
            <p>
              <span className="font-semibold text-[var(--sv-text-soft)]">Age:</span>{" "}
              {basicInfo.age} years old
            </p>
            <p>
              <span className="font-semibold text-[var(--sv-text-soft)]">Interests:</span>{" "}
              {getInterestLabels()}
            </p>
          </div>
        </div>

        {/* Steps 2-7 Questions Summary */}
        {[
          { step: 2, label: "Sensory & Motion", qIndices: [0, 1] },
          { step: 3, label: "Transitions & Focus", qIndices: [2, 3] },
          { step: 4, label: "Social & Regulation", qIndices: [4, 5] },
          { step: 5, label: "Check-ins & Instructions", qIndices: [6, 7] },
          { step: 6, label: "Guidance & Predictability", qIndices: [8, 9] },
          { step: 7, label: "Motor Skills & Focus Areas", qIndices: [10, 11] },
        ].map((group) => (
          <div
            key={group.step}
            className="bg-[var(--sv-card-tint)] border border-[var(--sv-secondary)]/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading font-bold text-[15px] text-[var(--sv-primary-deep)]">
                {group.label}
              </h3>
              <button
                type="button"
                onClick={() => onEditStep(group.step)}
                className="inline-flex items-center gap-1 text-[13px] text-[var(--sv-primary-deep)] font-semibold hover:underline cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
            <div className="text-[13px] text-[var(--sv-text)] space-y-2">
              {group.qIndices.map((idx) => {
                const q = questionConfigs[idx];
                if (!q) return null;
                const shortQuestion = q.question.replace(/\{nickname\}/g, basicInfo.nickname);
                return (
                  <div key={q.id}>
                    <p className="font-semibold text-[var(--sv-text-soft)] text-[12px] leading-tight">
                      {shortQuestion}
                    </p>
                    <p className="mt-0.5 font-medium">{getAnswerLabel(q)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

