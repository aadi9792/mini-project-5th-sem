"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Check, AlertTriangle, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth/authClient";

function VerifyPendingContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const devTokenParam = searchParams.get("devToken");

  const [email, setEmail] = useState<string>("");
  const [devToken, setDevToken] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(60);
  const [resendStatus, setResendStatus] = useState<string>("");
  const [isResending, setIsResending] = useState<boolean>(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    } else if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("sv_pending_verify_email");
      if (stored) setEmail(stored);
    }

    if (devTokenParam) {
      setDevToken(devTokenParam);
    } else if (typeof window !== "undefined") {
      const storedToken = sessionStorage.getItem("sv_dev_token");
      if (storedToken) setDevToken(storedToken);
    }
  }, [emailParam, devTokenParam]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0 || !email || isResending) return;

    setIsResending(true);
    setResendStatus("");

    try {
      const res = await authClient.resendVerification(email);
      setCountdown(60);
      setResendStatus("Verification email sent!");

      if (res.devVerificationToken) {
        setDevToken(res.devVerificationToken);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("sv_dev_token", res.devVerificationToken);
        }
      }
    } catch (err: any) {
      setResendStatus(err.message || "Failed to resend. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="text-center py-2">
      <div className="w-14 h-14 rounded-full bg-[var(--sv-card-tint)] text-[var(--sv-primary-deep)] flex items-center justify-center mx-auto mb-4 border border-[var(--sv-secondary)]/20 shadow-sm">
        <Mail className="w-6 h-6" />
      </div>

      <h2 className="font-heading font-bold text-[24px] sm:text-[28px] text-[var(--sv-text)] tracking-tight">
        Check your email
      </h2>

      <p className="text-[14px] sm:text-[15px] text-[var(--sv-text-soft)] mt-2 leading-relaxed">
        We&apos;ve sent a verification link to{" "}
        <strong className="text-[var(--sv-text)] break-all">{email || "your email"}</strong>.
        Click it to activate your account.
      </p>

      {/* Local Dev Instant Verification Box */}
      {devToken && (
        <div className="bg-[var(--sv-card-tint)] border border-[var(--sv-primary)]/35 rounded-2xl p-4 my-5 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-[12px] font-bold text-[var(--sv-primary-deep)] uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Local Dev Verification</span>
          </div>
          <p className="text-[13px] text-[var(--sv-text-soft)] mb-3">
            Since Resend is running in dev simulation mode, you can verify directly:
          </p>
          <Link
            href={`/verify-email?token=${encodeURIComponent(devToken)}`}
            className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-full bg-[var(--sv-primary-deep)] text-white text-[14px] font-bold hover:brightness-105 transition-all shadow-sm"
          >
            <span>Click to Verify Instantly</span>
          </Link>
        </div>
      )}

      {resendStatus && (
        <div className="bg-[var(--sv-card-tint)] border border-[var(--sv-primary)]/20 text-[var(--sv-text)] rounded-xl p-2.5 text-[13px] my-4 flex items-center justify-center gap-1.5">
          {resendStatus.includes("sent") ? (
            <Check className="w-4 h-4 text-[var(--sv-primary-deep)]" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[var(--sv-warning)]" />
          )}
          <span>{resendStatus}</span>
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0 || isResending}
          className="w-full h-12 rounded-full border-2 border-[var(--sv-primary-deep)] text-[var(--sv-primary-deep)] font-bold text-[15px] hover:bg-[var(--sv-primary-deep)] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {countdown > 0 ? `Resend in ${countdown}s` : "Resend email"}
        </button>
      </div>

      <div className="mt-4 text-[13px] text-[var(--sv-text-soft)]">
        Wrong email?{" "}
        <Link
          href="/signup"
          className="text-[var(--sv-primary-deep)] font-semibold hover:underline"
        >
          Go back
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPendingPage() {
  return (
    <Suspense fallback={<div className="text-center p-6 text-[var(--sv-text-soft)]">Loading...</div>}>
      <VerifyPendingContent />
    </Suspense>
  );
}
