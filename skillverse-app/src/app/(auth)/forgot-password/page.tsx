"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, AlertTriangle, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth/authClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      await authClient.forgotPassword(email.trim().toLowerCase());
      setSubmitted(true);
    } catch (err: any) {
      // Still show submitted per anti-enumeration rule unless network failure
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-full bg-[var(--sv-card-tint)] text-[var(--sv-primary-deep)] flex items-center justify-center mx-auto mb-4 border border-[var(--sv-secondary)]/20 shadow-sm">
          <Mail className="w-6 h-6" />
        </div>

        <h2 className="font-heading font-bold text-[24px] sm:text-[28px] text-[var(--sv-text)] tracking-tight">
          Check your email
        </h2>

        <p className="text-[14px] sm:text-[15px] text-[var(--sv-text-soft)] mt-2 leading-relaxed">
          If an account exists for that email, we&apos;ve sent a password reset link.
        </p>

        <p className="text-[12px] text-[var(--sv-text-soft)]/80 mt-3 italic">
          Didn&apos;t get it? Check spam, or try again in a minute.
        </p>

        <div className="mt-6">
          <Link
            href="/login"
            className="w-full h-12 rounded-full border-2 border-[var(--sv-primary-deep)] text-[var(--sv-primary-deep)] font-bold text-[15px] hover:bg-[var(--sv-primary-deep)] hover:text-white transition-all flex items-center justify-center"
          >
            Back to Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading font-bold text-[24px] sm:text-[28px] text-[var(--sv-text)] tracking-tight">
          Reset your password
        </h2>
        <p className="text-[14px] text-[var(--sv-text-soft)] mt-1.5 leading-normal">
          Enter the email on your account and we&apos;ll send you a reset link.
        </p>
      </div>

      {error && (
        <div className="bg-[var(--sv-warning)]/15 border border-[var(--sv-warning)]/40 rounded-xl p-3 flex items-start gap-2.5 mb-5 text-[13px] text-[var(--sv-text)]">
          <AlertTriangle className="w-4 h-4 text-[var(--sv-warning)] shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-[var(--sv-text)] mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="guardian@example.com"
            disabled={isLoading}
            className={`w-full h-12 px-3.5 rounded-xl border text-[15px] bg-white text-[var(--sv-text)] placeholder:text-[var(--sv-text-soft)]/60 focus:outline-none focus:border-[var(--sv-primary)] focus:ring-3 focus:ring-[var(--sv-primary)]/15 transition-all ${
              error ? "border-[var(--sv-warning)]" : "border-[rgba(107,113,145,0.25)]"
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[16px] hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending Link...</span>
            </div>
          ) : (
            "Send Reset Link"
          )}
        </button>

        <div className="text-center pt-3">
          <Link
            href="/login"
            className="text-[14px] text-[var(--sv-primary-deep)] hover:underline font-medium"
          >
            Remembered it? Log in
          </Link>
        </div>
      </form>
    </div>
  );
}
