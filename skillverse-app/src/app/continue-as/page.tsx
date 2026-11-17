"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { authClient, UserProfile } from "@/lib/auth/authClient";
import { childrenClient, ChildStateResponse } from "@/lib/children/childrenClient";
import { ArrowRight, LayoutDashboard, LogOut, Loader2 } from "lucide-react";

export default function ContinueAsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [childState, setChildState] = useState<ChildStateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([authClient.getMe().catch(() => null), childrenClient.getMyChild()])
      .then(([userData, childData]) => {
        if (userData?.user) {
          setUser(userData.user);
        }

        if (!childData?.child) {
          // No child profile yet -> Route to Create Child Profile wizard (01 §3.10)
          router.replace("/create-profile");
          return;
        }

        if (!childData.tutorialCompleted) {
          // Child profile exists but Tutorial Island not finished -> Route to Tutorial Island
          router.replace("/handoff");
          return;
        }

        setChildState(childData);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      await authClient.logout();
    } catch {
      // Ignore errors on logout
    }
    router.push("/login");
  };

  if (isLoading) {
    return (
      <AuthCard>
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--sv-primary)] mx-auto mb-3" />
          <p className="text-[14px] text-[var(--sv-text-soft)]">Checking player profiles...</p>
        </div>
      </AuthCard>
    );
  }

  const childName = childState?.child?.nickname || "Hero";
  const initial = childName.charAt(0).toUpperCase();

  return (
    <AuthCard>
      <div className="py-2 text-center">
        <h2 className="font-heading font-bold text-[24px] sm:text-[28px] text-[var(--sv-text)] tracking-tight">
          Who&apos;s playing today?
        </h2>
        <p className="text-[14px] text-[var(--sv-text-soft)] mt-1.5 leading-normal mb-6">
          Welcome back, {user?.name || "Guardian"}. Choose your player profile.
        </p>

        {/* Child Profile Card */}
        <div className="bg-[var(--sv-card-tint)] border border-[var(--sv-secondary)]/20 rounded-2xl p-6 transition-all hover:border-[var(--sv-primary)]/40 shadow-sm flex flex-col items-center">
          {/* Avatar Placeholder: colored circle with first initial */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[var(--sv-primary-deep)] to-[var(--sv-secondary)] text-white font-heading font-bold text-3xl flex items-center justify-center shadow-md mb-4">
            {initial}
          </div>

          <h3 className="font-heading font-bold text-xl text-[var(--sv-text)]">
            {childName}
          </h3>
          <span className="text-[12px] font-medium text-[var(--sv-primary-deep)] bg-[var(--sv-primary)]/15 px-2.5 py-0.5 rounded-full mt-1 mb-5">
            Explorer Profile
          </span>

          {/* Continue as [Child] Button */}
          <button
            type="button"
            onClick={() => {
              router.push("/hub");
            }}
            className="w-full h-12 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-[16px] hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue as {childName}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* View Dashboard Guardian Gate Link (10 §3.1) */}
          <div className="mt-4">
            <Link
              href="/guardian/dashboard"
              className="inline-flex items-center gap-1.5 text-[14px] text-[var(--sv-primary-deep)] font-semibold hover:underline"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>View Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Not you? Log out */}
        <div className="mt-6 pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--sv-text-soft)] hover:text-[var(--sv-warning)] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Not you? Log out</span>
          </button>
        </div>
      </div>
    </AuthCard>
  );
}
