import React from "react";
import Link from "next/link";
import { Info, ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="py-2">
      {/* Honesty Banner */}
      <div className="bg-[var(--sv-card-tint)] border border-[var(--sv-secondary)]/20 rounded-xl p-3.5 mb-5 flex items-start gap-2.5 text-[13px] text-[var(--sv-text)]">
        <Info className="w-4 h-4 text-[var(--sv-primary-deep)] shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          This is a placeholder page for the prototype phase. A real Privacy Policy and Terms of
          Service will be published before any public launch.
        </span>
      </div>

      <h2 className="font-heading font-bold text-[24px] sm:text-[28px] text-[var(--sv-text)] tracking-tight mb-3">
        Terms of Service
      </h2>

      <p className="text-[14px] text-[var(--sv-text-soft)] leading-relaxed mb-6">
        Skillverse is an early prototype designed to assist children with neurodevelopmental
        differences through interactive play. During this prototype phase, no commercial warranties
        apply. All user progress data is stored locally and securely in compliance with prototype
        guidelines.
      </p>

      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--sv-primary-deep)] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
