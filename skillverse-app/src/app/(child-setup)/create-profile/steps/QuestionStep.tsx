"use client";

import React, { useState } from "react";
import { Check, AlertTriangle } from "lucide-react";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionConfig {
  id: string;
  question: string;
  type: "single-select" | "multi-select";
  maxSelect?: number;
  minSelect?: number;
  limitMessage?: string;
  options: QuestionOption[];
}

interface QuestionStepProps {
  nickname: string;
  questions: QuestionConfig[];
  answers: Record<string, any>;
  onChange: (id: string, value: any) => void;
  showErrors?: boolean;
}

export function QuestionStep({
  nickname,
  questions,
  answers,
  onChange,
  showErrors,
}: QuestionStepProps) {
  const [limitNotices, setLimitNotices] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-8">
      {questions.map((q) => {
        const title = q.question.replace(/\{nickname\}/g, nickname || "your child");
        const answer = answers[q.id];

        let hasError = false;
        let errorMessage = "Please choose an option to continue.";

        if (q.type === "single-select") {
          hasError = showErrors ? !answer : false;
        } else {
          const selected = Array.isArray(answer) ? answer : [];
          hasError = showErrors ? selected.length < (q.minSelect || 1) : false;
          if (q.id === "q6RegulationStrategy") {
            errorMessage = "Pick at least one option.";
          }
        }

        return (
          <div key={q.id} className="space-y-3">
            <h3 className="font-heading font-bold text-[16px] sm:text-[17px] text-[var(--sv-text)] leading-snug">
              {title}
            </h3>

            {q.type === "single-select" ? (
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const isSelected = answer === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onChange(q.id, opt.value)}
                      className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? "border-2 border-[var(--sv-primary)] bg-[var(--sv-card-tint)] shadow-sm"
                          : "border border-[var(--sv-text-soft)]/20 bg-white hover:border-[var(--sv-primary)]/40"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? "border-[var(--sv-primary)] bg-[var(--sv-primary)]"
                            : "border-[var(--sv-text-soft)]/40 bg-white"
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-[14px] leading-tight ${isSelected ? "font-semibold text-[var(--sv-text)]" : "text-[var(--sv-text)]"}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {q.options.map((opt) => {
                    const selectedList: string[] = Array.isArray(answer) ? answer : [];
                    const isSelected = selectedList.includes(opt.value);

                    const toggle = () => {
                      if (isSelected) {
                        setLimitNotices((prev) => ({ ...prev, [q.id]: false }));
                        onChange(
                          q.id,
                          selectedList.filter((v) => v !== opt.value),
                        );
                      } else {
                        if (q.maxSelect && selectedList.length >= q.maxSelect) {
                          setLimitNotices((prev) => ({ ...prev, [q.id]: true }));
                          return;
                        }
                        setLimitNotices((prev) => ({ ...prev, [q.id]: false }));
                        onChange(q.id, [...selectedList, opt.value]);
                      }
                    };

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={toggle}
                        className={`h-10 px-4 rounded-full text-[14px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-[var(--sv-primary)] text-white shadow-sm ring-2 ring-[var(--sv-primary)]/20"
                            : "bg-white border border-[var(--sv-text-soft)]/25 text-[var(--sv-text)] hover:border-[var(--sv-primary)]/50"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {limitNotices[q.id] && q.limitMessage && (
                  <p className="text-[12px] text-[var(--sv-warning)] mt-2 font-medium">
                    {q.limitMessage}
                  </p>
                )}
              </div>
            )}

            {hasError && (
              <p className="flex items-center gap-1.5 mt-2 text-[13px] text-[var(--sv-warning)]" role="alert">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

