'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import ParentGateModal from '@/components/ParentGateModal';
import { guardianClient } from '@/lib/guardian/guardianClient';
import { useRouter } from 'next/navigation';

export default function ScreenTimePage() {
  const router = useRouter();
  const [showGate, setShowGate] = useState(true);
  const [settings, setSettings] = useState<{ quietHoursStart: string | null; quietHoursEnd: string | null }>({ quietHoursStart: null, quietHoursEnd: null });
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await guardianClient.getScreenTime();
      setSettings(data.settings);
      setTodayMinutes(data.todayMinutes);
      setWeekMinutes(data.weekMinutes);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (!showGate) load(); }, [showGate]);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      await guardianClient.updateScreenTime({
        quietHoursStart: settings.quietHoursStart || null,
        quietHoursEnd: settings.quietHoursEnd || null,
      });
      setSaved(true);
    } catch {}
    setSaving(false);
  };

  if (showGate) {
    return <ParentGateModal intent="view" onSuccess={() => setShowGate(false)} onCancel={() => router.push('/guardian/dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/guardian/dashboard" className="rounded-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 transition" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2"><Clock className="w-6 h-6 text-indigo-600" /> Screen Time</h1>
        </div>

        {loading ? <div className="text-center py-10 text-gray-400">Loading…</div> : (
          <>
            {/* Play-time summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
              <h2 className="font-heading font-bold text-lg mb-3">📊 Play-Time Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-3xl font-bold text-indigo-600">{todayMinutes}</p>
                  <p className="text-sm text-gray-500">minutes today</p>
                </div>
                <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-3xl font-bold text-indigo-600">{weekMinutes}</p>
                  <p className="text-sm text-gray-500">minutes this week</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Read-only. No daily time cap — this is a household gentle-nudge tool, not a hard block.</p>
            </div>

            {/* Quiet hours */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
              <h2 className="font-heading font-bold text-lg">🌙 Quiet Hours</h2>
              <p className="text-sm text-gray-500">During quiet hours, the Hub shows a gentle "rest" screen. The Heart button always stays reachable.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Start time</span>
                  <input
                    type="time"
                    value={settings.quietHoursStart ?? ''}
                    onChange={(e) => setSettings((s) => ({ ...s, quietHoursStart: e.target.value || null }))}
                    className="mt-1 block w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">End time</span>
                  <input
                    type="time"
                    value={settings.quietHoursEnd ?? ''}
                    onChange={(e) => setSettings((s) => ({ ...s, quietHoursEnd: e.target.value || null }))}
                    className="mt-1 block w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 text-sm"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-400">Leave either blank to disable quiet hours.</p>
              <button onClick={handleSave} disabled={saving} className="h-11 px-6 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
              {saved && <p className="text-sm text-green-600 font-semibold" aria-live="polite">✅ Settings saved!</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

