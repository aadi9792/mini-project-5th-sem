'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart2, Calendar, Settings, Shield, Download, Trash2, ArrowLeft, RefreshCw, Clock } from 'lucide-react';
import ParentGateModal from '@/components/ParentGateModal';
import { guardianClient } from '@/lib/guardian/guardianClient';

interface MissionReport {
  nickname: string;
  level: number;
  totalStars: number;
  totalCoins: number;
  thisWeek: {
    realLifeQuests: { scheduled: number; completed: number; completedLastWeek: number };
    reminders: { none: number; a_couple: number; a_lot: number };
    gameSessions: { total: number; byWorld: Record<string, number> };
    starsEarned: number;
    coinsEarned: number;
    checkIns: { total: number; byZone: Record<string, number> };
  };
  badges: any[];
  difficultyProfiles: Record<string, string>;
}

const ZONE_LABELS: Record<string, string> = {
  calm: '😌 Calm',
  okay: '🙂 Okay',
  worried: '😟 Worried',
  big_feelings: '🌋 Big Feelings',
};

const GAME_TIER_DISPLAY: Record<string, string> = {
  'launch-challenge': '🕐 Time World',
  'volcano-scale': '🌋 Feelings World',
  'face-detective': '🎭 Faces World',
};

export default function GuardianDashboardPage() {
  const router = useRouter();
  const [showGate, setShowGate] = useState(true);
  const [report, setReport] = useState<MissionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReport = async () => {
    setLoading(true); setError('');
    try {
      const data = await guardianClient.getMissionReport();
      setReport(data);
    } catch {
      setError('Could not load report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showGate) {
    return (
      <ParentGateModal
        intent="view"
        onSuccess={() => { setShowGate(false); loadReport(); }}
        onCancel={() => router.push('/hub')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/hub" className="rounded-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 transition" aria-label="Back to Hub">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl flex items-center gap-2">
                <Shield className="w-7 h-7 text-indigo-600" /> Guardian Dashboard
              </h1>
              {report && <p className="text-sm text-gray-500">{report.nickname}'s progress</p>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={loadReport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold hover:bg-gray-100 transition">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <Link href="/guardian/quests" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">
              <Calendar className="w-4 h-4" /> Quest Control
            </Link>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>}
        {loading && <div className="text-center py-16 text-gray-400">Loading report…</div>}

        {report && !loading && (
          <>
            {/* This Week at a Glance */}
            <section>
              <h2 className="font-heading font-bold text-xl mb-3 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-indigo-600" /> This Week at a Glance</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Quests Completed" value={`${report.thisWeek.realLifeQuests.completed} / ${report.thisWeek.realLifeQuests.scheduled}`} sub={`Last week: ${report.thisWeek.realLifeQuests.completedLastWeek}`} />
                <StatCard label="Game Sessions" value={String(report.thisWeek.gameSessions.total)} sub="Time · Feelings · Faces" />
                <StatCard label="Stars Earned" value={`⭐ ${report.thisWeek.starsEarned}`} sub="This week only" />
                <StatCard label="Coins Earned" value={`🪙 ${report.thisWeek.coinsEarned}`} sub="This week only" />
              </div>
            </section>

            {/* Reminders */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="font-heading font-bold text-lg mb-3">📋 Reminders Needed (Real-Life Quests)</h3>
              <div className="flex gap-4 flex-wrap text-sm">
                <span className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold px-3 py-1.5 rounded-full">🌟 None: {report.thisWeek.reminders.none}</span>
                <span className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 font-semibold px-3 py-1.5 rounded-full">🙂 A couple: {report.thisWeek.reminders.a_couple}</span>
                <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-semibold px-3 py-1.5 rounded-full">💪 A lot: {report.thisWeek.reminders.a_lot}</span>
              </div>
            </section>

            {/* Emotional check-ins */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="font-heading font-bold text-lg mb-1">💙 How {report.nickname} Has Been Feeling</h3>
              <p className="text-sm text-gray-500 mb-3">{report.nickname} checked in {report.thisWeek.checkIns.total} times this week.</p>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(report.thisWeek.checkIns.byZone).map(([zone, count]) => (
                  <div key={zone} className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 text-center">
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-gray-500">{ZONE_LABELS[zone] ?? zone}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Game sessions breakdown */}
            {Object.keys(report.thisWeek.gameSessions.byWorld).length > 0 && (
              <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="font-heading font-bold text-lg mb-3">🎮 Game Sessions by World</h3>
                <div className="space-y-2">
                  {Object.entries(report.thisWeek.gameSessions.byWorld).map(([world, count]) => (
                    <div key={world} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-36">{world}</span>
                      <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (count / (report.thisWeek.gameSessions.total || 1)) * 100)}%` }} />
                      </div>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Difficulty profiles */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="font-heading font-bold text-lg mb-3">🎯 Current Skill Levels</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {(['launch-challenge', 'volcano-scale', 'face-detective'] as const).map((gameId) => (
                  <div key={gameId} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{GAME_TIER_DISPLAY[gameId]}</p>
                    <p className="font-heading font-bold text-lg capitalize text-indigo-600">{report.difficultyProfiles[gameId] ?? 'Not played'}</p>
                    <p className="text-xs text-gray-400">Read-only</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Badges earned */}
            {report.badges.length > 0 && (
              <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="font-heading font-bold text-lg mb-3">🎖️ Badges Earned</h3>
                <div className="flex flex-wrap gap-2">
                  {report.badges.map((b, i) => (
                    <span key={i} className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 font-semibold text-sm px-3 py-1 rounded-full">
                      {b?.emoji} {b?.displayName}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Navigation to other dashboard sections */}
            <section className="grid sm:grid-cols-2 gap-3">
              <Link href="/guardian/quests" className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 transition">
                <Calendar className="w-6 h-6 text-indigo-600" />
                <div><p className="font-bold">Quest Control</p><p className="text-xs text-gray-500">Author today's journey</p></div>
              </Link>
              <Link href="/guardian/screen-time" className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 transition">
                <Clock className="w-6 h-6 text-indigo-600" />
                <div><p className="font-bold">Screen Time</p><p className="text-xs text-gray-500">Quiet hours & play time</p></div>
              </Link>
              <Link href="/guardian/profile" className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 transition">
                <Settings className="w-6 h-6 text-indigo-600" />
                <div><p className="font-bold">Profile & Theme</p><p className="text-xs text-gray-500">Edit {report.nickname}'s settings</p></div>
              </Link>
              <Link href="/guardian/consent" className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 transition">
                <Shield className="w-6 h-6 text-indigo-600" />
                <div><p className="font-bold">Consent Center</p><p className="text-xs text-gray-500">Export or delete account</p></div>
              </Link>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-heading font-bold text-2xl text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

