'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';
import { economyClient } from '@/lib/economy/economyClient';

interface Badge {
  id: string;
  emoji: string;
  displayName: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
}

interface Collectible {
  id: string;
  worldId: string;
  emoji: string;
  displayName: string;
  earned: boolean;
  earnedAt: string | null;
}

interface WinsData {
  nickname: string;
  avatarBaseFace: string;
  totalStars: number;
  totalCoins: number;
  level: number;
  badges: Badge[];
  collectibles: Collectible[];
}

const WORLD_LABELS: Record<string, string> = {
  time: '🕐 Time World',
  feelings: '🌋 Feelings World',
  faces: '🎭 Faces World',
};

export default function WinsPage() {
  const [data, setData] = useState<WinsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'badges' | 'collectibles'>('badges');

  useEffect(() => {
    economyClient.getWins().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--sv-bg)] flex items-center justify-center">
        <div className="text-5xl animate-bounce">🏆</div>
      </div>
    );
  }

  const earnedBadges = data?.badges.filter((b) => b.earned) ?? [];
  const unearnedBadges = data?.badges.filter((b) => !b.earned) ?? [];
  const earnedCollectibles = data?.collectibles.filter((c) => c.earned) ?? [];
  const unearnedCollectibles = data?.collectibles.filter((c) => !c.earned) ?? [];
  const grouped = Object.groupBy?.(earnedCollectibles, (c) => c.worldId) ??
    earnedCollectibles.reduce((acc, c) => { (acc[c.worldId] ??= []).push(c); return acc; }, {} as Record<string, Collectible[]>);

  return (
    <div className="min-h-screen bg-[var(--sv-bg)] text-[var(--sv-text)] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/hub" className="rounded-full p-2 bg-[var(--sv-card-tint)] hover:bg-[var(--sv-primary)]/10 transition" aria-label="Back to Hub">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl">🏆 Win Gallery</h1>
            <p className="text-[var(--sv-text-soft)] text-sm">{data?.nickname}'s achievements</p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex gap-4 flex-wrap">
          <div className="bg-white/80 dark:bg-white/10 rounded-2xl px-5 py-3 border border-[var(--sv-primary)]/20 text-center">
            <p className="text-2xl font-bold text-[var(--sv-primary-deep)]">{data?.level ?? 1}</p>
            <p className="text-[12px] text-[var(--sv-text-soft)]">Level</p>
          </div>
          <div className="bg-white/80 dark:bg-white/10 rounded-2xl px-5 py-3 border border-[var(--sv-primary)]/20 text-center">
            <p className="text-2xl font-bold">⭐ {data?.totalStars ?? 0}</p>
            <p className="text-[12px] text-[var(--sv-text-soft)]">Total Stars</p>
          </div>
          <div className="bg-white/80 dark:bg-white/10 rounded-2xl px-5 py-3 border border-[var(--sv-primary)]/20 text-center">
            <p className="text-2xl font-bold">🪙 {data?.totalCoins ?? 0}</p>
            <p className="text-[12px] text-[var(--sv-text-soft)]">Coins</p>
          </div>
          <div className="bg-white/80 dark:bg-white/10 rounded-2xl px-5 py-3 border border-[var(--sv-primary)]/20 text-center">
            <p className="text-2xl font-bold">🎖️ {earnedBadges.length}</p>
            <p className="text-[12px] text-[var(--sv-text-soft)]">Badges</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-[var(--sv-card-tint)] p-1 rounded-2xl w-fit">
          {(['badges', 'collectibles'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === tab
                  ? 'bg-[var(--sv-primary-deep)] text-white shadow'
                  : 'text-[var(--sv-text-soft)] hover:text-[var(--sv-text)]'
              }`}
            >
              {tab === 'badges' ? '🎖️ Badges' : '✨ Collectibles'}
            </button>
          ))}
        </div>

        {activeTab === 'badges' && (
          <div className="space-y-4">
            {earnedBadges.length > 0 && (
              <div>
                <h2 className="font-heading font-bold text-lg mb-3">Earned ({earnedBadges.length})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {earnedBadges.map((b) => (
                    <div key={b.id} className="bg-white/80 dark:bg-white/10 rounded-2xl p-4 border border-[var(--sv-success)]/30 flex flex-col items-center text-center gap-2">
                      <span className="text-4xl">{b.emoji}</span>
                      <p className="font-bold text-sm text-[var(--sv-text)]">{b.displayName}</p>
                      <p className="text-[11px] text-[var(--sv-text-soft)]">{b.description}</p>
                      {b.earnedAt && <p className="text-[10px] text-[var(--sv-success)]">{new Date(b.earnedAt).toLocaleDateString()}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {unearnedBadges.length > 0 && (
              <div>
                <h2 className="font-heading font-bold text-lg mb-3 text-[var(--sv-text-soft)]">Still to earn ({unearnedBadges.length})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {unearnedBadges.map((b) => (
                    <div key={b.id} className="bg-[var(--sv-card-tint)] rounded-2xl p-4 border border-transparent flex flex-col items-center text-center gap-2 opacity-60">
                      <span className="text-4xl grayscale">{b.emoji}</span>
                      <p className="font-bold text-sm text-[var(--sv-text-soft)]">???</p>
                      <p className="text-[11px] text-[var(--sv-text-soft)]">{b.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'collectibles' && (
          <div className="space-y-6">
            {earnedCollectibles.length === 0 && (
              <div className="bg-[var(--sv-card-tint)] rounded-2xl p-8 text-center">
                <p className="text-3xl mb-2">✨</p>
                <p className="font-semibold text-[var(--sv-text-soft)]">Play mini-games to collect treasures!</p>
              </div>
            )}
            {Object.entries(grouped).map(([worldId, cols]) => (
              <div key={worldId}>
                <h2 className="font-heading font-bold text-lg mb-3">{WORLD_LABELS[worldId] ?? worldId}</h2>
                <div className="flex flex-wrap gap-3">
                  {(cols as Collectible[]).map((c) => (
                    <div key={c.id} className="bg-white/80 dark:bg-white/10 rounded-2xl p-3 border border-[var(--sv-secondary)]/30 flex flex-col items-center text-center gap-1 w-24">
                      <span className="text-3xl">{c.emoji}</span>
                      <p className="text-[11px] font-semibold text-[var(--sv-text)]">{c.displayName}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {unearnedCollectibles.length > 0 && (
              <div>
                <h2 className="font-heading font-bold text-lg mb-3 text-[var(--sv-text-soft)]">Undiscovered</h2>
                <div className="flex flex-wrap gap-3">
                  {unearnedCollectibles.map((c) => (
                    <div key={c.id} className="bg-[var(--sv-card-tint)] rounded-2xl p-3 flex flex-col items-center text-center gap-1 w-24 opacity-40">
                      <span className="text-3xl grayscale">❓</span>
                      <p className="text-[11px] font-semibold text-[var(--sv-text-soft)]">???</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

