"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth/authClient";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [generalError, setGeneralError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(!token);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password || password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!token) {
      setIsExpired(true);
      return;
    }

    if (!validate()) return;

    setIsLoading(true);

    try {
      await authClient.resetPassword(token, password, confirmPassword);
      setIsSuccess(true);
    } catch (err: any) {
      if (err.message && (err.message.includes("expired") || err.message.includes("invalid"))) {
        setIsExpired(true);
      } else {
        setGeneralError(err.message || "Failed to update password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-full bg-[var(--sv-success)]/15 text-[var(--sv-primary-deep)] flex items-center justify-center mx-auto mb-4 border border-[var(--sv-success)]/30 shadow-sm">
          <CheckCircle2 className="w-7 h-7 text-[var(--sv-primary-deep)]" />
        </div>

        <h2 className="font-heading font-bold text-[24px] sm:text-[28px] text-[var(--sv-text)] tracking-tight">
          Password updated
        </h2>

        <p className="text-[14px] sm:text-[15px] text-[var(--sv-text-soft)] mt-2 leading-relaxed">
          You&apos;ve been logged out of all devices for security. Log in with your new password.
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

  if (isExpired) {
    return (
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-full bg-[var(--sv-warning)]/15 text-[var(--sv-warning)] flex items-center justify-center mx-auto mb-4 border border-[var(--sv-warning)]/30 shadow-sm">
          <AlertCircle className="w-7 h-7 text-[var(--sv-warning)]" />
        </div>

        <h2 className="font-heading font-bold text-[24px] sm:text-[28px] text-[var(--sv-text)] tracking-tight">
          This link has expired
        </h2>

        <p className="text-[14px] sm:text-[15px] text-[var(--sv-text-soft)] mt-2 leading-relaxed">
          Password reset links are valid for 1 hour and can only be used once.
        </p>

        <div className="mt-6">
          <Link
            href="/forgot-password"
            className="w-full h-12 rounded-full border-2 border-[var(--sv-primary-deep)] text-[var(--sv-primary-deep)] font-bold text-[15px] hover:bg-[var(--sv-primary-deep)] hover:text-white transition-all flex items-center justify-center"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading font-bold text-[24px] sm:text-[28px] text-[var(--sv-text)] tracking-tight">
          Choose a new password
        </h2>
      </div>

      {generalError && (
        <div className="bg-[var(--sv-warning)]/15 border border-[var(--sv-warning)]/40 rounded-xl p-3 flex items-start gap-2.5 mb-5 text-[13px] text-[var(--sv-text)]">
          <AlertTriangle className="w-4 h-4 text-[var(--sv-warning)] shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-[var(--sv-text)] mb-1.5">
            New Password (min 8 characters)
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className={`w-full h-12 pl-3.5 pr-11 rounded-xl border text-[15px] bg-white text-[var(--sv-text)] placeholder:text-[var(--sv-text-soft)]/60 focus:outline-none focus:border-[var(--sv-primary)] focus:ring-3 focus:ring-[var(--sv-primary)]/15 transition-all ${
                errors.password ? "border-[var(--sv-warning)]" : "border-[rgba(107,113,145,0.25)]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sv-text-soft)] hover:text-[var(--sv-text)] p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="flex items-center gap-1.5 text-[var(--sv-warning)] text-[13px] mt-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[var(--sv-text)] mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className={`w-full h-12 pl-3.5 pr-11 rounded-xl border text-[15px] bg-white text-[var(--sv-text)] placeholder:text-[var(--sv-text-soft)]/60 focus:outline-none focus:border-[var(--sv-primary)] focus:ring-3 focus:ring-[var(--sv-primary)]/15 transition-all ${
                errors.confirmPassword
                  ? "border-[var(--sv-warning)]"
                  : "border-[rgba(107,113,145,0.25)]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sv-text-soft)] hover:text-[var(--sv-text)] p-1 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="flex items-center gap-1.5 text-[var(--sv-warning)] text-[13px] mt-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{errors.confirmPassword}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[16px] hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Updating Password...</span>
            </div>
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center p-6 text-[var(--sv-text-soft)]">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
