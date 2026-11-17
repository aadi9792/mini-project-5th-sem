"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth/authClient";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "expired">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("expired");
      setErrorMessage("No verification token found.");
      return;
    }

    let isMounted = true;

    authClient
      .verifyEmail(token)
      .then(() => {
        if (isMounted) setStatus("success");
      })
      .catch((err) => {
        if (isMounted) {
          setStatus("expired");
          setErrorMessage(err.message || "This verification link is invalid or expired.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (status === "loading") {
    return (
      <div className="text-center py-6">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--sv-primary)] mx-auto mb-3" />
        <p className="text-[15px] text-[var(--sv-text)] font-semibold">Verifying your email...</p>
        <p className="text-[13px] text-[var(--sv-text-soft)] mt-1">Please wait a moment.</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-full bg-[var(--sv-success)]/15 text-[var(--sv-primary-deep)] flex items-center justify-center mx-auto mb-4 border border-[var(--sv-success)]/30 shadow-sm">
          <CheckCircle2 className="w-7 h-7 text-[var(--sv-primary-deep)]" />
        </div>

        <h2 className="font-heading font-bold text-[24px] sm:text-[28px] text-[var(--sv-text)] tracking-tight">
          Email verified!
        </h2>

        <p className="text-[14px] sm:text-[15px] text-[var(--sv-text-soft)] mt-2 leading-relaxed">
          Your account is ready. Log in to continue.
        </p>

        <div className="mt-6">
          <Link
            href="/login"
            className="w-full h-12 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[16px] hover:brightness-105 transition-all shadow-md flex items-center justify-center"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-2">
      <div className="w-14 h-14 rounded-full bg-[var(--sv-warning)]/15 text-[var(--sv-warning)] flex items-center justify-center mx-auto mb-4 border border-[var(--sv-warning)]/30 shadow-sm">
        <AlertCircle className="w-7 h-7 text-[var(--sv-warning)]" />
      </div>

      <h2 className="font-heading font-bold text-[24px] sm:text-[28px] text-[var(--sv-text)] tracking-tight">
        This link has expired
      </h2>

      <p className="text-[14px] sm:text-[15px] text-[var(--sv-text-soft)] mt-2 leading-relaxed">
        Verification links are valid for 24 hours and can only be used once.
      </p>

      <div className="mt-6">
        <Link
          href="/signup"
          className="w-full h-12 rounded-full border-2 border-[var(--sv-primary-deep)] text-[var(--sv-primary-deep)] font-bold text-[15px] hover:bg-[var(--sv-primary-deep)] hover:text-white transition-all flex items-center justify-center"
        >
          Request a new link
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center p-6 text-[var(--sv-text-soft)]">Checking link...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
