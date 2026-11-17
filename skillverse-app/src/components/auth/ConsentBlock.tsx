"use client";

import React from "react";
import { Check } from "lucide-react";

export interface ConsentState {
  confirmedGuardianStatus: boolean;
  dataStorageConsent: boolean;
  nonMedicalDeviceAck: boolean;
  marketingOptIn: boolean;
}

interface ConsentBlockProps {
  values: ConsentState;
  onChange: (key: keyof ConsentState, value: boolean) => void;
  errors?: Partial<Record<keyof ConsentState, string>>;
}

export function ConsentBlock({ values, onChange, errors }: ConsentBlockProps) {
  const items: Array<{
    key: keyof ConsentState;
    label: string;
    required: boolean;
  }> = [
    {
      key: "confirmedGuardianStatus",
      label:
        "I confirm I am the parent or legal guardian of the child who will use this account.",
      required: true,
    },
    {
      key: "dataStorageConsent",
      label:
        "I consent to Skillverse storing my child's profile and preference information to personalize their experience.",
      required: true,
    },
    {
      key: "nonMedicalDeviceAck",
      label:
        "I understand Skillverse does not collect or store any medical diagnosis, and this app is not a medical device.",
      required: true,
    },
    {
      key: "marketingOptIn",
      label: "Send me occasional email updates about new features.",
      required: false,
    },
  ];

  return (
    <div className="bg-[var(--sv-card-tint)] rounded-2xl p-4 my-5 border border-[var(--sv-secondary)]/15 space-y-3.5">
      {items.map((item) => {
        const checked = values[item.key];
        const hasError = !!errors?.[item.key];

        return (
          <div key={item.key} className="flex items-start gap-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => onChange(item.key, !checked)}
              className={`w-5 h-5 rounded-md border mt-0.5 shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                checked
                  ? "bg-[var(--sv-primary)] border-[var(--sv-primary)] text-white"
                  : hasError
                  ? "border-[var(--sv-warning)] bg-white"
                  : "border-[var(--sv-text-soft)] bg-white hover:border-[var(--sv-primary)]"
              }`}
            >
              {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
            <label
              onClick={() => onChange(item.key, !checked)}
              className="text-[13px] leading-relaxed text-[var(--sv-text)] select-none cursor-pointer"
            >
              {item.label}
              {item.required && <span className="text-[var(--sv-primary-deep)] ml-1 font-semibold">*</span>}
            </label>
          </div>
        );
      })}

      <p className="text-[12px] italic text-[var(--sv-text-soft)] pt-1 border-t border-[var(--sv-text-soft)]/10">
        This is a placeholder consent flow for the prototype, not a final legal agreement.
      </p>
    </div>
  );
}
