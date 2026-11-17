import React from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

export default function WelcomePage() {
  return (
    <AuthCard>
      <div className="text-center py-2">
        <h2 className="font-heading font-bold text-[24px] sm:text-[28px] text-[var(--sv-text)] tracking-tight">
          Turn everyday challenges into playable adventures.
        </h2>
        <p className="text-[15px] text-[var(--sv-text-soft)] mt-3 leading-relaxed">
          Skill-building games and calm routines designed for neurodivergent kids and their families.
        </p>

        {/* Action Buttons: Equal visual weight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8">
          <Link
            href="/login"
            className="h-12 rounded-full border-2 border-[var(--sv-primary-deep)] text-[var(--sv-primary-deep)] font-bold text-[16px] hover:bg-[var(--sv-primary-deep)] hover:text-white transition-all flex items-center justify-center shadow-sm"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="h-12 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[16px] hover:brightness-105 transition-all flex items-center justify-center shadow-sm"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}
