'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { economyClient } from '@/lib/economy/economyClient';
import { journeyClient } from '@/lib/guardian/guardianClient';
import { playSessionClient } from '@/lib/guardian/guardianClient';
import { authClient } from '@/lib/auth/authClient';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeAmbience } from '@/components/ThemeAmbience';
import { HeartButton } from '@/components/HeartButton';
import { SettingsModal } from '@/components/SettingsModal';
import { Settings, Trophy, Map, Star, Coins } from 'lucide-react';

interface Summary {
  totalStars: number;
  totalCoins: number;
  level: number;
  starsIntoLevel: number;
  starsNeededForLevel: number;
  avatarBaseFace: string;
  equippedItems: any[];
}

interface Quest {
  id: string;
  label: string;
  emoji: string;
  rewardStars: number;
  rewardCoins: number;
  completed: boolean;
  orderIndex: number;
}

const WORLDS = [
  { id: 'time', name: 'Time World', emoji: '🕐', description: 'Master clocks & sequences', href: '/worlds/time', color: '#6C63FF', available: true },
  { id: 'feelings', name: 'Feelings World', emoji: '🌋', description: 'Understand emotions', href: '/worlds/feelings', color: '#FF6B6B', available: true },
  { id: 'faces', name: 'Faces World', emoji: '🎭', description: 'Read expressions', href: '/worlds/faces', color: '#FFD166', available: true },
  { id: 'shapes', name: 'Shapes World', emoji: '🔷', description: 'Coming soon…', href: '#', color: '#aaa', available: false },
  { id: 'numbers', name: 'Numbers World', emoji: '🔢', description: 'Coming soon…', href: '#', color: '#aaa', available: false },
  { id: 'sounds', name: 'Sounds World', emoji: '🎵', description: 'Coming soon…', href: '#', color: '#aaa', available: false },
  { id: 'movement', name: 'Movement World', emoji: '🏃', description: 'Coming soon…', href: '#', color: '#aaa', available: false },
  { id: 'words', name: 'Words World', emoji: '📖', description: 'Coming soon…', href: '#', color: '#aaa', available: false },
  { id: 'nature', name: 'Nature World', emoji: '🌿', description: 'Coming soon…', href: '#', color: '#aaa', available: false },
];

export default function HubPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [nickname, setNickname] = useState('Explorer');
  const [theme, setTheme] = useState('space');
  const [showSettings, setShowSettings] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [quietHours, setQuietHours] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [isQuietTime, setIsQuietTime] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sum, childRes, questsRes] = await Promise.all([
        economyClient.getSummary(),
        fetch('http://localhost:4000/api/v1/children/me', { credentials: 'include' }).then((r) => r.json()),
        journeyClient.getQuestsForDate(todayStr),
      ]);
      setSummary(sum);
      if (childRes?.nickname) setNickname(childRes.nickname);
      if (childRes?.preferredTheme) setTheme(childRes.preferredTheme);
      setQuests(Array.isArray(questsRes) ? questsRes : []);

      // Check quiet hours
      const stRes = await fetch('http://localhost:4000/api/v1/screen-time', { credentials: 'include' }).then((r) => r.json()).catch(() => null);
      if (stRes?.settings) {
        setQuietHours({ start: stRes.settings.quietHoursStart, end: stRes.settings.quietHoursEnd });
        if (stRes.settings.quietHoursStart && stRes.settings.quietHoursEnd) {
          const now = new Date();
          const [sh, sm] = stRes.settings.quietHoursStart.split(':').map(Number);
          const [eh, em] = stRes.settings.quietHoursEnd.split(':').map(Number);
          const nowMin = now.getHours() * 60 + now.getMinutes();
          const startMin = sh * 60 + sm;
          const endMin = eh * 60 + em;
          setIsQuietTime(startMin <= endMin ? nowMin >= startMin && nowMin < endMin : nowMin >= startMin || nowMin < endMin);
        }
      }
    } catch {
      // offline / no child yet — stay on defaults
    }
  }, [todayStr]);

  useEffect(() => {
    load();
    // Start play session
    playSessionClient.startSession().then((r) => {
      if (r?.sessionId) {
        setSessionId(r.sessionId);
        // Heartbeat every 5 min
        heartbeatRef.current = setInterval(() => {
          playSessionClient.heartbeat(r.sessionId).catch(() => {});
        }, 5 * 60 * 1000);
      }
    }).catch(() => {});

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [load]);

  const handleLogout = async () => {
    if (sessionId) await playSessionClient.endSession(sessionId).catch(() => {});
    await authClient.logout().catch(() => {});
    router.push('/login');
  };

  if (isQuietTime) {
    return (
      <ThemeProvider forcedTheme={theme}>
        <div className="min-h-screen bg-[var(--sv-bg)] flex flex-col items-center justify-center text-center p-8 gap-6">
          <span className="text-8xl" role="img" aria-label="Moon and stars">🌙</span>
          <h1 className="font-heading font-bold text-3xl text-[var(--sv-text)]">
            It's quiet time until {quietHours.end}.
          </h1>
          <p className="text-[var(--sv-text-soft)] text-lg">Time to rest — you can come back after that!</p>
          {/* Heart button always reachable even during quiet time */}
          <div className="mt-4">
            <HeartButton />
          </div>
        </div>
      </ThemeProvider>
    );
  }

  const progressPct = summary ? Math.round((summary.starsIntoLevel / summary.starsNeededForLevel) * 100) : 0;

  return (
    <ThemeProvider forcedTheme={theme}>
      <ThemeAmbience />
      <div className="min-h-screen bg-[var(--sv-bg)] text-[var(--sv-text)] relative overflow-x-hidden">
        {/* Top Bar */}
        <header className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 pb-2 flex items-center justify-between gap-4">
          {/* Avatar + Greeting */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[var(--sv-card-tint)] text-3xl flex items-center justify-center border-2 border-[var(--sv-primary)]/40 shadow">
              {summary?.avatarBaseFace ?? '😀'}
            </div>
            <div>
              <p className="text-[13px] text-[var(--sv-text-soft)]">Hello,</p>
              <h1 className="font-heading font-bold text-xl text-[var(--sv-text)]">{nickname}! 🚀</h1>
            </div>
          </div>
          {/* Stars & Coins */}
          <div className="flex items-center gap-3 text-sm font-semibold">
            <span className="flex items-center gap-1 bg-[var(--sv-card-tint)] px-3 py-1.5 rounded-full border border-[var(--sv-primary)]/20">
              ⭐ {summary?.totalStars ?? 0}
            </span>
            <span className="flex items-center gap-1 bg-[var(--sv-card-tint)] px-3 py-1.5 rounded-full border border-[var(--sv-primary)]/20">
              🪙 {summary?.totalCoins ?? 0}
            </span>
          </div>
          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full bg-[var(--sv-card-tint)] border border-[var(--sv-primary)]/20 flex items-center justify-center hover:bg-[var(--sv-primary)]/10 transition"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-[var(--sv-text-soft)]" />
          </button>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-8 py-4 space-y-6">
          {/* Level Progress */}
          <section className="bg-white/70 dark:bg-white/5 rounded-2xl p-4 border border-[var(--sv-primary)]/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-heading font-bold text-[var(--sv-primary-deep)]">Level {summary?.level ?? 1} Explorer</span>
              <span className="text-sm text-[var(--sv-text-soft)]">{summary?.starsIntoLevel ?? 0} / {summary?.starsNeededForLevel ?? 50} ⭐</span>
            </div>
            <div className="h-3 bg-[var(--sv-primary)]/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full bg-gradient-to-r from-[var(--sv-primary)] to-[var(--sv-secondary)] rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </section>

          {/* World Map */}
          <section>
            <h2 className="font-heading font-bold text-xl mb-3 flex items-center gap-2">
              <Map className="w-5 h-5 text-[var(--sv-primary-deep)]" /> Skill Worlds
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
              {WORLDS.map((w) => (
                <Link
                  key={w.id}
                  href={w.href}
                  className={`rounded-2xl p-4 text-center border transition-all flex flex-col items-center gap-2 ${
                    w.available
                      ? 'bg-white/80 dark:bg-white/10 border-[var(--sv-primary)]/20 hover:scale-105 hover:shadow-lg cursor-pointer'
                      : 'bg-[var(--sv-card-tint)] border-transparent opacity-50 cursor-default pointer-events-none'
                  }`}
                  aria-disabled={!w.available}
                  tabIndex={w.available ? 0 : -1}
                >
                  <span className="text-3xl" role="img" aria-label={w.name}>{w.emoji}</span>
                  <span className="font-heading font-bold text-sm text-[var(--sv-text)] leading-tight">{w.name}</span>
                  <span className="text-[11px] text-[var(--sv-text-soft)]">{w.description}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Today's Journey Line */}
          <section>
            <h2 className="font-heading font-bold text-xl mb-3 flex items-center gap-2">
              🗺️ Today's Journey
            </h2>
            {quests.length === 0 ? (
              <div className="bg-[var(--sv-card-tint)] rounded-2xl p-6 text-center text-[var(--sv-text-soft)] border border-[var(--sv-primary)]/10">
                <p className="text-2xl mb-2">🌅</p>
                <p className="font-semibold">No quests today yet</p>
                <p className="text-sm mt-1">Ask your guardian to add some adventures!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {quests.map((q, i) => (
                  <div
                    key={q.id}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                      q.completed
                        ? 'bg-[var(--sv-success)]/10 border-[var(--sv-success)]/30 opacity-70'
                        : 'bg-white/80 dark:bg-white/10 border-[var(--sv-primary)]/20'
                    }`}
                  >
                    <span className="text-2xl">{q.emoji}</span>
                    <div className="flex-1">
                      <p className={`font-semibold ${q.completed ? 'line-through text-[var(--sv-text-soft)]' : 'text-[var(--sv-text)]'}`}>
                        {q.label}
                      </p>
                      <p className="text-[12px] text-[var(--sv-text-soft)]">⭐ {q.rewardStars} · 🪙 {q.rewardCoins}</p>
                    </div>
                    {q.completed ? (
                      <span className="text-[var(--sv-success)] font-bold text-xl">✓</span>
                    ) : (
                      <span className="text-[var(--sv-text-soft)] text-sm font-mono">#{i + 1}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick links */}
          <section className="grid grid-cols-3 gap-3">
            <Link href="/wins" className="rounded-2xl p-4 bg-white/80 dark:bg-white/10 border border-[var(--sv-primary)]/20 flex items-center gap-3 hover:scale-105 transition">
              <Trophy className="w-6 h-6 text-[var(--sv-warning)]" />
              <div>
                <p className="font-bold text-sm text-[var(--sv-text)]">Win Gallery</p>
                <p className="text-[11px] text-[var(--sv-text-soft)]">Badges & trophies</p>
              </div>
            </Link>
            <Link href="/shop" className="rounded-2xl p-4 bg-white/80 dark:bg-white/10 border border-[var(--sv-primary)]/20 flex items-center gap-3 hover:scale-105 transition">
              <span className="text-2xl">🛍️</span>
              <div>
                <p className="font-bold text-sm text-[var(--sv-text)]">Avatar Shop</p>
                <p className="text-[11px] text-[var(--sv-text-soft)]">Hats & styles</p>
              </div>
            </Link>
            <Link href="/worlds" className="rounded-2xl p-4 bg-white/80 dark:bg-white/10 border border-[var(--sv-primary)]/20 flex items-center gap-3 hover:scale-105 transition">
              <Map className="w-6 h-6 text-[var(--sv-primary-deep)]" />
              <div>
                <p className="font-bold text-sm text-[var(--sv-text)]">World Atlas</p>
                <p className="text-[11px] text-[var(--sv-text-soft)]">All skill worlds</p>
              </div>
            </Link>
          </section>

          {/* Bottom actions */}
          <div className="flex justify-between items-center pt-2 pb-8">
            <HeartButton />
            <button
              onClick={handleLogout}
              className="text-sm text-[var(--sv-text-soft)] hover:text-[var(--sv-warning)] transition px-4 py-2"
            >
              Log Out
            </button>
          </div>
        </main>

        {showSettings && <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />}
      </div>
    </ThemeProvider>
  );
}
