"use client";

import React, { useState, useEffect } from "react";
import { X, Lock, Sparkles, Check, Edit3, ArrowRight, Loader2 } from "lucide-react";
import { companionsClient, CompanionTemplate, ChildCompanion } from "@/lib/companions/companionsClient";

interface CompanionClosetProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanionSwitched: () => void;
  nickname: string;
}

export function CompanionCloset({
  isOpen,
  onClose,
  onCompanionSwitched,
  nickname,
}: CompanionClosetProps) {
  const [catalog, setCatalog] = useState<CompanionTemplate[]>([]);
  const [owned, setOwned] = useState<ChildCompanion[]>([]);
  const [activeCompanion, setActiveCompanion] = useState<ChildCompanion | null>(null);
  const [childLevel, setChildLevel] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  // Switch confirmation state
  const [selectedToSwitch, setSelectedToSwitch] = useState<ChildCompanion | null>(null);
  // Adopt state
  const [selectedToAdopt, setSelectedToAdopt] = useState<CompanionTemplate | null>(null);
  const [adoptName, setAdoptName] = useState("");
  // Rename state
  const [renamingCompanion, setRenamingCompanion] = useState<ChildCompanion | null>(null);
  const [newName, setNewName] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([companionsClient.getCatalog(), companionsClient.getMyCompanions()])
      .then(([catRes, myRes]) => {
        setCatalog(catRes.companions);
        setChildLevel(catRes.childLevel || myRes.childLevel || 1);
        setOwned(myRes.owned);
        setActiveCompanion(myRes.active);
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setErrorMessage("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwitch = async (comp: ChildCompanion) => {
    setIsProcessing(true);
    setErrorMessage("");
    try {
      await companionsClient.activate(comp.id);
      setSelectedToSwitch(null);
      loadData();
      onCompanionSwitched();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to switch companion.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdopt = async () => {
    if (!selectedToAdopt) return;
    setIsProcessing(true);
    setErrorMessage("");
    try {
      await companionsClient.adopt(selectedToAdopt.speciesId, adoptName);
      setSelectedToAdopt(null);
      setAdoptName("");
      loadData();
      onCompanionSwitched();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to adopt companion.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRename = async () => {
    if (!renamingCompanion) return;
    setIsProcessing(true);
    setErrorMessage("");
    try {
      await companionsClient.rename(renamingCompanion.id, newName);
      setRenamingCompanion(null);
      setNewName("");
      loadData();
      onCompanionSwitched();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to rename companion.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-card-enter">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[var(--sv-primary)]/20 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--sv-text-soft)]/15 mb-6">
          <div>
            <h2 className="font-heading font-bold text-2xl text-[var(--sv-text)]">
              Your Companions
            </h2>
            <p className="text-[13px] text-[var(--sv-text-soft)]">
              Level {childLevel} Explorer • Meet and swap your friends anytime
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[var(--sv-card-tint)] flex items-center justify-center text-[var(--sv-text-soft)] hover:text-[var(--sv-text)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--sv-warning)]/15 border border-[var(--sv-warning)]/30 text-[var(--sv-text)] text-[13px]">
            {errorMessage}
          </div>
        )}

        {/* Adopt Modal Overlay */}
        {selectedToAdopt && (
          <div className="bg-[var(--sv-card-tint)] border border-[var(--sv-primary)]/30 rounded-2xl p-5 mb-6 animate-card-enter">
            <h3 className="font-heading font-bold text-lg text-[var(--sv-text)] mb-1">
              Adopt {selectedToAdopt.displayName} {selectedToAdopt.emoji}
            </h3>
            <p className="text-[13px] text-[var(--sv-text-soft)] mb-4">
              What will you call your {selectedToAdopt.displayName.toLowerCase()}?
            </p>
            <input
              type="text"
              value={adoptName}
              onChange={(e) => setAdoptName(e.target.value)}
              placeholder="e.g. Sparky"
              maxLength={15}
              className="w-full h-11 px-4 rounded-xl border border-[var(--sv-text-soft)]/25 bg-white text-[14px] text-[var(--sv-text)] focus:border-[var(--sv-primary)] focus:outline-none mb-3"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setSelectedToAdopt(null)}
                className="px-4 py-2 rounded-full text-[13px] font-semibold text-[var(--sv-text-soft)] hover:text-[var(--sv-text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdopt}
                disabled={isProcessing || !adoptName.trim()}
                className="px-5 py-2 rounded-full bg-[var(--sv-primary-deep)] text-white text-[13px] font-bold shadow-md hover:brightness-105 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? "Adopting..." : "Confirm Name"}
              </button>
            </div>
          </div>
        )}

        {/* Rename Modal Overlay */}
        {renamingCompanion && (
          <div className="bg-[var(--sv-card-tint)] border border-[var(--sv-primary)]/30 rounded-2xl p-5 mb-6 animate-card-enter">
            <h3 className="font-heading font-bold text-lg text-[var(--sv-text)] mb-1">
              Rename {renamingCompanion.customName}
            </h3>
            <p className="text-[13px] text-[var(--sv-text-soft)] mb-4">
              Enter a new name for your companion (2–15 letters):
            </p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New nickname"
              maxLength={15}
              className="w-full h-11 px-4 rounded-xl border border-[var(--sv-text-soft)]/25 bg-white text-[14px] text-[var(--sv-text)] focus:border-[var(--sv-primary)] focus:outline-none mb-3"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setRenamingCompanion(null)}
                className="px-4 py-2 rounded-full text-[13px] font-semibold text-[var(--sv-text-soft)] hover:text-[var(--sv-text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRename}
                disabled={isProcessing || !newName.trim()}
                className="px-5 py-2 rounded-full bg-[var(--sv-primary-deep)] text-white text-[13px] font-bold shadow-md hover:brightness-105 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? "Updating..." : "Save Name"}
              </button>
            </div>
          </div>
        )}

        {/* Switch Confirmation Modal */}
        {selectedToSwitch && (
          <div className="bg-[var(--sv-card-tint)] border border-[var(--sv-primary)]/30 rounded-2xl p-5 mb-6 text-center animate-card-enter">
            <p className="font-heading font-bold text-lg text-[var(--sv-text)]">
              Make {selectedToSwitch.customName} your active companion?
            </p>
            <p className="text-[13px] text-[var(--sv-text-soft)] mt-1 mb-4">
              They will journey with you in the Hub and Skill Worlds.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedToSwitch(null)}
                className="px-5 py-2 rounded-full border border-[var(--sv-text-soft)]/25 text-[13px] font-semibold text-[var(--sv-text)] hover:border-[var(--sv-primary)] cursor-pointer"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => handleSwitch(selectedToSwitch)}
                disabled={isProcessing}
                className="px-6 py-2 rounded-full bg-[var(--sv-primary-deep)] text-white text-[13px] font-bold shadow-md hover:brightness-105 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? "Switching..." : "Yes, switch"}
              </button>
            </div>
          </div>
        )}

        {/* Companions Grid (§3.7) */}
        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--sv-primary)] mx-auto mb-2" />
            <p className="text-[13px] text-[var(--sv-text-soft)]">Opening closet...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {catalog.map((tpl) => {
              const ownedComp = owned.find((o) => o.speciesId === tpl.speciesId);
              const isActive = ownedComp?.isActive ?? false;

              return (
                <div
                  key={tpl.speciesId}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isActive
                      ? "border-2 border-[var(--sv-primary)] bg-[var(--sv-card-tint)] shadow-sm ring-2 ring-[var(--sv-primary)]/20"
                      : tpl.locked
                      ? "border-[var(--sv-text-soft)]/15 bg-gray-50/50 opacity-60"
                      : "border-[var(--sv-text-soft)]/20 bg-white hover:border-[var(--sv-primary)]/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[var(--sv-primary)] to-[var(--sv-secondary)] text-white text-2xl flex items-center justify-center shrink-0 shadow-sm">
                      {tpl.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-heading font-bold text-[15px] text-[var(--sv-text)] truncate">
                          {ownedComp ? ownedComp.customName : tpl.displayName}
                        </h4>
                        {isActive && (
                          <span className="text-[10px] font-bold text-[var(--sv-primary-deep)] bg-[var(--sv-primary)]/15 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                        {!ownedComp && !tpl.locked && (
                          <span className="text-[10px] font-bold text-[var(--sv-success)] bg-[var(--sv-success)]/15 px-2 py-0.5 rounded-full">
                            New!
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[var(--sv-text-soft)] mt-0.5 leading-snug line-clamp-2">
                        {tpl.personalityBlurb}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[var(--sv-text-soft)]/10 flex items-center justify-between text-[12px]">
                    {tpl.locked ? (
                      <div className="flex items-center gap-1 text-[var(--sv-text-soft)]">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Unlocks at Level {tpl.unlockLevel}</span>
                      </div>
                    ) : ownedComp ? (
                      isActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingCompanion(ownedComp);
                            setNewName(ownedComp.customName);
                          }}
                          className="text-[var(--sv-primary-deep)] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Rename</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedToSwitch(ownedComp)}
                          className="text-[var(--sv-primary-deep)] font-semibold hover:underline cursor-pointer"
                        >
                          Switch to {ownedComp.customName}
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedToAdopt(tpl);
                          setAdoptName(tpl.displayName);
                        }}
                        className="text-[var(--sv-primary-deep)] font-bold hover:underline cursor-pointer"
                      >
                        Adopt Friend
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

