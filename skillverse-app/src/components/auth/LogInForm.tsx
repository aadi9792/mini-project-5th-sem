"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertTriangle, Loader2, Check } from "lucide-react";
import { authClient } from "@/lib/auth/authClient";
import { GoogleButton } from "./GoogleButton";
import { LockoutBanner } from "./LockoutBanner";

export function LogInForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState("");
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validate()) return;

    setIsLoading(true);

    try {
      const res = await authClient.login({
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
      });

      // Post-login routing: if child exists, go to continue-as, else onboarding / continue-as
      router.push("/continue-as");
    } catch (err: any) {
      if (err.lockedUntil) {
        setLockedUntil(err.lockedUntil);
      } else {
        setGeneralError(err.message || "Invalid email or password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading font-bold text-[24px] sm:text-[28px] text-[var(--sv-text)] tracking-tight">
          Welcome back
        </h2>
      </div>

      {lockedUntil && (
        <LockoutBanner
          lockedUntil={lockedUntil}
          onUnlock={() => {
            setLockedUntil(null);
            setGeneralError("");
          }}
        />
      )}

      {generalError && !lockedUntil && (
        <div className="bg-[var(--sv-warning)]/15 border border-[var(--sv-warning)]/40 rounded-xl p-3 flex items-start gap-2.5 mb-5 text-[13px] text-[var(--sv-text)]">
          <AlertTriangle className="w-4 h-4 text-[var(--sv-warning)] shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-[13px] font-semibold text-[var(--sv-text)] mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="guardian@example.com"
            disabled={isLoading || !!lockedUntil}
            className={`w-full h-12 px-3.5 rounded-xl border text-[15px] bg-white text-[var(--sv-text)] placeholder:text-[var(--sv-text-soft)]/60 focus:outline-none focus:border-[var(--sv-primary)] focus:ring-3 focus:ring-[var(--sv-primary)]/15 transition-all ${
              errors.email ? "border-[var(--sv-warning)]" : "border-[rgba(107,113,145,0.25)]"
            }`}
          />
          {errors.email && (
            <p className="flex items-center gap-1.5 text-[var(--sv-warning)] text-[13px] mt-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-[13px] font-semibold text-[var(--sv-text)] mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading || !!lockedUntil}
              className={`w-full h-12 pl-3.5 pr-11 rounded-xl border text-[15px] bg-white text-[var(--sv-text)] placeholder:text-[var(--sv-text-soft)]/60 focus:outline-none focus:border-[var(--sv-primary)] focus:ring-3 focus:ring-[var(--sv-primary)]/15 transition-all ${
                errors.password ? "border-[var(--sv-warning)]" : "border-[rgba(107,113,145,0.25)]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sv-text-soft)] hover:text-[var(--sv-text)] p-1 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
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

        {/* Remember Me + Forgot Password Row */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={rememberMe}
              onClick={() => setRememberMe(!rememberMe)}
              disabled={isLoading || !!lockedUntil}
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                rememberMe
                  ? "bg-[var(--sv-primary)] border-[var(--sv-primary)] text-white"
                  : "border-[var(--sv-text-soft)] bg-white hover:border-[var(--sv-primary)]"
              }`}
            >
              {rememberMe && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
            <span className="text-[13px] text-[var(--sv-text)]">Remember me</span>
          </label>

          <Link
            href="/forgot-password"
            className="text-[13px] text-[var(--sv-primary-deep)] hover:underline font-medium"
          >
            Forgot password?
          </Link>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !!lockedUntil}
          className="w-full h-12 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[16px] hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Logging In...</span>
            </div>
          ) : (
            "Log In"
          )}
        </button>

        {/* Divider */}
        <div className="h-px w-full bg-[var(--sv-text-soft)]/15 my-5" />

        {/* Google OAuth Button */}
        <GoogleButton label="Continue with Google" disabled={isLoading || !!lockedUntil} />

        {/* Switch Link */}
        <div className="text-center pt-3">
          <Link
            href="/signup"
            className="text-[14px] text-[var(--sv-primary-deep)] hover:underline font-medium"
          >
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}
