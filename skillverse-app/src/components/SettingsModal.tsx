"use client";

import React from "react";
import { X, Moon, Sun, Volume2, VolumeX, Eye, Compass, Music, Shield } from "lucide-react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { ThemePicker } from "./ThemePicker";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  childId?: string;
}

export function SettingsModal({ isOpen, onClose, childId }: SettingsModalProps) {
  const {
    isDark,
    toggleDarkMode,
    isCalmMode,
    toggleCalmMode,
    isSoundOn,
    toggleSound,
    isBgmOn,
    toggleBgm,
  } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-card-enter">
      <div className="bg-[var(--sv-card)] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[var(--sv-primary)]/20 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--sv-text-soft)]/15 mb-6">
          <h2 className="font-heading font-bold text-2xl text-[var(--sv-text)]">
            World Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[var(--sv-card-tint)] flex items-center justify-center text-[var(--sv-text-soft)] hover:text-[var(--sv-text)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme System (04 §3.5) */}
        <div className="mb-6">
          <label className="block text-[14px] font-heading font-bold text-[var(--sv-text)] mb-2 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[var(--sv-primary-deep)]" />
            <span>Active Adventure Theme</span>
          </label>
          <ThemePicker childId={childId} />
        </div>

        {/* Toggle Rows */}
        <div className="space-y-4 pt-4 border-t border-[var(--sv-text-soft)]/15">
          {/* Dark Mode Row (04 §3.2a) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--sv-card-tint)] border border-[var(--sv-text-soft)]/15">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white dark:bg-black/20 flex items-center justify-center text-[var(--sv-primary-deep)] shadow-sm">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-heading font-bold text-[14px] text-[var(--sv-text)]">
                  Dark Mode
                </h4>
                <p className="text-[12px] text-[var(--sv-text-soft)] leading-tight">
                  Easier on the eyes in low light.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                isDark ? "bg-[var(--sv-primary)]" : "bg-[var(--sv-text-soft)]/30"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                  isDark ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Calm Mode Row (00 §6.5) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--sv-card-tint)] border border-[var(--sv-text-soft)]/15">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white dark:bg-black/20 flex items-center justify-center text-[var(--sv-primary-deep)] shadow-sm">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-[14px] text-[var(--sv-text)]">
                  Calm Mode
                </h4>
                <p className="text-[12px] text-[var(--sv-text-soft)] leading-tight">
                  Reduces background motion and floating particles.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleCalmMode}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                isCalmMode ? "bg-[var(--sv-primary)]" : "bg-[var(--sv-text-soft)]/30"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                  isCalmMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Sound Chimes Row */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--sv-card-tint)] border border-[var(--sv-text-soft)]/15">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white dark:bg-black/20 flex items-center justify-center text-[var(--sv-primary-deep)] shadow-sm">
                {isSoundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-heading font-bold text-[14px] text-[var(--sv-text)]">
                  Sound Effects
                </h4>
                <p className="text-[12px] text-[var(--sv-text-soft)] leading-tight">
                  Gentle chimes when you win stars and tap buttons.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                isSoundOn ? "bg-[var(--sv-primary)]" : "bg-[var(--sv-text-soft)]/30"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                  isSoundOn ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Background Ambient Music (04 §3.3a) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--sv-card-tint)] border border-[var(--sv-text-soft)]/15">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white dark:bg-black/20 flex items-center justify-center text-[var(--sv-primary-deep)] shadow-sm">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-[14px] text-[var(--sv-text)]">
                  Background Music
                </h4>
                <p className="text-[12px] text-[var(--sv-text-soft)] leading-tight">
                  A soft ambient soundscape for your world.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleBgm}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                isBgmOn ? "bg-[var(--sv-primary)]" : "bg-[var(--sv-text-soft)]/30"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                  isBgmOn ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Guardian Dashboard Link */}
        <div className="pt-4 border-t border-[var(--sv-text-soft)]/15 mt-2">
          <Link
            href="/guardian/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--sv-card-tint)] transition text-left w-full"
          >
            <Shield className="w-5 h-5 text-[var(--sv-primary-deep)]" />
            <div>
              <p className="font-bold text-sm text-[var(--sv-text)]">Switch to Dashboard</p>
              <p className="text-xs text-[var(--sv-text-soft)]">Guardian view — parent controls</p>
            </div>
          </Link>
          <Link
            href="/shop"
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--sv-card-tint)] transition text-left w-full mt-1"
          >
            <span className="text-xl">🛍️</span>
            <div>
              <p className="font-bold text-sm text-[var(--sv-text)]">Avatar Shop</p>
              <p className="text-xs text-[var(--sv-text-soft)]">Spend your coins on cool items</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

