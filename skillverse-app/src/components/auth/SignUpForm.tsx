"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertTriangle, Loader2 } from "lucide-react";
import { authClient, SignUpData } from "@/lib/auth/authClient";
import { ConsentBlock, ConsentState } from "./ConsentBlock";
import { GoogleButton } from "./GoogleButton";

export function SignUpForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [consent, setConsent] = useState<ConsentState>({
    confirmedGuardianStatus: false,
    dataStorageConsent: false,
    nonMedicalDeviceAck: false,
    marketingOptIn: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password || password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!consent.confirmedGuardianStatus) {
      newErrors.confirmedGuardianStatus = "Guardian confirmation is required.";
    }

    if (!consent.dataStorageConsent) {
      newErrors.dataStorageConsent = "Consent to store profile is required.";
    }

    if (!consent.nonMedicalDeviceAck) {
      newErrors.nonMedicalDeviceAck = "Acknowledgment is required.";
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
      const payload: SignUpData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        confirmedGuardianStatus: consent.confirmedGuardianStatus,
        dataStorageConsent: consent.dataStorageConsent,
        nonMedicalDeviceAck: consent.nonMedicalDeviceAck,
        marketingOptIn: consent.marketingOptIn,
      };

      const res = await authClient.signUp(payload);

      // Store email and any dev token for verify-pending screen display
      if (typeof window !== "undefined") {
        sessionStorage.setItem("sv_pending_verify_email", email.trim().toLowerCase());
        if (res.devVerificationToken) {
          sessionStorage.setItem("sv_dev_token", res.devVerificationToken);
        }
      }

      const tokenParam = res.devVerificationToken ? `&devToken=${encodeURIComponent(res.devVerificationToken)}` : "";
      router.push(`/verify-pending?email=${encodeURIComponent(email.trim().toLowerCase())}${tokenParam}`);
    } catch (err: any) {
      setGeneralError(err.message || "Failed to create account. Please check your inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading font-bold text-[24px] sm:text-[28px] text-[var(--sv-text)] tracking-tight">
          Create your guardian account
        </h2>
        <p className="text-[14px] text-[var(--sv-text-soft)] mt-1.5 leading-normal">
          Skillverse turns everyday challenges into playable adventures for your child.
        </p>
      </div>

      {generalError && (
        <div className="bg-[var(--sv-warning)]/15 border border-[var(--sv-warning)]/40 rounded-xl p-3 flex items-start gap-2.5 mb-5 text-[13px] text-[var(--sv-text)]">
          <AlertTriangle className="w-4 h-4 text-[var(--sv-warning)] shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-[13px] font-semibold text-[var(--sv-text)] mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah Jenkins"
            disabled={isLoading}
            className={`w-full h-12 px-3.5 rounded-xl border text-[15px] bg-white text-[var(--sv-text)] placeholder:text-[var(--sv-text-soft)]/60 focus:outline-none focus:border-[var(--sv-primary)] focus:ring-3 focus:ring-[var(--sv-primary)]/15 transition-all ${
              errors.name ? "border-[var(--sv-warning)]" : "border-[rgba(107,113,145,0.25)]"
            }`}
          />
          {errors.name && (
            <p className="flex items-center gap-1.5 text-[var(--sv-warning)] text-[13px] mt-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

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
            disabled={isLoading}
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
            Password (min 8 characters)
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

        {/* Confirm Password */}
        <div>
          <label className="block text-[13px] font-semibold text-[var(--sv-text)] mb-1.5">
            Confirm Password
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
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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

        {/* Consent Block */}
        <ConsentBlock
          values={consent}
          onChange={(key, val) => setConsent((prev) => ({ ...prev, [key]: val }))}
          errors={errors as any}
        />

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[16px] hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating Account...</span>
            </div>
          ) : (
            "Create Account"
          )}
        </button>

        {/* Divider */}
        <div className="h-px w-full bg-[var(--sv-text-soft)]/15 my-5" />

        {/* Google OAuth Button */}
        <GoogleButton label="Sign up with Google" disabled={isLoading} />

        {/* Switch Link */}
        <div className="text-center pt-3">
          <Link
            href="/login"
            className="text-[14px] text-[var(--sv-primary-deep)] hover:underline font-medium"
          >
            Already have an account? Log in
          </Link>
        </div>
      </form>
    </div>
  );
}
